import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Avatar,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  Input,
  Chip,
} from "@mui/material";
import {
  ThumbUp,
  ThumbDown,
  Share,
  Mic,
  MicOff,
  Delete,
  PauseCircle,
  PlayCircle,
  Search,
  Explore,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import "./VideoStyles.css";

// Web Speech API utility functions
const speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

const speakText = (text, options = {}) => {
  return new Promise((resolve, reject) => {
    // Stop any existing speech first
    stopSpeaking();
    
    // Check browser support
    if (!speechSynthesis) {
      console.error("Speech synthesis not supported by your browser");
      reject(new Error("Speech synthesis not supported"));
      return;
    }
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure options
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    
    // Set voice if specified
    if (options.voice) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === options.voice);
      if (voice) utterance.voice = voice;
    }
    
    // Set up listeners
    utterance.onend = () => {
      currentUtterance = null;
      console.log("Speech finished");
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      currentUtterance = null;
      reject(new Error(event.error));
    };
    
    // Store reference and start speaking
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  });
};

const stopSpeaking = () => {
  if (speechSynthesis) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
};

const isSpeakingNow = () => {
  return speechSynthesis ? speechSynthesis.speaking : false;
};

const VideoPlayer = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState(null);
  const [textQuestion, setTextQuestion] = useState("");
  const [activeSearchType, setActiveSearchType] = useState("general");
  const videoRef = useRef(null);
  const currentVideoRef = useRef(null);
  const navigate = useNavigate();

  // Debug API URL at startup
  useEffect(() => {
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
    console.log('API URL for tracking:', `${API_URL}/student-data/track`);
  }, []);

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
  }, [video, activeSearchType]); // Re-setup when activeSearchType changes

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      console.log('Video component unmounting, stopping speech...');
      stopSpeaking();
      setIsSpeaking(false);
    };
  }, []);

  // Video watch time tracking
useEffect(() => {
  if (!video || !video._id) {
    console.log('No video available for tracking');
    return;
  }
  
  console.log(`Setting up tracking for video: ${video._id} - ${video.title}`);
  
  // Initialize tracking variables
  const lastTimeRef = { current: Date.now() };
  let accumulatedTime = 0;
  let isPlaying = false;
  
  // Track when video starts playing
  const handlePlay = () => {
    console.log('Video started playing');
    lastTimeRef.current = Date.now();
    isPlaying = true;
  };
  
  // Track when video is paused
  const handlePause = () => {
    console.log('Video paused');
    if (isPlaying) {
      const elapsed = (Date.now() - lastTimeRef.current) / 1000;
      accumulatedTime += elapsed;
      console.log(`Added ${elapsed.toFixed(2)}s to accumulated time. Total: ${accumulatedTime.toFixed(2)}s`);
      
      // Track even 1 second of watch time when paused
      if (accumulatedTime >= 1) {
        trackVideoProgress(video._id, Math.floor(accumulatedTime));
        accumulatedTime = 0;
      }
    }
    isPlaying = false;
  };
  
  // Track when video seeking occurs
  const handleSeeking = () => {
    console.log('Video seeking');
    if (isPlaying) {
      const elapsed = (Date.now() - lastTimeRef.current) / 1000;
      accumulatedTime += elapsed;
      lastTimeRef.current = Date.now();
    }
  };
  
  // Set up periodic tracking while video is playing
  // CHANGED FROM 30000 to 3000 (3 seconds)
  const trackingInterval = setInterval(() => {
    if (videoRef.current && !videoRef.current.paused) {
      const now = Date.now();
      const elapsed = (now - lastTimeRef.current) / 1000;
      
      // Track every 3 seconds or more instead of 30
      if (elapsed + accumulatedTime >= 3) {
        const timeToTrack = Math.floor(elapsed + accumulatedTime);
        console.log(`Tracking ${timeToTrack}s of watch time`);
        trackVideoProgress(video._id, timeToTrack);
        accumulatedTime = 0;
        lastTimeRef.current = now;
      }
    }
  }, 3000); // Changed from 30000 to check every 3 seconds
  
  // Add event listeners to the video element
  if (videoRef.current) {
    videoRef.current.addEventListener('play', handlePlay);
    videoRef.current.addEventListener('pause', handlePause);
    videoRef.current.addEventListener('seeking', handleSeeking);
    videoRef.current.addEventListener('ended', handlePause);
  }
  
  // Cleanup function
  return () => {
    // Remove event listeners
    if (videoRef.current) {
      videoRef.current.removeEventListener('play', handlePlay);
      videoRef.current.removeEventListener('pause', handlePause);
      videoRef.current.removeEventListener('seeking', handleSeeking);
      videoRef.current.removeEventListener('ended', handlePause);
    }
    
    // Clear interval
    clearInterval(trackingInterval);
    
    // Track any remaining time
    if (accumulatedTime >= 1) {
      console.log(`Tracking remaining ${accumulatedTime.toFixed(2)}s before unmount`);
      trackVideoProgress(video._id, Math.floor(accumulatedTime));
    }
  };
}, [video]);

// Update the trackVideoProgress function
// Update the trackVideoProgress function in the VideoPlayer component
const trackVideoProgress = async (videoId, duration) => {
  if (!videoId || duration <= 0) return;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token available for tracking');
      return;
    }
    
    // Use the correct API_URL
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
    
    console.log(`Tracking ${duration}s of watch time for video ${videoId}`);
    
    // Send the tracking data
    const response = await axios.post(
      `${API_URL}/student-data/track`, 
      { 
        videoId, 
        watchTime: duration // Make sure this is sent as a number
      },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    // Check response and log for debugging
    if (response.data && response.data.success) {
      console.log('✅ Watch time tracked successfully:', {
        prevTime: response.data.data.prevWatchTime,
        addedTime: response.data.data.addedTime,
        newTotal: response.data.data.watchTime,
        formattedTotal: response.data.data.formattedWatchTime
      });
    } else {
      console.warn('⚠️ Tracking response not successful:', response.data);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Unknown error';
    console.error('❌ Error tracking video progress:', errorMessage);
    
    // Check if token is expired
    if (error.response?.status === 401) {
      console.error('Authentication failed. Please log in again.');
      // Optional: You could redirect to login or show a notification
    }
  }
};

  const setupSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log("Speech recognized:", text);
        setTranscript(text);
        setIsListening(false);

        // Use the current video from ref instead of closure
        const currentVideo = currentVideoRef.current;
        if (currentVideo) {
          // Use the currently active search type
          handleVoiceQuery(text, activeSearchType, currentVideo);
        } else {
          console.error("No video available for query");
          alert("Please wait for video to load before asking questions");
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      window.recognition = recognition;
      console.log(
        "Speech recognition setup completed with video:",
        video._id,
        "using search type:",
        activeSearchType
      );
    }
  };

  // Add functions to set the active search type
  const setNearSearch = () => {
    setActiveSearchType("near");
    console.log("Search type set to: near");
  };

  const setGeneralSearch = () => {
    setActiveSearchType("general");
    console.log("Search type set to: general");
  };

  const startListening = () => {
    if (!video) {
      alert("Video not loaded yet. Please wait.");
      return;
    }

    if (window.recognition) {
      console.log(`Starting voice recognition with ${activeSearchType} search`);
      setIsListening(true);
      window.recognition.start();
    } else {
      alert("Speech recognition not supported in this browser");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (
      !videoId ||
      !window.confirm("Are you sure you want to delete this video?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/videos/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate("/");
    } catch (error) {
      console.error("Delete Error:", error);
      alert(error.response?.data?.error || "Failed to delete video");
    }
  };

  // Updated to use client-side TTS
  const toggleSpeech = async () => {
    try {
      if (isSpeaking) {
        // Stop speech
        stopSpeaking();
        setIsSpeaking(false);
      } else {
        // We're not currently speaking but want to start/restart
        if (answer) {
          setIsSpeaking(true);
          try {
            await speakText(answer.answer);
            // When finished speaking
            setIsSpeaking(false);
          } catch (error) {
            console.error("Speech error:", error);
            setIsSpeaking(false);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling speech:", error);
      setIsSpeaking(false);
    }
  };

  const handleVoiceQuery = async (
    question,
    searchType = activeSearchType,
    currentVideo = video
  ) => {
    console.log("handleVoiceQuery called with:", {
      question,
      searchType,
      videoAvailable: !!currentVideo,
      videoId: currentVideo?._id,
    });

    if (!currentVideo || !question) {
      console.error("Missing required data:", {
        hasVideo: !!currentVideo,
        videoId: currentVideo?._id,
        hasQuestion: !!question,
      });
      return;
    }

    try {
      // Stop any current speech
      stopSpeaking();
      setIsSpeaking(false);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No authentication token found");
        alert("Please log in to use this feature");
        return;
      }
      // Get current video playback time for Near Time
      const currentTime = videoRef.current ? videoRef.current.currentTime : 0;

      console.log(
        "Sending request with videoId:",
        currentVideo._id,
        "question:",
        question,
        "searchType:",
        searchType,
        "currentTime:",
        currentTime
      );

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/qa`,
        {
          videoId: currentVideo._id,
          question: question,
          searchType: searchType,
          currentTime: currentTime,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response from server:", response.data);
      const responseData = response.data.data;
      setAnswer(responseData);
      
      // Auto-play the answer with client-side TTS
      if (responseData && responseData.answer) {
        try {
          setIsSpeaking(true);
          await speakText(responseData.answer);
          setIsSpeaking(false);
        } catch (error) {
          console.error("Speech error:", error);
          setIsSpeaking(false);
        }
      }
    } catch (error) {
      console.error("Error getting answer:", error);
      setAnswer(null);
      alert("Failed to get answer. Check console for details.");
    }
  };

  // Function for handling text input submission
  const handleTextSubmit = (e, searchType) => {
    e.preventDefault();
    if (!textQuestion.trim()) return;

    // Update the active search type when submitting text query
    setActiveSearchType(searchType);
    handleVoiceQuery(textQuestion, searchType);
  };

  // Handle closing the video - make sure to stop speech
  const handleClose = () => {
    stopSpeaking();
    setIsSpeaking(false);
    navigate(-1);
  };

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      console.log("Fetching video with ID:", id);

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/videos/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.data) {
        throw new Error("Video data not found");
      }

      console.log("Video data received:", response.data.data);
      setVideo(response.data.data);
      // Also update the ref
      currentVideoRef.current = response.data.data;
    } catch (error) {
      console.error("Error fetching video:", error);
      setError(error.response?.data?.error || "Failed to load video");
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
        {error || "Video not found"}
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
                  {video.views} views •{" "}
                  {new Date(video.createdAt).toLocaleDateString()}
                </Typography>

                <Box className="video-actions">
                  <Button startIcon={<ThumbUp />}>Like</Button>
                  <Button startIcon={<ThumbDown />}>Dislike</Button>
                  <Button startIcon={<Share />}>Share</Button>
                </Box>
              </Box>

              <Box className="query-section">
                {/* Search type indicator */}
                <Box
                  sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Typography variant="body2" sx={{ color: "#aaa" }}>
                    Current search mode:
                  </Typography>
                  <Chip
                    label={
                      activeSearchType === "near"
                        ? "Near Time"
                        : "General Search"
                    }
                    color={
                      activeSearchType === "near" ? "primary" : "secondary"
                    }
                    size="small"
                  />
                </Box>

                {/* Voice query button with search type indicator - MOBILE RESPONSIVE */}
                <Button
                  variant="contained"
                  startIcon={isListening ? <MicOff /> : <Mic />}
                  onClick={startListening}
                  className={`voice-btn ${isListening ? "listening" : ""}`}
                  sx={{
                    backgroundColor: isListening
                      ? "#ff4444"
                      : activeSearchType === "near"
                      ? "#2196f3"
                      : "#9c27b0",
                    color: "white",
                    padding: { xs: "8px 12px", sm: "10px 20px" },
                    margin: "20px 0 10px 0",
                    "&:hover": {
                      backgroundColor: isListening
                        ? "#ff6666"
                        : activeSearchType === "near"
                        ? "#1976d2"
                        : "#7b1fa2",
                    },
                  }}
                >
                    {isListening ? (
                      "Listening..."
                    ) : (
                      `Ask (${activeSearchType === "near" ? "Near Current Time" : "General"})`
                    )}
                </Button>

                {/* Text input for questions with search type buttons - MOBILE RESPONSIVE */}
                <Box
                  component="form"
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    mb: 2, 
                    gap: 1,
                    flexWrap: { xs: "wrap", sm: "nowrap" }
                  }}
                >
                  <input
                    type="text"
                    value={textQuestion}
                    onChange={(e) => setTextQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    style={{
                      flex: 1,
                      padding: "10px 15px",
                      borderRadius: "4px",
                      border: "1px solid #444",
                      backgroundColor: "#333",
                      color: "#fff",
                      width: "100%",
                      minWidth: "100px"
                    }}
                  />
                  <Box sx={{ 
                    display: "flex", 
                    gap: 1, 
                    mt: { xs: 1, sm: 0 }, 
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "space-between", sm: "flex-start" }
                  }}>
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        setNearSearch();
                        handleTextSubmit(e, "near");
                      }}
                      sx={{
                        whiteSpace: "nowrap",
                        backgroundColor:
                          activeSearchType === "near" ? "#ff4444" : undefined,
                        "&:hover": {
                          backgroundColor:
                            activeSearchType === "near" ? "#ff6666" : undefined,
                        },
                        flex: { xs: 1, sm: "auto" },
                        fontSize: { xs: "0.85rem", sm: "0.875rem" }
                      }}
                      title="Search context near current timestamp"
                      startIcon={<Search />}
                    >
                      Near Time
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={(e) => {
                        setGeneralSearch();
                        handleTextSubmit(e, "general");
                      }}
                      sx={{
                        whiteSpace: "nowrap",
                        backgroundColor:
                          activeSearchType === "general" ? "#9c27b0" : undefined,
                        "&:hover": {
                          backgroundColor:
                            activeSearchType === "general"
                              ? "#7b1fa2"
                              : undefined,
                        },
                        flex: { xs: 1, sm: "auto" },
                        fontSize: { xs: "0.85rem", sm: "0.875rem" }
                      }}
                      title="Search the entire transcript"
                      startIcon={<Explore />}
                    >
                      General
                    </Button>
                  </Box>
                </Box>

                {transcript && (
                  <Paper
                    elevation={3}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      padding: "16px",
                      margin: "16px 0",
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: "#aaa" }}>
                      Your Question:
                    </Typography>
                    <Typography>{transcript}</Typography>
                  </Paper>
                )}

                {answer && (
                  <Paper
                    elevation={3}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      padding: "16px",
                      margin: "16px 0",
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography variant="subtitle1" sx={{ color: "#aaa" }}>
                        Answer:
                      </Typography>
                      <Box>
                        {answer.searchType && (
                          <Chip
                            label={
                              answer.searchType === "near"
                                ? "Near Time"
                                : "General search"
                            }
                            color={
                              answer.searchType === "near"
                                ? "primary"
                                : "secondary"
                            }
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {isSpeaking ? (
                          <IconButton
                            onClick={toggleSpeech}
                            color="primary"
                            aria-label="Stop speech"
                          >
                            <PauseCircle />
                          </IconButton>
                        ) : (
                          <IconButton
                            onClick={toggleSpeech}
                            color="primary"
                            aria-label="Play speech"
                            disabled={!answer}
                          >
                            <PlayCircle />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <Typography>{answer.answer}</Typography>
                  </Paper>
                )}
              </Box>

              <Box
                className="video-actions"
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 3,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  pt: 2,
                }}
              >
                {video && video.teacher && 
                  localStorage.getItem('user') && 
                  (() => {
                    try {
                      const userData = JSON.parse(localStorage.getItem('user'));
                      return userData && userData._id === video.teacher._id;
                    } catch (e) {
                      console.error("Error parsing user data:", e);
                      return false;
                    }
                  })() && (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDeleteVideo(video._id)}
                    >
                      Delete
                    </Button>
                  )
                }
                <Button 
                  variant="contained" 
                  onClick={handleClose}
                >
                  Close
                </Button>
              </Box>

              <Box className="channel-info">
                <Avatar
                  src={video.teacher?.profileImage}
                  className="channel-avatar"
                />
                <Box className="channel-details">
                  <Typography variant="subtitle1">
                    {video.channelName}
                  </Typography>
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