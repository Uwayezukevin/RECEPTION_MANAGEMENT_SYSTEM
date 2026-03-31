// src/pages/ReceptionistDashboard.jsx - Responsive version
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaClipboardList,
  FaCheckCircle,
  FaTimes,
  FaClock,
  FaEye,
  FaDownload,
  FaFilter,
  FaSignOutAlt,
  FaUserCircle,
  FaSpinner,
  FaChartBar,
  FaEnvelope,
  FaUserPlus,
  FaPlusCircle,
  FaSearch,
  FaCalendarAlt,
  FaBell,
  FaChartLine,
  FaSync,
  FaUserCheck,
  FaUserTimes,
  FaFileAlt,
  FaPrint,
  FaBuilding,
  FaBars,
  FaTimes as FaTimesIcon
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import API from "../service/api";
import RequestModal from "../components/RequestModal";
import toast from "react-hot-toast";
import logo from '../assets/image.png';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [filter, setFilter] = useState({
    status: "all",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalVisitors: 0,
    checkedInVisitors: 0,
    completedToday: 0,
    approvedToday: 0,
  });
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [filter, dateFilter, searchQuery]);

  const fetchAllData = async () => {
    try {
      const [requestsRes, visitorsRes, servicesRes] = await Promise.all([
        API.getAllRequests(filter),
        API.getVisitors(),
        API.getServices(),
      ]);

      let filteredRequests = requestsRes.data.requests || [];
      
      if (searchQuery) {
        filteredRequests = filteredRequests.filter(req => 
          req.service?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.visitor?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.visitor?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (dateFilter) {
        filteredRequests = filteredRequests.filter(req => {
          const reqDate = new Date(req.eventDate).toDateString();
          const filterDate = new Date(dateFilter).toDateString();
          return reqDate === filterDate;
        });
      }
      
      setRequests(filteredRequests);
      setVisitors(visitorsRes.data.visitors || []);
      setServices(servicesRes.data.services || []);

      const pending = requestsRes.data.requests?.filter((r) => r.status === "pending").length || 0;
      const today = new Date().toDateString();
      const completedToday = requestsRes.data.requests?.filter((r) => 
        r.status === "completed" && new Date(r.completedAt || r.updatedAt).toDateString() === today
      ).length || 0;
      const approvedToday = requestsRes.data.requests?.filter((r) => 
        r.status === "approved" && new Date(r.approvedAt || r.updatedAt).toDateString() === today
      ).length || 0;
      
      setStats({
        totalRequests: requestsRes.data.requests?.length || 0,
        pendingRequests: pending,
        totalVisitors: visitorsRes.data.visitors?.length || 0,
        checkedInVisitors: visitorsRes.data.visitors?.filter((v) => v.status === "checked-in").length || 0,
        completedToday,
        approvedToday,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    toast.success("Dashboard refreshed");
  };

  const handleUpdateStatus = async (requestId, newStatus, notes = "") => {
    try {
      await API.updateRequestStatus(requestId, { status: newStatus, notes });
      toast.success(`Request ${newStatus} successfully!`);
      fetchAllData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update request status");
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleCheckoutVisitor = async (visitorId) => {
    if (window.confirm("Check out this visitor?")) {
      try {
        await API.checkoutVisitor(visitorId);
        toast.success("Visitor checked out successfully");
        fetchAllData();
      } catch (error) {
        toast.error("Failed to check out visitor");
      }
    }
  };

  const exportData = () => {
    const data = requests.map((r) => ({
      "Request ID": r._id.slice(-8).toUpperCase(),
      "Service": r.service?.name,
      "Visitor": r.visitor?.fullName,
      "Email": r.visitor?.email,
      "Status": r.status,
      "Event Date": new Date(r.eventDate).toLocaleDateString(),
      "Submitted": new Date(r.createdAt).toLocaleString(),
      "Completed": r.completedAt ? new Date(r.completedAt).toLocaleString() : "N/A",
    }));

    const csvContent = [
      Object.keys(data[0] || {}).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'rejected': return <FaTimes className="text-red-500" />;
      case 'completed': return <FaCheckCircle className="text-blue-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 px-4">
        <div className="text-center">
          <img src={logo} alt="Logo" className="h-16 sm:h-20 w-auto mx-auto mb-4 sm:mb-6 animate-pulse" />
          <FaSpinner className="animate-spin text-4xl sm:text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-base sm:text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      {/* Navigation - Responsive */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src={logo} alt="Logo" className="h-8 sm:h-10 w-auto" />
              <div className="hidden sm:block">
                <h2 className="text-white text-base sm:text-xl font-bold">
                  Receptionist Dashboard
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">
                  Manage visitors and service requests
                </p>
              </div>
              <div className="sm:hidden">
                <h2 className="text-white text-sm font-bold">Dashboard</h2>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden text-white p-2"
            >
              {mobileMenuOpen ? <FaTimesIcon size={20} /> : <FaBars size={20} />}
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/20 text-white px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2 text-sm"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                <span className="hidden lg:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate("/register-receptionist")}
                className="bg-green-500/20 text-green-100 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2 text-sm"
              >
                <FaUserPlus />
                <span className="hidden lg:inline">Add Receptionist</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowNotification(!showNotification)}
                  className="bg-white/20 text-white px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2 text-sm"
                >
                  <FaBell />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {stats.pendingRequests}
                  </span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <FaUserCircle className="text-white text-xl lg:text-2xl" />
                <span className="text-white text-sm hidden lg:inline">Receptionist: {user?.fullName}</span>
                <span className="text-white text-sm lg:hidden">{user?.fullName?.split(' ')[0]}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-500/20 text-red-100 px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-2 text-sm"
              >
                <FaSignOutAlt />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-3 space-y-2 border-t border-white/20">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full bg-white/20 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => navigate("/register-receptionist")}
                className="w-full bg-green-500/20 text-green-100 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <FaUserPlus />
                <span>Add Receptionist</span>
              </button>
              <button
                onClick={logout}
                className="w-full bg-red-500/20 text-red-100 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Requests</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{stats.totalRequests}</h3>
              </div>
              <div className="bg-blue-100 rounded-full p-2 sm:p-3">
                <FaClipboardList className="text-blue-600 text-lg sm:text-xl lg:text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Pending Requests</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{stats.pendingRequests}</h3>
              </div>
              <div className="bg-yellow-100 rounded-full p-2 sm:p-3">
                <FaClock className="text-yellow-600 text-lg sm:text-xl lg:text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Today's Approved</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{stats.approvedToday}</h3>
              </div>
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <FaCheckCircle className="text-green-600 text-lg sm:text-xl lg:text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Checked In</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{stats.checkedInVisitors}</h3>
              </div>
              <div className="bg-purple-100 rounded-full p-2 sm:p-3">
                <FaUserCheck className="text-purple-600 text-lg sm:text-xl lg:text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters - Responsive */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by service, visitor or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400 text-sm" />
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={exportData}
              className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <FaDownload />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tabs - Responsive */}
        <div className="flex flex-wrap space-x-1 sm:space-x-2 mb-4 sm:mb-6 border-b border-white/20 pb-2">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              activeTab === "requests"
                ? "bg-white text-primary-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <FaClipboardList />
            <span>Requests ({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              activeTab === "visitors"
                ? "bg-white text-primary-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <FaUsers />
            <span>Visitors ({visitors.filter(v => v.status === "checked-in").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              activeTab === "services"
                ? "bg-white text-primary-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <FaChartBar />
            <span>Services ({services.length})</span>
          </button>
        </div>

        {/* Requests Table - Responsive */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.slice(0, 10).map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="font-medium text-gray-900 text-sm">{request.service?.name?.substring(0, 20)}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{request.visitor?.fullName}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{request.visitor?.email}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm">
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt className="text-gray-400 text-xs" />
                          <span>{new Date(request.eventDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.status)}
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye className="text-sm sm:text-base" />
                          </button>
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(request._id, "approved")}
                                className="p-1 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <FaCheckCircle className="text-sm sm:text-base" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(request._id, "rejected", "Request rejected by receptionist")}
                                className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <FaTimes className="text-sm sm:text-base" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Visitors Section - Responsive Grid */}
        {activeTab === "visitors" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-white text-base sm:text-lg font-semibold">Current Visitors</h3>
                <p className="text-white/70 text-xs sm:text-sm">Visitors currently checked in</p>
              </div>
              <button
                onClick={() => navigate("/visitor-registration")}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <FaPlusCircle />
                <span>Create New Visitor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {visitors.filter((v) => v.status === "checked-in").slice(0, 9).map((visitor) => (
                <div key={visitor._id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-base sm:text-xl font-bold">
                          {visitor.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{visitor.fullName}</h4>
                        <p className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
                          <FaBuilding className="text-xs flex-shrink-0" />
                          <span className="truncate">{visitor.institution}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 w-fit">
                      <FaUserCheck className="text-xs" />
                      <span>Checked In</span>
                    </span>
                  </div>
                  <div className="space-y-2 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center space-x-2 truncate">
                      <FaEnvelope className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{visitor.email}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center space-x-2">
                      <FaClock className="text-gray-400 flex-shrink-0" />
                      <span>Checked in: {new Date(visitor.checkInTime).toLocaleTimeString()}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckoutVisitor(visitor._id)}
                    className="w-full bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <FaUserTimes />
                    <span>Check Out</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setShowRequestModal(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default ReceptionistDashboard;