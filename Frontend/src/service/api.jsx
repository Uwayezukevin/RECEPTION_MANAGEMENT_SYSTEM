// src/service/api.js
import axios from "axios";
import io from "socket.io-client";
import toast from "react-hot-toast";

class APIService {
  constructor() {
    // Use environment variable or fallback to deployed backend
    const baseURL = process.env.REACT_APP_API_URL || "https://reception-management-system.onrender.com/api/";
    
    console.log("API Base URL:", baseURL);
    
    this.api = axios.create({
      baseURL: baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout for slow connections
    });
    
    this.socket = null;
    this.notificationCallbacks = [];
    
    // Add token to requests
    this.api.interceptors.request.use(
      (config) => {
        // Log the request for debugging
        console.log(`📤 ${config.method?.toUpperCase()} request to: ${config.url}`);
        
        // Skip auth for public endpoints
        const publicEndpoints = ['/visitors', '/auth/login', '/auth/register', '/services'];
        const isPublic = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
        
        if (!isPublic) {
          const user = localStorage.getItem("user");
          if (user) {
            try {
              const userData = JSON.parse(user);
              if (userData.token) {
                console.log("✅ Adding token to request:", config.url);
                config.headers.Authorization = `Bearer ${userData.token}`;
              } else {
                console.log("⚠️ No token found for request:", config.url);
              }
            } catch (error) {
              console.error("Error parsing user data:", error);
            }
          } else {
            console.log("⚠️ No user in localStorage for request:", config.url);
          }
        }
        return config;
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );
    
    // Handle responses and token expiration
    this.api.interceptors.response.use(
      (response) => {
        console.log(`📥 Response from: ${response.config.url}`, "Status:", response.status);
        return response;
      },
      (error) => {
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          console.error("Request timeout:", error);
          toast.error("Request timeout. Please check your connection and try again.");
          return Promise.reject(error);
        }
        
        if (!error.response) {
          console.error("Network error - no response:", error);
          toast.error("Network error. Please check your internet connection and ensure the server is running.");
          return Promise.reject(error);
        }
        
        console.error("Response error:", error.response?.status, error.response?.data);
        
        // Handle different status codes
        switch (error.response?.status) {
          case 401:
            // Unauthorized - token expired or invalid
            const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                                   error.config?.url?.includes('/requests/') ||
                                   error.config?.url?.includes('/notifications/');
            
            if (isAuthEndpoint && !error.config?.url?.includes('/auth/login')) {
              localStorage.removeItem("user");
              toast.error("Session expired. Please login again.");
              
              // Don't redirect if we're already on login page
              if (!window.location.pathname.includes('/login')) {
                setTimeout(() => {
                  window.location.href = "/login";
                }, 2000);
              }
            }
            break;
            
          case 403:
            toast.error("You don't have permission to perform this action.");
            break;
            
          case 404:
            console.warn("Resource not found:", error.config?.url);
            toast.error("Requested resource not found.");
            break;
            
          case 500:
            toast.error("Server error. Please try again later.");
            break;
            
          default:
            // Show custom error message if available
            const errorMsg = error.response?.data?.msg || error.response?.data?.message || "An error occurred";
            toast.error(errorMsg);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Initialize WebSocket connection for staff
  initSocket() {
    const user = localStorage.getItem("user");
    const socketURL = process.env.REACT_APP_SOCKET_URL || "https://reception-management-system.onrender.com";
    
    if (user && !this.socket) {
      try {
        const userData = JSON.parse(user);
        if (userData.token) {
          console.log("Initializing WebSocket connection to:", socketURL);
          
          this.socket = io(socketURL, {
            auth: { token: userData.token },
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
          });
          
          this.socket.on("connect", () => {
            console.log("✅ WebSocket connected successfully");
          });
          
          this.socket.on("disconnect", (reason) => {
            console.log("❌ WebSocket disconnected:", reason);
            if (reason === "io server disconnect") {
              // Reconnect manually if server disconnected
              this.socket.connect();
            }
          });
          
          this.socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
            // Don't show toast for socket errors to avoid spam
          });
          
          this.socket.on("reconnect", (attemptNumber) => {
            console.log(`Socket reconnected after ${attemptNumber} attempts`);
          });
          
          this.socket.on("notification", (notification) => {
            console.log("📢 New notification received:", notification);
            this.notificationCallbacks.forEach(cb => cb(notification));
            
            // Show toast notification
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
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
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
            ), { duration: 5000 });
          });
        } else {
          console.log("No token found, skipping WebSocket initialization");
        }
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    } else if (!user) {
      console.log("No user logged in, skipping WebSocket initialization");
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
  
  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket disconnected");
    }
  }
  
  // Health check endpoint
  healthCheck = () => this.api.get("/health");
  
  // Auth endpoints
  register = (data) => {
    console.log("Registering user:", data.email);
    return this.api.post("/auth/register", data);
  };
  
  login = async (email, password) => {
    console.log("Logging in user:", email);
    try {
      const response = await this.api.post("/auth/login", { email, password });
      console.log("Login successful");
      return response;
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  };
  
  getCurrentUser = () => this.api.get("/auth/me");
  
  // Visitor endpoints
  createVisitor = (data) => {
    console.log("Creating visitor with data:", data);
    return this.api.post("/visitors", data);
  };
  
  getVisitors = (params) => {
    console.log("Fetching visitors with params:", params);
    return this.api.get("/visitors", { params });
  };
  
  getVisitorById = (id) => this.api.get(`/visitors/${id}`);
  getVisitorStats = () => this.api.get("/visitors/stats");
  checkoutVisitor = (id) => this.api.put(`/visitors/${id}/checkout`);
  
  // Service endpoints
  getServices = () => {
    console.log("Fetching services");
    return this.api.get("/services");
  };
  createService = (data) => this.api.post("/services", data);
  updateService = (id, data) => this.api.put(`/services/${id}`, data);
  
  // Request endpoints
  createRequest = (visitorId, data) => {
    console.log("Creating request for visitor:", visitorId);
    const user = localStorage.getItem("user");
    if (!user) {
      return this.api.post(`/requests/${visitorId}`, data);
    }
    return this.api.post(`/requests/${visitorId}`, data);
  };
  
  getAllRequests = (params) => {
    console.log("Fetching all requests with params:", params);
    return this.api.get("/requests", { params });
  };
  
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