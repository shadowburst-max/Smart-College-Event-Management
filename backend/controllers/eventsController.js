import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { enrichEventWithAI } from '../services/geminiService.js';
import logger from '../utils/logger.js';

// Get all upcoming events with available seats
export const getEvents = async (req, res, next) => {
    try {
        const now = new Date();
        const events = await Event.find({
            eventDate: { $gt: now },
            seatsLeft: { $gt: 0 }
        }).sort({ eventDate: 1 });

        logger.logInfo(`Retrieved ${events.length} upcoming events`);
        res.status(200).json(events);
    } catch (error) {
        logger.logError(`Error retrieving events: ${error.message}`);
        next(error);
    }
};

// Get all events (admin view, including past/full events)
export const getAllEvents = async (req, res, next) => {
    try {
        const events = await Event.find().sort({ eventDate: -1 });
        res.status(200).json(events);
    } catch (error) {
        logger.logError(`Error retrieving all events: ${error.message}`);
        next(error);
    }
};

// Get a single event by ID
export const getEventById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        logger.logError(`Error retrieving event: ${error.message}`);
        next(error);
    }
};

// Create a new event (admin only) - with AI enrichment
export const createEvent = async (req, res, next) => {
    const { title, description, category, eventDate, maxSeats } = req.body;

    try {
        // Validate required fields
        if (!title || !description || !eventDate || !maxSeats) {
            return res.status(400).json({ message: 'Missing required fields: title, description, eventDate, maxSeats' });
        }

        // Call Gemini to enrich event with AI
        let summary, tags;
        try {
            const enrichedData = await enrichEventWithAI(title, description);
            summary = enrichedData.summary;
            tags = enrichedData.tags;
        } catch (aiError) {
            logger.logError(`AI enrichment failed, continuing with empty summary/tags: ${aiError.message}`);
            summary = '';
            tags = [];
        }

        // Create new event
        const newEvent = new Event({
            title,
            description,
            summary,
            tags,
            category,
            eventDate: new Date(eventDate),
            maxSeats,
            seatsLeft: maxSeats
        });

        await newEvent.save();
        logger.logInfo(`Event created by admin ${req.user._id}: ${title}`);

        res.status(201).json({
            message: 'Event created successfully',
            event: newEvent
        });
    } catch (error) {
        logger.logError(`Error creating event: ${error.message}`);
        next(error);
    }
};

// Edit an event (admin only)
export const updateEvent = async (req, res, next) => {
    const { id } = req.params;
    const { title, description, category, eventDate, maxSeats } = req.body;

    try {
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Re-enrich with AI if description changed
        if (description && description !== event.description) {
            try {
                const enrichedData = await enrichEventWithAI(title || event.title, description);
                event.summary = enrichedData.summary;
                event.tags = enrichedData.tags;
            } catch (aiError) {
                logger.logError(`AI enrichment failed during update: ${aiError.message}`);
            }
        }

        // Update fields
        if (title) event.title = title;
        if (description) event.description = description;
        if (category) event.category = category;
        if (eventDate) event.eventDate = new Date(eventDate);
        if (maxSeats) {
            // Adjust seatsLeft if maxSeats decreases
            const seatsDifference = maxSeats - event.maxSeats;
            event.maxSeats = maxSeats;
            event.seatsLeft = Math.max(0, event.seatsLeft + seatsDifference);
        }

        await event.save();
        logger.logInfo(`Event updated by admin ${req.user._id}: ${id}`);

        res.status(200).json({
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        logger.logError(`Error updating event: ${error.message}`);
        next(error);
    }
};

// Delete an event (admin only)
export const deleteEvent = async (req, res, next) => {
    const { id } = req.params;

    try {
        const event = await Event.findByIdAndDelete(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Also delete all registrations for this event
        await Registration.deleteMany({ event: id });

        logger.logInfo(`Event deleted by admin ${req.user._id}: ${id}`);

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        logger.logError(`Error deleting event: ${error.message}`);
        next(error);
    }
};

// Register for an event (atomic operation, race-condition safe)
export const registerForEvent = async (req, res, next) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    try {
        // Atomic update: decrement seatsLeft only if seatsLeft > 0
        const updatedEvent = await Event.findOneAndUpdate(
            { _id: eventId, seatsLeft: { $gt: 0 } },
            { $inc: { seatsLeft: -1 } },
            { new: true }
        );

        if (!updatedEvent) {
            // Either event doesn't exist, or seatsLeft was already 0
            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }
            return res.status(409).json({ message: 'No seats available for this event' });
        }

        // Create registration record
        try {
            const registration = new Registration({
                user: userId,
                event: eventId
            });
            await registration.save();
        } catch (regError) {
            if (regError.code === 11000) {
                // Duplicate key error: user already registered for this event
                // Undo the seat decrement
                await Event.findByIdAndUpdate(eventId, { $inc: { seatsLeft: 1 } });
                logger.logInfo(`Duplicate registration attempt by user ${userId} for event ${eventId}`);
                return res.status(409).json({ message: 'You are already registered for this event' });
            }
            throw regError;
        }

        logger.logInfo(`User ${userId} registered for event ${eventId}`);

        res.status(201).json({
            message: 'Successfully registered for event',
            seatsLeft: updatedEvent.seatsLeft
        });
    } catch (error) {
        logger.logError(`Error registering for event: ${error.message}`);
        next(error);
    }
};

// Cancel registration (student can cancel their own registration)
export const cancelRegistration = async (req, res, next) => {
    const { eventId } = req.params;
    const userId = req.user._id;

    try {
        // Find and delete the registration
        const registration = await Registration.findOneAndDelete({
            user: userId,
            event: eventId
        });

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Increment seatsLeft
        await Event.findByIdAndUpdate(eventId, { $inc: { seatsLeft: 1 } });

        logger.logInfo(`User ${userId} cancelled registration for event ${eventId}`);

        res.status(200).json({ message: 'Registration cancelled successfully' });
    } catch (error) {
        logger.logError(`Error cancelling registration: ${error.message}`);
        next(error);
    }
};

// Get registrations for an event (admin only)
export const getEventRegistrations = async (req, res, next) => {
    const { id } = req.params;

    try {
        const registrations = await Registration.find({ event: id })
            .populate('user', 'name email')
            .sort({ registeredAt: -1 });

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({
            event: {
                id: event._id,
                title: event.title,
                maxSeats: event.maxSeats,
                seatsLeft: event.seatsLeft,
                registrationCount: registrations.length
            },
            registrations
        });
    } catch (error) {
        logger.logError(`Error retrieving event registrations: ${error.message}`);
        next(error);
    }
};
