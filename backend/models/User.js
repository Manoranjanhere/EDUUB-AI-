import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  channelName: {
    type: String,
    required: function() { return this.role === 'teacher'; }
  },
  channelDescription: String,
  profileImage: String
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);