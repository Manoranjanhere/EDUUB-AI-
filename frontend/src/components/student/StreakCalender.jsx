import React, { useState } from 'react';
import { Paper, Typography, Box, Tooltip } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './analyticsStyles.css';

function StreakCalendar({ activityData = {} }) {
  const [date, setDate] = useState(new Date());
  const [activeDate, setActiveDate] = useState(null);

  const handleDateChange = (value) => {
    setDate(value);
  };

  const handleDateClick = (value) => {
    setActiveDate(value);
  };

  // Function to determine the activity level for a date
  const getActivityLevel = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const activity = activityData[dateString];
    
    if (!activity) return null;
    
    // Determine level based on time spent (in seconds)
    const timeSpent = activity.totalTime;
    if (timeSpent > 3600) return 'high'; // More than 1 hour
    if (timeSpent > 1800) return 'medium'; // More than 30 minutes
    if (timeSpent > 0) return 'low'; // Any activity
    return null;
  };
  
  // Function to get activity details for tooltip
  const getActivityDetails = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const activity = activityData[dateString];
    
    if (!activity) return "No activity";
    
    const hours = Math.floor(activity.totalTime / 3600);
    const minutes = Math.floor((activity.totalTime % 3600) / 60);
    const timeString = hours > 0 
      ? `${hours}h ${minutes}m` 
      : `${minutes}m`;
    
    const videoCount = activity.videos.length;
    
    return `Watched ${videoCount} video${videoCount !== 1 ? 's' : ''} (${timeString})`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Learning Streak Calendar
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'center', md: 'flex-start' },
        gap: 3
      }}>
        <Box sx={{ width: { xs: '100%', md: '60%' }, maxWidth: '500px' }}>
          <Calendar
            onChange={handleDateChange}
            value={date}
            onClickDay={handleDateClick}
            tileClassName={({ date }) => {
              const level = getActivityLevel(date);
              return level ? `activity-${level}` : null;
            }}
            tileContent={({ date }) => {
              const level = getActivityLevel(date);
              return level ? (
                <Tooltip title={getActivityDetails(date)}>
                  <div className="activity-dot"></div>
                </Tooltip>
              ) : null;
            }}
          />
        </Box>
        
        <Box sx={{ width: { xs: '100%', md: '40%' } }}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {activeDate 
                ? `Activity on ${activeDate.toLocaleDateString()}` 
                : 'Select a date to see details'}
            </Typography>
            
            {activeDate && (
              <>
                {(() => {
                  const dateString = activeDate.toISOString().split('T')[0];
                  const activity = activityData[dateString];
                  
                  if (!activity) {
                    return (
                      <Typography>No learning activity on this day</Typography>
                    );
                  }
                  
                  const hours = Math.floor(activity.totalTime / 3600);
                  const minutes = Math.floor((activity.totalTime % 3600) / 60);
                  const timeString = hours > 0 
                    ? `${hours} hours and ${minutes} minutes` 
                    : `${minutes} minutes`;
                  
                  return (
                    <Box>
                      <Typography>
                        You spent <strong>{timeString}</strong> watching videos on this day.
                      </Typography>
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Videos watched:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {activity.videos.map((title, index) => (
                          <Box component="li" key={index}>
                            <Typography variant="body2">{title}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })()}
              </>
            )}
          </Paper>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Activity Legend:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box className="legend-dot low"></Box> 
              <Typography variant="body2">Low: Less than 30 minutes</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box className="legend-dot medium"></Box> 
              <Typography variant="body2">Medium: 30-60 minutes</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box className="legend-dot high"></Box> 
              <Typography variant="body2">High: More than 1 hour</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default StreakCalendar;