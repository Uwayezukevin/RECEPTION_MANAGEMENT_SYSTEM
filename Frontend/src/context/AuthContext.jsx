// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import API from "../service/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    checkAuth();
    
    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupSocket();
      API.onNotification((notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/favicon.ico"
          });
        }
      });
    }
  }, [user]);

  const checkAuth = async () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Check if token exists
        if (!userData.token) {
          console.log("No token found in stored user");
          localStorage.removeItem("user");
          setUser(null);
          setLoading(false);
          return;
        }
        
        setUser(userData.user);
        
        // Verify token with backend
        try {
          const response = await API.getCurrentUser();
          setUser(response.data.user);
        } catch (err) {
          console.log("Token verification failed, logging out");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        setUser(null);
      }
    }
    setLoading(false);
  };

  const setupSocket = () => {
    // Only setup socket if user exists and is receptionist
    if (user && user.role === 'receptionist') {
      API.initSocket();
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await API.getNotifications();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.notifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const login = async (email, password) => {
    const response = await API.login({ email, password });
    console.log("Login response:", response.data);
    
    // Store both user and token
    const userData = {
      user: response.data.user,
      token: response.data.token
    };
    
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(response.data.user);
    toast.success("Login successful! Welcome back.");
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    if (API.getSocket()) {
      API.getSocket().disconnect();
    }
    toast.success("Logged out successfully");
  };

  const markNotificationRead = async (id) => {
    await API.markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await API.markAllNotificationsAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const value = {
    user,
    loading,
    login,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    fetchNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};