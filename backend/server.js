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

//middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://64.227.152.247:5173',
  'http://eduub.mano.systems',
  'https://eduub.mano.systems',
  'http://eduubserver.mano.systems',
  'https://eduubserver.mano.systems'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin', 'X-Requested-With']
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
app.use('/api/auth',authRoutes);
app.use('/api/videos',videoRoutes);
app.use('/api/qa',qaroutes);
app.use('/api/channelRoutes',channelRoutes);

app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found'
    });
  });
  
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>
{
    console.log(`Server is running on port ${PORT}`);
})