import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook
import './AuthStyles.css';

const Login = () => { // Capitalize the component name
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); // Get login function from auth context
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        formData
      );
      
      // Use the login function from context instead of directly setting localStorage
      authLogin(response.data.user, response.data.token);
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during login');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={6} className="auth-paper">
          <Typography component="h1" variant="h5" className="auth-title">
            Sign In
          </Typography>

          {error && (
            <Typography color="error" className="auth-error">
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} className="auth-form">
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              margin="normal"
              autoComplete="email"
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              margin="normal"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="auth-button"
              sx={{ mt: 2, mb: 2 }}
            >
              Sign In
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/register')}
              className="auth-link"
            >
              Don't have an account? Sign Up
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Login;