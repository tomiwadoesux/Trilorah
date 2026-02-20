import PreviewMonitor from "./PreviewMonitor";
import ControlBar from "./ControlBar";
import LiveMonitor from "./LiveMonitor";

interface MonitorBarProps {
  startWhisperRecording: () => void;
  stopWhisperRecording: () => void;
}

export default function MonitorBar({
  startWhisperRecording,
  stopWhisperRecording,
}: MonitorBarProps) {
  return (
    <div className="h-[45%] bg-[#050505] p-6 flex gap-6 border-b border-white/10">
      <PreviewMonitor
        startWhisperRecording={startWhisperRecording}
        stopWhisperRecording={stopWhisperRecording}
      />
      <ControlBar />
      <LiveMonitor />
    </div>
  );
}
