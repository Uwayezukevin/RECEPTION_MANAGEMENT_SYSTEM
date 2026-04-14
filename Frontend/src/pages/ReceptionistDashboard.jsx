// src/pages/ReceptionistDashboard.jsx - White Theme, Services Table Only
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
  FaSync,
  FaUserCheck,
  FaUserTimes,
  FaBuilding,
  FaBars,
  FaTimes as FaTimesIcon,
  FaBriefcase
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
  const [activeTab, setActiveTab] = useState("services");
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
  
  // Service search state
  const [serviceSearch, setServiceSearch] = useState("");

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
      setServices(servicesRes.data.Services || servicesRes.data.services || []);

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
    if (requests.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const data = requests.map((r) => ({
      "Request ID": r._id.slice(-8).toUpperCase(),
      "Service": r.service?.name || "N/A",
      "Visitor": r.visitor?.fullName || "N/A",
      "Email": r.visitor?.email || "N/A",
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

  // Filter services based on search
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                          service.description?.toLowerCase().includes(serviceSearch.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <img src={logo} alt="Logo" className="h-16 w-auto mx-auto mb-4" />
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation - White Theme */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src={logo} alt="Logo" className="h-8 sm:h-10 w-auto" />
              <div className="hidden sm:block">
                <h2 className="text-gray-800 text-base sm:text-xl font-bold">
                  Receptionist Dashboard
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Manage visitors and service requests
                </p>
              </div>
              <div className="sm:hidden">
                <h2 className="text-gray-800 text-sm font-bold">Dashboard</h2>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden text-gray-600 p-2"
            >
              {mobileMenuOpen ? <FaTimesIcon size={20} /> : <FaBars size={20} />}
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center space-x-2 lg:space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 text-gray-700 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                <span className="hidden lg:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate("/register-receptionist")}
                className="bg-green-600 text-white px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <FaUserPlus />
                <span className="hidden lg:inline">Add Receptionist</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowNotification(!showNotification)}
                  className="bg-gray-100 text-gray-700 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm"
                >
                  <FaBell />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {stats.pendingRequests}
                  </span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <FaUserCircle className="text-gray-500 text-xl lg:text-2xl" />
                <span className="text-gray-700 text-sm hidden lg:inline">Receptionist: {user?.fullName}</span>
                <span className="text-gray-700 text-sm lg:hidden">{user?.fullName?.split(' ')[0]}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <FaSignOutAlt />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-3 space-y-2 border-t border-gray-100">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <FaSync className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => navigate("/register-receptionist")}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <FaUserPlus />
                <span>Add Receptionist</span>
              </button>
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards - White Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 lg:p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 lg:p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 lg:p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 lg:p-6 border border-gray-100">
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

        {/* Tabs - White Theme */}
        <div className="flex flex-wrap space-x-1 sm:space-x-2 mb-4 sm:mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab("services")}
            className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              activeTab === "services"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaBriefcase />
            <span>Services ({services.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              activeTab === "requests"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaClipboardList />
            <span>Requests ({requests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("visitors")}
            className={`px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${
              activeTab === "visitors"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaUsers />
            <span>Visitors ({visitors.filter(v => v.status === "checked-in").length})</span>
          </button>
        </div>

        {/* Services Section - Table Format (Display Only) */}
        {activeTab === "services" && (
          <div>
            {/* Service Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 border border-gray-100">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search services by name or description..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaBriefcase className="text-gray-400 text-3xl sm:text-4xl" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                    {serviceSearch ? "No Matching Services Found" : "No Services Available"}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base text-center max-w-md">
                    {serviceSearch 
                      ? `No services match "${serviceSearch}". Try a different search term.`
                      : "There are no services available at the moment. Please check back later."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredServices.map((service, index) => (
                        <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 text-sm">
                            {index + 1}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center space-x-2">
                              <FaBriefcase className="text-primary-500 text-sm" />
                              <span className="font-semibold text-gray-900 text-sm">{service.name}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 text-sm">
                            {service.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Footer with Count */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {filteredServices.length} of {services.length} service{services.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requests Table */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Search and Filters */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by service, visitor or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                </div>
                
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400 text-sm" />
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
                  className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <FaDownload />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Requests Found</h3>
                <p className="text-gray-500">There are no service requests to display.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className="font-medium text-gray-900 text-sm">{request.service?.name?.substring(0, 20) || 'N/A'}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{request.visitor?.fullName || 'N/A'}</p>
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
            )}
          </div>
        )}

        {/* Visitors Section - Grid View */}
        {activeTab === "visitors" && (
          <div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div>
                <h3 className="text-gray-800 text-base sm:text-lg font-semibold">Current Visitors</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Visitors currently checked in</p>
              </div>
              <button
                onClick={() => navigate("/visitor-service")}
                className="bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary-700 transition-all duration-200 flex items-center space-x-2 shadow-md text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <FaPlusCircle />
                <span>Create New Visitor</span>
              </button>
            </div>

            {visitors.filter((v) => v.status === "checked-in").length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
                <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Visitors Checked In</h3>
                <p className="text-gray-500">There are currently no visitors checked in.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {visitors.filter((v) => v.status === "checked-in").map((visitor) => (
                  <div key={visitor._id} className="bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-all border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                      className="w-full bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <FaUserTimes />
                      <span>Check Out</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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