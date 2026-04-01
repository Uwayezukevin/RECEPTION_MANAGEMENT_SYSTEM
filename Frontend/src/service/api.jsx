// src/service/api.js
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";

class APIService {
  constructor() {
    this.api = axios.create({
      baseURL: "https://reception-management-system-pbrh.vercel.app/api",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    this.socket = null;
    this.notificationCallbacks = [];
    
    // Request interceptor - only add token for protected routes
    this.api.interceptors.request.use((config) => {
      // List of public endpoints that don't need authentication
      const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/services',
      ];
      
      // Check if this is a visitor request creation (public)
      const isVisitorRequest = config.method === 'post' && 
                               config.url?.match(/\/requests\/[a-f0-9]{24}$/);
      
      // Check if this is a visitor getting request by ID (public)
      const isGetRequestById = config.method === 'get' && 
                               config.url?.match(/\/requests\/[a-f0-9]{24}$/);
      
      // Check if this is visitor registration
      const isVisitorRegistration = config.method === 'post' && 
                                    config.url === '/visitors';
      
      // Check if this is getting visitor requests (protected for staff, but visitors can view their own)
      const isVisitorRequests = config.method === 'get' && 
                                config.url?.includes('/requests/visitor/');
      
      const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint)) ||
                       isVisitorRequest ||
                       isGetRequestById ||
                       isVisitorRegistration;
      
      // Only add token for non-public endpoints
      if (!isPublic) {
        const user = localStorage.getItem("user");
        if (user) {
          try {
            const userData = JSON.parse(user);
            if (userData.token) {
              config.headers.Authorization = `Bearer ${userData.token}`;
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
          }
        }
      }
      
      return config;
    });
    
    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Only redirect to login for 401 on protected endpoints
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const isProtected = !url.includes('/auth/') && 
                              !url.includes('/visitors') &&
                              !url.includes('/services') &&
                              !url.includes('/requests/');
          
          if (isProtected) {
            localStorage.removeItem("user");
            window.location.href = "/login";
            toast.error("Session expired. Please login again.");
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Initialize WebSocket connection for staff
  initSocket() {
    const user = localStorage.getItem("user");
    if (user && !this.socket) {
      try {
        const userData = JSON.parse(user);
        if (userData.token) {
          this.socket = io("https://reception-management-system-pbrh.vercel.app/", {
            auth: { token: userData.token },
            transports: ['websocket', 'polling'],
            withCredentials: true
          });
          
          this.socket.on("connect", () => {
            console.log("WebSocket connected");
          });
          
          this.socket.on("disconnect", () => {
            console.log("WebSocket disconnected");
          });
          
          this.socket.on("connect_error", (error) => {
            console.log("Socket connection error:", error.message);
          });
          
          this.socket.on("notification", (notification) => {
            this.notificationCallbacks.forEach(cb => cb(notification));
          });
        }
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    }
    return this.socket;
  }
  
  // Register notification callback for staff
  onNotification(callback) {
    this.notificationCallbacks.push(callback);
  }
  
  // Get socket instance
  getSocket() {
    return this.socket;
  }
  
  // ==================== AUTH ENDPOINTS ====================
  register = (data) => this.api.post("/auth/register", data);
  login = (data) => this.api.post("/auth/login", data);
  getCurrentUser = () => this.api.get("/auth/me");
  
  // ==================== VISITOR ENDPOINTS ====================
  createVisitor = (data) => {
    console.log("Creating visitor with data:", data);
    return this.api.post("/visitors", data);
  };
  
  getVisitors = (params) => this.api.get("/visitors", { params });
  getVisitorById = (id) => this.api.get(`/visitors/${id}`);
  getVisitorStats = () => this.api.get("/visitors/stats");
  checkoutVisitor = (id) => this.api.put(`/visitors/${id}/checkout`);
  
  // ==================== SERVICE ENDPOINTS ====================
  getServices = () => this.api.get("/services");
  createService = (data) => this.api.post("/services", data);
  updateService = (id, data) => this.api.put(`/services/${id}`, data);
  
  // ==================== REQUEST ENDPOINTS ====================
  // Public: Visitor creates a request
  createRequest = (visitorId, data) => {
    console.log("Creating request for visitor:", visitorId);
    return this.api.post(`/requests/${visitorId}`, data);
  };
  
  // Public: Get request by ID (for status page)
  getRequestById = (id) => {
    console.log("Getting request by ID:", id);
    return this.api.get(`/requests/${id}`);
  };
  
  // Protected: Get all requests (staff only)
  getAllRequests = (params) => this.api.get("/requests", { params });
  
  // Protected: Update request status (staff only)
  updateRequestStatus = (id, data) => this.api.put(`/requests/${id}/status`, data);
  
  // Protected: Get dashboard stats (staff only)
  getDashboardStats = () => this.api.get("/requests/dashboard-stats");
  
  // Protected: Get visitor requests (can be used by staff or visitor with token)
  getVisitorRequests = (visitorId) => this.api.get(`/requests/visitor/${visitorId}`);
  
  // ==================== NOTIFICATION ENDPOINTS ====================
  getNotifications = (unreadOnly = false) => 
    this.api.get(`/notifications?unreadOnly=${unreadOnly}`);
  markNotificationAsRead = (id) => this.api.put(`/notifications/${id}/read`);
  markAllNotificationsAsRead = () => this.api.put("/notifications/read-all");
}

const API = new APIService();
export default API;