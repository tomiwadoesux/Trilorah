import { create } from "zustand";
import type {
  ServiceItem,
  Song,
  Theme,
  Presentation,
  VerseData,
} from "../types";
import { useAppStore } from "./appStore";
import { useSongStore } from "./songStore";
import { usePresentationStore } from "./presentationStore";

interface ServiceFlowState {
  serviceFlow: ServiceItem[];
  draggedItem: ServiceItem | null;
  selectedItems: Set<string>;
  lastSelectedId: string | null;
  expandedItems: Set<string>;

  // Actions
  setServiceFlow: (
    flow: ServiceItem[] | ((prev: ServiceItem[]) => ServiceItem[]),
  ) => void;
  setDraggedItem: (item: ServiceItem | null) => void;
  setSelectedItems: (
    items: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  setLastSelectedId: (id: string | null) => void;
  addToFlow: (items: ServiceItem[]) => void;
  removeFromFlow: (id: string) => void;
  clearSelection: () => void;
  handleMultiSelectClick: (
    id: string,
    allIds: string[],
    e: React.MouseEvent,
  ) => boolean;
  playFlowItem: (item: ServiceItem) => void;
  updateNoteInFlow: (id: string, newText: string) => void;
  moveItemUp: (id: string) => void;
  moveItemDown: (id: string) => void;
  duplicateItem: (id: string) => void;
  toggleItemExpanded: (id: string) => void;
  setAllExpanded: (expanded: boolean) => void;
}

export const useServiceFlowStore = create<ServiceFlowState>((set, get) => ({
  serviceFlow: [],
  draggedItem: null,
  selectedItems: new Set(),
  lastSelectedId: null,
  expandedItems: new Set(),

  setServiceFlow: (flowOrFn) =>
    set((state) => ({
      serviceFlow:
        typeof flowOrFn === "function" ? flowOrFn(state.serviceFlow) : flowOrFn,
    })),
  setDraggedItem: (draggedItem) => set({ draggedItem }),
  setSelectedItems: (itemsOrFn) =>
    set((state) => ({
      selectedItems:
        typeof itemsOrFn === "function"
          ? itemsOrFn(state.selectedItems)
          : itemsOrFn,
    })),
  setLastSelectedId: (lastSelectedId) => set({ lastSelectedId }),

  addToFlow: (items) =>
    set((state) => ({ serviceFlow: [...state.serviceFlow, ...items] })),

  removeFromFlow: (id) =>
    set((state) => ({
      serviceFlow: state.serviceFlow.filter((item) => item.id !== id),
    })),

  clearSelection: () => set({ selectedItems: new Set(), lastSelectedId: null }),

  handleMultiSelectClick: (id, allIds, e) => {
    const { lastSelectedId } = get();

    if (e.ctrlKey || e.metaKey) {
      set((state) => {
        const next = new Set(state.selectedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedItems: next, lastSelectedId: id };
      });
      return false;
    } else if (e.shiftKey && lastSelectedId) {
      const start = allIds.indexOf(lastSelectedId);
      const end = allIds.indexOf(id);
      if (start !== -1 && end !== -1) {
        const low = Math.min(start, end);
        const high = Math.max(start, end);
        const range = allIds.slice(low, high + 1);
        set((state) => {
          const next = new Set(state.selectedItems);
          range.forEach((r) => next.add(r));
          return { selectedItems: next };
        });
      }
      return false;
    } else {
      set({ selectedItems: new Set([id]), lastSelectedId: id });
      return true;
    }
  },

  playFlowItem: (item) => {
    if (item.type === "note") return;
    const appStore = useAppStore.getState();
    const songStore = useSongStore.getState();
    const presStore = usePresentationStore.getState();

    if (item.type === "scripture") {
      const verse = item.data as VerseData;
      if (verse) {
        appStore.setPreviewVerse({ ref: verse.ref, text: verse.text });
        appStore.setLiveVerse({ ref: verse.ref, text: verse.text });
      }
    } else if (item.type === "song") {
      const song = item.data as Song;
      songStore.setSelectedSong(song);
      appStore.setActiveTab("songs");
      songStore.setSelectedSlideIndex(0);
      if (song.slides.length > 0) {
        const slide = { ref: song.title, text: song.slides[0] };
        appStore.setPreviewVerse(slide);
        appStore.setLiveVerse(slide);
      }
    } else if (item.type === "theme") {
      appStore.setSelectedTheme(item.data as Theme);
    } else if (item.type === "presentation") {
      const pres = item.data as Presentation;
      presStore.setSelectedPresentation(pres);
      appStore.setActiveTab("presentations");
      presStore.setSelectedPresentationSlide(0);
      if (pres.slides.length > 0) {
        const firstSlide = {
          ref: `${pres.title} - Slide 1`,
          text: `[SLIDE:${pres.slides[0]}]`,
        };
        appStore.setPreviewVerse(firstSlide);
        appStore.setLiveVerse(firstSlide);
        appStore.setShowLiveText(true);
      }
    }
  },

  updateNoteInFlow: (id, newText) =>
    set((state) => ({
      serviceFlow: state.serviceFlow.map((i) =>
        i.id === id
          ? { ...i, subtitle: newText, data: { ...i.data, text: newText } }
          : i,
      ),
    })),

  moveItemUp: (id) =>
    set((state) => {
      const index = state.serviceFlow.findIndex((i) => i.id === id);
      if (index <= 0) return state;
      const newFlow = [...state.serviceFlow];
      const temp = newFlow[index - 1];
      newFlow[index - 1] = newFlow[index];
      newFlow[index] = temp;
      return { serviceFlow: newFlow };
    }),

  moveItemDown: (id) =>
    set((state) => {
      const index = state.serviceFlow.findIndex((i) => i.id === id);
      if (index === -1 || index === state.serviceFlow.length - 1) return state;
      const newFlow = [...state.serviceFlow];
      const temp = newFlow[index + 1];
      newFlow[index + 1] = newFlow[index];
      newFlow[index] = temp;
      return { serviceFlow: newFlow };
    }),

  duplicateItem: (id) =>
    set((state) => {
      const index = state.serviceFlow.findIndex((i) => i.id === id);
      if (index === -1) return state;
      const original = state.serviceFlow[index];
      const duplicate: ServiceItem = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title} (Copy)`,
      };
      const newFlow = [...state.serviceFlow];
      newFlow.splice(index + 1, 0, duplicate);
      return { serviceFlow: newFlow };
    }),

  toggleItemExpanded: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedItems);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedItems: newExpanded };
    }),

  setAllExpanded: (expanded) =>
    set((state) => {
      if (!expanded) return { expandedItems: new Set() };
      return {
        expandedItems: new Set(state.serviceFlow.map((i) => i.id)),
      };
    }),
}));
