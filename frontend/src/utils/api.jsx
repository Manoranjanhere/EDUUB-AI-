// Create or modify this utility file for consistent API access

import axios from 'axios';

// Create consistent API URL
const API_URL = 'https://eduubserver.mano.systems/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Only add token if it exists
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;