;import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { subDays, format } from 'date-fns';

const WeeklyActivity = ({ activityData = {} }) => {
  // Generate the last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });
  
  // Create data for the chart
  const chartData = {
    labels: days.map(day => format(new Date(day), 'EEE')),
    datasets: [
      {
        label: 'Minutes Studied',
        data: days.map(day => {
          const activity = activityData && activityData[day];
          return activity ? Math.round(activity.totalTime / 60) : 0;
        }),
        fill: true,
        backgroundColor: 'rgba(0, 229, 255, 0.2)',
        borderColor: 'rgba(0, 229, 255, 1)',
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: days.map(day => {
          const activity = activityData && activityData[day];
          return activity ? 'rgba(0, 229, 255, 1)' : 'rgba(255, 255, 255, 0.5)';
        }),
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };
  
  // Options for the chart
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            return format(new Date(days[index]), 'EEEE, MMMM d');
          },
          label: (context) => {
            const value = context.raw;
            return value > 0 
              ? `${value} minutes of learning activity`
              : 'No learning activity';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: 2
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        This Week's Learning Activity
      </Typography>
      
      <Box sx={{ height: 300 }}>
        <Line data={chartData} options={options} />
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Total this week
              </Typography>
              <Typography variant="h5">
                {days.reduce((total, day) => {
                  const activity = activityData && activityData[day];
                  return total + (activity ? Math.round(activity.totalTime / 60) : 0);
                }, 0)} minutes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Active days
              </Typography>
              <Typography variant="h5">
                {days.filter(day => activityData && activityData[day]).length} days
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default WeeklyActivity;