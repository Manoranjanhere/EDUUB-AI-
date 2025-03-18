import User from '../models/User.js';
import StudentData from '../models/StudentData.js';
import Video from '../models/Video.js';
import mongoose from 'mongoose';

export const getStudentProgress = async (req, res) => {
  try {
    // Check for admin access
    if (req.user.role !== 'admin' && req.user.username !== 'manoranjanhere') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized - Admin access required'
      });
    }

    console.log('Fetching student progress data...');

    // Get all students with role 'student'
    const students = await User.find({ role: 'student' }).select('_id name email username');
    
    console.log(`Found ${students.length} students`);

    // Process each student to get their progress data
    const studentProgress = await Promise.all(students.map(async (student) => {
      // Get student activity data with populated video reference
      const activityData = await StudentData.find({ 
        student: student._id 
      }).populate('video', 'title duration');
      
      console.log(`Student ${student.username}: Found ${activityData.length} activities`);
      
      // Log individual watch times for debugging
      if (activityData.length > 0) {
        console.log('Activity watch times:', activityData.map(a => ({ 
          title: a.title, 
          watchTime: a.watchTime 
        })));
      }

      // Calculate total watch time - make sure to handle nulls/undefined
      const totalWatchTime = activityData.reduce((total, item) => {
        const itemWatchTime = item.watchTime || 0;
        console.log(`Adding ${itemWatchTime}s for video "${item.title}"`);
        return total + itemWatchTime;
      }, 0);
      
      console.log(`Student ${student.username}: Total watch time = ${totalWatchTime}s`);
      
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
        name: student.name || student.username, // Use name if available, otherwise username
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
          watchTime: item.watchTime || 0,
          formattedWatchTime: formatTime(item.watchTime || 0),
          questionsAsked: item.questionsAsked || 0,
          completed: item.completed || false,
          lastWatched: item.lastWatched || item.updatedAt || item.createdAt
        }))
      };
    }));

    // Sort by total watch time (descending)
    studentProgress.sort((a, b) => b.totalWatchTime - a.totalWatchTime);

    console.log(`Returning progress data for ${studentProgress.length} students`);
    
    res.json({
      success: true,
      data: studentProgress
    });
  } catch (error) {
    console.error('Error getting student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting student progress',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};