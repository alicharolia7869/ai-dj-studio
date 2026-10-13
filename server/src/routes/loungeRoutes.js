import express from 'express';
import {
  createLounge,
  getLounges,
  getLoungeById,
  joinLounge,
  leaveLounge,
  updateLoungeSettings,
  endLounge,
  getQueue,
  addToQueue,
  voteQueueTrack,
  reorderQueue,
  getAiSegue,
  getMessages,
  postMessage,
  getSentiment,
  askAiDj
} from '../controllers/loungeController.js';
import {
  createBattle,
  addCandidate,
  voteBattle,
  resolveBattle
} from '../controllers/soundclashController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Lounge Management
router.get('/', getLounges);
router.post('/', authenticate, createLounge);
router.get('/:loungeId', getLoungeById);
router.post('/:loungeId/join', authenticate, joinLounge);
router.post('/:loungeId/leave', authenticate, leaveLounge);
router.patch('/:loungeId/settings', authenticate, updateLoungeSettings);
router.post('/:loungeId/end', authenticate, endLounge);

// Queue Endpoints
router.get('/:loungeId/queue', getQueue);
router.post('/:loungeId/queue', authenticate, addToQueue);
router.post('/:loungeId/queue/:trackId/vote', authenticate, voteQueueTrack);
router.patch('/:loungeId/queue/reorder', authenticate, reorderQueue);
router.post('/:loungeId/ai/segue', authenticate, getAiSegue);

// Soundclash Battles
router.post('/:loungeId/soundclash', authenticate, createBattle);
router.post('/:loungeId/soundclash/:battleId/candidates', authenticate, addCandidate);
router.post('/:loungeId/soundclash/:battleId/vote', authenticate, voteBattle);
router.post('/:loungeId/soundclash/:battleId/resolve', authenticate, resolveBattle);

// Chat & AI Engine Endpoints
router.get('/:loungeId/messages', getMessages);
router.post('/:loungeId/messages', authenticate, postMessage);
router.get('/:loungeId/sentiment', getSentiment);
router.post('/:loungeId/ai/ask', authenticate, askAiDj);

export default router;
