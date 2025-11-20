
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Divider, 
  Button, Chip, Avatar, Tab, Tabs
} from '@mui/material';
import { 
  ExpandMore, AccessTime, School, Person, Email,
  QuestionAnswer, CheckCircle, PlayCircle, Delete,
  Videocam, People
} from '@mui/icons-material';
import { getStudentProgress } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [studentProgress, setStudentProgress] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin or manoranjanhere
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.username !== 'manoranjanhere')) {
      navigate('/');
    } else {
      fetchStudentProgress();
      fetchAllVideos();
    }
  }, [user, navigate]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await getStudentProgress();
      
      if (response.success) {
        setStudentProgress(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to load student progress');
      }
    } catch (error) {
      console.error('Error in admin panel:', error);
      setError('Something went wrong while loading the data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVideos = async () => {
    try {
      setVideoLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      
      const response = await axios.get(
        `${API_URL}/videos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAllVideos(response.data.data);
      } else {
        console.error('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      
      await axios.delete(
        `${API_URL}/videos/${videoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove the video from the list
      setAllVideos(allVideos.filter(video => video._id !== videoId));
      
      // Show success message
      alert('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(error.response?.data?.message || 'Failed to delete video');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading && activeTab === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && activeTab === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <School color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<People />} label="STUDENT PROGRESS" />
          <Tab icon={<Videocam />} label="ALL VIDEOS" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Viewing learning progress for {studentProgress.length} students, sorted by total watch time.
            </Typography>
            
            {studentProgress.length === 0 ? (
              <Typography align="center" sx={{ py: 4 }}>
                No student data available.
              </Typography>
            ) : (
              studentProgress.map((student) => (
                <Accordion key={student._id} sx={{ mb: 2, overflow: 'hidden' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{ 
                      backgroundColor: 'rgba(0, 229, 255, 0.05)',
                      '&:hover': { backgroundColor: 'rgba(0, 229, 255, 0.1)' } 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {student.username?.charAt(0) || 'S'}
                      </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                          <Person fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                            {student.username || 'No Name'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2" noWrap>
                            {student.email}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        flexWrap: 'wrap',
                        mt: { xs: 1, md: 0 },
                        width: { xs: '100%', md: 'auto' }
                      }}>
                        <Chip 
                          icon={<AccessTime />} 
                          label={`Watch Time: ${student.formattedTotalTime}`} 
                          color="primary" 
                        />
                        
                        <Chip 
                          icon={<PlayCircle />} 
                          label={`${student.videosWatched} Videos`} 
                          variant="outlined"
                        />
                        
                        <Chip 
                          icon={<CheckCircle />} 
                          label={`${student.videosCompleted} Completed`}
                          color="success" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ p: 0 }}>
                    <Divider />
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Lecture Title</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Watch Time</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Questions</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Last Watched</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {student.activities.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched)).map((activity) => (
                            <TableRow 
                              key={`${student._id}-${activity.videoId}`}
                              hover
                              sx={{ 
                                backgroundColor: activity.completed ? 'rgba(76, 175, 80, 0.05)' : 'inherit'
                              }}
                            >
                              <TableCell>{activity.title}</TableCell>
                              <TableCell align="center">{activity.formattedWatchTime}</TableCell>
                              <TableCell align="center">
                                {activity.questionsAsked > 0 ? (
                                  <Chip 
                                    size="small" 
                                    icon={<QuestionAnswer fontSize="small" />} 
                                    label={activity.questionsAsked} 
                                    color="info" 
                                    variant="outlined"
                                  />
                                ) : (
                                  '0'
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {activity.completed ? (
                                  <Chip 
                                    size="small"
                                    label="Completed" 
                                    color="success" 
                                  />
                                ) : (
                                  <Chip 
                                    size="small"
                                    label="In Progress" 
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {new Date(activity.lastWatched).toLocaleDateString()} {new Date(activity.lastWatched).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              All videos on the platform ({allVideos.length}). As admin, you can delete any video.
            </Typography>

            {videoLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : allVideos.length === 0 ? (
              <Typography align="center" sx={{ py: 4 }}>
                No videos available.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Teacher</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Channel</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Views</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Upload Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allVideos.map((video) => (
                      <TableRow key={video._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <img 
                              src={`https://img.youtube.com/vi/default/default.jpg`} 
                              alt="Thumbnail" 
                              style={{ width: 80, marginRight: 12, borderRadius: 4 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {video.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{video.teacher?.username || "Unknown"}</TableCell>
                        <TableCell>{video.channelName}</TableCell>
                        <TableCell>{video.views}</TableCell>
                        <TableCell>
                          {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteVideo(video._id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AdminPanel;