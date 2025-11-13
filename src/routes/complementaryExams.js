import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getComplementaryExams,
  createComplementaryExam,
  updateComplementaryExam,
  deleteComplementaryExam,
  uploadExamFile,
  deleteExamFile
} from '../controllers/complementaryExamController.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();



const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/dicom',
    'application/x-dicom'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Complementary exam routes (all require authentication)
router.get('/patient/:patientId',  getComplementaryExams);
router.post('/', verifyAccessToken, createComplementaryExam);
router.put('/:examId', verifyAccessToken, updateComplementaryExam);
router.delete('/:examId', verifyAccessToken, deleteComplementaryExam);

// File upload and deletion routes
router.post('/:examId/files', verifyAccessToken, upload.single('file'),  uploadExamFile);
router.delete('/files/:fileId', verifyAccessToken, deleteExamFile);

export default router;
