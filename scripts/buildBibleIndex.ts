/**
 * Build Bible Index
 * Extracts all verses from bible.db and creates a normalized word index
 * Run with: npx ts-node scripts/buildBibleIndex.ts
 */

import * as Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

// Book names mapping (matches main.ts)
const bookNames: Record<number, string> = {
  0: "Genesis",
  1: "Exodus",
  2: "Leviticus",
  3: "Numbers",
  4: "Deuteronomy",
  5: "Joshua",
  6: "Judges",
  7: "Ruth",
  8: "1 Samuel",
  9: "2 Samuel",
  10: "1 Kings",
  11: "2 Kings",
  12: "1 Chronicles",
  13: "2 Chronicles",
  14: "Ezra",
  15: "Nehemiah",
  16: "Esther",
  17: "Job",
  18: "Psalms",
  19: "Proverbs",
  20: "Ecclesiastes",
  21: "Song of Solomon",
  22: "Isaiah",
  23: "Jeremiah",
  24: "Lamentations",
  25: "Ezekiel",
  26: "Daniel",
  27: "Hosea",
  28: "Joel",
  29: "Amos",
  30: "Obadiah",
  31: "Jonah",
  32: "Micah",
  33: "Nahum",
  34: "Habakkuk",
  35: "Zephaniah",
  36: "Haggai",
  37: "Zechariah",
  38: "Malachi",
  39: "Matthew",
  40: "Mark",
  41: "Luke",
  42: "John",
  43: "Acts",
  44: "Romans",
  45: "1 Corinthians",
  46: "2 Corinthians",
  47: "Galatians",
  48: "Ephesians",
  49: "Philippians",
  50: "Colossians",
  51: "1 Thessalonians",
  52: "2 Thessalonians",
  53: "1 Timothy",
  54: "2 Timothy",
  55: "Titus",
  56: "Philemon",
  57: "Hebrews",
  58: "James",
  59: "1 Peter",
  60: "2 Peter",
  61: "1 John",
  62: "2 John",
  63: "3 John",
  64: "Jude",
  65: "Revelation",
};

function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function main() {
  // Find database
  const dbPath = path.join(process.cwd(), "bible.db");
  if (!fs.existsSync(dbPath)) {
    console.error("❌ bible.db not found at:", dbPath);
    process.exit(1);
  }

  console.log("📖 Opening database:", dbPath);
  const db = new (Database as any)(dbPath);

  // Query all verses
  const rows = db
    .prepare(
      `
    SELECT Book, Chapter, Versecount, verse as text 
    FROM bible 
    ORDER BY Book, Chapter, Versecount
  `
    )
    .all() as {
    Book: number;
    Chapter: number;
    Versecount: number;
    text: string;
  }[];

  console.log(`📊 Found ${rows.length} verses`);

  // Build index
  const verseIndex = rows.map((row) => ({
    ref: `${bookNames[row.Book]} ${row.Chapter}:${row.Versecount}`,
    bookId: row.Book,
    chapter: row.Chapter,
    verse: row.Versecount,
    words: normalizeText(row.text),
  }));

  // Write output
  const outputDir = path.join(process.cwd(), "electron", "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "bible_index.json");
  fs.writeFileSync(outputPath, JSON.stringify(verseIndex, null, 2));

  console.log(`✅ Bible index built: ${verseIndex.length} verses`);
  console.log(`📁 Output: ${outputPath}`);

  db.close();
}

main();
