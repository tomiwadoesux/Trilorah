import { useRef, useCallback, useState } from "react";
import PreviewMonitor from "./PreviewMonitor";
import LiveMonitor from "./LiveMonitor";
import { useAppStore } from "../../stores/appStore";

interface MonitorBarProps {
  startWhisperRecording: () => void;
  stopWhisperRecording: () => void;
}

export default function MonitorBar({
  startWhisperRecording,
  stopWhisperRecording,
}: MonitorBarProps) {
  const { activeTab } = useAppStore();
  const [heightPct, setHeightPct] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const pct = ((ev.clientY - parentRect.top) / parentRect.height) * 100;
      setHeightPct(Math.min(85, Math.max(25, pct)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#050505] flex flex-col" style={{ height: `${heightPct}%` }}>
      <div className="flex-1 p-6 flex gap-6 min-h-0">
        {activeTab === "themes" && <PreviewMonitor />}
        <LiveMonitor
          startWhisperRecording={startWhisperRecording}
          stopWhisperRecording={stopWhisperRecording}
        />
      </div>
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="h-1.5 cursor-row-resize flex-shrink-0 group relative border-b border-white/10"
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-1 rounded-full bg-white/20 group-hover:bg-[#3E9B4F]/60 transition-colors" />
      </div>
    </div>
  );
}
