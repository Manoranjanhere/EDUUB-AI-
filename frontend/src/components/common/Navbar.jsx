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
} from '@mui/material';
import { AccountCircle, VideoCall } from '@mui/icons-material';
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

  return (
    <AppBar position="fixed" className="navbar">
      <Toolbar className="navbar-toolbar">
        <Typography 
          variant="h6" 
          className="navbar-logo"
          onClick={() => navigate('/')}
        >
          EDUUB
        </Typography>

        {user ? (
          <div className="navbar-right">
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