import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        logger.logInfo('MongoDB connected successfully');
    } catch (error) {
        logger.logError(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;