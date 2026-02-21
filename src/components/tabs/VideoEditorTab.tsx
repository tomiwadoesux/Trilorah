import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Upload, Scissors, MonitorPlay, Loader2, Plus } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";

export default function VideoEditorTab() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string>("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string>("");
  const [trimmedURL, setTrimmedURL] = useState<string>("");
  const [duration, setDuration] = useState(0);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load ffmpeg.wasm on component mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("log", ({ message }) => {
        setLogs((prev) => prev + "\n" + message);
        console.log(message);
      });

      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      try {
        await ffmpeg.load({
          coreURL:
            "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
          wasmURL:
            "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
        });
        setLoaded(true);
      } catch (e) {
        console.error("Error loading ffmpeg", e);
      } finally {
        setIsLoading(false);
      }
    };
    if (!loaded && !isLoading) {
      load();
    }
  }, [loaded, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoURL(url);
      setStartTime(0);

      // Wait for video metadata to load to get duration
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          const d = videoRef.current?.duration || 0;
          setDuration(d);
          setEndTime(d);
        };
      }
    }
  };

  const handleTrim = async () => {
    if (!loaded || !videoFile) return;

    setIsLoading(true);
    setProgress(0);
    setLogs("");

    const ffmpeg = ffmpegRef.current;

    try {
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      // Write the file to memory
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Calculate duration to trim
      const trimDuration = endTime - startTime;

      // Exec ffmpeg command: ffmpeg -ss [start] -i [input] -t [duration] -c copy [output]
      // Using -c copy because it's insanely fast for just trimming
      await ffmpeg.exec([
        "-ss",
        `${startTime}`,
        "-i",
        inputName,
        "-t",
        `${trimDuration}`,
        "-c",
        "copy",
        outputName,
      ]);

      // Read the result
      const data = await ffmpeg.readFile(outputName);

      // Create a URL and trigger download
      const blob = new Blob([data as any], {
        type: "video/mp4",
      });
      const url = URL.createObjectURL(blob);
      setTrimmedURL(url);

      const trimmedName = `trim-${videoFile.name}`;

      useAppStore.getState().addCustomTheme({
        id: crypto.randomUUID(),
        name: trimmedName,
        type: "video",
        url: url,
      });

      // Also trigger download as before
      const a = document.createElement("a");
      a.href = url;
      a.download = trimmedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] text-gray-300 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MonitorPlay size={20} className="text-[#3E9B4F]" />
              Mini Video Editor
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Trim videos directly in your browser using FFMPEG.wasm
            </p>
          </div>

          {!loaded && isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/30 px-3 py-1.5 rounded-full ring-1 ring-white/10">
              <Loader2 size={12} className="animate-spin" />
              Loading FFMPEG Core...
            </div>
          )}
        </div>

        {/* Upload State */}
        {!videoURL && (
          <div className="w-full aspect-video border-2 border-dashed border-[#333] rounded-xl bg-[#111] flex flex-col items-center justify-center gap-3 group hover:border-[#3E9B4F] transition-colors relative cursor-pointer">
            <input
              type="file"
              accept="video/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-[#3E9B4F]/20">
              <Upload
                size={20}
                className="text-gray-400 group-hover:text-[#3E9B4F]"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                Click or drag video to edit
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, WEBM, or MOV up to ~2GB
              </p>
            </div>
          </div>
        )}

        {/* Editor State */}
        {videoURL && (
          <div className="flex flex-col gap-6">
            <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
              <video
                ref={videoRef}
                src={videoURL}
                className="w-full h-auto max-h-[50vh] object-contain"
                controls
              />
            </div>

            <div className="bg-[#111] p-5 rounded-xl border border-white/5 shadow-lg flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Trim Timeline
                </h3>
                <span className="text-xs font-mono text-gray-500">
                  {formatTime(startTime)} - {formatTime(endTime)} (Hold:{" "}
                  {formatTime(endTime - startTime)})
                </span>
              </div>

              {/* Range Sliders Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold w-12 text-right text-gray-400">
                    START
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < endTime) setStartTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="flex-1 accent-[#3E9B4F]"
                  />
                  <span className="text-xs font-mono w-12 text-white">
                    {formatTime(startTime)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold w-12 text-right text-gray-400">
                    END
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > startTime) setEndTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="flex-1 accent-red-500"
                  />
                  <span className="text-xs font-mono w-12 text-white">
                    {formatTime(endTime)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    setVideoURL("");
                    setTrimmedURL("");
                    setVideoFile(null);
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-2 border-gray-400/20 hover:border-gray-400/40 text-gray-300 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {trimmedURL ? (
                  <button
                    onClick={() => {
                      useServiceFlowStore.getState().addToFlow([
                        {
                          id: crypto.randomUUID(),
                          type: "theme",
                          title: `trim-${videoFile?.name || "video"}`,
                          subtitle: "Video Clip",
                          data: {
                            id: crypto.randomUUID(),
                            name: `trim-${videoFile?.name || "video"}`,
                            type: "video",
                            url: trimmedURL,
                          },
                        },
                      ]);
                      setVideoURL("");
                      setTrimmedURL("");
                      setVideoFile(null);
                    }}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#3E9B4F] hover:bg-[#4fb85f] rounded-lg shadow-lg transition-all"
                  >
                    <Plus size={16} />
                    Add to Today
                  </button>
                ) : (
                  <button
                    onClick={handleTrim}
                    disabled={!loaded || isLoading}
                    className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-[#3E9B4F] rounded-lg transition-all ${
                      !loaded || isLoading
                        ? "bg-gradient-to-br from-[#3E9B4F]/10 to-[#3E9B4F]/5 border-2 border-[#3E9B4F]/15 opacity-50 cursor-not-allowed text-[#3E9B4F]/50"
                        : "bg-gradient-to-br from-[#3E9B4F]/20 to-[#3E9B4F]/5 border-2 border-[#3E9B4F]/30 hover:border-[#3E9B4F]/60"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing {progress}%
                      </>
                    ) : (
                      <>
                        <Scissors size={16} />
                        Trim & Save
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {logs && (
              <div className="mt-4">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                  Processing Logs
                </label>
                <textarea
                  value={logs}
                  readOnly
                  className="w-full h-32 bg-[#050505] text-gray-500 font-mono text-[10px] p-3 rounded-lg border border-[#222] resize-none focus:outline-none scrollbar-thin scrollbar-thumb-gray-800"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
