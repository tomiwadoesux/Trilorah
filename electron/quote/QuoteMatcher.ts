/**
 * Quote Matcher
 * Detects when a preacher quotes consecutive words from a Bible verse
 * Uses 7-word sliding window with 6/7 tolerance
 */

import * as fs from "fs";
import * as path from "path";

interface VerseEntry {
  ref: string;
  bookId: number;
  chapter: number;
  verse: number;
  words: string[];
}

interface MatchResult {
  ref: string;
  bookId: number;
  chapter: number;
  verse: number;
  confidence: number;
}

const WINDOW_SIZE = 7;
const MIN_MATCHES = 6; // Allow 1 mismatch in 7 words

export class QuoteMatcher {
  private verses: VerseEntry[] = [];
  private firstWordIndex: Record<string, number[]> = {};
  private rollingWords: string[] = [];
  private lastQuoteRef: string | null = null;
  private lastQuoteTime: number = 0;
  private isLoaded = false;

  /**
   * Load Bible indexes from JSON files
   */
  loadIndex(): boolean {
    try {
      // Use process.cwd() since __dirname points to dist-electron after compilation
      const dataDir = path.join(process.cwd(), "electron", "data");

      const versesPath = path.join(dataDir, "bible_index.json");
      const firstWordPath = path.join(dataDir, "bible_first_word_index.json");

      if (!fs.existsSync(versesPath) || !fs.existsSync(firstWordPath)) {
        console.error(
          "❌ Quote index files not found. Run build scripts first."
        );
        return false;
      }

      this.verses = JSON.parse(fs.readFileSync(versesPath, "utf8"));
      this.firstWordIndex = JSON.parse(fs.readFileSync(firstWordPath, "utf8"));
      this.isLoaded = true;

      console.log(
        `✅ QuoteMatcher loaded: ${this.verses.length} verses, ${
          Object.keys(this.firstWordIndex).length
        } first words`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to load quote index:", error);
      return false;
    }
  }

  /**
   * Normalize text to word array
   */
  private normalizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Update rolling word buffer with new transcript text
   */
  updateRollingWords(text: string): void {
    const words = this.normalizeText(text);
    this.rollingWords.push(...words);

    // Keep last 30 words
    if (this.rollingWords.length > 30) {
      this.rollingWords = this.rollingWords.slice(-30);
    }
  }

  /**
   * Clear the rolling word buffer
   */
  clearBuffer(): void {
    this.rollingWords = [];
  }

  /**
   * Count matching words at same positions
   */
  private countMatches(a: string[], b: string[]): number {
    let matches = 0;
    for (let i = 0; i < a.length && i < b.length; i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches;
  }

  /**
   * Find a quoted verse using 7-word sliding window
   */
  findQuotedVerse(): MatchResult | null {
    if (!this.isLoaded || this.rollingWords.length < WINDOW_SIZE) {
      return null;
    }

    // Slide through rolling words
    for (let i = 0; i <= this.rollingWords.length - WINDOW_SIZE; i++) {
      const window = this.rollingWords.slice(i, i + WINDOW_SIZE);
      const firstWord = window[0];

      // Get candidate verses by first word
      const candidates = this.firstWordIndex[firstWord];
      if (!candidates) continue;

      // Check each candidate verse
      for (const verseIdx of candidates) {
        const verse = this.verses[verseIdx];
        if (!verse || verse.words.length < WINDOW_SIZE) continue;

        // Slide through verse words
        for (let j = 0; j <= verse.words.length - WINDOW_SIZE; j++) {
          const verseSlice = verse.words.slice(j, j + WINDOW_SIZE);
          const matches = this.countMatches(window, verseSlice);

          if (matches >= MIN_MATCHES) {
            const confidence = matches / WINDOW_SIZE;
            return {
              ref: verse.ref,
              bookId: verse.bookId,
              chapter: verse.chapter,
              verse: verse.verse,
              confidence,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Try to detect a quote with debouncing
   */
  tryDetectQuote(): MatchResult | null {
    const result = this.findQuotedVerse();
    const now = Date.now();

    if (!result) return null;

    // Debounce: same quote within 1.5 seconds = skip
    if (result.ref === this.lastQuoteRef && now - this.lastQuoteTime < 1500) {
      return null;
    }

    this.lastQuoteRef = result.ref;
    this.lastQuoteTime = now;

    console.log(
      `📜 Quote detected: ${result.ref} (${Math.round(
        result.confidence * 100
      )}%)`
    );
    return result;
  }

  /**
   * Get current rolling buffer state (for debugging)
   */
  getBufferState(): string[] {
    return [...this.rollingWords];
  }
}

// Singleton instance
let instance: QuoteMatcher | null = null;

export function getQuoteMatcher(): QuoteMatcher {
  if (!instance) {
    instance = new QuoteMatcher();
  }
  return instance;
}
