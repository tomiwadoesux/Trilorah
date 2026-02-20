// Song type
export interface Song {
  id: string;
  title: string;
  artist?: string;
  slides: string[];
}

// Presentation type
export interface Presentation {
  id: string;
  title: string;
  slides: string[]; // Image paths
}

// Service Flow Item
export interface ServiceItem {
  id: string; // Unique instance ID
  type: "scripture" | "song" | "theme" | "presentation" | "note";
  title: string;
  subtitle?: string;
  data: any; // The original data object
}

// Theme
export interface Theme {
  id: string;
  name: string;
  type: "image" | "video" | "gradient";
  url: string;
  thumbnail?: string;
}

// Layout presets for text positioning
export interface LayoutPreset {
  id: string;
  name: string;
  refPosition:
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center"
    | "top-left";
  textAlign: "center" | "left" | "right";
  description: string;
}

// Text effect styles
export interface TextStyle {
  id: string;
  name: string;
  textShadow: string;
  webkitTextStroke?: string;
}

// Verse data from database
export interface VerseData {
  id: number;
  ref: string;
  text: string;
  version: string;
}

// Display verse for preview/live panels
export interface DisplayVerse {
  ref: string;
  text: string;
  progress?: string;
}

// Slide deck for the slide editor
export interface SlideDeck {
  id: string;
  name: string;
  slides: SlideData[];
  createdAt: number;
  updatedAt: number;
}

export interface SlideData {
  id: string;
  canvasJSON: string; // fabric.js serialized JSON
  thumbnail?: string;
}
