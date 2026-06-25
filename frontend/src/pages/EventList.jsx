import React, { useState, useEffect } from 'react';
import { getEvents, registerForEvent, cancelRegistration } from '../api/api';
import '../styles/EventList.css';

const EventList = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registeredEventIds, setRegisteredEventIds] = useState(new Set());

    useEffect(() => {
        fetchEvents();
        // Load registered events from localStorage
        const registered = localStorage.getItem('registeredEvents');
        if (registered) {
            setRegisteredEventIds(new Set(JSON.parse(registered)));
        }
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await getEvents();
            setEvents(data);
            setError('');
        } catch (err) {
            setError('Failed to load events. Please try again.');
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
            // Refresh events to get updated seatsLeft
            await fetchEvents();
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
            // Refresh events to get updated seatsLeft
            await fetchEvents();
        } catch (err) {
            setError(err.message || 'Failed to cancel registration. Please try again.');
        }
    };

    return (
        <div className="event-list-container">
            <h2>Upcoming Events</h2>
            {error && <div className="error-message">{error}</div>}
            {loading ? (
                <p>Loading events...</p>
            ) : events.length === 0 ? (
                <p>No upcoming events available.</p>
            ) : (
                <div className="events-grid">
                    {events.map((event) => (
                        <div key={event._id} className="event-card">
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

export default EventList;
