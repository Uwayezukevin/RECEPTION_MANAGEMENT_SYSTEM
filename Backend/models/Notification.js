import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['request_created', 'request_approved', 'request_rejected', 'request_completed', 'check_in', 'check_out'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  relatedVisitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;