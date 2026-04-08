// src/pages/admin/CreateMeeting.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaArrowLeft, FaBell } from 'react-icons/fa';
import API from '../../service/api';
import toast from 'react-hot-toast';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: 'Weekly Friday Meeting',
    description: '',
    meetingLeader: {
      name: '',
      position: '',
      department: ''
    },
    meetingDate: '',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Main Conference Room',
    meetingType: 'weekly'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description) {
      toast.error('Please enter meeting description');
      return;
    }
    if (!formData.meetingLeader.name || !formData.meetingLeader.position) {
      toast.error('Please enter meeting leader details');
      return;
    }
    if (!formData.meetingDate) {
      toast.error('Please select meeting date');
      return;
    }
    
    setLoading(true);

    try {
      const response = await API.createMeeting(formData);
      
      if (response.data.success) {
        toast.success(response.data.msg || 'Meeting created successfully!');
        
        // Show notification about staff being notified
        toast.success(
          (t) => (
            <div className="flex items-center gap-2">
              <FaBell className="text-yellow-400" />
              <span>All staff have been notified about the new meeting</span>
            </div>
          ),
          { duration: 5000 }
        );
        
        // Navigate back to meetings list
        setTimeout(() => {
          navigate('/meetings');
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      toast.error(err.response?.data?.msg || 'Error creating meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/meetings')}
          className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Meetings</span>
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-primary-600 to-secondary-600">
            <h1 className="text-2xl font-bold text-white">Create New Meeting</h1>
            <p className="text-white/80 mt-1">Schedule a new meeting and notify all staff members</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Meeting Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                required
                placeholder="Meeting agenda, topics to discuss, important announcements..."
              />
            </div>

            {/* Meeting Leader */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Meeting Leader Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="meetingLeader.name"
                    value={formData.meetingLeader.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="meetingLeader.position"
                    value={formData.meetingLeader.position}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    required
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="meetingLeader.department"
                  value={formData.meetingLeader.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="e.g., Human Resources, IT, Administration"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="meetingDate"
                  value={formData.meetingDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Location and Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Type
                </label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                >
                  <option value="weekly">Weekly Meeting</option>
                  <option value="monthly">Monthly Meeting</option>
                  <option value="quarterly">Quarterly Meeting</option>
                  <option value="special">Special Meeting</option>
                  <option value="emergency">Emergency Meeting</option>
                </select>
              </div>
            </div>

            {/* Notification Info Box */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <FaBell className="text-blue-500 text-xl mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Staff Notifications</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    All receptionists and admins will receive a notification about this meeting.
                    They will be able to sign in and record their attendance.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/meetings')}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Meeting & Notify Staff'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateMeeting;