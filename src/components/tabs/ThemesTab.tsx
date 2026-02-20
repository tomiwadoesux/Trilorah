import { useRef } from "react";
import { ImageIcon, Video, Check } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useServiceFlowStore } from "../../stores/serviceFlowStore";
import type { Theme, ServiceItem } from "../../types";
import {
  DEFAULT_THEMES,
  LAYOUT_PRESETS,
  TEXT_STYLES,
  GRADIENT_PRESETS,
  TEXT_COLORS,
} from "../../utils/constants";

export default function ThemesTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedTheme,
    setSelectedTheme,
    customThemes,
    addCustomTheme,
    selectedLayout,
    setSelectedLayout,
    selectedTextStyle,
    setSelectedTextStyle,
    fontSize,
    setFontSize,
    textColor,
    setTextColor,
  } = useAppStore();

  const { selectedItems, handleMultiSelectClick } = useServiceFlowStore();

  const renderThemeButton = (theme: Theme, allThemes: Theme[]) => (
    <button
      key={theme.id}
      onClick={(e) => {
        const allIds = allThemes.map((t) => t.id);
        const shouldPlay = handleMultiSelectClick(theme.id, allIds, e);
        if (shouldPlay) setSelectedTheme(theme);
      }}
      draggable
      onDragStart={(e) => {
        let itemsToDrag: ServiceItem[] = [];
        if (selectedItems.has(theme.id)) {
          const combined = [...DEFAULT_THEMES, ...customThemes];
          itemsToDrag = combined
            .filter((t) => selectedItems.has(t.id))
            .map((t) => ({
              id: t.id,
              type: "theme",
              title: t.name,
              subtitle: t.type,
              data: t,
            }));
        } else {
          itemsToDrag = [
            {
              id: theme.id,
              type: "theme",
              title: theme.name,
              subtitle: theme.type,
              data: theme,
            },
          ];
        }
        e.dataTransfer.setData("application/json", JSON.stringify(itemsToDrag));
      }}
      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
        selectedItems.has(theme.id) || selectedTheme.id === theme.id
          ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      {theme.type === "gradient" ? (
        <div className="w-full h-full" style={{ background: theme.url }} />
      ) : theme.type === "video" ? (
        <video src={theme.url} className="w-full h-full object-cover" muted />
      ) : (
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${theme.url})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/30 flex items-end p-2">
        <span className="text-[10px] text-white font-medium truncate">
          {theme.name}
        </span>
      </div>
      {selectedTheme.id === theme.id && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-[#3E9B4F] rounded-full flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
      {/* Add Custom Theme */}
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          Add Custom Background
        </h3>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                const isVideo = file.type.startsWith("video/");
                const newTheme: Theme = {
                  id: `custom-${Date.now()}`,
                  name: file.name.split(".")[0],
                  type: isVideo ? "video" : "image",
                  url,
                };
                addCustomTheme(newTheme);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg hover:border-[#3E9B4F]/50 transition-colors"
          >
            <ImageIcon size={16} className="text-gray-400" />
            <span className="text-sm text-gray-300">Add Image</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg hover:border-[#3E9B4F]/50 transition-colors"
          >
            <Video size={16} className="text-gray-400" />
            <span className="text-sm text-gray-300">Add Video</span>
          </button>
        </div>
      </div>

      {/* Text Layout Styles */}
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          Text Layout
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {LAYOUT_PRESETS.map((layout) => (
            <button
              key={layout.id}
              onClick={() => setSelectedLayout(layout)}
              className={`flex-shrink-0 w-32 h-20 rounded-lg border-2 transition-all relative overflow-hidden ${
                selectedLayout.id === layout.id
                  ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 p-2 flex flex-col">
                {layout.refPosition === "top-center" && (
                  <>
                    <div className="text-[8px] text-white font-bold text-center mb-1">John 3:16</div>
                    <div className="text-[6px] text-gray-400 text-center flex-1">For God so loved...</div>
                  </>
                )}
                {layout.refPosition === "bottom-right" && (
                  <>
                    <div className="text-[6px] text-gray-400 text-left flex-1">For God so loved...</div>
                    <div className="text-[8px] text-white font-bold text-right">John 3:16</div>
                  </>
                )}
                {layout.refPosition === "bottom-left" && (
                  <>
                    <div className="text-[6px] text-gray-400 text-right flex-1">For God so loved...</div>
                    <div className="text-[8px] text-white font-bold text-left">John 3:16</div>
                  </>
                )}
                {layout.refPosition === "bottom-center" && (
                  <>
                    <div className="text-[6px] text-gray-400 text-center flex-1">For God so loved...</div>
                    <div className="text-[8px] text-white font-bold text-center">John 3:16</div>
                  </>
                )}
                {layout.refPosition === "top-left" && (
                  <>
                    <div className="text-[8px] text-white font-bold text-left mb-1">John 3:16</div>
                    <div className="text-[6px] text-gray-400 text-left flex-1">For God so loved...</div>
                  </>
                )}
              </div>
              {selectedLayout.id === layout.id && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-[#3E9B4F] rounded-full flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-1">{selectedLayout.description}</p>
      </div>

      {/* Text Styling Row */}
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          Text Styling
        </h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] text-gray-500 mb-1 block">Effect</label>
            <select
              value={selectedTextStyle.id}
              onChange={(e) => {
                const style = TEXT_STYLES.find((s) => s.id === e.target.value);
                if (style) setSelectedTextStyle(style);
              }}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3E9B4F]/50"
            >
              {TEXT_STYLES.map((style) => (
                <option key={style.id} value={style.id}>{style.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] text-gray-500 mb-1 block">
              Size: {Math.round(fontSize * 100)}%
            </label>
            <input
              type="range"
              min="0.75"
              max="2"
              step="0.05"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#3E9B4F]"
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 mb-1 block">Color</label>
            <div className="flex gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setTextColor(color.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    textColor === color.value
                      ? "border-[#3E9B4F] scale-110"
                      : "border-transparent hover:border-white/30"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg text-center">
          <p
            style={{
              fontSize: `${1.25 * fontSize}rem`,
              textShadow: selectedTextStyle.textShadow,
              color: textColor,
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            "For God so loved the world..."
          </p>
        </div>
      </div>

      {/* Gradient Options */}
      {selectedTheme.type === "gradient" && (
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
            Gradient Style
          </h3>
          <div className="flex gap-2 flex-wrap">
            {GRADIENT_PRESETS.map((gradient) => (
              <button
                key={gradient.id}
                onClick={() => setSelectedTheme({ ...selectedTheme, url: gradient.value })}
                className={`w-16 h-10 rounded-lg border-2 transition-all ${
                  selectedTheme.url === gradient.value
                    ? "border-[#3E9B4F] ring-2 ring-[#3E9B4F]/50"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={{ background: gradient.value }}
                title={gradient.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Themes */}
      {customThemes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
            Your Themes
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {customThemes.map((theme) => renderThemeButton(theme, customThemes))}
          </div>
        </div>
      )}

      {/* Default Themes */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          Default Themes
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {DEFAULT_THEMES.map((theme) => renderThemeButton(theme, DEFAULT_THEMES))}
        </div>
      </div>
    </div>
  );
}
