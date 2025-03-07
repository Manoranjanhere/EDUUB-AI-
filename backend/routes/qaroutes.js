import express from 'express';
import { handleQA, stopSpeech, startSpeech, stopSpeechBeacon } from '../controllers/qaController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, handleQA);
router.post('/stop-speech', auth, stopSpeech);
router.post('/speak', auth, startSpeech);
router.post('/stop-speech-beacon', stopSpeechBeacon); // No auth needed for cleanup

export default router;