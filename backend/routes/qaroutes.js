import express from 'express';
import { handleQA ,stopSpeech } from '../controllers/qaController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, handleQA);
router.post('/stop-speech', auth, stopSpeech);

export default router;