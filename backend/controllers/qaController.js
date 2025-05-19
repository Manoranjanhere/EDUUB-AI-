import Video from '../models/Video.js';
import Groq from 'groq-sdk';
import say from 'say';
import dotenv from 'dotenv';
import * as ChromaDB from 'chromadb'; // Correct import
import StudentData from '../models/StudentData.js';

dotenv.config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

// At the top of your file, add this variable to track speech state
let activeSpeech = null;
let speechTimeoutCheck = null;

// Initialize ChromaDB client
const chromaClient = new ChromaDB.ChromaClient({
  path: process.env.CHROMA_URL || "http://eduub-chromadb:8000"  // Match your container name
});

// Add this function definition
async function testChromaConnection() {
  try {
    const heartbeat = await chromaClient.heartbeat();
    console.log("✅ ChromaDB connection successful:", heartbeat);
    return true;
  } catch (error) {
    console.error("❌ ChromaDB connection failed:", error);
    return false;
  }
}

export const stopSpeech = async (req, res) => {
  try {
    if (activeSpeech) {
      say.stop();
      activeSpeech = null;
      console.log('Speech stopped by user request');
      return res.json({ success: true, message: 'Speech stopped' });
    } else {
      return res.json({ success: true, message: 'No active speech to stop' });
    }
  } catch (error) {
    console.error('Error stopping speech:', error);
    return res.status(500).json({ success: false, error: 'Error stopping speech' });
  }
};

// Add this endpoint for handling beacon requests when page is unloaded
export const stopSpeechBeacon = (req, res) => {
  // This endpoint doesn't need authentication for cleanup purposes
  // It's called by the browser's sendBeacon API when the page is unloaded
  if (activeSpeech) {
    say.stop();
    activeSpeech = null;
    console.log('Speech stopped by beacon (page unload)');
  }
  // Return an empty response - though the client won't process it
  res.status(204).end();
};

export const handleQA = async (req, res) => {
  console.log('QA Request received:', {
    body: req.body,
  });
  
  try {
    const { question, videoId, currentTime, searchType = 'general' } = req.body;
    
    // Track the question being asked
    if (req.user && videoId) {
      try {
        await trackQuestion(req.user._id, videoId);
      } catch (trackErr) {
        console.error('Error tracking question:', trackErr);
        // Continue processing even if tracking fails
      }
    }
    
    // Test ChromaDB connection
    const chromaConnected = await testChromaConnection();
    if (!chromaConnected) {
      console.warn("⚠️ ChromaDB unavailable, proceeding with full transcript only");
    }

    // 1. Fetch the video from the database
    console.log('Fetching video from database...');
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    console.log('✅ Video fetched successfully:', {
      videoId: video._id,
      title: video.title,
      teacherId: video.teacher,
      searchType: searchType,
      currentTime: currentTime // Log the current time for debugging
    });

    // 2. Get relevant context from ChromaDB if available
    let context = '';
    
    // Handle different search types
    if (searchType === 'near' && currentTime) {
      // Near Time: Extract context from around the current timestamp
      console.log('Using near-time search:', currentTime);
      
      // If there's a transcript, process it for near time search
      if (video.transcript) {
        // For now, just use the full transcript as fallback
        context = video.transcript;
        
        // TODO: Add timestamp-based search when transcript has timestamps
      } else {
        console.warn('⚠️ No transcript available for timestamp search');
        context = "No transcript available for timestamp search.";
      }
    } else if (chromaConnected) {
      // General search: Check ChromaDB for the video transcript
      console.log('Using ChromaDB for general search');
      try {
        // First check if the collection exists
        let collection;
        try {
          // Try to get the existing collection
          collection = await chromaClient.getCollection({
            name: "video_transcripts"
          });
          console.log('Found existing ChromaDB collection');
        } catch (err) {
          console.log('Collection not found, creating new one');
          // Create a new collection if it doesn't exist
          collection = await chromaClient.createCollection({
            name: "video_transcripts",
            metadata: { "description": "Video transcripts for semantic search" }
          });
        }
        
        // Check if this video's transcript is in the collection
        const docCheck = await collection.get({
          where_document_ids: [videoId.toString()]
        });
        
        if (!docCheck || !docCheck.ids || docCheck.ids.length === 0) {
          console.log('⚠️ Video transcript not found in ChromaDB, falling back to database transcript');
          context = video.transcript || '';
        } else {
          // General search: Query ChromaDB for relevant parts based on the question
          const results = await collection.query({
            queryTexts: [question],
            nResults: 1,
            where_document_ids: [videoId.toString()],
            include: ["distances", "documents", "metadatas"]
          });
          
          // Debug output
          console.log('ChromaDB query results structure:', {
            hasDistances: !!results.distances,
            distancesArray: results.distances ? results.distances[0] : [],
            documentsLength: results.documents && results.documents[0] ? results.documents[0].length : 0
          });
          
          // Add distance metrics for debugging
          if (results && results.distances && results.distances[0]) {
            console.log('Result distances:', results.distances[0]);
          }
          
          // If we got results, use them as context
          if (results && 
              results.documents && 
              results.documents[0] && 
              results.documents[0].length > 0) {
            context = results.documents[0].join('\n\n');
            console.log('✅ Using ChromaDB context snippet, length:', context.length);
          } else {
            console.log('⚠️ No relevant context found in ChromaDB, falling back to full transcript');
            context = video.transcript || '';
          }
        }
      } catch (chromaError) {
        console.error('❌ ChromaDB query error:', chromaError);
        context = video.transcript || '';
      }
    } else {
      // Fallback: Use the full transcript from the database
      console.log('Using full transcript from database');
      context = video.transcript || '';
    }
    
    // If still no context, provide a fallback message
    if (!context || context.trim() === '') {
      console.warn('⚠️ No transcript available');
      context = "No transcript available for this video.";
    }
    
    console.log('Context length for LLM:', context.length);

    // 3. Generate answer using GROQ with retrieved context
    const prompt = `You are a teacher. Act as if this video is your own. Answer the following question to the best of your ability, using the context provided. If the answer isn't directly in the context, use your expertise to provide a helpful and informative response. Answer the question directly and concisely, without asking any follow-up questions or mentioning about the video or context.

Context: ${context}
Question: ${question}`;
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gemma2-9b-it",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content || "Sorry, I couldn't generate an answer.";

    res.json({
      success: true,
      data: {
        answer,
        question,
        searchType,
        usingChroma: chromaConnected && searchType !== 'near'
      }
    });
    
  } catch (error) {
    console.error('QA Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Define the trackQuestion function
async function trackQuestion(userId, videoId) {
  try {
    // Find student data
    await StudentData.findOneAndUpdate(
      { student: userId, video: videoId },
      { 
        $inc: { questionsAsked: 1 },
        $set: { lastWatched: new Date() }
      },
      { new: true, upsert: true }
    );
  } catch (error) {
    console.error('Helper function error tracking question:', error);
  }
}

// Speech synthesis
export const startSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    // Stop any existing speech
    if (activeSpeech) {
      say.stop();
    }
    
    // Start speaking
    say.speak(text, undefined, 1.0, (err) => {
      if (err) {
        console.error('Error in text-to-speech:', err);
      }
      activeSpeech = null;
    });
    
    activeSpeech = text;
    
    return res.json({
      success: true,
      message: 'Speech started'
    });
  } catch (error) {
    console.error('Error starting speech:', error);
    return res.status(500).json({
      success: false,
      error: 'Error starting speech'
    });
  }
};