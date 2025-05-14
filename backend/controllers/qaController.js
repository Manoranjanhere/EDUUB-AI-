import Video from '../models/Video.js';
import Groq from 'groq-sdk';
import say from 'say';
import dotenv from 'dotenv';
import * as ChromaDB from 'chromadb'; // Correct import

dotenv.config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || "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" 
});

// At the top of your file, add this variable to track speech state
let activeSpeech = null;
let speechTimeoutCheck = null;

// Initialize ChromaDB client
const chromaClient = new ChromaDB.ChromaClient({
  path: process.env.CHROMA_URL || "http://eduub-chromadb:8000"  // Match your container name
});

// Function to setup a timeout to check for abandoned speech
// const setupSpeechTimeout = () => {
//   // Clear any existing timeout
//   if (speechTimeoutCheck) {
//     clearTimeout(speechTimeoutCheck);
//   }
  
//   // Create new timeout - check every 30 seconds if speech is still active
//   speechTimeoutCheck = setTimeout(() => {
//     if (activeSpeech) {
//       console.log('Speech appears to be abandoned (client disconnected), stopping...');
//       say.stop();
//       activeSpeech = null;
//     }
//     // Setup the next check
//     setupSpeechTimeout();
//   }, 30000); // 30 seconds
// };

// // Start the check when the server starts
// setupSpeechTimeout();

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
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Add this function for starting speech
export const startSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ success: false, error: 'No text provided' });
    }
    
    // Stop any existing speech
    if (activeSpeech) {
      say.stop();
    }
    
    // Start new speech
    activeSpeech = text;
    say.speak(text, null, null, (err) => {
      if (err) console.error('Text-to-speech error:', err);
      activeSpeech = null;
    });
    
    return res.json({ success: true, message: 'Speech started' });
  } catch (error) {
    console.error('Error starting speech:', error);
    return res.status(500).json({ success: false, error: error.message });
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
      console.log(`🔍 Performing Near Time search around timestamp: ${currentTime}s`);
      
      // Use transcript directly from the video document
      const fullTranscript = video.transcript || '';
      
      if (fullTranscript && fullTranscript.length > 0) {
        // Get approximate word position based on timestamp
        // Assuming average speaking rate of ~150 words per minute = 2.5 words per second
        const wordsPerSecond = 2.5;
        const approxWordPosition = Math.floor(currentTime * wordsPerSecond);
        
        // Extract context around the current position
        const words = fullTranscript.split(/\s+/);
        
        // Find starting position, ensuring we don't go below 0
        // Use exactly 100 words before, as requested
        const contextStartWord = Math.max(0, approxWordPosition - 100);
        
        // Get the context (100 words before + 100 words after = 200 words total)
        const contextWords = words.slice(contextStartWord, contextStartWord + 200);
        context = contextWords.join(' ');
        
        console.log('✅ Using Near Time context:', {
          timestamp: currentTime,
          approximateWordPosition: approxWordPosition,
          contextLength: context.length,
          wordCount: contextWords.length,
          contextStartWord: contextStartWord,
          transcriptTotalWords: words.length,
          contextPreview: context
        });
      } else {
        console.log('⚠️ No transcript available for Near Time search, using empty context');
        context = '';
      }
    } else if (chromaConnected) {
      // General search: Use ChromaDB for semantic search
      console.log('🔍 Performing General search using ChromaDB');
      try {
        // Use the teacher's ID for the collection since they own the videos
        const collectionName = `user_${video.teacher}_transcripts`;
        console.log(`Using collection: ${collectionName}`);
        
        const collection = await chromaClient.getOrCreateCollection({ name: collectionName });
        
        // First check if this document exists in the collection
        const docCheck = await collection.get({
          ids: [videoId.toString()]
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
            console.log(`Distance metrics for query "${question.substring(0, 30)}...":`);
            console.log(`- Closest distance: ${Math.min(...results.distances[0])}`);
            console.log(`- All distances: ${results.distances[0].join(', ')}`);
          }
          
          // Check if results exist AND are semantically relevant
          if (results && 
              results.distances && 
              results.distances[0] &&
              results.distances[0].length > 0 &&
              results.documents && 
              results.documents[0] && 
              results.documents[0].length > 0) {
            
            // Get the closest distance (lower is better)
            const closestDistance = Math.min(...results.distances[0]);
            
            // Only use results if they're reasonably close (adjust threshold as needed)
            if (closestDistance < 1.5) {  // Threshold value
              context = results.documents[0].join('\n\n');
              console.log('✅ Found RELEVANT transcript parts in ChromaDB:', {
                segments: results.documents[0].length,
                contextLength: context.length,
                relevanceScore: closestDistance,
                contextPreview: context
              });
            } else {
              console.log('⚠️ Results found but NOT RELEVANT enough (distance: ' + closestDistance + '), falling back to full transcript');
              context = video.transcript || '';
            }
          } else {
            console.log('⚠️ No proper results structure from ChromaDB, falling back to full transcript');
            context = video.transcript || '';
          }
        }
      } catch (error) {
        console.error('Error querying ChromaDB:', error);
        console.warn('⚠️ Falling back to full transcript due to ChromaDB error');
        context = video.transcript || '';
      }
    } else {
      // ChromaDB not available, use full transcript
      console.log('ChromaDB not connected, using full transcript');
      context = video.transcript || '';
    }
    
    // Ensure we have some context
    if (!context || context.trim().length === 0) {
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

// Add the StudentData import at the top of the file
import StudentData from '../models/StudentData.js';

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