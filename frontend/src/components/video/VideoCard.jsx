import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardMedia, CardContent, Typography, Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import './VideoStyles.css';

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(31, 31, 31, 0.8)',
  borderRadius: '12px',
  overflow: 'hidden',
  backdropFilter: 'blur(10px)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const VideoCard = ({ video }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link to={`/video/${video._id}`} style={{ textDecoration: 'none' }}>
        <StyledCard>
          <div className="video-thumbnail-container">
            <CardMedia
              component="video"
              image={video.videoUrl}
              className="video-thumbnail"
            />
            <div className="video-duration">{video.duration || '0:00'}</div>
          </div>
          <CardContent className="video-content">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Avatar 
                src={video.teacher?.profileImage} 
                alt={video.channelName}
                className="channel-avatar"
              />
              <Box>
                <Typography variant="subtitle1" className="video-title">
                  {video.title}
                </Typography>
                <Typography variant="body2" className="channel-name">
                  {video.channelName}
                </Typography>
                <Typography variant="caption" className="video-stats">
                  {video.views} views • {new Date(video.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>
      </Link>
    </motion.div>
  );
};

export default VideoCard;