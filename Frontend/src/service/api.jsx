// src/service/api.js - Complete fixed version
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";

class APIService {
  constructor() {
    this.api = axios.create({
      baseURL: "https://reception-management-system.onrender.com/api",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    this.socket = null;
    this.visitorSocket = null;
    this.notificationCallbacks = [];
    this.requestUpdateCallbacks = [];
    
    // Request interceptor - FIXED (removed isGetParticipants from public)
    this.api.interceptors.request.use((config) => {
      const publicEndpoints = ['/auth/login', '/auth/register', '/services'];
      const isVisitorRequest = config.method === 'post' && config.url?.match(/\/requests\/[a-f0-9]{24}$/);
      const isGetRequestById = config.method === 'get' && config.url?.match(/\/requests\/[a-f0-9]{24}$/);
      const isVisitorRegistration = config.method === 'post' && config.url === '/visitors';
      const isVisitorWithRequest = config.method === 'post' && config.url === '/visitors-with-request';
      const isMeetingSignIn = config.method === 'post' && config.url?.match(/\/meetings\/[a-f0-9]{24}\/participants$/);
      const isGetMeeting = config.method === 'get' && config.url?.match(/\/meetings\/[a-f0-9]{24}$/);
      
      // isGetParticipants is REMOVED - now requires authentication
      
      const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint)) ||
                       isVisitorRequest ||
                       isGetRequestById ||
                       isVisitorRegistration ||
                       isVisitorWithRequest ||
                       isMeetingSignIn ||
                       isGetMeeting;
      
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
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const isProtected = !url.includes('/auth/') && 
                              !url.includes('/visitors') &&
                              !url.includes('/services') &&
                              !url.includes('/requests/') &&
                              !url.includes('/meetings/');
          
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
  
  // Initialize WebSocket for visitors
  initVisitorSocket(requestId) {
    if (this.visitorSocket) {
      this.visitorSocket.disconnect();
    }
    
    this.visitorSocket = io("https://reception-management-system.onrender.com/", {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      query: { requestId: requestId }
    });
    
    this.visitorSocket.on("connect", () => {
      console.log("Visitor WebSocket connected for request:", requestId);
      this.visitorSocket.emit("join-request-room", requestId);
    });
    
    this.visitorSocket.on("disconnect", () => {
      console.log("Visitor WebSocket disconnected");
    });
    
    this.visitorSocket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
    });
    
    this.visitorSocket.on("request-updated", (data) => {
      console.log("Request update received:", data);
      this.requestUpdateCallbacks.forEach(cb => cb(data));
    });
    
    return this.visitorSocket;
  }
  
  onRequestUpdate(callback) {
    this.requestUpdateCallbacks.push(callback);
    return () => {
      const index = this.requestUpdateCallbacks.indexOf(callback);
      if (index > -1) this.requestUpdateCallbacks.splice(index, 1);
    };
  }
  
  disconnectVisitorSocket() {
    if (this.visitorSocket) {
      this.visitorSocket.disconnect();
      this.visitorSocket = null;
    }
  }
  
  initSocket() {
    const user = localStorage.getItem("user");
    if (user && !this.socket) {
      try {
        const userData = JSON.parse(user);
        if (userData.token) {
          this.socket = io("https://reception-management-system.onrender.com/", {
            auth: { token: userData.token },
            transports: ['websocket', 'polling'],
            withCredentials: true
          });
          
          this.socket.on("connect", () => {
            console.log("Staff WebSocket connected");
          });
          
          this.socket.on("disconnect", () => {
            console.log("Staff WebSocket disconnected");
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
  
  onNotification(callback) {
    this.notificationCallbacks.push(callback);
  }
  
  getSocket() {
    return this.socket;
  }
  
  // ==================== API ENDPOINTS ====================
  
  // Auth & User
  register = (data) => this.api.post("/auth/register", data);
  login = (data) => this.api.post("/auth/login", data);
  getCurrentUser = () => this.api.get("/auth/me");
  
  // Visitors
  createVisitor = (data) => this.api.post("/visitors", data);
  createVisitorWithRequest = (data) => this.api.post("/visitors-with-request", data);
  getVisitors = (params) => this.api.get("/visitors", { params });
  getVisitorById = (id) => this.api.get(`/visitors/${id}`);
  getVisitorStats = () => this.api.get("/visitors/stats");
  checkoutVisitor = (id) => this.api.put(`/visitors/${id}/checkout`);
  
  // Services
  getServices = () => this.api.get("/services");
  createService = (data) => this.api.post("/services", data);
  updateService = (id, data) => this.api.put(`/services/${id}`, data);
  
  // Requests
  createRequest = (visitorId, data) => this.api.post(`/requests/${visitorId}`, data);
  getRequestById = (id) => this.api.get(`/requests/${id}`);
  getAllRequests = (params) => this.api.get("/requests", { params });
  updateRequestStatus = (id, data) => this.api.put(`/requests/${id}/status`, data);
  getDashboardStats = () => this.api.get("/requests/dashboard-stats");
  getVisitorRequests = (visitorId) => this.api.get(`/requests/visitor/${visitorId}`);
  
  // Notifications
  getNotifications = (unreadOnly = false) => this.api.get(`/notifications?unreadOnly=${unreadOnly}`);
  markNotificationAsRead = (id) => this.api.put(`/notifications/${id}/read`);
  markAllNotificationsAsRead = () => this.api.put("/notifications/read-all");
  
  // ==================== MEETING MANAGEMENT ====================
  createMeeting = (data) => this.api.post("/meetings", data);
  getMeetings = (params) => this.api.get("/meetings", { params });
  getMeetingById = (id) => this.api.get(`/meetings/${id}`);
  updateMeetingStatus = (id, data) => this.api.put(`/meetings/${id}/status`, data);
  addMeetingParticipant = (meetingId, data) => this.api.post(`/meetings/${meetingId}/participants`, data);
  getMeetingParticipants = (meetingId) => this.api.get(`/meetings/${meetingId}/participants`);
  getMeetingStats = () => this.api.get("/meetings/stats");
  getUpcomingMeetings = () => this.api.get("/meetings/upcoming");
  exportMeetingToPDF = (id) => this.api.get(`/meetings/${id}/export/pdf`, { responseType: 'blob' });
  exportMeetingToExcel = (id) => this.api.get(`/meetings/${id}/export/excel`, { responseType: 'blob' });
  exportMeetingToHTML = (id) => this.api.get(`/meetings/${id}/export/html`, { responseType: 'blob' });
}

const API = new APIService();
export default API;