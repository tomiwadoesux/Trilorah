import { useAppStore } from "../../stores/appStore";
import OutputPanel from "../OutputPanel";

export default function LiveMonitor() {
  const {
    liveVerse,
    showLiveText,
    selectedTheme,
    selectedTextStyle,
    selectedLayout,
    fontSize,
    textColor,
    selectedVersion,
  } = useAppStore();

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
          theme={selectedTheme}
          textStyle={selectedTextStyle}
          layout={selectedLayout}
          fontSize={fontSize}
          textColor={textColor}
          showText={showLiveText}
          selectedVersion={selectedVersion}
          isLive={true}
        />
      </div>
    </div>
  );
}
