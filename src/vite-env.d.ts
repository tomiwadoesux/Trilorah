/// <reference types="vite/client" />

interface VerseData {
  id: number;
  ref: string;
  text: string;
  version: string;
}

interface ChapterResponse {
  success: boolean;
  data?: VerseData[];
  error?: string;
}

interface SearchResponse {
  success: boolean;
  data?: {
    reference: string;
    text?: string;
    chapterContent: VerseData[];
  };
  error?: string;
}

interface VerseDetection {
  book: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  text?: string;
  verses?: Array<{ verse: number; text: string }>;
  isRange?: boolean;
  isPreview?: boolean;
  rangeEnd?: number;
  chunkSize?: number;
}

interface Window {
  api: {
    getChapter: (bookId: number, chapter: number) => Promise<ChapterResponse>;
    searchVerse: (
      book: string,
      chapter: number,
      verse: number,
    ) => Promise<SearchResponse>;
    onTranscriptUpdate: (callback: (text: string) => void) => () => void;
    onVersePreview: (callback: (data: VerseDetection) => void) => () => void;
    onVerseDetected: (callback: (data: VerseDetection) => void) => () => void;
    onAudioLevel: (callback: (level: number) => void) => () => void;
    startListening: () => void;
    stopListening: () => void;
    sendText: (text: string) => void;
    pushToLive: () => void;
    importPresentation: () => Promise<{
      success: boolean;
      data?: { title: string; slides: string[]; pptxPath?: string };
      error?: string;
    }>;
    importGeneratedPresentation: (payload: {
      title: string;
      pptxBase64: string;
    }) => Promise<{
      success: boolean;
      data?: { title: string; slides: string[]; pptxPath?: string };
      error?: string;
    }>;
    readImageDataUrl: (imagePath: string) => Promise<string | null>;
    openOutput: (outputId: string) => void;
    onExternalCommand: (callback: (data: any) => void) => () => void;
  };
}
