import React, { useRef } from "react";
import {
  Mic,
  List,
  ImageIcon,
  Plus,
  Trash2,
  Play,
  Loader2,
  X,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import { useScriptureStore } from "../../stores/scriptureStore";
import { useAsrStore } from "../../stores/asrStore";
import type { ServiceItem } from "../../types";

interface SidebarProps {
  startWhisperRecording: () => void;
  stopWhisperRecording: () => void;
  detectVerseFromTranscript: (text: string) => void;
}

export function Sidebar({
  startWhisperRecording,
  stopWhisperRecording,
  detectVerseFromTranscript,
}: SidebarProps) {
  const { mode, setMode, liveVerse } = useAppStore();
  const {
    serviceFlow,
    setServiceFlow,
    playFlowItem,
    selectedItems,
    handleMultiSelectClick,
    removeFromFlow,
  } = useServiceFlowStore();
  const { history } = useScriptureStore();

  const {
    isListening,
    setIsListening,
    audioLevel,
    currentTranscript,
    detectedReference,
    whisperStatus,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useAsrStore();

  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, item: ServiceItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleFlowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFlowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const itemsToInsert: ServiceItem[] = [];
        items.forEach((item: ServiceItem) => {
          if (!serviceFlow.find((sf) => sf.id === item.id)) {
            itemsToInsert.push({
              ...item,
              id: `${item.id}-${Date.now()}-${Math.random()}`,
            });
          }
        });
        if (itemsToInsert.length > 0) {
          useServiceFlowStore.getState().addToFlow(itemsToInsert);
        }
      } catch (err) {
        console.error("Drop parsing error", err);
      }
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const itemsToInsert: ServiceItem[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        type: "presentation",
        title: file.name,
        subtitle: file.type.startsWith("video/") ? "Video" : "Media",
        data: { url: URL.createObjectURL(file) },
      }));
      useServiceFlowStore.getState().addToFlow(itemsToInsert);
    }
  };

  return (
    <div className="w-[280px] flex flex-col border-r border-white/10 bg-[#0a0a0a]">
      {/* Mode Select */}
      <div className="p-4 border-b border-white/10 flex flex-col gap-2">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          Run of Show
        </h3>
        <button
          onClick={() => setMode("worship")}
          className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-all ${
            mode === "worship"
              ? "bg-[#1a1a1a] text-[#3E9B4F] border border-[#3E9B4F]/20"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <List size={14} /> Today's Flow
        </button>
        <button
          onClick={() => setMode("sermon")}
          className={`w-full flex items-center gap-3 p-2 rounded text-sm font-medium transition-all ${
            mode === "sermon"
              ? "bg-[#1a1a1a] text-[#3E9B4F] border border-[#3E9B4F]/20"
              : "text-gray-400 hover:bg-white/5"
          }`}
        >
          <Mic
            size={14}
            className={mode === "sermon" && isListening ? "animate-pulse" : ""}
          />
          Sermon
          {mode === "sermon" && isListening && (
            <span className="ml-auto text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">
              REC
            </span>
          )}
        </button>
      </div>

      {mode === "worship" ? (
        <>
          <div className="flex gap-2 px-4 py-2 border-b border-white/10 bg-[#0a0a0a]">
            <button
              onClick={() => mediaInputRef.current?.click()}
              className="flex-1 bg-[#1a1a1a] border border-white/10 hover:border-[#3E9B4F]/50 text-xs text-gray-400 hover:text-white py-1.5 rounded flex items-center justify-center gap-2 transition-all"
            >
              <ImageIcon size={12} className="text-[#3E9B4F]" /> Add Media
            </button>
            <input
              type="file"
              ref={mediaInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
            />
            <button
              onClick={() => {
                const noteText = prompt("Enter note text:", "New Note");
                if (noteText) {
                  const newNote: ServiceItem = {
                    id: crypto.randomUUID(),
                    type: "note",
                    title: "Note",
                    subtitle: noteText,
                    data: { text: noteText },
                  };
                  useServiceFlowStore.getState().addToFlow([newNote]);
                }
              }}
              className="flex-1 bg-[#1a1a1a] border border-white/10 hover:border-yellow-500/50 text-xs text-gray-400 hover:text-white py-1.5 rounded flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={12} className="text-yellow-500" /> Add Note
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto p-2 space-y-1"
            onDragOver={handleFlowDragOver}
            onDrop={handleFlowDrop}
          >
            {serviceFlow.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-700 text-xs border border-dashed border-white/10 rounded">
                <List size={24} className="mb-2 opacity-50" />
                <span>Drag items here</span>
              </div>
            )}
            {serviceFlow.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={(e) => {
                  const isSelect = handleMultiSelectClick(
                    item.id,
                    serviceFlow.map((i) => i.id),
                    e,
                  );
                  if (item.type === "note" && isSelect) {
                    const newText = prompt(
                      "Edit note:",
                      item.data.text || item.subtitle,
                    );
                    if (newText) {
                      useServiceFlowStore
                        .getState()
                        .updateNoteInFlow(item.id, newText);
                    }
                  } else if (isSelect) {
                    playFlowItem(item);
                  }
                }}
                className={`group relative p-3 rounded cursor-pointer border transition-all ${
                  selectedItems.has(item.id)
                    ? "bg-[#1a1a1a] border-[#3E9B4F]/50 shadow-lg"
                    : "bg-transparent border-transparent hover:bg-white/5"
                }`}
              >
                <div className="flex gap-3 items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate group-hover:text-[#3E9B4F] transition-colors">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFlow(item.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from flow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          {serviceFlow.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => setServiceFlow([])}
                className="w-full text-xs text-red-500/50 hover:text-red-500 p-2 rounded hover:bg-red-500/10 transition-colors"
              >
                Clear Flow
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] flex flex-col">
          <div className="p-4 border-b border-white/5 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur z-10 space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-[#3E9B4F] animate-pulse" : "bg-gray-600"}`}
              ></span>
              Live Detection
            </h3>

            {!isListening ? (
              <button
                onClick={() => {
                  setIsListening(true);
                  startWhisperRecording();
                }}
                className={`w-full p-4 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 hover:border-[#3E9B4F]/60 transition-all group`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Mic
                    size={24}
                    className="text-[#3E9B4F] group-hover:scale-110 transition-transform"
                  />
                  <span className="text-sm font-bold text-[#3E9B4F]">
                    Start Now
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Click to start listening
                  </span>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[10px] text-gray-400 focus:outline-none focus:border-[#3E9B4F]/50 transition-colors"
                >
                  <option value="default">Default Input</option>
                  {availableDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Input...`}
                    </option>
                  ))}
                </select>

                <div className="p-3 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-black/40 rounded-full border border-white/5 relative overflow-hidden flex items-center">
                      <div
                        className="h-full transition-all duration-75 ease-out rounded-full"
                        style={{
                          width: `${Math.max(0, ((audioLevel + 60) / 60) * 100)}%`,
                          background: `linear-gradient(to right, #3E9B4F 0%, #3E9B4F 70%, #fbbf24 85%, #ef4444 100%)`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold w-10 text-right ${audioLevel > -3 ? "text-red-500" : "text-[#3E9B4F]"}`}
                    >
                      {audioLevel.toFixed(0)} dB
                    </span>
                  </div>

                  <div className="mt-3 min-h-[40px] p-2 bg-black/20 rounded border border-white/5 flex flex-wrap gap-1 items-start content-start">
                    {detectedReference ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-[#3E9B4F]/20 text-[#3E9B4F] font-bold px-2 py-0.5 rounded animate-pulse">
                          📖 {detectedReference}
                        </span>
                      </div>
                    ) : currentTranscript ? (
                      <span className="text-[11px] text-[#3E9B4F] font-medium leading-relaxed italic">
                        "{currentTranscript}"
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500 italic">
                          Waiting...
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsListening(false);
                      stopWhisperRecording();
                    }}
                    className="mt-4 text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <X size={10} /> Stop Listening
                  </button>
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Type scripture (e.g. Genesis 1:1)"
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        const target = e.target as HTMLInputElement;
                        const text = target.value;
                        if (text) {
                          useAsrStore.getState().setCurrentTranscript(text);
                          detectVerseFromTranscript(text);
                          if (window.api) window.api.sendText(text);
                          target.value = "";
                        }
                      }
                    }}
                  />
                  <span className="text-[9px] text-gray-600 mt-0.5 block">
                    Press Enter to test detection
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-2 space-y-1 flex-1">
            {history.map((record, i) => (
              <div
                key={i}
                className="p-3 rounded bg-white/5 border border-white/5 hover:border-[#3E9B4F]/30 transition-colors group cursor-pointer"
                onClick={() => {
                  useAppStore.getState().setPreviewVerse(record);
                  useAppStore.getState().setLiveVerse(record);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-[#3E9B4F]">
                    {record.ref}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500">
                    Replay
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {record.text}
                </p>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center p-8 text-gray-600 text-xs">
                Speak references to see them here
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
