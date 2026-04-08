import Meeting from '../models/meeting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CREATE MEETING ====================
export const CreateMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      meetingLeader,
      meetingDate,
      startTime,
      endTime,
      location,
      meetingType,
      notes
    } = req.body;

    if (!description || !meetingLeader?.name || !meetingLeader?.position) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields: description, meetingLeader.name, meetingLeader.position"
      });
    }

    const meeting = new Meeting({
      title: title || 'Weekly Friday Meeting',
      description,
      meetingLeader: {
        name: meetingLeader.name,
        position: meetingLeader.position,
        department: meetingLeader.department || ''
      },
      meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
      startTime: startTime || '09:00',
      endTime: endTime || '11:00',
      location: location || 'Main Conference Room',
      meetingType: meetingType || 'weekly',
      createdBy: req.user.id,
      notes: notes || '',
      status: 'scheduled'
    });

    const savedMeeting = await meeting.save();
    await savedMeeting.populate('createdBy', 'fullName email role');

    const staffUsers = await User.find({ role: { $in: ['admin', 'receptionist'] } });
    
    if (staffUsers.length > 0) {
      const notifications = staffUsers.map(staff => ({
        recipient: staff._id,
        type: 'meeting_created',
        title: 'New Meeting Scheduled',
        message: `${savedMeeting.title} scheduled for ${new Date(savedMeeting.meetingDate).toLocaleDateString()} at ${savedMeeting.startTime}`,
        relatedMeeting: savedMeeting._id,
        metadata: {
          meetingId: savedMeeting._id,
          meetingTitle: savedMeeting.title,
          meetingDate: savedMeeting.meetingDate,
          location: savedMeeting.location,
          startTime: savedMeeting.startTime
        }
      }));
      
      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} notifications for staff`);
    }

    if (req.io) {
      req.io.emit('meeting-created', {
        meeting: savedMeeting,
        message: `New meeting scheduled: ${savedMeeting.title}`
      });
    }

    res.status(201).json({
      success: true,
      msg: "Meeting created successfully",
      meeting: savedMeeting
    });

  } catch (err) {
    console.error("Error creating meeting:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// ==================== ADD PARTICIPANT TO MEETING ====================
export const AddParticipant = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { fullName, institution, position, signature, email } = req.body;

    if (!fullName || !institution || !position || !signature) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields: fullName, institution, position, signature"
      });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        msg: `Cannot add participants to ${meeting.status} meeting`
      });
    }

    const existingParticipant = meeting.participants.find(p => p.fullName === fullName);
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        msg: `${fullName} has already signed in for this meeting`
      });
    }

    const participant = {
      fullName,
      institution,
      position,
      signature,
      email: email || '',
      signedAt: new Date(),
      attended: true
    };

    meeting.participants.push(participant);
    await meeting.save();

    res.status(201).json({
      success: true,
      msg: `${fullName} signed in successfully`,
      participant: participant,
      totalParticipants: meeting.participants.length
    });

  } catch (err) {
    console.error("Error adding participant:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// ==================== GET ALL MEETINGS ====================
export const GetAllMeetings = async (req, res) => {
  try {
    const { status, meetingType, startDate, endDate, search } = req.query;
    let filter = {};

    if (status && status !== 'all') filter.status = status;
    if (meetingType && meetingType !== 'all') filter.meetingType = meetingType;
    if (startDate && endDate) {
      filter.meetingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { 'meetingLeader.name': { $regex: search, $options: 'i' } }
      ];
    }

    const meetings = await Meeting.find(filter)
      .populate('createdBy', 'fullName email role')
      .sort({ meetingDate: -1, startTime: 1 });

    const meetingsWithStats = meetings.map(meeting => ({
      ...meeting.toObject(),
      participantCount: meeting.participants.length,
      formattedTime: `${meeting.startTime} - ${meeting.endTime}`
    }));

    res.json({
      success: true,
      count: meetings.length,
      meetings: meetingsWithStats
    });

  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== GET MEETING BY ID ====================
export const GetMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('createdBy', 'fullName email role');

    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    res.json({
      success: true,
      meeting: {
        ...meeting.toObject(),
        participantCount: meeting.participants.length,
        formattedTime: `${meeting.startTime} - ${meeting.endTime}`
      }
    });

  } catch (err) {
    console.error("Error fetching meeting:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== UPDATE MEETING STATUS ====================
export const UpdateMeetingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, minutes } = req.body;

    const validStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, msg: "Invalid status" });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    meeting.status = status;
    if (minutes) meeting.minutes = minutes;
    await meeting.save();

    res.json({ success: true, msg: `Meeting status updated to ${status}`, meeting });

  } catch (err) {
    console.error("Error updating meeting status:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== GET ALL PARTICIPANTS FOR A MEETING ====================
export const GetMeetingParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id).select('title meetingDate startTime endTime location participants meetingLeader');
    
    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    res.json({
      success: true,
      meeting: {
        title: meeting.title,
        meetingDate: meeting.meetingDate,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        meetingLeader: meeting.meetingLeader
      },
      totalParticipants: meeting.participants.length,
      participants: meeting.participants
    });

  } catch (err) {
    console.error("Error fetching participants:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== EXPORT MEETING TO CSV ====================
export const ExportMeetingToCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    const csvData = {
      meetingInfo: {
        'Meeting Title': meeting.title,
        'Description': meeting.description,
        'Meeting Date': new Date(meeting.meetingDate).toLocaleDateString(),
        'Time': `${meeting.startTime} - ${meeting.endTime}`,
        'Location': meeting.location,
        'Meeting Leader': meeting.meetingLeader.name,
        'Leader Position': meeting.meetingLeader.position,
        'Total Participants': meeting.participants.length,
        'Status': meeting.status,
        'Exported At': new Date().toLocaleString()
      },
      participants: meeting.participants.map((p, index) => ({
        'No.': index + 1,
        'Full Name': p.fullName,
        'Institution/Department': p.institution,
        'Position': p.position,
        'Email': p.email || 'N/A',
        'Signed At': new Date(p.signedAt).toLocaleString()
      }))
    };

    res.json({ success: true, exportData: csvData, totalParticipants: meeting.participants.length });

  } catch (err) {
    console.error("Error exporting meeting:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== GET UPCOMING MEETINGS ====================
export const GetUpcomingMeetings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetings = await Meeting.find({
      meetingDate: { $gte: today },
      status: { $in: ['scheduled', 'ongoing'] }
    })
    .sort({ meetingDate: 1, startTime: 1 })
    .limit(5);

    res.json({ success: true, count: meetings.length, meetings });

  } catch (err) {
    console.error("Error fetching upcoming meetings:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== GET MEETING STATISTICS ====================
export const GetMeetingStats = async (req, res) => {
  try {
    const totalMeetings = await Meeting.countDocuments();
    const scheduled = await Meeting.countDocuments({ status: 'scheduled' });
    const ongoing = await Meeting.countDocuments({ status: 'ongoing' });
    const completed = await Meeting.countDocuments({ status: 'completed' });
    const cancelled = await Meeting.countDocuments({ status: 'cancelled' });
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    
    const monthlyMeetings = await Meeting.countDocuments({
      meetingDate: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const allMeetings = await Meeting.find();
    const totalParticipants = allMeetings.reduce((sum, meeting) => sum + meeting.participants.length, 0);
    const avgParticipants = totalMeetings > 0 ? (totalParticipants / totalMeetings).toFixed(1) : 0;

    res.json({
      success: true,
      stats: { totalMeetings, scheduled, ongoing, completed, cancelled, monthlyMeetings, totalParticipants, avgParticipants }
    });

  } catch (err) {
    console.error("Error fetching meeting stats:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== EXPORT TO PDF ====================
export const ExportMeetingToPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(24).text(meeting.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date(meeting.meetingDate).toLocaleDateString()}`);
    doc.text(`Time: ${meeting.startTime} - ${meeting.endTime}`);
    doc.text(`Location: ${meeting.location}`);
    doc.text(`Meeting Leader: ${meeting.meetingLeader.name}`);
    doc.moveDown();
    doc.text(`Total Participants: ${meeting.participants.length}`);
    
    doc.end();

  } catch (err) {
    console.error("Error exporting PDF:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== EXPORT TO EXCEL ====================
export const ExportMeetingToExcel = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Meeting Participants');
    
    worksheet.columns = [
      { header: '#', key: 'no', width: 8 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Institution', key: 'institution', width: 30 },
      { header: 'Position', key: 'position', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Signed At', key: 'signedAt', width: 20 }
    ];
    
    meeting.participants.forEach((p, index) => {
      worksheet.addRow({
        no: index + 1,
        fullName: p.fullName,
        institution: p.institution,
        position: p.position,
        email: p.email || 'N/A',
        signedAt: new Date(p.signedAt).toLocaleString()
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error exporting Excel:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== EXPORT TO HTML ====================
export const ExportMeetingToHTML = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ success: false, msg: "Meeting not found" });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${meeting.title} - Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          .meeting-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${meeting.title}</h1>
        <div class="meeting-info">
          <p><strong>Date:</strong> ${new Date(meeting.meetingDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${meeting.startTime} - ${meeting.endTime}</p>
          <p><strong>Location:</strong> ${meeting.location}</p>
          <p><strong>Meeting Leader:</strong> ${meeting.meetingLeader.name} (${meeting.meetingLeader.position})</p>
          <p><strong>Total Participants:</strong> ${meeting.participants.length}</p>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Full Name</th><th>Institution</th><th>Position</th><th>Email</th><th>Signed At</th></tr>
          </thead>
          <tbody>
            ${meeting.participants.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.fullName}</td>
                <td>${p.institution}</td>
                <td>${p.position}</td>
                <td>${p.email || 'N/A'}</td>
                <td>${new Date(p.signedAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}.html`);
    res.send(htmlContent);

  } catch (err) {
    console.error("Error exporting HTML:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== SINGLE EXPORT AT THE END ====================
export {
  CreateMeeting,
  AddParticipant,
  GetAllMeetings,
  GetMeetingById,
  UpdateMeetingStatus,
  GetMeetingParticipants,
  ExportMeetingToCSV,
  GetUpcomingMeetings,
  GetMeetingStats,
  ExportMeetingToPDF,
  ExportMeetingToExcel,
  ExportMeetingToHTML
};