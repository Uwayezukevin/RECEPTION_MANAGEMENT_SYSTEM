// routes/meetingRoutes.js
import express from 'express';
import { authenticate, authorizeReceptionist, authorizeAdmin } from '../middleware/Auth.js';
import * as meetingController from '../controllers/meetingController.js';

const meetingRouter = express.Router();

// ==================== PUBLIC ROUTES (No authentication) ====================
// For participants to sign in
meetingRouter.post('/:meetingId/participants', meetingController.AddParticipant);
meetingRouter.get('/:id', meetingController.GetMeetingById);

// ==================== PROTECTED ROUTES (Admin & Receptionist) ====================
// View meetings - Both can view
meetingRouter.get('/', authenticate, authorizeReceptionist, meetingController.GetAllMeetings);
meetingRouter.get('/upcoming', authenticate, authorizeReceptionist, meetingController.GetUpcomingMeetings);
meetingRouter.get('/:id/participants', authenticate, authorizeReceptionist, meetingController.GetMeetingParticipants);

// ==================== ADMIN-ONLY MEETING ROUTES ====================
// Create, update, delete meetings - Only Admin
meetingRouter.post('/', authenticate, authorizeAdmin, meetingController.CreateMeeting);
meetingRouter.put('/:id/status', authenticate, authorizeAdmin, meetingController.UpdateMeetingStatus);
meetingRouter.delete('/:id', authenticate, authorizeAdmin, meetingController.DeleteMeeting);

// Export routes - Only Admin
meetingRouter.get('/:id/export/pdf', authenticate, authorizeAdmin, meetingController.ExportMeetingToPDF);
meetingRouter.get('/:id/export/excel', authenticate, authorizeAdmin, meetingController.ExportMeetingToExcel);
meetingRouter.get('/:id/export/html', authenticate, authorizeAdmin, meetingController.ExportMeetingToHTML);
meetingRouter.get('/:id/export/csv', authenticate, authorizeAdmin, meetingController.ExportMeetingToCSV);

// Stats - Only Admin
meetingRouter.get('/stats', authenticate, authorizeAdmin, meetingController.GetMeetingStats);

export default meetingRouter;