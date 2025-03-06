import Video from '../models/Video.js';
import Groq from 'groq-sdk';
import say from 'say';
import dotenv from 'dotenv';
import * as ChromaDB from 'chromadb'; // Correct import

dotenv.config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

// Initialize ChromaDB client
const chromaClient = new ChromaDB.ChromaClient();

export const handleQA = async (req, res) => {
  console.log('QA Request received:', {
    body: req.body,
    headers: req.headers,
    user: req.user?._id
  });
  try {
    const { question, videoId } = req.body;
        // Query ChromaDB for the relevant parts of the transcript
        // console.log('Querying ChromaDB for relevant transcript parts...');
        // let relevantParts = [];
        // try {
        //   const collectionName = `user_${req.user._id}_transcripts`;
        //   const collection = await chromaClient.getOrCreateCollection({ name: collectionName });
        //   const results = await collection.query({
        //     query_texts: [question],
        //     n_results: 5
        //   });
        //   relevantParts = results.documents[0];
        // } catch (error) {
        //   console.error('Error querying ChromaDB:', error);
        // }
    
        // let context = '';
        // if (relevantParts && relevantParts.length > 0) {
        //   context = relevantParts.join('\n');
        // } else {
        //   console.warn('No relevant transcript parts found in ChromaDB. Using AI general knowledge.');
        // }
    
        // console.log('Generating prompt with context length:', context.length);



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
      title: video.title
    });

    // 2. Extract the transcript from the video object
    const transcript = video.transcript;

    // Generate answer using GROQ
    const prompt = `You are a teacher. Act as if this video is your own. Answer the following question to the best of your ability, using the  context. If the answer isn't directly in the context, use your expertise to provide a helpful and informative response. Answer the question directly and concisely, without asking any follow-up questions or mentioning about the video or context.\n\ncontext: ${transcript}\nQuestion: ${question}`;
    
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
        question
      }
    });
    // Convert answer to speech
    try {
      await new Promise((resolve, reject) => {
        say.speak(answer, null, null, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }

   
  } catch (error) {
    console.error('QA Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};