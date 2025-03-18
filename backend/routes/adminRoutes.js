import express from 'express';
import { getStudentProgress } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Admin route: ${req.method} ${req.originalUrl}`);
  next();
});

// Apply authentication protection to all routes
router.use(protect);

// Get all students progress
router.get('/student-progress', getStudentProgress);

export default router;