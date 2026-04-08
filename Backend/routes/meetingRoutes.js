// routes/meetingRoutes.js
import express from 'express';
import { authenticate, authorizeReceptionist, authorizeAdmin } from '../middleware/Auth.js';
import * as meetingController from '../controllers/meetingController.js';

const meetingRouter = express.Router();

// Public routes (for signing in to meetings - no auth needed)
meetingRouter.post('/:meetingId/participants', meetingController.AddParticipant);

// Protected routes (Receptionist or Admin can access)
meetingRouter.post('/', authenticate, authorizeReceptionist, meetingController.CreateMeeting);
meetingRouter.get('/', authenticate, authorizeReceptionist, meetingController.GetAllMeetings);
meetingRouter.get('/upcoming', authenticate, authorizeReceptionist, meetingController.GetUpcomingMeetings);
meetingRouter.get('/:id', authenticate, authorizeReceptionist, meetingController.GetMeetingById);
meetingRouter.get('/:id/participants', authenticate, authorizeReceptionist, meetingController.GetMeetingParticipants);
meetingRouter.put('/:id/status', authenticate, authorizeReceptionist, meetingController.UpdateMeetingStatus);

// Export routes (Receptionist or Admin can access)
meetingRouter.get('/:id/export/pdf', authenticate, authorizeReceptionist, meetingController.ExportMeetingToPDF);
meetingRouter.get('/:id/export/excel', authenticate, authorizeReceptionist, meetingController.ExportMeetingToExcel);
meetingRouter.get('/:id/export/html', authenticate, authorizeReceptionist, meetingController.ExportMeetingToHTML);

// Admin-only meeting stats
meetingRouter.get('/stats', authenticate, authorizeAdmin, meetingController.GetMeetingStats);

export default meetingRouter;