import { Plus, Trash2 } from "lucide-react";
import { useSlideEditorStore } from "../../stores/slideEditorStore";

export default function SlideStrip() {
  const {
    slidesJSON,
    activeSlideIndex,
    setActiveSlideIndex,
    addSlide,
    removeSlide,
  } = useSlideEditorStore();

  return (
    <div className="h-32 bg-[#0a0a0a] border-t border-[#222] flex p-2 gap-2 overflow-x-auto">
      {slidesJSON.map((_, i) => (
        <div
          key={i}
          className={`shrink-0 w-40 h-full border-2 rounded-lg relative group cursor-pointer overflow-hidden ${
            activeSlideIndex === i
              ? "border-[#3E9B4F]"
              : "border-[#333] hover:border-[#555]"
          }`}
          onClick={() => setActiveSlideIndex(i)}
        >
          {/* We could render a mini canvas here, but reading JSON and rendering is heavy. Just standard box for now */}
          <div className="absolute inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center text-xs text-gray-500 font-mono">
            Slide {i + 1}
          </div>
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSlide(i);
              }}
              className="p-1 bg-black/50 hover:bg-red-500/50 rounded"
              title="Delete Slide"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addSlide}
        className="shrink-0 w-24 h-full border-2 border-dashed border-[#333] hover:border-[#3E9B4F] rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-[#3E9B4F] transition-colors"
      >
        <Plus size={24} />
        <span className="text-xs mt-1">Add Slide</span>
      </button>
    </div>
  );
}
