import { useRef, useEffect } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useScriptureStore } from "../../stores/scriptureStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import type { ServiceItem } from "../../types";
import { BIBLE_VERSIONS } from "../../utils/constants";

export default function ScripturesTab() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  const {
    selectedVersion,
    setSelectedVersion,
    showVersionDropdown,
    setShowVersionDropdown,
    setPreviewVerse,
    setLiveVerse,
  } = useAppStore();

  const {
    chapterVerses,
    selectedDeckId,
    setSelectedDeckId,
    isLoading,
    selectedBook,
    setSelectedBook,
    selectedChapterNum,
    setSelectedChapterNum,
    searchInput,
    setSearchInput,
    showSuggestions,
    setShowSuggestions,
    selectedSuggestion,
    setSelectedSuggestion,
    getSearchStep,
    getSuggestions,
    handleSelectSuggestion,
    handleBackspace,
    clearSearch,
    addToHistory,
  } = useScriptureStore();

  const { selectedItems, handleMultiSelectClick } = useServiceFlowStore();

  const searchStep = getSearchStep();
  const suggestions = getSuggestions();

  // Auto-scroll when selection changes
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedDeckId]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[selectedSuggestion].value);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion(Math.min(selectedSuggestion + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion(Math.max(selectedSuggestion - 1, 0));
    } else if (e.key === "Backspace" && searchInput === "") {
      handleBackspace();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <>
      {/* Tag-Based Search Bar */}
      <div className="min-h-14 bg-[#151515] border-b border-white/10 flex items-center px-4 gap-3 relative py-2">
        <div className="flex-1 relative">
          <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 focus-within:border-[#3E9B4F]/50">
            <Search className="text-gray-500 flex-shrink-0" size={16} />

            {selectedBook && (
              <span className="flex items-center gap-1 bg-[#3E9B4F]/20 text-[#3E9B4F] px-2 py-0.5 rounded text-sm font-medium">
                {selectedBook.name}
                <button
                  onClick={() => {
                    setSelectedBook(null);
                    setSelectedChapterNum(null);
                  }}
                  className="hover:bg-[#3E9B4F]/30 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedChapterNum && (
              <span className="flex items-center gap-1 bg-[#3E9B4F]/20 text-[#3E9B4F] px-2 py-0.5 rounded text-sm font-medium">
                Ch. {selectedChapterNum}
                <button
                  onClick={() => setSelectedChapterNum(null)}
                  className="hover:bg-[#3E9B4F]/30 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
                setSelectedSuggestion(0);
              }}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={
                !selectedBook
                  ? "Type a book name..."
                  : !selectedChapterNum
                  ? "Type chapter number..."
                  : "Type verse number..."
              }
              className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-[100px]"
            />

            {(selectedBook || searchInput) && (
              <button
                onClick={() => {
                  clearSearch();
                  searchInputRef.current?.focus();
                }}
                className="text-gray-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] uppercase text-gray-600 font-bold tracking-wider border-b border-white/5">
                {searchStep === "book"
                  ? "Select Book"
                  : searchStep === "chapter"
                  ? "Select Chapter"
                  : "Select Verse"}
              </div>
              {suggestions.map((item, index) => (
                <button
                  key={item.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item.value);
                    searchInputRef.current?.focus();
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                    index === selectedSuggestion
                      ? "bg-[#3E9B4F]/20 text-white"
                      : "text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {searchStep === "book" && (
                    <span className="text-gray-600 text-xs">↵ to select</span>
                  )}
                </button>
              ))}
              <div className="px-4 py-2 text-xs text-gray-600 border-t border-white/5">
                ↑↓ Navigate • Enter Select • Backspace Remove
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <div className="w-20 relative">
          <button
            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
            onBlur={() => setTimeout(() => setShowVersionDropdown(false), 200)}
            className="flex items-center gap-1 text-xs font-bold text-[#3E9B4F] uppercase tracking-wider hover:text-[#4fb85f] transition-colors"
          >
            {selectedVersion}
            <ChevronDown
              size={14}
              className={`transition-transform ${
                showVersionDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showVersionDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 text-[10px] uppercase text-gray-500 font-bold tracking-wider border-b border-white/5">
                Select Translation
              </div>
              <div className="max-h-64 overflow-y-auto">
                {BIBLE_VERSIONS.map((version) => (
                  <button
                    key={version.code}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedVersion(version.code);
                      setShowVersionDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                      selectedVersion === version.code
                        ? "bg-[#3E9B4F]/20 text-white"
                        : "text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <span className="font-medium">{version.code}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {version.name}
                      </span>
                    </div>
                    {selectedVersion === version.code && (
                      <Check size={14} className="text-[#3E9B4F]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-40 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Reference
        </div>
        <div className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Scripture Text
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading scriptures...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <tbody>
              {chapterVerses.map((row) => (
                <tr
                  key={row.id}
                  data-verse-id={row.id}
                  draggable
                  onDragStart={(e) => {
                    const idStr = String(row.id);
                    let itemsToDrag: ServiceItem[] = [];

                    if (selectedItems.has(idStr)) {
                      itemsToDrag = chapterVerses
                        .filter((v) => selectedItems.has(String(v.id)))
                        .map((v) => ({
                          id: `verse-${v.id}`,
                          type: "scripture",
                          title: v.ref,
                          subtitle: v.text,
                          data: v,
                        }));
                    } else {
                      itemsToDrag = [
                        {
                          id: `verse-${row.id}`,
                          type: "scripture",
                          title: row.ref,
                          subtitle: row.text,
                          data: row,
                        },
                      ];
                    }

                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify(itemsToDrag)
                    );
                  }}
                  ref={selectedDeckId === row.id ? selectedRowRef : null}
                  onClick={(e) => {
                    const idStr = String(row.id);
                    const allIds = chapterVerses.map((v) => String(v.id));
                    const shouldPlay = handleMultiSelectClick(idStr, allIds, e);

                    if (shouldPlay) {
                      setSelectedDeckId(row.id);
                      setPreviewVerse({ ref: row.ref, text: row.text });
                      setLiveVerse({ ref: row.ref, text: row.text });
                      addToHistory(
                        row.ref,
                        row.text.slice(0, 50) +
                          (row.text.length > 50 ? "..." : "")
                      );
                    }
                  }}
                  className={`
                    cursor-pointer border-b border-white/5 text-sm transition-colors
                    ${
                      selectedItems.has(String(row.id)) ||
                      selectedDeckId === row.id
                        ? "bg-[#3E9B4F]/20 text-white"
                        : "text-gray-400 hover:bg-white/5"
                    }
                  `}
                >
                  <td className="p-2 w-16 text-xs opacity-50 font-mono">
                    {row.version}
                  </td>
                  <td
                    className={`p-2 w-40 font-bold whitespace-nowrap ${
                      selectedDeckId === row.id
                        ? "text-[#3E9B4F]"
                        : "text-gray-500"
                    }`}
                  >
                    {row.ref}
                  </td>
                  <td className="p-2 opacity-90 truncate max-w-xl">
                    {row.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
