import { useRef } from "react";
import {
  Mic,
  Download,
  Play,
  Timer,
  X,
  Loader2,
  ImageIcon,
  Plus,
  List,
  GripVertical,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useAsrStore } from "../../stores/asrStore";
import { useScriptureStore } from "../../stores/scriptureStore";
import { useSongStore } from "../../stores/songStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import type { ServiceItem } from "../../types";
import LocalSlideImage from "../ui/LocalSlideImage";

interface SidebarProps {
  isWhisperReady: boolean;
  startWhisperRecording: () => void;
  stopWhisperRecording: () => void;
  detectVerseFromTranscript: (text: string) => void;
}

export default function Sidebar({
  isWhisperReady,
  startWhisperRecording,
  stopWhisperRecording,
  detectVerseFromTranscript,
}: SidebarProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const { mode, setMode, liveVerse, elapsedTime } = useAppStore();
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
    setCurrentTranscript,
  } = useAsrStore();
  const { setListeningMode } = useSongStore();
  const { history } = useScriptureStore();
  const {
    serviceFlow,
    setServiceFlow,
    draggedItem,
    setDraggedItem,
    removeFromFlow,
    playFlowItem,
    updateNoteInFlow,
  } = useServiceFlowStore();

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    const newItem: ServiceItem = {
      id: crypto.randomUUID(),
      type: "theme",
      title: file.name,
      subtitle: isVideo ? "Video Clip" : "Image",
      data: {
        id: crypto.randomUUID(),
        name: file.name,
        type: isVideo ? "video" : "image",
        url: url,
      },
    };
    setServiceFlow((prev) => [...prev, newItem]);
  };

  const handleDragStart = (e: React.DragEvent, item: ServiceItem) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify([item]));
    setDraggedItem(item);
  };

  const handleFlowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFlowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const newItemsToAdd: ServiceItem[] = [];

        items.forEach((sourceItem: ServiceItem) => {
          if (!serviceFlow.find((i) => i.id === sourceItem.id)) {
            newItemsToAdd.push({ ...sourceItem, id: crypto.randomUUID() });
          }
        });

        if (newItemsToAdd.length > 0) {
          setServiceFlow((prev) => [...prev, ...newItemsToAdd]);
        } else if (
          draggedItem &&
          items.length === 1 &&
          items[0].id === draggedItem.id
        ) {
          setServiceFlow((prev) => {
            const filtered = prev.filter((i) => i.id !== draggedItem.id);
            return [...filtered, draggedItem];
          });
        }
      } catch (err) {
        console.error("Failed to parse dropped item", err);
      }
    }
    setDraggedItem(null);
  };

  return (
    <div className="w-[280px] flex flex-col border-r border-white/10 bg-[#0a0a0a]">
      {/* Run of Show / Mode Select */}
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
          <Mic size={14} className={mode === "sermon" ? "animate-pulse" : ""} />
          Sermon
          {mode === "sermon" && (
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
                  setServiceFlow((prev) => [...prev, newNote]);
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
            {serviceFlow.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const data = e.dataTransfer.getData("application/json");
                  if (data) {
                    try {
                      const parsed = JSON.parse(data);
                      const items = Array.isArray(parsed) ? parsed : [parsed];
                      const itemsToInsert: ServiceItem[] = [];

                      items.forEach((si: ServiceItem) => {
                        if (serviceFlow.find((sf) => sf.id === si.id)) {
                          itemsToInsert.push(si);
                        } else {
                          itemsToInsert.push({ ...si, id: crypto.randomUUID() });
                        }
                      });

                      const idsToRemove = new Set(
                        itemsToInsert
                          .filter((i) => serviceFlow.some((sf) => sf.id === i.id))
                          .map((i) => i.id)
                      );

                      const targetItem = serviceFlow[index];
                      const filteredFlow = serviceFlow.filter(
                        (i) => !idsToRemove.has(i.id)
                      );

                      let newTargetIndex = filteredFlow.findIndex(
                        (i) => i.id === targetItem.id
                      );
                      if (newTargetIndex === -1)
                        newTargetIndex =
                          index <= filteredFlow.length ? index : filteredFlow.length;

                      filteredFlow.splice(newTargetIndex, 0, ...itemsToInsert);
                      setServiceFlow(filteredFlow);
                    } catch (err) {
                      console.error("Drop error", err);
                    }
                  }
                }}
                className={`group flex items-center gap-2 p-2 rounded mb-1 border transition-colors cursor-move ${
                  item.type === "note"
                    ? "bg-yellow-900/20 border-yellow-500/20 text-yellow-200 hover:border-yellow-500/40"
                    : "bg-[#111] border-white/5 hover:border-white/20 text-xs text-gray-300 hover:bg-white/5"
                }`}
              >
                <GripVertical
                  size={12}
                  className={`${
                    item.type === "note" ? "text-yellow-600" : "text-gray-600"
                  } cursor-grab`}
                />

                {(item.type === "theme" || item.type === "presentation") && (
                  <div className="w-8 h-8 rounded bg-black/50 overflow-hidden flex-shrink-0 border border-white/10 mr-2">
                    {item.data.type === "gradient" ? (
                      <div className="w-full h-full" style={{ background: item.data.url }} />
                    ) : item.data.type === "video" ? (
                      <video src={item.data.url} className="w-full h-full object-cover" muted />
                    ) : item.type === "presentation" && item.data.slides?.[0] ? (
                      <LocalSlideImage
                        path={item.data.slides[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img src={item.data.url} className="w-full h-full object-cover" alt="" />
                    )}
                  </div>
                )}

                <div
                  className="flex-1 min-w-0"
                  title={item.type === "note" ? "Double-click to edit" : item.title}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (item.type === "note") {
                      const newText = prompt("Edit note:", item.subtitle);
                      if (newText !== null) {
                        updateNoteInFlow(item.id, newText);
                      }
                    }
                  }}
                >
                  <div
                    className={`font-bold truncate ${
                      item.type === "note" ? "text-yellow-100" : ""
                    }`}
                  >
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div
                      className={`text-[10px] truncate ${
                        item.type === "note"
                          ? "text-yellow-500 italic"
                          : "text-gray-500"
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  )}
                </div>

                {item.type !== "note" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playFlowItem(item);
                    }}
                    className="bg-[#3E9B4F]/20 text-[#3E9B4F] p-1 rounded hover:bg-[#3E9B4F] hover:text-white transition-colors"
                    title="Push to Live"
                  >
                    <Play size={10} fill="currentColor" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFlow(item.id);
                  }}
                  className={`hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ${
                    item.type === "note" ? "text-yellow-700" : "text-gray-600"
                  }`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Service Timer */}
          <div className="h-12 flex items-center px-4 border-b border-white/10 gap-2 text-gray-500">
            <Timer size={14} className="text-[#3E9B4F]" />
            <span className="text-[10px] uppercase text-gray-600 font-bold">Service Time</span>
            <span className="font-mono text-sm text-white ml-auto">
              {formatTime(elapsedTime)}
            </span>
          </div>

          {/* Current Detection */}
          <div className="p-4 border-b border-white/10">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              Current Detection
            </h3>

            {!isListening ? (
              <button
                onClick={() => {
                  setListeningMode("scripture");
                  setIsListening(true);
                  startWhisperRecording();
                }}
                disabled={!isWhisperReady}
                className={`w-full p-4 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 hover:border-[#3E9B4F]/60 transition-all group ${
                  !isWhisperReady ? "opacity-60 cursor-wait" : ""
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {isWhisperReady ? (
                    <Mic size={24} className="text-[#3E9B4F] group-hover:scale-110 transition-transform" />
                  ) : (
                    <Loader2 size={24} className="text-[#3E9B4F] animate-spin" />
                  )}
                  <span className="text-sm font-bold text-[#3E9B4F]">
                    {isWhisperReady ? "Start Now" : "Loading AI..."}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {isWhisperReady ? "Click to start listening" : whisperStatus}
                  </span>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="px-1">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded px-2 py-1 text-[10px] text-gray-400 focus:outline-none focus:border-[#3E9B4F]/50 transition-colors"
                  >
                    <option value="default">Default Input (Mic/Aux)</option>
                    {availableDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Input ${device.deviceId.slice(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>

                {liveVerse.ref === "" ? (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#3E9B4F] rounded-full animate-pulse" />
                      <span className="text-[9px] text-[#3E9B4F] uppercase font-bold">Listening</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-end text-[9px] font-mono text-gray-500 px-0.5">
                          <span>-60</span><span>-30</span><span>-18</span><span>-6</span>
                          <span className="text-red-500">0</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full border border-white/5 relative overflow-hidden flex items-center">
                          <div
                            className="h-full transition-all duration-75 ease-out rounded-full"
                            style={{
                              width: `${Math.max(0, ((audioLevel + 60) / 60) * 100)}%`,
                              background: `linear-gradient(to right, #3E9B4F 0%, #3E9B4F 70%, #fbbf24 85%, #ef4444 100%)`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="min-h-[40px] p-2 bg-black/20 rounded border border-white/5 flex flex-wrap gap-1 items-start content-start">
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
                            <span className="text-[10px] text-gray-500">Waiting for speech</span>
                            <span className="w-[2px] h-3 bg-[#3E9B4F] cursor-blink" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Type scripture (e.g. Genesis 1:1)"
                          className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const text = (e.target as HTMLInputElement).value;
                              if (text) {
                                setCurrentTranscript(text);
                                detectVerseFromTranscript(text);
                                window.api?.sendText(text);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <span className="text-[9px] text-gray-600 mt-0.5 block">
                          Press Enter to test detection
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tight">
                          Signal Health
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            audioLevel > -3 ? "text-red-500 animate-pulse" : "text-[#3E9B4F]"
                          }`}
                        >
                          {audioLevel.toFixed(1)} dB
                        </span>
                      </div>
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
                ) : (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border border-[#3E9B4F]/30 relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#3E9B4F] rounded-full animate-pulse" />
                      <span className="text-[9px] text-[#3E9B4F] uppercase font-bold">Live</span>
                    </div>
                    <span className="text-sm font-bold text-[#3E9B4F]">{liveVerse.ref}</span>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2" style={{ whiteSpace: "pre-line" }}>
                      "{liveVerse.text}"
                    </p>

                    {currentTranscript && (
                      <div className="mt-2 p-1.5 bg-black/20 rounded border border-white/5">
                        <p className="text-[10px] text-[#3E9B4F]/80 italic line-clamp-2 font-medium">
                          "{currentTranscript}"
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-75"
                          style={{
                            width: `${Math.max(0, ((audioLevel + 60) / 60) * 100)}%`,
                            background: audioLevel > -3 ? "#ef4444" : "#3E9B4F",
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 w-8">
                        {audioLevel.toFixed(0)}dB
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsListening(false);
                        stopWhisperRecording();
                      }}
                      className="mt-2 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Stop Listening
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History / Detections */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Recent Detections
              </h3>
              <button className="text-gray-500 hover:text-white" title="Download Sermon Notes">
                <Download size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded bg-[#111] border border-white/5 hover:border-white/20 cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white">
                      {item.ref}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 bg-white/10 p-1 rounded hover:bg-white/20">
                      <Play size={10} className="text-[#3E9B4F]" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 truncate">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
