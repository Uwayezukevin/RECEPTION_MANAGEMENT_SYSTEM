// controllers/requestController.js - No Priority, No Email, with Real-time Updates
import Request from "../models/Request.js";
import Notification from "../models/Notification.js";
import Visitor from "../models/Visitor.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

// Helper function to emit dashboard update
const emitDashboardUpdate = async (io) => {
  if (!io) return;
  try {
    const [totalRequests, pendingRequests] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: "pending" })
    ]);
    
    io.emit('dashboard-update', {
      stats: { totalRequests, pendingRequests },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error emitting dashboard update:', error);
  }
};

export const CreateRequest = async (req, res) => {
  try {
    const { service, eventDate, message } = req.body;
    const visitorId = req.params.visitorId;

    if (!service) {
      return res.status(400).json({
        success: false,
        msg: "Service is required",
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        msg: "Event date is required",
      });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        msg: "Visitor not found. Please complete registration first.",
      });
    }

    if (visitor.status !== "checked-in") {
      return res.status(400).json({
        success: false,
        msg: "You must be checked in to make requests. Please check in first.",
      });
    }

    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({
        success: false,
        msg: "Service not found",
      });
    }

    const existingRequest = await Request.findOne({
      visitor: visitorId,
      service: service,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        msg: "You already have a pending request for this service",
      });
    }

    const newRequest = new Request({
      visitor: visitorId,
      service,
      eventDate: new Date(eventDate),
      message: message || "",
      status: "pending",
    });

    const savedRequest = await newRequest.save();
    await savedRequest.populate("visitor");
    await savedRequest.populate("service");

    const staffUsers = await User.find({ role: { $in: ["receptionist", "admin"] } });

    if (staffUsers.length > 0) {
      const notifications = staffUsers.map((staff) => ({
        recipient: staff._id,
        type: "request_created",
        title: "New Service Request",
        message: `${visitor.fullName} (${visitor.nationality || 'visitor'}) requested ${serviceExists.name}`,
        relatedRequest: savedRequest._id,
        relatedVisitor: visitorId,
        metadata: {
          service: serviceExists.name,
          visitorEmail: visitor.email,
          visitorPhone: visitor.contactValue,
        },
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} notifications for staff`);
    }

    // ==================== REAL-TIME UPDATES ====================
    if (req.io) {
      req.io.emit("new-request", {
        request: savedRequest,
        visitor: visitor,
        message: `New service request from ${visitor.fullName}`
      });
      await emitDashboardUpdate(req.io);
    }

    res.status(201).json({
      success: true,
      msg: "Service request submitted successfully!",
      request: savedRequest,
    });
    
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({
      success: false,
      msg: "Error creating request",
      error: err.message,
    });
  }
};

export const GetAllRequests = async (req, res) => {
  try {
    const { status, startDate, endDate, visitorId } = req.query;
    let filter = {};

    if (status && status !== "all") filter.status = status;
    if (visitorId) filter.visitor = visitorId;

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const requests = await Request.find(filter)
      .populate("visitor")
      .populate("service")
      .populate("approvedBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({
      success: false,
      msg: "Error fetching requests",
      error: err.message,
    });
  }
};

export const GetRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id)
      .populate("visitor")
      .populate("service")
      .populate("approvedBy", "fullName email");

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: "Request not found",
      });
    }

    res.json({
      success: true,
      request,
    });
  } catch (err) {
    console.error("Error fetching request:", err);
    res.status(500).json({
      success: false,
      msg: "Error fetching request",
    });
  }
};

export const UpdateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log("Updating request status:", { id, status, notes });

    if (!status) {
      return res.status(400).json({
        success: false,
        msg: "Status is required",
      });
    }

    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status value",
      });
    }

    const request = await Request.findById(id)
      .populate("visitor")
      .populate("service");

    if (!request) {
      return res.status(404).json({
        success: false,
        msg: "Request not found",
      });
    }

    console.log(
      "Found request:",
      request._id.toString(),
      "Current status:",
      request.status,
    );

    const oldStatus = request.status;

    request.status = status;
    if (notes) request.notes = notes;

    if (status === "approved") {
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
    } else if (status === "completed") {
      request.completedAt = new Date();
    } else if (status === "rejected" && !notes) {
      return res.status(400).json({
        success: false,
        msg: "Please provide a reason for rejection",
      });
    }

    await request.save();
    console.log("Request status updated from", oldStatus, "to", status);

    if (request.service && request.service.name) {
      const staffNotification = new Notification({
        recipient: req.user.id,
        type: `request_${status}`,
        title: `Request ${status.toUpperCase()}`,
        message: `You ${status} request #${request._id.toString().slice(-6)} for ${request.service.name}`,
        relatedRequest: request._id,
        relatedVisitor: request.visitor._id,
      });
      await staffNotification.save();
      console.log("Staff notification created");
    }

    // ==================== REAL-TIME UPDATES ====================
    if (req.io) {
      const updateData = {
        requestId: request._id,
        status: status,
        notes: notes || null,
        updatedAt: new Date(),
        request: {
          _id: request._id,
          status: status,
          notes: notes || request.notes,
          approvedAt: request.approvedAt,
          completedAt: request.completedAt,
          service: request.service,
          eventDate: request.eventDate,
          visitorName: request.visitor?.fullName,
          visitorEmail: request.visitor?.email
        }
      };
      
      // Send to visitors tracking this request
      req.io.to(`request_${request._id}`).emit("request-updated", updateData);
      console.log(`📡 Real-time update sent to request_${request._id} room`);
      
      // Also send to staff
      req.io.to(`user_${req.user.id}`).emit("notification", {
        title: `Request ${status.toUpperCase()}`,
        message: `You ${status} request #${request._id.toString().slice(-6)}`,
        type: `request_${status}`
      });
      
      // Emit dashboard update
      await emitDashboardUpdate(req.io);
    }
    // ==================== END REAL-TIME UPDATE ====================

    res.json({
      success: true,
      msg: `Request ${status} successfully.`,
      request,
    });
    
  } catch (err) {
    console.error("Error updating request status:", err);
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

export const GetDashboardStats = async (req, res) => {
  try {
    const [
      pendingRequests,
      approvedRequests,
      completedRequests,
      rejectedRequests,
      totalRequests,
      checkedInVisitors,
      totalVisitors,
      todayVisitors,
    ] = await Promise.all([
      Request.countDocuments({ status: "pending" }),
      Request.countDocuments({ status: "approved" }),
      Request.countDocuments({ status: "completed" }),
      Request.countDocuments({ status: "rejected" }),
      Request.countDocuments(),
      Visitor.countDocuments({ status: "checked-in" }),
      Visitor.countDocuments(),
      Visitor.countDocuments({
        checkInTime: { $gte: new Date().setHours(0, 0, 0, 0) },
      }),
    ]);

    const [recentRequests, recentVisitors] = await Promise.all([
      Request.find()
        .populate("visitor", "fullName email")
        .populate("service", "name")
        .sort({ createdAt: -1 })
        .limit(10),
      Visitor.find().sort({ createdAt: -1 }).limit(10),
    ]);

    const unreadNotifications = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      stats: {
        requests: {
          pending: pendingRequests,
          approved: approvedRequests,
          completed: completedRequests,
          rejected: rejectedRequests,
          total: totalRequests,
        },
        visitors: {
          checkedIn: checkedInVisitors,
          total: totalVisitors,
          today: todayVisitors,
        },
        recentRequests,
        recentVisitors,
        unreadNotifications,
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

export const GetVisitorRequests = async (req, res) => {
  try {
    const { visitorId } = req.params;

    const requests = await Request.find({ visitor: visitorId })
      .populate("service", "name description")
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (err) {
    console.error("Error fetching visitor requests:", err);
    res.status(500).json({
      success: false,
      msg: "Error fetching requests",
    });
  }
};