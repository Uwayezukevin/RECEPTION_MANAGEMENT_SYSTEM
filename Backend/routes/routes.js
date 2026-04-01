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

// ==================== PROTECTED ROUTES (Auth Required) ====================
router.get('/auth/me', authenticate, authController.GetCurrentUser);

// Visitor routes (protected)
router.get('/visitors',  visitorController.GetVisitors);
router.get('/visitors/stats',  visitorController.GetVisitorStats);
router.get('/visitors/checked-in',  visitorController.GetCheckedInVisitors);
router.get('/visitors/search',  visitorController.SearchVisitors);
router.get('/visitors/history/:identifier',  visitorController.GetVisitorHistory);
router.get('/visitors/:id', visitorController.GetVisitorById);
router.put('/visitors/:id/checkout',  visitorController.CheckOutVisitor);

// Request routes (protected)
router.post('/requests/:visitorId', requestController.CreateRequest);
router.get('/requests', authenticate, authorizeReceptionist, requestController.GetAllRequests);
router.get('/requests/dashboard-stats', authenticate, authorizeReceptionist, requestController.GetDashboardStats);
router.get('/requests/visitor/:visitorId', authenticate, requestController.GetVisitorRequests);
router.get('/requests/:id', authenticate, requestController.GetRequestById);
router.put('/requests/:id/status', authenticate, authorizeReceptionist, requestController.UpdateRequestStatus);

// Notification routes (protected)
router.get('/notifications', authenticate, notificationController.GetMyNotifications);
router.get('/notifications/count', authenticate, notificationController.GetNotificationCount);
router.put('/notifications/:id/read', authenticate, notificationController.MarkAsRead);
router.put('/notifications/read-all', authenticate, notificationController.MarkAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.DeleteNotification);

export default router;