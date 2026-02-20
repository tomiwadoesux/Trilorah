import { create } from "zustand";

export type SlideTool =
  | "select"
  | "text"
  | "rect"
  | "circle"
  | "line"
  | "image";

export interface SelectedObjectProps {
  id?: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  textAlign?: string;
}

interface SlideEditorState {
  activeTool: SlideTool;
  activeSlideIndex: number;
  slidesJSON: string[]; // JSON string arrays for representing simple slides
  selectedObject: SelectedObjectProps | null;
  canvasBackgroundColor: string;

  setActiveTool: (tool: SlideTool) => void;
  setActiveSlideIndex: (index: number) => void;
  setSlidesJSON: (slides: string[]) => void;
  updateSlideJSON: (index: number, json: string) => void;
  addSlide: () => void;
  removeSlide: (index: number) => void;
  setSelectedObject: (obj: SelectedObjectProps | null) => void;
  setCanvasBackgroundColor: (color: string) => void;
}

export const useSlideEditorStore = create<SlideEditorState>((set, get) => ({
  activeTool: "select",
  activeSlideIndex: 0,
  slidesJSON: [""], // start with one blank slide
  selectedObject: null,
  canvasBackgroundColor: "#1a1a1a",

  setActiveTool: (activeTool) => set({ activeTool }),
  setActiveSlideIndex: (activeSlideIndex) => set({ activeSlideIndex }),
  setSlidesJSON: (slidesJSON) => set({ slidesJSON }),
  updateSlideJSON: (index, json) => {
    const newSlides = [...get().slidesJSON];
    newSlides[index] = json;
    set({ slidesJSON: newSlides });
  },
  addSlide: () => {
    const { slidesJSON } = get();
    set({
      slidesJSON: [...slidesJSON, ""],
      activeSlideIndex: slidesJSON.length,
    });
  },
  removeSlide: (index) => {
    const { slidesJSON, activeSlideIndex } = get();
    if (slidesJSON.length <= 1) return;
    const newSlides = slidesJSON.filter((_, i) => i !== index);
    const newIndex =
      activeSlideIndex >= index
        ? Math.max(0, activeSlideIndex - 1)
        : activeSlideIndex;
    set({ slidesJSON: newSlides, activeSlideIndex: newIndex });
  },
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  setCanvasBackgroundColor: (canvasBackgroundColor) =>
    set({ canvasBackgroundColor }),
}));
