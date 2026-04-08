// routes/meetingRoutes.js
import express from 'express';
import { authenticate, authorizeReceptionist, authorizeAdmin } from '../middleware/Auth.js';
import * as meetingController from '../controllers/meetingController.js';

const meetingRouter = express.Router();

// ==================== PUBLIC ROUTES (No authentication) ====================
meetingRouter.post('/:meetingId/participants', meetingController.AddParticipant);
meetingRouter.get('/:id', meetingController.GetMeetingById);  // ✅ PUBLIC - no auth

// ==================== PROTECTED ROUTES ====================
meetingRouter.get('/stats', authenticate, authorizeAdmin, meetingController.GetMeetingStats);
meetingRouter.get('/upcoming', authenticate, authorizeReceptionist, meetingController.GetUpcomingMeetings);
meetingRouter.get('/', authenticate, authorizeReceptionist, meetingController.GetAllMeetings);
meetingRouter.post('/', authenticate, authorizeReceptionist, meetingController.CreateMeeting);
meetingRouter.put('/:id/status', authenticate, authorizeReceptionist, meetingController.UpdateMeetingStatus);
meetingRouter.get('/:id/participants', authenticate, authorizeReceptionist, meetingController.GetMeetingParticipants);
meetingRouter.get('/:id/export/csv', authenticate, authorizeReceptionist, meetingController.ExportMeetingToCSV);
meetingRouter.get('/:id/export/pdf', authenticate, authorizeReceptionist, meetingController.ExportMeetingToPDF);
meetingRouter.get('/:id/export/excel', authenticate, authorizeReceptionist, meetingController.ExportMeetingToExcel);
meetingRouter.get('/:id/export/html', authenticate, authorizeReceptionist, meetingController.ExportMeetingToHTML);

export default meetingRouter;