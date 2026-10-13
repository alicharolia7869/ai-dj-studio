import express from 'express';
import {
  getRecommendations,
  getHistory,
  getPreferences,
  updatePreferences,
  updateProfile,
  toggleLikeTrack
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/me/recommendations', authenticate, getRecommendations);
router.get('/me/history', authenticate, getHistory);
router.get('/me/preferences', authenticate, getPreferences);
router.patch('/me/preferences', authenticate, updatePreferences);
router.patch('/me/profile', authenticate, updateProfile);
router.post('/tracks/:trackId/like', authenticate, toggleLikeTrack);

export default router;
