import { create } from "zustand";
import type { Presentation } from "../types";

interface PresentationState {
  presentations: Presentation[];
  selectedPresentation: Presentation | null;
  selectedPresentationSlide: number;
  isImportingPresentation: boolean;

  // Actions
  setPresentations: (presentations: Presentation[]) => void;
  addPresentation: (pres: Presentation) => void;
  setSelectedPresentation: (pres: Presentation | null) => void;
  setSelectedPresentationSlide: (index: number) => void;
  setIsImportingPresentation: (importing: boolean) => void;
  deletePresentation: (id: string) => void;
  importPresentation: () => Promise<void>;
  loadPresentations: () => Promise<void>;
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentations: [],
  selectedPresentation: null,
  selectedPresentationSlide: 0,
  isImportingPresentation: false,

  setPresentations: (presentations) => set({ presentations }),
  addPresentation: (pres) => {
    set((state) => ({
      presentations: [...state.presentations, pres],
      selectedPresentation: pres,
      selectedPresentationSlide: 0,
    }));
    window.api?.savePresentations(get().presentations);
  },
  setSelectedPresentation: (selectedPresentation) =>
    set({ selectedPresentation }),
  setSelectedPresentationSlide: (selectedPresentationSlide) =>
    set({ selectedPresentationSlide }),
  setIsImportingPresentation: (isImportingPresentation) =>
    set({ isImportingPresentation }),
  deletePresentation: (id) => {
    const pres = get().presentations.find((p) => p.id === id);
    set((state) => ({
      presentations: state.presentations.filter((p) => p.id !== id),
      selectedPresentation:
        state.selectedPresentation?.id === id
          ? null
          : state.selectedPresentation,
    }));
    // Clean up files on disk
    if (pres) {
      window.api?.deletePresentation({
        slides: pres.slides,
        sourcePptx: pres.sourcePptx,
      });
    }
    window.api?.savePresentations(get().presentations);
  },

  importPresentation: async () => {
    set({ isImportingPresentation: true });
    try {
      const result = await window.api.importPresentation();
      if (result.success && result.data) {
        const newPres: Presentation = {
          id: `pres-${Date.now()}`,
          title: result.data.title,
          slides: result.data.slides,
          sourcePptx: result.data.pptxPath,
        };
        get().addPresentation(newPres);
      }
    } catch (e) {
      console.error("Import failed:", e);
    } finally {
      set({ isImportingPresentation: false });
    }
  },

  loadPresentations: async () => {
    try {
      const saved = await window.api?.loadPresentations();
      if (Array.isArray(saved) && saved.length > 0) {
        set({ presentations: saved });
      }
    } catch (e) {
      console.error("Failed to load presentations:", e);
    }
  },
}));
