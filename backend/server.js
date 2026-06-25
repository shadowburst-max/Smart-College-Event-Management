import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import recommendationsRoutes from './routes/recommendationsRoutes.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
    logger.logError(`Error: ${err.message}`);
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ message, error: process.env.NODE_ENV === 'development' ? err : {} });
});

// Database connection
connectDB();

app.listen(PORT, () => {
    logger.logInfo(`Server is running on http://localhost:${PORT}`);
});