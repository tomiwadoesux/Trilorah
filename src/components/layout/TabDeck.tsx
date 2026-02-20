import React, { useEffect } from "react";
import { Search, ImageIcon, Music, Layout, Video } from "lucide-react";
import { useAppStore } from "../../stores/appStore";

import ScripturesTab from "../tabs/ScripturesTab";
import ThemesTab from "../tabs/ThemesTab";
import SongsTab from "../tabs/SongsTab";
import PresentationsTab from "../tabs/PresentationsTab";
import VideoEditorTab from "../tabs/VideoEditorTab";

export function TabDeck() {
  const { activeTab, setActiveTab } = useAppStore();

  useEffect(() => {
    if (activeTab === "slideEditor") {
      setActiveTab("scriptures");
    }
  }, [activeTab, setActiveTab]);

  const tabs = [
    { id: "scriptures", label: "Scriptures", icon: Search },
    { id: "themes", label: "Themes", icon: ImageIcon },
    { id: "songs", label: "Songs", icon: Music },
    { id: "presentations", label: "Presentations", icon: Layout },
    { id: "video", label: "Video", icon: Video },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Navigation Tabs Bar */}
      <div className="flex w-full bg-[#0a0a0a] border-b border-[#1a1a1a]">
        {tabs.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              aria-label={tab.label}
              title={tab.label}
              className={`flex-1 py-3 px-2 flex gap-2 text-xs uppercase font-bold tracking-wider items-center justify-center transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-[#3E9B4F] text-[#3E9B4F] bg-[#3E9B4F]/5"
                  : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] overflow-hidden">
        {activeTab === "scriptures" && <ScripturesTab />}
        {activeTab === "themes" && <ThemesTab />}
        {activeTab === "songs" && <SongsTab />}
        {activeTab === "presentations" && <PresentationsTab />}
        {activeTab === "video" && <VideoEditorTab />}
      </div>
    </div>
  );
}
