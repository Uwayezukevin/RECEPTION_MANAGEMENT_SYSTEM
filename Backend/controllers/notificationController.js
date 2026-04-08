// controllers/notificationController.js
import Notification from '../models/Notification.js';

export const GetMyNotifications = async (req, res) => {
  try {
    const { unreadOnly = false, limit = 50, skip = 0 } = req.query;
    let filter = { recipient: req.user.id };
    
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('relatedRequest', 'service status priority')
        .populate('relatedVisitor', 'fullName email institution')
        .populate('relatedMeeting', 'title meetingDate startTime location status'), // ✅ Added meeting population
      Notification.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: notifications.length,
      total,
      notifications
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const MarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        msg: "Notification not found" 
      });
    }

    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        msg: "Access denied" 
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      msg: "Notification marked as read"
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const MarkAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      msg: `${result.modifiedCount} notifications marked as read`,
      count: result.modifiedCount
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    const totalCount = await Notification.countDocuments({
      recipient: req.user.id
    });

    res.json({
      success: true,
      unreadCount,
      totalCount
    });
  } catch (err) {
    console.error("Error getting notification count:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const DeleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        msg: "Notification not found" 
      });
    }

    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        msg: "Access denied" 
      });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      msg: "Notification deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const DeleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id
    });

    res.json({
      success: true,
      msg: `${result.deletedCount} notifications deleted successfully`,
      count: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting all notifications:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const DeleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      isRead: true
    });

    res.json({
      success: true,
      msg: `${result.deletedCount} read notifications deleted successfully`,
      count: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting read notifications:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
      isRead: false
    })
      .sort({ createdAt: -1 })
      .populate('relatedRequest', 'service status')
      .populate('relatedVisitor', 'fullName')
      .populate('relatedMeeting', 'title meetingDate startTime location'); // ✅ Added meeting population

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (err) {
    console.error("Error fetching unread notifications:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};

export const GetNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id)
      .populate('relatedRequest')
      .populate('relatedVisitor')
      .populate('relatedMeeting'); // ✅ Added meeting population

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        msg: "Notification not found" 
      });
    }

    // Check if the notification belongs to the current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        msg: "Access denied" 
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (err) {
    console.error("Error fetching notification:", err);
    res.status(500).json({ 
      success: false,
      msg: err.message 
    });
  }
};