import {
  Monitor,
  Mic,
  ChevronLeft,
  ChevronRight,
  MonitorUp,
  MonitorOff,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useSongStore } from "../../stores/songStore";
import { useAsrStore } from "../../stores/asrStore";
import OutputPanel from "../OutputPanel";

interface PreviewMonitorProps {
  startWhisperRecording: () => void;
  stopWhisperRecording: () => void;
}

export default function PreviewMonitor({
  startWhisperRecording,
  stopWhisperRecording,
}: PreviewMonitorProps) {
  const {
    previewVerse,
    selectedTheme,
    selectedTextStyle,
    selectedLayout,
    fontSize,
    textColor,
    selectedVersion,
    activeTab,
    setPreviewVerse,
    setLiveVerse,
    setShowLiveText,
    pushPreviewToLive,
    clearLiveText,
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
        <span className="text-[10px] font-bold text-[#3E9B4F] uppercase tracking-wider flex items-center gap-2">
          <Monitor size={12} /> Preview
        </span>
      </div>
      <div className="flex-1 bg-black rounded-lg border border-[#3E9B4F]/30 relative overflow-hidden">
        <OutputPanel
          verse={previewVerse}
          theme={selectedTheme}
          textStyle={selectedTextStyle}
          layout={selectedLayout}
          fontSize={fontSize}
          textColor={textColor}
          showText={true}
          selectedVersion={selectedVersion}
          isLive={false}
        />
        <div className="absolute bottom-2 left-2 flex gap-1.5 z-10 bg-black/40 p-1 rounded-lg backdrop-blur-md border border-white/10">
          <button
            onClick={pushPreviewToLive}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border-2 border-[#3E9B4F]/30 hover:border-[#3E9B4F]/60 text-[#3E9B4F] rounded-md shadow-lg transition-colors"
            title="Push to Live"
          >
            <MonitorUp size={14} />
            <span className="text-[10px] uppercase font-bold tracking-widest">
              Live
            </span>
          </button>
          <button
            onClick={clearLiveText}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-2 border-gray-400/20 hover:border-gray-400/40 text-gray-300 rounded-md shadow-lg transition-colors"
            title="Clear Screen (Show Background Only)"
          >
            <MonitorOff size={14} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-300">
              Clear
            </span>
          </button>
        </div>
      </div>

      {/* Song Slide Navigation - only when in Songs tab */}
      {activeTab === "songs" && selectedSong && (
        <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-[#0a0a0a] via-[#151515] to-[#0a0a0a] border-t border-[#3E9B4F]/20">
          {/* Lyric Mic Button */}
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
