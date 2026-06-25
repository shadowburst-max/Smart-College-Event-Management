/**
 * Recommendation service using tag-overlap algorithm.
 * Computes personalized event recommendations based on student interests.
 */

export const getRecommendedEvents = (userInterests, upcomingEvents, topN = 5) => {
    const interestSet = new Set(userInterests.map(i => i.toLowerCase()));

    const scored = upcomingEvents.map(event => {
        const eventTags = (event.tags || []).map(t => t.toLowerCase());
        const matchScore = eventTags.filter(tag => interestSet.has(tag)).length;
        return { event, matchScore };
    });

    return scored
        .filter(({ matchScore }) => matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, topN)
        .map(({ event }) => event);
};

/**
 * Get popular upcoming events for cold-start users (no interests).
 * Returns events ordered by creation date (most recent first).
 */
export const getPopularEvents = (upcomingEvents, topN = 5) => {
    return upcomingEvents
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, topN);
};
