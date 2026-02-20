// Whisper Worker for real-time transcription using Transformers.js
// This runs in a Web Worker to avoid blocking the main UI thread

let transcriber: any = null;
let isLoading = false;

// Initialize the Whisper model
async function initWhisper() {
  if (transcriber || isLoading) return;

  isLoading = true;
  self.postMessage({ type: "status", message: "Loading Whisper model..." });

  try {
    console.log("🔄 Worker: Starting import of @xenova/transformers...");

    // Dynamic import
    const { pipeline, env } = await import("@xenova/transformers");

    // IMPORTANT: Disable local model cache to avoid "fs" module error
    // This forces the library to only use remote models from Hugging Face
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    console.log("✅ Worker: Transformers imported successfully");

    self.postMessage({
      type: "status",
      message: "Downloading model (~40MB)...",
    });

    // Use the tiny.en model for faster performance
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny.en",
      {
        quantized: true, // Use quantized model for faster loading
        progress_callback: (progress: any) => {
          if (progress.status === "progress") {
            const pct = Math.round(progress.progress);
            self.postMessage({
              type: "status",
              message: `Downloading: ${pct}%`,
            });
          } else if (progress.status === "ready") {
            console.log("✅ Worker: Model file ready:", progress.file);
          }
        },
      }
    );

    console.log("✅ Worker: Model loaded successfully!");
    self.postMessage({ type: "status", message: "Model loaded!" });
    self.postMessage({ type: "ready" });
  } catch (error: any) {
    console.error("❌ Worker: Failed to load model:", error);
    self.postMessage({
      type: "error",
      message: `Failed to load model: ${error?.message || error}`,
    });
  } finally {
    isLoading = false;
  }
}

// Transcribe audio buffer
async function transcribe(audioData: Float32Array) {
  if (!transcriber) {
    self.postMessage({ type: "error", message: "Model not loaded yet" });
    return;
  }

  try {
    console.log(
      "🎤 Worker: Transcribing audio chunk of",
      audioData.length,
      "samples"
    );
    const result = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
    });

    if (result && result.text) {
      console.log("📝 Worker: Transcript:", result.text);
      self.postMessage({ type: "transcript", text: result.text.trim() });
    }
  } catch (error: any) {
    console.error("❌ Worker: Transcription failed:", error);
    self.postMessage({
      type: "error",
      message: `Transcription failed: ${error?.message || error}`,
    });
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, audioData } = event.data;
  console.log("📨 Worker received message:", type);

  switch (type) {
    case "init":
      await initWhisper();
      break;
    case "transcribe":
      await transcribe(audioData);
      break;
  }
};

// Log that worker is alive
console.log("🚀 Whisper Worker initialized and ready for messages");
