import { Monitor, MonitorUp } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import OutputPanel from "../OutputPanel";

export default function PreviewMonitor() {
  const {
    previewVerse,
    selectedTheme,
    selectedTextStyle,
    selectedLayout,
    fontSize,
    textColor,
    fontFamily,
    fontWeight,
    selectedVersion,
    pushPreviewToLive,
  } = useAppStore();

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
          fontFamily={fontFamily}
          fontWeight={fontWeight}
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
        </div>
      </div>
    </div>
  );
}
