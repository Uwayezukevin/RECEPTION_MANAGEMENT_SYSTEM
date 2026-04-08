// routes/meetingRoutes.js
import express from 'express';
import { authenticate, authorizeReceptionist, authorizeAdmin } from '../middleware/Auth.js';
import * as meetingController from '../controllers/meetingController.js';

const meetingRouter = express.Router();

// Public routes (for signing in to meetings - no auth needed)
router.post('/:meetingId/participants', meetingController.AddParticipant);

// Protected routes (Receptionist or Admin can access)
router.post('/', authenticate, authorizeReceptionist, meetingController.CreateMeeting);
router.get('/', authenticate, authorizeReceptionist, meetingController.GetAllMeetings);
router.get('/upcoming', authenticate, authorizeReceptionist, meetingController.GetUpcomingMeetings);
router.get('/:id', authenticate, authorizeReceptionist, meetingController.GetMeetingById);
router.get('/:id/participants', authenticate, authorizeReceptionist, meetingController.GetMeetingParticipants);
router.put('/:id/status', authenticate, authorizeReceptionist, meetingController.UpdateMeetingStatus);

// Export routes (Receptionist or Admin can access)
router.get('/:id/export/pdf', authenticate, authorizeReceptionist, meetingController.ExportMeetingToPDF);
router.get('/:id/export/excel', authenticate, authorizeReceptionist, meetingController.ExportMeetingToExcel);
router.get('/:id/export/html', authenticate, authorizeReceptionist, meetingController.ExportMeetingToHTML);

// Admin-only meeting stats
router.get('/stats', authenticate, authorizeAdmin, meetingController.GetMeetingStats);

export default meetingRouter;