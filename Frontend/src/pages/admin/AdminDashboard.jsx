// src/pages/admin/AdminDashboard.jsx - Simple & Working
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaUserCheck, 
  FaClipboardList,
  FaSpinner,
  FaUserPlus,
  FaSignOutAlt
} from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
import API from "../../service/api";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalReceptionists: 0,
    totalMeetings: 0,
    totalVisitors: 0,
    totalRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersRes = await API.get('/admin/users').catch(() => ({ data: { users: [] } }));
      const users = usersRes.data?.users || [];
      
      const admins = users.filter(u => u.role === 'admin');
      const receptionists = users.filter(u => u.role === 'receptionist');
      
      // Fetch meetings, visitors, requests
      const [meetingsRes, visitorsRes, requestsRes] = await Promise.all([
        API.get('/meetings').catch(() => ({ data: { count: 0 } })),
        API.get('/visitors').catch(() => ({ data: { count: 0 } })),
        API.get('/requests').catch(() => ({ data: { count: 0 } }))
      ]);
      
      setStats({
        totalUsers: users.length,
        totalAdmins: admins.length,
        totalReceptionists: receptionists.length,
        totalMeetings: meetingsRes.data?.count || 0,
        totalVisitors: visitorsRes.data?.count || 0,
        totalRequests: requestsRes.data?.count || 0
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: FaUsers, 
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    { 
      title: 'Admins', 
      value: stats.totalAdmins, 
      icon: MdAdminPanelSettings, 
      color: 'bg-purple-500',
      link: '/admin/users',
    },
    { 
      title: 'Receptionists', 
      value: stats.totalReceptionists, 
      icon: FaUsers, 
      color: 'bg-green-500',
      link: '/admin/users',
    },
    { 
      title: 'Meetings', 
      value: stats.totalMeetings, 
      icon: FaCalendarAlt, 
      color: 'bg-yellow-500',
      link: '/meetings',
    },
    { 
      title: 'Visitors', 
      value: stats.totalVisitors, 
      icon: FaUserCheck, 
      color: 'bg-indigo-500',
      link: '/visitors-list',
    },
    { 
      title: 'Requests', 
      value: stats.totalRequests, 
      icon: FaClipboardList, 
      color: 'bg-pink-500',
      link: '/visitors-list',
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-white/80 mt-1">
              Welcome back, {user?.fullName}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all"
            >
              <FaUserPlus />
              <span>Manage Users</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-md text-white rounded-lg hover:bg-red-500/30 transition-all"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="block">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="text-white text-xl" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <FaUsers className="text-blue-400 text-xl" />
              <div>
                <p className="text-white font-medium">Manage Users</p>
                <p className="text-white/60 text-sm">Add or remove staff</p>
              </div>
            </Link>
            <Link
              to="/meetings/create"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <FaCalendarAlt className="text-green-400 text-xl" />
              <div>
                <p className="text-white font-medium">Schedule Meeting</p>
                <p className="text-white/60 text-sm">Create new meeting</p>
              </div>
            </Link>
            <Link
              to="/meetings"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <FaClipboardList className="text-yellow-400 text-xl" />
              <div>
                <p className="text-white font-medium">View Meetings</p>
                <p className="text-white/60 text-sm">Manage all meetings</p>
              </div>
            </Link>
            <Link
              to="/visitors-list"
              className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <FaUserCheck className="text-purple-400 text-xl" />
              <div>
                <p className="text-white font-medium">View Visitors</p>
                <p className="text-white/60 text-sm">Check visitor logs</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Admin Info */}
        <div className="mt-6 text-center text-white/50 text-sm">
          <p>© 2026 Reception Management System | Admin Access Only</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;