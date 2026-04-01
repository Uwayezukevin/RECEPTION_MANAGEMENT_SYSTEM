import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import router from "./routes/routes.js";
import Notification from "./models/Notification.js";
import conn from "./config/db.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Express BEFORE routes
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://reception-management-system-kappa.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// Express CORS middleware - this should come before routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Socket.io CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  },
});

// Socket.io middleware for authentication (for staff)
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  // If no token, allow connection for visitors (they don't need auth)
  if (!token) {
    console.log('Socket connection: Visitor connection (no auth)');
    socket.isVisitor = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.isStaff = true;
    console.log('Socket authenticated for staff user:', socket.userId);
    next();
  } catch (err) {
    console.log('Socket authentication error:', err.message);
    // Don't reject - allow as visitor
    socket.isVisitor = true;
    next();
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.userId || "visitor");

  // Join user's personal room (for staff)
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`Staff ${socket.userId} joined room user_${socket.userId}`);
  }

  // Handle joining request room for real-time updates (visitors)
  socket.on("join-request-room", (requestId) => {
    if (requestId) {
      socket.join(`request_${requestId}`);
      console.log(`Socket joined request room: request_${requestId}`);
      
      // Send confirmation back to client
      socket.emit("joined-request-room", { requestId, success: true });
    }
  });

  // Handle leaving request room
  socket.on("leave-request-room", (requestId) => {
    if (requestId) {
      socket.leave(`request_${requestId}`);
      console.log(`Socket left request room: request_${requestId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId || "visitor");
  });
});

// Middleware to emit notifications and request updates in real-time
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Parse JSON bodies
app.use(express.json());

// Routes
app.use("/api", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3400;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`WebSocket URL: ws://localhost:${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`✅ Real-time updates enabled for requests`);
});

export default app;