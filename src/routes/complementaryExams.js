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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for exam files storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/exams'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'exam-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDFs, images, and DICOM files
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/dicom',
    'application/x-dicom'
  ];

  // Also check file extension for DICOM files
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimes.includes(file.mimetype) || ext === '.dcm') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images (JPG, PNG, GIF), and DICOM files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Complementary exam routes (all require authentication)
router.get('/patient/:patientId', verifyAccessToken, getComplementaryExams);
router.post('/', verifyAccessToken, createComplementaryExam);
router.put('/:examId', verifyAccessToken, updateComplementaryExam);
router.delete('/:examId', verifyAccessToken, deleteComplementaryExam);

// File upload and deletion routes
router.post('/:examId/files', verifyAccessToken, upload.single('file'), uploadExamFile);
router.delete('/files/:fileId', verifyAccessToken, deleteExamFile);

export default router;
