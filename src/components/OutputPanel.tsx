import type { DisplayVerse, Theme, TextStyle, LayoutPreset } from "../types";
import { parseSlideToken } from "../utils/slideToken";
import LocalSlideImage from "./ui/LocalSlideImage";

interface OutputPanelProps {
  verse: DisplayVerse;
  theme: Theme;
  textStyle: TextStyle;
  layout: LayoutPreset;
  fontSize: number;
  textColor: string;
  showText: boolean;
  selectedVersion: string;
  isLive?: boolean;
  overlayOpacity?: number;
}

export default function OutputPanel({
  verse,
  theme,
  textStyle,
  fontSize,
  textColor,
  showText,
  selectedVersion,
  isLive = false,
  overlayOpacity,
}: OutputPanelProps) {
  const baseSize = isLive ? 1.5 : 1.2;
  const overlay = overlayOpacity ?? (isLive ? 0.3 : 0.4);
  const textSizeClass = isLive ? "text-2xl" : "text-lg";
  const refSizeClass = isLive ? "text-xl" : "text-base";
  const versionSizeClass = isLive ? "text-base" : "text-sm";
  const padding = isLive ? "p-8" : "p-6";
  const maxWidth = isLive ? "max-w-4xl" : "max-w-2xl";
  const mbSize = isLive ? "mb-6" : "mb-4";
  const mlSize = isLive ? "ml-3" : "ml-2";
  const slidePath = parseSlideToken(verse.text);

  if (showText && slidePath) {
    return (
      <div className="absolute inset-0 bg-black">
        <LocalSlideImage
          path={slidePath}
          alt={verse.ref || "Presentation slide"}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <>
      {/* Theme Background */}
      {theme.type === "gradient" ? (
        <div className="absolute inset-0" style={{ background: theme.url }} />
      ) : theme.type === "video" ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={theme.url}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${theme.url})` }}
        />
      )}
      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
      />

      <div
        className={`absolute inset-0 flex ${padding} z-10 flex-col items-center justify-center`}
      >
        {showText && verse.ref && (
          <div className={`text-center ${maxWidth}`}>
            <p
              className={`${textSizeClass} font-light leading-relaxed ${mbSize}`}
              style={{
                textShadow: textStyle.textShadow,
                fontSize: `${baseSize * fontSize}rem`,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: textColor,
                whiteSpace: "pre-line",
              }}
            >
              "{verse.text}"
            </p>
            {/* Only show ref/version for scriptures (contains :) */}
            {verse.ref.includes(":") && (
              <h2
                className={`${refSizeClass} font-serif`}
                style={{
                  textShadow: textStyle.textShadow,
                  color: textColor,
                }}
              >
                {verse.ref}
                <span
                  className={`${versionSizeClass} opacity-70 ${mlSize} font-sans`}
                >
                  {selectedVersion}
                </span>
              </h2>
            )}
          </div>
        )}
      </div>
    </>
  );
}
