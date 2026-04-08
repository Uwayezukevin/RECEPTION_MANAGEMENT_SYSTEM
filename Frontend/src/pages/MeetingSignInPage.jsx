// src/pages/MeetingSignInPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaUserCheck, FaSignature, FaBuilding, FaUserTie, FaEnvelope } from 'react-icons/fa';
import SignaturePad from '../components/meeting/SignaturePad';
import API from '../service/api';
import toast from 'react-hot-toast';
import logo from '../assets/image.png';

const MeetingSignInPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    position: '',
    email: ''
  });
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await API.get(`/meetings/${meetingId}`);
      setMeeting(response.data.meeting);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast.error('Meeting not found');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.institution || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!signature) {
      toast.error('Please draw your signature');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await API.addMeetingParticipant(meetingId, {
        ...formData,
        signature: signature
      });
      
      if (response.data.success) {
        toast.success(response.data.msg || 'Successfully signed in!');
        // Reset form
        setFormData({ fullName: '', institution: '', position: '', email: '' });
        setSignature(null);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.response?.data?.msg || 'Error signing in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Meeting Not Found</h2>
          <p>The meeting you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Meeting Info Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="text-center mb-4">
            <img src={logo} alt="Logo" className="h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">{meeting.title}</h1>
            <p className="text-white/80 mt-2">{meeting.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-white/90 text-sm">
            <div>
              <p className="font-semibold">📅 Date</p>
              <p>{new Date(meeting.meetingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold">⏰ Time</p>
              <p>{meeting.startTime} - {meeting.endTime}</p>
            </div>
            <div>
              <p className="font-semibold">📍 Location</p>
              <p>{meeting.location}</p>
            </div>
            <div>
              <p className="font-semibold">👨‍💼 Meeting Leader</p>
              <p>{meeting.meetingLeader?.name}</p>
            </div>
          </div>
        </div>

        {/* Sign-in Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FaUserCheck />
              Meeting Sign-In
            </h2>
            <p className="text-white/80 text-sm">Please fill in your details and sign below</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution/Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Your department or institution"
                  required
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Your job position"
                required
              />
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Signature Pad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature <span className="text-red-500">*</span>
              </label>
              <SignaturePad 
                onSave={setSignature}
                onClear={() => setSignature(null)}
                width={500}
                height={150}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-secondary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <FaSignature />
                  Sign In to Meeting
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-white/60 text-xs mt-6">
          Your signature confirms your attendance at this meeting
        </p>
      </div>
    </div>
  );
};

export default MeetingSignInPage;