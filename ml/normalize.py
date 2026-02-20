"""
Text Normalization for Bible Reference Detection
Runs BEFORE ML to clean up ASR output

Transforms:
  "look chapter 1 verse to" → "luke 1 2"
  "fast corinthians tree sixteen" → "1 corinthians 3 16"
"""
import re
from aliases import BOOK_ALIASES, NUMBER_ALIASES, ALIAS_TO_BOOK, BOOK_IDS


def normalize_text(text: str) -> str:
    """
    Normalize ASR text for Bible reference detection.
    
    Steps:
    1. Lowercase
    2. Replace book aliases with canonical names
    3. Replace number words with digits
    4. Remove filler words (chapter, verse, etc.)
    5. Clean up whitespace
    """
    t = text.lower().strip()
    
    # Normalize book aliases (longest first to avoid partial matches)
    # Sort aliases by length descending to match longer phrases first
    sorted_aliases = sorted(ALIAS_TO_BOOK.keys(), key=len, reverse=True)
    for alias in sorted_aliases:
        if alias in t:
            canonical = ALIAS_TO_BOOK[alias].lower()
            t = t.replace(alias, canonical, 1)
            break  # Only replace first book match
    
    # Normalize multi-word numbers first (e.g., "twenty one")
    multi_word_numbers = {k: v for k, v in NUMBER_ALIASES.items() if " " in k}
    for word, num in sorted(multi_word_numbers.items(), key=lambda x: len(x[0]), reverse=True):
        t = t.replace(word, str(num))
    
    # Normalize single-word numbers
    for word, num in NUMBER_ALIASES.items():
        if " " not in word:  # Skip multi-word (already handled)
            t = re.sub(rf'\b{re.escape(word)}\b', str(num), t)
    
    # Normalize verse keywords (versus, vs → verse)
    t = re.sub(r'\b(versus|vs|v)\b', 'verse', t)
    
    # Remove chapter keyword (but keep verse for state machine)
    t = re.sub(r'\b(chapter|chapters)\b', '', t)
    
    # Clean up whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    
    return t


def extract_reference(text: str) -> dict | None:
    """
    Extract Bible reference from normalized text.
    
    Input: "luke 1 2" or "1 corinthians 13" or "genesis 1"
    Output: {"book": "Luke", "chapter": 1, "verse": 2, "bookId": 41}
    """
    normalized = normalize_text(text)
    
    # Find book name
    found_book = None
    for book in BOOK_IDS.keys():
        book_lower = book.lower()
        if book_lower in normalized:
            found_book = book
            # Remove book from string to get numbers
            normalized = normalized.replace(book_lower, "").strip()
            break
    
    if not found_book:
        return None
    
    # Extract numbers
    numbers = re.findall(r'\d+', normalized)
    
    if not numbers:
        return None
    
    chapter = int(numbers[0])
    verse = int(numbers[1]) if len(numbers) > 1 else None
    
    return {
        "book": found_book,
        "bookId": BOOK_IDS[found_book],
        "chapter": chapter,
        "verse": verse,
        "confidence": 0.95
    }


# Test cases
if __name__ == "__main__":
    test_cases = [
        "Luke chapter 1 verse 2",
        "look chapter 1 verse to",
        "fast corinthians tree sixteen",
        "first corinthians 13 4",
        "john tree sixteen",
        "jon tree sixteen",
        "genesis one one",
        "genes is won won",
        "revelation twenty one",
        "sam twenty three",
        "the salon onions one four tree",
    ]
    
    print("🧪 Testing normalization:\n")
    for text in test_cases:
        normalized = normalize_text(text)
        ref = extract_reference(text)
        print(f"  Input:      '{text}'")
        print(f"  Normalized: '{normalized}'")
        print(f"  Reference:  {ref}")
        print()
