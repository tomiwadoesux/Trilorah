import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Download,
  Play,
  Search,
  Music,
  Monitor,
  MonitorOff,
  Timer,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  ImageIcon,
  Video,
  Plus,
  Upload,
  Trash2,
  List,
  GripVertical,
} from "lucide-react";
import { useWhisperTranscription } from "./useWhisperTranscription";
import { parseLyricsToSlides } from "./utils/parseLyricsToSlides";
import {
  normalizeLyrics,
  getSlideWordSet,
  getLastLine,
  shouldAutoAdvance,
  calculateCoverageRatio,
  shouldCatchUp,
} from "./utils/lyricMatcher";

// Song type
interface Song {
  id: string;
  title: string;
  artist?: string;
  slides: string[];
}

// Presentation type
interface Presentation {
  id: string;
  title: string;
  slides: string[]; // Image paths
}

// Service Flow Item
interface ServiceItem {
  id: string; // Unique instance ID
  type: "scripture" | "song" | "theme" | "presentation" | "note";
  title: string;
  subtitle?: string;
  data: any; // The original data object
}

// Default themes from Unsplash
interface Theme {
  id: string;
  name: string;
  type: "image" | "video" | "gradient";
  url: string;
  thumbnail?: string;
}

const DEFAULT_THEMES: Theme[] = [
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

// Layout presets for text positioning
interface LayoutPreset {
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

const LAYOUT_PRESETS: LayoutPreset[] = [
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

// Text effect styles
interface TextStyle {
  id: string;
  name: string;
  textShadow: string;
  webkitTextStroke?: string;
}

const TEXT_STYLES: TextStyle[] = [
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

// Gradient presets for custom gradients
const GRADIENT_PRESETS = [
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

// Text color presets
const TEXT_COLORS = [
  { id: "white", name: "White", value: "#ffffff" },
  { id: "cream", name: "Cream", value: "#fef3c7" },
  { id: "gold", name: "Gold", value: "#fbbf24" },
  { id: "light-blue", name: "Light Blue", value: "#93c5fd" },
  { id: "light-green", name: "Light Green", value: "#86efac" },
  { id: "soft-pink", name: "Soft Pink", value: "#fbcfe8" },
];

// Popular Bible translations (ordered by popularity)
const BIBLE_VERSIONS = [
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

const BOOK_NAMES: Record<number, string> = {
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

export default function App() {
  // --- STATE ---
  const [mode, setMode] = useState<"worship" | "sermon">("sermon");
  const [activeTab, setActiveTab] = useState<
    "scriptures" | "themes" | "songs" | "presentations"
  >("scriptures");

  // Current book and chapter being viewed
  const [currentBook, setCurrentBook] = useState(0); // Genesis
  const [currentChapter, setCurrentChapter] = useState(1);

  // Scripture data from database
  const [chapterVerses, setChapterVerses] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AI Listening state
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(-60); // dB level
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [detectedReference, setDetectedReference] = useState<string | null>(
    null
  );
  const [whisperStatus, setWhisperStatus] = useState("Initializing...");
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");

  // The Verse currently highlighted in the bottom deck
  const [selectedDeckId, setSelectedDeckId] = useState<number>(1);

  const [liveVerse, setLiveVerse] = useState<{
    ref: string;
    text: string;
    progress?: string;
  }>({
    ref: "",
    text: "",
  });

  const [previewVerse, setPreviewVerse] = useState<{
    ref: string;
    text: string;
    progress?: string;
  }>({
    ref: "Genesis 1:2",
    text: "And the earth was without form, and void...",
  });

  // History / Detections - starts empty, populated by real detections
  const [history, setHistory] = useState<{ ref: string; text: string }[]>([]);

  // Tag-based Search State
  const [selectedBook, setSelectedBook] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number | null>(
    null
  );

  // Audio Transcript Blinking Cursor Animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .cursor-blink {
        animation: blink 1s step-end infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [searchInput, setSearchInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Translation/Version selection
  const [selectedVersion, setSelectedVersion] = useState("KJV");
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  // Service Timer
  const [elapsedTime, setElapsedTime] = useState(0);

  // Theme selection
  const [selectedTheme, setSelectedTheme] = useState<Theme>(DEFAULT_THEMES[0]);
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout and text style selection
  const [selectedLayout, setSelectedLayout] = useState<LayoutPreset>(
    LAYOUT_PRESETS[0]
  );
  const [selectedTextStyle, setSelectedTextStyle] = useState<TextStyle>(
    TEXT_STYLES[0]
  );

  // Font size (1 = default, 0.75 = small, 1.5 = large)
  const [fontSize, setFontSize] = useState(1);

  // Text color
  const [textColor, setTextColor] = useState("#ffffff");

  // Whether live output is showing text or just background
  const [showLiveText, setShowLiveText] = useState(true);

  // Auto-scroll ref for the deck
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Songs state
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [songSearchInput, setSongSearchInput] = useState("");

  const heardWordsRef = useRef<Set<string>>(new Set());
  const autoAdvanceLockedRef = useRef(false);
  const pendingAdvanceRef = useRef(false);
  const catchUpCooldownRef = useRef(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [slidePhase, setSlidePhase] = useState<"start" | "middle" | "end">(
    "start"
  );
  const [listeningMode, setListeningMode] = useState<"scripture" | "lyrics">(
    "scripture"
  );

  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongArtist, setNewSongArtist] = useState("");
  const [newSongLyrics, setNewSongLyrics] = useState("");

  // Presentations state
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] =
    useState<Presentation | null>(null);
  const [selectedPresentationSlide, setSelectedPresentationSlide] =
    useState<number>(0);
  const [isImportingPresentation, setIsImportingPresentation] = useState(false);

  // Multi-Selection State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Helper: Handle Multi-Select Click
  const handleMultiSelectClick = (
    id: string,
    allIds: string[],
    e: React.MouseEvent
  ) => {
    if (e.ctrlKey || e.metaKey) {
      // Toggle Selection
      setSelectedItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setLastSelectedId(id);
      return false; // Don't play
    } else if (e.shiftKey && lastSelectedId) {
      // Range Selection
      const start = allIds.indexOf(lastSelectedId);
      const end = allIds.indexOf(id);
      if (start !== -1 && end !== -1) {
        const low = Math.min(start, end);
        const high = Math.max(start, end);
        const range = allIds.slice(low, high + 1);
        setSelectedItems((prev) => {
          const next = new Set(prev);
          range.forEach((r) => next.add(r));
          return next;
        });
      }
      return false; // Don't play
    } else {
      // Single Click
      setSelectedItems(new Set([id]));
      setLastSelectedId(id);
      return true; // Do play
    }
  };

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedItems(new Set());
    setLastSelectedId(null);
  }, [activeTab]);

  // Service Flow State
  const [serviceFlow, setServiceFlow] = useState<ServiceItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<ServiceItem | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");

    const newItem: ServiceItem = {
      id: crypto.randomUUID(),
      type: "theme", // Using 'theme' as generic media player for now
      title: file.name,
      subtitle: isVideo ? "Video Clip" : "Image",
      data: {
        id: crypto.randomUUID(),
        name: file.name,
        type: isVideo ? "video" : "image",
        url: url,
      },
    };
    setServiceFlow((prev) => [...prev, newItem]);
  };

  // Drag and Drop Handlers for Service Flow
  const handleDragStart = (e: React.DragEvent, item: ServiceItem) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify([item]));
    setDraggedItem(item);
  };

  const handleFlowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFlowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");

    if (data) {
      try {
        const parsed = JSON.parse(data);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const newItemsToAdd: ServiceItem[] = [];

        items.forEach((sourceItem: ServiceItem) => {
          // Basic check to see if it's an internal reorder (id match)
          // If NEW, we add. If existing, we currently rely on 'draggedItem' state for single item reorder.
          if (!serviceFlow.find((i) => i.id === sourceItem.id)) {
            newItemsToAdd.push({ ...sourceItem, id: crypto.randomUUID() });
          }
        });

        if (newItemsToAdd.length > 0) {
          setServiceFlow((prev) => [...prev, ...newItemsToAdd]);
        } else if (
          draggedItem &&
          items.length === 1 &&
          items[0].id === draggedItem.id
        ) {
          // Internal reorder fallback (dropped on container -> move to end)
          setServiceFlow((prev) => {
            const filtered = prev.filter((i) => i.id !== draggedItem.id);
            return [...filtered, draggedItem];
          });
        }
      } catch (err) {
        console.error("Failed to parse dropped item", err);
      }
    }
    setDraggedItem(null);
  };

  // Handler for playing an item from the flow
  const playFlowItem = (item: ServiceItem) => {
    if (item.type === "note") return;
    if (item.type === "scripture") {
      // Parse ref from title/subtitle
      // This assumes data contains verse info or matches what we expect
      // For now, let's assume 'data' is the VerseData or similar
      const verse = item.data as VerseData;
      if (verse) {
        setPreviewVerse({ ref: verse.ref, text: verse.text });
        setLiveVerse({ ref: verse.ref, text: verse.text });
        // We might also want to set the current book/chapter context
      } else if (item.data.bookId) {
        // Re-construct context if we dragged a "book/chapter" block or similar
      }
    } else if (item.type === "song") {
      const song = item.data as Song;
      setSelectedSong(song);
      setActiveTab("songs");
      setSelectedSlideIndex(0);
      // Determine first slide content
      if (song.slides.length > 0) {
        const slide = { ref: song.title, text: song.slides[0] };
        setPreviewVerse(slide);
        setLiveVerse(slide);
      }
    } else if (item.type === "theme") {
      setSelectedTheme(item.data as Theme);
      // Themes apply immediately usually
    } else if (item.type === "presentation") {
      const pres = item.data as Presentation;
      setSelectedPresentation(pres);
      setActiveTab("presentations");
      setSelectedPresentationSlide(0);
      // Load first slide
    }
  };

  const removeFromFlow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setServiceFlow((prev) => prev.filter((item) => item.id !== id));
  };

  // Determine current search step
  type SearchStep = "book" | "chapter" | "verse";
  const searchStep: SearchStep = !selectedBook
    ? "book"
    : !selectedChapterNum
    ? "chapter"
    : "verse";

  // Generate suggestions based on current step
  const getSuggestions = (): { value: string | number; label: string }[] => {
    const query = searchInput.toLowerCase().trim();

    if (searchStep === "book") {
      // Filter books by input
      return Object.entries(BOOK_NAMES)
        .filter(
          ([_, name]) => name.toLowerCase().startsWith(query) || query === ""
        )
        .slice(0, 8)
        .map(([id, name]) => ({ value: parseInt(id), label: name }));
    } else if (searchStep === "chapter") {
      // Show chapter numbers (1-150 for Psalms, 1-50 for most books)
      const maxChapters = selectedBook?.id === 18 ? 150 : 50; // Psalms has 150 chapters
      const chapters = Array.from({ length: maxChapters }, (_, i) => i + 1);
      return chapters
        .filter((ch) => query === "" || ch.toString().startsWith(query))
        .slice(0, 10)
        .map((ch) => ({ value: ch, label: `Chapter ${ch}` }));
    } else {
      // Show verse numbers
      const maxVerses = 40; // Most chapters have less than 40 verses
      const verses = Array.from({ length: maxVerses }, (_, i) => i + 1);
      return verses
        .filter((v) => query === "" || v.toString().startsWith(query))
        .slice(0, 10)
        .map((v) => ({ value: v, label: `Verse ${v}` }));
    }
  };

  const suggestions = getSuggestions();

  // Handle selecting a suggestion
  const handleSelectSuggestion = (value: string | number) => {
    if (searchStep === "book") {
      const bookName = BOOK_NAMES[value as number];
      setSelectedBook({ id: value as number, name: bookName });
      setSearchInput("");
      setSelectedSuggestion(0);
    } else if (searchStep === "chapter") {
      setSelectedChapterNum(value as number);
      setSearchInput("");
      setSelectedSuggestion(0);
    } else {
      // Verse selected - perform the search and push to live
      const verseNum = value as number;
      if (selectedBook && selectedChapterNum) {
        const bookName = selectedBook.name;
        const chapter = selectedChapterNum;
        const ref = `${bookName} ${chapter}:${verseNum}`;

        setCurrentBook(selectedBook.id);
        setCurrentChapter(chapter);
        setSelectedDeckId(verseNum);
        setShowSuggestions(false);

        // Update both preview and live with reference (text will update when chapter loads)
        const verseData = { ref, text: "Loading..." };
        setPreviewVerse(verseData);
        setLiveVerse(verseData);

        // Add to history
        setHistory((prev) => [
          { ref, text: "Selected from search" },
          ...prev.slice(0, 9),
        ]);

        // Clear search state after selection
        setSelectedBook(null);
        setSelectedChapterNum(null);
        setSearchInput("");
      }
    }
    searchInputRef.current?.focus();
  };

  // Handle backspace to remove tags
  const handleBackspace = () => {
    if (searchInput === "") {
      if (selectedChapterNum !== null) {
        setSelectedChapterNum(null);
      } else if (selectedBook !== null) {
        setSelectedBook(null);
      }
    }
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[selectedSuggestion].value);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((prev) =>
        Math.min(prev + 1, suggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Backspace" && searchInput === "") {
      handleBackspace();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Clear search and start over
  const clearSearch = () => {
    setSelectedBook(null);
    setSelectedChapterNum(null);
    setSearchInput("");
    searchInputRef.current?.focus();
  };

  // Effect: Fetch chapter from database
  useEffect(() => {
    async function loadChapter() {
      console.log(
        `Loading chapter: Book ${currentBook}, Chapter ${currentChapter}`
      );
      setIsLoading(true);

      try {
        let verses: VerseData[] = [];

        // Use Electron API to fetch data
        console.log("Fetching from database:", {
          book: currentBook,
          chapter: currentChapter,
        });
        const result = await window.api.getChapter(currentBook, currentChapter);
        console.log("API Result:", result);

        if (result.success && result.data) {
          verses = result.data;
        } else {
          console.error("Failed to fetch verses:", result.error);
        }

        console.log(`Loaded ${verses.length} verses`);
        setChapterVerses(verses);

        // Set preview to selected verse or first verse
        const targetVerse =
          verses.find((v) => v.id === selectedDeckId) || verses[0];
        if (targetVerse) {
          setPreviewVerse({ ref: targetVerse.ref, text: targetVerse.text });
          // Also update liveVerse if it's currently showing "Loading..."
          setLiveVerse((prev) =>
            prev.text === "Loading..."
              ? { ref: targetVerse.ref, text: targetVerse.text }
              : prev
          );
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
        // Still set empty array so loading stops
        setChapterVerses([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadChapter();
  }, [currentBook, currentChapter]);

  // Effect: Update preview when verse selection changes
  useEffect(() => {
    const verse = chapterVerses.find((v) => v.id === selectedDeckId);
    if (verse) {
      setPreviewVerse({ ref: verse.ref, text: verse.text });
    }
  }, [selectedDeckId, chapterVerses]);

  // Effect: Auto-scroll the deck when selection changes
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedDeckId]);

  // Effect: Service timer - counts up every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to detect and handle verse from transcript
  const detectVerseFromTranscript = useCallback(
    (text: string) => {
      const VERSE_REGEX =
        /(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts?|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s*(?:chapter\s*)?(\d+)(?:\s*(?:verse|:|\s)\s*(\d+))?/i;

      const match = text.match(VERSE_REGEX);
      if (match) {
        const [, bookName, chapterStr, verseStr] = match;
        const chapter = parseInt(chapterStr);
        const verse = verseStr ? parseInt(verseStr) : 1;
        const ref = `${bookName} ${chapter}:${verse}`;

        console.log("🎯 Client-side detected:", ref);
        setDetectedReference(ref);

        // Find book ID
        const bookId = Object.entries(BOOK_NAMES).find(
          ([, name]) => name.toLowerCase() === bookName.toLowerCase()
        )?.[0];

        if (bookId !== undefined && listeningMode === "scripture") {
          setCurrentBook(parseInt(bookId));
          setCurrentChapter(chapter);
          setSelectedDeckId(verse);
          // Only update live verse if NOT in Songs/Presentations tab
          // This will be checked when the callback runs
          setHistory((prev) => [
            { ref, text: "Detected" },
            ...prev.slice(0, 9),
          ]);

          // Clear detected reference after 3 seconds
          setTimeout(() => setDetectedReference(null), 3000);
        }
      }
    },
    [listeningMode]
  );

  // Reset lyric matching when song or slide changes
  useEffect(() => {
    heardWordsRef.current.clear();
    autoAdvanceLockedRef.current = false;
    pendingAdvanceRef.current = false;
    catchUpCooldownRef.current = false;
    setIsAutoAdvancing(false);
    setSlidePhase("start");
  }, [selectedSong?.id, selectedSlideIndex]);

  // Whisper transcription hook - receives transcripts from backend
  // NOTE: Don't call sendText here - backend already has this text
  const handleWhisperTranscript = useCallback(
    (text: string) => {
      setCurrentTranscript(text);

      // Lyric Auto-Advance Logic
      if (
        activeTab === "songs" &&
        selectedSong &&
        listeningMode === "lyrics" &&
        !autoAdvanceLockedRef.current
      ) {
        // 1. Update heard words
        const newWords = normalizeLyrics(text);
        newWords.forEach((w) => heardWordsRef.current.add(w));

        // 2. Prepare Slide Data
        const currentSlideText = selectedSong.slides[selectedSlideIndex];
        const slideWords = getSlideWordSet(currentSlideText);
        const lastLine = getLastLine(currentSlideText);

        // 3. Logic Check: Phase Control Loop
        const coverage = calculateCoverageRatio(
          slideWords,
          heardWordsRef.current
        );

        let shouldAdvanceNow = false;
        let isCatchUp = false;

        // --- PHASE TRANSITIONS ---
        // Rule A: Start -> Middle (25% coverage)
        if (slidePhase === "start" && coverage >= 0.25) {
          console.log("👉 Phase: START -> MIDDLE");
          setSlidePhase("middle");
        }
        // Rule B: Middle -> End (55% coverage)
        else if (slidePhase === "middle" && coverage >= 0.55) {
          console.log("👉 Phase: MIDDLE -> END");
          setSlidePhase("end");
        }

        // --- ADVANCE RULES ---
        // 1. Advance Check (Delegated to helper with phase guard)
        if (
          shouldAutoAdvance(
            slideWords,
            heardWordsRef.current,
            lastLine,
            slidePhase
          )
        ) {
          shouldAdvanceNow = true;
        }

        // --- CATCH-UP RULES ---
        // 2. Catch-up allowed in Middle or End (Never Start)
        else if (
          !catchUpCooldownRef.current &&
          slidePhase !== "start" &&
          selectedSlideIndex < selectedSong.slides.length - 1
        ) {
          const nextSlideText = selectedSong.slides[selectedSlideIndex + 1];
          const nextSlideWords = getSlideWordSet(nextSlideText);

          if (shouldCatchUp(nextSlideWords, heardWordsRef.current)) {
            shouldAdvanceNow = true;
            isCatchUp = true;
          }
        }

        if (shouldAdvanceNow) {
          // 4. Advance if not last slide
          if (selectedSlideIndex < selectedSong.slides.length - 1) {
            // GRACE DELAY: Wait 400ms before actually firing
            // This prevents mid-word jumps and feels more human
            if (!pendingAdvanceRef.current) {
              pendingAdvanceRef.current = true;

              setTimeout(() => {
                // Re-check lock just in case manual intervention happened locally
                if (!autoAdvanceLockedRef.current) {
                  console.log(
                    `🚀 Auto-advancing song slide (${
                      isCatchUp ? "CATCH-UP" : "Standard"
                    } Logic)!`
                  );
                  autoAdvanceLockedRef.current = true;
                  setIsAutoAdvancing(true);

                  // Set catch-up cooldown to prevent chain skipping
                  if (isCatchUp) {
                    catchUpCooldownRef.current = true;
                    // Reset cooldown after 1.5s
                    setTimeout(() => {
                      catchUpCooldownRef.current = false;
                    }, 1500);
                  }

                  // Use functional update to ensure we get fresh state if needed,
                  // though selectedSlideIndex is stale in closure...
                  // We rely on the fact that if selectedSlideIndex changed,
                  // the effect dependency would have cleaned up usage.
                  // Ideally we should use mutable ref or functional update if safe.
                  // But for now, we trust the closure captured the index we matched against.
                  const nextIndex = selectedSlideIndex + 1;
                  setSelectedSlideIndex(nextIndex);

                  const newVerse = {
                    ref: selectedSong.title,
                    text: selectedSong.slides[nextIndex],
                  };
                  setPreviewVerse(newVerse);
                  setLiveVerse(newVerse);
                  setShowLiveText(true);

                  setTimeout(() => setIsAutoAdvancing(false), 2000);
                }
                pendingAdvanceRef.current = false;
              }, 400);
            }
          }
        }
      }
    },
    [activeTab, selectedSong, listeningMode, selectedSlideIndex, slidePhase]
  );

  const {
    isModelReady: isWhisperReady,
    startRecording: startWhisperRecording,
    stopRecording: stopWhisperRecording,
  } = useWhisperTranscription({
    onTranscript: handleWhisperTranscript,
    onStatusChange: setWhisperStatus,
    deviceId: selectedDeviceId,
  });

  // Effect: Listen for AI Verse Detections (from backend - LIVE screen)
  useEffect(() => {
    if (!window.api?.onVerseDetected) return;

    const cleanup = window.api.onVerseDetected((data) => {
      // Only process scripture detection if in scripture mode
      if (listeningMode !== "scripture") return;

      console.log("🔴 AI Detection:", data);

      // Build reference string
      const ref =
        data.endVerse && data.endVerse !== data.verse
          ? `${data.book} ${data.chapter}:${data.verse}-${data.endVerse}`
          : `${data.book} ${data.chapter}:${data.verse}`;

      // Get text from verses array or fallback
      const text = data.verses?.map((v) => v.text).join(" ") || data.text || "";

      // Only update LIVE if this is NOT a preview and NOT in Songs/Presentations tab
      if (
        !data.isPreview &&
        activeTab !== "songs" &&
        activeTab !== "presentations"
      ) {
        setLiveVerse({ ref, text });

        // Add to History when pushed to live
        setHistory((prev) => [
          { ref, text: text.slice(0, 50) + (text.length > 50 ? "..." : "") },
          ...prev.slice(0, 9),
        ]);
      }
    });

    return cleanup;
  }, [activeTab, listeningMode]);

  // Effect: Listen for AI Verse PREVIEW (from backend - goes to preview first)
  useEffect(() => {
    if (!window.api?.onVersePreview) return;

    const cleanup = window.api.onVersePreview((data) => {
      // Only process scripture preview if in scripture mode
      if (listeningMode !== "scripture") return;

      console.log("👁️ AI Preview:", data);

      // Build reference string
      const ref =
        data.endVerse && data.endVerse !== data.verse
          ? `${data.book} ${data.chapter}:${data.verse}-${data.endVerse}`
          : `${data.book} ${data.chapter}:${data.verse}`;

      // Get text
      const text =
        data.verses?.map((v) => v.text).join(" ") || data.text || "Loading...";

      // Progress string (e.g. "v4–7 of 9")
      let progress = undefined;
      if (data.rangeEnd) {
        const currentEnd = data.endVerse || data.verse;
        progress = `v${data.verse}–${currentEnd} of ${data.rangeEnd}`;
      }

      // Update PREVIEW (not live yet) - but only if not in Songs/Presentations tab
      // to avoid overwriting user-selected song slides
      if (activeTab !== "songs" && activeTab !== "presentations") {
        setPreviewVerse({ ref, text, progress });
      }
      setDetectedReference(ref);

      // Map book/deck logic...
      const bookId = Object.entries(BOOK_NAMES).find(
        ([, name]) => name.toLowerCase() === data.book.toLowerCase()
      )?.[0];

      if (bookId !== undefined) {
        setCurrentBook(parseInt(bookId));
        setCurrentChapter(data.chapter);
        setSelectedDeckId(data.verse ?? 1);
      }

      setTimeout(() => setDetectedReference(null), 5000);
    });

    return cleanup;
  }, [activeTab, listeningMode]);

  // Effect: Enumerate Audio Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to get labels
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setAvailableDevices(audioInputs);
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };
    getDevices();
  }, []);

  // Effect: Listen for Transcript Updates
  const transcriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!window.api?.onTranscriptUpdate) return;

    const cleanup = window.api.onTranscriptUpdate((text) => {
      // Clear previous timer
      if (transcriptTimerRef.current) {
        clearTimeout(transcriptTimerRef.current);
      }

      setCurrentTranscript(text);

      // Clear transcript after 8 seconds of silence
      transcriptTimerRef.current = setTimeout(() => {
        setCurrentTranscript("");
      }, 8000);
    });

    return () => {
      cleanup?.();
      if (transcriptTimerRef.current) {
        clearTimeout(transcriptTimerRef.current);
      }
    };
  }, []);

  // Effect: Real Microphone Monitoring & Web Speech Recognition
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationId: number;
    let recognition: any = null;

    // dB Meter Smoothing
    let currentDb = -60;
    const lerp = (start: number, end: number, amt: number) =>
      (1 - amt) * start + amt * end;

    const startRealMic = async () => {
      try {
        const constraints = {
          audio:
            selectedDeviceId === "default"
              ? true
              : { deviceId: { exact: selectedDeviceId } },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        // Ensure the AudioContext is running (required by modern browsers)
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);

        const updateLevel = () => {
          if (!analyser) return;

          // Use Time Domain data for volume monitoring (more accurate for level meters)
          analyser.getByteTimeDomainData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            // Convert byte (0-255) to float (-1 to 1)
            const amplitude = (dataArray[i] - 128) / 128;
            sum += amplitude * amplitude;
          }

          const rms = Math.sqrt(sum / dataArray.length);
          let targetDb = rms > 0 ? 20 * Math.log10(rms) : -60;

          // Clamp between -60 and 0
          targetDb = Math.max(-60, Math.min(0, targetDb));

          // Smooth the transition (lerp)
          currentDb = lerp(currentDb, targetDb, 0.3);
          setAudioLevel(currentDb);

          animationId = requestAnimationFrame(updateLevel);
        };

        updateLevel();

        // --- Start Web Speech Recognition ---
        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;
        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptChunk = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                console.log("🗣️ Final Transcript:", transcriptChunk);
                window.api?.sendText(transcriptChunk);
                setCurrentTranscript(transcriptChunk);
                // Also try client-side detection
                detectVerseFromTranscript(transcriptChunk);
              } else {
                interimTranscript += transcriptChunk;
                setCurrentTranscript(interimTranscript);
              }
            }
          };

          recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === "no-speech") {
              // Ignore
            } else if (isListening) {
              // Try to restart if listening
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.onend = () => {
            if (isListening) {
              try {
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.start();
        }
      } catch (err) {
        console.error("Microphone access denied or error:", err);
      }
    };

    if (isListening) {
      startRealMic();
      window.api?.startListening();
    } else {
      window.api?.stopListening();
      setAudioLevel(-60);
      if (stream) {
        (stream as MediaStream)
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
      if (audioContext) {
        (audioContext as AudioContext).close();
      }
      if (recognition) {
        recognition.stop();
      }
    }

    return () => {
      cancelAnimationFrame(animationId);
      if (stream) {
        (stream as MediaStream)
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
      if (audioContext) {
        (audioContext as AudioContext).close();
      }
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening, selectedDeviceId]);

  // Remove the old onAudioLevel listener as we are now doing it locally for accuracy

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* 1. LEFT SIDEBAR: SESSION & HISTORY */}
      <div className="w-[280px] flex flex-col border-r border-white/10 bg-[#0a0a0a]">
        {/* Run of Show / Mode Select */}
        <div className="p-4 border-b border-white/10 flex flex-col gap-2">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Run of Show
          </h3>

          <button
            onClick={() => setMode("worship")}
            className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-all ${
              mode === "worship"
                ? "bg-[#1a1a1a] text-[#3E9B4F] border border-[#3E9B4F]/20"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            <List size={14} /> Today's Flow
          </button>

          <button
            onClick={() => setMode("sermon")}
            className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-all ${
              mode === "sermon"
                ? "bg-[#1a1a1a] text-[#3E9B4F] border border-[#3E9B4F]/20"
                : "text-gray-400 hover:bg-white/5"
            }`}
          >
            <Mic
              size={14}
              className={mode === "sermon" ? "animate-pulse" : ""}
            />
            Sermon
            {mode === "sermon" && (
              <span className="ml-auto text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">
                REC
              </span>
            )}
          </button>
        </div>

        {mode === "worship" ? (
          <>
            <div className="flex gap-2 px-4 py-2 border-b border-white/10 bg-[#0a0a0a]">
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="flex-1 bg-[#1a1a1a] border border-white/10 hover:border-[#3E9B4F]/50 text-xs text-gray-400 hover:text-white py-1.5 rounded flex items-center justify-center gap-2 transition-all"
              >
                <ImageIcon size={12} className="text-[#3E9B4F]" /> Add Media
              </button>
              <input
                type="file"
                ref={mediaInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
              />
              <button
                onClick={() => {
                  const noteText = prompt("Enter note text:", "New Note");
                  if (noteText) {
                    const newNote: ServiceItem = {
                      id: crypto.randomUUID(),
                      type: "note",
                      title: "Note",
                      subtitle: noteText,
                      data: { text: noteText },
                    };
                    setServiceFlow((prev) => [...prev, newNote]);
                  }
                }}
                className="flex-1 bg-[#1a1a1a] border border-white/10 hover:border-yellow-500/50 text-xs text-gray-400 hover:text-white py-1.5 rounded flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={12} className="text-yellow-500" /> Add Note
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-2 space-y-1"
              onDragOver={handleFlowDragOver}
              onDrop={handleFlowDrop}
            >
              {/* Empty State */}
              {serviceFlow.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-gray-700 text-xs border border-dashed border-white/10 rounded">
                  <List size={24} className="mb-2 opacity-50" />
                  <span>Drag items here</span>
                </div>
              )}
              {/* Items */}
              {serviceFlow.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const data = e.dataTransfer.getData("application/json");
                    if (data) {
                      try {
                        const parsed = JSON.parse(data);
                        const items = Array.isArray(parsed) ? parsed : [parsed];

                        const itemsToInsert: ServiceItem[] = [];

                        items.forEach((item: ServiceItem) => {
                          if (serviceFlow.find((sf) => sf.id === item.id)) {
                            itemsToInsert.push(item);
                          } else {
                            itemsToInsert.push({
                              ...item,
                              id: crypto.randomUUID(),
                            });
                          }
                        });

                        const idsToRemove = new Set(
                          itemsToInsert
                            .filter((i) =>
                              serviceFlow.some((sf) => sf.id === i.id)
                            )
                            .map((i) => i.id)
                        );

                        const targetItem = serviceFlow[index];
                        const filteredFlow = serviceFlow.filter(
                          (i) => !idsToRemove.has(i.id)
                        );

                        let newTargetIndex = filteredFlow.findIndex(
                          (i) => i.id === targetItem.id
                        );
                        if (newTargetIndex === -1)
                          newTargetIndex =
                            index <= filteredFlow.length
                              ? index
                              : filteredFlow.length;

                        filteredFlow.splice(
                          newTargetIndex,
                          0,
                          ...itemsToInsert
                        );
                        setServiceFlow(filteredFlow);
                      } catch (err) {
                        console.error("Drop error", err);
                      }
                    }
                  }}
                  className={`group flex items-center gap-2 p-2 rounded mb-1 border transition-colors cursor-move ${
                    item.type === "note"
                      ? "bg-yellow-900/20 border-yellow-500/20 text-yellow-200 hover:border-yellow-500/40"
                      : "bg-[#111] border-white/5 hover:border-white/20 text-xs text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <GripVertical
                    size={12}
                    className={`${
                      item.type === "note" ? "text-yellow-600" : "text-gray-600"
                    } cursor-grab`}
                  />

                  {/* Media Thumbnail */}
                  {(item.type === "theme" || item.type === "presentation") && (
                    <div className="w-8 h-8 rounded bg-black/50 overflow-hidden flex-shrink-0 border border-white/10 mr-2">
                      {item.data.type === "gradient" ? (
                        <div
                          className="w-full h-full"
                          style={{ background: item.data.url }}
                        />
                      ) : item.data.type === "video" ? (
                        <video
                          src={item.data.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : item.type === "presentation" &&
                        item.data.slides?.[0] ? (
                        <img
                          src={item.data.slides[0]}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <img
                          src={item.data.url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      )}
                    </div>
                  )}

                  <div
                    className="flex-1 min-w-0"
                    title={
                      item.type === "note" ? "Double-click to edit" : item.title
                    }
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (item.type === "note") {
                        const newText = prompt("Edit note:", item.subtitle);
                        if (newText !== null) {
                          setServiceFlow((prev) =>
                            prev.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    subtitle: newText,
                                    data: { ...i.data, text: newText },
                                  }
                                : i
                            )
                          );
                        }
                      }
                    }}
                  >
                    <div
                      className={`font-bold truncate ${
                        item.type === "note" ? "text-yellow-100" : ""
                      }`}
                    >
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div
                        className={`text-[10px] truncate ${
                          item.type === "note"
                            ? "text-yellow-500 italic"
                            : "text-gray-500"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {item.type !== "note" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playFlowItem(item);
                      }}
                      className="bg-[#3E9B4F]/20 text-[#3E9B4F] p-1 rounded hover:bg-[#3E9B4F] hover:text-white transition-colors"
                      title="Push to Live"
                    >
                      <Play size={10} fill="currentColor" />
                    </button>
                  )}

                  <button
                    onClick={(e) => removeFromFlow(item.id, e)}
                    className={`hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ${
                      item.type === "note" ? "text-yellow-700" : "text-gray-600"
                    }`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Service Timer */}
            <div className="h-12 flex items-center px-4 border-b border-white/10 gap-2 text-gray-500">
              <Timer size={14} className="text-[#3E9B4F]" />
              <span className="text-[10px] uppercase text-gray-600 font-bold">
                Service Time
              </span>
              <span className="font-mono text-sm text-white ml-auto">
                {formatTime(elapsedTime)}
              </span>
            </div>

            {/* Current Detection */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                Current Detection
              </h3>

              {!isListening ? (
                // Start Now Button
                <button
                  onClick={() => {
                    setListeningMode("scripture");
                    setIsListening(true);
                    startWhisperRecording();
                  }}
                  disabled={!isWhisperReady}
                  className={`w-full p-4 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 hover:border-[#3E9B4F]/60 transition-all group ${
                    !isWhisperReady ? "opacity-60 cursor-wait" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {isWhisperReady ? (
                      <Mic
                        size={24}
                        className="text-[#3E9B4F] group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <Loader2
                        size={24}
                        className="text-[#3E9B4F] animate-spin"
                      />
                    )}
                    <span className="text-sm font-bold text-[#3E9B4F]">
                      {isWhisperReady ? "Start Now" : "Loading AI..."}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {isWhisperReady
                        ? "Click to start listening"
                        : whisperStatus}
                    </span>
                  </div>
                </button>
              ) : (
                // Listening Section (Active or Detection)
                <div className="space-y-3">
                  {/* Input Selection */}
                  <div className="px-1">
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[10px] text-gray-400 focus:outline-none focus:border-[#3E9B4F]/50 transition-colors"
                    >
                      <option value="default">Default Input (Mic/Aux)</option>
                      {availableDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Input ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {liveVerse.ref === "" ? (
                    // Listening state (no detection yet)
                    <div className="p-3 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 relative overflow-hidden">
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-[#3E9B4F] rounded-full animate-pulse" />
                        <span className="text-[9px] text-[#3E9B4F] uppercase font-bold">
                          Listening
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {/* dB Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-end text-[9px] font-mono text-gray-500 px-0.5">
                            <span>-60</span>
                            <span>-30</span>
                            <span>-18</span>
                            <span>-6</span>
                            <span className="text-red-500">0</span>
                          </div>
                          <div className="h-1.5 bg-black/40 rounded-full border border-white/5 relative overflow-hidden flex items-center">
                            <div
                              className="h-full transition-all duration-75 ease-out rounded-full"
                              style={{
                                width: `${Math.max(
                                  0,
                                  ((audioLevel + 60) / 60) * 100
                                )}%`,
                                background: `linear-gradient(to right, #3E9B4F 0%, #3E9B4F 70%, #fbbf24 85%, #ef4444 100%)`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Live Transcript Area */}
                        <div className="min-h-[40px] p-2 bg-black/20 rounded border border-white/5 flex flex-wrap gap-1 items-start content-start">
                          {detectedReference ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] bg-[#3E9B4F]/20 text-[#3E9B4F] font-bold px-2 py-0.5 rounded animate-pulse">
                                📖 {detectedReference}
                              </span>
                            </div>
                          ) : currentTranscript ? (
                            <span className="text-[11px] text-[#3E9B4F] font-medium leading-relaxed italic">
                              "{currentTranscript}"
                            </span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-500">
                                Waiting for speech
                              </span>
                              <span className="w-[2px] h-3 bg-[#3E9B4F] cursor-blink" />
                            </div>
                          )}
                        </div>

                        {/* Manual Test Input (fallback for network issues) */}
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Type scripture (e.g. Genesis 1:1)"
                            className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const text = (e.target as HTMLInputElement)
                                  .value;
                                if (text) {
                                  console.log("📝 Manual input:", text);
                                  setCurrentTranscript(text);
                                  detectVerseFromTranscript(text);
                                  window.api?.sendText(text);
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                          />
                          <span className="text-[9px] text-gray-600 mt-0.5 block">
                            Press Enter to test detection
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tight">
                            Signal Health
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              audioLevel > -3
                                ? "text-red-500 animate-pulse"
                                : "text-[#3E9B4F]"
                            }`}
                          >
                            {audioLevel.toFixed(1)} dB
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsListening(false);
                          stopWhisperRecording();
                        }}
                        className="mt-4 text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <X size={10} /> Stop Listening
                      </button>
                    </div>
                  ) : (
                    // Active detection
                    <div className="p-3 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 relative overflow-hidden">
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-[#3E9B4F] rounded-full animate-pulse" />
                        <span className="text-[9px] text-[#3E9B4F] uppercase font-bold">
                          Live
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#3E9B4F]">
                        {liveVerse.ref}
                      </span>
                      <p
                        className="text-xs text-gray-400 mt-1 line-clamp-2"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        "{liveVerse.text}"
                      </p>

                      {/* Real Transcription that triggered this */}
                      {currentTranscript && (
                        <div className="mt-2 p-1.5 bg-black/20 rounded border border-white/5">
                          <p className="text-[10px] text-[#3E9B4F]/80 italic line-clamp-2 font-medium">
                            "{currentTranscript}"
                          </p>
                        </div>
                      )}

                      {/* Mini Meter for active detection */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-75"
                            style={{
                              width: `${Math.max(
                                0,
                                ((audioLevel + 60) / 60) * 100
                              )}%`,
                              background:
                                audioLevel > -3 ? "#ef4444" : "#3E9B4F",
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 w-8">
                          {audioLevel.toFixed(0)}dB
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setIsListening(false);
                          stopWhisperRecording();
                        }}
                        className="mt-2 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                      >
                        Stop Listening
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History / Detections */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Recent Detections
                </h3>
                <button
                  className="text-gray-500 hover:text-white"
                  title="Download Sermon Notes"
                >
                  <Download size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded bg-[#111] border border-white/5 hover:border-white/20 cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white">
                        {item.ref}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 bg-white/10 p-1 rounded hover:bg-white/20">
                        <Play size={10} className="text-[#3E9B4F]" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 truncate">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP: PREVIEW & LIVE MONITORS */}
        <div className="h-[45%] bg-[#050505] p-6 flex gap-6 border-b border-white/10">
          {/* Preview */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-bold text-[#3E9B4F] uppercase tracking-wider flex items-center gap-2">
                <Monitor size={12} /> Preview
              </span>
            </div>
            <div className="flex-1 bg-black rounded-lg border border-[#3E9B4F]/30 relative overflow-hidden">
              {/* Theme Background */}
              {selectedTheme.type === "gradient" ? (
                <div
                  className="absolute inset-0"
                  style={{ background: selectedTheme.url }}
                />
              ) : selectedTheme.type === "video" ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  src={selectedTheme.url}
                />
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedTheme.url})` }}
                />
              )}
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute inset-0 flex p-6 z-10 flex-col items-center justify-center">
                <div className="text-center max-w-2xl">
                  <p
                    className="text-lg font-light leading-relaxed mb-4"
                    style={{
                      textShadow: selectedTextStyle.textShadow,
                      fontSize: `${1.2 * fontSize}rem`,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      color: textColor,
                      whiteSpace: "pre-line",
                    }}
                  >
                    "{previewVerse.text}"
                  </p>
                  {/* Only show ref/version for scriptures (contains :) */}
                  {previewVerse.ref.includes(":") && (
                    <h2
                      className="text-base font-serif"
                      style={{
                        textShadow: selectedTextStyle.textShadow,
                        color: textColor,
                      }}
                    >
                      {previewVerse.ref}
                      <span className="text-sm opacity-70 ml-2 font-sans">
                        {selectedVersion}
                      </span>
                    </h2>
                  )}
                </div>
              </div>
            </div>

            {/* Song Slide Navigation - only when in Songs tab */}
            {activeTab === "songs" && selectedSong && (
              <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-[#0a0a0a] via-[#151515] to-[#0a0a0a] border-t border-[#3E9B4F]/20">
                {/* Lyric Mic Button */}
                <button
                  onClick={() => {
                    if (isListening && listeningMode === "lyrics") {
                      setIsListening(false);
                      stopWhisperRecording();
                    } else {
                      setListeningMode("lyrics");
                      setIsListening(true);
                      startWhisperRecording();
                    }
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all mr-2 ${
                    isListening && listeningMode === "lyrics"
                      ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse"
                      : "bg-[#3E9B4F]/10 border-[#3E9B4F]/30 text-[#3E9B4F] hover:bg-[#3E9B4F]/20"
                  }`}
                  title={
                    isListening && listeningMode === "lyrics"
                      ? "Stop Lyric Listening"
                      : "Start Lyric Listening"
                  }
                >
                  {isListening && listeningMode === "lyrics" ? (
                    <div className="w-3 h-3 bg-red-500 rounded-sm" />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>

                <button
                  onClick={() => {
                    const newIndex = Math.max(0, selectedSlideIndex - 1);
                    setSelectedSlideIndex(newIndex);
                    const newVerse = {
                      ref: selectedSong.title,
                      text: selectedSong.slides[newIndex],
                    };
                    setPreviewVerse(newVerse);
                    setLiveVerse(newVerse);
                    setShowLiveText(true);
                  }}
                  disabled={selectedSlideIndex === 0}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#3E9B4F]/20 hover:bg-[#3E9B4F]/40 border border-[#3E9B4F]/30 disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} className="text-[#3E9B4F]" />
                </button>
                <div className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full bg-[#3E9B4F]/10 border border-[#3E9B4F]/20 min-w-[100px]">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-[#3E9B4F]">
                      {selectedSlideIndex + 1}
                    </span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-sm text-gray-400">
                      {selectedSong.slides.length}
                    </span>
                  </div>
                  {isListening && listeningMode === "lyrics" && (
                    <span
                      className={`text-[9px] font-mono tracking-wider ${
                        isAutoAdvancing
                          ? "text-white animate-pulse"
                          : "text-[#3E9B4F]/70"
                      }`}
                    >
                      {isAutoAdvancing
                        ? "ADVANCING..."
                        : `LISTENING (${slidePhase.toUpperCase()})`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const newIndex = Math.min(
                      selectedSong.slides.length - 1,
                      selectedSlideIndex + 1
                    );
                    setSelectedSlideIndex(newIndex);
                    const newVerse = {
                      ref: selectedSong.title,
                      text: selectedSong.slides[newIndex],
                    };
                    setPreviewVerse(newVerse);
                    setLiveVerse(newVerse);
                    setShowLiveText(true);
                  }}
                  disabled={
                    selectedSlideIndex === selectedSong.slides.length - 1
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#3E9B4F]/20 hover:bg-[#3E9B4F]/40 border border-[#3E9B4F]/30 disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} className="text-[#3E9B4F]" />
                </button>
              </div>
            )}
          </div>

          {/* Control Bar - between Preview and Live */}
          <div className="flex flex-col items-center justify-center gap-2 px-2">
            <button
              onClick={() => {
                // Push preview verse to live
                setLiveVerse(previewVerse);
                setShowLiveText(true);
                window.api?.pushToLive();
              }}
              className="w-10 h-10 bg-[#3E9B4F] hover:bg-[#4fb85f] rounded-full flex items-center justify-center transition-colors shadow-lg"
              title="Push to Live"
            >
              <Monitor size={18} className="text-white" />
            </button>
            <button
              onClick={() => setShowLiveText(false)}
              className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
              title="Clear Screen (Show Background Only)"
            >
              <MonitorOff size={18} className="text-gray-300" />
            </button>
          </div>

          {/* Live */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />{" "}
                Live Output
              </span>
            </div>
            <div className="flex-1 bg-black rounded-lg border border-red-500/30 relative overflow-hidden">
              {/* Theme Background */}
              {selectedTheme.type === "gradient" ? (
                <div
                  className="absolute inset-0"
                  style={{ background: selectedTheme.url }}
                />
              ) : selectedTheme.type === "video" ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  src={selectedTheme.url}
                />
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedTheme.url})` }}
                />
              )}
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/30" />

              <div className="absolute inset-0 flex p-8 z-10 flex-col items-center justify-center">
                {showLiveText && liveVerse.ref && (
                  <div className="text-center max-w-4xl">
                    <p
                      className="text-2xl font-light leading-relaxed mb-6"
                      style={{
                        textShadow: selectedTextStyle.textShadow,
                        fontSize: `${1.5 * fontSize}rem`,
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        color: textColor,
                        whiteSpace: "pre-line",
                      }}
                    >
                      "{liveVerse.text}"
                    </p>
                    {/* Only show ref/version for scriptures (contains :) */}
                    {liveVerse.ref.includes(":") && (
                      <h2
                        className="text-xl font-serif"
                        style={{
                          textShadow: selectedTextStyle.textShadow,
                          color: textColor,
                        }}
                      >
                        {liveVerse.ref}
                        <span className="text-base opacity-70 ml-3 font-sans">
                          {selectedVersion}
                        </span>
                      </h2>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: THE SCRIPTURE DECK (EasyWorship Style) */}
        <div className="flex-1 flex flex-col bg-[#0f0f0f] min-h-0">
          {/* Tabs */}
          <div className="h-9 flex items-center px-2 bg-[#1a1a1a] border-b border-white/5 select-none">
            <button
              onClick={() => setActiveTab("scriptures")}
              className={`px-4 h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "scriptures"
                  ? "border-[#3E9B4F] text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Scriptures
            </button>
            <button
              onClick={() => setActiveTab("themes")}
              className={`px-4 h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "themes"
                  ? "border-[#3E9B4F] text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Themes
            </button>
            <button
              onClick={() => setActiveTab("songs")}
              className={`px-4 h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "songs"
                  ? "border-[#3E9B4F] text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Songs
            </button>
            <button
              onClick={() => setActiveTab("presentations")}
              className={`px-4 h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === "presentations"
                  ? "border-[#3E9B4F] text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Presentations
            </button>
          </div>

          {/* Themes Tab Content */}
          {activeTab === "themes" && (
            <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
              {/* Add Custom Theme */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Add Custom Background
                </h3>
                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        const isVideo = file.type.startsWith("video/");
                        const newTheme: Theme = {
                          id: `custom-${Date.now()}`,
                          name: file.name.split(".")[0],
                          type: isVideo ? "video" : "image",
                          url,
                        };
                        setCustomThemes((prev) => [...prev, newTheme]);
                        setSelectedTheme(newTheme);
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg hover:border-[#3E9B4F]/50 transition-colors"
                  >
                    <ImageIcon size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300">Add Image</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg hover:border-[#3E9B4F]/50 transition-colors"
                  >
                    <Video size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300">Add Video</span>
                  </button>
                </div>
              </div>

              {/* Text Layout Styles - Horizontally scrollable */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Text Layout
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {LAYOUT_PRESETS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout)}
                      className={`flex-shrink-0 w-32 h-20 rounded-lg border-2 transition-all relative overflow-hidden ${
                        selectedLayout.id === layout.id
                          ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      {/* Mini preview of layout */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 p-2 flex flex-col">
                        {layout.refPosition === "top-center" && (
                          <>
                            <div className="text-[8px] text-white font-bold text-center mb-1">
                              John 3:16
                            </div>
                            <div className="text-[6px] text-gray-400 text-center flex-1">
                              For God so loved...
                            </div>
                          </>
                        )}
                        {layout.refPosition === "bottom-right" && (
                          <>
                            <div className="text-[6px] text-gray-400 text-left flex-1">
                              For God so loved...
                            </div>
                            <div className="text-[8px] text-white font-bold text-right">
                              John 3:16
                            </div>
                          </>
                        )}
                        {layout.refPosition === "bottom-left" && (
                          <>
                            <div className="text-[6px] text-gray-400 text-right flex-1">
                              For God so loved...
                            </div>
                            <div className="text-[8px] text-white font-bold text-left">
                              John 3:16
                            </div>
                          </>
                        )}
                        {layout.refPosition === "bottom-center" && (
                          <>
                            <div className="text-[6px] text-gray-400 text-center flex-1">
                              For God so loved...
                            </div>
                            <div className="text-[8px] text-white font-bold text-center">
                              John 3:16
                            </div>
                          </>
                        )}
                        {layout.refPosition === "top-left" && (
                          <>
                            <div className="text-[8px] text-white font-bold text-left mb-1">
                              John 3:16
                            </div>
                            <div className="text-[6px] text-gray-400 text-left flex-1">
                              For God so loved...
                            </div>
                          </>
                        )}
                      </div>
                      {selectedLayout.id === layout.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#3E9B4F] rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  {selectedLayout.description}
                </p>
              </div>

              {/* Text Styling Row - Effect, Size, Color on same line */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Text Styling
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {/* Text Effect */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] text-gray-500 mb-1 block">
                      Effect
                    </label>
                    <select
                      value={selectedTextStyle.id}
                      onChange={(e) => {
                        const style = TEXT_STYLES.find(
                          (s) => s.id === e.target.value
                        );
                        if (style) setSelectedTextStyle(style);
                      }}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/50"
                    >
                      {TEXT_STYLES.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[10px] text-gray-500 mb-1 block">
                      Size: {Math.round(fontSize * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.75"
                      max="2"
                      step="0.05"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#3E9B4F]"
                    />
                  </div>

                  {/* Text Color */}
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-[10px] text-gray-500 mb-1 block">
                      Color
                    </label>
                    <div className="flex gap-1">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setTextColor(color.value)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            textColor === color.value
                              ? "border-[#3E9B4F] scale-110"
                              : "border-transparent hover:border-white/30"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Combined Preview */}
                <div className="mt-3 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg text-center">
                  <p
                    style={{
                      fontSize: `${1.25 * fontSize}rem`,
                      textShadow: selectedTextStyle.textShadow,
                      color: textColor,
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    "For God so loved the world..."
                  </p>
                </div>
              </div>

              {/* Gradient Options - Only show when gradient theme is selected */}
              {selectedTheme.type === "gradient" && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Gradient Style
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {GRADIENT_PRESETS.map((gradient) => (
                      <button
                        key={gradient.id}
                        onClick={() => {
                          setSelectedTheme({
                            ...selectedTheme,
                            url: gradient.value,
                          });
                        }}
                        className={`w-16 h-10 rounded-lg border-2 transition-all ${
                          selectedTheme.url === gradient.value
                            ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                            : "border-white/10 hover:border-white/30"
                        }`}
                        style={{ background: gradient.value }}
                        title={gradient.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Themes */}
              {customThemes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Your Themes
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {customThemes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={(e) => {
                          const allIds = customThemes.map((t) => t.id);
                          const shouldPlay = handleMultiSelectClick(
                            theme.id,
                            allIds,
                            e
                          );
                          if (shouldPlay) setSelectedTheme(theme);
                        }}
                        draggable
                        onDragStart={(e) => {
                          let itemsToDrag: ServiceItem[] = [];
                          if (selectedItems.has(theme.id)) {
                            itemsToDrag = customThemes
                              .filter((t) => selectedItems.has(t.id))
                              .map((t) => ({
                                id: t.id,
                                type: "theme",
                                title: t.name,
                                subtitle: t.type,
                                data: t,
                              }));
                          } else {
                            itemsToDrag = [
                              {
                                id: theme.id,
                                type: "theme",
                                title: theme.name,
                                subtitle: theme.type,
                                data: theme,
                              },
                            ];
                          }
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify(itemsToDrag)
                          );
                        }}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          selectedItems.has(theme.id) ||
                          selectedTheme.id === theme.id
                            ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        {theme.type === "video" ? (
                          <video
                            src={theme.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${theme.url})` }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                          <span className="text-[10px] text-white font-medium truncate">
                            {theme.name}
                          </span>
                        </div>
                        {selectedTheme.id === theme.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-[#3E9B4F] rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Themes */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Default Themes
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {DEFAULT_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={(e) => {
                        const allIds = DEFAULT_THEMES.map((t) => t.id); // Context aware?
                        // For mixed lists (defaults + customs), handleMultiSelect might fail to range select nicely if IDs aren't contiguous in one array.
                        // But simple CTRL select works.
                        const shouldPlay = handleMultiSelectClick(
                          theme.id,
                          allIds,
                          e
                        );
                        if (shouldPlay) setSelectedTheme(theme);
                      }}
                      draggable
                      onDragStart={(e) => {
                        let itemsToDrag: ServiceItem[] = [];
                        if (selectedItems.has(theme.id)) {
                          // We need to look in both custom and default?
                          // Simplification: just assume currently displayed list logic or look in both
                          const allThemes = [
                            ...DEFAULT_THEMES,
                            ...customThemes,
                          ];
                          itemsToDrag = allThemes
                            .filter((t) => selectedItems.has(t.id))
                            .map((t) => ({
                              id: t.id,
                              type: "theme",
                              title: t.name,
                              subtitle: t.type,
                              data: t,
                            }));
                        } else {
                          itemsToDrag = [
                            {
                              id: theme.id,
                              type: "theme",
                              title: theme.name,
                              subtitle: theme.type,
                              data: theme,
                            },
                          ];
                        }
                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify(itemsToDrag)
                        );
                      }}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedItems.has(theme.id) ||
                        selectedTheme.id === theme.id
                          ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      {theme.type === "gradient" ? (
                        <div
                          className="w-full h-full"
                          style={{ background: theme.url }}
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${theme.url})` }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                        <span className="text-[10px] text-white font-medium truncate">
                          {theme.name}
                        </span>
                      </div>
                      {selectedTheme.id === theme.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-[#3E9B4F] rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "scriptures" && (
            <>
              {/* Tag-Based Search Bar */}
              <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
                {/* Search Input with Tags */}
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 focus-within:border-[#3E9B4F]/50">
                    <Search className="text-gray-500 flex-shrink-0" size={16} />

                    {/* Book Tag */}
                    {selectedBook && (
                      <span className="flex items-center gap-1 bg-[#3E9B4F]/20 text-[#3E9B4F] px-2 py-0.5 rounded text-sm font-medium">
                        {selectedBook.name}
                        <button
                          onClick={() => {
                            setSelectedBook(null);
                            setSelectedChapterNum(null);
                          }}
                          className="hover:bg-[#3E9B4F]/30 rounded p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {/* Chapter Tag */}
                    {selectedChapterNum && (
                      <span className="flex items-center gap-1 bg-[#3E9B4F]/20 text-[#3E9B4F] px-2 py-0.5 rounded text-sm font-medium">
                        Ch. {selectedChapterNum}
                        <button
                          onClick={() => setSelectedChapterNum(null)}
                          className="hover:bg-[#3E9B4F]/30 rounded p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {/* Input */}
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setShowSuggestions(true);
                        setSelectedSuggestion(0);
                      }}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder={
                        !selectedBook
                          ? "Type a book name..."
                          : !selectedChapterNum
                          ? "Type chapter number..."
                          : "Type verse number..."
                      }
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[100px]"
                    />

                    {/* Clear All */}
                    {(selectedBook || searchInput) && (
                      <button
                        onClick={clearSearch}
                        className="text-gray-500 hover:text-white p-1"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] uppercase text-gray-600 font-bold tracking-wider border-b border-white/5">
                        {searchStep === "book"
                          ? "Select Book"
                          : searchStep === "chapter"
                          ? "Select Chapter"
                          : "Select Verse"}
                      </div>
                      {suggestions.map((item, index) => (
                        <button
                          key={item.value}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(item.value);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                            index === selectedSuggestion
                              ? "bg-[#3E9B4F]/20 text-white"
                              : "text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          <span className="font-medium">{item.label}</span>
                          {searchStep === "book" && (
                            <span className="text-gray-600 text-xs">
                              ↵ to select
                            </span>
                          )}
                        </button>
                      ))}
                      <div className="px-4 py-2 text-xs text-gray-600 border-t border-white/5">
                        ↑↓ Navigate • Enter Select • Backspace Remove
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Table Header */}
              <div className="flex items-center px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
                {/* Translation Dropdown */}
                <div className="w-20 relative">
                  <button
                    onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                    onBlur={() =>
                      setTimeout(() => setShowVersionDropdown(false), 200)
                    }
                    className="flex items-center gap-1 text-xs font-bold text-[#3E9B4F] uppercase tracking-wider hover:text-[#4fb85f] transition-colors"
                  >
                    {selectedVersion}
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        showVersionDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Version Dropdown */}
                  {showVersionDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="px-3 py-2 text-[10px] uppercase text-gray-500 font-bold tracking-wider border-b border-white/5">
                        Select Translation
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {BIBLE_VERSIONS.map((version) => (
                          <button
                            key={version.code}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedVersion(version.code);
                              setShowVersionDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                              selectedVersion === version.code
                                ? "bg-[#3E9B4F]/20 text-white"
                                : "text-gray-400 hover:bg-white/5"
                            }`}
                          >
                            <div>
                              <span className="font-medium">
                                {version.code}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {version.name}
                              </span>
                            </div>
                            {selectedVersion === version.code && (
                              <Check size={14} className="text-[#3E9B4F]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-40 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reference
                </div>
                <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Scripture Text
                </div>
              </div>

              {/* Scrollable Table Area */}
              <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Loading scriptures...
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {chapterVerses.map((row) => (
                        <tr
                          key={row.id}
                          data-verse-id={row.id}
                          draggable
                          onDragStart={(e) => {
                            // Serialize logic
                            const idStr = String(row.id);
                            let itemsToDrag: ServiceItem[] = [];

                            // If dragging a selected item, drag ALL selected
                            if (selectedItems.has(idStr)) {
                              itemsToDrag = chapterVerses
                                .filter((v) => selectedItems.has(String(v.id)))
                                .map((v) => ({
                                  id: `verse-${v.id}`,
                                  type: "scripture",
                                  title: v.ref,
                                  subtitle: v.text,
                                  data: v,
                                }));
                            } else {
                              // Assume single item drag (and select it?)
                              itemsToDrag = [
                                {
                                  id: `verse-${row.id}`,
                                  type: "scripture",
                                  title: row.ref,
                                  subtitle: row.text,
                                  data: row,
                                },
                              ];
                            }

                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify(itemsToDrag)
                            );
                          }}
                          ref={
                            selectedDeckId === row.id ? selectedRowRef : null
                          }
                          onClick={(e) => {
                            const idStr = String(row.id);
                            const allIds = chapterVerses.map((v) =>
                              String(v.id)
                            );
                            const shouldPlay = handleMultiSelectClick(
                              idStr,
                              allIds,
                              e
                            );

                            if (shouldPlay) {
                              setSelectedDeckId(row.id);
                              // Update both preview and live
                              setPreviewVerse({ ref: row.ref, text: row.text });
                              setLiveVerse({ ref: row.ref, text: row.text });
                              // Add to history
                              setHistory((prev) => [
                                {
                                  ref: row.ref,
                                  text:
                                    row.text.slice(0, 50) +
                                    (row.text.length > 50 ? "..." : ""),
                                },
                                ...prev.slice(0, 9),
                              ]);
                            }
                          }}
                          className={`
                          cursor-pointer border-b border-white/5 text-sm transition-colors
                          ${
                            selectedItems.has(String(row.id)) ||
                            selectedDeckId === row.id
                              ? "bg-[#3E9B4F]/20 text-white"
                              : "text-gray-400 hover:bg-white/5"
                          }
                        `}
                        >
                          <td className="p-2 w-16 text-xs opacity-50 font-mono">
                            {row.version}
                          </td>
                          <td
                            className={`p-2 w-40 font-bold whitespace-nowrap ${
                              selectedDeckId === row.id
                                ? "text-[#3E9B4F]"
                                : "text-gray-500"
                            }`}
                          >
                            {row.ref}
                          </td>
                          <td className="p-2 opacity-90 truncate max-w-xl">
                            {row.text}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {activeTab === "songs" && (
            <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
              {/* Songs Search Bar + Add Button */}
              <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 focus-within:border-[#3E9B4F]/50">
                    <Search className="text-gray-500 flex-shrink-0" size={16} />
                    <input
                      type="text"
                      placeholder="Search songs..."
                      value={songSearchInput}
                      onChange={(e) => setSongSearchInput(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[100px]"
                    />
                    {songSearchInput && (
                      <button
                        onClick={() => setSongSearchInput("")}
                        className="text-gray-500 hover:text-white p-1"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowAddSongModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3E9B4F] hover:bg-[#4fb85f] rounded-lg text-sm font-medium text-white transition-colors"
                >
                  <Plus size={16} />
                  Add Song
                </button>
              </div>

              {/* Song List + Slides View */}
              <div className="flex-1 flex min-h-0">
                {/* Song List */}
                <div className="w-64 border-r border-white/10 overflow-y-auto">
                  {songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Music className="text-gray-600 mb-3" size={32} />
                      <p className="text-sm text-gray-500">No songs yet</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Click "Add Song" to get started
                      </p>
                    </div>
                  ) : (
                    songs
                      .filter(
                        (song) =>
                          song.title
                            .toLowerCase()
                            .includes(songSearchInput.toLowerCase()) ||
                          song.artist
                            ?.toLowerCase()
                            .includes(songSearchInput.toLowerCase())
                      )
                      .map((song) => (
                        <div
                          key={song.id}
                          className={`flex items-center border-b border-white/5 transition-colors ${
                            selectedItems.has(song.id) ||
                            selectedSong?.id === song.id
                              ? "bg-[#3E9B4F]/20"
                              : "hover:bg-white/5"
                          }`}
                          draggable
                          onDragStart={(e) => {
                            let itemsToDrag: ServiceItem[] = [];
                            if (selectedItems.has(song.id)) {
                              itemsToDrag = songs
                                .filter((s) => selectedItems.has(s.id))
                                .map((s) => ({
                                  id: s.id,
                                  type: "song",
                                  title: s.title,
                                  subtitle: s.artist,
                                  data: s,
                                }));
                            } else {
                              itemsToDrag = [
                                {
                                  id: song.id,
                                  type: "song",
                                  title: song.title,
                                  subtitle: song.artist,
                                  data: song,
                                },
                              ];
                            }
                            e.dataTransfer.setData(
                              "application/json",
                              JSON.stringify(itemsToDrag)
                            );
                          }}
                        >
                          <button
                            onClick={(e) => {
                              const allIds = songs.map((s) => s.id);
                              const shouldPlay = handleMultiSelectClick(
                                song.id,
                                allIds,
                                e
                              );
                              if (shouldPlay) {
                                setSelectedSong(song);
                                setSelectedSlideIndex(0);
                              }
                            }}
                            className={`flex-1 p-3 text-left ${
                              selectedItems.has(song.id) ||
                              selectedSong?.id === song.id
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          >
                            <div className="font-medium text-sm truncate">
                              {song.title}
                            </div>
                            {song.artist && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {song.artist}
                              </div>
                            )}
                            <div className="text-[10px] text-gray-600 mt-1">
                              {song.slides.length} slides
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSongs((prev) =>
                                prev.filter((s) => s.id !== song.id)
                              );
                              if (selectedSong?.id === song.id) {
                                setSelectedSong(null);
                              }
                            }}
                            className="p-2 mr-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                  )}
                </div>

                {/* Slides Grid */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  {selectedSong ? (
                    <div className="grid grid-cols-3 gap-3">
                      {selectedSong.slides.map((slide, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedSlideIndex(index);
                            // Update preview with song slide
                            setPreviewVerse({
                              ref: selectedSong.title,
                              text: slide,
                            });
                          }}
                          className={`aspect-video rounded-lg border-2 p-3 text-left transition-all overflow-hidden relative ${
                            selectedSlideIndex === index
                              ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          {/* Theme Background Preview */}
                          {selectedTheme.type === "gradient" ? (
                            <div
                              className="absolute inset-0"
                              style={{ background: selectedTheme.url }}
                            />
                          ) : (
                            <div
                              className="absolute inset-0 bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${selectedTheme.url})`,
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/50" />
                          <div className="relative z-10">
                            <div className="text-[10px] text-gray-400 mb-1">
                              Slide {index + 1}
                            </div>
                            <p
                              className="text-xs leading-relaxed line-clamp-3"
                              style={{ color: textColor }}
                            >
                              {slide}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Music className="text-gray-600 mb-3" size={40} />
                      <p className="text-sm text-gray-500">
                        Select a song to view slides
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Song Modal */}
          {showAddSongModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white">Add New Song</h2>
                  <button
                    onClick={() => {
                      setShowAddSongModal(false);
                      setNewSongTitle("");
                      setNewSongArtist("");
                      setNewSongLyrics("");
                    }}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">
                      Song Title *
                    </label>
                    <input
                      type="text"
                      value={newSongTitle}
                      onChange={(e) => setNewSongTitle(e.target.value)}
                      placeholder="Enter song title..."
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">
                      Artist (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSongArtist}
                      onChange={(e) => setNewSongArtist(e.target.value)}
                      placeholder="Enter artist name..."
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">
                      Lyrics *
                    </label>
                    <textarea
                      value={newSongLyrics}
                      onChange={(e) => setNewSongLyrics(e.target.value)}
                      placeholder="Paste lyrics here...&#10;&#10;Separate verses with blank lines for automatic slide breaks."
                      rows={12}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50 resize-none"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">
                      Tip: Use blank lines between verses for cleaner slide
                      breaks
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAddSongModal(false);
                      setNewSongTitle("");
                      setNewSongArtist("");
                      setNewSongLyrics("");
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newSongTitle.trim() && newSongLyrics.trim()) {
                        const slides = parseLyricsToSlides(newSongLyrics);
                        const newSong: Song = {
                          id: `song-${Date.now()}`,
                          title: newSongTitle.trim(),
                          artist: newSongArtist.trim() || undefined,
                          slides,
                        };
                        setSongs((prev) => [...prev, newSong]);
                        setSelectedSong(newSong);
                        setSelectedSlideIndex(0);
                        setShowAddSongModal(false);
                        setNewSongTitle("");
                        setNewSongArtist("");
                        setNewSongLyrics("");
                      }
                    }}
                    disabled={!newSongTitle.trim() || !newSongLyrics.trim()}
                    className="px-6 py-2 bg-[#3E9B4F] hover:bg-[#4fb85f] disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    Add Song
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "presentations" && (
            <div className="flex-1 flex flex-col bg-[#0a0a0a]">
              {/* Presentations Header */}
              <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
                <span className="text-sm font-medium text-white">
                  Presentations
                </span>
                <div className="flex-1" />
                <button
                  onClick={async () => {
                    setIsImportingPresentation(true);
                    try {
                      const result = await window.api.importPresentation();
                      if (result.success && result.data) {
                        const newPres: Presentation = {
                          id: `pres-${Date.now()}`,
                          title: result.data.title,
                          slides: result.data.slides,
                        };
                        setPresentations((prev) => [...prev, newPres]);
                        setSelectedPresentation(newPres);
                        setSelectedPresentationSlide(0);
                      }
                    } catch (e) {
                      console.error("Import failed:", e);
                    } finally {
                      setIsImportingPresentation(false);
                    }
                  }}
                  disabled={isImportingPresentation}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3E9B4F] hover:bg-[#4fb85f] disabled:bg-gray-700 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {isImportingPresentation ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  Import PPTX
                </button>
              </div>

              {/* Presentation List + Slides View */}
              <div className="flex-1 flex min-h-0">
                {/* Presentation List */}
                <div className="w-64 border-r border-white/10 overflow-y-auto">
                  {presentations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <ImageIcon className="text-gray-600 mb-3" size={32} />
                      <p className="text-sm text-gray-500">
                        No presentations yet
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Click "Import PPTX" to get started
                      </p>
                    </div>
                  ) : (
                    presentations.map((pres) => (
                      <div
                        key={pres.id}
                        draggable
                        onDragStart={(e) => {
                          let itemsToDrag: ServiceItem[] = [];
                          if (selectedItems.has(pres.id)) {
                            itemsToDrag = presentations
                              .filter((p) => selectedItems.has(p.id))
                              .map((p) => ({
                                id: p.id,
                                type: "presentation",
                                title: p.title,
                                subtitle: `${p.slides.length} slides`,
                                data: p,
                              }));
                          } else {
                            itemsToDrag = [
                              {
                                id: pres.id,
                                type: "presentation",
                                title: pres.title,
                                subtitle: `${pres.slides.length} slides`,
                                data: pres,
                              },
                            ];
                          }
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify(itemsToDrag)
                          );
                        }}
                        className={`flex items-center border-b border-white/5 transition-colors ${
                          selectedItems.has(pres.id) ||
                          selectedPresentation?.id === pres.id
                            ? "bg-[#3E9B4F]/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            const allIds = presentations.map((p) => p.id);
                            const shouldPlay = handleMultiSelectClick(
                              pres.id,
                              allIds,
                              e
                            );
                            if (shouldPlay) {
                              setSelectedPresentation(pres);
                              setSelectedPresentationSlide(0);
                            }
                          }}
                          className={`flex-1 p-3 text-left ${
                            selectedItems.has(pres.id) ||
                            selectedPresentation?.id === pres.id
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          <div className="font-medium text-sm truncate">
                            {pres.title}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-1">
                            {pres.slides.length} slides
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPresentations((prev) =>
                              prev.filter((p) => p.id !== pres.id)
                            );
                            if (selectedPresentation?.id === pres.id) {
                              setSelectedPresentation(null);
                            }
                          }}
                          className="p-2 mr-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Slides Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedPresentation ? (
                    <div className="grid grid-cols-3 gap-3">
                      {selectedPresentation.slides.map((slide, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedPresentationSlide(index);
                            // Update preview with presentation slide image
                            setPreviewVerse({
                              ref: `${selectedPresentation.title} - Slide ${
                                index + 1
                              }`,
                              text: `[SLIDE:${slide}]`,
                            });
                          }}
                          className={`aspect-video rounded-lg border-2 overflow-hidden relative ${
                            selectedPresentationSlide === index
                              ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <img
                            src={`file://${slide}`}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1 rounded">
                            {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ImageIcon className="text-gray-600 mb-3" size={40} />
                      <p className="text-sm text-gray-500">
                        Select a presentation to view slides
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
