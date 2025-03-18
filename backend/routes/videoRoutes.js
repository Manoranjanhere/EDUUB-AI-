import express from 'express';
import { auth, teacherAuth } from '../middleware/auth.js';
import { protect } from '../middleware/authMiddleware.js'; 
import { upload, uploadVideo, getVideos, getVideo, deleteVideo } from '../controllers/videoController.js';

const router = express.Router();

// Important: The order of middleware matters
router.post('/upload', auth, teacherAuth, upload, uploadVideo);
router.get('/', getVideos);
router.get('/:id', getVideo);
router.delete('/:id', protect, deleteVideo);

export default router;