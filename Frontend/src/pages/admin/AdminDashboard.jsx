// src/pages/admin/AdminDashboard.jsx - All-in-One Dashboard
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  FaCalendarAlt, 
  FaUserCheck, 
  FaClipboardList,
  FaSpinner,
  FaSignOutAlt,
  FaChartLine,
  FaBell,
  FaCheckCircle,
  FaClock,
  FaWifi,
  FaUsers,
  FaEye,
  FaFilter,
  FaSearch,
  FaTrashAlt,
  FaCheck,
  FaTimes,
  FaCalendarWeek,
  FaUserClock,
  FaFileAlt,
  FaRegCalendarCheck,
  FaQrcode,
  FaDownload,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaIdCard
} from "react-icons/fa";
import { MdAdminPanelSettings, MdPendingActions } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";
import API from "../../service/api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    ongoingMeetings: 0,
    totalVisitors: 0,
    todayVisitors: 0,
    checkedInVisitors: 0,
    totalRequests: 0,
    pendingRequests: 0
  });
  
  // Data tables
  const [meetings, setMeetings] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Filters
  const [visitorFilter, setVisitorFilter] = useState("all");
  const [requestFilter, setRequestFilter] = useState("all");
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showQRCode, setShowQRCode] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAllData();
    setupWebSocket();
    
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 30000);
    
    return () => {
      clearInterval(interval);
      const socket = API.getSocket();
      if (socket) {
        socket.off('dashboard-update');
        socket.off('visitor-checked-in');
        socket.off('new-request');
        socket.off('meeting-created');
      }
    };
  }, []);

  const setupWebSocket = () => {
    const socket = API.initSocket();
    if (socket) {
      socket.on('connect', () => {
        setWsConnected(true);
      });
      socket.on('disconnect', () => {
        setWsConnected(false);
      });
      socket.on('dashboard-update', (data) => {
        if (data.stats) {
          setStats(prev => ({ ...prev, ...data.stats }));
          setLastUpdated(new Date());
        }
      });
      socket.on('visitor-checked-in', () => fetchAllData(true));
      socket.on('new-request', () => fetchAllData(true));
      socket.on('meeting-created', () => fetchAllData(true));
    }
  };

  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch meetings
      const meetingsRes = await API.getMeetings();
      const allMeetings = meetingsRes.data?.meetings || [];
      setMeetings(allMeetings);
      
      // Fetch visitors
      const visitorsRes = await API.getVisitors();
      const allVisitors = visitorsRes.data?.visitors || [];
      setVisitors(allVisitors);
      
      // Fetch requests
      const requestsRes = await API.getAllRequests();
      const allRequests = requestsRes.data?.requests || [];
      setRequests(allRequests);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayVisitors = allVisitors.filter(v => new Date(v.checkInTime) >= today).length;
      const checkedInVisitors = allVisitors.filter(v => v.status === 'checked-in').length;
      const upcomingMeetings = allMeetings.filter(m => m.status === 'scheduled' && new Date(m.meetingDate) >= today).length;
      const ongoingMeetings = allMeetings.filter(m => m.status === 'ongoing').length;
      const pendingRequests = allRequests.filter(r => r.status === 'pending').length;
      
      setStats({
        totalMeetings: allMeetings.length,
        upcomingMeetings,
        ongoingMeetings,
        totalVisitors: allVisitors.length,
        todayVisitors,
        checkedInVisitors,
        totalRequests: allRequests.length,
        pendingRequests
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      if (!silent) toast.error("Failed to load dashboard data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    setUpdating(true);
    try {
      await API.updateRequestStatus(requestId, { status, notes: statusNote });
      toast.success(`Request ${status} successfully`);
      fetchAllData(true);
      setShowUpdateStatus(false);
      setSelectedRequest(null);
      setStatusNote("");
    } catch (error) {
      toast.error("Failed to update request status");
    } finally {
      setUpdating(false);
    }
  };

  const updateMeetingStatus = async (meetingId, status) => {
    try {
      await API.updateMeetingStatus(meetingId, { status });
      toast.success(`Meeting marked as ${status}`);
      fetchAllData(true);
    } catch (error) {
      toast.error("Failed to update meeting status");
    }
  };

  const viewParticipants = async (meeting) => {
    try {
      const response = await API.getMeetingParticipants(meeting._id);
      setSelectedMeeting(meeting);
      setParticipants(response.data.participants || []);
      setShowParticipants(true);
    } catch (error) {
      toast.error("Failed to load participants");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock, label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheck, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimes, label: 'Rejected' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaCheckCircle, label: 'Completed' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaCalendarAlt, label: 'Scheduled' },
      ongoing: { bg: 'bg-green-100', text: 'text-green-800', icon: FaClock, label: 'Ongoing' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimes, label: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <badge.icon className="text-xs" />
        {badge.label}
      </span>
    );
  };

  const getVisitorStatusBadge = (status) => {
    if (status === 'checked-in') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✓ Checked In</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">✓ Checked Out</span>;
  };

  const filteredVisitors = visitors.filter(visitor => {
    if (visitorFilter === 'checked-in' && visitor.status !== 'checked-in') return false;
    if (visitorFilter === 'checked-out' && visitor.status !== 'checked-out') return false;
    if (searchTerm && !visitor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !visitor.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = requests.filter(request => {
    if (requestFilter !== 'all' && request.status !== requestFilter) return false;
    if (searchTerm && !request.service?.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredMeetings = meetings.filter(meeting => {
    if (meetingFilter !== 'all' && meeting.status !== meetingFilter) return false;
    if (searchTerm && !meeting.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/80 mt-1">Welcome back, {user?.fullName}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-green-300' : 'text-red-300'}`}>
                <FaWifi className="text-xs" />
                <span>{wsConnected ? 'Live Updates' : 'Reconnecting...'}</span>
              </div>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-white/40 text-xs">Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          <button onClick={() => fetchAllData(false)} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all">
            <FaChartLine /><span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div><p className="text-white/70 text-sm">Total Meetings</p><p className="text-3xl font-bold text-white mt-1">{stats.totalMeetings}</p><p className="text-white/50 text-xs mt-1">{stats.upcomingMeetings} upcoming, {stats.ongoingMeetings} ongoing</p></div>
              <div className="bg-yellow-500 p-3 rounded-full"><FaCalendarAlt className="text-white text-xl" /></div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div><p className="text-white/70 text-sm">Total Visitors</p><p className="text-3xl font-bold text-white mt-1">{stats.totalVisitors}</p><p className="text-white/50 text-xs mt-1">{stats.todayVisitors} today, {stats.checkedInVisitors} checked in</p></div>
              <div className="bg-indigo-500 p-3 rounded-full"><FaUserCheck className="text-white text-xl" /></div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div><p className="text-white/70 text-sm">Service Requests</p><p className="text-3xl font-bold text-white mt-1">{stats.totalRequests}</p><p className="text-white/50 text-xs mt-1">{stats.pendingRequests} pending</p></div>
              <div className="bg-pink-500 p-3 rounded-full"><FaClipboardList className="text-white text-xl" /></div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div><p className="text-white/70 text-sm">System Status</p><p className="text-3xl font-bold text-white mt-1">{wsConnected ? 'Online' : 'Offline'}</p><p className="text-white/50 text-xs mt-1">Real-time active</p></div>
              <div className="bg-green-500 p-3 rounded-full"><FaCheckCircle className="text-white text-xl" /></div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search meetings, visitors, or requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md text-white placeholder-white/50 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30" />
          </div>
        </div>

        {/* Meetings Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><FaCalendarAlt className="text-yellow-400" /> Meetings</h2>
            <div className="flex gap-2"><FaFilter className="text-white/60 mt-1" /><select value={meetingFilter} onChange={(e) => setMeetingFilter(e.target.value)} className="bg-white/10 text-white rounded-lg px-3 py-1 text-sm border border-white/20"><option value="all">All</option><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20"><tr><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Title</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Time</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Location</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Leader</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Participants</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting._id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white">{meeting.title}</td>
                    <td className="px-6 py-4 text-white/80">{new Date(meeting.meetingDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-white/80">{meeting.startTime} - {meeting.endTime}</td>
                    <td className="px-6 py-4 text-white/80">{meeting.location}</td>
                    <td className="px-6 py-4 text-white/80">{meeting.meetingLeader?.name}</td>
                    <td className="px-6 py-4 text-white/80">{meeting.participantCount || 0}</td>
                    <td className="px-6 py-4">{getStatusBadge(meeting.status)}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => setShowQRCode(meeting)} className="p-1.5 bg-indigo-500/20 text-indigo-200 rounded hover:bg-indigo-500/30" title="QR Code"><FaQrcode /></button>
                      <button onClick={() => viewParticipants(meeting)} className="p-1.5 bg-blue-500/20 text-blue-200 rounded hover:bg-blue-500/30" title="View Participants"><FaEye /></button>
                      <select onChange={(e) => updateMeetingStatus(meeting._id, e.target.value)} value={meeting.status} className="bg-white/10 text-white rounded text-sm px-2 py-1 border border-white/20"><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                    </td>
                  </tr>
                ))}
                {filteredMeetings.length === 0 && <tr><td colSpan="8" className="px-6 py-8 text-center text-white/50">No meetings found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visitors Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><FaUserCheck className="text-green-400" /> Visitors</h2>
            <div className="flex gap-2"><FaFilter className="text-white/60 mt-1" /><select value={visitorFilter} onChange={(e) => setVisitorFilter(e.target.value)} className="bg-white/10 text-white rounded-lg px-3 py-1 text-sm border border-white/20"><option value="all">All</option><option value="checked-in">Checked In</option><option value="checked-out">Checked Out</option></select></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20"><tr><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Phone</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Nationality</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Check In</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Status</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor._id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white">{visitor.fullName}</td>
                    <td className="px-6 py-4 text-white/80">{visitor.email}</td>
                    <td className="px-6 py-4 text-white/80">{visitor.contactValue || '-'}</td>
                    <td className="px-6 py-4 text-white/80 capitalize">{visitor.nationality}</td>
                    <td className="px-6 py-4 text-white/80">{new Date(visitor.checkInTime).toLocaleString()}</td>
                    <td className="px-6 py-4">{getVisitorStatusBadge(visitor.status)}</td>
                  </tr>
                ))}
                {filteredVisitors.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-white/50">No visitors found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requests Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><FaClipboardList className="text-pink-400" /> Service Requests</h2>
            <div className="flex gap-2"><FaFilter className="text-white/60 mt-1" /><select value={requestFilter} onChange={(e) => setRequestFilter(e.target.value)} className="bg-white/10 text-white rounded-lg px-3 py-1 text-sm border border-white/20"><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/20"><tr><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Service</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Visitor</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Event Date</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Message</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase">Actions</th></tr></thead>
              <tbody className="divide-y divide-white/10">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white">{request.service?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-white/80">{request.visitor?.fullName || 'N/A'}</td>
                    <td className="px-6 py-4 text-white/80">{new Date(request.eventDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-white/80 max-w-xs truncate">{request.message || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4">
                      {request.status === 'pending' && (
                        <button onClick={() => { setSelectedRequest(request); setShowUpdateStatus(true); }} className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded text-sm hover:bg-blue-500/30">Update Status</button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-white/50">No requests found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 flex justify-center">
          <button onClick={() => { logout(); navigate("/login"); toast.success("Logged out successfully"); }} className="inline-flex items-center gap-2 px-6 py-2 bg-red-500/20 backdrop-blur-md text-white rounded-lg hover:bg-red-500/30 transition-all"> <FaSignOutAlt /> Logout </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQRCode(null)}>
          <div className="bg-white rounded-2xl p-6 text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">{showQRCode.title}</h3>
            <p className="text-gray-500 text-sm mb-4">Scan to sign in to this meeting</p>
            <QRCodeSVG value={`${window.location.origin}/meeting/signin/${showQRCode._id}`} size={200} className="mx-auto mb-4" />
            <button onClick={() => setShowQRCode(null)} className="mt-2 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Close</button>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipants && selectedMeeting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowParticipants(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 flex justify-between items-center"><div><h2 className="text-xl font-bold text-white">Participants</h2><p className="text-white/80 text-sm">{selectedMeeting.title}</p></div><button onClick={() => setShowParticipants(false)} className="text-white/80 hover:text-white text-2xl">&times;</button></div>
            <div className="overflow-y-auto p-6 max-h-[60vh]">
              {participants.length > 0 ? participants.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100"><div><p className="font-medium">{idx+1}. {p.fullName}</p><p className="text-sm text-gray-500">{p.institution} - {p.position}</p><p className="text-xs text-gray-400">{new Date(p.signedAt).toLocaleString()}</p></div>{p.signature && <img src={p.signature} alt="signature" className="max-w-[100px] max-h-[40px]" />}</div>
              )) : <p className="text-center text-gray-500 py-8">No participants yet</p>}
            </div>
            <div className="border-t p-4 flex justify-end"><button onClick={() => setShowParticipants(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Close</button></div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateStatus && selectedRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowUpdateStatus(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4"><h2 className="text-xl font-bold text-white">Update Request Status</h2><p className="text-white/80 text-sm">{selectedRequest.service?.name}</p></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2">New Status</label><select onChange={(e) => setStatusNote(e.target.value === 'rejected' ? statusNote : '')} className="w-full p-2 border rounded-lg"><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Notes (Required for rejection)</label><textarea rows="3" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Add notes..."/></div>
              <div className="flex gap-3"><button onClick={() => setShowUpdateStatus(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancel</button><button onClick={() => updateRequestStatus(selectedRequest._id, statusNote ? 'rejected' : 'approved')} disabled={updating} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{updating ? 'Updating...' : 'Update'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;