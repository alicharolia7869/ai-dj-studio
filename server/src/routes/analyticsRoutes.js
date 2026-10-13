import express from 'express';
import { getLoungeAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/lounges/:loungeId', getLoungeAnalytics);

export default router;
