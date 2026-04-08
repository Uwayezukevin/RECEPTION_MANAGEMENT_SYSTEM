import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Participant full name is required'],
    trim: true
  },
  institution: {
    type: String,
    required: [true, 'Institution/Department is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  signature: {
    type: String,  // Base64 string of signature
    required: [true, 'Signature is required']
  },
  signedAt: {
    type: Date,
    default: Date.now
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  attended: {
    type: Boolean,
    default: true
  }
});

const meetingSchema = new mongoose.Schema({
  // Meeting basic info
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    default: 'Weekly Friday Meeting'
  },
  
  description: {
    type: String,
    required: [true, 'Meeting description is required'],
    trim: true
  },
  
  // Meeting leader/host
  meetingLeader: {
    name: {
      type: String,
      required: [true, 'Meeting leader name is required']
    },
    position: {
      type: String,
      required: [true, 'Meeting leader position is required']
    },
    department: String
  },
  
  // Meeting schedule
  meetingDate: {
    type: Date,
    required: [true, 'Meeting date is required'],
    default: function() {
      // Default to upcoming Friday
      const date = new Date();
      const day = date.getDay();
      const daysUntilFriday = (5 - day + 7) % 7;
      date.setDate(date.getDate() + daysUntilFriday);
      date.setHours(9, 0, 0, 0); // 9:00 AM default
      return date;
    }
  },
  
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    default: '09:00'
  },
  
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    default: '11:00'
  },
  
  location: {
    type: String,
    required: [true, 'Meeting location is required'],
    trim: true,
    default: 'Main Conference Room'
  },
  
  // Meeting type
  meetingType: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'special', 'emergency'],
    default: 'weekly'
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Participants (employees who attended)
  participants: [participantSchema],
  
  // Meeting minutes/notes
  minutes: {
    type: String,
    trim: true
  },
  
  keyDecisions: [{
    decision: String,
    actionItems: [String],
    responsible: String,
    deadline: Date
  }],
  
  // Created by (admin/receptionist)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  attachments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
meetingSchema.index({ meetingDate: -1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ meetingType: 1 });

// Virtual for participant count
meetingSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for formatted time
meetingSchema.virtual('formattedTime').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Method to check if meeting is ongoing
meetingSchema.methods.isOngoing = function() {
  const now = new Date();
  const meetingStart = new Date(this.meetingDate);
  const [startHour, startMinute] = this.startTime.split(':');
  const [endHour, endMinute] = this.endTime.split(':');
  
  meetingStart.setHours(parseInt(startHour), parseInt(startMinute), 0);
  const meetingEnd = new Date(this.meetingDate);
  meetingEnd.setHours(parseInt(endHour), parseInt(endMinute), 0);
  
  return now >= meetingStart && now <= meetingEnd;
};

// Method to add participant
meetingSchema.methods.addParticipant = function(participantData) {
  // Check if already signed
  const existing = this.participants.find(p => p.fullName === participantData.fullName);
  if (existing) {
    throw new Error('Participant already signed in');
  }
  this.participants.push(participantData);
  return this.save();
};

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;