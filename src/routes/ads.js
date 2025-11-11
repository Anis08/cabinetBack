import express from 'express';
import {
  getAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
  uploadAdFile,
  upload,
  sendAdImage
} from '../controllers/adsController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/', verifyAccessToken, getAds);
router.get('/:id', verifyAccessToken, getAdById);
router.post('/', verifyAccessToken, createAd);
router.put('/:id', verifyAccessToken, updateAd);
router.delete('/:id', verifyAccessToken, deleteAd);
router.get('/image/:fileId', sendAdImage);

// File upload route (with authentication)
router.post('/upload', verifyAccessToken, upload.single('file'), uploadAdFile);

export default router;
