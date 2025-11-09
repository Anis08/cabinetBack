import express from 'express';

import { seeResume, seeResumeFile, acceptResumeRequest } from '../controllers/adminController.js';
import { verifyRefreshToken } from '../middleware/verifyRefreshToken.js';
import { verifyAccessToken } from '../middleware/verifyAccessToken.js';

const router = express.Router();

router.get('/resume-request/:id', seeResume);
router.get('/resume-request/:id/file', seeResumeFile);
router.post('/accept-resume-request', acceptResumeRequest)



export default router;
