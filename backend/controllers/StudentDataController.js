import StudentData from '../models/StudentData.js';
import Video from '../models/Video.js';

// Track video watching time
export const trackWatchTime = async (req, res) => {
  try {
    const { videoId, watchTime } = req.body;
    const studentId = req.user._id;

    // Validate inputs
    if (!videoId || !watchTime || watchTime <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID or watch time'
      });
    }

    // Get video details
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Find or create student data
    let studentData = await StudentData.findOne({
      student: studentId,
      video: videoId
    });

    if (!studentData) {
      // Create new record
      studentData = new StudentData({
        student: studentId,
        video: videoId,
        title: video.title,
        watchTime: watchTime,
        lastWatched: new Date()
      });
    } else {
      // Update existing record
      studentData.watchTime += parseInt(watchTime);
      studentData.lastWatched = new Date();
      console.log(`Updated existing record. Total watch time: ${studentData.watchTime}`);

      // Mark as completed if watched at least 90% of video
      if (video.duration && studentData.watchTime >= video.duration * 0.9) {
        studentData.completed = true;
        console.log('Video marked as completed');

      }
    }

    await studentData.save();

    res.json({
      success: true,
      data: {
        videoId: videoId,
        title: video.title,
        watchTime: studentData.watchTime,
        completed: studentData.completed
      }
    });

  } catch (error) {
    console.error('Error tracking watch time:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking watch time',
      error: error.message
    });
  }
};

// Track questions asked
export const trackQuestion = async (req, res) => {
  try {
    const { videoId } = req.body;
    const studentId = req.user._id;

    // Find student data
    const studentData = await StudentData.findOneAndUpdate(
      { student: studentId, video: videoId },
      { 
        $inc: { questionsAsked: 1 },
        $set: { lastWatched: new Date() }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: {
        questionsAsked: studentData.questionsAsked
      }
    });
  } catch (error) {
    console.error('Error tracking question:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking question',
      error: error.message
    });
  }
};


const getMockData = () => {
    return {
      videos: [
        {
          videoId: '1',
          title: 'Introduction to React',
          watchTime: 3600,
          formattedWatchTime: '01:00:00',
          questionsAsked: 5,
          lastWatched: new Date(),
          completed: true
        },
        {
          videoId: '2',
          title: 'Advanced JavaScript Concepts',
          watchTime: 1800,
          formattedWatchTime: '00:30:00',
          questionsAsked: 2,
          lastWatched: new Date(Date.now() - 86400000), // yesterday
          completed: false
        },
        {
            videoId: '3',
            title: 'MongoDB for Beginners',
            watchTime: 2700,
            formattedWatchTime: '00:45:00',
            questionsAsked: 3,
            lastWatched: new Date(Date.now() - 172800000), // 2 days ago
            completed: true
          }
        ],
        stats: {
          totalVideos: 3,
          totalWatchTime: 8100,
          formattedTotalTime: '02:15:00',
          videosCompleted: 2,
          totalQuestions: 10
        }
      };
    };
// Get student data (for current student)
// Update the getStudentData function with better error handling

export const getStudentData = async (req, res) => {
    try {
      // Check if user exists in request
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
  
      const studentId = req.user._id;
  
      // Get all data for this student
      const data = await StudentData.find({ 
        student: studentId 
      }).sort({ lastWatched: -1 });
  
      // Calculate total watch time
      const totalWatchTime = data.reduce((total, item) => total + item.watchTime, 0);
      
      // Format for display (convert seconds to hh:mm:ss)
      const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };
  
      // Return formatted data
      res.json({
        success: true,
        data: {
          videos: data.map(item => ({
            videoId: item.video,
            title: item.title,
            watchTime: item.watchTime,
            formattedWatchTime: formatTime(item.watchTime),
            questionsAsked: item.questionsAsked,
            lastWatched: item.lastWatched,
            completed: item.completed
          })),
          stats: {
            totalVideos: data.length,
            totalWatchTime: totalWatchTime,
            formattedTotalTime: formatTime(totalWatchTime),
            videosCompleted: data.filter(item => item.completed).length,
            totalQuestions: data.reduce((total, item) => total + item.questionsAsked, 0)
          }
        }
      });
    } catch (error) {
      console.error('Error getting student data:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while getting student data',
        error: error.message
      });
    }
  };