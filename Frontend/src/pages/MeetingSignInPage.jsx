// src/pages/MeetingSignInPage.jsx - Simplified Step-by-Step Version
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaUserCheck, FaSignature, FaBuilding, FaUserTie, FaEnvelope, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserCircle, FaCheckCircle, FaHome, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
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
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1);
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
      
      const response = await API.getMeetingById(meetingId);
      
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

  const validateStep1 = () => {
    if (!formData.fullName || !formData.institution || !formData.position) {
      toast.error('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!signature) {
      toast.error('Please draw your signature');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await API.addMeetingParticipant(meetingId, {
        fullName: formData.fullName,
        institution: formData.institution,
        position: formData.position,
        email: formData.email,
        signature: signature
      });
      
      if (response.data.success) {
        setSuccess({
          name: formData.fullName,
          institution: formData.institution,
          position: formData.position,
          email: formData.email,
          meetingTitle: meeting.title,
          meetingDate: meeting.meetingDate,
          meetingLocation: meeting.location,
          meetingStartTime: meeting.startTime,
          meetingEndTime: meeting.endTime
        });
        
        toast.success(response.data.msg || 'Successfully signed in!');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.response?.data?.msg || 'Error signing in');
      setSubmitting(false);
    }
  };

  // Success Page Component
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-green-600 px-6 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <FaCheckCircle className="text-white text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-white">Successfully Signed In!</h2>
            <p className="text-white/80 mt-1">Thank you for your participation</p>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaUserCheck className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Welcome, {success.name}!</h3>
              <p className="text-gray-500 text-sm mt-1">You have successfully participated in the meeting</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaCalendarAlt className="text-primary-600" />
                Meeting Details
              </h4>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-gray-500">Meeting:</span><span className="font-medium text-gray-700">{success.meetingTitle}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium text-gray-700">{new Date(success.meetingDate).toLocaleDateString()}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Time:</span><span className="font-medium text-gray-700">{success.meetingStartTime} - {success.meetingEndTime}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Location:</span><span className="font-medium text-gray-700">{success.meetingLocation}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Institution:</span><span className="font-medium text-gray-700">{success.institution}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Position:</span><span className="font-medium text-gray-700">{success.position}</span></p>
                {success.email && <p className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-medium text-gray-700">{success.email}</span></p>}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-500 text-xs" /> Your attendance has been recorded</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-500 text-xs" /> Your signature has been saved securely</li>
                <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-500 text-xs" /> You can now proceed to the meeting room</li>
              </ul>
            </div>
            
            <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
              <FaHome /> Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaUserCircle className="text-6xl mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Meeting Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The meeting you\'re looking for doesn\'t exist or has been removed.'}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Meeting Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
          <div className="text-center mb-4">
            <img src={logo} alt="Logo" className="h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800">{meeting.title}</h1>
            <p className="text-gray-500 mt-2 text-sm">{meeting.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
            <div><p className="font-semibold flex items-center gap-2 text-gray-700"><FaCalendarAlt className="text-primary-500" /> Date</p><p className="mt-1">{new Date(meeting.meetingDate).toLocaleDateString()}</p></div>
            <div><p className="font-semibold flex items-center gap-2 text-gray-700"><FaClock className="text-primary-500" /> Time</p><p className="mt-1">{meeting.startTime} - {meeting.endTime}</p></div>
            <div><p className="font-semibold flex items-center gap-2 text-gray-700"><FaMapMarkerAlt className="text-primary-500" /> Location</p><p className="mt-1">{meeting.location}</p></div>
            <div><p className="font-semibold flex items-center gap-2 text-gray-700"><FaUserTie className="text-primary-500" /> Meeting Leader</p><p className="mt-1">{meeting.meetingLeader?.name}</p></div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>1</div>
            <span className="text-sm">Your Details</span>
          </div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>2</div>
            <span className="text-sm">Digital Signature</span>
          </div>
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="bg-primary-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaUserCheck />
                Your Information
              </h2>
              <p className="text-primary-100 text-sm">Please fill in your details below</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" placeholder="Enter your full name" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution/Department <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" name="institution" value={formData.institution} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" placeholder="Your department or institution" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position <span className="text-red-500">*</span></label>
                <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" placeholder="Your job position" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-gray-400 text-xs">(Optional)</span></label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition" placeholder="your@email.com" />
                </div>
              </div>

              <button onClick={handleNext} className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                Next <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Signature */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="bg-primary-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaSignature />
                Digital Signature
              </h2>
              <p className="text-primary-100 text-sm">Draw your signature below</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature <span className="text-red-500">*</span>
                </label>
                <SignaturePad 
                  onSave={setSignature}
                  onClear={() => setSignature(null)}
                  width={500}
                  height={150}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleBack} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2">
                  <FaArrowLeft /> Back
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting ? <><FaSpinner className="animate-spin" /> Signing...</> : <><FaSignature /> Sign In</>}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-6">
          Your signature confirms your attendance at this meeting
        </p>
      </div>
    </div>
  );
};

export default MeetingSignInPage;