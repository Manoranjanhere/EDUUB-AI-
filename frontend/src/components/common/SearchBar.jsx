import React, { useState } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import { Search, Mic } from '@mui/icons-material';
import { motion } from 'framer-motion';
import './CommonStyles.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
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
        className="search-bar"
      >
        <InputBase
          placeholder="Search videos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <IconButton type="submit">
          <Search />
        </IconButton>
        <IconButton>
          <Mic />
        </IconButton>
      </Paper>
    </motion.div>
  );
};

export default SearchBar;