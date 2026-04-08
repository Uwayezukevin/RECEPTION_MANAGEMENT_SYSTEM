// routes/meetingRoutes.js
import express from 'express';
import { authenticate, authorizeReceptionist, authorizeAdmin } from '../middleware/Auth.js';
import * as meetingController from '../controllers/meetingController.js';

const meetingRouter = express.Router();

// ==================== PUBLIC ROUTES (No authentication required) ====================
// These are for participants to sign in and view meeting info
meetingRouter.post('/:meetingId/participants', meetingController.AddParticipant);
meetingRouter.get('/:id', meetingController.GetMeetingById);  // ✅ MOVED TO PUBLIC - NO AUTH NEEDED

// ==================== PROTECTED ROUTES (Authentication required) ====================
// Meeting CRUD
meetingRouter.post('/', authenticate, authorizeReceptionist, meetingController.CreateMeeting);
meetingRouter.get('/', authenticate, authorizeReceptionist, meetingController.GetAllMeetings);
meetingRouter.get('/upcoming', authenticate, authorizeReceptionist, meetingController.GetUpcomingMeetings);
meetingRouter.put('/:id/status', authenticate, authorizeReceptionist, meetingController.UpdateMeetingStatus);

// Participants (protected view)
meetingRouter.get('/:id/participants', authenticate, authorizeReceptionist, meetingController.GetMeetingParticipants);

// Export routes
meetingRouter.get('/:id/export/pdf', authenticate, authorizeReceptionist, meetingController.ExportMeetingToPDF);
meetingRouter.get('/:id/export/excel', authenticate, authorizeReceptionist, meetingController.ExportMeetingToExcel);
meetingRouter.get('/:id/export/html', authenticate, authorizeReceptionist, meetingController.ExportMeetingToHTML);

// Admin-only meeting stats
meetingRouter.get('/stats', authenticate, authorizeAdmin, meetingController.GetMeetingStats);

export default meetingRouter;