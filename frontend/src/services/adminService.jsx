import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export const getStudentProgress = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }
    
    const response = await axios.get(
      `${API_URL}/admin/student-progress`,
      { 
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch student progress'
    };
  }
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