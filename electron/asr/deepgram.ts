/**
 * Deepgram ASR Integration
 * Real-time cloud-based speech recognition
 */
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { spawn, ChildProcess } from "child_process";

let deepgramConnection: any = null;
let micProcess: ChildProcess | null = null;
let currentDeviceLabel: string | undefined;

// macOS default sample rate is 48000, sox will use this
const SAMPLE_RATE = 48000;

/**
 * Start Deepgram live transcription
 */
export function startDeepgram(
  onText: (text: string, isFinal: boolean) => void,
  onError?: (error: Error) => void,
  deviceLabel?: string
): void {
  currentDeviceLabel = deviceLabel;
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    console.error("❌ DEEPGRAM_API_KEY not set in environment");
    onError?.(new Error("DEEPGRAM_API_KEY not configured"));
    return;
  }

  console.log("🎤 Starting Deepgram ASR...");

  const deepgram = createClient(apiKey);

  // Create live transcription connection
  deepgramConnection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    interim_results: true,
    punctuate: true,
    endpointing: 3500,
    sample_rate: SAMPLE_RATE,
    encoding: "linear16",
    channels: 1,
  });

  deepgramConnection.on(LiveTranscriptionEvents.Open, () => {
    console.log("✅ Deepgram connection opened");
    startMicrophoneCapture();
  });

  deepgramConnection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    const transcript = data.channel?.alternatives?.[0]?.transcript;
    if (!transcript) return;

    const isFinal = data.is_final || data.speech_final;
    console.log(`📝 ${isFinal ? "Final" : "Partial"}: ${transcript}`);
    onText(transcript.toLowerCase(), isFinal);
  });

  deepgramConnection.on(LiveTranscriptionEvents.Error, (error: Error) => {
    console.error("❌ Deepgram error:", error);
    onError?.(error);
  });

  deepgramConnection.on(LiveTranscriptionEvents.Close, () => {
    console.log("🔌 Deepgram connection closed");
  });
}

/**
 * Start microphone capture and pipe to Deepgram
 * Uses sox/rec for audio capture on macOS
 */
function startMicrophoneCapture(): void {
  if (!deepgramConnection) return;

  console.log(`🎙️ Starting microphone at ${SAMPLE_RATE}Hz...`);

  // Build environment with AUDIODEV for device selection
  const spawnEnv = { ...process.env };
  if (currentDeviceLabel && currentDeviceLabel !== "default") {
    spawnEnv.AUDIODEV = currentDeviceLabel;
    console.log(`🎙️ AUDIODEV set to: "${currentDeviceLabel}"`);
  }

  // Use sox/rec to capture audio on macOS
  // Let sox use the native sample rate (48000 on macOS)
  micProcess = spawn(
    "rec",
    [
      "-q", // Quiet mode (less output)
      "-t",
      "raw", // Raw audio format
      "-e",
      "signed-integer",
      "-b",
      "16", // 16 bits per sample
      "-c",
      "1", // Mono
      "-r",
      SAMPLE_RATE.toString(),
      "-", // Output to stdout
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: spawnEnv,
    }
  );

  let bytesSent = 0;

  micProcess.stdout?.on("data", (chunk: Buffer) => {
    if (deepgramConnection?.getReadyState() === 1) {
      deepgramConnection.send(chunk);
      bytesSent += chunk.length;

      // Log progress every 48000 bytes (~1 second of audio)
      if (bytesSent % (SAMPLE_RATE * 2) < chunk.length) {
        console.log(
          `🎤 Audio streaming... (${Math.round(bytesSent / 1024)}KB sent)`
        );
      }
    }
  });

  micProcess.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString();
    // Only log actual errors, not sox info messages
    if (
      msg.toLowerCase().includes("fail") ||
      msg.toLowerCase().includes("error")
    ) {
      console.error("[Mic Error]", msg);
    }
  });

  micProcess.on("close", (code) => {
    console.log(`🎤 Mic process exited with code ${code}`);
  });

  micProcess.on("error", (err) => {
    console.error("❌ Failed to start mic:", err);
    console.log("💡 Install sox: brew install sox");
  });
}

/**
 * Stop Deepgram transcription
 */
export function stopDeepgram(): void {
  if (micProcess) {
    micProcess.kill();
    micProcess = null;
  }

  if (deepgramConnection) {
    deepgramConnection.finish();
    deepgramConnection = null;
  }

  currentDeviceLabel = undefined;
  console.log("🎤 Deepgram stopped");
}

/**
 * Check if Deepgram is connected
 */
export function isDeepgramConnected(): boolean {
  return deepgramConnection?.getReadyState() === 1;
}
