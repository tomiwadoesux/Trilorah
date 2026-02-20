/**
 * Phonetic Matching Engine
 * Uses Soundex algorithm for fuzzy book name matching
 */

/**
 * Generate Soundex code for a string
 * Used as a safe fallback when exact alias matching fails
 */
export function soundex(s: string): string {
  if (!s || s.length === 0) return "0000";

  const map: Record<string, string> = {
    b: "1",
    f: "1",
    p: "1",
    v: "1",
    c: "2",
    g: "2",
    j: "2",
    k: "2",
    q: "2",
    s: "2",
    x: "2",
    z: "2",
    d: "3",
    t: "3",
    l: "4",
    m: "5",
    n: "5",
    r: "6",
  };

  const clean = s.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length === 0) return "0000";

  const first = clean[0];
  let result = first.toUpperCase();
  let prev = map[first] || "";

  for (let i = 1; i < clean.length; i++) {
    const c = map[clean[i]] || "";
    if (c !== prev && c !== "") {
      result += c;
    }
    prev = c;
  }

  return (result + "000").slice(0, 4);
}
