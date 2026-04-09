// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaUserCheck, 
  FaClipboardList,
  FaSpinner,
  FaSignOutAlt,
  FaChartLine,
  FaBell,
  FaCheckCircle,
  FaClock,
  FaUserShield,
  FaWifi,
  FaCalendarWeek,
  FaUserClock,
  FaFileAlt,
  FaChartLine as FaTrendUp,  // ✅ Replace FaTrendUp with FaChartLine
  FaRegCalendarCheck,
  FaUsersSlash
} from "react-icons/fa";
import { MdAdminPanelSettings, MdPendingActions, MdEventAvailable } from "react-icons/md";
import API from "../../service/api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    completedMeetings: 0,
    ongoingMeetings: 0,
    totalVisitors: 0,
    todayVisitors: 0,
    checkedInVisitors: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [wsConnected, setWsConnected] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    setupWebSocket();
    fetchRecentActivities();
    
    const interval = setInterval(() => {
      fetchDashboardData(true);
      fetchRecentActivities();
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
        console.log('WebSocket connected');
        setWsConnected(true);
        socket.emit('join-admin-room');
      });
      
      socket.on('disconnect', () => {
        setWsConnected(false);
      });
      
      socket.on('dashboard-update', (data) => {
        console.log('Dashboard update received:', data);
        if (data.stats) {
          setStats(prev => ({ ...prev, ...data.stats }));
          setLastUpdated(new Date());
        }
      });
      
      socket.on('visitor-checked-in', () => {
        fetchDashboardData(true);
        fetchRecentActivities();
      });
      
      socket.on('new-request', () => {
        fetchDashboardData(true);
        fetchRecentActivities();
      });
      
      socket.on('meeting-created', () => {
        fetchDashboardData(true);
        fetchRecentActivities();
      });
    }
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [meetingsRes, visitorsRes, requestsRes] = await Promise.all([
        API.get('/meetings').catch(() => ({ data: { count: 0, meetings: [] } })),
        API.get('/visitors').catch(() => ({ data: { count: 0, visitors: [] } })),
        API.get('/requests').catch(() => ({ data: { count: 0, requests: [] } }))
      ]);
      
      const meetings = meetingsRes.data?.meetings || [];
      const visitors = visitorsRes.data?.visitors || [];
      const requests = requestsRes.data?.requests || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayVisitors = visitors.filter(v => new Date(v.checkInTime) >= today).length;
      const checkedInVisitors = visitors.filter(v => v.status === 'checked-in').length;
      
      const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.meetingDate) >= today).length;
      const completedMeetings = meetings.filter(m => m.status === 'completed').length;
      const ongoingMeetings = meetings.filter(m => m.status === 'ongoing').length;
      
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const completedRequests = requests.filter(r => r.status === 'completed').length;
      
      setStats({
        totalMeetings: meetings.length,
        upcomingMeetings,
        completedMeetings,
        ongoingMeetings,
        totalVisitors: visitors.length,
        todayVisitors,
        checkedInVisitors,
        totalRequests: requests.length,
        pendingRequests,
        completedRequests
      });
      
    } catch (error) {
      if (!silent) toast.error("Failed to load dashboard data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const [recentMeetings, recentVisitors, recentRequests] = await Promise.all([
        API.get('/meetings').then(res => res.data?.meetings?.slice(0, 3) || []),
        API.get('/visitors').then(res => res.data?.visitors?.slice(0, 3) || []),
        API.get('/requests').then(res => res.data?.requests?.slice(0, 3) || [])
      ]);
      
      const activities = [];
      
      recentMeetings.forEach(meeting => {
        activities.push({
          id: meeting._id,
          type: 'meeting',
          title: meeting.title,
          message: `Meeting scheduled for ${new Date(meeting.meetingDate).toLocaleDateString()}`,
          time: new Date(meeting.createdAt).toLocaleTimeString(),
          icon: FaCalendarAlt,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          link: '/meetings'
        });
      });
      
      recentVisitors.forEach(visitor => {
        activities.push({
          id: visitor._id,
          type: 'visitor',
          title: visitor.fullName,
          message: `Checked in from ${visitor.institution || 'Unknown'}`,
          time: new Date(visitor.checkInTime).toLocaleTimeString(),
          icon: FaUserCheck,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          link: '/visitors-list'
        });
      });
      
      recentRequests.forEach(request => {
        activities.push({
          id: request._id,
          type: 'request',
          title: request.service?.name || 'Service Request',
          message: `Status: ${request.status}`,
          time: new Date(request.createdAt).toLocaleTimeString(),
          icon: FaClipboardList,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          link: '/visitors-list'
        });
      });
      
      activities.sort((a, b) => b.time.localeCompare(a.time));
      setRecentActivities(activities.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const statCards = [
    { 
      title: 'Meetings', 
      value: stats.totalMeetings, 
      icon: FaCalendarAlt, 
      color: 'bg-yellow-500', 
      link: '/meetings', 
      subValue: `${stats.upcomingMeetings} upcoming, ${stats.ongoingMeetings} ongoing`
    },
    { 
      title: 'Visitors', 
      value: stats.totalVisitors, 
      icon: FaUserCheck, 
      color: 'bg-indigo-500', 
      link: '/visitors-list', 
      subValue: `${stats.todayVisitors} today, ${stats.checkedInVisitors} checked in`
    },
    { 
      title: 'Requests', 
      value: stats.totalRequests, 
      icon: FaClipboardList, 
      color: 'bg-pink-500', 
      link: '/visitors-list', 
      subValue: `${stats.pendingRequests} pending, ${stats.completedRequests} completed`
    },
  ];

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
              <span className="text-white/40 text-xs">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                fetchDashboardData(false);
                fetchRecentActivities();
              }} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all"
            >
              <FaChartLine />
              <span>Refresh</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-md text-white rounded-lg hover:bg-red-500/30 transition-all"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="block group">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all border border-white/20 group-hover:scale-105 transform duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-white/50 text-xs mt-1">{stat.subValue}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full group-hover:scale-110 transition-transform`}>
                    <stat.icon className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaBell className="text-yellow-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/meetings/create" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaCalendarWeek className="text-green-400 text-xl" />
                </div>
                <div>
                  <p className="text-white font-medium">Schedule Meeting</p>
                  <p className="text-white/60 text-sm">Create new meeting</p>
                </div>
              </Link>
              
              <Link to="/meetings" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaRegCalendarCheck className="text-yellow-400 text-xl" />
                </div>
                <div>
                  <p className="text-white font-medium">View Meetings</p>
                  <p className="text-white/60 text-sm">Manage all meetings</p>
                </div>
              </Link>
              
              <Link to="/visitors-list" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all group">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaUserClock className="text-purple-400 text-xl" />
                </div>
                <div>
                  <p className="text-white font-medium">View Visitors</p>
                  <p className="text-white/60 text-sm">Check visitor logs</p>
                </div>
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-400" />
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white/60 text-sm">Real-time Connection</p>
                  <p className={`text-sm font-medium ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {wsConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white/60 text-sm">Auto-refresh</p>
                  <p className="text-sm font-medium text-green-400">Active (30s)</p>
                </div>
                <FaCheckCircle className="text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white/60 text-sm">Last Update</p>
                  <p className="text-sm font-medium text-white">{lastUpdated.toLocaleTimeString()}</p>
                </div>
                <FaClock className="text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-400" />
            Recent Activity
          </h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <Link key={idx} to={activity.link} className="block">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <div className={`${activity.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <activity.icon className={`${activity.color} text-lg`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.title}</p>
                      <p className="text-white/60 text-sm">{activity.message}</p>
                    </div>
                    <div className="text-white/40 text-xs">{activity.time}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaFileAlt className="text-4xl text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No recent activity</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-white/40 text-xs">
          <p>© 2026 Reception Management System | Real-time Admin Dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;