import express from 'express';
import { handleQA } from '../controllers/qaController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, handleQA);

export default router;