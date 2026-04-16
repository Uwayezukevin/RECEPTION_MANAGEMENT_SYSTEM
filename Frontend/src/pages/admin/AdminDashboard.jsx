// src/pages/admin/AdminDashboard.jsx - Complete Fixed Version
import React, { useState, useEffect, useCallback } from "react";
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
  FaDownload,
  FaSyncAlt,
  FaPlus,
  FaFilePdf,
  FaFileExcel,
  FaFileCode
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";
import API from "../../service/api";
import toast from "react-hot-toast";
import logo from "../../assets/image.png";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("meetings");
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("approved");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [openExportMenu, setOpenExportMenu] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    ongoingMeetings: 0,
    completedMeetings: 0,
    totalVisitors: 0,
    todayVisitors: 0,
    checkedInVisitors: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  
  // Data tables
  const [meetings, setMeetings] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Filters
  const [meetingFilter, setMeetingFilter] = useState({
    status: "all",
    type: "all",
    startDate: "",
    endDate: "",
    search: ""
  });
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
  
  // New Meeting Form
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

  // Fetch all data
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [meetingsRes, visitorsRes, requestsRes] = await Promise.all([
        API.getMeetings(),
        API.getVisitors(),
        API.getAllRequests()
      ]);
      
      const allMeetings = meetingsRes.data?.meetings || [];
      const allVisitors = visitorsRes.data?.visitors || [];
      const allRequests = requestsRes.data?.requests || [];
      
      setMeetings(allMeetings);
      setVisitors(allVisitors);
      setRequests(allRequests);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      setStats({
        totalMeetings: allMeetings.length,
        upcomingMeetings: allMeetings.filter(m => m.status === 'scheduled' && new Date(m.meetingDate) >= today).length,
        ongoingMeetings: allMeetings.filter(m => m.status === 'ongoing').length,
        completedMeetings: allMeetings.filter(m => m.status === 'completed').length,
        totalVisitors: allVisitors.length,
        todayVisitors: allVisitors.filter(v => new Date(v.checkInTime) >= today).length,
        checkedInVisitors: allVisitors.filter(v => v.status === 'checked-in').length,
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter(r => r.status === 'pending').length,
        completedRequests: allRequests.filter(r => r.status === 'completed').length
      });
      
    } catch (error) {
      if (!silent) toast.error("Failed to load dashboard data");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    setupWebSocket();
    const interval = setInterval(() => fetchAllData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    toast.success("Dashboard refreshed");
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowUpdateStatus(true);
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
        default: return;
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
      toast.error('Failed to export meeting');
    } finally {
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
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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

  const resetFilters = () => {
    setMeetingFilter({ status: "all", type: "all", startDate: "", endDate: "", search: "" });
    setVisitorFilter({ status: "all", nationality: "all", startDate: "", endDate: "", search: "" });
    setRequestFilter({ status: "all", startDate: "", endDate: "", search: "" });
    toast.success("All filters reset");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="Logo" className="h-16 mx-auto mb-4 animate-pulse" />
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <img src={logo} alt="MININFRA Logo" className="h-14 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back, {user?.fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex items-center gap-1 text-xs ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span>{wsConnected ? 'Live' : 'Offline'}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-400 text-xs">Updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowCreateMeeting(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center gap-2">
                <FaPlus /> Create Meeting
              </button>
              <button onClick={handleRefresh} disabled={refreshing} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                <FaSyncAlt className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
              <button onClick={resetFilters} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                <FaFilter /> Reset Filters
              </button>
              <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-500 text-sm">Meetings</p><p className="text-2xl font-bold text-gray-900">{stats.totalMeetings}</p><p className="text-gray-400 text-xs mt-1">{stats.upcomingMeetings} upcoming</p></div>
              <div className="bg-yellow-100 p-3 rounded-full"><FaCalendarAlt className="text-yellow-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-500 text-sm">Visitors</p><p className="text-2xl font-bold text-gray-900">{stats.totalVisitors}</p><p className="text-gray-400 text-xs mt-1">{stats.todayVisitors} today</p></div>
              <div className="bg-green-100 p-3 rounded-full"><FaUserCheck className="text-green-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-pink-500">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-500 text-sm">Requests</p><p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p><p className="text-gray-400 text-xs mt-1">{stats.pendingRequests} pending</p></div>
              <div className="bg-pink-100 p-3 rounded-full"><FaClipboardList className="text-pink-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-500 text-sm">System</p><p className="text-2xl font-bold text-gray-900">{wsConnected ? 'Online' : 'Offline'}</p><p className="text-gray-400 text-xs mt-1">Real-time active</p></div>
              <div className="bg-blue-100 p-3 rounded-full"><FaCheckCircle className="text-blue-600" /></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { id: "meetings", label: "Meetings", icon: FaCalendarAlt, count: filteredMeetings.length },
            { id: "visitors", label: "Visitors", icon: FaUserCheck, count: filteredVisitors.length },
            { id: "requests", label: "Requests", icon: FaClipboardList, count: filteredRequests.length }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${activeTab === tab.id ? "bg-primary-600 text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"}`}>
              <tab.icon size={16} /> {tab.label} <span className="text-xs ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Meetings Section */}
        {activeTab === "meetings" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32"><label className="text-xs text-gray-500 block mb-1">Status</label><select value={meetingFilter.status} onChange={(e) => setMeetingFilter({...meetingFilter, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="all">All</option><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div className="w-32"><label className="text-xs text-gray-500 block mb-1">Type</label><select value={meetingFilter.type} onChange={(e) => setMeetingFilter({...meetingFilter, type: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="all">All</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="special">Special</option></select></div>
                <div className="w-36"><label className="text-xs text-gray-500 block mb-1">From Date</label><input type="date" value={meetingFilter.startDate} onChange={(e) => setMeetingFilter({...meetingFilter, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
                <div className="w-36"><label className="text-xs text-gray-500 block mb-1">To Date</label><input type="date" value={meetingFilter.endDate} onChange={(e) => setMeetingFilter({...meetingFilter, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
                <div className="flex-1 min-w-[200px]"><label className="text-xs text-gray-500 block mb-1">Search</label><input type="text" placeholder="Title or location..." value={meetingFilter.search} onChange={(e) => setMeetingFilter({...meetingFilter, search: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Title</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Date</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Time</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Location</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Leader</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Participants</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Status</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMeetings.map((meeting) => (
                    <tr key={meeting._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{meeting.title}</td>
                      <td className="px-5 py-3 text-gray-600">{new Date(meeting.meetingDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-gray-600">{meeting.startTime} - {meeting.endTime}</td>
                      <td className="px-5 py-3 text-gray-600">{meeting.location}</td>
                      <td className="px-5 py-3 text-gray-600">{meeting.meetingLeader?.name}</td>
                      <td className="px-5 py-3 text-gray-600">{meeting.participantCount || 0}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(meeting.status)}`}>{meeting.status}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setShowQRCode(meeting)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="QR Code"><FaQrcode /></button>
                          <button onClick={() => viewParticipants(meeting)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Participants"><FaEye /></button>
                          <div className="relative">
                            <button onClick={() => setOpenExportMenu(openExportMenu === meeting._id ? null : meeting._id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><FaDownload /></button>
                            {openExportMenu === meeting._id && (
                              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border z-10 min-w-[130px]">
                                <button onClick={() => exportMeeting(meeting._id, 'pdf')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><FaFilePdf className="text-red-500" /> PDF</button>
                                <button onClick={() => exportMeeting(meeting._id, 'excel')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><FaFileExcel className="text-green-500" /> Excel</button>
                                <button onClick={() => exportMeeting(meeting._id, 'html')} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><FaFileCode className="text-blue-500" /> HTML</button>
                              </div>
                            )}
                          </div>
                          <select onChange={(e) => updateMeetingStatus(meeting._id, e.target.value)} value={meeting.status} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMeetings.length === 0 && <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-400">No meetings found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visitors Section */}
        {activeTab === "visitors" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32"><label className="text-xs text-gray-500 block mb-1">Status</label><select value={visitorFilter.status} onChange={(e) => setVisitorFilter({...visitorFilter, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="all">All</option><option value="checked-in">Checked In</option><option value="checked-out">Checked Out</option></select></div>
                <div className="w-32"><label className="text-xs text-gray-500 block mb-1">Nationality</label><select value={visitorFilter.nationality} onChange={(e) => setVisitorFilter({...visitorFilter, nationality: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="all">All</option><option value="rwandan">Rwandan</option><option value="foreigner">Foreigner</option></select></div>
                <div className="w-36"><label className="text-xs text-gray-500 block mb-1">From Date</label><input type="date" value={visitorFilter.startDate} onChange={(e) => setVisitorFilter({...visitorFilter, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
                <div className="w-36"><label className="text-xs text-gray-500 block mb-1">To Date</label><input type="date" value={visitorFilter.endDate} onChange={(e) => setVisitorFilter({...visitorFilter, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
                <div className="flex-1 min-w-[200px]"><label className="text-xs text-gray-500 block mb-1">Search</label><input type="text" placeholder="Name or email..." value={visitorFilter.search} onChange={(e) => setVisitorFilter({...visitorFilter, search: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Name</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Email</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Phone</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Nationality</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Check In</th><th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor._id} className="hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-900">{visitor.fullName}</td><td className="px-5 py-3 text-gray-600">{visitor.email}</td><td className="px-5 py-3 text-gray-600">{visitor.contactValue || '-'}</td><td className="px-5 py-3 text-gray-600 capitalize">{visitor.nationality}</td><td className="px-5 py-3 text-gray-600">{new Date(visitor.checkInTime).toLocaleString()}</td><td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${visitor.status === 'checked-in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{visitor.status === 'checked-in' ? '✓ Checked In' : '✓ Checked Out'}</span></td></tr>
                  ))}
                  {filteredVisitors.length === 0 && <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">No visitors found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Requests Section - With Update Button for All Requests */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32"><label className="text-xs text-gray-500 block mb-1">Status</label><select value={requestFilter.status} onChange={(e) => setRequestFilter({...requestFilter, status: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select></div>
                <div className="w-36"><label className="text-xs text-gray-500 block mb-1">From Date</label><input type="date" value={requestFilter.startDate} onChange={(e) => setRequestFilter({...requestFilter, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
                <div className="w-36"><label className="text-xs text-gray-500 block mb-1">To Date</label><input type="date" value={requestFilter.endDate} onChange={(e) => setRequestFilter({...requestFilter, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
                <div className="flex-1 min-w-[200px]"><label className="text-xs text-gray-500 block mb-1">Search</label><input type="text" placeholder="Service name..." value={requestFilter.search} onChange={(e) => setRequestFilter({...requestFilter, search: e.target.value})} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" /></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Service</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Visitor</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Event Date</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Message</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{request.service?.name || 'N/A'}</td>
                      <td className="px-5 py-3 text-gray-600">{request.visitor?.fullName || 'N/A'}</td>
                      <td className="px-5 py-3 text-gray-600">{new Date(request.eventDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{request.message || '-'}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>{request.status}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewRequest(request)} 
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                          >
                            Update
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedRequest(request);
                              setNewStatus("approved");
                              setStatusNote("");
                              setShowUpdateStatus(true);
                            }} 
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Change Status"
                          >
                            <FaEye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">No requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Meeting Modal */}
        {showCreateMeeting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateMeeting(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-primary-600 px-6 py-4 sticky top-0 flex justify-between items-center">
                <div className="flex items-center gap-3"><img src={logo} alt="Logo" className="h-8" /><h2 className="text-xl font-bold text-white">Create New Meeting</h2></div>
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

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRCode(null)}>
            <div className="bg-white rounded-2xl p-6 text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
              <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{showQRCode.title}</h3>
              <p className="text-gray-500 text-sm mb-4">Scan to sign in to this meeting</p>
              <QRCodeSVG value={`${window.location.origin}/meeting/signin/${showQRCode._id}`} size={200} className="mx-auto mb-4" />
              <button onClick={() => setShowQRCode(null)} className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipants && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowParticipants(false)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="bg-primary-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3"><img src={logo} alt="Logo" className="h-8" /><div><h2 className="text-xl font-bold text-white">Participants</h2><p className="text-white/80 text-sm">{selectedMeeting.title}</p></div></div>
                <button onClick={() => setShowParticipants(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
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
              <div className="bg-primary-600 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center gap-3"><img src={logo} alt="Logo" className="h-8" /><div><h2 className="text-xl font-bold text-white">Update Request Status</h2><p className="text-white/80 text-sm">{selectedRequest.service?.name}</p></div></div>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
                    <option value="approved">Approved</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
                  </select>
                </div>
                {newStatus === 'rejected' && (
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection *</label>
                    <textarea rows="3" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Please provide a reason..."/>
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