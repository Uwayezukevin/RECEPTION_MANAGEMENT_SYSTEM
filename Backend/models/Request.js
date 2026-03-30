// models/Request.js - SIMPLE WORKING VERSION
import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  message: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  completedAt: Date,
  notes: String,
}, { 
  timestamps: true 
});

// NO pre-save middleware - simple and clean

const Request = mongoose.model('Request', requestSchema);
export default Request;