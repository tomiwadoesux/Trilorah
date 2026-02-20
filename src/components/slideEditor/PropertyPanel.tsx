import { useSlideEditorStore } from "../../stores/slideEditorStore";
import type { SelectedObjectProps } from "../../stores/slideEditorStore";

interface PropertyPanelProps {
  onPropertyChange: (key: string, value: any) => void;
  onCanvasColorChange: (color: string) => void;
  onDeleteLayer: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export default function PropertyPanel({
  onPropertyChange,
  onCanvasColorChange,
  onDeleteLayer,
  onBringForward,
  onSendBackward,
}: PropertyPanelProps) {
  const { selectedObject, canvasBackgroundColor } = useSlideEditorStore();

  if (!selectedObject) {
    return (
      <div className="w-64 bg-[#111] border-l border-[#222] p-4 flex flex-col gap-4 text-sm text-gray-300">
        <h3 className="font-semibold text-white tracking-wide uppercase text-xs">
          Slide Properties
        </h3>

        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={canvasBackgroundColor}
              onChange={(e) => onCanvasColorChange(e.target.value)}
              className="w-8 h-8 rounded shrink-0 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={canvasBackgroundColor}
              onChange={(e) => onCanvasColorChange(e.target.value)}
              className="flex-1 bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
            />
          </div>
        </div>
      </div>
    );
  }

  const handleNumChange = (key: keyof SelectedObjectProps, val: string) => {
    onPropertyChange(key, parseFloat(val) || 0);
  };

  const handleChange = (key: keyof SelectedObjectProps, val: string) => {
    onPropertyChange(key, val);
  };

  return (
    <div className="w-64 bg-[#111] border-l border-[#222] p-4 flex flex-col gap-4 text-sm text-gray-300 overflow-y-auto">
      <h3 className="font-semibold text-white tracking-wide uppercase text-xs">
        Object Properties
      </h3>
      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {selectedObject.type}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            Width
          </label>
          <input
            type="number"
            value={Math.round(selectedObject.width * selectedObject.scaleX)}
            onChange={(e) => handleNumChange("width", e.target.value)}
            className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
            disabled={selectedObject.type === "i-text"}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            Height
          </label>
          <input
            type="number"
            value={Math.round(selectedObject.height * selectedObject.scaleY)}
            onChange={(e) => handleNumChange("height", e.target.value)}
            className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
            disabled={selectedObject.type === "i-text"}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            X Pos
          </label>
          <input
            type="number"
            value={Math.round(selectedObject.left)}
            onChange={(e) => handleNumChange("left", e.target.value)}
            className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            Y Pos
          </label>
          <input
            type="number"
            value={Math.round(selectedObject.top)}
            onChange={(e) => handleNumChange("top", e.target.value)}
            className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase text-gray-500 mb-1">
          Opacity
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={selectedObject.opacity}
          onChange={(e) => handleNumChange("opacity", e.target.value)}
          className="w-full accent-[#3E9B4F]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            Fill
          </label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={selectedObject.fill}
              onChange={(e) => handleChange("fill", e.target.value)}
              className="w-6 h-6 rounded shrink-0 bg-transparent cursor-pointer"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            Stroke
          </label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={selectedObject.stroke || "#000000"}
              onChange={(e) => handleChange("stroke", e.target.value)}
              className="w-6 h-6 rounded shrink-0 bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </div>

      {selectedObject.type === "i-text" && (
        <div className="flex flex-col gap-3 pt-3 border-t border-[#333]">
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1">
              Font Family
            </label>
            <select
              value={selectedObject.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
            >
              <option value="Arial">Arial</option>
              <option value="sans-serif">Sans-serif</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1">
              Font Size
            </label>
            <input
              type="number"
              value={selectedObject.fontSize}
              onChange={(e) => handleNumChange("fontSize", e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1">
              Text Align
            </label>
            <select
              value={selectedObject.textAlign}
              onChange={(e) => handleChange("textAlign", e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded px-2 py-1 outline-none focus:border-[#3E9B4F]"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        </div>
      )}

      {/* Layer Actions */}
      <div className="pt-3 border-t border-[#333] flex flex-col gap-2">
        <label className="block text-[10px] uppercase text-gray-500 mb-1">
          Layer Ordering
        </label>
        <div className="flex gap-2">
          <button
            onClick={onBringForward}
            className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] rounded py-1 text-xs"
          >
            Forward
          </button>
          <button
            onClick={onSendBackward}
            className="flex-1 bg-[#222] hover:bg-[#333] border border-[#444] rounded py-1 text-xs"
          >
            Backward
          </button>
        </div>
        <button
          onClick={onDeleteLayer}
          className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded py-1 text-xs mt-2"
        >
          Delete Object
        </button>
      </div>
    </div>
  );
}
