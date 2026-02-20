import { Search, X, Plus, Music, Trash2 } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useSongStore } from "../../stores/songStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import type { ServiceItem } from "../../types";

export default function SongsTab() {
  const { selectedTheme, textColor, setPreviewVerse } = useAppStore();

  const {
    songs,
    selectedSong,
    selectedSlideIndex,
    setSelectedSong,
    setSelectedSlideIndex,
    showAddSongModal,
    setShowAddSongModal,
    songSearchInput,
    setSongSearchInput,
    newSongTitle,
    setNewSongTitle,
    newSongArtist,
    setNewSongArtist,
    newSongLyrics,
    setNewSongLyrics,
    addSong,
    deleteSong,
    clearModal,
  } = useSongStore();

  const { selectedItems, handleMultiSelectClick } = useServiceFlowStore();

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Songs Search Bar + Add Button */}
      <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 focus-within:border-[#3E9B4F]/50">
            <Search className="text-gray-500 flex-shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search songs..."
              value={songSearchInput}
              onChange={(e) => setSongSearchInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[100px]"
            />
            {songSearchInput && (
              <button
                onClick={() => setSongSearchInput("")}
                className="text-gray-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddSongModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3E9B4F] hover:bg-[#4fb85f] rounded-lg text-sm font-medium text-white transition-colors"
        >
          <Plus size={16} />
          Add Song
        </button>
      </div>

      {/* Song List + Slides View */}
      <div className="flex-1 flex min-h-0">
        {/* Song List */}
        <div className="w-64 border-r border-white/10 overflow-y-auto">
          {songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Music className="text-gray-600 mb-3" size={32} />
              <p className="text-sm text-gray-500">No songs yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Click "Add Song" to get started
              </p>
            </div>
          ) : (
            songs
              .filter(
                (song) =>
                  song.title.toLowerCase().includes(songSearchInput.toLowerCase()) ||
                  song.artist?.toLowerCase().includes(songSearchInput.toLowerCase())
              )
              .map((song) => (
                <div
                  key={song.id}
                  className={`flex items-center border-b border-white/5 transition-colors ${
                    selectedItems.has(song.id) || selectedSong?.id === song.id
                      ? "bg-[#3E9B4F]/20"
                      : "hover:bg-white/5"
                  }`}
                  draggable
                  onDragStart={(e) => {
                    let itemsToDrag: ServiceItem[] = [];
                    if (selectedItems.has(song.id)) {
                      itemsToDrag = songs
                        .filter((s) => selectedItems.has(s.id))
                        .map((s) => ({
                          id: s.id,
                          type: "song",
                          title: s.title,
                          subtitle: s.artist,
                          data: s,
                        }));
                    } else {
                      itemsToDrag = [
                        {
                          id: song.id,
                          type: "song",
                          title: song.title,
                          subtitle: song.artist,
                          data: song,
                        },
                      ];
                    }
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify(itemsToDrag)
                    );
                  }}
                >
                  <button
                    onClick={(e) => {
                      const allIds = songs.map((s) => s.id);
                      const shouldPlay = handleMultiSelectClick(song.id, allIds, e);
                      if (shouldPlay) {
                        setSelectedSong(song);
                        setSelectedSlideIndex(0);
                      }
                    }}
                    className={`flex-1 p-3 text-left ${
                      selectedItems.has(song.id) || selectedSong?.id === song.id
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{song.title}</div>
                    {song.artist && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">{song.artist}</div>
                    )}
                    <div className="text-[10px] text-gray-600 mt-1">{song.slides.length} slides</div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSong(song.id);
                    }}
                    className="p-2 mr-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
          )}
        </div>

        {/* Slides Grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {selectedSong ? (
            <div className="grid grid-cols-3 gap-3">
              {selectedSong.slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedSlideIndex(index);
                    setPreviewVerse({ ref: selectedSong.title, text: slide });
                  }}
                  className={`aspect-video rounded-lg border-2 p-3 text-left transition-all overflow-hidden relative ${
                    selectedSlideIndex === index
                      ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {selectedTheme.type === "gradient" ? (
                    <div className="absolute inset-0" style={{ background: selectedTheme.url }} />
                  ) : (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${selectedTheme.url})` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="relative z-10">
                    <div className="text-[10px] text-gray-400 mb-1">Slide {index + 1}</div>
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: textColor }}>
                      {slide}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Music className="text-gray-600 mb-3" size={40} />
              <p className="text-sm text-gray-500">Select a song to view slides</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Song Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Add New Song</h2>
              <button onClick={clearModal} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">
                  Song Title *
                </label>
                <input
                  type="text"
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  placeholder="Enter song title..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">
                  Artist (Optional)
                </label>
                <input
                  type="text"
                  value={newSongArtist}
                  onChange={(e) => setNewSongArtist(e.target.value)}
                  placeholder="Enter artist name..."
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">
                  Lyrics *
                </label>
                <textarea
                  value={newSongLyrics}
                  onChange={(e) => setNewSongLyrics(e.target.value)}
                  placeholder={"Paste lyrics here...\n\nSeparate verses with blank lines for automatic slide breaks."}
                  rows={12}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3E9B4F]/50 resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Tip: Use blank lines between verses for cleaner slide breaks
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={clearModal}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSong}
                disabled={!newSongTitle.trim() || !newSongLyrics.trim()}
                className="px-6 py-2 bg-[#3E9B4F] hover:bg-[#4fb85f] disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Add Song
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
