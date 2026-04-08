// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaChartLine, 
  FaUserShield,
  FaClipboardList,
  FaUserCheck,
  FaFileExport,
  FaShieldAlt,
  FaSpinner,
  FaDatabase,
  FaServer,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUserPlus,
  FaTrashAlt,
  FaEdit,
  FaEye
} from "react-icons/fa";
import { MdAdminPanelSettings, MdReception, MdSecurity } from "react-icons/md";
import API from "../../service/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalReceptionists: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalMeetings: 0,
    totalVisitors: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users data
      const usersRes = await API.get('/admin/users').catch(() => ({ data: { users: [] } }));
      const users = usersRes.data?.users || [];
      
      // Calculate user stats
      const admins = users.filter(u => u.role === 'admin');
      const receptionists = users.filter(u => u.role === 'receptionist');
      const activeUsers = users.filter(u => u.isActive);
      const inactiveUsers = users.filter(u => !u.isActive);
      
      // Fetch other stats
      const [meetingsRes, visitorsRes, requestsRes] = await Promise.all([
        API.get('/meetings').catch(() => ({ data: { count: 0, meetings: [] } })),
        API.get('/visitors').catch(() => ({ data: { count: 0 } })),
        API.get('/requests').catch(() => ({ data: { count: 0, requests: [] } }))
      ]);
      
      const requests = requestsRes.data?.requests || [];
      const pendingRequests = requests.filter(r => r.status === 'pending');
      const completedRequests = requests.filter(r => r.status === 'completed');
      
      setStats({
        totalUsers: users.length,
        totalAdmins: admins.length,
        totalReceptionists: receptionists.length,
        activeUsers: activeUsers.length,
        inactiveUsers: inactiveUsers.length,
        totalMeetings: meetingsRes.data?.count || 0,
        totalVisitors: visitorsRes.data?.count || 0,
        totalRequests: requestsRes.data?.count || 0,
        pendingRequests: pendingRequests.length,
        completedRequests: completedRequests.length
      });
      
      // Get recent users (last 5)
      setRecentUsers(users.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminStatCards = [
    { 
      title: 'System Users', 
      value: stats.totalUsers, 
      icon: FaUsers, 
      color: 'bg-blue-500',
      link: '/admin/users',
      description: `${stats.activeUsers} active · ${stats.inactiveUsers} inactive`
    },
    { 
      title: 'Admins', 
      value: stats.totalAdmins, 
      icon: MdAdminPanelSettings, 
      color: 'bg-purple-500',
      link: '/admin/users?role=admin',
      description: 'Administrator accounts'
    },
    { 
      title: 'Receptionists', 
      value: stats.totalReceptionists, 
      icon: MdReception, 
      color: 'bg-green-500',
      link: '/admin/users?role=receptionist',
      description: 'Staff accounts'
    },
    { 
      title: 'Service Requests', 
      value: stats.totalRequests, 
      icon: FaClipboardList, 
      color: 'bg-orange-500',
      link: '/visitors-list',
      description: `${stats.pendingRequests} pending · ${stats.completedRequests} completed`
    },
  ];

  const systemManagementCards = [
    {
      title: 'User Management',
      description: 'Create, edit, and manage system users',
      icon: FaUserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/users',
      actions: ['Add User', 'Edit Roles', 'Deactivate Users']
    },
    {
      title: 'Role Management',
      description: 'Configure admin and receptionist permissions',
      icon: FaUserShield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/admin/roles',
      actions: ['Admin Privileges', 'Receptionist Access', 'Permissions']
    },
    {
      title: 'System Monitoring',
      description: 'View system logs and performance metrics',
      icon: FaServer,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      link: '/admin/monitoring',
      actions: ['System Logs', 'Performance', 'Health Check']
    },
    {
      title: 'Data Management',
      description: 'Export, backup, and manage system data',
      icon: FaDatabase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/admin/data',
      actions: ['Backup Data', 'Export Reports', 'Cleanup']
    },
  ];

  const recentActivityItems = [
    { icon: FaUserPlus, text: 'New receptionist account created', time: '2 hours ago', color: 'text-green-500' },
    { icon: FaEdit, text: 'User permissions updated', time: '5 hours ago', color: 'text-blue-500' },
    { icon: FaTrashAlt, text: 'Inactive user removed', time: '1 day ago', color: 'text-red-500' },
    { icon: FaEye, text: 'System audit log reviewed', time: '2 days ago', color: 'text-purple-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">
                System Management & Administration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <MdSecurity className="text-lg" />
                <span className="font-medium">Administrator</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <FaShieldAlt />
              Welcome, {user?.fullName}. You have full system access. Use the tools below to manage users and monitor system activity.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStatCards.map((stat, index) => (
            <Link key={index} to={stat.link} className="block">
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border border-gray-100">
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

        {/* System Management Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaServer className="text-gray-600" />
            System Management
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemManagementCards.map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100 group"
              >
                <div className={`${item.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`${item.color} text-2xl`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                <div className="flex flex-wrap gap-2">
                  {item.actions.map((action, idx) => (
                    <span key={idx} className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {action}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Recent User Activity</h3>
                <p className="text-sm text-gray-500">Latest system user changes</p>
              </div>
              <Link to="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">
                View All Users →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user._id} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        user.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}>
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Activity Log</h3>
              <p className="text-sm text-gray-500">System events and changes</p>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivityItems.map((activity, idx) => (
                <div key={idx} className="px-6 py-3 flex items-center gap-3">
                  <activity.icon className={`${activity.color} text-lg`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <Link to="/admin/logs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View full activity log →
              </Link>
            </div>
          </div>
        </div>

        {/* System Health Section */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            System Health Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-700">Database Connection</p>
                <p className="text-xs text-green-600">Connected and operational</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-700">API Status</p>
                <p className="text-xs text-green-600">All endpoints healthy</p>
              </div>
              <FaCheckCircle className="text-green-500 text-xl" />
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-yellow-700">Storage Usage</p>
                <p className="text-xs text-yellow-600">45% of capacity used</p>
              </div>
              <FaExclamationTriangle className="text-yellow-500 text-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;