// src/pages/VisitorsList.jsx - Updated with responsive design
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../service/api";
import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaEye,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaSpinner,
  FaDownload,
  FaUserPlus,
  FaSignOutAlt
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import toast from "react-hot-toast";

const VisitorsList = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, []);

  useEffect(() => {
    filterVisitors();
  }, [searchTerm, filterStatus, visitors]);

  const fetchVisitors = async () => {
    try {
      const res = await API.getVisitors();
      if (res.data.visitors) {
        const visitorsWithStatus = res.data.visitors.map(visitor => ({
          ...visitor,
          status: visitor.status || "checked-in",
        }));
        setVisitors(visitorsWithStatus);
        setFilteredVisitors(visitorsWithStatus);
      }
    } catch (error) {
      console.error("Error fetching visitors:", error);
      toast.error("Failed to fetch visitors");
    } finally {
      setLoading(false);
    }
  };

  const filterVisitors = () => {
    let filtered = [...visitors];

    if (searchTerm) {
      filtered = filtered.filter(visitor =>
        visitor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.contactValue?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(visitor => visitor.status === filterStatus);
    }

    setFilteredVisitors(filtered);
  };

  const handleViewVisitor = (visitor) => {
    setSelectedVisitor(visitor);
    setShowModal(true);
  };

  const handleCheckOut = async (visitorId) => {
    if (window.confirm("Check out this visitor?")) {
      try {
        const res = await API.checkoutVisitor(visitorId);
        toast.success(res.data.msg || "Visitor checked out successfully");
        fetchVisitors();
      } catch (error) {
        toast.error(error.response?.data?.msg || "Error checking out visitor");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'checked-in':
        return (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 inline-flex items-center space-x-1">
            <FaUserCheck className="text-xs sm:text-sm" />
            <span>Checked In</span>
          </span>
        );
      case 'checked-out':
        return (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 inline-flex items-center space-x-1">
            <FaUserTimes className="text-xs sm:text-sm" />
            <span>Checked Out</span>
          </span>
        );
      default:
        return (
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 inline-flex items-center space-x-1">
            <FaClock className="text-xs sm:text-sm" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const exportToCSV = () => {
    const headers = ["Full Name", "Institution", "Contact Type", "Contact Value", "Email", "Check In Time", "Status"];
    const csvData = filteredVisitors.map(visitor => [
      visitor.fullName,
      visitor.institution,
      visitor.contactType,
      visitor.contactValue,
      visitor.email,
      formatDate(visitor.checkInTime),
      visitor.status
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitors_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl sm:text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-base sm:text-lg">Loading visitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full p-2 sm:p-3">
                <FaUsers className="text-white text-base sm:text-xl" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Visitors List</h2>
                <p className="text-gray-500 text-xs sm:text-sm">Manage and track all registered visitors</p>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => navigate("/visitor-form")}
                className="flex-1 sm:flex-none bg-primary-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaUserPlus className="text-sm" />
                <span>New Visitor</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <FaDownload />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none text-sm"
              >
                <option value="all">All Visitors</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Summary - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Total Visitors</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{visitors.length}</h3>
              </div>
              <div className="bg-primary-100 rounded-full p-2 sm:p-3">
                <FaUsers className="text-primary-600 text-xl sm:text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Checked In</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {visitors.filter(v => v.status === "checked-in").length}
                </h3>
              </div>
              <div className="bg-green-100 rounded-full p-2 sm:p-3">
                <FaUserCheck className="text-green-600 text-xl sm:text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm">Checked Out</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {visitors.filter(v => v.status === "checked-out").length}
                </h3>
              </div>
              <div className="bg-gray-100 rounded-full p-2 sm:p-3">
                <FaUserTimes className="text-gray-600 text-xl sm:text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Visitors Grid - Responsive cards */}
        {filteredVisitors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
              <FaUsers className="text-gray-400 text-2xl sm:text-3xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No visitors found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVisitors.map((visitor) => (
              <div key={visitor._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg sm:text-xl font-bold">
                          {visitor.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{visitor.fullName}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
                          <FaBuilding className="text-xs flex-shrink-0" />
                          <span className="truncate">{visitor.institution || "N/A"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="sm:flex-shrink-0">
                      {getStatusBadge(visitor.status)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <FaPhone className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong>{visitor.contactType}:</strong> {visitor.contactValue}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <MdEmail className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{visitor.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                      <FaClock className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">Registered: {formatDate(visitor.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewVisitor(visitor)}
                      className="flex-1 bg-gray-100 text-gray-700 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1 text-sm"
                    >
                      <FaEye className="text-xs sm:text-sm" />
                      <span>View</span>
                    </button>
                    {visitor.status === "checked-in" && (
                      <button
                        onClick={() => handleCheckOut(visitor._id)}
                        className="flex-1 bg-red-50 text-red-600 px-2 sm:px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-1 text-sm"
                      >
                        <FaSignOutAlt className="text-xs sm:text-sm" />
                        <span>Check Out</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - Responsive */}
      {showModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95%] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Visitor Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-white text-2xl sm:text-3xl font-bold">
                    {selectedVisitor.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{selectedVisitor.fullName}</h3>
                <p className="text-xs sm:text-sm text-gray-500 break-all">ID: {selectedVisitor._id}</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <p className="text-sm sm:text-base text-gray-900 break-words">{selectedVisitor.institution || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <p className="text-sm sm:text-base text-gray-900 break-words">{selectedVisitor.contactType}: {selectedVisitor.contactValue}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm sm:text-base text-gray-900 break-words">{selectedVisitor.email}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Registered On</label>
                  <p className="text-sm sm:text-base text-gray-900">{formatDate(selectedVisitor.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(selectedVisitor.status)}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {selectedVisitor.status === "checked-in" && (
                <button
                  onClick={() => {
                    handleCheckOut(selectedVisitor._id);
                    setShowModal(false);
                  }}
                  className="w-full sm:flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <FaSignOutAlt />
                  <span>Check Out Visitor</span>
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsList;