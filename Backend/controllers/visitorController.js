// controllers/visitorController.js - With Combined Visitor + Request Creation & Real-time Updates
import Visitor from '../models/Visitor.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Request from '../models/Request.js';
import Service from '../models/Service.js';

// Helper function to emit dashboard update
const emitDashboardUpdate = async (io) => {
  if (!io) return;
  try {
    const [totalVisitors, todayVisitors, totalRequests, pendingRequests] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({
        checkInTime: { $gte: new Date().setHours(0, 0, 0, 0) }
      }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' })
    ]);
    
    io.emit('dashboard-update', {
      stats: { totalVisitors, todayVisitors, totalRequests, pendingRequests },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error emitting dashboard update:', error);
  }
};

// ==================== COMBINED: CREATE VISITOR WITH SERVICE REQUEST ====================
export const CreateVisitorWithRequest = async (req, res) => {
  try {
    const { 
      fullName, 
      nationality, 
      email,
      phoneNumber,
      passportNumber,
      service,
      eventDate,
      message
    } = req.body;

    console.log("Creating visitor with service request:", { 
      fullName, 
      nationality, 
      email,
      phoneNumber,
      passportNumber,
      service,
      eventDate
    });

    // ==================== VALIDATION ====================
    if (!nationality || !['rwandan', 'foreigner'].includes(nationality)) {
      return res.status(400).json({ 
        success: false,
        msg: "Valid nationality is required (rwandan or foreigner)" 
      });
    }

    if (!email) {
      return res.status(400).json({ 
        success: false,
        msg: "Email is required" 
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        msg: "Please enter a valid email address"
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        msg: "Full name is required"
      });
    }

    if (!service) {
      return res.status(400).json({
        success: false,
        msg: "Service is required"
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        msg: "Event date is required"
      });
    }

    // Prepare visitor data based on nationality
    let visitorData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      nationality,
      status: 'checked-in',
      checkInTime: new Date()
    };

    if (nationality === 'rwandan') {
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          msg: "Phone number is required for Rwandan citizens"
        });
      }
      visitorData.contactType = 'Phone';
      visitorData.contactValue = phoneNumber.trim();
    } else {
      if (passportNumber) {
        visitorData.contactType = 'Passport';
        visitorData.contactValue = passportNumber.trim();
        visitorData.passportNumber = passportNumber.trim();
      } else if (phoneNumber) {
        visitorData.contactType = 'Phone';
        visitorData.contactValue = phoneNumber.trim();
      } else {
        return res.status(400).json({
          success: false,
          msg: "Either Passport Number or Phone Number is required for foreign visitors"
        });
      }
    }

    // Check how many times this visitor has visited before
    const previousVisits = await Visitor.countDocuments({
      $or: [
        { email: visitorData.email },
        { contactValue: visitorData.contactValue }
      ]
    });

    visitorData.visitNumber = previousVisits + 1;
    visitorData.previousVisits = previousVisits;

    // ==================== CREATE VISITOR ====================
    const newVisitor = new Visitor(visitorData);
    const savedVisitor = await newVisitor.save();
    console.log("Visitor saved:", savedVisitor);

    // ==================== CREATE SERVICE REQUEST ====================
    const serviceExists = await Service.findById(service);
    
    if (!serviceExists) {
      return res.status(404).json({
        success: false,
        msg: "Service not found",
        visitor: savedVisitor
      });
    }

    const newRequest = new Request({
      visitor: savedVisitor._id,
      service,
      eventDate: new Date(eventDate),
      message: message || "",
      status: "pending"
    });

    const savedRequest = await newRequest.save();
    await savedRequest.populate("visitor");
    await savedRequest.populate("service");
    console.log("Service request saved:", savedRequest);

    // ==================== CREATE NOTIFICATIONS ====================
    const staffUsers = await User.find({ role: { $in: ['receptionist', 'admin'] } });

    if (staffUsers.length > 0) {
      const notifications = staffUsers.map((staff) => ({
        recipient: staff._id,
        type: "request_created",
        title: "New Service Request",
        message: `${savedVisitor.fullName} (${nationality}) requested ${serviceExists.name}`,
        relatedRequest: savedRequest._id,
        relatedVisitor: savedVisitor._id,
        metadata: {
          service: serviceExists.name,
          visitorEmail: savedVisitor.email,
          visitorPhone: savedVisitor.contactValue,
          nationality
        },
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} notifications for staff`);
    }

    // ==================== REAL-TIME UPDATES ====================
    if (req.io) {
      // Emit new request event
      req.io.emit("new-request", {
        request: savedRequest,
        visitor: savedVisitor,
        message: `New service request from ${savedVisitor.fullName}`
      });
      
      // Emit visitor check-in event
      req.io.emit("visitor-checked-in", {
        visitor: savedVisitor,
        message: `New visitor: ${savedVisitor.fullName} checked in`
      });
      
      // Emit dashboard update
      await emitDashboardUpdate(req.io);
    }

    // ==================== RESPONSE ====================
    const welcomeMessage = previousVisits === 0
      ? `Welcome${nationality === 'rwandan' ? ' back' : ''}! Your registration and service request have been submitted successfully.`
      : `Welcome back${nationality === 'rwandan' ? ' home' : ''}! This is your ${previousVisits + 1}th visit. Your service request has been submitted.`;

    res.status(201).json({
      success: true,
      msg: welcomeMessage,
      visitor: savedVisitor,
      request: savedRequest,
      isReturning: previousVisits > 0,
      visitNumber: previousVisits + 1,
      nationality
    });
    
  } catch (err) {
    console.error("Error creating visitor with request:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

// ==================== ORIGINAL CREATE VISITOR (Keep for compatibility) ====================
export const CreateVisitor = async (req, res) => {
  try {
    const { 
      fullName, 
      contactType, 
      contactValue, 
      email, 
      nationality,
      passportNumber 
    } = req.body;

    console.log("Creating visitor with data:", { 
      fullName, 
      contactType, 
      contactValue, 
      email, 
      nationality,
      passportNumber 
    });

    if (!nationality) {
      return res.status(400).json({ 
        success: false,
        msg: "Nationality is required" 
      });
    }

    if (!email) {
      return res.status(400).json({ 
        success: false,
        msg: "Email is required" 
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        msg: "Please enter a valid email address"
      });
    }

    let visitorData = {
      email: email.toLowerCase().trim(),
      nationality,
      status: 'checked-in',
      checkInTime: new Date()
    };

    if (nationality === 'rwandan') {
      if (!contactValue) {
        return res.status(400).json({
          success: false,
          msg: "Phone number is required for Rwandan citizens"
        });
      }
      
      if (!fullName) {
        return res.status(400).json({
          success: false,
          msg: "Full name is required"
        });
      }
      
      visitorData.fullName = fullName.trim();
      visitorData.contactType = 'Phone';
      visitorData.contactValue = contactValue.trim();
      
    } else {
      if (!fullName) {
        return res.status(400).json({
          success: false,
          msg: "Full name is required for foreign visitors"
        });
      }
      
      visitorData.fullName = fullName.trim();
      
      if (passportNumber) {
        visitorData.contactType = 'Passport';
        visitorData.contactValue = passportNumber.trim();
        visitorData.passportNumber = passportNumber.trim();
      } else if (contactValue) {
        visitorData.contactType = 'Phone';
        visitorData.contactValue = contactValue.trim();
      } else {
        return res.status(400).json({
          success: false,
          msg: "Either Passport Number or Phone Number is required"
        });
      }
    }

    const previousVisits = await Visitor.countDocuments({
      $or: [
        { email: visitorData.email },
        { contactValue: visitorData.contactValue }
      ]
    });

    visitorData.visitNumber = previousVisits + 1;
    visitorData.previousVisits = previousVisits;

    const newVisitor = new Visitor(visitorData);
    const savedVisitor = await newVisitor.save();
    console.log("Visitor saved:", savedVisitor);

    const receptionists = await User.find({ role: { $in: ['receptionist', 'admin'] } });
    
    if (receptionists.length > 0) {
      const visitMessage = previousVisits === 0 
        ? `${savedVisitor.fullName} (${nationality}) is visiting for the first time`
        : `${savedVisitor.fullName} (${nationality}) is visiting for the ${previousVisits + 1}th time`;
      
      const notifications = receptionists.map(staff => ({
        recipient: staff._id,
        type: 'check_in',
        title: previousVisits === 0 ? 'New Visitor' : 'Returning Visitor',
        message: `${visitMessage} - Checked in at ${new Date().toLocaleTimeString()}`,
        relatedVisitor: savedVisitor._id,
        metadata: {
          visitorId: savedVisitor._id,
          nationality,
          contactValue: savedVisitor.contactValue,
          email: savedVisitor.email,
          visitNumber: previousVisits + 1,
          previousVisits
        }
      }));
      
      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications`);
    }

    // Real-time updates
    if (req.io) {
      req.io.emit("visitor-checked-in", {
        visitor: savedVisitor,
        message: `New visitor: ${savedVisitor.fullName} checked in`
      });
      await emitDashboardUpdate(req.io);
    }

    const welcomeMessage = previousVisits === 0
      ? `Welcome! Your registration is complete. You can now request services.`
      : `Welcome back! This is your ${previousVisits + 1}th visit. You can now request services.`;

    res.status(201).json({
      success: true,
      msg: welcomeMessage,
      visitor: savedVisitor,
      isReturning: previousVisits > 0,
      visitNumber: previousVisits + 1,
      nationality
    });
    
  } catch (err) {
    console.error("Error creating visitor:", err);
    res.status(500).json({ 
      success: false,
      name: err.name,
      msg: err.message 
    });
  }
};

// ==================== CHECK OUT VISITOR ====================
export const CheckOutVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ 
        success: false,
        msg: "Visitor record not found" 
      });
    }

    if (visitor.status === 'checked-out') {
      return res.status(400).json({ 
        success: false,
        msg: "This visitor is already checked out" 
      });
    }

    visitor.checkOutTime = new Date();
    visitor.status = 'checked-out';
    await visitor.save();

    const receptionists = await User.find({ role: { $in: ['receptionist', 'admin'] } });
    
    if (receptionists.length > 0) {
      const notifications = receptionists.map(staff => ({
        recipient: staff._id,
        type: 'check_out',
        title: 'Visitor Checked Out',
        message: `${visitor.fullName} (Visit #${visitor.visitNumber}) has checked out at ${new Date().toLocaleTimeString()}`,
        relatedVisitor: visitor._id,
        metadata: {
          visitorId: visitor._id,
          checkOutTime: visitor.checkOutTime,
          visitNumber: visitor.visitNumber
        }
      }));
      
      await Notification.insertMany(notifications);
    }

    // Real-time updates
    if (req.io) {
      await emitDashboardUpdate(req.io);
    }

    res.json({
      success: true,
      msg: "Visitor checked out successfully",
      visitor
    });
  } catch (err) {
    console.error("Error checking out visitor:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

// ==================== OTHER CONTROLLER FUNCTIONS ====================
export const GetVisitors = async (req, res) => {
  try {
    const { status, startDate, endDate, search, limit = 100 } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.checkInTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactValue: { $regex: search, $options: 'i' } }
      ];
    }

    const visitors = await Visitor.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: visitors.length,
      visitors
    });
  } catch (err) {
    console.error("Error fetching visitors:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id).select('-__v');

    if (!visitor) {
      return res.status(404).json({ 
        success: false,
        msg: "Visitor record not found" 
      });
    }

    const visitHistory = await Visitor.find({
      $or: [
        { email: visitor.email },
        { contactValue: visitor.contactValue }
      ]
    }).select('-__v').sort({ createdAt: -1 });

    res.json({
      success: true,
      visitor,
      visitHistory
    });
  } catch (err) {
    console.error("Error fetching visitor:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetVisitorStats = async (req, res) => {
  try {
    const totalVisits = await Visitor.countDocuments();
    const checkedIn = await Visitor.countDocuments({ status: 'checked-in' });
    const checkedOut = await Visitor.countDocuments({ status: 'checked-out' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisits = await Visitor.countDocuments({
      checkInTime: { $gte: today }
    });

    const uniqueVisitors = await Visitor.distinct('email');
    const returningVisitors = await Visitor.countDocuments({ visitNumber: { $gt: 1 } });
    const avgVisits = totalVisits / (uniqueVisitors.length || 1);

    res.json({
      success: true,
      stats: {
        totalVisits,
        checkedIn,
        checkedOut,
        todayVisits,
        uniqueVisitors: uniqueVisitors.length,
        returningVisitors,
        averageVisits: avgVisits.toFixed(1)
      }
    });
  } catch (err) {
    console.error("Error fetching visitor stats:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetVisitorHistory = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const history = await Visitor.find({
      $or: [
        { email: identifier },
        { contactValue: identifier }
      ]
    }).select('-__v').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (err) {
    console.error("Error fetching visitor history:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetCheckedInVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ status: 'checked-in' })
      .select('-__v')
      .sort({ checkInTime: -1 });
    
    res.json({
      success: true,
      count: visitors.length,
      visitors
    });
  } catch (err) {
    console.error("Error fetching checked-in visitors:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const SearchVisitors = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        msg: "Search query is required"
      });
    }
    
    const visitors = await Visitor.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { contactValue: { $regex: query, $options: 'i' } }
      ]
    }).select('-__v').sort({ createdAt: -1 }).limit(50);
    
    res.json({
      success: true,
      count: visitors.length,
      visitors
    });
  } catch (err) {
    console.error("Error searching visitors:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};