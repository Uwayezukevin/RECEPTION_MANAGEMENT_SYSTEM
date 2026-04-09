// routes/routes.js - Proper Role-Based Access Control
import express from 'express';
import { authenticate, authorizeReceptionist, authorizeAdmin } from '../middleware/Auth.js';
import * as authController from '../controllers/authController.js';
import * as visitorController from '../controllers/visitorController.js';
import * as requestController from '../controllers/requestController.js';
import * as serviceController from '../controllers/serviceController.js';
import * as notificationController from '../controllers/notificationController.js';
import meetingRouter from './meetingRoutes.js';

const router = express.Router();

// ==================== PUBLIC ROUTES (No Auth) ====================
router.post('/visitors', visitorController.CreateVisitor);
router.post('/visitors-with-request', visitorController.CreateVisitorWithRequest);
router.get('/services', serviceController.GetAllServices);
router.post('/auth/register', authController.RegisterUser);
router.post('/auth/login', authController.LoginUser);
router.post('/requests/:visitorId', requestController.CreateRequest);
router.get('/requests/:id', requestController.GetRequestById);

// ==================== PROTECTED ROUTES (Auth Required) ====================
router.get('/auth/me', authenticate, authController.GetCurrentUser);

// ==================== ADMIN-ONLY ROUTES (Strictly Admin Only) ====================
// User Management - ONLY ADMIN
router.get('/admin/users', authenticate, authorizeAdmin, authController.GetAllUsers);
router.put('/admin/users/:id/status', authenticate, authorizeAdmin, authController.UpdateUserStatus);
router.delete('/admin/users/:id', authenticate, authorizeAdmin, authController.DeleteUser);

// ==================== VISITOR ROUTES (Admin & Receptionist) ====================
router.get('/visitors', authenticate, authorizeReceptionist, visitorController.GetVisitors);
router.get('/visitors/stats', authenticate, authorizeReceptionist, visitorController.GetVisitorStats);
router.get('/visitors/checked-in', authenticate, authorizeReceptionist, visitorController.GetCheckedInVisitors);
router.get('/visitors/search', authenticate, authorizeReceptionist, visitorController.SearchVisitors);
router.get('/visitors/history/:identifier', authenticate, authorizeReceptionist, visitorController.GetVisitorHistory);
router.get('/visitors/:id', authenticate, authorizeReceptionist, visitorController.GetVisitorById);
router.put('/visitors/:id/checkout', authenticate, authorizeReceptionist, visitorController.CheckOutVisitor);

// ==================== REQUEST ROUTES (Admin & Receptionist) ====================
router.get('/requests', authenticate, authorizeReceptionist, requestController.GetAllRequests);
router.get('/requests/dashboard-stats', authenticate, authorizeReceptionist, requestController.GetDashboardStats);
router.get('/requests/visitor/:visitorId', authenticate, authorizeReceptionist, requestController.GetVisitorRequests);
router.put('/requests/:id/status', authenticate, authorizeReceptionist, requestController.UpdateRequestStatus);

// ==================== NOTIFICATION ROUTES (Admin & Receptionist) ====================
router.get('/notifications', authenticate, authorizeReceptionist, notificationController.GetMyNotifications);
router.get('/notifications/count', authenticate, authorizeReceptionist, notificationController.GetNotificationCount);
router.put('/notifications/:id/read', authenticate, authorizeReceptionist, notificationController.MarkAsRead);
router.put('/notifications/read-all', authenticate, authorizeReceptionist, notificationController.MarkAllAsRead);
router.delete('/notifications/:id', authenticate, authorizeReceptionist, notificationController.DeleteNotification);

// ==================== MEETING ROUTES (Admin & Receptionist) ====================
// Receptionists can view meetings and sign in participants
// Admins have full meeting management access (defined in meetingRoutes)
router.use('/meetings', meetingRouter);

export default router;