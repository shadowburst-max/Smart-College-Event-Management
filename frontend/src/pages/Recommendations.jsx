import React, { useState, useEffect } from 'react';
import { getRecommendations, registerForEvent, cancelRegistration } from '../api/api';
import '../styles/Recommendations.css';

const Recommendations = ({ user }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());

    useEffect(() => {
        fetchRecommendations();
        // Load registered events from localStorage
        const registered = localStorage.getItem('registeredEvents');
        if (registered) {
            setRegisteredEventIds(new Set(JSON.parse(registered)));
        }
    }, []);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const data = await getRecommendations(5);
            setRecommendations(data.recommendations || []);
            setError('');
        } catch (err) {
            setError('Failed to load recommendations. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        try {
            await registerForEvent(eventId);
            const updated = new Set(registeredEventIds);
            updated.add(eventId);
            setRegisteredEventIds(updated);
            localStorage.setItem('registeredEvents', JSON.stringify([...updated]));
            await fetchRecommendations();
        } catch (err) {
            setError(err.message || 'Failed to register. Please try again.');
        }
    };

    const handleCancel = async (eventId) => {
        try {
            await cancelRegistration(eventId);
            const updated = new Set(registeredEventIds);
            updated.delete(eventId);
            setRegisteredEventIds(updated);
            localStorage.setItem('registeredEvents', JSON.stringify([...updated]));
            await fetchRecommendations();
        } catch (err) {
            setError(err.message || 'Failed to cancel registration. Please try again.');
        }
    };

    return (
        <div className="recommendations-container">
            <h2>Recommended Events For You</h2>
            {user.interests && user.interests.length > 0 && (
                <p className="interests-info">
                    Based on your interests: <strong>{user.interests.join(', ')}</strong>
                </p>
            )}
            {error && <div className="error-message">{error}</div>}
            {loading ? (
                <p>Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
                <p>No recommendations available at this time. Try updating your interests or browsing all events.</p>
            ) : (
                <div className="recommendations-grid">
                    {recommendations.map((event, index) => (
                        <div key={event._id} className="recommendation-card">
                            <div className="rank">Top {index + 1}</div>
                            <h3>{event.title}</h3>
                            {event.summary && <p className="summary">{event.summary}</p>}
                            {event.tags && event.tags.length > 0 && (
                                <div className="tags">
                                    {event.tags.map((tag) => (
                                        <span key={tag} className="tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="date">
                                <strong>Date:</strong> {new Date(event.eventDate).toLocaleDateString()}
                            </p>
                            <p className="seats">
                                <strong>Seats Available:</strong> {event.seatsLeft} / {event.maxSeats}
                            </p>
                            {registeredEventIds.has(event._id) ? (
                                <button
                                    className="cancel-btn"
                                    onClick={() => handleCancel(event._id)}
                                >
                                    Cancel Registration
                                </button>
                            ) : (
                                <button
                                    className="register-btn"
                                    onClick={() => handleRegister(event._id)}
                                    disabled={event.seatsLeft === 0}
                                >
                                    {event.seatsLeft === 0 ? 'No Seats Available' : 'Register'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Recommendations;
