// src/service/api.js (update the interceptors)
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";

class APIService {
  constructor() {
    this.api = axios.create({
      baseURL: "https://reception-management-system-backend-ebon.vercel.app/api",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    this.socket = null;
    this.notificationCallbacks = [];
    
    // Add token to requests
    this.api.interceptors.request.use((config) => {
      // Skip auth for public endpoints
      const publicEndpoints = ['/visitors', '/auth/login', '/auth/register', '/services'];
      const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
      
      if (!isPublic) {
        const user = localStorage.getItem("user");
        if (user) {
          try {
            const userData = JSON.parse(user);
            if (userData.token) {
              console.log("Adding token to request:", config.url);
              config.headers.Authorization = `Bearer ${userData.token}`;
            } else {
              console.log("No token found for request:", config.url);
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
          }
        } else {
          console.log("No user in localStorage for request:", config.url);
        }
      }
      return config;
    });
    
    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => {
        console.log("Response from:", response.config.url, "Status:", response.status);
        return response;
      },
      (error) => {
        console.error("Response error:", error.response?.status, error.response?.data);
        
        // Only redirect to login for 401 on protected endpoints
        if (error.response?.status === 401) {
          const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                                 error.config?.url?.includes('/requests/') ||
                                 error.config?.url?.includes('/notifications/');
          
          if (isAuthEndpoint) {
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
          this.socket = io("https://reception-management-system-backend-ebon.vercel.app/", {
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
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 text-lg">🔔</span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            ));
          });
        }
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
      
      return this.socket;
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
  
  // Auth endpoints
  register = (data) => this.api.post("/auth/register", data);
  login = (data) => this.api.post("/auth/login", data);
  getCurrentUser = () => this.api.get("/auth/me");
  
  // Visitor endpoints
  createVisitor = (data) => {
    console.log("Creating visitor with data:", data);
    return this.api.post("/visitors", data);
  };
  
  getVisitors = (params) => this.api.get("/visitors", { params });
  getVisitorById = (id) => this.api.get(`/visitors/${id}`);
  getVisitorStats = () => this.api.get("/visitors/stats");
  checkoutVisitor = (id) => this.api.put(`/visitors/${id}/checkout`);
  
  // Service endpoints
  getServices = () => this.api.get("/services");
  createService = (data) => this.api.post("/services", data);
  updateService = (id, data) => this.api.put(`/services/${id}`, data);
  
  // Request endpoints
  createRequest = (visitorId, data) => {
    const user = localStorage.getItem("user");
    if (!user) {
      return this.api.post(`/requests/${visitorId}`, data);
    }
    return this.api.post(`/requests/${visitorId}`, data);
  };
  
  getAllRequests = (params) => this.api.get("/requests", { params });
  getRequestById = (id) => this.api.get(`/requests/${id}`);
  updateRequestStatus = (id, data) => this.api.put(`/requests/${id}/status`, data);
  getDashboardStats = () => this.api.get("/requests/dashboard-stats");
  getVisitorRequests = (visitorId) => this.api.get(`/requests/visitor/${visitorId}`);
  
  // Notification endpoints
  getNotifications = (unreadOnly = false) => 
    this.api.get(`/notifications?unreadOnly=${unreadOnly}`);
  markNotificationAsRead = (id) => this.api.put(`/notifications/${id}/read`);
  markAllNotificationsAsRead = () => this.api.put("/notifications/read-all");
}

const API = new APIService();
export default API;