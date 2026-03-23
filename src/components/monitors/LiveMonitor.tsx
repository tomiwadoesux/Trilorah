import { useRef, useCallback, useState } from "react";
import {
  Mic,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useSongStore } from "../../stores/songStore";
import { useAsrStore } from "../../stores/asrStore";
import OutputPanel from "../OutputPanel";

interface LiveMonitorProps {
  startWhisperRecording: () => void;
  stopWhisperRecording: () => void;
}

export default function LiveMonitor({
  startWhisperRecording,
  stopWhisperRecording,
}: LiveMonitorProps) {
  const {
    liveVerse,
    showLiveText,
    liveTheme,
    liveTextStyle,
    liveLayout,
    liveFontSize,
    liveTextColor,
    liveFontFamily,
    liveFontWeight,
    selectedVersion,
    activeTab,
    setPreviewVerse,
    setLiveVerse,
    setShowLiveText,
  } = useAppStore();

  const {
    selectedSong,
    selectedSlideIndex,
    setSelectedSlideIndex,
    listeningMode,
    setListeningMode,
    isAutoAdvancing,
    slidePhase,
  } = useSongStore();

  const { isListening, setIsListening } = useAsrStore();

  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />{" "}
          Live Output
        </span>
      </div>
      <div className="flex-1 bg-black rounded-lg border border-red-500/30 relative overflow-hidden">
        <OutputPanel
          verse={liveVerse}
          theme={liveTheme}
          textStyle={liveTextStyle}
          layout={liveLayout}
          fontSize={liveFontSize}
          textColor={liveTextColor}
          fontFamily={liveFontFamily}
          fontWeight={liveFontWeight}
          showText={showLiveText}
          selectedVersion={selectedVersion}
          isLive={true}
        />

        {/* 16:9 mini output monitor — draggable, hidden on themes tab */}
        {activeTab !== "themes" && (
          <MiniOutputMonitor
            liveVerse={liveVerse}
            liveTheme={liveTheme}
            liveTextStyle={liveTextStyle}
            liveLayout={liveLayout}
            liveFontSize={liveFontSize}
            liveTextColor={liveTextColor}
            liveFontFamily={liveFontFamily}
            liveFontWeight={liveFontWeight}
            showLiveText={showLiveText}
            selectedVersion={selectedVersion}
          />
        )}
      </div>

      {/* Song Slide Navigation - only when in Songs tab */}
      {activeTab === "songs" && selectedSong && (
        <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-[#0a0a0a] via-[#151515] to-[#0a0a0a] border-t border-[#3E9B4F]/20">
          <button
            onClick={() => {
              if (isListening && listeningMode === "lyrics") {
                setIsListening(false);
                stopWhisperRecording();
              } else {
                setListeningMode("lyrics");
                setIsListening(true);
                startWhisperRecording();
              }
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all mr-2 ${
              isListening && listeningMode === "lyrics"
                ? "bg-red-500/20 border-red-500/50 text-red-500 animate-pulse"
                : "bg-[#3E9B4F]/10 border-[#3E9B4F]/30 text-[#3E9B4F] hover:bg-[#3E9B4F]/20"
            }`}
            title={
              isListening && listeningMode === "lyrics"
                ? "Stop Lyric Listening"
                : "Start Lyric Listening"
            }
          >
            {isListening && listeningMode === "lyrics" ? (
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
            ) : (
              <Mic size={18} />
            )}
          </button>

          <button
            onClick={() => {
              const newIndex = Math.max(0, selectedSlideIndex - 1);
              setSelectedSlideIndex(newIndex);
              const newVerse = {
                ref: selectedSong.title,
                text: selectedSong.slides[newIndex],
              };
              setPreviewVerse(newVerse);
              setLiveVerse(newVerse);
              setShowLiveText(true);
            }}
            disabled={selectedSlideIndex === 0}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#3E9B4F]/20 hover:bg-[#3E9B4F]/40 border border-[#3E9B4F]/30 disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} className="text-[#3E9B4F]" />
          </button>
          <div className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full bg-[#3E9B4F]/10 border border-[#3E9B4F]/20 min-w-[100px]">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-[#3E9B4F]">
                {selectedSlideIndex + 1}
              </span>
              <span className="text-xs text-gray-500">/</span>
              <span className="text-sm text-gray-400">
                {selectedSong.slides.length}
              </span>
            </div>
            {isListening && listeningMode === "lyrics" && (
              <span
                className={`text-[9px] font-mono tracking-wider ${
                  isAutoAdvancing
                    ? "text-white animate-pulse"
                    : "text-[#3E9B4F]/70"
                }`}
              >
                {isAutoAdvancing
                  ? "ADVANCING..."
                  : `LISTENING (${slidePhase.toUpperCase()})`}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              const newIndex = Math.min(
                selectedSong.slides.length - 1,
                selectedSlideIndex + 1,
              );
              setSelectedSlideIndex(newIndex);
              const newVerse = {
                ref: selectedSong.title,
                text: selectedSong.slides[newIndex],
              };
              setPreviewVerse(newVerse);
              setLiveVerse(newVerse);
              setShowLiveText(true);
            }}
            disabled={selectedSlideIndex === selectedSong.slides.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#3E9B4F]/20 hover:bg-[#3E9B4F]/40 border border-[#3E9B4F]/30 disabled:opacity-30 disabled:border-white/10 disabled:bg-white/5 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} className="text-[#3E9B4F]" />
          </button>
        </div>
      )}
    </div>
  );
}

function MiniOutputMonitor({
  liveVerse,
  liveTheme,
  liveTextStyle,
  liveLayout,
  liveFontSize,
  liveTextColor,
  liveFontFamily,
  liveFontWeight,
  showLiveText,
  selectedVersion,
}: any) {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const rect = dragRef.current!.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const parent = dragRef.current!.offsetParent as HTMLElement;
    const parentRect = parent.getBoundingClientRect();

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const x = ev.clientX - parentRect.left - offsetRef.current.x;
      const y = ev.clientY - parentRect.top - offsetRef.current.y;
      const maxX = parentRect.width - (dragRef.current?.offsetWidth || 260);
      const maxY = parentRect.height - (dragRef.current?.offsetHeight || 150);
      setPos({
        x: Math.min(Math.max(0, x), maxX),
        y: Math.min(Math.max(0, y), maxY),
      });
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const style: React.CSSProperties =
    pos.x === -1
      ? { position: "absolute", top: 8, right: 8 }
      : { position: "absolute", left: pos.x, top: pos.y };

  return (
    <div
      ref={dragRef}
      onMouseDown={onMouseDown}
      className="z-20 w-[260px] rounded-md overflow-hidden border border-white/20 shadow-xl shadow-black/50 cursor-grab active:cursor-grabbing"
      style={style}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <OutputPanel
          verse={liveVerse}
          theme={liveTheme}
          textStyle={liveTextStyle}
          layout={liveLayout}
          fontSize={liveFontSize * 0.32}
          textColor={liveTextColor}
          fontFamily={liveFontFamily}
          fontWeight={liveFontWeight}
          showText={showLiveText}
          selectedVersion={selectedVersion}
          isLive={true}
        />
      </div>
    </div>
  );
}
