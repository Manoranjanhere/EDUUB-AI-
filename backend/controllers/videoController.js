import Video from '../models/Video.js';
import Channel from '../models/Channel.js';
import cloudinary from '../config/cloudinary.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';  // Add this import
import multer from 'multer';  // Also add this if not already imported
import ffmpeg from 'fluent-ffmpeg';  // And this for audio extraction
import { spawn } from 'child_process';
import * as ChromaDB from 'chromadb'; // Correct import


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup directories
const TRANSCRIBE_SCRIPT = path.join(__dirname, '../whisper_transcribe.py');
const tempDir = path.join(__dirname, 'temp');
const modelDir = path.join(__dirname, '.model');

[tempDir, modelDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});


// Update multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Export the upload middleware
export const upload = (req, res, next) => {
  console.log('Upload middleware started');
  
  uploadMiddleware.single('videoFile')(req, res, (err) => {
    console.log('Multer processing completed');
    
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`,
        details: err
      });
    } else if (err) {
      console.error('Non-Multer error:', err);
      return res.status(400).json({
        success: false,
        error: err.message,
        details: err
      });
    }
    console.log('Upload middleware successful');
    next();
  });
};


const uploadToCloudinary = async (filePath, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

const transcribeAudio = (audioPath, language = null) => {
  return new Promise((resolve, reject) => {
    const args = [TRANSCRIBE_SCRIPT, audioPath];
    if (language) args.push(language);

    const python = spawn('python', args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let transcriptData = null;

    python.stdout.on('data', (data) => {
      try {
        const result = JSON.parse(data.toString());
        transcriptData = result;
      } catch (e) {
        console.error('Failed to parse transcript:', e);
      }
    });
    python.stderr.on('data', (data) => {
      if (!data.toString().includes('FP16')) {
        console.error(`Transcription Error: ${data}`);
      }
    });

    python.on('close', (code) => {
      if (code !== 0 || !transcriptData) {
        reject(new Error(`Transcription failed with code ${code}`));
        return;
      }
      resolve(transcriptData);
    });
  });
};

export const uploadVideo = async (req, res) => {
  console.log('1. Upload process started...');
  console.log('Request details:', {
    filePresent: !!req.file,
    body: req.body
  });

  if (!req.file) {
    console.error('❌ No file in request');
    return res.status(400).json({ 
      success: false, 
      error: 'No video file uploaded' 
    });
  }

  const videoPath = req.file.path;
  const audioPath = path.join(tempDir, `${Date.now()}-audio.mp3`);
  
  try {
    const { title, description } = req.body;
    
    // 1. Upload video to Cloudinary
    console.log('2. Starting video upload to Cloudinary...');
    const videoResult = await uploadToCloudinary(videoPath, {
      resource_type: 'video',
      folder: 'videos'
    });
    console.log('✅ Video uploaded successfully:', {
      url: videoResult.secure_url,
      publicId: videoResult.public_id
    });

    // 2. Extract audio
    console.log('3. Starting audio extraction...');
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .on('progress', (progress) => {
          console.log('FFmpeg Progress:', progress);
        })
        .on('end', () => {
          console.log('✅ Audio extraction completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err);
          reject(err);
        })
        .save(audioPath);
    });

    // 3. Upload audio
    console.log('4. Starting audio upload to Cloudinary...');
    const audioResult = await uploadToCloudinary(audioPath, {
      resource_type: 'raw',
      folder: 'audio'
    });
    console.log('✅ Audio uploaded successfully:', {
      url: audioResult.secure_url,
      publicId: audioResult.public_id
    });

    // 4. Get transcript
    console.log('5. Starting transcription...');
    let transcriptionResult;
    try {
      transcriptionResult = await transcribeAudio(audioPath);
      console.log('✅ Transcription completed:', {
        textLength: transcriptionResult.text?.length || 0,
        language: transcriptionResult.language || 'en'
      });
    } catch (error) {
      console.error("❌ Transcription error:", error);
      transcriptionResult = { text: "" };
    }

    let cloudinaryVideoId = videoResult.public_id;
    let cloudinaryAudioId = audioResult.public_id;

    // 5. Check for Empty Transcript
    console.log('6. Checking transcript...');
    if (!transcriptionResult.text) {
      console.warn('⚠️ Empty transcript detected');
      cloudinaryVideoId = null;
      cloudinaryAudioId = null;
    }

    // 6. Create video document
    console.log('7. Creating video document...');
    const video = new Video({
      title,
      description,
      videoUrl: videoResult.secure_url,
      audioUrl: audioResult.secure_url,
      transcript: transcriptionResult.text,
      language: transcriptionResult.language || 'en',
      cloudinaryVideoId,
      cloudinaryAudioId,
      teacher: req.user._id,
      teacherEmail: req.user.email,
      channelName: req.user.channelName
    });

    await video.save();
    console.log('✅ Video document saved successfully:', {
      videoId: video._id,
      title: video.title
    });

    // 7. Update channel
    console.log('8. Updating channel...');
    await Channel.findOneAndUpdate(
      { owner: req.user._id },
      { $push: { videos: video._id }, $inc: { videoCount: 1 } }
    );
    console.log('✅ Channel updated successfully');

// 8. Store transcript in ChromaDB
console.log('9. Storing transcript in ChromaDB...');
try {
  // Initialize ChromaDB client with explicit server URL
  const chromaClient = new ChromaDB.ChromaClient({
    path: process.env.CHROMA_URL ||"http://chromadb:8000" // Make sure this points to your running ChromaDB server
  });
  
  // Define collection name based on user ID
  const collectionName = `user_${req.user._id}_transcripts`;
  console.log(`Using ChromaDB collection: ${collectionName}`);
  
  // Get or create collection
  const collection = await chromaClient.getOrCreateCollection({ name: collectionName });
  
  // Check if document with this ID already exists
  const existingDocs = await collection.get({
    ids: [video._id.toString()]
  });
  
  if (existingDocs && existingDocs.ids && existingDocs.ids.length > 0) {
    // Delete existing document if it exists
    console.log('Existing document found, updating...');
    await collection.delete({
      ids: [video._id.toString()]
    });
  }
  
  // Add the document (since we can't use upsert directly)
  await collection.add({
    documents: [transcriptionResult.text],
    ids: [video._id.toString()],
    metadatas: [{ 
      userId: req.user._id.toString(),
      videoId: video._id.toString(),
      title: video.title,
      createdAt: new Date().toISOString()
    }]
  });
  
  console.log('✅ Transcript stored in ChromaDB successfully');
} catch (chromaError) {
  console.error('❌ ChromaDB storage error:', chromaError);
  // Continue with upload process even if ChromaDB fails
}


    console.log('🎉 Upload process completed successfully!');
    res.status(201).json({ success: true, data: video });
  } catch (error) {
    console.error('❌ Upload process failed:', {
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({ 
      error: error.message,
      details: error
    });
  } finally {
    // Cleanup temp files
    console.log('9. Starting cleanup...');
    if (req.file) {
      console.log('Cleaning up video file:', req.file.path);
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('❌ Error deleting video file:', err);
        else console.log('✅ Video file deleted successfully');
      });
    }
    if (fs.existsSync(audioPath)) {
      console.log('Cleaning up audio file:', audioPath);
      fs.unlink(audioPath, (err) => {
        if (err) console.error('❌ Error deleting audio file:', err);
        else console.log('✅ Audio file deleted successfully');
      });
    }
    console.log('🏁 Process finished');
  }
};

export const getVideos = async (req, res) => {
  try {
    const { search, channelId } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // If channelId is provided, filter by teacher ID
    if (channelId) {
      query.teacher = channelId;
      console.log("Filtering videos by channel/teacher ID:", channelId);
    }

    const videos = await Video.find(query)
      .populate('teacher', 'username channelName profileImage')
      .sort({ createdAt: -1 });

    console.log(`Found ${videos.length} videos matching query`);
    
    res.json({ success: true, data: videos });
  } catch (error) {
    console.error("Error in getVideos:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('teacher', 'username channelName profileImage');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment view count
    video.views += 1;
    await video.save();

    res.json({ success: true, data: video });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check ownership
    if (video.teacher.toString() !== req.user._id.toString()) {
      console.log(`${video.teacher.toString()} user  ${req.user._id.toString()} `)
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete video from cloudinary
    if (video.cloudinaryVideoId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryVideoId, { 
          resource_type: 'video' 
        });
      } catch (error) {
        console.error('Error deleting video from Cloudinary:', error);
      }
    }

    // Delete audio from cloudinary
    if (video.cloudinaryAudioId) {
      try {
        await cloudinary.uploader.destroy(video.cloudinaryAudioId, { 
          resource_type: 'raw' 
        });
      } catch (error) {
        console.error('Error deleting audio from Cloudinary:', error);
      }
    }

    try {
      console.log('Deleting transcript from ChromaDB...');
      const chromaClient = new ChromaDB.ChromaClient({
        path: "http://localhost:8000"
      });
      
      // Use the teacher ID for the collection name, same as during upload
      const collectionName = `user_${video.teacher}_transcripts`;
      
      // Try to get the collection
      const collection = await chromaClient.getCollection({ name: collectionName });
      
      // Delete the document by ID
      await collection.delete({
        ids: [video._id.toString()]
      });
      
      console.log('✅ Transcript deleted from ChromaDB successfully');
    } catch (chromaError) {
      // Don't fail the whole operation if ChromaDB deletion fails
      console.error('❌ Error deleting transcript from ChromaDB:', chromaError);
    }

    // Update channel video count and remove video reference
    await Channel.findOneAndUpdate(
      { owner: req.user._id },
      { 
        $pull: { videos: video._id }, 
        $inc: { videoCount: -1 } 
      }
    );

    // Delete video document from MongoDB
    await Video.findByIdAndDelete(video._id);

    res.json({ 
      success: true, 
      message: 'Video and associated resources deleted successfully' 
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete video' 
    });
  }
};