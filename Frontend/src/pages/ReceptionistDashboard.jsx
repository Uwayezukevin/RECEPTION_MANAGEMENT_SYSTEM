// src/pages/ReceptionistDashboard.jsx - Improved with Horizontal Filters
import React, { useEffect, useState, useCallback } from "react";
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
  FaSpinner,
  FaEnvelope,
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
  FaBriefcase,
  FaQrcode
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalVisitors: 0,
    checkedInVisitors: 0,
    completedToday: 0,
    approvedToday: 0,
  });

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      const [requestsRes, visitorsRes, servicesRes] = await Promise.all([
        API.getAllRequests({ status: statusFilter }),
        API.getVisitors(),
        API.getServices(),
      ]);

      let filteredRequests = requestsRes.data.requests || [];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredRequests = filteredRequests.filter(req => 
          req.service?.name?.toLowerCase().includes(query) ||
          req.visitor?.fullName?.toLowerCase().includes(query) ||
          req.visitor?.email?.toLowerCase().includes(query)
        );
      }
      
      if (dateFilter) {
        const filterDate = new Date(dateFilter).toDateString();
        filteredRequests = filteredRequests.filter(req => 
          new Date(req.eventDate).toDateString() === filterDate
        );
      }
      
      setRequests(filteredRequests);
      setVisitors(visitorsRes.data.visitors || []);
      setServices(servicesRes.data.Services || servicesRes.data.services || []);

      const allRequests = requestsRes.data.requests || [];
      const today = new Date().toDateString();
      
      setStats({
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter(r => r.status === "pending").length,
        totalVisitors: visitorsRes.data.visitors?.length || 0,
        checkedInVisitors: visitorsRes.data.visitors?.filter(v => v.status === "checked-in").length || 0,
        completedToday: allRequests.filter(r => r.status === "completed" && new Date(r.completedAt || r.updatedAt).toDateString() === today).length,
        approvedToday: allRequests.filter(r => r.status === "approved" && new Date(r.approvedAt || r.updatedAt).toDateString() === today).length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery, dateFilter]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

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
      toast.error("Failed to update request status");
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleCheckoutVisitor = async (visitorId) => {
    if (window.confirm("Are you sure you want to check out this visitor?")) {
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
    
    const headers = ["Request ID", "Service", "Visitor", "Email", "Phone", "Status", "Event Date", "Submitted"];
    const rows = requests.map(r => [
      r._id.slice(-8).toUpperCase(),
      r.service?.name || "N/A",
      r.visitor?.fullName || "N/A",
      r.visitor?.email || "N/A",
      r.visitor?.contactValue || "N/A",
      r.status,
      new Date(r.eventDate).toLocaleDateString(),
      new Date(r.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
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

  const filteredServices = services.filter(service => 
    service.name?.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="Logo" className="h-12 mx-auto mb-4 animate-pulse" />
          <FaSpinner className="animate-spin text-3xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Logo" className="h-6 w-6 object-cover" />
              <div className="hidden sm:block">
                <h2 className="text-gray-800 text-sm font-semibold">Receptionist Dashboard</h2>
                <p className="text-gray-400 text-xs">Manage visitors and service requests</p>
              </div>
            </div>
            
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-gray-600 p-2">
              {mobileMenuOpen ? <FaTimesIcon size={18} /> : <FaBars size={18} />}
            </button>
            
            <div className="hidden sm:flex items-center space-x-2">
              <button onClick={handleRefresh} disabled={refreshing} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center space-x-1.5 text-xs transition">
                <FaSync className={refreshing ? "animate-spin" : ""} size={12} />
                <span>Refresh</span>
              </button>
              <button onClick={() => navigate("/visitor-qrcode")} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center space-x-1.5 text-xs transition">
                <FaQrcode size={12} /> <span>Visitor QR</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center space-x-1.5 text-xs transition relative"
                >
                  <FaBell size={12} />
                  {stats.pendingRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {stats.pendingRequests}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800 text-xs">Notifications</h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-2 hover:bg-gray-50 cursor-pointer">
                        <p className="text-xs text-gray-600">You have {stats.pendingRequests} pending request{stats.pendingRequests !== 1 ? 's' : ''}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Click to view</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{user?.fullName?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-gray-600 text-xs">{user?.fullName?.split(' ')[0]}</span>
              </div>
              <button onClick={logout} className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 flex items-center space-x-1.5 text-xs transition">
                <FaSignOutAlt size={12} /> <span>Logout</span>
              </button>
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className="sm:hidden py-2 space-y-1.5 border-t border-gray-100">
              <button onClick={handleRefresh} className="w-full bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 text-sm">
                <FaSync /> <span>Refresh</span>
              </button>
              <button onClick={() => navigate("/visitor-qrcode")} className="w-full bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 text-sm">
                <FaQrcode /> <span>Visitor QR</span>
              </button>
              <button onClick={logout} className="w-full bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center space-x-2 text-sm">
                <FaSignOutAlt /> <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs">Total Requests</p><h3 className="text-xl font-bold text-gray-800">{stats.totalRequests}</h3></div>
              <div className="bg-blue-100 p-1.5 rounded-full"><FaClipboardList className="text-blue-600 text-sm" /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs">Pending</p><h3 className="text-xl font-bold text-gray-800">{stats.pendingRequests}</h3></div>
              <div className="bg-yellow-100 p-1.5 rounded-full"><FaClock className="text-yellow-600 text-sm" /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs">Approved Today</p><h3 className="text-xl font-bold text-gray-800">{stats.approvedToday}</h3></div>
              <div className="bg-green-100 p-1.5 rounded-full"><FaCheckCircle className="text-green-600 text-sm" /></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-xs">Checked In</p><h3 className="text-xl font-bold text-gray-800">{stats.checkedInVisitors}</h3></div>
              <div className="bg-purple-100 p-1.5 rounded-full"><FaUserCheck className="text-purple-600 text-sm" /></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4 border-b border-gray-200 pb-2">
          {[
            { id: "services", label: "Services", icon: FaBriefcase, count: services.length },
            { id: "requests", label: "Requests", icon: FaClipboardList, count: requests.length },
            { id: "visitors", label: "Visitors", icon: FaUsers, count: visitors.filter(v => v.status === "checked-in").length }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 text-xs transition-all ${activeTab === tab.id ? "bg-primary-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <tab.icon size={12} /> 
              <span>{tab.label}</span> 
              <span className={`text-[10px] ml-0.5 px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Services Tab */}
        {activeTab === "services" && (
          <div>
            <div className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-gray-100">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input 
                  type="text" 
                  placeholder="Search services by name..." 
                  value={serviceSearch} 
                  onChange={(e) => setServiceSearch(e.target.value)} 
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition" 
                />
              </div>
            </div>
            {filteredServices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
                <FaBriefcase className="text-4xl text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-600">No Services Found</h3>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Service Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredServices.map((service, idx) => (
                        <tr key={service._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2 text-gray-500 text-xs">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <FaBriefcase className="text-primary-500 text-xs" />
                              <span className="font-medium text-gray-800 text-xs">{service.name}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-[10px] text-gray-500">Showing {filteredServices.length} of {services.length} services</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab - Horizontal Filters */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              {/* Horizontal Filter Layout */}
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[10px] text-gray-500 mb-1">Search</label>
                  <div className="relative">
                    <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input 
                      type="text" 
                      placeholder="Service, visitor or email..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none transition" 
                    />
                  </div>
                </div>
                <div className="w-36">
                  <label className="block text-[10px] text-gray-500 mb-1">Event Date</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input 
                      type="date" 
                      value={dateFilter} 
                      onChange={(e) => setDateFilter(e.target.value)} 
                      className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none transition" 
                    />
                  </div>
                </div>
                <div className="w-36">
                  <label className="block text-[10px] text-gray-500 mb-1">Status</label>
                  <div className="flex items-center gap-1">
                    <FaFilter className="text-gray-400 text-xs" />
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)} 
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 outline-none transition bg-white"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={exportData} 
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-xs transition mt-[18px]"
                  >
                    <FaDownload size={10} /> Export CSV
                  </button>
                </div>
              </div>
            </div>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <FaClipboardList className="text-4xl text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-600">No Requests Found</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Visitor</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Event Date</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 transition">
                        <td className="px-3 py-2 text-xs"><span className="font-medium text-gray-800">{req.service?.name || 'N/A'}</span></td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-800 text-xs">{req.visitor?.fullName || 'N/A'}</p>
                            <p className="text-[10px] text-gray-500">{req.visitor?.email}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{new Date(req.eventDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => handleViewRequest(req)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition" title="View Details">
                              <FaEye size={12} />
                            </button>
                            {req.status === "pending" && (
                              <>
                                <button onClick={() => handleUpdateStatus(req._id, "approved")} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                                  <FaCheckCircle size={12} />
                                </button>
                                <button onClick={() => handleUpdateStatus(req._id, "rejected", "Request rejected by receptionist")} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject">
                                  <FaTimes size={12} />
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

        {/* Visitors Tab */}
        {activeTab === "visitors" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-gray-800 text-sm font-semibold">Current Visitors</h3>
                <p className="text-gray-400 text-[10px]">Visitors currently checked in at the reception</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate("/visitor-qrcode")} 
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 text-xs transition"
                >
                  <FaQrcode size={12} /> Visitor QR
                </button>
                <button 
                  onClick={() => navigate("/visitor-service")} 
                  className="bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 flex items-center gap-1.5 text-xs transition"
                >
                  <FaPlusCircle size={12} /> New Visitor
                </button>
              </div>
            </div>
            {visitors.filter(v => v.status === "checked-in").length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
                <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-600">No Visitors Checked In</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visitors.filter(v => v.status === "checked-in").map((visitor) => (
                  <div key={visitor._id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{visitor.fullName?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-xs">{visitor.fullName}</h4>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
                          <FaUserCheck size={8} /> Checked In
                        </span>
                      </div>
                      <div className="space-y-1 mb-2">
                        <p className="text-[10px] text-gray-600 flex items-center gap-1.5 truncate">
                          <FaEnvelope className="text-gray-400" size={10} /> 
                          <span className="truncate">{visitor.email}</span>
                        </p>
                        <p className="text-[10px] text-gray-600 flex items-center gap-1.5">
                          <FaClock className="text-gray-400" size={10} /> 
                          Checked in: {new Date(visitor.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleCheckoutVisitor(visitor._id)} 
                        className="w-full bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 flex items-center justify-center gap-1.5 text-[10px] transition"
                      >
                        <FaUserTimes size={10} /> Check Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showRequestModal && selectedRequest && <RequestModal request={selectedRequest} onClose={() => setShowRequestModal(false)} onUpdateStatus={handleUpdateStatus} />}
    </div>
  );
};

export default ReceptionistDashboard;