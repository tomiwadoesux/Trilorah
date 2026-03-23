import { create } from "zustand";
import type { DisplayVerse, Theme, LayoutPreset, TextStyle } from "../types";
import {
  DEFAULT_THEMES,
  LAYOUT_PRESETS,
  TEXT_STYLES,
} from "../utils/constants";

export type ActiveTab =
  | "scriptures"
  | "themes"
  | "songs"
  | "presentations"
  | "slideEditor"
  | "video";

interface AppState {
  mode: "worship" | "sermon" | "media";
  activeTab: ActiveTab;
  liveVerse: DisplayVerse;
  previewVerse: DisplayVerse;
  showLiveText: boolean;

  // Preview (editing) theme settings
  selectedTheme: Theme;
  customThemes: Theme[];
  selectedLayout: LayoutPreset;
  selectedTextStyle: TextStyle;
  fontSize: number;
  textColor: string;
  fontFamily: "serif" | "sans-serif";
  fontWeight: number;

  // Live theme settings (only updated on push)
  liveTheme: Theme;
  liveLayout: LayoutPreset;
  liveTextStyle: TextStyle;
  liveFontSize: number;
  liveTextColor: string;
  liveFontFamily: "serif" | "sans-serif";
  liveFontWeight: number;

  selectedVersion: string;
  showVersionDropdown: boolean;
  elapsedTime: number;

  // Actions
  setMode: (mode: "worship" | "sermon" | "media") => void;
  setActiveTab: (tab: ActiveTab) => void;
  setLiveVerse: (verse: DisplayVerse) => void;
  setPreviewVerse: (verse: DisplayVerse) => void;
  pushPreviewToLive: () => void;
  clearLiveText: () => void;
  setShowLiveText: (show: boolean) => void;
  setSelectedTheme: (theme: Theme) => void;
  addCustomTheme: (theme: Theme) => void;
  setSelectedLayout: (layout: LayoutPreset) => void;
  setSelectedTextStyle: (style: TextStyle) => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setFontFamily: (family: "serif" | "sans-serif") => void;
  setFontWeight: (weight: number) => void;
  setSelectedVersion: (version: string) => void;
  setShowVersionDropdown: (show: boolean) => void;
  setElapsedTime: (time: number) => void;
  incrementElapsedTime: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: "sermon",
  activeTab: "scriptures",
  liveVerse: { ref: "", text: "" },
  previewVerse: {
    ref: "Genesis 1:2",
    text: "And the earth was without form, and void...",
  },
  showLiveText: true,

  // Preview (editing) theme settings
  selectedTheme: DEFAULT_THEMES[0],
  customThemes: [],
  selectedLayout: LAYOUT_PRESETS[0],
  selectedTextStyle: TEXT_STYLES[0],
  fontSize: 1,
  textColor: "#ffffff",
  fontFamily: "serif",
  fontWeight: 400,

  // Live theme settings (start with same defaults)
  liveTheme: DEFAULT_THEMES[0],
  liveLayout: LAYOUT_PRESETS[0],
  liveTextStyle: TEXT_STYLES[0],
  liveFontSize: 1,
  liveTextColor: "#ffffff",
  liveFontFamily: "serif",
  liveFontWeight: 400,

  selectedVersion: "KJV",
  showVersionDropdown: false,
  elapsedTime: 0,

  setMode: (mode) => set({ mode }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLiveVerse: (liveVerse) => set({ liveVerse }),
  setPreviewVerse: (previewVerse) => set({ previewVerse }),
  pushPreviewToLive: () => {
    const s = get();
    set({
      liveVerse: s.previewVerse,
      showLiveText: true,
      liveTheme: s.selectedTheme,
      liveLayout: s.selectedLayout,
      liveTextStyle: s.selectedTextStyle,
      liveFontSize: s.fontSize,
      liveTextColor: s.textColor,
      liveFontFamily: s.fontFamily,
      liveFontWeight: s.fontWeight,
    });
    window.api?.pushToLive();
  },
  clearLiveText: () => set({ showLiveText: false }),
  setShowLiveText: (showLiveText) => set({ showLiveText }),
  setSelectedTheme: (selectedTheme) => set({ selectedTheme }),
  addCustomTheme: (theme) =>
    set((state) => ({
      customThemes: [...state.customThemes, theme],
      selectedTheme: theme,
    })),
  setSelectedLayout: (selectedLayout) => set({ selectedLayout }),
  setSelectedTextStyle: (selectedTextStyle) => set({ selectedTextStyle }),
  setFontSize: (fontSize) => set({ fontSize }),
  setTextColor: (textColor) => set({ textColor }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontWeight: (fontWeight) => set({ fontWeight }),
  setSelectedVersion: (selectedVersion) => set({ selectedVersion }),
  setShowVersionDropdown: (showVersionDropdown) => set({ showVersionDropdown }),
  setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  incrementElapsedTime: () =>
    set((state) => ({ elapsedTime: state.elapsedTime + 1 })),
}));
