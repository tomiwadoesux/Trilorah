#!/usr/bin/env python3
"""
Bible Reference Resolver
Uses normalization + regex. Can be upgraded to ML later.
"""
import re
import json
import sys

from normalize import normalize_text, extract_reference
from aliases import BOOK_IDS


def resolve(text: str) -> dict | None:
    """
    Resolve a Bible reference from raw ASR text.
    
    1. Normalize text (fix ASR errors)
    2. Extract book, chapter, verse
    3. Return structured reference
    """
    # Use the new normalization + extraction
    result = extract_reference(text)
    
    if result:
        return result
    
    # Fallback: try with minimal normalization
    return extract_reference_fallback(text)


def extract_reference_fallback(text: str) -> dict | None:
    """Fallback regex-only extraction for edge cases"""
    text = text.lower().strip()
    
    # Simple pattern: book followed by numbers
    for book, book_id in BOOK_IDS.items():
        book_lower = book.lower()
        pattern = rf'\b{re.escape(book_lower)}\s*(\d+)(?:\s*[:\s,]\s*(\d+))?'
        match = re.search(pattern, text)
        
        if match:
            chapter = int(match.group(1))
            verse = int(match.group(2)) if match.group(2) else None
            
            return {
                "book": book,
                "bookId": book_id,
                "chapter": chapter,
                "verse": verse,
                "confidence": 0.8  # Lower confidence for fallback
            }
    
    return None


def main():
    """CLI interface for testing"""
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        result = resolve(text)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python resolver.py 'john chapter 3 verse 16'")
        print("\nExamples:")
        print("  python resolver.py 'look chapter 1 verse to'")
        print("  python resolver.py 'fast corinthians tree sixteen'")


if __name__ == "__main__":
    main()
