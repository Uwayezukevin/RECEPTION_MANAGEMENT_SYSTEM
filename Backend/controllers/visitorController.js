// controllers/visitorController.js
import Visitor from '../models/Visitor.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const CreateVisitor = async (req, res) => {
  try {
    const { fullName, institution, contactType, contactValue, email } = req.body;

    console.log("Creating visitor with data:", { fullName, institution, contactType, contactValue, email });

    // Validate required fields
    if (!fullName || !institution || !contactType || !contactValue || !email) {
      return res.status(400).json({ 
        success: false,
        msg: "All fields are required" 
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        msg: "Please enter a valid email address"
      });
    }

    // Check how many times this visitor has visited before
    const previousVisits = await Visitor.countDocuments({
      $or: [
        { email: email.toLowerCase().trim() },
        { contactValue: contactValue.trim() }
      ]
    });

    // Create new visitor record
    const newVisitor = new Visitor({
      fullName: fullName.trim(),
      institution: institution.trim(),
      contactType,
      contactValue: contactValue.trim(),
      email: email.toLowerCase().trim(),
      status: 'checked-in',
      checkInTime: new Date(),
      visitNumber: previousVisits + 1,
      previousVisits: previousVisits
    });
    
    const savedVisitor = await newVisitor.save();
    console.log("Visitor saved:", savedVisitor);

    // Create notification for all receptionists (if any exist)
    const receptionists = await User.find({ role: 'receptionist' });
    
    if (receptionists.length > 0) {
      const visitMessage = previousVisits === 0 
        ? `${fullName} from ${institution} is visiting for the first time`
        : `${fullName} from ${institution} is visiting for the ${previousVisits + 1}th time`;
      
      const notifications = receptionists.map(staff => ({
        recipient: staff._id,
        type: 'check_in',
        title: previousVisits === 0 ? 'New Visitor' : 'Returning Visitor',
        message: `${visitMessage} - Checked in at ${new Date().toLocaleTimeString()}`,
        relatedVisitor: savedVisitor._id,
        metadata: {
          visitorId: savedVisitor._id,
          institution,
          contactValue,
          email,
          visitNumber: previousVisits + 1,
          previousVisits
        }
      }));
      
      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications`);
    }

    const welcomeMessage = previousVisits === 0
      ? "Welcome! This is your first visit. You can now request services."
      : `Welcome back! This is your ${previousVisits + 1}th visit. You can now request services.`;

    res.status(201).json({
      success: true,
      msg: welcomeMessage,
      visitor: savedVisitor,
      isReturning: previousVisits > 0,
      visitNumber: previousVisits + 1
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

export const GetVisitors = async (req, res) => {
  try {
    const { status, startDate, endDate, search, limit = 100 } = req.query;
    let filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate && endDate) {
      filter.checkInTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { institution: { $regex: search, $options: 'i' } },
        { contactValue: { $regex: search, $options: 'i' } }
      ];
    }

    const visitors = await Visitor.find(filter)
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
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ 
        success: false,
        msg: "Visitor record not found" 
      });
    }

    // Also get visitor's visit history
    const visitHistory = await Visitor.find({
      $or: [
        { email: visitor.email },
        { contactValue: visitor.contactValue }
      ]
    }).sort({ createdAt: -1 });

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

    // Create notification for receptionists
    const receptionists = await User.find({ role: 'receptionist' });
    
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

    // Get unique visitors count (by email)
    const uniqueVisitors = await Visitor.distinct('email');
    
    // Get returning visitors count (visits > 1)
    const returningVisitors = await Visitor.countDocuments({ visitNumber: { $gt: 1 } });
    
    // Get average visits per visitor
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

// Get visitor history by email or contact
export const GetVisitorHistory = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const history = await Visitor.find({
      $or: [
        { email: identifier },
        { contactValue: identifier }
      ]
    }).sort({ createdAt: -1 });

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

// Get currently checked-in visitors
export const GetCheckedInVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ status: 'checked-in' })
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

// Search visitors
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
        { institution: { $regex: query, $options: 'i' } },
        { contactValue: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    
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