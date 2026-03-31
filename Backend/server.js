// Backend/server.js - Simplified CORS
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();

// ==================== SIMPLIFIED CORS ====================
// Directly allow your frontend domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://reception-management-system-opal.vercel.app'
];

// Simple CORS middleware - no function, just direct
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
  }
};

// Import routes
import requestRoutes from './routes/requestRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Routes
app.use('/api/requests', requestRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Reception Management System API' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ 
    success: false, 
    msg: err.message || 'Internal Server Error' 
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3400;
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
  
  app.set('io', io);
  
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  });
}

// Export app for Vercel
export default app;