import React, { useState, useEffect } from 'react';
import { Paper, InputBase, IconButton, Tooltip, CircularProgress, Box } from '@mui/material';
import { Search, Mic, MicOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import './CommonStyles.css';

const SearchBar = ({ onSearch, value = '', onChange }) => {
  const [query, setQuery] = useState(value);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update local state when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Setup speech recognition when component mounts
  useEffect(() => {
    setupSpeechRecognition();
    // Cleanup on unmount
    return () => {
      if (window.recognition) {
        window.recognition.stop();
      }
    };
  }, []);

  // Setup speech recognition
  const setupSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Set language

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice search:', transcript);
      
      // Update the query
      setQuery(transcript);
      
      // Notify parent component if onChange is provided
      if (onChange) {
        onChange(transcript);
      }
      
      // Automatically submit search after voice recognition
      onSearch(transcript);
      
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMsg = 'Voice recognition failed';
      if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please try again.';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Microphone access denied. Please check your browser permissions.';
      }
      
      setErrorMessage(errorMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    window.recognition = recognition;
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    setErrorMessage('');
    
    if (!window.recognition) {
      setupSpeechRecognition();
      
      if (!window.recognition) {
        setErrorMessage('Speech recognition not supported in your browser');
        return;
      }
    }

    if (isListening) {
      window.recognition.stop();
      setIsListening(false);
    } else {
      try {
        window.recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setErrorMessage('Failed to start voice recognition');
        setIsListening(false);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    // Notify parent component if onChange is provided
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="search-container"
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        className={`search-bar ${isListening ? 'listening' : ''}`}
        elevation={3}
        sx={{ 
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <InputBase
          placeholder={isListening ? "Listening..." : "Search videos..."}
          value={query}
          onChange={handleChange}
          className="search-input"
          disabled={isListening}
          sx={{ ml: 1, flex: 1 }}
        />
        
        <Tooltip title="Search">
          <IconButton type="submit" disabled={isListening} size="medium">
            <Search />
          </IconButton>
        </Tooltip>
        
        {/* Simplified voice button with better positioning */}
        <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title={isListening ? "Stop listening" : "Search with voice"}>
            <IconButton 
              onClick={toggleListening}
              className={isListening ? "voice-active" : ""}
              color={isListening ? "error" : "default"}
              size="medium"
              sx={{ zIndex: 1 }}
            >
              {isListening ? <MicOff /> : <Mic />}
            </IconButton>
          </Tooltip>
          
          {isListening && (
            <CircularProgress 
              size={36}
              thickness={3}
              className="mic-progress"
              sx={{ color: '#f44336' }}
            />
          )}
        </div>
      </Paper>
      
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="search-error"
        >
          {errorMessage}
        </motion.div>
      )}
      
      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="voice-indicator"
        >
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#f44336',
            animation: 'blink 1s infinite'
          }}></span>
          Listening... Speak now
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchBar;