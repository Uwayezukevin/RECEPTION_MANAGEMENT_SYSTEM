// src/pages/admin/AdminDashboard.jsx - Complete with Create Meeting & Export
import React, { useState, useEffect } from "react";
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
  FaCheck,
  FaTimes,
  FaCalendarWeek,
  FaUserClock,
  FaFileAlt,
  FaQrcode,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaDownload,
  FaPrint,
  FaSyncAlt,
  FaUserTie,
  FaCalendarDay,
  FaPlus,
  FaTimesCircle,
  FaFilePdf,
  FaFileExcel,
  FaFileCode
} from "react-icons/fa";
import { MdAdminPanelSettings, MdPendingActions, MdEventAvailable } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";
import API from "../../service/api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
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
  const [visitorFilter, setVisitorFilter] = useState({
    status: "all",
    nationality: "all",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [requestFilter, setRequestFilter] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [meetingFilter, setMeetingFilter] = useState({
    status: "all",
    type: "all",
    startDate: "",
    endDate: "",
    search: ""
  });
  
  // UI States
  const [activeTab, setActiveTab] = useState("meetings");
  const [showQRCode, setShowQRCode] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("approved");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Create Meeting Modal
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "Weekly Friday Meeting",
    description: "",
    meetingLeader: { name: "", position: "", department: "" },
    meetingDate: "",
    startTime: "09:00",
    endTime: "11:00",
    location: "Main Conference Room",
    meetingType: "weekly"
  });
  
  // Export states
  const [exporting, setExporting] = useState(false);
  const [openExportMenu, setOpenExportMenu] = useState(null);

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
      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));
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
      const [meetingsRes, visitorsRes, requestsRes] = await Promise.all([
        API.getMeetings(),
        API.getVisitors(),
        API.getAllRequests()
      ]);
      
      setMeetings(meetingsRes.data?.meetings || []);
      setVisitors(visitorsRes.data?.visitors || []);
      setRequests(requestsRes.data?.requests || []);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayVisitors = (visitorsRes.data?.visitors || []).filter(v => new Date(v.checkInTime) >= today).length;
      const checkedInVisitors = (visitorsRes.data?.visitors || []).filter(v => v.status === 'checked-in').length;
      const upcomingMeetings = (meetingsRes.data?.meetings || []).filter(m => m.status === 'scheduled' && new Date(m.meetingDate) >= today).length;
      const ongoingMeetings = (meetingsRes.data?.meetings || []).filter(m => m.status === 'ongoing').length;
      const pendingRequests = (requestsRes.data?.requests || []).filter(r => r.status === 'pending').length;
      
      setStats({
        totalMeetings: meetingsRes.data?.meetings?.length || 0,
        upcomingMeetings,
        ongoingMeetings,
        totalVisitors: visitorsRes.data?.visitors?.length || 0,
        todayVisitors,
        checkedInVisitors,
        totalRequests: requestsRes.data?.requests?.length || 0,
        pendingRequests
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      if (!silent) toast.error("Failed to load dashboard data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateRequestStatus = async () => {
    if (newStatus === 'rejected' && !statusNote) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setUpdating(true);
    try {
      await API.updateRequestStatus(selectedRequest._id, { status: newStatus, notes: statusNote });
      toast.success(`Request ${newStatus} successfully`);
      fetchAllData(true);
      setShowUpdateStatus(false);
      setSelectedRequest(null);
      setStatusNote("");
      setNewStatus("approved");
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

  const exportMeeting = async (meetingId, format) => {
    setExporting(true);
    try {
      let response;
      let filename = '';
      
      switch (format) {
        case 'pdf':
          response = await API.exportMeetingToPDF(meetingId);
          filename = `meeting_export_${Date.now()}.pdf`;
          break;
        case 'excel':
          response = await API.exportMeetingToExcel(meetingId);
          filename = `meeting_export_${Date.now()}.xlsx`;
          break;
        case 'html':
          response = await API.exportMeetingToHTML(meetingId);
          filename = `meeting_export_${Date.now()}.html`;
          break;
        default:
          return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
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
      setOpenExportMenu(null);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    
    if (!newMeeting.description || !newMeeting.meetingLeader.name || !newMeeting.meetingLeader.position) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setCreatingMeeting(true);
    try {
      const response = await API.createMeeting(newMeeting);
      if (response.data.success) {
        toast.success("Meeting created successfully!");
        setShowCreateMeeting(false);
        setNewMeeting({
          title: "Weekly Friday Meeting",
          description: "",
          meetingLeader: { name: "", position: "", department: "" },
          meetingDate: "",
          startTime: "09:00",
          endTime: "11:00",
          location: "Main Conference Room",
          meetingType: "weekly"
        });
        fetchAllData(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Error creating meeting");
    } finally {
      setCreatingMeeting(false);
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

  // Filter logic
  const filteredMeetings = meetings.filter(meeting => {
    if (meetingFilter.status !== 'all' && meeting.status !== meetingFilter.status) return false;
    if (meetingFilter.type !== 'all' && meeting.meetingType !== meetingFilter.type) return false;
    if (meetingFilter.startDate && new Date(meeting.meetingDate) < new Date(meetingFilter.startDate)) return false;
    if (meetingFilter.endDate && new Date(meeting.meetingDate) > new Date(meetingFilter.endDate)) return false;
    if (meetingFilter.search && !meeting.title?.toLowerCase().includes(meetingFilter.search.toLowerCase()) && 
        !meeting.location?.toLowerCase().includes(meetingFilter.search.toLowerCase())) return false;
    return true;
  });

  const filteredVisitors = visitors.filter(visitor => {
    if (visitorFilter.status !== 'all' && visitor.status !== visitorFilter.status) return false;
    if (visitorFilter.nationality !== 'all' && visitor.nationality !== visitorFilter.nationality) return false;
    if (visitorFilter.startDate && new Date(visitor.checkInTime) < new Date(visitorFilter.startDate)) return false;
    if (visitorFilter.endDate && new Date(visitor.checkInTime) > new Date(visitorFilter.endDate)) return false;
    if (visitorFilter.search && !visitor.fullName?.toLowerCase().includes(visitorFilter.search.toLowerCase()) && 
        !visitor.email?.toLowerCase().includes(visitorFilter.search.toLowerCase())) return false;
    return true;
  });

  const filteredRequests = requests.filter(request => {
    if (requestFilter.status !== 'all' && request.status !== requestFilter.status) return false;
    if (requestFilter.startDate && new Date(request.createdAt) < new Date(requestFilter.startDate)) return false;
    if (requestFilter.endDate && new Date(request.createdAt) > new Date(requestFilter.endDate)) return false;
    if (requestFilter.search && !request.service?.name?.toLowerCase().includes(requestFilter.search.toLowerCase())) return false;
    return true;
  });

  const resetMeetingFilters = () => setMeetingFilter({ status: "all", type: "all", startDate: "", endDate: "", search: "" });
  const resetVisitorFilters = () => setVisitorFilter({ status: "all", nationality: "all", startDate: "", endDate: "", search: "" });
  const resetRequestFilters = () => setRequestFilter({ status: "all", startDate: "", endDate: "", search: "" });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.fullName}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                <FaWifi className="text-xs" />
                <span>{wsConnected ? 'Live Updates' : 'Reconnecting...'}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400 text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateMeeting(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm">
              <FaPlus /> <span>Create Meeting</span>
            </button>
            <button onClick={() => fetchAllData(false)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
              <FaSyncAlt className="text-sm" />
              <span>Refresh</span>
            </button>
            <button onClick={() => { logout(); }} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Meetings</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalMeetings}</p><p className="text-gray-400 text-xs mt-1">{stats.upcomingMeetings} upcoming, {stats.ongoingMeetings} ongoing</p></div>
              <div className="bg-yellow-100 p-3 rounded-full"><FaCalendarAlt className="text-yellow-600 text-xl" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Total Visitors</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalVisitors}</p><p className="text-gray-400 text-xs mt-1">{stats.todayVisitors} today, {stats.checkedInVisitors} checked in</p></div>
              <div className="bg-green-100 p-3 rounded-full"><FaUserCheck className="text-green-600 text-xl" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Service Requests</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRequests}</p><p className="text-gray-400 text-xs mt-1">{stats.pendingRequests} pending</p></div>
              <div className="bg-pink-100 p-3 rounded-full"><FaClipboardList className="text-pink-600 text-xl" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">System Status</p><p className="text-3xl font-bold text-gray-900 mt-1">{wsConnected ? 'Online' : 'Offline'}</p><p className="text-gray-400 text-xs mt-1">Real-time active</p></div>
              <div className="bg-blue-100 p-3 rounded-full"><FaCheckCircle className="text-blue-600 text-xl" /></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("meetings")} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "meetings" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
            <FaCalendarAlt className="inline mr-2" /> Meetings ({filteredMeetings.length})
          </button>
          <button onClick={() => setActiveTab("visitors")} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "visitors" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
            <FaUserCheck className="inline mr-2" /> Visitors ({filteredVisitors.length})
          </button>
          <button onClick={() => setActiveTab("requests")} className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "requests" ? "text-primary-600 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
            <FaClipboardList className="inline mr-2" /> Requests ({filteredRequests.length})
          </button>
        </div>

        {/* Meetings Section */}
        {activeTab === "meetings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">Status</label><select value={meetingFilter.status} onChange={(e) => setMeetingFilter({...meetingFilter, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"><option value="all">All Status</option><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div><label className="text-xs text-gray-500 block mb-1">Type</label><select value={meetingFilter.type} onChange={(e) => setMeetingFilter({...meetingFilter, type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"><option value="all">All Types</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="special">Special</option></select></div>
                <div><label className="text-xs text-gray-500 block mb-1">From Date</label><input type="date" value={meetingFilter.startDate} onChange={(e) => setMeetingFilter({...meetingFilter, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">To Date</label><input type="date" value={meetingFilter.endDate} onChange={(e) => setMeetingFilter({...meetingFilter, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Search</label><input type="text" placeholder="Title or location..." value={meetingFilter.search} onChange={(e) => setMeetingFilter({...meetingFilter, search: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div className="flex items-end gap-2"><button onClick={resetMeetingFilters} className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Reset</button></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leader</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMeetings.map((meeting) => (
                    <tr key={meeting._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{meeting.title}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(meeting.meetingDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-600">{meeting.startTime} - {meeting.endTime}</td>
                      <td className="px-6 py-4 text-gray-600">{meeting.location}</td>
                      <td className="px-6 py-4 text-gray-600">{meeting.meetingLeader?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{meeting.participantCount || 0}</td>
                      <td className="px-6 py-4">{getStatusBadge(meeting.status)}</td>
                      <td className="px-6 py-4 flex gap-2 flex-wrap">
                        <button onClick={() => setShowQRCode(meeting)} className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200" title="QR Code"><FaQrcode /></button>
                        <button onClick={() => viewParticipants(meeting)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="View Participants"><FaEye /></button>
                        <div className="relative">
                          <button onClick={() => setOpenExportMenu(openExportMenu === meeting._id ? null : meeting._id)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Export"><FaDownload /></button>
                          {openExportMenu === meeting._id && (
                            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[120px]">
                              <button onClick={() => exportMeeting(meeting._id, 'pdf')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><FaFilePdf className="text-red-500" /> PDF</button>
                              <button onClick={() => exportMeeting(meeting._id, 'excel')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><FaFileExcel className="text-green-500" /> Excel</button>
                              <button onClick={() => exportMeeting(meeting._id, 'html')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><FaFileCode className="text-blue-500" /> HTML</button>
                            </div>
                          )}
                        </div>
                        <select onChange={(e) => updateMeetingStatus(meeting._id, e.target.value)} value={meeting.status} className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                      </td>
                    </tr>
                  ))}
                  {filteredMeetings.length === 0 && <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">No meetings found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visitors Section */}
        {activeTab === "visitors" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">Status</label><select value={visitorFilter.status} onChange={(e) => setVisitorFilter({...visitorFilter, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"><option value="all">All Status</option><option value="checked-in">Checked In</option><option value="checked-out">Checked Out</option></select></div>
                <div><label className="text-xs text-gray-500 block mb-1">Nationality</label><select value={visitorFilter.nationality} onChange={(e) => setVisitorFilter({...visitorFilter, nationality: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"><option value="all">All</option><option value="rwandan">Rwandan</option><option value="foreigner">Foreigner</option></select></div>
                <div><label className="text-xs text-gray-500 block mb-1">From Date</label><input type="date" value={visitorFilter.startDate} onChange={(e) => setVisitorFilter({...visitorFilter, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">To Date</label><input type="date" value={visitorFilter.endDate} onChange={(e) => setVisitorFilter({...visitorFilter, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Search</label><input type="text" placeholder="Name or email..." value={visitorFilter.search} onChange={(e) => setVisitorFilter({...visitorFilter, search: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div className="flex items-end"><button onClick={resetVisitorFilters} className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Reset Filters</button></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nationality</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{visitor.fullName}</td>
                      <td className="px-6 py-4 text-gray-600">{visitor.email}</td>
                      <td className="px-6 py-4 text-gray-600">{visitor.contactValue || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{visitor.nationality}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(visitor.checkInTime).toLocaleString()}</td>
                      <td className="px-6 py-4">{visitor.status === 'checked-in' ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✓ Checked In</span> : <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">✓ Checked Out</span>}</td>
                    </tr>
                  ))}
                  {filteredVisitors.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No visitors found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests Section */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div><label className="text-xs text-gray-500 block mb-1">Status</label><select value={requestFilter.status} onChange={(e) => setRequestFilter({...requestFilter, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"><option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
                <div><label className="text-xs text-gray-500 block mb-1">From Date</label><input type="date" value={requestFilter.startDate} onChange={(e) => setRequestFilter({...requestFilter, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">To Date</label><input type="date" value={requestFilter.endDate} onChange={(e) => setRequestFilter({...requestFilter, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div><label className="text-xs text-gray-500 block mb-1">Search</label><input type="text" placeholder="Service name..." value={requestFilter.search} onChange={(e) => setRequestFilter({...requestFilter, search: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                <div className="flex items-end gap-2"><button onClick={resetRequestFilters} className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Reset</button></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-900 font-medium">{request.service?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{request.visitor?.fullName || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(request.eventDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{request.message || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <button onClick={() => { setSelectedRequest(request); setNewStatus("approved"); setStatusNote(""); setShowUpdateStatus(true); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">Update</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No requests found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateMeeting(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 flex justify-between items-center sticky top-0">
                <h2 className="text-xl font-bold text-white">Create New Meeting</h2>
                <button onClick={() => setShowCreateMeeting(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
              </div>
              <form onSubmit={handleCreateMeeting} className="p-6 space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title</label><input type="text" value={newMeeting.title} onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Description *</label><textarea rows="3" value={newMeeting.description} onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required placeholder="Meeting agenda, topics to discuss..." /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Leader Name *</label><input type="text" value={newMeeting.meetingLeader.name} onChange={(e) => setNewMeeting({...newMeeting, meetingLeader: {...newMeeting.meetingLeader, name: e.target.value}})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Leader Position *</label><input type="text" value={newMeeting.meetingLeader.position} onChange={(e) => setNewMeeting({...newMeeting, meetingLeader: {...newMeeting.meetingLeader, position: e.target.value}})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Department</label><input type="text" value={newMeeting.meetingLeader.department} onChange={(e) => setNewMeeting({...newMeeting, meetingLeader: {...newMeeting.meetingLeader, department: e.target.value}})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="grid grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date *</label><input type="date" value={newMeeting.meetingDate} onChange={(e) => setNewMeeting({...newMeeting, meetingDate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label><input type="time" value={newMeeting.startTime} onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">End Time</label><input type="time" value={newMeeting.endTime} onChange={(e) => setNewMeeting({...newMeeting, endTime: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Location</label><input type="text" value={newMeeting.location} onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label><select value={newMeeting.meetingType} onChange={(e) => setNewMeeting({...newMeeting, meetingType: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg"><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="special">Special</option></select></div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCreateMeeting(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={creatingMeeting} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{creatingMeeting ? 'Creating...' : 'Create Meeting'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Other Modals (QR Code, Participants, Update Status) remain the same */}
        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRCode(null)}>
            <div className="bg-white rounded-2xl p-6 text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-2">{showQRCode.title}</h3>
              <p className="text-gray-500 text-sm mb-4">Scan to sign in to this meeting</p>
              <QRCodeSVG value={`${window.location.origin}/meeting/signin/${showQRCode._id}`} size={200} className="mx-auto mb-4" />
              <button onClick={() => setShowQRCode(null)} className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Close</button>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipants && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowParticipants(false)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 flex justify-between items-center">
                <div><h2 className="text-xl font-bold text-white">Participants</h2><p className="text-white/80 text-sm">{selectedMeeting.title}</p></div>
                <button onClick={() => setShowParticipants(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
              </div>
              <div className="overflow-y-auto p-6 max-h-[60vh]">
                {participants.length > 0 ? participants.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100">
                    <div><p className="font-medium">{idx+1}. {p.fullName}</p><p className="text-sm text-gray-500">{p.institution} - {p.position}</p><p className="text-xs text-gray-400">{new Date(p.signedAt).toLocaleString()}</p></div>
                    {p.signature && <img src={p.signature} alt="signature" className="max-w-[100px] max-h-[40px] border rounded p-1" />}
                  </div>
                )) : <p className="text-center text-gray-500 py-8">No participants yet</p>}
              </div>
              <div className="border-t p-4 flex justify-end"><button onClick={() => setShowParticipants(false)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button></div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateStatus && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUpdateStatus(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Update Request Status</h2>
                <p className="text-white/80 text-sm">{selectedRequest.service?.name} - {selectedRequest.visitor?.fullName}</p>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg">
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                {newStatus === 'rejected' && (
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection *</label>
                    <textarea rows="3" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg" placeholder="Please provide a reason..."/>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowUpdateStatus(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={updateRequestStatus} disabled={updating} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{updating ? 'Updating...' : 'Update Status'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;