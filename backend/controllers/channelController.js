import Channel from '../models/Channel.js';
import User from '../models/User.js';

export const createChannel = async (req, res) => {
  try {
    const { channelName, description } = req.body;
    const channel = new Channel({
      owner: req.user._id,
      channelName,
      description
    });
    await channel.save();
    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('videos');
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateChannel = async (req, res) => {
  try {
    const channel = await Channel.findOneAndUpdate(
      { owner: req.user._id },
      { $set: req.body },
      { new: true }
    );
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const subscribeToChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check if already subscribed
    if (channel.subscribers.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    channel.subscribers.push(req.user._id);
    channel.subscriberCount += 1;
    await channel.save();

    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};