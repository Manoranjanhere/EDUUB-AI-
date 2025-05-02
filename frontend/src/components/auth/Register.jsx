import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook
import './AuthStyles.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from auth context
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
    channelName: '',
    channelDescription: ''
  });
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        ...(formData.role !== 'teacher' && {
          channelName: undefined,
          channelDescription: undefined
        })
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'https://eduub-ai.onrender.com/api'}/auth/register`,
        submitData
      );

      if (response.data) {
        // Show success message briefly
        setShowSuccess(true);
        setError('');
        
        // Login the user immediately
        login(response.data.user, response.data.token);
        
        // Navigate to dashboard/home
        setTimeout(() => {
          navigate('/');
        }, 1000); // Short delay to show success message
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setSubmitting(false);
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
            Sign Up
          </Typography>
          
          {error && (
            <Typography color="error" className="auth-error">
              {error}
            </Typography>
          )}

          {/* Success message snackbar */}
          <Snackbar
            open={showSuccess}
            autoHideDuration={2000}
            onClose={() => setShowSuccess(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Registration successful! Redirecting to dashboard...
            </Alert>
          </Snackbar>

          <Box component="form" onSubmit={handleSubmit} className="auth-form">
            {/* Form fields remain the same */}
            <TextField
              fullWidth
              name="username"
              label="Username"
              required
              value={formData.username}
              onChange={handleChange}
              className="auth-input"
              margin="normal"
            />

            <TextField
              fullWidth
              name="email"
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              margin="normal"
            />

            <TextField
              fullWidth
              name="password"
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
              </Select>
            </FormControl>

            <AnimatePresence>
              {formData.role === 'teacher' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <TextField
                    fullWidth
                    name="channelName"
                    label="Channel Name"
                    required
                    value={formData.channelName}
                    onChange={handleChange}
                    className="auth-input"
                    margin="normal"
                  />

                  <TextField
                    fullWidth
                    name="channelDescription"
                    label="Channel Description"
                    multiline
                    rows={3}
                    value={formData.channelDescription}
                    onChange={handleChange}
                    className="auth-input"
                    margin="normal"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="auth-button"
              sx={{ mt: 3, mb: 2 }}
              disabled={submitting}
            >
              Sign Up
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              className="auth-link"
            >
              Already have an account? Sign In
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Register;