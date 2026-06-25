import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    summary: {
        type: String
    },
    tags: [String],
    category: {
        type: String
    },
    eventDate: {
        type: Date,
        required: true
    },
    maxSeats: {
        type: Number,
        required: true
    },
    seatsLeft: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index on eventDate and seatsLeft for efficient upcoming events query
eventSchema.index({ eventDate: 1, seatsLeft: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
