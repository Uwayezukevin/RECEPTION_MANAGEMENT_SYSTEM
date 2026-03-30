import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;