import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://eduub-ai.onrender.com/api';

export const getStudentProgress = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }
    
    const response = await axios.get(
      `${API_URL}/admin/student-progress`, 
      { 
        headers: { 
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (response.data && response.data.success) {
      // Add formatted watch time to each student record
      const processedData = response.data.data.map(student => ({
        ...student,
        formattedTotalTime: formatWatchTime(student.totalWatchTime)
      }));

      return { success: true, data: processedData };
    } else {
      return { success: false, message: response.data.message || 'Failed to fetch student progress' };
    }
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch student progress'
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

export const getAllVideos = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }
    
    const response = await axios.get(
      `${API_URL}/videos`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all videos:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch videos'
    };
  }
};