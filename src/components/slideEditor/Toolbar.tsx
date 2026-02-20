import React from "react";
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  ImageIcon,
} from "lucide-react";
import { useSlideEditorStore } from "../../stores/slideEditorStore";
import type { SlideTool } from "../../stores/slideEditorStore";

export default function Toolbar() {
  const { activeTool, setActiveTool } = useSlideEditorStore();

  const tools: { id: SlideTool; label: string; icon: React.ElementType }[] = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "text", label: "Text", icon: Type },
    { id: "rect", label: "Rectangle", icon: Square },
    { id: "circle", label: "Circle", icon: Circle },
    { id: "line", label: "Line", icon: Minus },
    { id: "image", label: "Image", icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#111] border-r border-[#222]">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
              activeTool === tool.id
                ? "bg-[#3E9B4F] text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title={tool.label}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}
