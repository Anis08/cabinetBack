import express from 'express';
import { getWaitingLine, getWaitingLineStats } from '../controllers/publicController.js';
import { getActiveAds } from '../controllers/adsController.js';

const router = express.Router();

// Public endpoints - no authentication required
router.get('/waiting-line', getWaitingLine);
router.get('/waiting-line/stats', getWaitingLineStats);
router.get('/ads', getActiveAds);

export default router;
