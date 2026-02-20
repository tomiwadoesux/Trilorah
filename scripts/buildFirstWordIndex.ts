/**
 * Build First-Word Index
 * Creates a lookup table by first word for fast verse matching
 * Run with: npx ts-node scripts/buildFirstWordIndex.ts
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

function main() {
  const indexPath = path.join(
    process.cwd(),
    "electron",
    "data",
    "bible_index.json"
  );

  if (!fs.existsSync(indexPath)) {
    console.error(
      "❌ bible_index.json not found. Run buildBibleIndex.ts first."
    );
    process.exit(1);
  }

  console.log("📖 Loading verse index...");
  const verses: VerseEntry[] = JSON.parse(fs.readFileSync(indexPath, "utf8"));

  // Build first-word index
  const firstWordIndex: Record<string, number[]> = {};

  verses.forEach((v, i) => {
    if (v.words.length === 0) return;

    const first = v.words[0];
    if (!firstWordIndex[first]) {
      firstWordIndex[first] = [];
    }
    firstWordIndex[first].push(i);
  });

  // Write output
  const outputPath = path.join(
    process.cwd(),
    "electron",
    "data",
    "bible_first_word_index.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(firstWordIndex, null, 2));

  const uniqueWords = Object.keys(firstWordIndex).length;
  console.log(`✅ First-word index built`);
  console.log(`   ${uniqueWords} unique first words`);
  console.log(`   ${verses.length} verses indexed`);
  console.log(`📁 Output: ${outputPath}`);
}

main();
