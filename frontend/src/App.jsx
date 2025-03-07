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

// Futuristic theme with neon accents
const futuristicTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF', // Bright cyan (neon blue)
      light: '#5EFFFF',
      dark: '#00B8D4',
    },
    secondary: {
      main: '#FF1776', // Neon pink
      light: '#FF5BA4',
      dark: '#C2185B',
    },
    background: {
      default: '#0F1119', // Deep space blue-black
      paper: 'rgba(23, 25, 36, 0.85)', // Semi-transparent dark blue
    },
    error: {
      main: '#FF1744', // Vivid red
    },
    warning: {
      main: '#FFEA00', // Bright yellow
    },
    success: {
      main: '#00E676', // Neon green
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Exo 2", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h3: {
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.06em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          padding: '8px 20px',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0%',
            height: '2px',
            backgroundColor: 'currentColor',
            transition: 'width 0.3s ease-in-out',
          },
          '&:hover:after': {
            width: '80%',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #00E5FF 30%, #00B8D4 90%)',
          boxShadow: '0 3px 10px rgba(0, 229, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 5px 15px rgba(0, 229, 255, 0.5)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #FF1776 30%, #C2185B 90%)',
          boxShadow: '0 3px 10px rgba(255, 23, 118, 0.3)',
          '&:hover': {
            boxShadow: '0 5px 15px rgba(255, 23, 118, 0.5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(23, 25, 36, 0.95) 0%, rgba(35, 37, 49, 0.85) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(23, 25, 36, 0.95) 0%, rgba(35, 37, 49, 0.85) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, rgba(15, 17, 25, 0.95) 0%, rgba(20, 22, 31, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 20px rgba(0, 229, 255, 0.15)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.1)',
        }
      }
    }
  },
});

function App() {
  return (
    <ThemeProvider theme={futuristicTheme}>
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