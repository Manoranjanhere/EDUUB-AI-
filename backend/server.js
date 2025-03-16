import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Make sure this is imported
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import qaroutes from './routes/qaroutes.js';
import channelRoutes from './routes/channelRoutes.js';

dotenv.config();

//ES module fixes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// RESTORE CORS MIDDLEWARE with proper configuration
// Handle OPTIONS requests properly
app.options('*', cors({
  origin: function(origin, callback) {
    // List all allowed origins
    const allowedOrigins = [
      'http://localhost:5173',        // Local development
      'https://localhost:5173',       // Local with HTTPS
      'http://64.227.152.247:5173',   // Server IP + port
      'https://eduub.mano.systems',   // Production frontend
      'http://eduub.mano.systems'     // Production frontend HTTP
    ];
    
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With']
}));

// Regular CORS middleware for all other requests
app.use(cors({
  origin: function(origin, callback) {
    // List all allowed origins
    const allowedOrigins = [
      'http://localhost:5173',        // Local development
      'https://localhost:5173',       // Local with HTTPS
      'http://64.227.152.247:5173',   // Server IP + port
      'https://eduub.mano.systems',   // Production frontend
      'http://eduub.mano.systems'     // Production frontend HTTP
    ];
    
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true
}));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnostic endpoint - now accepts all origins
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    origin: req.headers.origin || 'unknown'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

//connect to DB
try {
  await connectDB();
} catch (error) {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
}

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/qa', qaroutes);
app.use('/api/channelRoutes', channelRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});