import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getRecommendations } from '../controllers/recommendationsController.js';

const router = express.Router();

// All recommendations require authentication
router.use(authMiddleware);

// Get personalized recommendations
router.get('/', getRecommendations);

export default router;
