import { useState, useEffect, useRef, useCallback } from "react";

interface UseWhisperOptions {
  onTranscript: (text: string) => void;
  onStatusChange?: (status: string) => void;
  deviceId?: string;
  deviceLabel?: string;
}

/**
 * Whisper transcription hook.
 * Whisper runs in Electron's main process (native performance).
 * This hook just handles audio level monitoring and UI state.
 */
export function useWhisperTranscription({
  onTranscript,
  onStatusChange,
  deviceId = "default",
  deviceLabel,
}: UseWhisperOptions) {
  const [isRecording, setIsRecording] = useState(false);
  // Whisper runs in main process, so we're always "ready" on the frontend
  const [isModelReady] = useState(true);
  const [status, setStatus] = useState("Ready");

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const updateStatus = useCallback(
    (newStatus: string) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Listen for transcripts from main process (whisper-node)
  useEffect(() => {
    if (!window.api?.onTranscriptUpdate) return;

    const cleanup = window.api.onTranscriptUpdate((text) => {
      console.log("🎤 Received from Whisper:", text);
      onTranscript(text);
    });

    return cleanup;
  }, [onTranscript]);

  // Start "recording" - this enables audio monitoring
  // The actual transcription happens in the main process
  const startRecording = useCallback(async () => {
    try {
      console.log("🎙️ Starting audio monitoring...");
      const constraints = {
        audio:
          deviceId === "default" ? true : { deviceId: { exact: deviceId } },
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      audioContextRef.current = new AudioContext();

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Create analyser for dB meter (optional)
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(
        streamRef.current
      );
      source.connect(analyserRef.current);

      setIsRecording(true);
      updateStatus("Listening...");

      // Notify main process to start listening (if needed)
      window.api?.startListening?.(deviceLabel);

      console.log(
        "✅ Audio monitoring started - Whisper is running in main process"
      );
    } catch (error) {
      console.error("❌ Failed to start audio:", error);
      updateStatus(`Error: ${error}`);
    }
  }, [deviceId, deviceLabel, updateStatus]);

  // Stop recording
  const stopRecording = useCallback(() => {
    analyserRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);
    updateStatus("Stopped");

    // Notify main process to stop listening (if needed)
    window.api?.stopListening?.();
  }, [updateStatus]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    isModelReady,
    status,
    startRecording,
    stopRecording,
  };
}
