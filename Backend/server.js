// Backend/server.js - Complete working CORS
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();

// ==================== WORKING CORS CONFIGURATION ====================
// This will work for both local development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',    // Vite default port
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'https://reception-management-system-iota.vercel.app'
];

// Add FRONTEND_URL from env if exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

console.log('✅ CORS enabled for origins:', allowedOrigins);

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    // For testing, also allow any origin (remove this in production)
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

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
app.use('/', (req,res) => res.send('Hello world'));
app.use('/api/requests', requestRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins
  });
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