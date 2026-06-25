import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: token ? `Bearer ${token}` : '',
    };
};

// Auth endpoints
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Events endpoints
export const getEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/events`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getEventById = async (eventId) => {
    try {
        const response = await axios.get(`${API_URL}/events/${eventId}`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getAllEvents = async () => {
    try {
        const response = await axios.get(`${API_URL}/events/admin/all`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const createEvent = async (eventData) => {
    try {
        const response = await axios.post(`${API_URL}/events`, eventData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateEvent = async (eventId, eventData) => {
    try {
        const response = await axios.patch(`${API_URL}/events/${eventId}`, eventData, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const deleteEvent = async (eventId) => {
    try {
        const response = await axios.delete(`${API_URL}/events/${eventId}`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const registerForEvent = async (eventId) => {
    try {
        const response = await axios.post(
            `${API_URL}/events/${eventId}/register`,
            {},
            { headers: getHeaders() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const cancelRegistration = async (eventId) => {
    try {
        const response = await axios.delete(`${API_URL}/events/${eventId}/register`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getEventRegistrations = async (eventId) => {
    try {
        const response = await axios.get(`${API_URL}/events/${eventId}/registrations`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getRecommendations = async (limit = 5) => {
    try {
        const response = await axios.get(`${API_URL}/recommendations?limit=${limit}`, {
            headers: getHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};