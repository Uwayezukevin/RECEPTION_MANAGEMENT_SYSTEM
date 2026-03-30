// src/components/NotificationPanel.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { FaBell, FaCheck, FaTimes, FaClock, FaCheckCircle } from "react-icons/fa";

const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, markNotificationRead, markAllRead } = useAuth();

  const getNotificationIcon = (type) => {
    switch (type) {
      case "request_created":
        return <FaBell className="text-yellow-500" />;
      case "request_approved":
        return <FaCheckCircle className="text-green-500" />;
      case "request_rejected":
        return <FaTimes className="text-red-500" />;
      case "request_completed":
        return <FaCheckCircle className="text-blue-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
      }
    }
    return "Just now";
  };

  return (
    <div className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl z-50 animate-slide-down">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FaBell className="text-primary-500" />
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaBell className="mx-auto text-3xl mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                !notification.isRead ? "bg-blue-50" : ""
              }`}
              onClick={() => !notification.isRead && markNotificationRead(notification._id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                    <FaClock />
                    <span>{getTimeAgo(notification.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;