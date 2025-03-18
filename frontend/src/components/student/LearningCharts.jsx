import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';

const LearningCharts = ({ studentData }) => {
  if (!studentData) return <Typography>No data available</Typography>;
  
  // Define data for different chart types
  const weeklyActivityData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Daily Watch Time (minutes)',
        data: generateWeeklyData(studentData),
        fill: true,
        backgroundColor: 'rgba(0, 229, 255, 0.2)',
        borderColor: 'rgba(0, 229, 255, 1)',
        tension: 0.4
      }
    ]
  };

  const videoCompletionData = {
    labels: ['Completed', 'In Progress'],
    datasets: [
      {
        data: [
          studentData.stats.videosCompleted,
          studentData.stats.totalVideos - studentData.stats.videosCompleted
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const questionsDistributionData = {
    labels: studentData.videoEngagement.slice(0, 8).map(v => 
      v.title.length > 15 ? `${v.title.substring(0, 15)}...` : v.title
    ),
    datasets: [
      {
        label: 'Questions Asked',
        data: studentData.videoEngagement.slice(0, 8).map(v => v.questionsAsked),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Engagement analytics data
  const engagementData = {
    labels: ['Watch Time', 'Questions', 'Video Completion', 'Learning Streak', 'Content Diversity'],
    datasets: [
      {
        label: 'Your Engagement',
        data: [
          calculateWatchTimeScore(studentData),
          calculateQuestionsScore(studentData),
          calculateCompletionScore(studentData),
          calculateStreakScore(studentData),
          calculateDiversityScore(studentData)
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(153, 102, 255, 1)'
      }
    ]
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
      }
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Interactive Learning Analytics</Typography>
      
      <Grid container spacing={3}>
        {/* Weekly Activity Line Chart */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: 320, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(15, 17, 25, 0.9) 0%, rgba(35, 37, 49, 0.85) 100%)'
            }}
          >
            <Line 
              data={weeklyActivityData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Weekly Learning Activity'
                  }
                }
              }} 
            />
          </Paper>
        </Grid>
        
        {/* Video Completion Doughnut Chart */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: 320, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(15, 17, 25, 0.9) 0%, rgba(35, 37, 49, 0.85) 100%)'
            }}
          >
            <Doughnut 
              data={videoCompletionData} 
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
          </Paper>
        </Grid>
        
        {/* Questions Distribution Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: 320, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(15, 17, 25, 0.9) 0%, rgba(35, 37, 49, 0.85) 100%)'
            }}
          >
            <Bar 
              data={questionsDistributionData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Questions Asked by Video'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }} 
            />
          </Paper>
        </Grid>
        
        {/* Engagement Radar Chart */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              height: 320, 
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(15, 17, 25, 0.9) 0%, rgba(35, 37, 49, 0.85) 100%)'
            }}
          >
            <Radar 
              data={engagementData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Learning Engagement Analysis'
                  }
                },
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    ticks: {
                      stepSize: 20
                    }
                  }
                }
              }} 
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper functions for generating chart data
const generateWeeklyData = (studentData) => {
  // In a real app, you'd aggregate daily watch times
  // This is a placeholder that generates random data based on total watch time
  const totalMinutes = studentData.stats.totalTimeSpent / 60;
  return [1, 2, 3, 4, 5, 6, 7].map(() => 
    Math.floor(Math.random() * (totalMinutes / 5)) + 1
  );
};

const calculateWatchTimeScore = (studentData) => {
  // Example algorithm: 10 minutes = 20 points, max 100
  return Math.min(100, Math.floor(studentData.stats.totalTimeSpent / 60 / 10 * 20));
};

const calculateQuestionsScore = (studentData) => {
  // Example algorithm: 5 questions = 50 points, max 100
  return Math.min(100, studentData.stats.totalQuestionsAsked * 10);
};

const calculateCompletionScore = (studentData) => {
  // Percentage of completed videos
  return studentData.stats.totalVideos > 0 
    ? Math.round((studentData.stats.videosCompleted / studentData.stats.totalVideos) * 100)
    : 0;
};

const calculateStreakScore = (studentData) => {
  // Example: count days with activity in the last 7 days
  // For demo, generate a random score between 30-90
  return Math.floor(Math.random() * 60) + 30;
};

const calculateDiversityScore = (studentData) => {
  // For demo, generate a score based on number of unique videos watched
  return Math.min(100, studentData.videoEngagement.length * 10);
};

export default LearningCharts;