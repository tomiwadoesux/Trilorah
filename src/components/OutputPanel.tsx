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
  fontFamily: string;
  fontWeight: number;
  showText: boolean;
  selectedVersion: string;
  isLive?: boolean;
  overlayOpacity?: number;
}

export default function OutputPanel({
  verse,
  theme,
  textStyle,
  layout,
  fontSize,
  textColor,
  fontFamily,
  fontWeight,
  showText,
  selectedVersion,
  isLive = false,
  overlayOpacity,
}: OutputPanelProps) {
  const baseSize = 1.5;
  const refSize = baseSize * fontSize * 0.65;
  const versionSize = baseSize * fontSize * 0.5;
  const overlay = overlayOpacity ?? 0.3;
  const slidePath = parseSlideToken(verse.text);

  const fontFamilyValue =
    fontFamily === "sans-serif"
      ? "'Inter', 'Helvetica Neue', Arial, sans-serif"
      : "'Georgia', 'Times New Roman', serif";

  const isRefOnTop = layout.refPosition === "top-center" || layout.refPosition === "top-left";

  const textAlign = layout.textAlign as "center" | "left" | "right";

  const refAlign = (() => {
    if (layout.refPosition.includes("left")) return "left" as const;
    if (layout.refPosition.includes("right")) return "right" as const;
    return "center" as const;
  })();

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

  const isScripture = verse.ref.includes(":");

  const refBlock = isScripture && (
    <div style={{ textAlign: refAlign, width: "100%" }}>
      <span
        style={{
          textShadow: textStyle.textShadow,
          color: textColor,
          fontFamily: fontFamilyValue,
          fontWeight: 400,
          fontSize: `${refSize}rem`,
          opacity: 0.85,
          letterSpacing: "0.05em",
        }}
      >
        {verse.ref}
        <span
          style={{
            fontSize: `${versionSize}rem`,
            opacity: 0.6,
            marginLeft: "0.5em",
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 400,
            textTransform: "uppercase" as const,
            letterSpacing: "0.1em",
          }}
        >
          {selectedVersion}
        </span>
      </span>
    </div>
  );

  const divider = isScripture && (
    <div
      style={{
        width: refAlign === "center" ? "60px" : "40px",
        height: "1px",
        background: `linear-gradient(to right, transparent, ${textColor}40, transparent)`,
        margin: refAlign === "center" ? "0 auto" : refAlign === "right" ? "0 0 0 auto" : "0",
      }}
    />
  );

  const verseBlock = (
    <p
      style={{
        textShadow: textStyle.textShadow,
        fontSize: `${baseSize * fontSize}rem`,
        fontFamily: fontFamilyValue,
        fontWeight,
        color: textColor,
        whiteSpace: "pre-line",
        textAlign: textAlign === "center" ? "justify" : textAlign,
        lineHeight: 1.6,
        textAlignLast: textAlign === "center" ? "center" : undefined,
      }}
    >
      {verse.text}
    </p>
  );

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

      {/* Verse text — always vertically centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
        {showText && verse.ref && (
          <div className="max-w-4xl w-full">
            {verseBlock}
          </div>
        )}
      </div>

      {/* Reference — positioned at top or bottom based on layout */}
      {showText && verse.ref && isScripture && (
        <div
          className="absolute left-0 right-0 px-8 z-10"
          style={{ [isRefOnTop ? "top" : "bottom"]: "1.5rem" }}
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {divider}
            {refBlock}
          </div>
        </div>
      )}
    </>
  );
}
