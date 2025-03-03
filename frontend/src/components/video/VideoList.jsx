import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Grid, Container, Typography, CircularProgress, Button, Box, Modal, Paper } from '@mui/material';
import { Mic, MicOff, Delete } from '@mui/icons-material';
import axios from 'axios';
import VideoCard from './VideoCard';
import SearchBar from '../common/SearchBar';
import './VideoStyles.css';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    fetchVideos();
    setupSpeechRecognition();
  }, []);

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = async(event) => {
        const text = event.results[0][0].transcript;
        console.log('Speech recognized:', text);
        setTranscript(text);
        setIsListening(false);
        await handleVoiceQuery(text);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setQueryError('Speech recognition failed');
      };

      window.recognition = recognition;
    }
  };

  const startListening = () => {
    setQueryError(null);
    if (window.recognition) {
      setIsListening(true);
      window.recognition.start();
    } else {
      setQueryError('Speech recognition not supported in this browser');
    }
  };

  const handleVoiceQuery = async (question) => {
    console.log('Attempting to send question:', question);
    setQueryError(null);
    
    if (!selectedVideo || !question) {
      console.error('Missing video or question:', { 
        videoId: selectedVideo?._id, 
        question 
      });
      setQueryError("Missing video or question");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setQueryError("Please login to ask questions");
        return;
      }
      console.log('Sending QA request:', {
        videoId: selectedVideo._id,
        question: question,
        token: token ? 'Present' : 'Missing'
      });
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/qa`,
        {
          videoId: selectedVideo._id,
          question: question
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log("Response:", response.data);
      setAnswer(response.data.data);
    } catch (error) {
      console.error('Error getting answer:', error);
      setQueryError(error.response?.data?.error || 'Failed to get answer');
      setAnswer(null);
    }
  };

  useEffect(() => {
    if (transcript && selectedVideo) {
      handleVoiceQuery(transcript);
    }
  }, [transcript, selectedVideo]);

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
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

      setVideos(videos.filter(v => v._id !== videoId));
      closeModal();
    } catch (error) {
      console.error('Delete Error:', error);
      alert(error.response?.data?.error || 'Failed to delete video');
    }
  };

  const fetchVideos = async (searchQuery = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/videos`, {
        params: { search: searchQuery },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setVideos(response.data.data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch videos');
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchVideos(query);
  };

  const closeModal = () => {
    setSelectedVideo(null);
    setTranscript('');
    setAnswer(null);
    setQueryError(null);
  };

  if (loading) {
    return (
      <div className="loader-container">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="video-list-container">
      <SearchBar value={searchQuery} onSearch={handleSearch} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video._id}>
              <div onClick={() => setSelectedVideo(video)}>
                <VideoCard video={video} />
              </div>
            </Grid>
          ))}
        </Grid>

        <Modal
          open={Boolean(selectedVideo)}
          onClose={closeModal}
          className="video-modal"
        >
          <Box className="modal-content" ref={modalRef}>
            {selectedVideo && (
              <>
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  autoPlay
                  className="modal-video"
                />
                <Box className="modal-info">
                  <Typography variant="h5">
                    {selectedVideo.title}
                  </Typography>

                  <Box className="query-section">
                    <Button
                      variant="contained"
                      startIcon={isListening ? <MicOff /> : <Mic />}
                      onClick={startListening}
                      className={`voice-btn ${isListening ? 'listening' : ''}`}
                      sx={{
                        backgroundColor: isListening ? '#ff4444' : '#1976d2',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: isListening ? '#ff6666' : '#1565c0',
                        }
                      }}
                    >
                      {isListening ? 'Listening...' : 'Ask a Question'}
                    </Button>

                    {queryError && (
                      <Paper 
                        elevation={3}
                        sx={{ 
                          bgcolor: 'error.dark',
                          p: 2,
                          mt: 2,
                          color: 'white'
                        }}
                      >
                        <Typography>{queryError}</Typography>
                      </Paper>
                    )}

                    {transcript && (
                      <Paper 
                        elevation={3}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          p: 2,
                          mt: 2
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
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          p: 2,
                          mt: 2
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ color: '#aaa' }}>
                          Answer:
                        </Typography>
                        <Typography>{answer.answer}</Typography>
                      </Paper>
                    )}
                  </Box>

                  <Box className="modal-actions">
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteVideo(selectedVideo._id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={closeModal}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </Modal>
      </motion.div>
    </Container>
  );
};

export default VideoList;