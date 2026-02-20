import type { Theme, LayoutPreset, TextStyle } from "../types";

export const DEFAULT_THEMES: Theme[] = [
  {
    id: "gradient-default",
    name: "Dark Gradient",
    type: "gradient",
    url: "linear-gradient(135deg, #1e1b4b 0%, #000000 100%)",
  },
  {
    id: "cross-light",
    name: "Cross Light",
    type: "image",
    url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1920&q=80",
  },
  {
    id: "mountain-sunrise",
    name: "Mountain Sunrise",
    type: "image",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  },
  {
    id: "church-interior",
    name: "Church Interior",
    type: "image",
    url: "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1920&q=80",
  },
  {
    id: "sunset-clouds",
    name: "Sunset Clouds",
    type: "image",
    url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80",
  },
  {
    id: "ocean-waves",
    name: "Ocean Waves",
    type: "image",
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=80",
  },
  {
    id: "starry-night",
    name: "Starry Night",
    type: "image",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80",
  },
  {
    id: "forest-light",
    name: "Forest Light",
    type: "image",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80",
  },
  {
    id: "dove-sky",
    name: "Dove Sky",
    type: "image",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&q=80",
  },
  {
    id: "stained-glass",
    name: "Stained Glass",
    type: "image",
    url: "https://images.unsplash.com/photo-1548407260-da850faa41e3?w=1920&q=80",
  },
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "classic-top",
    name: "Classic Top",
    refPosition: "top-center",
    textAlign: "center",
    description: "Reference on top, text centered below",
  },
  {
    id: "bottom-right",
    name: "Bottom Right",
    refPosition: "bottom-right",
    textAlign: "left",
    description: "Text left-aligned, reference at bottom right",
  },
  {
    id: "bottom-left",
    name: "Bottom Left",
    refPosition: "bottom-left",
    textAlign: "right",
    description: "Text right-aligned, reference at bottom left",
  },
  {
    id: "bottom-center",
    name: "Bottom Center",
    refPosition: "bottom-center",
    textAlign: "center",
    description: "Text centered, reference at bottom center",
  },
  {
    id: "top-left",
    name: "Top Left",
    refPosition: "top-left",
    textAlign: "left",
    description: "Reference top left, text left-aligned",
  },
];

export const TEXT_STYLES: TextStyle[] = [
  {
    id: "soft-shadow",
    name: "Soft Shadow",
    textShadow: "2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)",
  },
  {
    id: "hard-shadow",
    name: "Hard Shadow",
    textShadow: "3px 3px 0px #000, 4px 4px 0px rgba(0,0,0,0.5)",
  },
  {
    id: "double-shadow",
    name: "Double Layer",
    textShadow:
      "2px 2px 0px #000, 4px 4px 0px #000, 6px 6px 8px rgba(0,0,0,0.8)",
  },
  {
    id: "outline",
    name: "Black Outline",
    textShadow:
      "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 10px rgba(0,0,0,0.8)",
  },
  {
    id: "thick-outline",
    name: "Thick Outline",
    textShadow:
      "-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, -3px 0 0 #000, 3px 0 0 #000, 0 -3px 0 #000, 0 3px 0 #000",
  },
  {
    id: "glow",
    name: "Subtle Glow",
    textShadow:
      "0 0 10px rgba(255,255,255,0.3), 0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)",
  },
  {
    id: "clean",
    name: "Clean (No Effect)",
    textShadow: "none",
  },
];

export const GRADIENT_PRESETS = [
  {
    id: "indigo-black",
    name: "Indigo Night",
    value: "linear-gradient(135deg, #1e1b4b 0%, #000000 100%)",
  },
  {
    id: "purple-blue",
    name: "Purple Blue",
    value: "linear-gradient(135deg, #4c1d95 0%, #1e3a8a 100%)",
  },
  {
    id: "dark-teal",
    name: "Dark Teal",
    value: "linear-gradient(135deg, #134e4a 0%, #0f172a 100%)",
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    value: "linear-gradient(135deg, #7c2d12 0%, #1c1917 100%)",
  },
  {
    id: "midnight",
    name: "Midnight",
    value: "linear-gradient(135deg, #0f172a 0%, #000000 100%)",
  },
  {
    id: "forest",
    name: "Forest",
    value: "linear-gradient(135deg, #14532d 0%, #0a0a0a 100%)",
  },
  {
    id: "royal",
    name: "Royal",
    value: "linear-gradient(135deg, #581c87 0%, #1e1b4b 100%)",
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    value: "linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)",
  },
];

export const TEXT_COLORS = [
  { id: "white", name: "White", value: "#ffffff" },
  { id: "cream", name: "Cream", value: "#fef3c7" },
  { id: "gold", name: "Gold", value: "#fbbf24" },
  { id: "light-blue", name: "Light Blue", value: "#93c5fd" },
  { id: "light-green", name: "Light Green", value: "#86efac" },
  { id: "soft-pink", name: "Soft Pink", value: "#fbcfe8" },
];

export const BIBLE_VERSIONS = [
  { code: "KJV", name: "King James Version" },
  { code: "NIV", name: "New International Version" },
  { code: "ESV", name: "English Standard Version" },
  { code: "NLT", name: "New Living Translation" },
  { code: "NKJV", name: "New King James Version" },
  { code: "NASB", name: "New American Standard" },
  { code: "AMP", name: "Amplified Bible" },
  { code: "CSB", name: "Christian Standard Bible" },
  { code: "MSG", name: "The Message" },
  { code: "ASV", name: "American Standard Version" },
];

export const BOOK_NAMES: Record<number, string> = {
  0: "Genesis",
  1: "Exodus",
  2: "Leviticus",
  3: "Numbers",
  4: "Deuteronomy",
  5: "Joshua",
  6: "Judges",
  7: "Ruth",
  8: "1 Samuel",
  9: "2 Samuel",
  10: "1 Kings",
  11: "2 Kings",
  12: "1 Chronicles",
  13: "2 Chronicles",
  14: "Ezra",
  15: "Nehemiah",
  16: "Esther",
  17: "Job",
  18: "Psalms",
  19: "Proverbs",
  20: "Ecclesiastes",
  21: "Song of Solomon",
  22: "Isaiah",
  23: "Jeremiah",
  24: "Lamentations",
  25: "Ezekiel",
  26: "Daniel",
  27: "Hosea",
  28: "Joel",
  29: "Amos",
  30: "Obadiah",
  31: "Jonah",
  32: "Micah",
  33: "Nahum",
  34: "Habakkuk",
  35: "Zephaniah",
  36: "Haggai",
  37: "Zechariah",
  38: "Malachi",
  39: "Matthew",
  40: "Mark",
  41: "Luke",
  42: "John",
  43: "Acts",
  44: "Romans",
  45: "1 Corinthians",
  46: "2 Corinthians",
  47: "Galatians",
  48: "Ephesians",
  49: "Philippians",
  50: "Colossians",
  51: "1 Thessalonians",
  52: "2 Thessalonians",
  53: "1 Timothy",
  54: "2 Timothy",
  55: "Titus",
  56: "Philemon",
  57: "Hebrews",
  58: "James",
  59: "1 Peter",
  60: "2 Peter",
  61: "1 John",
  62: "2 John",
  63: "3 John",
  64: "Jude",
  65: "Revelation",
};
