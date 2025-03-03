import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VideoList from './components/video/VideoList';
import VideoPlayer from './components/video/VideoPlayer';
import VideoUpload from './components/video/VideoUpload';
import { AuthProvider } from './context/AuthContext';
import Channel from './components/channel/ChannelInfo';

import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff0000',
    },
    background: {
      default: '#0f0f0f',
      paper: '#1f1f1f',
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(31, 31, 31, 0.8)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="app">
            <Navbar />
            
            <main className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<VideoList />} />
                <Route path="/video/:id" element={<VideoPlayer />} />
                <Route path="/upload" element={<VideoUpload />} />
                <Route path="/channel" element={<Channel />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;