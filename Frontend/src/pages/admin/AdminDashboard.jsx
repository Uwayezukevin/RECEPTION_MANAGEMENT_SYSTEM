// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaChartLine, 
  FaBuilding,
  FaClipboardList,
  FaUserCheck,
  FaFileExport,
  FaShieldAlt,
  FaSpinner
} from "react-icons/fa";
import API from "../../service/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMeetings: 0,
    totalVisitors: 0,
    totalRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch various stats
      const [usersRes, meetingsRes, visitorsRes, requestsRes] = await Promise.all([
        API.get('/admin/users').catch(() => ({ data: { count: 0 } })),
        API.get('/meetings').catch(() => ({ data: { count: 0 } })),
        API.get('/visitors').catch(() => ({ data: { count: 0 } })),
        API.get('/requests').catch(() => ({ data: { count: 0 } }))
      ]);
      
      setStats({
        totalUsers: usersRes.data?.count || 0,
        totalMeetings: meetingsRes.data?.count || 0,
        totalVisitors: visitorsRes.data?.count || 0,
        totalRequests: requestsRes.data?.count || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: FaUsers, 
      color: 'bg-blue-500',
      link: '/admin/users',
      description: 'System users'
    },
    { 
      title: 'Total Meetings', 
      value: stats.totalMeetings, 
      icon: FaCalendarAlt, 
      color: 'bg-green-500',
      link: '/meetings',
      description: 'Scheduled meetings'
    },
    { 
      title: 'Total Visitors', 
      value: stats.totalVisitors, 
      icon: FaUserCheck, 
      color: 'bg-purple-500',
      link: '/visitors-list',
      description: 'Registered visitors'
    },
    { 
      title: 'Service Requests', 
      value: stats.totalRequests, 
      icon: FaClipboardList, 
      color: 'bg-orange-500',
      link: '/visitors-list',
      description: 'Pending & completed'
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add or remove receptionists and admins',
      icon: FaUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/users'
    },
    {
      title: 'Create Meeting',
      description: 'Schedule a new meeting',
      icon: FaCalendarAlt,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/meetings/create'
    },
    {
      title: 'View Reports',
      description: 'Export meeting and visitor reports',
      icon: FaFileExport,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/meetings'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: FaShieldAlt,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      link: '#'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, <span className="font-semibold">{user?.fullName}</span>
          </p>
          <div className="mt-2 inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
            <FaShieldAlt className="text-sm" />
            <span>Administrator Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="block">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="flex items-start gap-3 p-4 rounded-lg hover:shadow-md transition-all border border-gray-100 group"
              >
                <div className={`${action.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className={`${action.color} text-xl`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Recent Users</h3>
              <Link to="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-gray-500 text-sm text-center py-4">
                Click "Manage Users" to view and manage system users
              </p>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">System Version</span>
                <span className="font-medium text-gray-900">v2.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Roles Supported</span>
                <span className="font-medium text-gray-900">Admin, Receptionist</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Last Login</span>
                <span className="font-medium text-gray-900">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Today'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;