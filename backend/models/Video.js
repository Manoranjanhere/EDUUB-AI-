import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    default: ""
  },
  language: {
    type: String,
    default: 'en'
  },
  cloudinaryVideoId: {
    type: String
  },
  cloudinaryAudioId: {
    type: String
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add this field to your Video schema
teacherEmail: {
  type: String,
  required: true
},
  channelName: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 60
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ teacher: 1, createdAt: -1 });
videoSchema.index({ channelName: 1 });

export default mongoose.model('Video', videoSchema);