/**
 * Electron Main Process
 *
 * Architecture:
 * - ASR: Deepgram (real-time cloud) OR Python Vosk (offline fallback)
 * - ML: Python WebSocket server (state machine + regex/T5)
 * - IPC: Emits verse-detected to frontend
 * - Database: better-sqlite3 for verse text lookup
 */
import { app, BrowserWindow, ipcMain, dialog, protocol } from "electron";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

if (!process.versions.electron) {
  console.error("❌ Electron main process was started with Node.js.");
  console.error(
    "Run with Electron instead: `npm run dev:backend` or `./node_modules/.bin/electron .`",
  );
  process.exit(1);
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Import modules
import { shouldEmit } from "./parser/debounce";
import {
  setMainWindow,
  emitVerseDetected,
  emitTranscript,
  emitASRStatus,
} from "./ipc/verseEmitter";
import { connectML, sendTranscript, disconnectML } from "./ml/mlClient";
import { startDeepgram, stopDeepgram } from "./asr/deepgram";
import { ScriptureSession, DisplayPayload } from "./session/ScriptureSession";
import { initAliasLogger } from "./parser/aliasLogger";
import { getQuoteMatcher } from "./quote/QuoteMatcher";
import { convertPptxToImages } from "./presentation/convertPptxToImages";
import {
  startWebSocketServer,
  stopWebSocketServer,
} from "./api/websocketServer";

function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "application/octet-stream";
}

// --- DATABASE SETUP ---
const isDev = process.env.NODE_ENV === "development";

function findDatabase(): string | null {
  const paths = [
    path.join(app.getAppPath(), "bible.db"),
    path.join(process.cwd(), "bible.db"),
    path.join(__dirname, "..", "bible.db"),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log("✅ Database found:", p);
      return p;
    }
  }
  return null;
}

let db: InstanceType<typeof Database> | null = null;

// Book ID mapping (matches database)
const bookIdMap: Record<string, number> = {
  Genesis: 0,
  Exodus: 1,
  Leviticus: 2,
  Numbers: 3,
  Deuteronomy: 4,
  Joshua: 5,
  Judges: 6,
  Ruth: 7,
  "1 Samuel": 8,
  "2 Samuel": 9,
  "1 Kings": 10,
  "2 Kings": 11,
  "1 Chronicles": 12,
  "2 Chronicles": 13,
  Ezra: 14,
  Nehemiah: 15,
  Esther: 16,
  Job: 17,
  Psalms: 18,
  Proverbs: 19,
  Ecclesiastes: 20,
  "Song of Solomon": 21,
  Isaiah: 22,
  Jeremiah: 23,
  Lamentations: 24,
  Ezekiel: 25,
  Daniel: 26,
  Hosea: 27,
  Joel: 28,
  Amos: 29,
  Obadiah: 30,
  Jonah: 31,
  Micah: 32,
  Nahum: 33,
  Habakkuk: 34,
  Zephaniah: 35,
  Haggai: 36,
  Zechariah: 37,
  Malachi: 38,
  Matthew: 39,
  Mark: 40,
  Luke: 41,
  John: 42,
  Acts: 43,
  Romans: 44,
  "1 Corinthians": 45,
  "2 Corinthians": 46,
  Galatians: 47,
  Ephesians: 48,
  Philippians: 49,
  Colossians: 50,
  "1 Thessalonians": 51,
  "2 Thessalonians": 52,
  "1 Timothy": 53,
  "2 Timothy": 54,
  Titus: 55,
  Philemon: 56,
  Hebrews: 57,
  James: 58,
  "1 Peter": 59,
  "2 Peter": 60,
  "1 John": 61,
  "2 John": 62,
  "3 John": 63,
  Jude: 64,
  Revelation: 65,
};

const bookNames: Record<number, string> = Object.fromEntries(
  Object.entries(bookIdMap).map(([name, id]) => [id, name]),
);

// --- SCRIPTURE SESSION ---
// Store current preview for push-to-live
let currentPreviewData: any = null;

const session = new ScriptureSession((display: DisplayPayload) => {
  // Look up verse texts from database
  const bookId = bookIdMap[display.book];
  const verses: Array<{ verse: number; text: string }> = [];

  if (db && bookId !== undefined) {
    try {
      for (let v = display.verseStart; v <= display.verseEnd; v++) {
        const row = db
          .prepare(
            `SELECT verse as text FROM bible 
             WHERE Book = ? AND Chapter = ? AND Versecount = ?`,
          )
          .get(bookId, display.chapter, v) as { text: string } | undefined;

        verses.push({
          verse: v,
          text: row?.text || `Verse ${v} not found`,
        });
      }
    } catch (e) {
      console.error("❌ DB error:", e);
    }
  }

  // Build the detection object
  const detection = {
    book: display.book,
    chapter: display.chapter,
    verse: display.verseStart,
    endVerse:
      display.verseEnd !== display.verseStart ? display.verseEnd : undefined,
    text: verses.map((v) => v.text).join(" "),
    verses: verses,
    isRange: display.verseEnd !== display.verseStart,
    isPreview: display.isPreview,
    // Pass range metadata
    rangeEnd: display.rangeEnd,
    chunkSize: display.chunkSize,
  };

  // Store for push-to-live
  currentPreviewData = detection;

  // Emit to frontend (preview first!)
  emitVerseDetected(detection);

  // Update session with current text for auto-advance matching
  session.setCurrentVerseText(detection.text);
});

// --- ASR HANDLING ---
let isListening = false;

function startASR(deviceLabel?: string): void {
  if (isListening) return;

  console.log("🎤 Starting Deepgram ASR...", deviceLabel ? `(device: ${deviceLabel})` : "(default device)");
  emitASRStatus("Connecting...");

  startDeepgram(
    // onText callback
    (text, isFinal) => {
      console.log(`📝 ${isFinal ? "Final" : "Partial"}: ${text}`);
      emitTranscript(text);

      // Feed transcript to session for Auto-Advance matching
      session.processTranscript(text);

      // Feed to quote detector (always)
      const quoteMatcher = getQuoteMatcher();
      quoteMatcher.updateRollingWords(text);

      if (isFinal) {
        // Check for commands first, then send to ML
        handleASRText(text);
      } else {
        // Partial transcripts go directly to ML
        sendTranscript(text, false);
      }
    },
    // onError callback
    (error) => {
      console.error("❌ Deepgram error:", error);
      emitASRStatus("Error: " + error.message);
    },
    deviceLabel,
  );

  isListening = true;
  emitASRStatus("Listening...");
}

function stopASR(): void {
  if (!isListening) return;

  stopDeepgram();
  isListening = false;
  emitASRStatus("Stopped");
}

// --- ML RESOLVER CALLBACK ---
function handleMLVerseDetection(data: any): void {
  // DEBUG: Log raw data from ML resolver
  console.log("🔍 Raw ML data:", JSON.stringify(data));

  const refString = `${data.book} ${data.chapter}:${data.verse || 1}`;

  // Debounce & confidence gate
  if (!shouldEmit(refString)) {
    console.log("⏭️ Skipping duplicate:", refString);

    // IMPORTANT: Even when skipping duplicate, if verse was detected,
    // tell session to clear any pending "default to verse 1" timer
    if (data.verse) {
      session.cancelVerseTimer();
    }
    return;
  }

  if (data.confidence < 0.85) {
    console.log("⏭️ Low confidence:", refString, data.confidence);
    return;
  }

  console.log(`🎯 ML Detected: ${refString} (confidence: ${data.confidence})`);
  console.log(`   → verse from ML: ${data.verse} (type: ${typeof data.verse})`);

  // Feed to session manager
  session.onReferenceDetected({
    book: data.book,
    chapter: data.chapter,
    verse: data.verse || null,
    rangeEnd: data.rangeEnd || data.endVerse || null,
  });
}

// --- VERSE TEXT LOOKUP HELPER ---
function lookupVerseText(book: string, chapter: number, verse: number): string {
  const bookId = bookIdMap[book];
  if (db && bookId !== undefined) {
    try {
      const row = db
        .prepare(
          `SELECT verse as text FROM bible
           WHERE Book = ? AND Chapter = ? AND Versecount = ?`,
        )
        .get(bookId, chapter, verse) as { text: string } | undefined;
      return row?.text || "";
    } catch {
      return "";
    }
  }
  return "";
}

// --- HANDLE ASR TEXT (for commands like "next") ---
function handleASRText(text: string): void {
  // Priority 1: Check if it's a command
  if (session.onCommand(text)) {
    return; // Session handled it
  }

  // Priority 2: Send to ML resolver for explicit refs
  sendTranscript(text, true);

  // Priority 3: Check for quoted verses
  const quoteMatcher = getQuoteMatcher();
  const quoteResults = quoteMatcher.tryDetectQuotes();
  if (quoteResults.length > 0) {
    const best = quoteResults[0];
    const bestBook = best.ref.split(" ").slice(0, -1).join(" ");
    console.log(
      `📜 Quote match: ${best.ref} (+${quoteResults.length - 1} candidates)`,
    );

    // Best match → session → preview
    session.onReferenceDetected({
      book: bestBook,
      chapter: best.chapter,
      verse: best.verse,
      rangeEnd: null,
    });

    // Additional candidates → pending queue (max 5 alternatives)
    for (const alt of quoteResults.slice(1, 6)) {
      const altBook = alt.ref.split(" ").slice(0, -1).join(" ");
      const altText = lookupVerseText(altBook, alt.chapter, alt.verse);
      emitVerseDetected({
        book: altBook,
        chapter: alt.chapter,
        verse: alt.verse,
        text: altText,
        isPreview: false, // Goes to pending queue
      });
    }
  }
}

// --- WINDOW ---
let mainWindow: BrowserWindow | null = null;

// Output Windows
const outputWindows: Record<string, BrowserWindow | null> = {
  main: null,
  alternate: null,
  third: null,
};

function createOutputWindow(id: string, title: string) {
  if (outputWindows[id]) {
    outputWindows[id]?.focus();
    return;
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title,
    transparent: true,
    frame: false, // Frameless window
    hasShadow: false,
    backgroundColor: "#00000000", // Transparent background
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const query = `?outputId=${id}`;
  if (isDev) {
    win.loadURL(`http://localhost:5173/output.html${query}`);
  } else {
    win.loadFile(path.join(__dirname, "../dist/output.html"), {
      search: query,
    });
  }

  win.on("closed", () => {
    outputWindows[id] = null;
  });

  outputWindows[id] = win;
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#050505",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setMainWindow(mainWindow);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// --- IPC HANDLERS ---

// Output Window Management
ipcMain.on("open-output", (_event, outputId: string) => {
  const titles: Record<string, string> = {
    main: "Main Display Output",
    alternate: "Livestream Output",
    third: "Stage Confidence Monitor",
  };
  createOutputWindow(outputId, titles[outputId] || "Display Output");
});

// Manual text input from frontend
ipcMain.on("process-text", (_event, text: string) => {
  if (!text) return;
  console.log("📥 Manual input:", text);
  sendTranscript(text, true);
  emitTranscript(text);
});

// Start/stop ASR
ipcMain.on("start-listening", (_event, deviceLabel?: string) => {
  console.log("▶️ Start listening requested", deviceLabel ? `(device: ${deviceLabel})` : "");
  startASR(deviceLabel);
});

ipcMain.on("stop-listening", () => {
  console.log("⏹️ Stop listening requested");
  stopASR();
});

// Push preview to live
ipcMain.on("push-to-live", () => {
  if (currentPreviewData) {
    console.log(
      "🔴 Pushing to LIVE:",
      `${currentPreviewData.book} ${currentPreviewData.chapter}:${currentPreviewData.verse}`,
    );
    emitVerseDetected({ ...currentPreviewData, isPreview: false });
  }
});

// Get chapter verses for scripture deck
ipcMain.handle("get-chapter", (_event, { bookId, chapter }) => {
  if (!db) return { success: false, error: "Database not connected" };

  try {
    const verses = db
      .prepare(
        `
      SELECT Versecount as verse, verse as text 
      FROM bible 
      WHERE Book = ? AND Chapter = ? 
      ORDER BY Versecount
    `,
      )
      .all(bookId, chapter) as { verse: number; text: string }[];

    const bookName = bookNames[bookId] || `Book ${bookId}`;

    return {
      success: true,
      data: verses.map((row) => ({
        id: row.verse,
        ref: `${bookName} ${chapter}:${row.verse}`,
        text: row.text,
        version: "KJV",
      })),
    };
  } catch (error) {
    console.error("SQL Error:", error);
    return { success: false, error: "Database error" };
  }
});

// Search for specific verse
ipcMain.handle("search-verse", (_event, { book, chapter, verse }) => {
  if (!db) return { success: false, error: "Database not connected" };

  const bookId = bookIdMap[book] ?? bookIdMap[book.toLowerCase()];
  if (bookId === undefined) {
    return { success: false, error: "Book not found" };
  }

  try {
    const row = db
      .prepare(
        `
      SELECT verse as text FROM bible 
      WHERE Book = ? AND Chapter = ? AND Versecount = ?
    `,
      )
      .get(bookId, chapter, verse) as { text: string } | undefined;

    return {
      success: !!row,
      data: row ? { text: row.text } : null,
    };
  } catch (error) {
    console.error("SQL Error:", error);
    return { success: false, error: "Database error" };
  }
});

// Import presentation (PPTX → images)
ipcMain.handle("import-presentation", async () => {
  if (!mainWindow) return { success: false, error: "No window" };

  // Open file dialog
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import Presentation",
    filters: [
      { name: "PowerPoint", extensions: ["pptx", "ppt", "odp"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: "Cancelled" };
  }

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath, path.extname(filePath));

  // Create output directory for this presentation
  const presentationsDir = path.join(app.getPath("userData"), "presentations");
  const outputDir = path.join(presentationsDir, `${fileName}-${Date.now()}`);

  try {
    console.log(`📊 Converting presentation: ${filePath}`);
    const slides = await convertPptxToImages(filePath, outputDir);
    if (slides.length === 0) {
      return {
        success: false,
        error:
          "No slide images were produced from this PPTX. Check LibreOffice and the file format.",
      };
    }
    console.log(`✅ Converted ${slides.length} slides`);

    return {
      success: true,
      data: {
        title: fileName,
        slides,
        pptxPath: filePath,
      },
    };
  } catch (error) {
    console.error("❌ Presentation conversion error:", error);
    const details =
      error instanceof Error ? error.message : "Unknown conversion error";
    return {
      success: false,
      error: `Conversion failed: ${details}`,
    };
  }
});

// Import generated presentation (PPTX bytes -> images)
ipcMain.handle(
  "import-generated-presentation",
  async (_event, { title, pptxBase64 }) => {
    if (!pptxBase64 || typeof pptxBase64 !== "string") {
      return { success: false, error: "Missing presentation data" };
    }

    const normalizedTitle =
      typeof title === "string" && title.trim() ? title.trim() : "Quick Slides";
    const safeTitle =
      normalizedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "quick-slides";

    const stamp = Date.now();
    const generatedDir = path.join(app.getPath("userData"), "presentations");
    const pptxPath = path.join(generatedDir, `${safeTitle}-${stamp}.pptx`);
    const outputDir = path.join(generatedDir, `${safeTitle}-${stamp}`);

    try {
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }

      fs.writeFileSync(pptxPath, Buffer.from(pptxBase64, "base64"));

      console.log(`📊 Converting generated presentation: ${pptxPath}`);
      const slides = await convertPptxToImages(pptxPath, outputDir);
      if (slides.length === 0) {
        return {
          success: false,
          error:
            "Generated PPTX produced no slide images. Check LibreOffice setup.",
        };
      }
      console.log(`✅ Converted ${slides.length} generated slides`);

      return {
        success: true,
        data: {
          title: normalizedTitle,
          slides,
          pptxPath,
        },
      };
    } catch (error) {
      console.error("❌ Generated presentation conversion error:", error);
      const details =
        error instanceof Error ? error.message : "Unknown conversion error";
      return {
        success: false,
        error: `Quick slide generation failed: ${details}`,
      };
    }
  },
);

// Delete presentation files from disk
ipcMain.handle(
  "delete-presentation",
  async (_event, { slides, sourcePptx }: { slides: string[]; sourcePptx?: string }) => {
    try {
      const presentationsDir = path.join(app.getPath("userData"), "presentations");

      // Delete each slide image
      for (const slide of slides) {
        try {
          if (fs.existsSync(slide)) fs.unlinkSync(slide);
        } catch (e) {
          console.warn("Could not delete slide:", slide, e);
        }
      }

      // Remove the parent directory (the <name>-<timestamp>/ folder)
      if (slides.length > 0) {
        const slideDir = path.dirname(slides[0]);
        try {
          if (fs.existsSync(slideDir) && slideDir.startsWith(presentationsDir)) {
            fs.rmSync(slideDir, { recursive: true, force: true });
          }
        } catch (e) {
          console.warn("Could not remove slide directory:", slideDir, e);
        }
      }

      // Delete the source PPTX if it lives inside our presentations directory
      if (sourcePptx && sourcePptx.startsWith(presentationsDir)) {
        try {
          if (fs.existsSync(sourcePptx)) fs.unlinkSync(sourcePptx);
        } catch (e) {
          console.warn("Could not delete source PPTX:", sourcePptx, e);
        }
      }

      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ delete-presentation error:", error);
      return { success: false, error: msg };
    }
  },
);

// Save presentations list to disk for persistence
ipcMain.handle("save-presentations", async (_event, presentations: any[]) => {
  try {
    const filePath = path.join(app.getPath("userData"), "presentations.json");
    fs.writeFileSync(filePath, JSON.stringify(presentations, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ save-presentations error:", error);
    return { success: false, error: msg };
  }
});

// Load presentations list from disk
ipcMain.handle("load-presentations", async () => {
  try {
    const filePath = path.join(app.getPath("userData"), "presentations.json");
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ load-presentations error:", error);
    return [];
  }
});

ipcMain.handle("read-image-data-url", (_event, imagePath: string) => {
  if (!imagePath || typeof imagePath !== "string") return null;

  try {
    const normalizedPath = imagePath.startsWith("file://")
      ? decodeURI(imagePath.replace(/^file:\/+/, "/"))
      : imagePath;

    if (!fs.existsSync(normalizedPath)) return null;

    const mimeType = getMimeType(normalizedPath);
    const bytes = fs.readFileSync(normalizedPath);
    return `data:${mimeType};base64,${bytes.toString("base64")}`;
  } catch (error) {
    console.error("❌ read-image-data-url error:", error);
    return null;
  }
});

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
  protocol.handle("local-media", async (request) => {
    try {
      const requestUrl = new URL(request.url);
      const requestedPath = decodeURIComponent(requestUrl.pathname);
      const filePath =
        process.platform === "win32" && /^\/[a-zA-Z]:\//.test(requestedPath)
          ? requestedPath.slice(1)
          : requestedPath;

      if (!filePath || !fs.existsSync(filePath)) {
        return new Response("Not found", { status: 404 });
      }

      const mimeType = getMimeType(filePath);
      const buffer = fs.readFileSync(filePath);
      return new Response(buffer, {
        status: 200,
        headers: {
          "content-type": mimeType,
          "cache-control": "public, max-age=31536000",
        },
      });
    } catch (error) {
      console.error("❌ local-media protocol error:", error);
      return new Response("Bad request", { status: 400 });
    }
  });

  // Initialize database
  const dbPath = findDatabase();
  if (dbPath) {
    try {
      db = new Database(dbPath);
      const count = db.prepare("SELECT COUNT(*) as count FROM bible").get() as {
        count: number;
      };
      console.log(`✅ Database connected - ${count.count} verses`);
    } catch (e) {
      console.error("❌ Database error:", e);
    }
  }

  // Connect to ML resolver
  console.log("🧠 Connecting to ML resolver...");
  connectML(handleMLVerseDetection);

  // Initialize alias miss logger
  initAliasLogger();

  // Initialize quote matcher
  const quoteMatcher = getQuoteMatcher();
  quoteMatcher.loadIndex();

  // Create window
  createWindow();

  // Start the WebSocket API server for Companion / Stream Deck
  if (mainWindow) startWebSocketServer(mainWindow);

  console.log("🚀 AI Preacher Assistant ready");
  console.log("💡 Click 'Start' to begin voice recognition");

  if (process.env.DEEPGRAM_API_KEY) {
    console.log("✅ Deepgram API key configured");
  } else {
    console.warn("⚠️ DEEPGRAM_API_KEY not set - add to .env.local");
  }
});

app.on("window-all-closed", () => {
  stopASR();
  disconnectML();
  stopWebSocketServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  stopASR();
  disconnectML();
  stopWebSocketServer();
});
