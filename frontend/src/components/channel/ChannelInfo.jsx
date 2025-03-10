import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import VideoList from '../video/VideoList';
import './ChannelStyles.css';

const ChannelInfo = ({ channel }) => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Log channel data to debug
    console.log("Channel data:", channel);
  }, [channel]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box className="channel-content">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className="channel-tabs"
      >
        <Tab label="Videos" />
        <Tab label="About" />
      </Tabs>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 0 ? (
            <VideoList teacherId={channel?._id} />
          ) : (
            <Box className="about-section">
              <Typography variant="h5">About {channel?.channelName}</Typography>
              <Typography variant="body1">{channel?.description || "No description available."}</Typography>
              <Box className="channel-stats-detailed" sx={{ mt: 3 }}>
                <Box className="stat-item">
                  <Typography variant="subtitle2">Joined</Typography>
                  <Typography variant="body1">
                    {channel?.createdAt ? new Date(channel.createdAt).toLocaleDateString() : "N/A"}
                  </Typography>
                </Box>
                <Box className="stat-item">
                  <Typography variant="subtitle2">Total Views</Typography>
                  <Typography variant="body1">{channel?.totalViews || 0}</Typography>
                </Box>
                <Box className="stat-item">
                  <Typography variant="subtitle2">Subscribers</Typography>
                  <Typography variant="body1">{channel?.subscriberCount || 0}</Typography>
                </Box>
                <Box className="stat-item">
                  <Typography variant="subtitle2">Videos</Typography>
                  <Typography variant="body1">{channel?.videoCount || 0}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default ChannelInfo;