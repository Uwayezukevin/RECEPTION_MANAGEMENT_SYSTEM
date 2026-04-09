import Meeting from '../models/meeting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to emit dashboard update
const emitDashboardUpdate = async (io) => {
  if (!io) return;
  try {
    const [totalMeetings, upcomingMeetings] = await Promise.all([
      Meeting.countDocuments(),
      Meeting.countDocuments({ 
        status: 'scheduled',
        meetingDate: { $gte: new Date() }
      })
    ]);
    
    io.emit('dashboard-update', {
      stats: { totalMeetings, upcomingMeetings },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error emitting dashboard update:', error);
  }
};

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

    // ==================== REAL-TIME UPDATES ====================
    if (req.io) {
      req.io.emit('meeting-created', {
        meeting: savedMeeting,
        message: `New meeting scheduled: ${savedMeeting.title}`
      });
      await emitDashboardUpdate(req.io);
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

    // ==================== REAL-TIME UPDATES ====================
    if (req.io) {
      req.io.to(`meeting_${meetingId}`).emit('participant-added', {
        meetingId: meeting._id,
        participant: participant,
        totalParticipants: meeting.participants.length
      });
      await emitDashboardUpdate(req.io);
    }

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

    // ==================== REAL-TIME UPDATES ====================
    if (req.io) {
      req.io.emit('meeting-updated', {
        meeting: meeting,
        message: `Meeting "${meeting.title}" is now ${status}`
      });
      await emitDashboardUpdate(req.io);
    }

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

// ==================== EXPORT TO PDF WITH SIGNATURES ====================
export const ExportMeetingToPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}_${Date.now()}.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(24).font('Helvetica-Bold').text(meeting.title, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Date: ${new Date(meeting.meetingDate).toLocaleDateString()}`);
    doc.text(`Time: ${meeting.startTime} - ${meeting.endTime}`);
    doc.text(`Location: ${meeting.location}`);
    doc.text(`Meeting Leader: ${meeting.meetingLeader.name} (${meeting.meetingLeader.position})`);
    doc.moveDown();
    doc.text(`Total Participants: ${meeting.participants.length}`);
    doc.moveDown(2);
    
    doc.fontSize(14).font('Helvetica-Bold').text('Participants List', { underline: true });
    doc.moveDown();
    
    let yPos = doc.y;
    
    for (let i = 0; i < meeting.participants.length; i++) {
      const p = meeting.participants[i];
      
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      
      doc.rect(50, yPos - 5, 500, 90).stroke();
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`${i + 1}. ${p.fullName}`, 60, yPos);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Institution: ${p.institution}`, 60, yPos + 15);
      doc.text(`Position: ${p.position}`, 60, yPos + 30);
      if (p.email) doc.text(`Email: ${p.email}`, 60, yPos + 45);
      doc.text(`Signed At: ${new Date(p.signedAt).toLocaleString()}`, 60, yPos + 60);
      
      if (p.signature) {
        try {
          let signatureBase64 = p.signature;
          if (signatureBase64.includes('base64,')) {
            signatureBase64 = signatureBase64.split('base64,')[1];
          }
          const signatureBuffer = Buffer.from(signatureBase64, 'base64');
          doc.image(signatureBuffer, 400, yPos, { width: 100, height: 40 });
          doc.text('Signature:', 400, yPos - 15);
        } catch (err) {
          doc.text('[Signature not available]', 400, yPos + 10);
        }
      } else {
        doc.text('[No signature]', 400, yPos + 10);
      }
      
      yPos += 100;
    }
    
    doc.end();
    
  } catch (err) {
    console.error("Error exporting PDF:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== EXPORT TO EXCEL WITH SIGNATURES ====================
export const ExportMeetingToExcel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    const workbook = new ExcelJS.Workbook();
    
    const infoSheet = workbook.addWorksheet('Meeting Information');
    infoSheet.getColumn('A').width = 25;
    infoSheet.getColumn('B').width = 50;
    
    infoSheet.addRow(['Meeting Title', meeting.title]);
    infoSheet.addRow(['Description', meeting.description]);
    infoSheet.addRow(['Date', new Date(meeting.meetingDate).toLocaleDateString()]);
    infoSheet.addRow(['Time', `${meeting.startTime} - ${meeting.endTime}`]);
    infoSheet.addRow(['Location', meeting.location]);
    infoSheet.addRow(['Meeting Leader', meeting.meetingLeader.name]);
    infoSheet.addRow(['Leader Position', meeting.meetingLeader.position]);
    infoSheet.addRow(['Total Participants', meeting.participants.length]);
    infoSheet.addRow(['Generated On', new Date().toLocaleString()]);
    
    infoSheet.getRow(1).font = { bold: true };
    
    const participantsSheet = workbook.addWorksheet('Participants List');
    participantsSheet.columns = [
      { header: '#', key: 'no', width: 8 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Institution', key: 'institution', width: 30 },
      { header: 'Position', key: 'position', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Signed At', key: 'signedAt', width: 20 }
    ];
    
    participantsSheet.getRow(1).font = { bold: true };
    participantsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' }
    };
    
    meeting.participants.forEach((p, index) => {
      const row = participantsSheet.addRow({
        no: index + 1,
        fullName: p.fullName,
        institution: p.institution,
        position: p.position,
        email: p.email || 'N/A',
        signedAt: new Date(p.signedAt).toLocaleString()
      });
      row.height = 60;
    });
    
    const signaturesSheet = workbook.addWorksheet('Signatures Gallery');
    signaturesSheet.columns = [
      { header: '#', key: 'no', width: 10 },
      { header: 'Participant Name', key: 'name', width: 30 },
      { header: 'Signature', key: 'signature', width: 50 }
    ];
    
    signaturesSheet.getRow(1).font = { bold: true };
    signaturesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF9800' }
    };
    
    for (let i = 0; i < meeting.participants.length; i++) {
      const p = meeting.participants[i];
      const rowNum = i + 2;
      
      signaturesSheet.getCell(`A${rowNum}`).value = i + 1;
      signaturesSheet.getCell(`B${rowNum}`).value = p.fullName;
      
      if (p.signature) {
        try {
          let signatureBase64 = p.signature;
          if (signatureBase64.includes('base64,')) {
            signatureBase64 = signatureBase64.split('base64,')[1];
          }
          
          const signatureBuffer = Buffer.from(signatureBase64, 'base64');
          const imageId = workbook.addImage({
            buffer: signatureBuffer,
            extension: 'png'
          });
          
          signaturesSheet.addImage(imageId, {
            tl: { col: 2, row: rowNum - 1 },
            ext: { width: 200, height: 50 }
          });
          
          signaturesSheet.getRow(rowNum).height = 60;
        } catch (err) {
          signaturesSheet.getCell(`C${rowNum}`).value = '[Signature not available]';
        }
      } else {
        signaturesSheet.getCell(`C${rowNum}`).value = '[No signature]';
      }
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error("Error exporting Excel:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ==================== EXPORT TO HTML WITH SIGNATURES ====================
export const ExportMeetingToHTML = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${meeting.title} - Attendance Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 40px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .info-section { padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .info-card { background: white; padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .info-card h4 { color: #667eea; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; }
        .info-card p { font-size: 14px; font-weight: 500; }
        .stats { padding: 15px 30px; background: white; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
        .badge { background: #4CAF50; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px; }
        .participants { padding: 20px 30px; }
        .participant-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; page-break-inside: avoid; break-inside: avoid; }
        .participant-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #f0f0f0; }
        .participant-name { font-size: 16px; font-weight: bold; color: #333; }
        .participant-number { background: #667eea; color: white; padding: 2px 10px; border-radius: 20px; font-size: 12px; }
        .participant-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px; }
        .detail-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 3px; }
        .detail-value { font-size: 13px; color: #333; font-weight: 500; }
        .signature-box { background: #f9f9f9; padding: 12px; border-radius: 6px; margin-top: 10px; }
        .signature-title { font-size: 11px; color: #666; margin-bottom: 8px; font-weight: bold; }
        .signature-img { max-width: 250px; max-height: 60px; border: 1px solid #ddd; padding: 8px; background: white; border-radius: 4px; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; font-size: 11px; border-top: 1px solid #e0e0e0; }
        @media print { body { background: white; padding: 0; } .participant-card { break-inside: avoid; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>${meeting.title}</h1><p>Meeting Attendance Report with Signatures</p></div>
        <div class="info-section">
          <div class="info-card"><h4>📅 Date</h4><p>${new Date(meeting.meetingDate).toLocaleDateString()}</p></div>
          <div class="info-card"><h4>⏰ Time</h4><p>${meeting.startTime} - ${meeting.endTime}</p></div>
          <div class="info-card"><h4>📍 Location</h4><p>${meeting.location}</p></div>
          <div class="info-card"><h4>👨‍💼 Meeting Leader</h4><p>${meeting.meetingLeader.name} (${meeting.meetingLeader.position})</p></div>
        </div>
        <div class="stats"><h3>📝 Participants List</h3><div class="badge">Total: ${meeting.participants.length}</div></div>
        <div class="participants">
          ${meeting.participants.map((p, index) => `
            <div class="participant-card">
              <div class="participant-header"><span class="participant-name">${p.fullName}</span><span class="participant-number">#${index + 1}</span></div>
              <div class="participant-details">
                <div><div class="detail-label">🏢 Institution</div><div class="detail-value">${p.institution}</div></div>
                <div><div class="detail-label">💼 Position</div><div class="detail-value">${p.position}</div></div>
                ${p.email ? `<div><div class="detail-label">📧 Email</div><div class="detail-value">${p.email}</div></div>` : ''}
                <div><div class="detail-label">⏰ Signed At</div><div class="detail-value">${new Date(p.signedAt).toLocaleString()}</div></div>
              </div>
              <div class="signature-box"><div class="signature-title">✍️ Digital Signature</div>${p.signature ? `<img src="${p.signature}" class="signature-img" alt="${p.fullName}'s signature" />` : '<p>No signature provided</p>'}</div>
            </div>
          `).join('')}
        </div>
        <div class="footer"><p>Generated on ${new Date().toLocaleString()}</p><p>Reception Management System - Official Meeting Report</p></div>
      </div>
    </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}_${Date.now()}.html`);
    res.send(htmlContent);
    
  } catch (err) {
    console.error("Error exporting HTML:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};