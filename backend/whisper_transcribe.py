import sys
import whisper
import json
import warnings

warnings.filterwarnings("ignore")

def transcribe_audio(audio_path, language=None):
    model = whisper.load_model("tiny")
    
    # Set transcription options
    options = {
        "task": "transcribe",
        "language": language if language else None,  # Auto-detect if not specified
        "fp16": False
    }
    
    result = model.transcribe(audio_path, **options)
    
    response = {
        "text": result["text"],
        "language": result["language"],
        "detected_language": language is None
    }
    
    print(json.dumps(response, ensure_ascii=False))

if __name__ == "__main__":
    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else None
    transcribe_audio(audio_path, language)