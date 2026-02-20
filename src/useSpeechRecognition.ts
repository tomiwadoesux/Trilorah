import { useState, useEffect, useRef, useCallback } from "react";

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  onError?: (error: string) => void;
  deviceId?: string;
}

/**
 * A simplified speech recognition hook that uses the browser's Web Speech API
 * with proper error handling and reconnection logic.
 */
export function useSpeechRecognition({
  onTranscript,
  onInterim,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      onError?.("Speech recognition not supported in this browser");
    }
  }, [onError]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Speech recognition not supported");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log("🗣️ Final:", finalTranscript);
        onTranscript(finalTranscript);
      } else if (interimTranscript) {
        onInterim?.(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);

      if (event.error === "network") {
        onError?.(
          "Network error - Speech API requires internet connection. Use manual input instead."
        );
      } else if (event.error === "not-allowed") {
        onError?.("Microphone access denied");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        onError?.(event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition:", e);
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
      onError?.("Failed to start speech recognition");
    }
  }, [onTranscript, onInterim, onError]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
