import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Divider, Card, Grid, Chip, Button
} from '@mui/material';
import { 
  AccessTime, PlayCircle, CheckCircle, QuestionAnswer, BarChart 
} from '@mui/icons-material';
import { getStudentData } from '../../services/studentDataService';
import ProgressAnalytics from './ProgressAnalytics';

const StudentReport = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({
    videos: [],
    stats: { 
      totalVideos: 0,
      totalWatchTime: 0,
      formattedTotalTime: '00:00:00',
      videosCompleted: 0,
      totalQuestions: 0
    }
  });
  const [error, setError] = useState(null);

  // Define fetchStudentData before using it in useEffect
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await getStudentData();
      
      if (response.success) {
        setStudentData(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error in student report:', error);
      setError('Something went wrong while loading your data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleBackToReport = () => {
    setShowAnalytics(false);
  };

  if (showAnalytics) {
    return <ProgressAnalytics goBack={handleBackToReport} />;
  }


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Title with Analytics Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Learning Progress
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<BarChart />}
          onClick={() => setShowAnalytics(true)}
        >
          View Analytics
        </Button>
      </Box>

      {/* Stats Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AccessTime color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Total Watch Time</Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {studentData.stats.formattedTotalTime}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PlayCircle color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Videos Watched</Typography>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
              {studentData.stats.totalVideos}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Videos Completed</Typography>
            <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
              {studentData.stats.videosCompleted}
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <QuestionAnswer color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Questions Asked</Typography>
            <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 'bold' }}>
              {studentData.stats.totalQuestions}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Video Activity Table */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Video Activity
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {studentData.videos.length === 0 ? (
          <Typography align="center" sx={{ py: 4 }}>
            You haven't watched any videos yet. Start learning!
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Lecture Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time Watched</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Questions</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Last Watched</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentData.videos.map((video, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{video.title}</TableCell>
                    <TableCell>{video.formattedWatchTime}</TableCell>
                    <TableCell>{video.questionsAsked}</TableCell>
                    <TableCell>
                      {video.completed ? (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="Completed" 
                          color="success" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          label="In Progress" 
                          color="primary" 
                          variant="outlined" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(video.lastWatched).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default StudentReport;