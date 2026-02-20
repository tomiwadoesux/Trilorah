/**
 * SIMPLIFIED Lyric Matching Logic
 *
 * Design:
 * - Two signals only: 50% total coverage OR 40% last line match.
 * - No complex filler filtering.
 * - No strict line ordering.
 * - Set-based matching (robust to repetition).
 */

/**
 * Removes section labels like [Verse 1], [Chorus], etc.
 */
export function stripSectionLabels(text: string): string {
  return text.replace(
    /\[(verse|chorus|bridge|pre-chorus|post-chorus|intro|outro)[^\]]*\]/gi,
    ""
  );
}

/**
 * Normalizes text: lowercase, remove special chars, split by whitespace.
 */
export function normalizeLyrics(text: string): string[] {
  return stripSectionLabels(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Extract unique words from a slide.
 */
export function getSlideWordSet(slideText: string): Set<string> {
  const words = normalizeLyrics(slideText);
  return new Set(words);
}

/**
 * Get the last meaningful line of the slide.
 */
export function getLastLine(slideText: string): string {
  const lines = slideText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[lines.length - 1] || "";
}

/**
 * Calculates what percentage of the slide's unique words have been heard.
 */
export function calculateCoverageRatio(
  slideWords: Set<string>,
  heardWords: Set<string>
): number {
  if (slideWords.size === 0) return 0;

  let matched = 0;
  slideWords.forEach((word) => {
    if (heardWords.has(word)) matched++;
  });

  return matched / slideWords.size;
}

export type SlidePhase = "start" | "middle" | "end";

/**
 * Checks if the last line has been sufficiently heard (>= 75%).
 * 🔒 POSITION-AWARE: Only allows detection if we are in the "end" phase.
 */
export function isLastLineHeard(
  lastLine: string,
  heardWords: Set<string>,
  slidePhase: SlidePhase
): boolean {
  // 🔒 Do NOT allow last-line detection too early
  if (slidePhase !== "end") return false;

  const lastWords = normalizeLyrics(lastLine);
  if (lastWords.length === 0) return false;

  let matched = 0;
  lastWords.forEach((w) => {
    if (heardWords.has(w)) matched++;
  });

  return matched / lastWords.length >= 0.75; // 👈 MUST hear ~75% of last line
}

/**
 * Main Decision Function
 * Advance if:
 * 1. We are in the END phase.
 * 2. Coverage >= 60% OR Last Line Heard >= 75%.
 */
export function shouldAutoAdvance(
  slideWords: Set<string>,
  heardWords: Set<string>,
  lastLine: string,
  slidePhase: SlidePhase
): boolean {
  // 🔒 FINAL GUARD: Advance is ONLY allowed in END phase
  if (slidePhase !== "end") return false;

  // Guard: Must hear at least a few words to prevent false positives
  if (heardWords.size < 4) return false;

  const coverage = calculateCoverageRatio(slideWords, heardWords);
  const lastLineMatch = isLastLineHeard(lastLine, heardWords, slidePhase);

  return coverage >= 0.6 || lastLineMatch;
}

/**
 * Checks if we should "Catch Up" to the next slide.
 * Strict rules:
 * 1. Must hear at least 6 unique words.
 * 2. Next slide coverage must be >= 60% (High Confidence).
 */
export function shouldCatchUp(
  nextSlideWords: Set<string>,
  heardWords: Set<string>
): boolean {
  if (!nextSlideWords || nextSlideWords.size === 0) return false;

  // Strict guard: must hear enough words to be sure
  if (heardWords.size < 6) return false;

  const coverage = calculateCoverageRatio(nextSlideWords, heardWords);
  return coverage >= 0.6; // Higher threshold for skipping
}
