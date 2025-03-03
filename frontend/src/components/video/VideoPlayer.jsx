import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Avatar, 
  Button,
  CircularProgress,
  Paper
} from '@mui/material';
import { ThumbUp, ThumbDown, Share, Mic, MicOff, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import './VideoStyles.css';

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState(null);
  const videoRef = useRef(null);
  const currentVideoRef = useRef(null); // Add this to track current video
  const navigate = useNavigate();

  // Fetch video when ID changes
  useEffect(() => {
    fetchVideo();
  }, [id]);
  
  // Update currentVideoRef when video changes
  useEffect(() => {
    currentVideoRef.current = video;
  }, [video]);

  // Setup speech recognition after video is loaded
  useEffect(() => {
    if (video) {
      setupSpeechRecognition();
    }
  }, [video]);

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log('Speech recognized:', text);
        setTranscript(text);
        setIsListening(false);
        
        // Use the current video from ref instead of closure
        const currentVideo = currentVideoRef.current;
        if (currentVideo) {
          handleVoiceQuery(text, currentVideo);
        } else {
          console.error('No video available for query');
          alert('Please wait for video to load before asking questions');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      window.recognition = recognition;
      console.log('Speech recognition setup completed with video:', video._id);
    }
  };

  const startListening = () => {
    if (!video) {
      alert('Video not loaded yet. Please wait.');
      return;
    }
    
    if (window.recognition) {
      setIsListening(true);
      window.recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!videoId || !window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      navigate('/');
    } catch (error) {
      console.error('Delete Error:', error);
      alert(error.response?.data?.error || 'Failed to delete video');
    }
  };

  // Updated to accept video as a parameter
  const handleVoiceQuery = async (question, currentVideo = video) => {
    console.log("handleVoiceQuery called with:", {
      question,
      videoAvailable: !!currentVideo,
      videoId: currentVideo?._id
    });

    if (!currentVideo || !question) {
      console.error("Missing required data:", { 
        hasVideo: !!currentVideo, 
        videoId: currentVideo?._id,
        hasQuestion: !!question 
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log("Sending request with videoId:", currentVideo._id, "and question:", question);
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/qa`, 
        {
          videoId: currentVideo._id,
          question: question
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log("Response from server:", response.data);
      setAnswer(response.data.data);
    } catch (error) {
      console.error('Error getting answer:', error);
      setAnswer(null);
      alert("Failed to get answer. Check console for details.");
    }
  };

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      console.log('Fetching video with ID:', id);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/videos/${id}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.data) {
        throw new Error('Video data not found');
      }
      
      console.log('Video data received:', response.data.data);
      setVideo(response.data.data);
      // Also update the ref
      currentVideoRef.current = response.data.data;
    } catch (error) {
      console.error('Error fetching video:', error);
      setError(error.response?.data?.error || 'Failed to load video');
      setVideo(null);
      currentVideoRef.current = null;
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="loader-container">
        <CircularProgress />
      </div>
    );
  }

  if (error || !video) {
    return (
      <Typography color="error" align="center">
        {error || 'Video not found'}
      </Typography>
    );
  }

  return (
    <Container maxWidth="xl" className="video-player-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {video && (
          <>
            <div className="video-wrapper">
              <video
                ref={videoRef}
                src={video.videoUrl}
                controls
                autoPlay
                className="main-video"
              />
            </div>

        <Box className="video-info">
          <Typography variant="h5" className="video-title">
            {video.title}
          </Typography>

          <Box className="video-stats">
            <Typography variant="body2">
              {video.views} views • {new Date(video.createdAt).toLocaleDateString()}
            </Typography>
            
            <Box className="video-actions">
              <Button startIcon={<ThumbUp />}>Like</Button>
              <Button startIcon={<ThumbDown />}>Dislike</Button>
              <Button startIcon={<Share />}>Share</Button>
            </Box>
          </Box>

          
          <Box className="query-section">
            <Button
              variant="contained"
              startIcon={isListening ? <MicOff /> : <Mic />}
              onClick={startListening}
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              sx={{
                backgroundColor: isListening ? '#ff4444' : '#1976d2',
                color: 'white',
                padding: '10px 20px',
                margin: '20px 0',
                '&:hover': {
                  backgroundColor: isListening ? '#ff6666' : '#1565c0',
                }
              }}
            >
              {isListening ? 'Listening...' : 'Ask a Question'}
            </Button>

            {transcript && (
              <Paper 
                elevation={3}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '16px',
                  margin: '16px 0'
                }}
              >
                <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
                  Your Question:
                </Typography>
                <Typography>{transcript}</Typography>
              </Paper>
            )}

            {answer && (
              <Paper 
                elevation={3}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '16px',
                  margin: '16px 0'
                }}
              >
                <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
                  Answer:
                </Typography>
                <Typography>{answer.answer}</Typography>
              </Paper>
            )}
          </Box>
          <Box className="video-actions" sx={{ 
  display: 'flex', 
  justifyContent: 'flex-end',
  gap: 2,
  mt: 3,
  borderTop: '1px solid rgba(255,255,255,0.1)',
  pt: 2
}}>
  <Button
    variant="contained"
    color="error"
    startIcon={<Delete />}
    onClick={() => handleDeleteVideo(video._id)}
  >
    Delete
  </Button>
  <Button
    variant="contained"
    onClick={() => navigate(-1)}
  >
    Close
  </Button>
</Box>

          <Box className="channel-info">
            <Avatar src={video.teacher?.profileImage} className="channel-avatar" />
            <Box className="channel-details">
              <Typography variant="subtitle1">{video.channelName}</Typography>
              <Typography variant="body2">{video.description}</Typography>
            </Box>
          </Box>
        </Box>
        </>
        )}
      </motion.div>
    </Container>
  );
};

export default VideoPlayer;