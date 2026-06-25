import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import {
    getEvents,
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    getEventRegistrations
} from '../controllers/eventsController.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/', getEvents);

// All other routes require authentication
router.use(authMiddleware);

// Student routes
router.get('/:id', getEventById);
router.post('/:eventId/register', registerForEvent);
router.delete('/:eventId/register', cancelRegistration);

// Admin routes
router.get('/admin/all', requireAdmin, getAllEvents);
router.post('/', requireAdmin, createEvent);
router.patch('/:id', requireAdmin, updateEvent);
router.delete('/:id', requireAdmin, deleteEvent);
router.get('/:id/registrations', requireAdmin, getEventRegistrations);

export default router;
