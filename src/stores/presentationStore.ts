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
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentations: [],
  selectedPresentation: null,
  selectedPresentationSlide: 0,
  isImportingPresentation: false,

  setPresentations: (presentations) => set({ presentations }),
  addPresentation: (pres) =>
    set((state) => ({
      presentations: [...state.presentations, pres],
      selectedPresentation: pres,
      selectedPresentationSlide: 0,
    })),
  setSelectedPresentation: (selectedPresentation) =>
    set({ selectedPresentation }),
  setSelectedPresentationSlide: (selectedPresentationSlide) =>
    set({ selectedPresentationSlide }),
  setIsImportingPresentation: (isImportingPresentation) =>
    set({ isImportingPresentation }),
  deletePresentation: (id) =>
    set((state) => ({
      presentations: state.presentations.filter((p) => p.id !== id),
      selectedPresentation:
        state.selectedPresentation?.id === id
          ? null
          : state.selectedPresentation,
    })),

  importPresentation: async () => {
    set({ isImportingPresentation: true });
    try {
      const result = await window.api.importPresentation();
      if (result.success && result.data) {
        const newPres: Presentation = {
          id: `pres-${Date.now()}`,
          title: result.data.title,
          slides: result.data.slides,
        };
        get().addPresentation(newPres);
      }
    } catch (e) {
      console.error("Import failed:", e);
    } finally {
      set({ isImportingPresentation: false });
    }
  },
}));
