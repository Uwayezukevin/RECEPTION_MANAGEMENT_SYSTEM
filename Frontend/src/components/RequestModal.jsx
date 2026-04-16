// src/components/RequestModal.jsx
import React, { useState } from "react";
import {
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCalendarAlt,
  FaCommentDots,
  FaPaperPlane,
  FaSpinner,
  FaClipboardList
} from "react-icons/fa";
import { MdEvent, MdPriorityHigh } from "react-icons/md";
import toast from "react-hot-toast";

const RequestModal = ({ request, onClose, onUpdateStatus }) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(null);

  const handleStatusUpdate = async (status) => {
    if (status === "rejected" && !notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setActionType(status);
    
    try {
      await onUpdateStatus(request._id, status, notes);
      toast.success(`Request ${status} successfully!`);
      onClose();
    } catch (error) {
      toast.error(`Failed to ${status} request`);
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <FaClipboardList className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Request Details</h2>
              <p className="text-sm text-gray-500">ID: {request._id?.slice(-8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                {request.status?.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(request.priority)}`}>
                <MdPriorityHigh className="inline mr-1" />
                {request.priority?.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-1">
              <FaClock />
              <span>Created: {formatDate(request.createdAt)}</span>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <FaClipboardList className="text-primary-500" />
              <span>Service Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Service Name</label>
                <p className="font-medium text-gray-800">{request.service?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Event Date</label>
                <p className="font-medium text-gray-800 flex items-center space-x-1">
                  <FaCalendarAlt className="text-gray-400 text-sm" />
                  <span>{formatDate(request.eventDate)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Visitor Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <FaUser className="text-primary-500" />
              <span>Visitor Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <p className="font-medium text-gray-800">{request.visitor?.fullName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium text-gray-800 flex items-center space-x-1">
                  <FaEnvelope className="text-gray-400 text-sm" />
                  <span>{request.visitor?.email}</span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Contact</label>
                <p className="font-medium text-gray-800 flex items-center space-x-1">
                  <FaPhone className="text-gray-400 text-sm" />
                  <span>{request.visitor?.contactType}: {request.visitor?.contactValue}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Message */}
          {request.message && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <FaCommentDots className="text-primary-500" />
                <span>Additional Message</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">{request.message}</p>
            </div>
          )}

          {/* Approval Information (if approved) */}
          {(request.approvedBy || request.approvedAt) && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center space-x-2">
                <FaCheckCircle className="text-green-600" />
                <span>Approval Information</span>
              </h3>
              <div className="space-y-2">
                {request.approvedBy && (
                  <div>
                    <label className="text-sm text-green-700">Approved By</label>
                    <p className="font-medium text-green-800">{request.approvedBy?.fullName}</p>
                  </div>
                )}
                {request.approvedAt && (
                  <div>
                    <label className="text-sm text-green-700">Approved At</label>
                    <p className="font-medium text-green-800">{formatDate(request.approvedAt)}</p>
                  </div>
                )}
                {request.completedAt && (
                  <div>
                    <label className="text-sm text-green-700">Completed At</label>
                    <p className="font-medium text-green-800">{formatDate(request.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Input (for rejection) */}
          {request.status === "pending" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Notes (Required for rejection)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Add notes or reason for rejection..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          {request.status === "pending" && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleStatusUpdate("approved")}
                disabled={loading}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && actionType === "approved" ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheckCircle />
                )}
                <span>Approve Request</span>
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={loading}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && actionType === "rejected" ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaTimesCircle />
                )}
                <span>Reject Request</span>
              </button>
            </div>
          )}

          {request.status === "approved" && (
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleStatusUpdate("completed")}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && actionType === "completed" ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheckCircle />
                )}
                <span>Mark as Completed</span>
              </button>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <FaTimes />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;