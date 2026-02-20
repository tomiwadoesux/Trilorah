import { create } from "zustand";
import type { VerseData } from "../types";
import { BOOK_NAMES } from "../utils/constants";
import { useAppStore } from "./appStore";

interface ScriptureState {
  currentBook: number;
  currentChapter: number;
  chapterVerses: VerseData[];
  selectedDeckId: number;
  isLoading: boolean;
  history: { ref: string; text: string }[];
  selectedBook: { id: number; name: string } | null;
  selectedChapterNum: number | null;
  searchInput: string;
  showSuggestions: boolean;
  selectedSuggestion: number;

  // Actions
  setCurrentBook: (book: number) => void;
  setCurrentChapter: (chapter: number) => void;
  setChapterVerses: (verses: VerseData[]) => void;
  setSelectedDeckId: (id: number) => void;
  setIsLoading: (loading: boolean) => void;
  addToHistory: (ref: string, text: string) => void;
  setSelectedBook: (book: { id: number; name: string } | null) => void;
  setSelectedChapterNum: (num: number | null) => void;
  setSearchInput: (input: string) => void;
  setShowSuggestions: (show: boolean) => void;
  setSelectedSuggestion: (index: number) => void;

  // Computed-like helpers
  getSearchStep: () => "book" | "chapter" | "verse";
  getSuggestions: () => { value: string | number; label: string }[];
  handleSelectSuggestion: (value: string | number) => void;
  handleBackspace: () => void;
  clearSearch: () => void;
}

export const useScriptureStore = create<ScriptureState>((set, get) => ({
  currentBook: 0,
  currentChapter: 1,
  chapterVerses: [],
  selectedDeckId: 1,
  isLoading: true,
  history: [],
  selectedBook: null,
  selectedChapterNum: null,
  searchInput: "",
  showSuggestions: false,
  selectedSuggestion: 0,

  setCurrentBook: (currentBook) => set({ currentBook }),
  setCurrentChapter: (currentChapter) => set({ currentChapter }),
  setChapterVerses: (chapterVerses) => set({ chapterVerses }),
  setSelectedDeckId: (selectedDeckId) => set({ selectedDeckId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  addToHistory: (ref, text) =>
    set((state) => ({
      history: [{ ref, text }, ...state.history.slice(0, 9)],
    })),
  setSelectedBook: (selectedBook) => set({ selectedBook }),
  setSelectedChapterNum: (selectedChapterNum) => set({ selectedChapterNum }),
  setSearchInput: (searchInput) => set({ searchInput }),
  setShowSuggestions: (showSuggestions) => set({ showSuggestions }),
  setSelectedSuggestion: (selectedSuggestion) => set({ selectedSuggestion }),

  getSearchStep: () => {
    const { selectedBook, selectedChapterNum } = get();
    if (!selectedBook) return "book";
    if (!selectedChapterNum) return "chapter";
    return "verse";
  },

  getSuggestions: () => {
    const { selectedBook, selectedChapterNum, searchInput } = get();
    const searchStep = get().getSearchStep();
    const query = searchInput.toLowerCase().trim();

    if (searchStep === "book") {
      return Object.entries(BOOK_NAMES)
        .filter(
          ([_, name]) => name.toLowerCase().startsWith(query) || query === ""
        )
        .slice(0, 8)
        .map(([id, name]) => ({ value: parseInt(id), label: name }));
    } else if (searchStep === "chapter") {
      const maxChapters = selectedBook?.id === 18 ? 150 : 50;
      const chapters = Array.from({ length: maxChapters }, (_, i) => i + 1);
      return chapters
        .filter((ch) => query === "" || ch.toString().startsWith(query))
        .slice(0, 10)
        .map((ch) => ({ value: ch, label: `Chapter ${ch}` }));
    } else {
      const maxVerses = 40;
      const verses = Array.from({ length: maxVerses }, (_, i) => i + 1);
      return verses
        .filter((v) => query === "" || v.toString().startsWith(query))
        .slice(0, 10)
        .map((v) => ({ value: v, label: `Verse ${v}` }));
    }
  },

  handleSelectSuggestion: (value) => {
    const searchStep = get().getSearchStep();
    const { selectedBook, selectedChapterNum } = get();
    const appStore = useAppStore.getState();

    if (searchStep === "book") {
      const bookName = BOOK_NAMES[value as number];
      set({
        selectedBook: { id: value as number, name: bookName },
        searchInput: "",
        selectedSuggestion: 0,
      });
    } else if (searchStep === "chapter") {
      set({
        selectedChapterNum: value as number,
        searchInput: "",
        selectedSuggestion: 0,
      });
    } else {
      // Verse selected - perform the search and push to live
      const verseNum = value as number;
      if (selectedBook && selectedChapterNum) {
        const bookName = selectedBook.name;
        const chapter = selectedChapterNum;
        const ref = `${bookName} ${chapter}:${verseNum}`;

        set({
          currentBook: selectedBook.id,
          currentChapter: chapter,
          selectedDeckId: verseNum,
          showSuggestions: false,
          selectedBook: null,
          selectedChapterNum: null,
          searchInput: "",
        });

        const verseData = { ref, text: "Loading..." };
        appStore.setPreviewVerse(verseData);
        appStore.setLiveVerse(verseData);

        // Add to history
        get().addToHistory(ref, "Selected from search");
      }
    }
  },

  handleBackspace: () => {
    const { searchInput, selectedChapterNum, selectedBook } = get();
    if (searchInput === "") {
      if (selectedChapterNum !== null) {
        set({ selectedChapterNum: null });
      } else if (selectedBook !== null) {
        set({ selectedBook: null });
      }
    }
  },

  clearSearch: () => {
    set({
      selectedBook: null,
      selectedChapterNum: null,
      searchInput: "",
    });
  },
}));
