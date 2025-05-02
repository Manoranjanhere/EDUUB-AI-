import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Box
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import './VideoStyles.css';

const VideoUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video: null
  });
  const [preview, setPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, video: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  // Use the new backend URL for video uploads
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title || !formData.description || !formData.video) {
      alert('Please fill in all fields and select a file');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Create form data for file upload
      const submitFormData = new FormData();
      submitFormData.append('video', formData.video);
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      console.log('Making request to:', `${import.meta.env.VITE_BACKEND_URL}/videos/upload`);
      
      // Send upload request to backend
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'https://eduub-ai.onrender.com/api'}/videos/upload`,
        submitFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      console.log('Upload response:', response.data);
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        video: null
      });
      setPreview('');
      
      // Navigate to home page to see the newly uploaded video
      navigate('/');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="md" className="upload-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper className="upload-paper">
          <Typography variant="h5" className="upload-title">
            Upload Video
          </Typography>

          <form onSubmit={handleSubmit}>
            <div className="upload-dropzone">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                id="video-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="video-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  className="upload-button"
                  fullWidth
                  sx={{ mt: 2, mb: 2 }}
                >
                  Select Video
                </Button>
              </label>
              {preview && (
                <video 
                  src={preview} 
                  className="video-preview" 
                  controls
                />
              )}
            </div>

            <TextField
              fullWidth
              label="Title"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                title: e.target.value 
              }))}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              margin="normal"
            />

            {uploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                />
                <Typography align="center">
                  {uploadProgress}%
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!formData.video || uploading}
              className="submit-button"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default VideoUpload;