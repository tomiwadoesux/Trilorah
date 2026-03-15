/**
 * Quote Matcher
 * Detects when a preacher quotes consecutive words from a Bible verse
 * Uses 5-word sliding window with 4/5 tolerance
 * Supports mid-verse matching and returns multiple candidates
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

export interface MatchResult {
  ref: string;
  bookId: number;
  chapter: number;
  verse: number;
  confidence: number;
}

const WINDOW_SIZE = 5;
const MIN_MATCHES = 5; // All 5 words must match exactly

export class QuoteMatcher {
  private verses: VerseEntry[] = [];
  private wordIndex: Record<string, number[]> = {}; // all-words index
  private rollingWords: string[] = [];
  private lastQuoteRef: string | null = null;
  private lastQuoteTime: number = 0;
  private isLoaded = false;

  /**
   * Load Bible index and build all-words lookup
   * The all-words index allows matching from ANY position in a verse,
   * not just the beginning
   */
  loadIndex(): boolean {
    try {
      const dataDir = path.join(process.cwd(), "electron", "data");
      const versesPath = path.join(dataDir, "bible_index.json");

      if (!fs.existsSync(versesPath)) {
        console.error(
          "❌ bible_index.json not found. Run build scripts first."
        );
        return false;
      }

      this.verses = JSON.parse(fs.readFileSync(versesPath, "utf8"));

      // Build all-words index from verses
      // Maps every unique word to the verse indices containing it
      this.wordIndex = {};
      this.verses.forEach((v, i) => {
        const uniqueWords = new Set(v.words);
        for (const word of uniqueWords) {
          if (!this.wordIndex[word]) this.wordIndex[word] = [];
          this.wordIndex[word].push(i);
        }
      });

      this.isLoaded = true;

      console.log(
        `✅ QuoteMatcher loaded: ${this.verses.length} verses, ${
          Object.keys(this.wordIndex).length
        } unique words indexed`
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

    // Keep last 60 words (enough for long Bible verse readings)
    if (this.rollingWords.length > 60) {
      this.rollingWords = this.rollingWords.slice(-60);
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
   * Find the rarest word in a set (fewest verses containing it)
   * Used to minimize candidate lookups for performance
   */
  private getRarestWord(words: string[]): string {
    let rarest = words[0];
    let minCount = this.wordIndex[rarest]?.length ?? Infinity;

    for (const word of words) {
      const count = this.wordIndex[word]?.length ?? Infinity;
      if (count < minCount) {
        minCount = count;
        rarest = word;
      }
    }
    return rarest;
  }

  /**
   * Find ALL quoted verses matching the rolling buffer
   * Uses rarest-word lookup for performance, supports mid-verse matching
   */
  findAllQuotedVerses(): MatchResult[] {
    if (!this.isLoaded || this.rollingWords.length < WINDOW_SIZE) return [];

    const matches: MatchResult[] = [];
    const seenRefs = new Set<string>();

    // Slide through rolling words
    for (let i = 0; i <= this.rollingWords.length - WINDOW_SIZE; i++) {
      const win = this.rollingWords.slice(i, i + WINDOW_SIZE);

      // Use the rarest word in the window for candidate lookup
      const rarestWord = this.getRarestWord(win);
      const candidates = this.wordIndex[rarestWord];
      if (!candidates) continue;

      for (const verseIdx of candidates) {
        const verse = this.verses[verseIdx];
        if (!verse || verse.words.length < WINDOW_SIZE) continue;
        if (seenRefs.has(verse.ref)) continue;

        // Slide through ALL positions in the verse (mid-verse matching)
        for (let j = 0; j <= verse.words.length - WINDOW_SIZE; j++) {
          const verseSlice = verse.words.slice(j, j + WINDOW_SIZE);
          const matchCount = this.countMatches(win, verseSlice);

          if (matchCount >= MIN_MATCHES) {
            seenRefs.add(verse.ref);
            matches.push({
              ref: verse.ref,
              bookId: verse.bookId,
              chapter: verse.chapter,
              verse: verse.verse,
              confidence: matchCount / WINDOW_SIZE,
            });
            break; // Found match for this verse, move to next candidate
          }
        }
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches;
  }

  /**
   * Find a single quoted verse (backwards-compatible)
   */
  findQuotedVerse(): MatchResult | null {
    const results = this.findAllQuotedVerses();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Try to detect quotes with debouncing
   * Returns all matching verses (may be multiple with similar wording)
   */
  tryDetectQuotes(): MatchResult[] {
    const results = this.findAllQuotedVerses();
    const now = Date.now();

    if (results.length === 0) return [];

    const bestRef = results[0].ref;

    // Debounce: same best match within 1.5 seconds = skip
    if (bestRef === this.lastQuoteRef && now - this.lastQuoteTime < 1500) {
      return [];
    }

    this.lastQuoteRef = bestRef;
    this.lastQuoteTime = now;

    // Clear buffer after match so old words don't block new verse detection
    this.rollingWords = [];

    console.log(
      `📜 Quote detected: ${results.length} candidate(s), best: ${bestRef}`
    );
    return results;
  }

  /**
   * Single-result version (backwards-compatible)
   */
  tryDetectQuote(): MatchResult | null {
    const results = this.tryDetectQuotes();
    return results.length > 0 ? results[0] : null;
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
