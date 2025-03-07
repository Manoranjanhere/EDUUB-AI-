import Video from '../models/Video.js';
import Groq from 'groq-sdk';
import say from 'say';
import dotenv from 'dotenv';
import * as ChromaDB from 'chromadb'; // Correct import

dotenv.config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

// At the top of your file, add this variable to track speech state
let activeSpeech = null;

// Initialize ChromaDB client
const chromaClient = new ChromaDB.ChromaClient({
  path: "http://localhost:8000" // Point to your Docker container
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
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const handleQA = async (req, res) => {
  console.log('QA Request received:', {
    body: req.body,
    headers: req.headers,
    user: req.user?._id
  });
  try {
    const { question, videoId } = req.body;
    
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
      teacherId: video.teacher
    });

    // 2. Get relevant context from ChromaDB if available
    let context = '';
    
    if (chromaConnected) {
      console.log('Querying ChromaDB for relevant transcript parts...');
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
          // Query with distance metrics
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
            if (closestDistance < 1.5) {  // Threshold value - will need tuning
              context = results.documents[0].join('\n\n');
              console.log('✅ Found RELEVANT transcript parts in ChromaDB:', {
                segments: results.documents[0].length,
                contextLength: context.length,
                relevanceScore: closestDistance,
                context:context
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
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content || "Sorry, I couldn't generate an answer.";

    res.json({
      success: true,
      data: {
        answer,
        question,
        usingChroma: chromaConnected
      }
    });
    
    // Convert answer to speech
try {
  // Only start speech if none is active
  if (!activeSpeech) {
    activeSpeech = answer;
    say.speak(answer, null, null, (err) => {
      if (err) console.error('Text-to-speech error:', err);
      // Clear active speech when done
      activeSpeech = null;
    });
  } else {
    console.log('Speech already in progress, not starting new speech');
  }
} catch (error) {
  console.error('Text-to-speech error:', error);
  activeSpeech = null;
}
  } catch (error) {
    console.error('QA Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};