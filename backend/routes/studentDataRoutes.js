import express from 'express';
import { trackWatchTime, trackQuestion, getStudentData } from '../controllers/StudentDataController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Add the protect middleware to ALL routes
router.use(protect);

// Track video watching time
router.post('/track', trackWatchTime);

// Track questions asked
router.post('/track-question', trackQuestion);

// Get student's data
router.get('/me', getStudentData);

export default router;