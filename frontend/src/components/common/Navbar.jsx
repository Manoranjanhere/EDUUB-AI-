import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from '@mui/material';
import { AccountCircle, VideoCall, School, Home } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import './CommonStyles.css';

const Navbar = () => {
  const navigate = useNavigate();
  const {isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  // Navigate to home and reset search
  const navigateToHome = () => {
    // Navigate to home page
    navigate('/');
    
    // Reset search by dispatching a custom event that VideoList component can listen for
    const resetEvent = new CustomEvent('reset-search', {
      bubbles: true
    });
    document.dispatchEvent(resetEvent);
  };

  return (
    <AppBar position="fixed" className="navbar">
      <Toolbar className="navbar-toolbar">
        <Box 
          className="navbar-logo-container" 
          onClick={navigateToHome}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            '&:hover': {
              '& .logo-icon': {
                color: '#00E5FF',
                transform: 'scale(1.1)',
              },
              '& .logo-text': {
                color: '#00E5FF',
              }
            }
          }}
        >
          <School 
            className="logo-icon" 
            fontSize="large"
            sx={{ 
              color: 'white', 
              transition: 'all 0.3s ease',
              animation: 'glow 3s infinite alternate'
            }} 
          />
          <Typography 
            variant="h6" 
            className="logo-text navbar-logo"
            sx={{ transition: 'color 0.3s ease' }}
          >
            EDUUB
          </Typography>
        </Box>

        {user ? (
          <div className="navbar-right">
            {/* Home button */}
            
            
            {/* Show upload button only for teachers */}
            {isAuthenticated && user.role === 'teacher' && (
              <Button
                startIcon={<VideoCall />}
                onClick={() => navigate('/upload')}
                className="upload-btn"
              >
                Upload
              </Button>
            )}
            
            <IconButton
              onClick={handleMenu}
              color="inherit"
              className="navbar-avatar"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {user.role === 'teacher' && (
                <MenuItem onClick={() => {
                  navigate('/channel');
                  handleClose();
                }}>
                  My Channel
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </div>
        ) : (
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;