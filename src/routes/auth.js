import express from 'express';

import { signup, login, refreshToken, logout } from '../controllers/authController.js';
import { verifyRefreshToken } from '../middleware/verifyRefreshToken.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/refresh-token', verifyRefreshToken, refreshToken);
router.get('/logout', logout)

export default router;
