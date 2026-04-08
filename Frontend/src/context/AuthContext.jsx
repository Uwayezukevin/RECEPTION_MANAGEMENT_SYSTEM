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
          // Update stored user with fresh data
          localStorage.setItem("user", JSON.stringify({
            user: response.data.user,
            token: userData.token
          }));
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
    // Setup socket for both receptionist and admin
    if (user && (user.role === 'receptionist' || user.role === 'admin')) {
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
    try {
      const response = await API.login({ email, password });
      console.log("Login response:", response.data);
      
      // Store both user and token
      const userData = {
        user: response.data.user,
        token: response.data.token
      };
      
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(response.data.user);
      
      // Show role-specific welcome message
      const roleMessage = response.data.user.role === 'admin' 
        ? 'Welcome Admin!' 
        : 'Welcome back, Receptionist!';
      
      toast.success(`${roleMessage} Login successful.`);
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.msg || "Login failed");
      throw error;
    }
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

  // Helper methods for role checking
  const isAdmin = () => user?.role === 'admin';
  const isReceptionist = () => user?.role === 'receptionist';
  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
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
    // Role helpers
    isAdmin,
    isReceptionist,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};