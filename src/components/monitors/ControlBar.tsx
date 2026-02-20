import { Monitor, MonitorOff } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

export default function ControlBar() {
  const { pushPreviewToLive, clearLiveText } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-2">
      <button
        onClick={pushPreviewToLive}
        className="w-16 h-12 bg-[#3E9B4F] hover:bg-[#4fb85f] rounded flex flex-col items-center justify-center transition-colors shadow-lg"
        title="Push to Live"
      >
        <span className="text-[10px] uppercase font-bold text-white tracking-widest mt-1">
          Live
        </span>
      </button>
      <button
        onClick={clearLiveText}
        className="w-16 h-12 bg-gray-700 hover:bg-gray-600 rounded flex flex-col items-center justify-center transition-colors"
        title="Clear Screen (Show Background Only)"
      >
        <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest mt-1">
          Clear
        </span>
      </button>
      <div className="mt-4 flex flex-col items-center gap-1 border-t border-white/10 pt-4 w-full">
        <button
          onClick={() => window.api?.openOutput("main")}
          className="text-[10px] uppercase font-bold text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 w-full text-center"
          title="Open Main Display Output"
        >
          Main
        </button>
        <button
          onClick={() => window.api?.openOutput("alternate")}
          className="text-[10px] uppercase font-bold text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 w-full text-center"
          title="Open Alpha/Livestream Output"
        >
          Alpha
        </button>
        <button
          onClick={() => window.api?.openOutput("third")}
          className="text-[10px] uppercase font-bold text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 w-full text-center"
          title="Open Confidence Monitor Output"
        >
          Stage
        </button>
      </div>
    </div>
  );
}
