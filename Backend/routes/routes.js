// routes/routes.js
import express from 'express';
import { authenticate, authorizeReceptionist } from '../middleware/Auth.js';
import * as authController from '../controllers/authController.js';
import * as visitorController from '../controllers/visitorController.js';
import * as requestController from '../controllers/requestController.js';
import * as serviceController from '../controllers/serviceController.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// ==================== PUBLIC ROUTES (No Auth) ====================
// Visitor registration - PUBLIC
router.post('/visitors', visitorController.CreateVisitor);

// Service list - PUBLIC (so visitors can see services before registering)
router.get('/services', serviceController.GetAllServices);

// Auth routes - PUBLIC
router.post('/auth/register', authController.RegisterUser);
router.post('/auth/login', authController.LoginUser);

// ==================== VISITOR REQUEST ROUTES (PUBLIC) ====================
// Visitors can create requests
router.post('/requests/:visitorId', requestController.CreateRequest);

// Visitors can view their request status (NO AUTH NEEDED)
router.get('/requests/:id', requestController.GetRequestById);

// ==================== PROTECTED ROUTES (Auth Required) ====================
router.get('/auth/me', authenticate, authController.GetCurrentUser);

// Visitor routes (protected - staff only)
router.get('/visitors', authenticate, authorizeReceptionist, visitorController.GetVisitors);
router.get('/visitors/stats', authenticate, authorizeReceptionist, visitorController.GetVisitorStats);
router.get('/visitors/checked-in', authenticate, authorizeReceptionist, visitorController.GetCheckedInVisitors);
router.get('/visitors/search', authenticate, authorizeReceptionist, visitorController.SearchVisitors);
router.get('/visitors/history/:identifier', authenticate, authorizeReceptionist, visitorController.GetVisitorHistory);
router.get('/visitors/:id', authenticate, authorizeReceptionist, visitorController.GetVisitorById);
router.put('/visitors/:id/checkout', authenticate, authorizeReceptionist, visitorController.CheckOutVisitor);

// Request routes (protected - staff only)
router.get('/requests', authenticate, authorizeReceptionist, requestController.GetAllRequests);
router.get('/requests/dashboard-stats', authenticate, authorizeReceptionist, requestController.GetDashboardStats);
router.get('/requests/visitor/:visitorId', authenticate, authorizeReceptionist, requestController.GetVisitorRequests);
router.put('/requests/:id/status', authenticate, authorizeReceptionist, requestController.UpdateRequestStatus);

// Notification routes (protected - staff only)
router.get('/notifications', authenticate, notificationController.GetMyNotifications);
router.get('/notifications/count', authenticate, notificationController.GetNotificationCount);
router.put('/notifications/:id/read', authenticate, notificationController.MarkAsRead);
router.put('/notifications/read-all', authenticate, notificationController.MarkAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.DeleteNotification);

export default router;