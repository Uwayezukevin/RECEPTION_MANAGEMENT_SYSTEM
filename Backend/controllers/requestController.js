// controllers/requestController.js
import Request from "../models/Request.js";
import Notification from "../models/Notification.js";
import Visitor from "../models/Visitor.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";

export const CreateRequest = async (req, res) => {
  try {
    const { service, eventDate, message, priority } = req.body;
    const visitorId = req.params.visitorId;

    // Validate required fields
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

    // Check if visitor exists and is checked in
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

    // Check if service exists
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({
        success: false,
        msg: "Service not found",
      });
    }

    // Check for duplicate pending request
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

    // Create request
    const newRequest = new Request({
      visitor: visitorId,
      service,
      eventDate: new Date(eventDate),
      message: message || "",
      priority: priority || "medium",
      status: "pending",
    });

    const savedRequest = await newRequest.save();

    // Populate for response
    await savedRequest.populate("visitor");
    await savedRequest.populate("service");

    // Create notifications for receptionists
    const staffUsers = await User.find({ role: "receptionist" });
    
    if (staffUsers.length > 0) {
      const notifications = staffUsers.map((staff) => ({
        recipient: staff._id,
        type: "request_created",
        title: "New Service Request",
        message: `${visitor.fullName} from ${visitor.institution} requested ${serviceExists.name}`,
        relatedRequest: savedRequest._id,
        relatedVisitor: visitorId,
        metadata: {
          priority: priority || "medium",
          service: serviceExists.name,
          visitorEmail: visitor.email,
          visitorPhone: visitor.contactValue,
        },
      }));

      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications for staff`);
    }

    // Send confirmation email to visitor
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
          .request-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .status-badge { display: inline-block; background: #f39c12; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Service Request Received</h1>
          </div>
          <div class="content">
            <p>Dear ${visitor.fullName},</p>
            <p>Thank you for submitting your service request. We have received your request and it is now being processed.</p>
            
            <div class="request-details">
              <h3>Request Details:</h3>
              <p><strong>Service:</strong> ${serviceExists.name}</p>
              <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
              <p><strong>Priority:</strong> ${priority || "medium"}</p>
              <p><strong>Status:</strong> <span class="status-badge">PENDING</span></p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
            </div>
            
            <p>You will receive an email notification once your request is reviewed by our staff.</p>
            <p>Thank you for choosing our services!</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Reception Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: visitor.email,
      subject: `Service Request Confirmation - ${serviceExists.name}`,
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      msg: "Service request submitted successfully! You will receive a confirmation email shortly.",
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
    const { status, priority, startDate, endDate, visitorId } = req.query;
    let filter = {};

    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
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

    // Valid status values
    const validStatuses = ["pending", "approved", "rejected", "completed", "cancelled"];
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

    console.log("Found request:", request._id.toString(), "Current status:", request.status);

    // Store old status for comparison
    const oldStatus = request.status;
    
    // Update status
    request.status = status;
    if (notes) request.notes = notes;

    // Handle timestamps based on status
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

    // Create notification for staff who updated (only if service exists)
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

    // Send email notification to visitor (only if visitor email exists)
    if (request.visitor && request.visitor.email) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${status === "approved" ? "#2ecc71" : status === "rejected" ? "#e74c3c" : "#3498db"}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; background: ${status === "approved" ? "#2ecc71" : status === "rejected" ? "#e74c3c" : "#3498db"}; color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; margin: 10px 0; }
            .notes { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Service Request ${status.toUpperCase()}</h1>
            </div>
            <div class="content">
              <p>Dear ${request.visitor.fullName},</p>
              <p>Your service request for <strong>${request.service?.name || "Service"}</strong> has been <strong>${status.toUpperCase()}</strong>.</p>
              
              <div class="status-badge">
                Status: ${status.toUpperCase()}
              </div>
              
              <p><strong>Request Details:</strong></p>
              <ul>
                <li>Service: ${request.service?.name || "N/A"}</li>
                <li>Date: ${new Date(request.eventDate).toLocaleDateString()}</li>
                <li>Priority: ${request.priority}</li>
              </ul>
              
              ${notes ? `
                <div class="notes">
                  <strong>Notes from Staff:</strong><br>
                  ${notes}
                </div>
              ` : ""}
              
              ${status === "approved" ? "<p>Your request has been approved and will be processed soon.</p>" : ""}
              ${status === "rejected" ? "<p>We regret to inform you that your request could not be approved at this time.</p>" : ""}
              ${status === "completed" ? "<p>Your request has been completed. Thank you for using our service!</p>" : ""}
              
              <p>Thank you for choosing our services!</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Reception Management System</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: request.visitor.email,
        subject: `Service Request ${status.toUpperCase()} - ${request.service?.name || "Service"}`,
        html: emailHtml,
      });
      console.log("Email sent to visitor:", request.visitor.email);
    }

    res.json({
      success: true,
      msg: `Request ${status} successfully and email sent to visitor`,
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
        .populate("visitor", "fullName email institution")
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