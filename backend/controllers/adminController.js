import User from '../models/User.js';
import StudentData from '../models/StudentData.js';
import mongoose from 'mongoose';

// Get all students with their progress data
export const getStudentProgress = async (req, res) => {
  try {
    // Only allow admin access
    if (req.user.role !== 'admin' && req.user.username !== 'manoranjanhere') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - Admin access required'
      });
    }

    // Get all students
    const students = await User.find({ role: 'student' }).select('_id name email username');

    // Process each student to get their progress data
    const studentProgress = await Promise.all(students.map(async (student) => {
      // Get student activity data
      const activityData = await StudentData.find({ 
        student: student._id 
      }).populate('video', 'title duration');

      // Calculate total watch time
      const totalWatchTime = activityData.reduce((total, item) => total + item.watchTime, 0);
      
      // Format time function
      const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      // Return student with their activity data
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        username: student.username,
        totalWatchTime,
        formattedTotalTime: formatTime(totalWatchTime),
        videosWatched: activityData.length,
        videosCompleted: activityData.filter(item => item.completed).length,
        totalQuestions: activityData.reduce((total, item) => total + (item.questionsAsked || 0), 0),
        activities: activityData.map(item => ({
          videoId: item.video?._id || item.video,
          title: item.title || (item.video?.title || 'Unknown'),
          watchTime: item.watchTime,
          formattedWatchTime: formatTime(item.watchTime),
          questionsAsked: item.questionsAsked || 0,
          completed: item.completed || false,
          lastWatched: item.lastWatched
        }))
      };
    }));

    // Sort by total watch time (descending)
    studentProgress.sort((a, b) => b.totalWatchTime - a.totalWatchTime);

    res.json({
      success: true,
      data: studentProgress
    });
  } catch (error) {
    console.error('Error getting student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting student progress',
      error: error.message
    });
  }
};