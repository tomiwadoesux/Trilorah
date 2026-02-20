/**
 * ML Resolver WebSocket Client
 * Connects to Python ML server for Bible reference resolution
 */
import WebSocket from "ws";

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
const RECONNECT_DELAY = 3000;

interface VerseDetection {
  book: string;
  chapter: number;
  verse: number | null;
  confidence: number;
}

type VerseCallback = (data: VerseDetection) => void;
let onVerseCallback: VerseCallback | null = null;

/**
 * Connect to ML resolver WebSocket server
 */
export function connectML(onVerse: VerseCallback): void {
  onVerseCallback = onVerse;
  connect();
}

function connect(): void {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  console.log("🔌 Connecting to ML resolver...");
  ws = new WebSocket("ws://127.0.0.1:8765/resolve");

  ws.on("open", () => {
    console.log("✅ Connected to ML resolver");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === "verse" && onVerseCallback) {
        onVerseCallback(data);
      }
    } catch (e) {
      console.error("❌ Failed to parse ML response:", e);
    }
  });

  ws.on("close", () => {
    console.log("🔌 ML resolver disconnected");
    ws = null;
    scheduleReconnect();
  });

  ws.on("error", (err) => {
    console.error("❌ ML resolver error:", err.message);
    ws = null;
    scheduleReconnect();
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  console.log(`🔄 Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

/**
 * Send transcript text to ML resolver
 */
export function sendTranscript(text: string, isFinal = false): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("⚠️ ML resolver not connected");
    return;
  }

  ws.send(
    JSON.stringify({
      type: "transcript",
      text,
      isFinal,
      timestamp: Date.now(),
    })
  );
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

/**
 * Disconnect from ML resolver
 */
export function disconnectML(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }
}
