import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import router from "./routes/routes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import Notification from "./models/Notification.js";
import conn from "./config/db.js";
import Visitor from "./models/Visitor.js";
import Request from "./models/Request.js";
import Meeting from "./models/meeting.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://reception-management-system-kappa.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

app.use(cors({
  origin: function (origin, callback) {
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
});

// Socket Service Functions
const emitDashboardUpdate = async () => {
  try {
    const [totalVisitors, todayVisitors, totalRequests, pendingRequests, totalMeetings, upcomingMeetings, users] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({
        checkInTime: { $gte: new Date().setHours(0, 0, 0, 0) }
      }),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Meeting.countDocuments(),
      Meeting.countDocuments({ 
        status: 'scheduled',
        meetingDate: { $gte: new Date() }
      }),
      User.find()
    ]);

    const admins = users.filter(u => u.role === 'admin').length;
    const receptionists = users.filter(u => u.role === 'receptionist').length;

    io.emit('dashboard-update', {
      stats: {
        totalVisitors,
        todayVisitors,
        totalRequests,
        pendingRequests,
        totalMeetings,
        upcomingMeetings,
        totalUsers: users.length,
        totalAdmins: admins,
        totalReceptionists: receptionists,
        activeUsers: users.filter(u => u.isActive).length
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error emitting dashboard update:', error);
  }
};

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    socket.isVisitor = true;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.isStaff = true;
    next();
  } catch (err) {
    socket.isVisitor = true;
    next();
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId || "visitor");

  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    socket.join('admin_room');
  }

  socket.on("join-request-room", (requestId) => {
    if (requestId) {
      socket.join(`request_${requestId}`);
      socket.emit("joined-request-room", { requestId, success: true });
    }
  });

  socket.on("join-meeting-room", (meetingId) => {
    if (meetingId) {
      socket.join(`meeting_${meetingId}`);
      socket.emit("joined-meeting-room", { meetingId, success: true });
    }
  });

  socket.on("leave-request-room", (requestId) => {
    if (requestId) socket.leave(`request_${requestId}`);
  });

  socket.on("leave-meeting-room", (meetingId) => {
    if (meetingId) socket.leave(`meeting_${meetingId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId || "visitor");
  });
});

app.use((req, res, next) => {
  req.io = io;
  req.emitDashboardUpdate = emitDashboardUpdate;
  next();
});

app.use("/api", router);
app.use("/api/meetings", meetingRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      msg: "Request entity too large. Signature image may be too big."
    });
  }
  res.status(err.status || 500).json({
    success: false,
    msg: err.message || 'Internal server error'
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3400;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Real-time dashboard updates enabled`);
});

export default app;