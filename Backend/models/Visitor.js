// models/Visitor.js - Updated (institution removed)
import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  nationality: {
    type: String,
    enum: ['rwandan', 'foreigner'],
    required: [true, 'Nationality is required']
  },
  contactType: {
    type: String,
    enum: ['Phone', 'Passport'],
    required: [true, 'Contact type is required'],
    default: 'Phone'
  },
  contactValue: {
    type: String,
    required: [true, 'Phone/Passport number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  passportNumber: {
    type: String,
    trim: true,
    sparse: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out'],
    default: 'checked-in'
  },
  visitNumber: {
    type: Number,
    default: 1
  },
  previousVisits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
visitorSchema.index({ email: 1 });
visitorSchema.index({ contactValue: 1 });
visitorSchema.index({ nationality: 1 });
visitorSchema.index({ createdAt: -1 });

const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;