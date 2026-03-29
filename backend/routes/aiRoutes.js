import express from 'express';
import { generateJobDescription, generateCoverLetter } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

const router = express.Router();

// Employer AI Routes
router.post('/generate-job-desc', protect, authorize('employer', 'admin'), generateJobDescription);

// Job Seeker AI Routes
router.post('/generate-cover-letter', protect, authorize('jobseeker', 'admin'), generateCoverLetter);

export default router;
