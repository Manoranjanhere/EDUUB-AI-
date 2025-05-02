import axios from 'axios';

/**
 * Get student progress data
 * @returns {Promise<Object>} Promise with student data
 */
export const getStudentData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    // Use environment variable with fallback to new production URL
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://eduub-ai.onrender.com/api';
    
    const response = await axios.get(
      `${API_URL}/student-data/me`, 
      { 
        headers: { 
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error fetching student data:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch student data'
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