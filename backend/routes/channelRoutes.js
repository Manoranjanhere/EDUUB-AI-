import express from 'express';
import { auth, teacherAuth } from '../middleware/auth.js';
import {
  createChannel,
  getChannel,
  updateChannel,
  subscribeToChannel
} from '../controllers/channelController.js';

const router = express.Router();

router.post('/', auth, teacherAuth, createChannel);
router.get('/:id', getChannel);
router.put('/', auth, teacherAuth, updateChannel);
router.post('/:id/subscribe', auth, subscribeToChannel);

export default router;