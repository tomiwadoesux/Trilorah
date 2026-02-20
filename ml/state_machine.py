"""
Reference State Machine
Incrementally builds Bible references from partial ASR input

Example flow:
1. "John" → book = John
2. "chapter 3" → chapter = 3  
3. "verse 16" → verse = 16

This handles real preaching where references are spoken over time.
"""
from dataclasses import dataclass, field
from typing import Optional
import time
import re

from aliases import BOOK_ALIASES, BOOK_IDS


@dataclass
class RefState:
    book: Optional[str] = None
    chapter: Optional[int] = None
    verse: Optional[int] = None
    confidence: float = 0.0
    last_updated: float = 0.0
    
    def to_dict(self) -> dict:
        return {
            "book": self.book,
            "bookId": BOOK_IDS.get(self.book) if self.book else None,
            "chapter": self.chapter,
            "verse": self.verse,
            "confidence": self.confidence,
        }
    
    def is_complete(self) -> bool:
        """A reference is complete if we have at least book + chapter"""
        return self.book is not None and self.chapter is not None
    
    def as_string(self) -> str:
        if not self.book:
            return ""
        s = self.book
        if self.chapter:
            s += f" {self.chapter}"
            if self.verse:
                s += f":{self.verse}"
        return s


# Global state holder (per session)
_state = RefState()

# Timeout: reset state if no update for 30 seconds
STATE_TIMEOUT = 30.0


def extract_numbers(text: str) -> list[int]:
    """Extract ordered numbers from text"""
    return [int(n) for n in re.findall(r'\d+', text)]


def detect_book(text: str) -> Optional[str]:
    """
    Detect book name from normalized text.
    Assumes normalization already ran (so "look" → "luke" etc.)
    Returns canonical book name or None.
    """
    text_lower = text.lower()
    
    # Check for each canonical book name
    # Sort by length descending to match longer names first (e.g., "1 John" before "John")
    sorted_books = sorted(BOOK_IDS.keys(), key=len, reverse=True)
    
    for book in sorted_books:
        if book.lower() in text_lower:
            return book
    
    return None


def update_reference(normalized_text: str) -> Optional[dict]:
    """
    Update reference state from normalized text.
    Returns the updated state dict if changed, None otherwise.
    
    This is the heart of the state machine.
    """
    global _state
    
    now = time.time()
    
    # Check for timeout - reset state if stale
    if _state.last_updated > 0 and (now - _state.last_updated) > STATE_TIMEOUT:
        _state = RefState()
    
    detected_book = detect_book(normalized_text)
    numbers = extract_numbers(normalized_text)
    
    changed = False
    
    # BOOK UPDATE
    if detected_book and detected_book != _state.book:
        # New book detected - reset state
        _state = RefState(
            book=detected_book,
            chapter=None,
            verse=None,
            confidence=0.9,
            last_updated=now
        )
        changed = True
    
    # CHAPTER UPDATE
    # If we have text with "verse" keyword and one number, update verse not chapter
    is_verse_only = "verse" in normalized_text.lower() or "vs" in normalized_text.lower()
    
    if _state.book and len(numbers) >= 1:
        if is_verse_only and _state.chapter is not None and len(numbers) == 1:
            # "verse 17" - update verse, keep chapter
            new_verse = numbers[0]
            if _state.verse != new_verse:
                _state.verse = new_verse
                _state.confidence = 0.95
                _state.last_updated = now
                changed = True
        else:
            # Normal case: first number is chapter
            new_chapter = numbers[0]
            if _state.chapter != new_chapter:
                _state.chapter = new_chapter
                _state.verse = None  # Reset verse when chapter changes
                _state.confidence = 0.92
                _state.last_updated = now
                changed = True
    
    # VERSE UPDATE (from second number)
    if _state.book and len(numbers) >= 2:
        new_verse = numbers[1]
        if _state.verse != new_verse:
            _state.verse = new_verse
            _state.confidence = 0.95
            _state.last_updated = now
            changed = True
    
    # Only return if we have at least book + chapter
    if changed and _state.is_complete():
        return _state.to_dict()
    
    return None


def reset_state():
    """Reset the reference state"""
    global _state
    _state = RefState()


def get_current_state() -> RefState:
    """Get current state (for debugging)"""
    return _state


# Test cases
if __name__ == "__main__":
    print("🧪 Testing State Machine:\n")
    
    # Simulate a preacher speaking
    utterances = [
        "john",           # Partial - just book
        "john 3",         # Book + chapter
        "john 3 16",      # Complete
        "verse 17",       # Update verse only
        "genesis",        # New book - resets
        "genesis 1",      # New book + chapter
        "1 1",            # Chapter and verse
    ]
    
    for text in utterances:
        from normalize import normalize_text
        normalized = normalize_text(text)
        result = update_reference(normalized)
        
        print(f"  Input:  '{text}'")
        print(f"  Normal: '{normalized}'")
        print(f"  State:  {_state.as_string()}")
        print(f"  Emit:   {result}")
        print()
