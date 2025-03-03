import React from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { NotificationsNone, NotificationsActive } from '@mui/icons-material';
import { motion } from 'framer-motion';
import './ChannelStyles.css';
const ChannelHeader = ({ channel, isSubscribed, onSubscribe }) => {
  return (
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="channel-header"
    >
      <Box className="channel-info">
        <Box className="channel-details">
          <Typography variant="h5" className="channel-name">
            {channel?.channelName}
          </Typography>
          <Typography variant="body2" className="channel-stats">
            {channel?.subscribers} subscribers • {channel?.videoCount} videos
          </Typography>
          <Typography variant="body2" className="channel-description">
            {channel?.channelDescription}
          </Typography>
        </Box>
      </Box>

      <Box className="channel-actions">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant={isSubscribed ? "outlined" : "contained"}
            startIcon={isSubscribed ? <NotificationsActive /> : <NotificationsNone />}
            onClick={onSubscribe}
            className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default ChannelHeader;