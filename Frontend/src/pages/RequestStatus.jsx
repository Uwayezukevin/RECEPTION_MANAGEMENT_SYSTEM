// src/pages/RequestStatus.jsx - White Theme with Real-time Updates
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEnvelope,
  FaClipboardList,
  FaArrowLeft,
  FaSpinner,
  FaPhone,
  FaBuilding,
  FaUser,
  FaCopy,
  FaHome,
  FaBell,
  FaSync,
} from "react-icons/fa";
import { MdEmail, MdEvent } from "react-icons/md";
import API from "../service/api";
import toast from "react-hot-toast";
import logo from '../assets/image.png';

const RequestStatus = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const requestId = searchParams.get('id');

  // Fetch request details
  const fetchRequestDetails = async (id) => {
    try {
      setLoading(true);
      const response = await API.getRequestById(id);
      
      if (response.data.success) {
        setRequest(response.data.request);
        setVisitor(response.data.request.visitor);
        setLastUpdate(new Date());
      } else {
        toast.error("Request not found");
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      toast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time request updates
  const handleRequestUpdate = useCallback((updateData) => {
    console.log("Real-time update received:", updateData);
    
    if (updateData.request) {
      setRequest(updateData.request);
      setVisitor(updateData.request.visitor);
    } else if (updateData.status) {
      setRequest(prev => ({
        ...prev,
        status: updateData.status,
        notes: updateData.notes || prev.notes,
        ...(updateData.status === 'approved' && { approvedAt: updateData.updatedAt || new Date() }),
        ...(updateData.status === 'completed' && { completedAt: updateData.updatedAt || new Date() })
      }));
    }
    
    setLastUpdate(new Date());
    
    const statusMessages = {
      approved: "✅ Your request has been approved!",
      rejected: "❌ Your request has been rejected.",
      completed: "🎉 Your request has been completed!"
    };
    
    if (updateData.status && statusMessages[updateData.status]) {
      toast.success(statusMessages[updateData.status], {
        duration: 5000,
        icon: '🔔'
      });
    } else if (updateData.request?.status && statusMessages[updateData.request.status]) {
      toast.success(statusMessages[updateData.request.status], {
        duration: 5000,
        icon: '🔔'
      });
    }
  }, []);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails(requestId);
    } else {
      setLoading(false);
    }
  }, [requestId]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (requestId && request) {
      API.initVisitorSocket(requestId);
      
      const unsubscribe = API.onRequestUpdate(handleRequestUpdate);
      
      setIsConnected(true);
      console.log("Real-time updates enabled for request:", requestId);
      
      return () => {
        unsubscribe();
        API.disconnectVisitorSocket();
        setIsConnected(false);
      };
    }
  }, [requestId, request, handleRequestUpdate]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <FaClock className="text-yellow-500 text-3xl" />;
      case 'approved':
        return <FaCheckCircle className="text-green-500 text-3xl" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500 text-3xl" />;
      case 'completed':
        return <FaCheckCircle className="text-blue-500 text-3xl" />;
      default:
        return <FaClock className="text-gray-500 text-3xl" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'rejected':
        return "bg-red-100 text-red-800 border-red-200";
      case 'completed':
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const copyLink = () => {
    const link = `${window.location.origin}/request-status?id=${requestId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleRefresh = () => {
    fetchRequestDetails(requestId);
    toast.success("Refreshed!");
  };

  if (!requestId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-20 w-auto" />
          </div>
          <FaClipboardList className="text-gray-400 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Request ID</h2>
          <p className="text-gray-600 mb-6">Please provide a valid request ID to check status.</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaHome />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-20 w-auto" />
          </div>
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-20 w-auto" />
          </div>
          <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-6">The request you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FaHome />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <FaArrowLeft />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-3">
            {/* Real-time indicator */}
            {isConnected && (
              <div className="flex items-center space-x-1 text-green-600 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh"
            >
              <FaSync />
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaCopy />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* Last update timestamp */}
        {lastUpdate && (
          <div className="text-center mb-4 text-gray-500 text-sm">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {isConnected && " (auto-updates enabled)"}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with Logo */}
          <div className={`p-6 border-b ${getStatusColor(request.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full">
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <img 
                        src={logo} 
                        alt="Logo" 
                        className="w-12 h-12 object-cover rounded-[10px]"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Request Status</h1>
                  <p className="text-sm text-gray-500">
                    ID: #{request._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                  {request.status.toUpperCase()}
                </span>
                {getStatusIcon(request.status)}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Service Details */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FaClipboardList className="text-primary-600" />
                <span>Service Details</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Service Name</p>
                  <p className="font-semibold text-gray-800">
                    {request.service?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-semibold text-gray-800 flex items-center space-x-1">
                    <MdEvent className="text-gray-400" />
                    <span>{formatDate(request.eventDate)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted On</p>
                  <p className="font-semibold text-gray-800 flex items-center space-x-1">
                    <FaClock className="text-gray-400" />
                    <span>{formatDate(request.createdAt)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Visitor Details */}
            {visitor && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <FaUser className="text-primary-600" />
                  <span>Visitor Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-800">{visitor.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Institution</p>
                    <p className="font-semibold text-gray-800 flex items-center space-x-1">
                      <FaBuilding className="text-gray-400 text-sm" />
                      <span>{visitor.institution}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800 flex items-center space-x-1">
                      <MdEmail className="text-gray-400" />
                      <span>{visitor.email}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-semibold text-gray-800 flex items-center space-x-1">
                      <FaPhone className="text-gray-400" />
                      <span>{visitor.contactType}: {visitor.contactValue}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            {request.message && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <FaEnvelope className="text-primary-600" />
                  <span>Your Message</span>
                </h3>
                <p className="text-gray-700 italic">"{request.message}"</p>
              </div>
            )}

            {/* Staff Notes */}
            {request.notes && (
              <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Staff Notes</h3>
                <p className="text-yellow-700">{request.notes}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle className="text-green-500 text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Request Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                  </div>
                </div>
                
                {request.approvedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-blue-500 text-sm" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Request Approved</p>
                      <p className="text-sm text-gray-500">{formatDate(request.approvedAt)}</p>
                    </div>
                  </div>
                )}
                
                {request.completedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-purple-500 text-sm" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Request Completed</p>
                      <p className="text-sm text-gray-500">{formatDate(request.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Status Message */}
            {isConnected && (
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <FaBell className="text-green-500 text-xl" />
                  <span className="text-green-700 font-medium">Real-time Updates Active</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-green-600">
                  This page will update automatically when your request status changes.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs">
                <img src={logo} alt="Logo" className="h-6 w-auto" />
                <span>Reception Management System</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestStatus;