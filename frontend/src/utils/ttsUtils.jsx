
// Global variable for the speech synthesis controller
let speech = null;

/**
 * Speak text using Web Speech API
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @returns {Promise} - Resolves when speech is done
 */
export const speakText = (text, options = {}) => {
  return new Promise((resolve, reject) => {
    // Stop any existing speech
    stopSpeaking();
    
    // Check if browser supports speech synthesis
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported by browser");
      reject(new Error("Speech synthesis not supported by browser"));
      return;
    }
    
    // Create a new speech synthesis utterance
    speech = new SpeechSynthesisUtterance(text);
    
    // Set options
    speech.volume = options.volume || 1; // 0 to 1
    speech.rate = options.rate || 1; // 0.1 to 10
    speech.pitch = options.pitch || 1; // 0 to 2
    
    // Set voice if specified
    if (options.voice) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.name === options.voice || 
        voice.voiceURI === options.voice
      );
      
      if (selectedVoice) {
        speech.voice = selectedVoice;
      }
    }
    
    // Events
    speech.onend = () => {
      console.log("Speech finished");
      speech = null;
      resolve();
    };
    
    speech.onerror = (event) => {
      console.error("Speech error:", event);
      speech = null;
      reject(new Error("Speech synthesis error"));
    };
    
    // Start speaking
    window.speechSynthesis.speak(speech);
  });
};

/**
 * Stop current speech
 */
export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    speech = null;
    console.log("Speech stopped");
  }
};

/**
 * Check if speech is currently active
 * @returns {boolean} - True if speech is active
 */
export const isSpeaking = () => {
  return window.speechSynthesis ? window.speechSynthesis.speaking : false;
};

/**
 * Pause speech
 */
export const pauseSpeaking = () => {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    console.log("Speech paused");
  }
};

/**
 * Resume speech
 */
export const resumeSpeaking = () => {
  if (window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    console.log("Speech resumed");
  }
};

export const getVoices = () => {
  return window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
};