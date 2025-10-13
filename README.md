# EDUUB - Revolutionizing Learning from Pre-Recorded Lectures

## Overview
**EDUUB** (eduub.mano.systems) is a futuristic learning platform designed to transform how students engage with pre-recorded lectures. Unlike traditional platforms like YouTube and Coursera, where learning is one-way, EDUUB introduces interactive Q&A features powered by **Retrieval-Augmented Generation (RAG)**. This allows students to ask questions and receive context-aware answers in real-time, making online learning more personalized and engaging.

## Demo Lecture Video
Click the thumbnail below to watch a sample lecture:

[![Watch Video](bbbc26bd-35ab-4e50-8639-cf6d63485b46.png)](https://drive.google.com/file/d/1FR-yqaIbZQRYpBglWFRslBSb1_kyY1cH/view?usp=drive_link)

## Key Features
1. **Teacher Channels & Video Uploads**
   - Teachers can create channels and upload lecture videos.
   - **FFmpeg** extracts audio from videos.
   - Video and audio are stored in **Cloudinary**.
   - **OpenAI Whisper** generates transcripts.
   - All data is indexed in **MongoDB** and stored in **ChromaDB** for retrieval.

2. **Intelligent Q&A System (RAG-Powered)**
   - Students can ask questions in **two ways**:
     - **General Search** (searches across all videos by a teacher).
     - **Nearby Search** (searches within a specific timestamp of a video).
   - Answers are retrieved from **ChromaDB**.
   - If no relevant data is found, **Gemini API/Groq API** generates answers.
   - Responses are converted into speech using **RVC (Retrieval-Based Voice Conversion)** to mimic the teacher’s voice, creating a personalized experience.

## Search Modes Explained
### **1. General Search** (Across All Teacher's Videos)
   - Allows students to ask **any** question related to the teacher’s videos.
   - The RAG model scans **all stored transcripts** from the teacher’s uploaded videos.
   - It retrieves **relevant explanations** and formulates a response.
   - If no answer is found, **Gemini API/Groq API** provides a response based on general knowledge.

   **Example:**
   - Student: *"What is dynamic programming?"*
   - EDUUB searches all videos by the teacher, retrieves related content, and generates an answer.

### **2. Nearby Search** (Context-Specific to the Video Being Watched)
   - Useful when a student has a doubt **related to a specific part of the video**.
   - The system extracts **100 words before and after the selected timestamp**.
   - It sends this transcript to the AI for a highly contextual response.
   - Works with **both voice-based and text-based queries**.

   **Example:**
   - A student is watching a video at **minute 17** and asks a question.
   - EDUUB fetches the transcript from **16:50 to 17:10**.
   - AI generates an answer **specific to that portion of the lecture**.

## Installation & Setup
### **Prerequisites**
Ensure you have the following installed:
- **Docker** (for running ChromaDB)
- **Node.js** (for frontend)
- **MongoDB** (for storing metadata)
- **Python** (for backend services & AI processing)

### **1. Clone the Repository**
```sh
git clone https://github.com/your-repo/eduub.git
cd eduub
```

### **2. Setup ChromaDB in Docker**
Run the following command to start **ChromaDB** in a Docker container:
```sh
docker run -d --name chromadb -p 8000:8000 -v chroma_data:/chroma/chroma ghcr.io/chroma-core/chroma:latest
```

### **3. Start Backend Server**
Navigate to the backend directory and start the server:
```sh
cd backend
pip install -r requirements.txt
python app.py
```

### **4. Start Frontend Server**
Make sure to update the Vite configuration to run locally:
- **Change the API base URL** inside the frontend directory from:
  ```sh
  eddubserver.mano.systems → localhost:5000
  ```
- Then run:
  ```sh
  cd frontend
  npm install
  npm run dev
  ```

### **5. Test the Platform**
- Open your browser and visit: `http://localhost:3000`
- Try uploading a lecture and interacting with the Q&A system.

## Future Enhancements
- Improve RAG pipeline for even better contextual understanding.
- Add support for multilingual transcripts and search.
- Optimize response generation speed for real-time interaction.

## Conclusion
EDUUB is bridging the gap between students and teachers in online education. By making pre-recorded lectures interactive and AI-driven, students can now get **real-time, personalized answers** just like in a real classroom.

For more details, visit: **eduub.mano.systems**

