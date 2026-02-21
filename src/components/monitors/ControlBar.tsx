export default function ControlBar() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-2">
      <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
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
