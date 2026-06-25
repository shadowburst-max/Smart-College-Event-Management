import React, { useState, useEffect } from 'react';
import { cancelRegistration } from '../api/api';
import '../styles/StudentDashboard.css';

const StudentDashboard = ({ user }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            // Get registered event IDs from localStorage
            const registered = localStorage.getItem('registeredEvents');
            if (registered) {
                const eventIds = JSON.parse(registered);
                // In a real app, you'd fetch the full event details from the backend
                // For now, we'll just show the stored IDs
                setRegistrations(eventIds.map(id => ({ eventId: id, registeredAt: new Date() })));
            }
            setError('');
        } catch (err) {
            setError('Failed to load registrations.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (eventId) => {
        try {
            await cancelRegistration(eventId);
            const updated = registrations.filter(r => r.eventId !== eventId);
            setRegistrations(updated);
            
            // Update localStorage
            const registered = localStorage.getItem('registeredEvents');
            if (registered) {
                const eventIds = JSON.parse(registered).filter(id => id !== eventId);
                localStorage.setItem('registeredEvents', JSON.stringify(eventIds));
            }
        } catch (err) {
            setError(err.message || 'Failed to cancel registration.');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>My Dashboard</h2>
                <div className="user-info">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    {user.interests && user.interests.length > 0 && (
                        <p><strong>Interests:</strong> {user.interests.join(', ')}</p>
                    )}
                </div>
            </div>

            <div className="registrations-section">
                <h3>My Registrations</h3>
                {error && <div className="error-message">{error}</div>}
                {loading ? (
                    <p>Loading registrations...</p>
                ) : registrations.length === 0 ? (
                    <p>You haven't registered for any events yet. <a href="/">Browse events</a> to get started!</p>
                ) : (
                    <div className="registrations-list">
                        {registrations.map((registration) => (
                            <div key={registration.eventId} className="registration-item">
                                <div className="registration-details">
                                    <p><strong>Event ID:</strong> {registration.eventId}</p>
                                    <p><strong>Registered:</strong> {registration.registeredAt.toLocaleDateString()}</p>
                                </div>
                                <button
                                    className="cancel-btn"
                                    onClick={() => handleCancelRegistration(registration.eventId)}
                                >
                                    Cancel Registration
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
