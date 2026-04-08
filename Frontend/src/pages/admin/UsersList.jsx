// src/pages/admin/UsersList.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  FaUsers, 
  FaUserPlus, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff,
  FaSpinner,
  FaSearch,
  FaEnvelope,
  FaCalendarAlt
} from "react-icons/fa";
import { MdAdminPanelSettings, MdReception } from "react-icons/md";
import API from "../../service/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const UsersList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await API.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(error.response?.data?.msg || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        await API.delete(`/admin/users/${userId}`);
        toast.success(`User ${userName} deleted successfully`);
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error(error.response?.data?.msg || "Failed to delete user");
      }
    }
  };

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
          <MdAdminPanelSettings className="text-sm" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
        <MdReception className="text-sm" />
        Receptionist
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        Inactive
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage system users and their roles</p>
          </div>
          <Link
            to="/register-receptionist"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaUserPlus />
            Add New User
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <FaEnvelope className="text-xs" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.isActive)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <FaCalendarAlt className="text-xs" />
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          {user.isActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                        </button>
                        {user._id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user._id, user.fullName)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete User"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="text-5xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersList;