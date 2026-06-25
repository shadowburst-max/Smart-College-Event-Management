import Event from '../models/Event.js';
import { getRecommendedEvents, getPopularEvents } from '../services/recommendationService.js';
import logger from '../utils/logger.js';

// Get personalized recommendations for the logged-in student
export const getRecommendations = async (req, res, next) => {
    const userId = req.user._id;
    const topN = req.query.limit ? parseInt(req.query.limit) : 5;

    try {
        // Get all upcoming events with available seats
        const now = new Date();
        const upcomingEvents = await Event.find({
            eventDate: { $gt: now },
            seatsLeft: { $gt: 0 }
        }).sort({ eventDate: 1 });

        const user = req.user;
        let recommendations;

        // Check if user has interests (cold-start handling)
        if (!user.interests || user.interests.length === 0) {
            // Cold start: return popular/recent events
            logger.logInfo(`Cold-start recommendation for user ${userId} (no interests)`);
            recommendations = getPopularEvents(upcomingEvents, topN);
        } else {
            // Normal case: tag-overlap recommendation
            recommendations = getRecommendedEvents(user.interests, upcomingEvents, topN);
            logger.logInfo(`Recommendations computed for user ${userId} with interests: ${user.interests.join(', ')}`);
        }

        res.status(200).json({
            recommendations,
            totalUpcomingEvents: upcomingEvents.length,
            userInterests: user.interests || [],
            recommendationCount: recommendations.length
        });
    } catch (error) {
        logger.logError(`Error computing recommendations: ${error.message}`);
        next(error);
    }
};
