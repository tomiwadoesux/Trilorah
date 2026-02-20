/**
 * Scripture Session Manager (TypeScript)
 * Handles advanced preaching behaviors in the Electron main process
 */

export type DisplayPayload = {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  isPreview: boolean; // Goes to preview first, not live

  // NEW: Range metadata for UI progress
  rangeEnd?: number; // Full range end (if showing a chunk)
  chunkSize?: number; // Usually 3
};

export type ReferenceInput = {
  book?: string | null;
  chapter?: number | null;
  verse?: number | null;
  rangeEnd?: number | null;
};

export class ScriptureSession {
  private book: string | null = null;
  private chapter: number | null = null;

  private startVerse: number | null = null;
  private endVerse: number | null = null;
  private currentVerse: number | null = null;

  private readingMode = false;

  private readonly CHUNK_SIZE = 3;
  private readonly CHAPTER_WAIT_MS = 3000; // Increased to 3s
  private readonly COMMAND_DEBOUNCE_MS = 800;
  private readonly VERSE_LOCKOUT_MS = 7000; // Lockout verse updates after 7s

  private chapterTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCommandTime: number = 0;
  private lastVerseDisplayTime: number = 0;

  // Auto-Advance Matching
  private currentVerseText: string = "";
  private matchedWordsCount: number = 0;
  private verseWords: string[] = [];

  constructor(private emitDisplay: (payload: DisplayPayload) => void) {}

  /* ---------------- GETTERS & SETTERS ---------------- */

  getState() {
    return {
      book: this.book,
      chapter: this.chapter,
      startVerse: this.startVerse,
      endVerse: this.endVerse,
      currentVerse: this.currentVerse,
      isRange: this.startVerse !== this.endVerse,
      canAdvance: this.canAdvance(),
      canGoBack: this.canGoBack(),
      readingMode: this.readingMode,
    };
  }

  // Called by main.ts after resolving DB text
  setCurrentVerseText(text: string) {
    // Basic normalization for matching
    this.currentVerseText = text.toLowerCase().replace(/[^\w\s]/g, "");
    this.verseWords = this.currentVerseText
      .split(/\s+/)
      .filter((w) => w.length > 0);
    this.matchedWordsCount = 0;
    console.log(
      `📝 Tracking verse text: "${this.verseWords.slice(0, 5).join(" ")}..." (${
        this.verseWords.length
      } words)`
    );
  }

  private canAdvance(): boolean {
    if (!this.currentVerse) return false;
    return true;
  }

  private canGoBack(): boolean {
    if (!this.currentVerse) return false;
    return this.currentVerse > 1;
  }

  /* ---------------- TRANSCRIPT PROCESSING (AUTO-ADVANCE) ---------------- */

  processTranscript(text: string) {
    if (!this.readingMode || this.verseWords.length === 0) return;

    // Normalize input
    const input = text.toLowerCase().replace(/[^\w\s]/g, "");
    const inputWords = input.split(/\s+/).filter((w) => w.length > 0);

    // Simple verification (not robust, but fits request logic of "preacher finishes reading")
    // We check if the input ends with the same words as the verse
    // Or if we can find a significant overlap

    // Accumulate word matches?
    // Let's use a simpler heuristic:
    // If the *end* of the input matches the *end* of the verse

    const last3VerseWords = this.verseWords.slice(-3).join(" ");
    if (input.includes(last3VerseWords)) {
      console.log("✨ Auto-Advance: Matched end of verse!");
      this.advance();
      this.verseWords = []; // Stop matching until next verse text is set
      return;
    }
  }

  /* ---------------- RESET ---------------- */

  reset() {
    this.clearTimers();
    this.book = null;
    this.chapter = null;
    this.startVerse = null;
    this.endVerse = null;
    this.currentVerse = null;
    this.readingMode = false;
    this.lastVerseDisplayTime = 0;
    this.currentVerseText = "";
    this.matchedWordsCount = 0;
  }

  private clearTimers() {
    if (this.chapterTimer) {
      clearTimeout(this.chapterTimer);
      this.chapterTimer = null;
    }
  }

  /**
   * Cancel the pending "default to verse 1" timer
   * Called when we detect a verse (even if skipped as duplicate)
   */
  cancelVerseTimer() {
    if (this.chapterTimer) {
      console.log("⏱️❌ Verse timer cancelled (verse was detected)");
      clearTimeout(this.chapterTimer);
      this.chapterTimer = null;
    }
  }

  private exitReadingMode() {
    this.readingMode = false;
  }

  /* ---------------- INPUT FROM RESOLVER ---------------- */

  onReferenceDetected(ref: ReferenceInput) {
    // DEBUG: Log what session receives
    console.log("📥 Session received:", JSON.stringify(ref));

    const now = Date.now();

    // RULE 1: Ignore book-only calls (no chapter or verse)
    // Only setting a book shouldn't do anything visible
    if (ref.book && !ref.chapter && !ref.verse) {
      console.log(
        `📚 Book-only detected: "${ref.book}" - waiting for chapter/verse`
      );
      // Just store the book for context, but don't display anything
      this.book = ref.book;
      return;
    }

    // RULE 2: Require at least a chapter to do anything
    // If we get a verse without a chapter and no established session, ignore
    if (!ref.chapter && !this.chapter) {
      console.log(`⏭️ Ignored: No chapter context established`);
      return;
    }

    // LOCKOUT RULE:
    // In reading mode, ignore bare verse numbers to prevent accidental jumps
    const isBareUpdate = !ref.book && ref.verse;
    if (this.readingMode && isBareUpdate) {
      console.log(`🔒 Reading Mode: Ignored bare verse ${ref.verse} update`);
      return;
    }

    // NEW BOOK
    if (ref.book && ref.book !== this.book) {
      this.reset(); // clears lockout
      this.book = ref.book;
    }

    // NEW CHAPTER
    if (ref.chapter && ref.chapter !== this.chapter) {
      this.chapter = ref.chapter;
      this.startVerse = null;
      this.endVerse = null;
      this.currentVerse = null;
      this.exitReadingMode();

      // RULE 3: If verse provided with chapter, act immediately
      if (ref.verse) {
        console.log(`⚡ Fast path: ${this.book} ${ref.chapter}:${ref.verse}`);
        // Fall through to process the verse below
      } else {
        // No verse provided - wait 3s before defaulting to verse 1
        this.waitForVerseOrDefault();
        return;
      }
    }

    // VERSE RANGE (e.g., "verses 1 through 5")
    if (ref.verse && ref.rangeEnd && ref.rangeEnd > ref.verse) {
      this.clearTimers();

      this.startVerse = ref.verse;
      this.endVerse = ref.rangeEnd;
      this.currentVerse = ref.verse;

      this.emitRange(ref.verse, ref.rangeEnd);
      return;
    }

    // SINGLE VERSE
    if (ref.verse) {
      this.clearTimers();

      this.startVerse = ref.verse;
      this.endVerse = ref.verse;
      this.currentVerse = ref.verse;

      this.emitSingleVerse(ref.verse);
    }
  }

  /* ---------------- CHAPTER DEFAULT (VERSE 1) ---------------- */

  private waitForVerseOrDefault() {
    this.clearTimers();

    this.chapterTimer = setTimeout(() => {
      if (!this.book || !this.chapter) return;

      console.log(
        `⏱️ No verse after ${this.CHAPTER_WAIT_MS}ms - defaulting to verse 1`
      );

      this.startVerse = 1;
      this.endVerse = 1;
      this.currentVerse = 1;

      this.emitSingleVerse(1);
    }, this.CHAPTER_WAIT_MS);

    console.log(
      `📑 Chapter detected: ${this.book} ${this.chapter} (waiting ${this.CHAPTER_WAIT_MS}ms for verse...)`
    );
  }

  /* ---------------- COMMANDS FROM ASR ---------------- */

  onCommand(text: string): boolean {
    const t = text.toLowerCase();
    const now = Date.now();
    if (now - this.lastCommandTime < this.COMMAND_DEBOUNCE_MS) {
      return false;
    }

    if (this.isNextCommand(t)) {
      this.lastCommandTime = now;
      this.exitReadingMode();
      this.advance();
      return true;
    }

    if (this.isPreviousCommand(t)) {
      this.lastCommandTime = now;
      this.exitReadingMode();
      this.goBack();
      return true;
    }

    const verseMatch = t.match(/\bverse\s+(\d+)\b/);
    if (verseMatch) {
      this.lastCommandTime = now;
      if (this.book && this.chapter) {
        const verse = parseInt(verseMatch[1], 10);
        this.exitReadingMode();
        this.jumpToVerse(verse);
        return true;
      }
    }

    return false;
  }

  private isNextCommand(text: string): boolean {
    return [
      "next verse",
      "next",
      "continue",
      "go on",
      "keep going",
      "move on",
    ].some((cmd) => text.includes(cmd));
  }

  private isPreviousCommand(text: string): boolean {
    return [
      "previous verse",
      "previous",
      "go back",
      "back",
      "last verse",
      "before",
    ].some((cmd) => text.includes(cmd));
  }

  /* ---------------- ADVANCE/BACK LOGIC ---------------- */

  private advance() {
    if (!this.book || !this.chapter || this.currentVerse === null) return;

    this.currentVerse += 1;
    this.startVerse = this.currentVerse;
    this.endVerse = this.currentVerse;
    console.log(`⏭️ Advancing to verse ${this.currentVerse}`);
    this.emitSingleVerse(this.currentVerse);
  }

  private goBack() {
    if (!this.book || !this.chapter || this.currentVerse === null) return;
    if (this.currentVerse <= 1) return;

    this.currentVerse -= 1;
    this.startVerse = this.currentVerse;
    this.endVerse = this.currentVerse;
    this.emitSingleVerse(this.currentVerse);
  }

  private jumpToVerse(verse: number) {
    if (!this.book || !this.chapter) return;
    this.clearTimers();
    this.startVerse = verse;
    this.endVerse = verse;
    this.currentVerse = verse;
    this.emitSingleVerse(verse);
  }

  /* ---------------- DISPLAY ---------------- */

  private emitSingleVerse(verse: number) {
    if (!this.book || !this.chapter) return;

    this.readingMode = true;
    this.lastVerseDisplayTime = Date.now(); // Reset lockout timer

    console.log(`📖 Preview: ${this.book} ${this.chapter}:${verse}`);

    this.emitDisplay({
      book: this.book,
      chapter: this.chapter,
      verseStart: verse,
      verseEnd: verse,
      rangeEnd: this.endVerse ?? undefined,
      chunkSize: this.CHUNK_SIZE,
      isPreview: true,
    });
  }

  private emitRange(start: number, end: number) {
    if (!this.book || !this.chapter) return;

    this.readingMode = true;
    this.lastVerseDisplayTime = Date.now(); // Reset lockout timer

    console.log(`📖 Preview: ${this.book} ${this.chapter}:${start}-${end}`);

    this.emitDisplay({
      book: this.book,
      chapter: this.chapter,
      verseStart: start,
      verseEnd: end,
      rangeEnd: this.endVerse ?? undefined,
      chunkSize: this.CHUNK_SIZE,
      isPreview: true,
    });
  }
}
