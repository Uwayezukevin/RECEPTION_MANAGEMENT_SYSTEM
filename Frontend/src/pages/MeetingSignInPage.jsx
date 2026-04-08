// src/pages/MeetingSignInPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaUserCheck, FaSignature, FaBuilding, FaUserTie, FaEnvelope, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';
import SignaturePad from '../components/meeting/SignaturePad';
import API from '../service/api';
import toast from 'react-hot-toast';
import logo from '../assets/image.png';

const MeetingSignInPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    institution: '',
    position: '',
    email: ''
  });
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    if (meetingId) {
      fetchMeetingDetails();
    } else {
      setError('No meeting ID provided');
      setLoading(false);
    }
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching meeting with ID:', meetingId);
      
      // ✅ Use the specific API method
      const response = await API.getMeetingById(meetingId);
      
      console.log('Response:', response.data);
      
      if (response.data.success && response.data.meeting) {
        setMeeting(response.data.meeting);
      } else {
        setError('Meeting not found');
        toast.error('Meeting not found');
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
      let errorMsg = 'Meeting not found or invalid link';
      if (error.response?.data?.msg) {
        errorMsg = error.response.data.msg;
      } else if (error.response?.status === 404) {
        errorMsg = 'Meeting not found';
      } else if (error.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
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
      // ✅ Use the specific API method
      const response = await API.addMeetingParticipant(meetingId, {
        fullName: formData.fullName,
        institution: formData.institution,
        position: formData.position,
        email: formData.email,
        signature: signature
      });
      
      if (response.data.success) {
        toast.success(response.data.msg || 'Successfully signed in!');
        setFormData({ fullName: '', institution: '', position: '', email: '' });
        setSignature(null);
        
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
          <p className="text-white/60 text-sm mt-2">Meeting ID: {meetingId}</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <FaUserCircle className="text-6xl mx-auto mb-4 text-white/50" />
          <h2 className="text-2xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-white/70 mb-6">{error || 'The meeting you\'re looking for doesn\'t exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            Go Home
          </button>
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
            <p className="text-white/80 mt-2 text-sm">{meeting.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-white/90 text-sm">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <FaCalendarAlt className="text-primary-400" />
                Date
              </p>
              <p className="mt-1">{new Date(meeting.meetingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                <FaClock className="text-primary-400" />
                Time
              </p>
              <p className="mt-1">{meeting.startTime} - {meeting.endTime}</p>
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-400" />
                Location
              </p>
              <p className="mt-1">{meeting.location}</p>
            </div>
            <div>
              <p className="font-semibold flex items-center gap-2">
                <FaUserTie className="text-primary-400" />
                Meeting Leader
              </p>
              <p className="mt-1">{meeting.meetingLeader?.name}</p>
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

        <p className="text-center text-white/60 text-xs mt-6">
          Your signature confirms your attendance at this meeting
        </p>
      </div>
    </div>
  );
};

export default MeetingSignInPage;