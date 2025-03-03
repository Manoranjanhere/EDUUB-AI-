import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import VideoList from '../video/VideoList';
import './ChannelStyles.css';

const ChannelInfo = ({ channel }) => {

  const [activeTab, setActiveTab] = useState(0);

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
              <h3>About {channel?.channelName}</h3>
              <p>{channel?.channelDescription}</p>
              <div className="channel-stats-detailed">
                <div className="stat-item">
                  <span>Joined</span>
                  <span>{new Date(channel?.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="stat-item">
                  <span>Total Views</span>
                  <span>{channel?.totalViews || 0}</span>
                </div>
                <div className="stat-item">
                  <span>Subscribers</span>
                  <span>{channel?.subscribers || 0}</span>
                </div>
              </div>
            </Box>
            
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default ChannelInfo;