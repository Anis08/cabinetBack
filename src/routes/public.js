import express from 'express';
import { getWaitingLine, getWaitingLineStats } from '../controllers/publicController.js';

const router = express.Router();

// Public endpoints - no authentication required
router.get('/waiting-line', getWaitingLine);
router.get('/waiting-line/stats', getWaitingLineStats);

export default router;
