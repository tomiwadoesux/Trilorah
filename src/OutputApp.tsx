import { useEffect, useState } from "react";
import { useAppStore } from "./stores/appStore";

export default function OutputApp() {
  const [outputId, setOutputId] = useState<string>("main");
  const { liveVerse, selectedTheme, setLiveVerse, showLiveText } =
    useAppStore();

  useEffect(() => {
    // Parse URL parameter
    const params = new URLSearchParams(window.location.search);
    const id = params.get("outputId") || "main";
    setOutputId(id);

    // Listen to live verses
    if (window.api?.onVerseDetected) {
      const unsubscribe = window.api.onVerseDetected((data) => {
        const refStr =
          data.endVerse && data.endVerse !== data.verse
            ? `${data.book} ${data.chapter}:${data.verse}-${data.endVerse}`
            : `${data.book} ${data.chapter}:${data.verse || 1}`;

        setLiveVerse({
          ref: refStr,
          text: data.text || "",
          version: "KJV", // Provide a default or pass it through if available
        } as any);
      });
      return unsubscribe;
    }
  }, [setLiveVerse]);

  // If there's no live verse or we've cleared it, be transparent for output
  if (!liveVerse || !showLiveText) {
    return <div className="w-screen h-screen bg-transparent"></div>;
  }

  // Alpha / transparent background for OBS if needed
  const isAlpha = outputId === "alternate";

  return (
    <div
      className={`w-screen h-screen overflow-hidden flex flex-col justify-end p-12 transition-all ${
        isAlpha ? "bg-transparent" : "bg-black"
      }`}
      style={{
        backgroundImage:
          !isAlpha && (selectedTheme as any)?.backgroundUrl
            ? `url(${(selectedTheme as any).backgroundUrl})`
            : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="w-full text-center p-8 rounded-xl backdrop-blur-md"
        style={{
          fontFamily: "sans-serif", // Simplified for now
          color: "#ffffff",
          backgroundColor: isAlpha ? "rgba(0, 0, 0, 0.7)" : "rgba(0,0,0,0.5)",
          border: `2px solid #fff`,
        }}
      >
        <div
          className="font-bold mb-4 drop-shadow-xl"
          style={{ fontSize: "60px" }}
        >
          {liveVerse.text || "..."}
        </div>
        <div className="font-medium opacity-80" style={{ fontSize: "30px" }}>
          {liveVerse.ref}
        </div>
      </div>
    </div>
  );
}
