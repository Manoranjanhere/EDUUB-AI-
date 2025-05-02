import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress, 
         Tab, Tabs, Divider, useTheme, useMediaQuery } from '@mui/material';
import { PictureAsPdf, CalendarMonth, Dashboard, ArrowBack } from '@mui/icons-material';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
         LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import StreakCalendar from './StreakCalender';
import { generateStudentPDF } from './pdfGenerator';
import LearningCharts from './LearningCharts';
import WeeklyActivity from './WeeklyActivity';
import './analyticsStyles.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

const ProgressAnalytics = ({ goBack }) => {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Fetch student data when component mounts
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getStudentData();
        
        if (result.success) {
          setStudentData(result.data);
          setError(null);
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Define API URL with environment variable and fallback to new production URL  
  const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://eduub-ai.onrender.com/api';

 // In the fetchStudentData function:

const fetchStudentData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(
      `${API_URL}/student-data/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      // Check if the required data structure exists
      if (!response.data.data || !response.data.data.activities) {
        console.warn('API returned success but data structure is incomplete');
        // Use response data directly if it has videos
        if (response.data.data && response.data.data.videos) {
          const processed = {
            ...response.data.data,
            activities: response.data.data.videos
          };
          setStudentData(processStudentData(processed));
        } else {
          throw new Error('Data structure is not as expected');
        }
      } else {
        setStudentData(processStudentData(response.data.data));
      }
    } else {
      throw new Error(response.data.message || 'Failed to fetch data');
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
    setError(error.message || 'An error occurred while fetching your data');
  } finally {
    setLoading(false);
  }
};
  
  // For development only - remove in production
  const setDummyDataForTesting = () => {
    const dummyData = {
      activities: [
        { videoId: '1', title: 'Introduction to React', watchTime: 3600, questionsAsked: 5, completed: true, lastWatched: '2025-03-15T10:00:00Z' },
        { videoId: '2', title: 'JavaScript Fundamentals', watchTime: 2700, questionsAsked: 3, completed: true, lastWatched: '2025-03-14T14:30:00Z' },
        { videoId: '3', title: 'Advanced CSS Techniques', watchTime: 1800, questionsAsked: 2, completed: true, lastWatched: '2025-03-13T09:15:00Z' },
        { videoId: '4', title: 'Node.js Basics', watchTime: 1200, questionsAsked: 1, completed: false, lastWatched: '2025-03-12T16:45:00Z' },
        { videoId: '5', title: 'Database Design', watchTime: 900, questionsAsked: 2, completed: false, lastWatched: '2025-03-11T11:20:00Z' },
        { videoId: '6', title: 'API Development', watchTime: 1500, questionsAsked: 1, completed: false, lastWatched: '2025-03-10T13:10:00Z' },
        { videoId: '7', title: 'Redux State Management', watchTime: 600, questionsAsked: 1, completed: false, lastWatched: '2025-03-09T15:30:00Z' },
        { videoId: '8', title: 'Testing Frameworks', watchTime: 300, questionsAsked: 0, completed: false, lastWatched: '2025-03-08T17:00:00Z' }
      ]
    };
    
    setStudentData(processStudentData(dummyData));
    setError(null); // Clear error if we're using dummy data
  };

  // Process student data for charts
 // Update the processStudentData function to handle null or undefined values
const processStudentData = (data) => {
  // Ensure data exists
  if (!data) {
    console.error('No data provided to processStudentData');
    return {
      videoEngagement: [],
      topVideos: [],
      recentVideos: [],
      dailyActivity: {},
      stats: {
        totalTimeSpent: 0,
        formattedTotalTime: '00:00:00',
        totalQuestionsAsked: 0,
        videosCompleted: 0,
        totalVideos: 0
      }
    };
  }

  // Ensure activities array exists
  const activities = data.activities || [];
  
  // Extract video engagement data - safely
  const videoEngagement = activities.map(activity => ({
    videoId: activity.videoId || '',
    title: activity.title || 'Unknown Video',
    watchTime: activity.watchTime || 0,
    questionsAsked: activity.questionsAsked || 0,
    completed: activity.completed || false,
    lastWatched: activity.lastWatched ? new Date(activity.lastWatched) : new Date()
  }));
  
  // Group by date to get activity streaks
  const dailyActivity = {};
  
  // Calculate activity dates for streak calendar
  activities.forEach(activity => {
    if (activity.lastWatched) {
      const date = new Date(activity.lastWatched).toISOString().split('T')[0];
      if (!dailyActivity[date]) {
        dailyActivity[date] = {
          totalTime: 0,
          videos: []
        };
      }
      dailyActivity[date].totalTime += activity.watchTime || 0;
      if (activity.title) {
        dailyActivity[date].videos.push(activity.title);
      }
    }
  });
  
  // Get top 3 watched videos
  const topVideos = [...videoEngagement]
    .sort((a, b) => b.watchTime - a.watchTime)
    .slice(0, 3);
  
  // Get recently watched videos (last 7 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentVideos = videoEngagement
    .filter(v => new Date(v.lastWatched) > oneWeekAgo)
    .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
  
  // Calculate total time spent, questions asked, etc.
  const totalTimeSpent = videoEngagement.reduce((total, v) => total + v.watchTime, 0);
  const totalQuestionsAsked = videoEngagement.reduce((total, v) => total + v.questionsAsked, 0);
  const videosCompleted = videoEngagement.filter(v => v.completed).length;
  
  // Format time function
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return {
    ...data,
    videoEngagement,
    topVideos,
    recentVideos,
    dailyActivity,
    stats: {
      totalTimeSpent,
      formattedTotalTime: formatTime(totalTimeSpent),
      totalQuestionsAsked,
      videosCompleted,
      totalVideos: videoEngagement.length
    }
  };
};

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDownloadPDF = () => {
    if (studentData) {
      generateStudentPDF(studentData);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !studentData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Button variant="contained" onClick={goBack} sx={{ mt: 2 }}>
            Back to Progress
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!studentData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No data available</Typography>
          <Button variant="contained" onClick={goBack} sx={{ mt: 2 }}>
            Back to Progress
          </Button>
        </Paper>
      </Container>
    );
  }

  // Extract data for charts
  const timeData = {
    labels: studentData.videoEngagement.map(v => v.title.length > 20 ? 
            `${v.title.substring(0, 20)}...` : v.title),
    datasets: [{
      label: 'Watch Time (minutes)',
      data: studentData.videoEngagement.map(v => Math.round(v.watchTime / 60 * 10) / 10), // Convert to minutes
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
      borderColor: 'rgb(53, 162, 235)',
      borderWidth: 1
    }]
  };

  const questionsData = {
    labels: studentData.videoEngagement.map(v => v.title.length > 20 ? 
            `${v.title.substring(0, 20)}...` : v.title),
    datasets: [{
      label: 'Questions Asked',
      data: studentData.videoEngagement.map(v => v.questionsAsked),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1
    }]
  };

  const completionData = {
    labels: ['Completed', 'In Progress'],
    datasets: [{
      label: 'Video Completion',
      data: [
        studentData.stats.videosCompleted,
        studentData.stats.totalVideos - studentData.stats.videosCompleted
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ],
      borderColor: [
        'rgb(75, 192, 192)',
        'rgb(255, 159, 64)'
      ],
      borderWidth: 1
    }]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        font: {
          size: 16
        }
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>

<Box sx={{ 
  display: 'flex', 
  flexDirection: { xs: 'column', sm: 'row' },
  justifyContent: 'space-between', 
  alignItems: { xs: 'stretch', sm: 'center' }, 
  gap: 2,
  mb: 3
}}>
  <Button
    variant="outlined"
    startIcon={<ArrowBack />}
    onClick={goBack}
    sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
  >
    Back
  </Button>
  
  <Typography 
    variant="h4" 
    component="h1" 
    sx={{ 
      textAlign: 'center', 
      flex: { sm: 1 },
      fontSize: { xs: '1.5rem', sm: '2rem' }
    }}
  >
    Learning Analytics
  </Typography>
  
  <Box sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'row' }, 
    gap: 1,
    width: { xs: '100%', sm: 'auto' },
    justifyContent: { xs: 'space-between', sm: 'flex-end' }
  }}>
    <Button
      variant="contained"
      startIcon={<PictureAsPdf />}
      onClick={handleDownloadPDF}
      sx={{ 
        whiteSpace: 'nowrap',
        flex: { xs: 1, sm: 'auto' }, 
        fontSize: { xs: '0.8rem', sm: '0.875rem' }
      }}
    >
      {isMobile ? 'PDF' : 'Download PDF'}
    </Button>
    <Button
      variant="outlined"
      startIcon={<CalendarMonth />}
      onClick={() => setShowCalendar(!showCalendar)}
      sx={{ 
        whiteSpace: 'nowrap',
        flex: { xs: 1, sm: 'auto' },
        fontSize: { xs: '0.8rem', sm: '0.875rem' }
      }}
    >
      {isMobile ? (showCalendar ? 'Hide' : 'Show') : (showCalendar ? 'Hide Calendar' : 'Show Calendar')}
    </Button>
  </Box>
</Box>

        {showCalendar && (
          <Box sx={{ mb: 4, mt: 2 }}>
            <StreakCalendar activityData={studentData.dailyActivity} />
          </Box>
        )}

        <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            centered={!isMobile}
          >
            <Tab label="Summary" icon={<Dashboard />} iconPosition="start" />
            <Tab label="Watch Time" />
            <Tab label="Questions" />
            <Tab label="Completion" />
          </Tabs>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {activeTab === 0 && (
          <Box>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2,
              mb: 4
            }}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h6">Total Watch Time</Typography>
                <Typography variant="h4">{studentData.stats.formattedTotalTime}</Typography>
              </Paper>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
                <Typography variant="h6">Videos Watched</Typography>
                <Typography variant="h4">{studentData.stats.totalVideos}</Typography>
              </Paper>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                <Typography variant="h6">Videos Completed</Typography>
                <Typography variant="h4">{studentData.stats.videosCompleted}</Typography>
              </Paper>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                <Typography variant="h6">Questions Asked</Typography>
                <Typography variant="h4">{studentData.stats.totalQuestionsAsked}</Typography>
              </Paper>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>Top 3 Most Watched Videos</Typography>
            <Box sx={{ height: '300px', mb: 4 }}>
              <Bar 
                data={{
                  labels: studentData.topVideos.map(v => v.title.length > 25 ? 
                         `${v.title.substring(0, 25)}...` : v.title),
                  datasets: [{
                    label: 'Watch Time (minutes)',
                    data: studentData.topVideos.map(v => Math.round(v.watchTime / 60 * 10) / 10),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.6)',
                      'rgba(54, 162, 235, 0.6)',
                      'rgba(255, 206, 86, 0.6)'
                    ]
                  }]
                }} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Top 3 Most Watched Videos (minutes)'
                    }
                  }
                }} 
              />
            </Box>
            <Box sx={{ mb: 4 }}>
              <WeeklyActivity activityData={studentData.dailyActivity} />
            </Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 4
            }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Recently Watched</Typography>
                {studentData.recentVideos.length > 0 ? (
                  <Box component="ul" sx={{ pl: 2 }}>
                    {studentData.recentVideos.slice(0, 5).map((video, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>{video.title}</strong> - {Math.round(video.watchTime / 60 * 10) / 10} minutes
                          <Box component="span" sx={{ 
                            display: 'block', 
                            fontSize: '0.8rem', 
                            color: 'text.secondary' 
                          }}>
                            Last watched: {new Date(video.lastWatched).toLocaleDateString()}
                          </Box>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography>No recent activity</Typography>
                )}
              </Paper>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Video Completion Status</Typography>
                <Box sx={{ height: '200px' }}>
                  <Doughnut 
                    data={completionData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: 'Video Completion Status'
                        }
                      }
                    }} 
                  />
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ 
            height: { xs: '50vh', md: '60vh' }, 
            width: '100%',
            overflow: 'auto'
          }}>
              <Bar 
                data={timeData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Time Spent Watching Each Video (minutes)'
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        callback: function(value) {
                          const label = this.getLabelForValue(value);
                          const maxLength = window.innerWidth < 600 ? 10 : 15;
                          return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
                        }
                      }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value;
                        }
                      }
                    }
                  }
                }} 
              />
            </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Questions Asked by Video</Typography>
            <Box sx={{ height: '60vh' }}>
              <Bar 
                data={questionsData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Questions Asked During Each Video'
                    }
                  }
                }} 
              />
            </Box>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Video Completion Status</Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3
            }}>
              <Box sx={{ height: '300px' }}>
                <Doughnut 
                  data={completionData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        ...chartOptions.plugins.title,
                        text: 'Video Completion Overview'
                      }
                    }
                  }} 
                />
              </Box>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Completion Details</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    You have completed <strong>{studentData.stats.videosCompleted}</strong> out of <strong>{studentData.stats.totalVideos}</strong> videos.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Completion rate: {studentData.stats.totalVideos > 0 ? 
                      Math.round((studentData.stats.videosCompleted / studentData.stats.totalVideos) * 100) : 0}%
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2">
                  A video is considered complete when you've watched at least 90% of its duration.
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Completed Videos</Typography>
              {studentData.videoEngagement.filter(v => v.completed).length > 0 ? (
                <Box component="ul" sx={{ pl: 2 }}>
                  {studentData.videoEngagement
                    .filter(v => v.completed)
                    .map((video, index) => (
                      <Box component="li" key={index} sx={{ mb: 1 }}>
                        <Typography>{video.title}</Typography>
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography>No videos completed yet.</Typography>
              )}
            </Box>
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            <LearningCharts studentData={studentData} />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProgressAnalytics;