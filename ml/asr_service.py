#!/usr/bin/env python3
"""
ASR Service - Speech Recognition using Vosk
Captures microphone audio and outputs transcriptions as JSON lines
"""
import sys
import json
import queue
import sounddevice as sd

# Try to import vosk
try:
    from vosk import Model, KaldiRecognizer
except ImportError:
    print(json.dumps({"type": "error", "message": "Vosk not installed. Run: pip install vosk"}))
    sys.exit(1)

# Import the resolver
from resolver import resolve

MODEL_PATH = "models/vosk-model-small-en-us-0.15"
SAMPLE_RATE = 16000

def main():
    # Check for model
    try:
        model = Model(MODEL_PATH)
    except Exception as e:
        print(json.dumps({"type": "error", "message": f"Model not found at {MODEL_PATH}. Download from https://alphacephei.com/vosk/models"}))
        sys.exit(1)

    recognizer = KaldiRecognizer(model, SAMPLE_RATE)
    recognizer.SetWords(True)

    audio_queue = queue.Queue()

    def audio_callback(indata, frames, time, status):
        if status:
            print(json.dumps({"type": "warning", "message": str(status)}), file=sys.stderr)
        audio_queue.put(bytes(indata))

    print(json.dumps({"type": "status", "message": "ASR service starting..."}))

    try:
        with sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            blocksize=8000,
            dtype='int16',
            channels=1,
            callback=audio_callback
        ):
            print(json.dumps({"type": "status", "message": "Listening..."}))
            
            text_buffer = ""
            
            while True:
                data = audio_queue.get()
                
                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "")
                    
                    if text:
                        # Final result
                        print(json.dumps({"type": "final", "text": text}))
                        sys.stdout.flush()
                        
                        # Buffer and try to resolve
                        text_buffer += " " + text
                        if len(text_buffer) > 200:
                            text_buffer = text_buffer[-200:]
                        
                        # Try to resolve Bible reference
                        ref = resolve(text_buffer)
                        if ref:
                            print(json.dumps({"type": "verse", **ref}))
                            sys.stdout.flush()
                            text_buffer = ""  # Clear after detection
                else:
                    partial = json.loads(recognizer.PartialResult())
                    partial_text = partial.get("partial", "")
                    
                    if partial_text:
                        print(json.dumps({"type": "partial", "text": partial_text}))
                        sys.stdout.flush()

    except KeyboardInterrupt:
        print(json.dumps({"type": "status", "message": "Stopped"}))
    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
