import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
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

// CRITICAL: Handle OPTIONS requests explicitly before anything else
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://64.227.152.247:5173', 
    'http://localhost:5173',
    'https://eduub.mano.systems',
    'https://eduubserver.mano.systems',
    'https://eduub-ai.vercel.app'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // End preflight request with 204 No Content
  res.status(204).end();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`Origin: ${req.headers.origin || 'none'}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Standard CORS middleware for non-OPTIONS requests
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://64.227.152.247:5173', 
      'http://localhost:5173',
      'https://eduub.mano.systems',
      'https://eduubserver.mano.systems',
      'https://eduub-ai.vercel.app'
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

// Response Header Debugging Middleware
app.use((req, res, next) => {
  // Store the original methods
  const originalEnd = res.end;
  
  // Override end method
  res.end = function(chunk, encoding) {
    console.log('=== RESPONSE HEADERS ===');
    console.log(JSON.stringify(res.getHeaders()));
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special CORS diagnostic endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin || 'unknown';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json({
    success: true,
    message: 'CORS test successful!',
    origin: origin,
    headers: req.headers
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