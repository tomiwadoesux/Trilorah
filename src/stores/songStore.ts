import { create } from "zustand";
import type { Song } from "../types";
import { parseLyricsToSlides } from "../utils/parseLyricsToSlides";

interface SongState {
  songs: Song[];
  selectedSong: Song | null;
  selectedSlideIndex: number;
  showAddSongModal: boolean;
  songSearchInput: string;
  listeningMode: "scripture" | "lyrics";
  slidePhase: "start" | "middle" | "end";
  isAutoAdvancing: boolean;
  newSongTitle: string;
  newSongArtist: string;
  newSongLyrics: string;

  // Actions
  setSongs: (songs: Song[]) => void;
  setSelectedSong: (song: Song | null) => void;
  setSelectedSlideIndex: (index: number) => void;
  setShowAddSongModal: (show: boolean) => void;
  setSongSearchInput: (input: string) => void;
  setListeningMode: (mode: "scripture" | "lyrics") => void;
  setSlidePhase: (phase: "start" | "middle" | "end") => void;
  setIsAutoAdvancing: (advancing: boolean) => void;
  setNewSongTitle: (title: string) => void;
  setNewSongArtist: (artist: string) => void;
  setNewSongLyrics: (lyrics: string) => void;
  addSong: () => void;
  deleteSong: (id: string) => void;
  clearModal: () => void;
}

export const useSongStore = create<SongState>((set, get) => ({
  songs: [],
  selectedSong: null,
  selectedSlideIndex: 0,
  showAddSongModal: false,
  songSearchInput: "",
  listeningMode: "scripture",
  slidePhase: "start",
  isAutoAdvancing: false,
  newSongTitle: "",
  newSongArtist: "",
  newSongLyrics: "",

  setSongs: (songs) => set({ songs }),
  setSelectedSong: (selectedSong) => set({ selectedSong }),
  setSelectedSlideIndex: (selectedSlideIndex) => set({ selectedSlideIndex }),
  setShowAddSongModal: (showAddSongModal) => set({ showAddSongModal }),
  setSongSearchInput: (songSearchInput) => set({ songSearchInput }),
  setListeningMode: (listeningMode) => set({ listeningMode }),
  setSlidePhase: (slidePhase) => set({ slidePhase }),
  setIsAutoAdvancing: (isAutoAdvancing) => set({ isAutoAdvancing }),
  setNewSongTitle: (newSongTitle) => set({ newSongTitle }),
  setNewSongArtist: (newSongArtist) => set({ newSongArtist }),
  setNewSongLyrics: (newSongLyrics) => set({ newSongLyrics }),

  addSong: () => {
    const { newSongTitle, newSongArtist, newSongLyrics } = get();
    if (newSongTitle.trim() && newSongLyrics.trim()) {
      const slides = parseLyricsToSlides(newSongLyrics);
      const newSong: Song = {
        id: `song-${Date.now()}`,
        title: newSongTitle.trim(),
        artist: newSongArtist.trim() || undefined,
        slides,
      };
      set((state) => ({
        songs: [...state.songs, newSong],
        selectedSong: newSong,
        selectedSlideIndex: 0,
        showAddSongModal: false,
        newSongTitle: "",
        newSongArtist: "",
        newSongLyrics: "",
      }));
    }
  },

  deleteSong: (id) => {
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== id),
      selectedSong:
        state.selectedSong?.id === id ? null : state.selectedSong,
    }));
  },

  clearModal: () => {
    set({
      showAddSongModal: false,
      newSongTitle: "",
      newSongArtist: "",
      newSongLyrics: "",
    });
  },
}));
