import StudentData from '../models/StudentData.js';
import Video from '../models/Video.js';


// Track video watching time
export const trackWatchTime = async (req, res) => {
  try {
    const { videoId, watchTime } = req.body;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }
    
    // Ensure watchTime is a number and greater than 0
    const parsedWatchTime = parseInt(watchTime);
    if (isNaN(parsedWatchTime) || parsedWatchTime <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Watch time must be a positive number'
      });
    }
    
    // Get the video information
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    console.log(`Processing watch time for video "${video.title}"`);
    
    // Find or create student data entry
    let studentData = await StudentData.findOne({ 
      student: req.user._id,
      video: videoId
    });
    
    let previousWatchTime = 0;
    
    if (!studentData) {
      console.log('Creating new student data record');
      // Create new student data
      studentData = new StudentData({
        student: req.user._id,
        video: videoId,
        title: video.title, // Add the video title here
        watchTime: parsedWatchTime,
        questionsAsked: 0,
        completed: video.duration ? parsedWatchTime >= video.duration * 0.9 : false,
        lastWatched: new Date()
      });
    } else {
      console.log('Updating existing student data record');
      // Get previous watch time
      previousWatchTime = studentData.watchTime || 0;
      
      // Make sure title is set when updating
      if (!studentData.title) {
        studentData.title = video.title;
      }
      
      // Add new watch time
      studentData.watchTime = previousWatchTime + parsedWatchTime;
      studentData.lastWatched = new Date();
      console.log("video duration",video.duration);
      // Mark as completed if applicable (if video has duration)
      if (video.duration && studentData.watchTime >= video.duration * 0.9) {
        console.log(`Marking video "${video.title}" as completed`);
        studentData.completed = true;
      }
    }

    // Save the data
    await studentData.save();
    
    console.log('Student data saved successfully:', {
      studentId: req.user._id,
      videoId,
      previousWatchTime,
      addedWatchTime: parsedWatchTime,
      newTotalWatchTime: studentData.watchTime
    });

    // Format the watch time for display
    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    res.json({
      success: true,
      data: {
        videoId,
        title: video.title,
        watchTime: studentData.watchTime,
        formattedWatchTime: formatTime(studentData.watchTime),
        completed: studentData.completed || false,
        prevWatchTime: previousWatchTime,
        addedTime: parsedWatchTime
      }
    });
  } catch (error) {
    console.warn('Error tracking watch time:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking watch time',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};
// Track questions asked
export const trackQuestion = async (req, res) => {
  try {
    const { videoId } = req.body;
    const studentId = req.user._id;

    // Get the video information to access its title
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Find student data with updated query
    const studentData = await StudentData.findOneAndUpdate(
      { student: studentId, video: videoId },
      { 
        $inc: { questionsAsked: 1 },
        $set: { 
          lastWatched: new Date(),
          title: video.title // Ensure title is set
        }
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