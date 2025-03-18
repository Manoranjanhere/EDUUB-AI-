import mongoose from 'mongoose';

const studentDataSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  watchTime: {
    type: Number,  // In seconds
    default: 0
  },
  lastWatched: {
    type: Date,
    default: Date.now
  },
  questionsAsked: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index for faster lookups
studentDataSchema.index({ student: 1, video: 1 }, { unique: true });

export default mongoose.model('StudentData', studentDataSchema);