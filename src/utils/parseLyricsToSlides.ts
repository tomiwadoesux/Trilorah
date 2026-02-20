export function parseLyricsToSlides(lyrics: string): string[] {
  // Normalize only CRLF, DO NOT destroy line breaks
  const raw = lyrics.replace(/\r/g, "").trim();

  let lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Detect whether lyrics are already properly line-broken
  const avgLineLength =
    lines.reduce((sum, l) => sum + l.length, 0) / lines.length;

  const isProperLyrics = lines.length >= 6 && avgLineLength < 45;

  // If NOT proper lyrics, reconstruct (Google case)
  if (!isProperLyrics) {
    lines = reconstructLyricLines(raw);
  }

  // Group lines into slides (max 4 lines per slide)
  const slides: string[] = [];
  let buffer: string[] = [];

  for (const line of lines) {
    buffer.push(line);

    if (buffer.length === 4) {
      slides.push(buffer.join("\n"));
      buffer = [];
    }
  }

  if (buffer.length) {
    slides.push(buffer.join("\n"));
  }

  return slides;
}

// Reconstruction ONLY when needed
function reconstructLyricLines(text: string): string[] {
  // Split by punctuation that usually ends lyric phrases
  const chunks = text
    .replace(/[ ]{2,}/g, " ")
    .split(/(?<=[,.;!?])\s+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const lines: string[] = [];

  for (const chunk of chunks) {
    if (chunk.length <= 45) {
      lines.push(chunk);
    } else {
      lines.push(...splitByLength(chunk, 40));
    }
  }

  return lines;
}

// Soft split by capitalized words or numbers with punctuation
function softSplit(text: string): string[] {
  const parts = text.split(
    /\s+(?=(?:[A-Z][a-z]|[0-9]+[:.]))/ // capitalized word OR number+punctuation
  );

  return parts.map((p) => p.trim()).filter(Boolean);
}

// Length fallback (LAST RESORT ONLY)
function splitByLength(text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let buffer: string[] = [];

  for (const word of words) {
    buffer.push(word);

    if (buffer.join(" ").length >= max) {
      lines.push(buffer.join(" "));
      buffer = [];
    }
  }

  if (buffer.length) {
    lines.push(buffer.join(" "));
  }

  return lines;
}
