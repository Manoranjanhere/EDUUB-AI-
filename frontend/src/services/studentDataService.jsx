import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export const getStudentData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      // Return mock data for development
      return { 
        success: true, 
        data: getMockData() 
      };
    }
    
    const response = await axios.get(
      `${API_URL}/student-data/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching student data:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch student data'
    };
  }
};

// Mock data function
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
        lastWatched: new Date(Date.now() - 86400000),
        completed: false
      },
      {
        videoId: '3',
        title: 'MongoDB for Beginners',
        watchTime: 2700,
        formattedWatchTime: '00:45:00',
        questionsAsked: 3,
        lastWatched: new Date(Date.now() - 172800000),
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