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
  // Add this state to track which search type is active
  const [activeSearchType, setActiveSearchType] = useState("general");
  const videoRef = useRef(null);
  const currentVideoRef = useRef(null);
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
  }, [video, activeSearchType]); // Re-setup when activeSearchType changes

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

  const toggleSpeech = async () => {
    try {
      const token = localStorage.getItem("token");

      if (isSpeaking) {
        // Stop speech
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/qa/stop-speech`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setIsSpeaking(false);
      } else {
        // We're not currently speaking but want to restart
        if (answer) {
          setIsSpeaking(true);
          try {
            await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/qa/speak`,
              { text: answer.answer },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (error) {
            console.error("Error starting speech:", error);
            setIsSpeaking(false);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling speech:", error);
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
      const token = localStorage.getItem("token");
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
      setAnswer(response.data.data);
      setIsSpeaking(true);
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

                {/* Voice query button with search type indicator */}
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
                    padding: "10px 20px",
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
                  {isListening
                    ? "Listening..."
                    : `Ask (${
                        activeSearchType === "near"
                          ? "Near Current Time"
                          : "General"
                      })`}
                </Button>

                {/* Text input for questions with search type buttons */}
                <Box
                  component="form"
                  sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}
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
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Search />}
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
                    }}
                    title="Search context near current timestamp"
                  >
                    Near Time
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Explore />}
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
                    }}
                    title="Search the entire transcript"
                  >
                    General
                  </Button>
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
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleDeleteVideo(video._id)}
                >
                  Delete
                </Button>
                <Button variant="contained" onClick={() => navigate(-1)}>
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
