/**
 * Audio Capture Module
 * Captures audio from system microphone and pipes to recognition engine
 */
import { spawn, ChildProcess } from "child_process";
import path from "node:path";

let pythonProcess: ChildProcess | null = null;

/**
 * Start capturing audio and processing through Python Vosk service
 */
export function startAudioCapture(
  onText: (text: string, isFinal: boolean) => void
): void {
  // Path to Python ASR service
  const pythonScript = path.join(__dirname, "..", "..", "ml", "asr_service.py");

  console.log("🎤 Starting Python ASR service...");

  pythonProcess = spawn("python3", [pythonScript], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  pythonProcess.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result.type === "final") {
          console.log("📝 Final:", result.text);
          onText(result.text, true);
        } else if (result.type === "partial") {
          onText(result.text, false);
        }
      } catch (e) {
        // Non-JSON output (logs)
        console.log("[ASR]", line);
      }
    }
  });

  pythonProcess.stderr?.on("data", (data: Buffer) => {
    console.error("[ASR Error]", data.toString());
  });

  pythonProcess.on("close", (code) => {
    console.log(`🎤 ASR service exited with code ${code}`);
    pythonProcess = null;
  });

  pythonProcess.on("error", (err) => {
    console.error("❌ Failed to start ASR service:", err);
  });
}

/**
 * Stop audio capture
 */
export function stopAudioCapture(): void {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    console.log("🎤 Audio capture stopped");
  }
}

/**
 * Check if ASR is running
 */
export function isCapturing(): boolean {
  return pythonProcess !== null && !pythonProcess.killed;
}
