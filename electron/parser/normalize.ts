/**
 * PRODUCTION NORMALIZATION ENGINE
 * Runs BEFORE resolver / state machine
 * Converts spoken text to standardized format for Bible reference detection
 */

import { BOOK_ALIASES } from "./bookAliases";
import { soundex } from "./phonetic";
import { logMiss } from "./aliasLogger";

/* ---------- NUMBER MAPS ---------- */

const ORDINAL_MAP: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
};

const BASIC_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  tree: 3,
  four: 4,
  for: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
};

/* ---------- NORMALIZE ---------- */

/**
 * Main normalization function
 * Converts spoken text to a standardized format for Bible reference matching
 */
export function normalize(text: string): string {
  let t = text.toLowerCase();

  // Remove filler words
  t = t.replace(/\b(chapter|verse|vers|vs|let us|turn to|read)\b/g, " ");

  // Ordinals → numbers (first → 1, second → 2, etc.)
  for (const [w, n] of Object.entries(ORDINAL_MAP)) {
    t = t.replace(new RegExp(`\\b${w}\\b`, "g"), n.toString());
  }

  // Multi-word numbers (twenty three → 23)
  t = t.replace(
    /\b(twenty|thirty|forty|fifty)\s+(one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_, ten, one) => (TENS[ten] + BASIC_NUMBERS[one]).toString()
  );

  // Single number words → digits
  for (const [w, n] of Object.entries(BASIC_NUMBERS)) {
    t = t.replace(new RegExp(`\\b${w}\\b`, "g"), n.toString());
  }

  // Ordinal suffix cleanup (1st → 1, 2nd → 2, etc.)
  t = t.replace(/(\d+)(st|nd|rd|th)\b/g, "$1");

  // BOOK NORMALIZATION (alias + phonetic fallback)
  t = normalizeBooks(t);

  return t.replace(/\s+/g, " ").trim();
}

/* ---------- BOOK NORMALIZATION ---------- */

/**
 * Normalize book names using alias matching and phonetic fallback
 */
function normalizeBooks(text: string): string {
  let t = text;

  // First try: exact alias matching
  for (const [canonical, aliases] of Object.entries(BOOK_ALIASES)) {
    for (const alias of aliases) {
      if (t.includes(alias)) {
        return t.replace(alias, canonical.toLowerCase());
      }
    }
  }

  // Second try: phonetic (soundex) fallback - SAFE
  const words = t.split(" ");
  for (const word of words) {
    if (word.length < 3) continue; // Skip short words

    const sx = soundex(word);
    for (const [canonical, aliases] of Object.entries(BOOK_ALIASES)) {
      for (const alias of aliases) {
        if (soundex(alias) === sx) {
          return t.replace(word, canonical.toLowerCase());
        }
      }
    }
  }

  return t;
}

/* ---------- EXTRACT REFERENCE ---------- */

/**
 * Extract potential Bible reference from text
 * Returns structured reference or null if not found
 */
export function extractReference(
  text: string
): { book: string; chapter: number; verse?: number } | null {
  const normalized = normalize(text);

  // Build regex pattern from book aliases
  const bookPatterns = Object.keys(BOOK_ALIASES)
    .map((book) => book.toLowerCase().replace(/\s+/g, "\\s+"))
    .join("|");

  // Match: "[prefix] Book Chapter [: or space] Verse"
  // Pattern handles:
  // - "john 3 16" → John 3:16
  // - "john 3:16" → John 3:16
  // - "1 john 3 16" → 1 John 3:16
  // - "judges 2 6" → Judges 2:6
  const pattern = new RegExp(
    `\\b((?:1|2|3)\\s+)?(${bookPatterns})\\s+(\\d+)(?:\\s*[:\\s,]\\s*(\\d+))?`,
    "i"
  );

  const match = normalized.match(pattern);
  if (!match) {
    // Log the miss for later review
    logMiss(text, "No book detected");
    return null;
  }

  const [, prefix, book, chapter, verse] = match;
  const fullBook = (prefix ? prefix.trim() + " " : "") + book;

  // Capitalize the book name properly
  const canonicalBook = getCanonicalBookName(fullBook);

  console.log(
    `📖 Extracted: ${canonicalBook || fullBook} ${chapter}${
      verse ? ":" + verse : ""
    } from "${text}"`
  );

  return {
    book: canonicalBook || fullBook,
    chapter: parseInt(chapter),
    verse: verse ? parseInt(verse) : undefined,
  };
}

/**
 * Get canonical book name with proper capitalization
 */
function getCanonicalBookName(normalizedBook: string): string | null {
  const lower = normalizedBook.toLowerCase();

  for (const [canonical, aliases] of Object.entries(BOOK_ALIASES)) {
    // Check if it matches the canonical name
    if (canonical.toLowerCase() === lower) {
      return canonical;
    }
    // Check aliases
    for (const alias of aliases) {
      if (alias === lower) {
        return canonical;
      }
    }
  }

  return null;
}
