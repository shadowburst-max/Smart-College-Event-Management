import React, { useState, useEffect } from 'react';
import {
    getAllEvents,
    getEventRegistrations,
    createEvent,
    updateEvent,
    deleteEvent,
} from '../api/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedEventForRoster, setSelectedEventForRoster] = useState(null);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [rosterData, setRosterData] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        eventDate: '',
        maxSeats: '',
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await getAllEvents();
            setEvents(data);
            setError('');
        } catch (err) {
            setError('Failed to load events. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                await updateEvent(editingEventId, formData);
            } else {
                await createEvent(formData);
            }
            await fetchEvents();
            setFormData({ title: '', description: '', category: '', eventDate: '', maxSeats: '' });
            setShowCreateForm(false);
            setEditingEventId(null);
        } catch (err) {
            setError(err.message || 'Operation failed. Please try again.');
        }
    };

    const handleEdit = (event) => {
        setFormData({
            title: event.title,
            description: event.description,
            category: event.category || '',
            eventDate: event.eventDate.split('T')[0],
            maxSeats: event.maxSeats,
        });
        setEditingEventId(event._id);
        setShowCreateForm(true);
    };

    const handleDelete = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteEvent(eventId);
                await fetchEvents();
            } catch (err) {
                setError(err.message || 'Failed to delete event. Please try again.');
            }
        }
    };

    const handleViewRoster = async (eventId) => {
        try {
            setRosterLoading(true);
            const data = await getEventRegistrations(eventId);
            setRosterData(data);
            setSelectedEventForRoster(eventId);
        } catch (err) {
            setError('Failed to load roster. Please try again.');
        } finally {
            setRosterLoading(false);
        }
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setEditingEventId(null);
        setFormData({ title: '', description: '', category: '', eventDate: '', maxSeats: '' });
    };

    return (
        <div className="admin-dashboard-container">
            <h2>Admin Dashboard</h2>
            {error && <div className="error-message">{error}</div>}

            <div className="admin-controls">
                <button className="create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? 'Cancel' : '+ Create Event'}
                </button>
            </div>

            {showCreateForm && (
                <div className="create-form">
                    <h3>{editingEventId ? 'Edit Event' : 'Create New Event'}</h3>
                    <form onSubmit={handleCreateOrUpdate}>
                        <div className="form-group">
                            <label>Title:</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description:</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="4"
                            />
                        </div>
                        <div className="form-group">
                            <label>Category:</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Event Date:</label>
                            <input
                                type="date"
                                name="eventDate"
                                value={formData.eventDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Max Seats:</label>
                            <input
                                type="number"
                                name="maxSeats"
                                value={formData.maxSeats}
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                        <div className="form-buttons">
                            <button type="submit">{editingEventId ? 'Update' : 'Create'}</button>
                            <button type="button" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedEventForRoster && (
                <div className="roster-view">
                    <h3>{rosterData?.event?.title} - Registrations</h3>
                    <p>Total Registered: {rosterData?.registrations?.length || 0}</p>
                    <button onClick={() => setSelectedEventForRoster(null)} className="close-btn">
                        Close
                    </button>
                    {rosterLoading ? (
                        <p>Loading roster...</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Registered At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rosterData?.registrations?.map((registration) => (
                                    <tr key={registration._id}>
                                        <td>{registration.user.name}</td>
                                        <td>{registration.user.email}</td>
                                        <td>{new Date(registration.registeredAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <div className="events-section">
                <h3>All Events</h3>
                {loading ? (
                    <p>Loading events...</p>
                ) : events.length === 0 ? (
                    <p>No events yet. Create one to get started!</p>
                ) : (
                    <div className="events-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Date</th>
                                    <th>Seats Available</th>
                                    <th>Registrations</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event._id}>
                                        <td>{event.title}</td>
                                        <td>{new Date(event.eventDate).toLocaleDateString()}</td>
                                        <td>{event.seatsLeft} / {event.maxSeats}</td>
                                        <td>{event.maxSeats - event.seatsLeft}</td>
                                        <td>
                                            <button
                                                className="view-btn"
                                                onClick={() => handleViewRoster(event._id)}
                                            >
                                                View Roster
                                            </button>
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEdit(event)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(event._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
