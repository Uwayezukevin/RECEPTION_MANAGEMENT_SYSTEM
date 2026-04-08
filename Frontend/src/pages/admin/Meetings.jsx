// src/pages/admin/Meetings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaSpinner, 
  FaUsers, 
  FaClock, 
  FaMapMarkerAlt,
  FaUserTie,
  FaEye,
  FaFileDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaPlayCircle,
  FaLink,
  FaQrcode,
  FaCopy,
  FaPrint
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import API from '../../service/api';
import toast from 'react-hot-toast';

const Meetings = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showQRCode, setShowQRCode] = useState(null);
  const [filter, setFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchMeetings();
    
    // Listen for new meeting notifications via WebSocket
    const socket = API.getSocket();
    if (socket) {
      socket.on('meeting-created', (meeting) => {
        toast.success(`New meeting scheduled: ${meeting.title}`, {
          duration: 5000,
          icon: '📅'
        });
        fetchMeetings();
      });
      
      socket.on('meeting-updated', () => {
        fetchMeetings();
      });
    }
    
    return () => {
      const socket = API.getSocket();
      if (socket) {
        socket.off('meeting-created');
        socket.off('meeting-updated');
      }
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await API.getMeetings();
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const updateMeetingStatus = async (meetingId, status) => {
    try {
      await API.updateMeetingStatus(meetingId, { status });
      toast.success(`Meeting marked as ${status}`);
      fetchMeetings();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update meeting status');
    }
  };

  const viewParticipants = async (meeting) => {
    try {
      const response = await API.getMeetingParticipants(meeting._id);
      setSelectedMeeting({
        ...meeting,
        participants: response.data.participants || [],
        totalParticipants: response.data.totalParticipants || 0
      });
      setShowParticipants(true);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
    }
  };

  const exportMeeting = async (meetingId, format) => {
    setExporting(true);
    try {
      let response;
      switch (format) {
        case 'pdf':
          response = await API.exportMeetingToPDF(meetingId);
          break;
        case 'excel':
          response = await API.exportMeetingToExcel(meetingId);
          break;
        case 'html':
          response = await API.exportMeetingToHTML(meetingId);
          break;
        default:
          return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meeting_export.${format === 'excel' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Meeting exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export meeting');
    } finally {
      setExporting(false);
    }
  };

  const getSignInLink = (meetingId) => {
    return `${window.location.origin}/meeting/signin/${meetingId}`;
  };

  const copySignInLink = (meetingId, meetingTitle) => {
    const link = getSignInLink(meetingId);
    navigator.clipboard.writeText(link);
    toast.success(`Sign-in link for "${meetingTitle}" copied to clipboard!`);
  };

  const printQRCode = (meeting) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${meeting.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
            }
            h2 {
              margin-bottom: 10px;
            }
            p {
              color: #666;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .link {
              font-size: 12px;
              color: #999;
              word-break: break-all;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${meeting.title}</h2>
            <p>Scan QR code to sign in to this meeting</p>
            <div class="qr-code">
              <img src="${QRCodeSVG.toDataURL(getSignInLink(meeting._id))}" />
            </div>
            <div class="link">
              ${getSignInLink(meeting._id)}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.print();
    printWindow.close();
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FaClock, label: 'Scheduled' },
      ongoing: { bg: 'bg-green-100', text: 'text-green-700', icon: FaPlayCircle, label: 'Ongoing' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FaCheckCircle, label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: FaTimesCircle, label: 'Cancelled' }
    };
    const badge = badges[status] || badges.scheduled;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <badge.icon className="text-xs" />
        {badge.label}
      </span>
    );
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filter === 'all') return true;
    return meeting.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Meeting Management</h1>
            <p className="text-white/80 mt-1">Schedule and manage company meetings</p>
          </div>
          <button
            onClick={() => navigate('/meetings/create')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            <FaPlus />
            <span>Schedule Meeting</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {['all', 'scheduled', 'ongoing', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                filter === status
                  ? 'bg-white text-primary-600 font-semibold shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Meetings Grid */}
        {filteredMeetings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
            <FaCalendarAlt className="text-6xl text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Meetings Found</h3>
            <p className="text-white/60 mb-6">No meetings match your current filter</p>
            <button
              onClick={() => navigate('/meetings/create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all"
            >
              <FaPlus />
              <span>Schedule Your First Meeting</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting) => (
              <div key={meeting._id} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 border border-white/20">
                {/* Meeting Header */}
                <div className="p-5 border-b border-white/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{meeting.title}</h3>
                    {getStatusBadge(meeting.status)}
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">{meeting.description}</p>
                </div>
                
                {/* Meeting Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaCalendarAlt className="text-primary-400" />
                    <span>{new Date(meeting.meetingDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaClock className="text-primary-400" />
                    <span>{meeting.startTime} - {meeting.endTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaMapMarkerAlt className="text-primary-400" />
                    <span>{meeting.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaUserTie className="text-primary-400" />
                    <span>{meeting.meetingLeader?.name} ({meeting.meetingLeader?.position})</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <FaUsers className="text-primary-400" />
                    <span>{meeting.participantCount || 0} participants</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="p-4 bg-black/20 flex flex-wrap gap-2">
                  <button
                    onClick={() => viewParticipants(meeting)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
                  >
                    <FaEye />
                    <span>View</span>
                  </button>
                  
                  {/* QR Code Button */}
                  <button
                    onClick={() => setShowQRCode(meeting)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/20 text-indigo-200 rounded-lg hover:bg-indigo-500/30 transition-all text-sm"
                    title="Show QR Code for sign-in"
                  >
                    <FaQrcode />
                    <span>QR</span>
                  </button>
                  
                  {/* Copy Link Button */}
                  <button
                    onClick={() => copySignInLink(meeting._id, meeting.title)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-200 rounded-lg hover:bg-purple-500/30 transition-all text-sm"
                    title="Copy sign-in link"
                  >
                    <FaLink />
                    <span>Link</span>
                  </button>
                  
                  <div className="relative group">
                    <button
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-all text-sm"
                      disabled={exporting}
                    >
                      <FaFileDownload />
                      <span>Export</span>
                    </button>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col gap-1 bg-gray-800 rounded-lg p-2 min-w-[120px] z-10">
                      <button
                        onClick={() => exportMeeting(meeting._id, 'pdf')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => exportMeeting(meeting._id, 'excel')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition"
                      >
                        📊 Excel
                      </button>
                      <button
                        onClick={() => exportMeeting(meeting._id, 'html')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-gray-700 rounded transition"
                      >
                        🌐 HTML
                      </button>
                    </div>
                  </div>
                  
                  {meeting.status !== 'completed' && meeting.status !== 'cancelled' && (
                    <select
                      onChange={(e) => updateMeetingStatus(meeting._id, e.target.value)}
                      value={meeting.status}
                      className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20 focus:outline-none"
                    >
                      <option value="scheduled" className="text-gray-900">Scheduled</option>
                      <option value="ongoing" className="text-gray-900">Ongoing</option>
                      <option value="completed" className="text-gray-900">Completed</option>
                      <option value="cancelled" className="text-gray-900">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQRCode(null)}>
          <div className="bg-white rounded-2xl p-6 text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{showQRCode.title}</h3>
              <p className="text-gray-500 text-sm mt-1">Scan to sign in to this meeting</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl inline-block mx-auto">
              <QRCodeSVG 
                value={`${window.location.origin}/meeting/signin/${showQRCode._id}`} 
                size={200}
                className="mx-auto"
              />
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-gray-400 break-all bg-gray-50 p-2 rounded-lg">
                {`${window.location.origin}/meeting/signin/${showQRCode._id}`}
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => copySignInLink(showQRCode._id, showQRCode.title)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                <FaCopy />
                Copy Link
              </button>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/meeting/signin/${showQRCode._id}`;
                  window.open(link, '_blank');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <FaLink />
                Open Link
              </button>
            </div>
            
            <button
              onClick={() => setShowQRCode(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipants && selectedMeeting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowParticipants(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Meeting Participants</h2>
              <p className="text-white/80 text-sm">{selectedMeeting.title} - {selectedMeeting.totalParticipants} participants</p>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
              {selectedMeeting.participants && selectedMeeting.participants.length > 0 ? (
                <div className="space-y-3">
                  {selectedMeeting.participants.map((participant, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{idx + 1}.</span>
                          <span className="font-medium text-gray-800">{participant.fullName}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {participant.institution} - {participant.position}
                        </div>
                        {participant.email && (
                          <div className="text-xs text-gray-400 mt-1">{participant.email}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Signed: {new Date(participant.signedAt).toLocaleString()}
                        </div>
                      </div>
                      {participant.signature && (
                        <div className="border border-gray-200 rounded-lg p-2 bg-white">
                          <img src={participant.signature} alt="Signature" className="max-w-[120px] max-h-[40px]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaUsers className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No participants have signed in yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Share the QR code or sign-in link with participants
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => copySignInLink(selectedMeeting._id, selectedMeeting.title)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                Copy Sign-in Link
              </button>
              <button
                onClick={() => setShowParticipants(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;