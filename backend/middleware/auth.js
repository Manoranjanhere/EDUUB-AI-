import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const teacherAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied. Teachers only.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};