import express from 'express';
import {
  getTracks,
  getTrackById,
  getTrackAcousticProfile,
  createTrack,
  updateTrack,
  deleteTrack
} from '../controllers/trackController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadAudio } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getTracks);
router.get('/:trackId', getTrackById);
router.get('/:trackId/acoustic-profile', getTrackAcousticProfile);

// Admin-protected track catalog management
router.post('/', authenticate, authorize('admin', 'host'), uploadAudio.single('audio'), createTrack);
router.patch('/:trackId', authenticate, authorize('admin'), updateTrack);
router.delete('/:trackId', authenticate, authorize('admin'), deleteTrack);

export default router;
