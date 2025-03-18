import axios from 'axios';

export const getStudentData = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }
    
    // Use environment variable for API URL if available
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
    
    const response = await axios.get(`${API_URL}/student-data/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Map the response data structure to match what our components expect
    if (response.data.success) {
      // Format the data structure to match what our components expect
      const processedData = {
        videos: response.data.data.videos.map(video => ({
          videoId: video._id || video.videoId,
          title: video.title,
          watchTime: video.watchTime || 0,
          formattedWatchTime: formatWatchTime(video.watchTime || 0),
          questionsAsked: video.questionsAsked || 0,
          completed: video.completed || false,
          lastWatched: video.lastWatched || new Date()
        })),
        stats: {
          totalVideos: response.data.data.stats?.totalVideos || 0,
          totalWatchTime: response.data.data.stats?.totalWatchTime || 0,
          formattedTotalTime: formatWatchTime(response.data.data.stats?.totalWatchTime || 0),
          videosCompleted: response.data.data.stats?.videosCompleted || 0,
          totalQuestions: response.data.data.stats?.totalQuestions || 0
        },
        // Add this for ProgressAnalytics
        activities: response.data.data.videos.map(video => ({
          videoId: video._id || video.videoId,
          title: video.title,
          watchTime: video.watchTime || 0,
          questionsAsked: video.questionsAsked || 0,
          completed: video.completed || false,
          lastWatched: video.lastWatched || new Date()
        }))
      };
      
      return { success: true, data: processedData };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching student data:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch data'
    };
  }
};

// Helper function to format time
const formatWatchTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};