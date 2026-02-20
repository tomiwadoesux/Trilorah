/**
 * Verse Emitter - IPC Bridge
 * Emits detected verses to the frontend
 */
import { BrowserWindow } from "electron";

interface VerseDetection {
  book: string;
  chapter: number;
  verse: number | null;
  endVerse?: number; // For verse ranges
  text: string;
  verses?: Array<{ verse: number; text: string }>; // Individual verses
  isRange?: boolean;
  isPreview?: boolean; // If true, goes to preview only
  rangeEnd?: number; // Full range end (for progress UI)
  chunkSize?: number;
  confidence?: number;
}

let mainWindow: BrowserWindow | null = null;

/**
 * Set the main window reference for IPC
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win;
}

/**
 * Emit a verse to the PREVIEW screen (not live yet)
 */
export function emitVersePreview(detection: VerseDetection): void {
  const refStr =
    detection.endVerse && detection.endVerse !== detection.verse
      ? `${detection.book} ${detection.chapter}:${detection.verse}-${detection.endVerse}`
      : `${detection.book} ${detection.chapter}:${detection.verse || 1}`;

  console.log(`👁️ Preview: ${refStr}`);
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send("on-verse-preview", {
        ...detection,
        isPreview: true,
      });
    }
  });
}

/**
 * Emit a verse detection to the frontend
 * If isPreview is true, goes to preview only. Otherwise goes to live.
 */
export function emitVerseDetected(detection: VerseDetection): void {
  const refStr =
    detection.endVerse && detection.endVerse !== detection.verse
      ? `${detection.book} ${detection.chapter}:${detection.verse}-${detection.endVerse}`
      : `${detection.book} ${detection.chapter}:${detection.verse || 1}`;

  if (detection.isPreview) {
    console.log(`👁️ Preview: ${refStr}`);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send("on-verse-preview", detection);
    });
  } else {
    console.log(`📤 Live: ${refStr}`);
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send("on-verse-detected", detection);
    });
  }
}

/**
 * Emit transcript update (for live display)
 */
export function emitTranscript(text: string): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send("on-transcript-update", text);
  });
}

/**
 * Emit audio level for dB meter
 */
export function emitAudioLevel(level: number): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send("on-audio-level", level);
  });
}

/**
 * Emit ASR status updates
 */
export function emitASRStatus(status: string): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.webContents.send("on-asr-status", status);
  });
}
