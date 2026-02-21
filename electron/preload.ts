import { contextBridge, ipcRenderer } from "electron";

interface VerseDetection {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text?: string;
  verses?: Array<{ verse: number; text: string }>;
  isRange?: boolean;
  isPreview?: boolean;
}

contextBridge.exposeInMainWorld("api", {
  // Fetch a chapter by book ID and chapter number
  getChapter: (bookId: number, chapter: number) =>
    ipcRenderer.invoke("get-chapter", { bookId, chapter }),

  // Search for a specific verse
  searchVerse: (book: string, chapter: number, verse: number) =>
    ipcRenderer.invoke("search-verse", { book, chapter, verse }),

  // Listener for audio transcript updates (the "Matrix" stream)
  onTranscriptUpdate: (callback: (text: string) => void) => {
    const subscription = (_event: any, text: string) => callback(text);
    ipcRenderer.on("on-transcript-update", subscription);

    // Return cleanup function to remove listener
    return () =>
      ipcRenderer.removeListener("on-transcript-update", subscription);
  },

  // Listener for AI verse PREVIEW events (goes to preview first)
  onVersePreview: (callback: (data: VerseDetection) => void) => {
    const subscription = (_event: any, data: VerseDetection) => callback(data);
    ipcRenderer.on("on-verse-preview", subscription);

    return () => ipcRenderer.removeListener("on-verse-preview", subscription);
  },

  // Listener for AI verse detection events (goes directly to live)
  onVerseDetected: (callback: (data: VerseDetection) => void) => {
    const subscription = (_event: any, data: VerseDetection) => callback(data);
    ipcRenderer.on("on-verse-detected", subscription);

    // Return cleanup function to remove listener
    return () => ipcRenderer.removeListener("on-verse-detected", subscription);
  },

  // Listener for real-time audio levels (dB)
  onAudioLevel: (callback: (level: number) => void) => {
    const subscription = (_event: any, level: number) => callback(level);
    ipcRenderer.on("on-audio-level", subscription);

    return () => ipcRenderer.removeListener("on-audio-level", subscription);
  },
  // Audio Control
  startListening: () => ipcRenderer.send("start-listening"),
  stopListening: () => ipcRenderer.send("stop-listening"),

  // Send transcription text to the brain for processing
  sendText: (text: string) => ipcRenderer.send("process-text", text),

  // Push preview to live
  pushToLive: () => ipcRenderer.send("push-to-live"),

  // Import presentation (PPTX → images)
  importPresentation: () => ipcRenderer.invoke("import-presentation"),

  // Import generated presentation (PPTX bytes → images)
  importGeneratedPresentation: (payload: {
    title: string;
    pptxBase64: string;
  }) => ipcRenderer.invoke("import-generated-presentation", payload),

  // Output Windows
  openOutput: (outputId: string) => ipcRenderer.send("open-output", outputId),

  // Local image helper
  readImageDataUrl: (imagePath: string) =>
    ipcRenderer.invoke("read-image-data-url", imagePath),

  // Webhooks / External API listener
  onExternalCommand: (callback: (data: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on("on-external-command", subscription);
    return () =>
      ipcRenderer.removeListener("on-external-command", subscription);
  },
});
