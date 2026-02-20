"""
Scripture Session Manager
Handles advanced preaching behaviors:
1. Book + Chapter → wait 2s → default to verse 1
2. Verse range → display in chunks of 3
3. Auto-advance on "next"/"continue" commands
4. Explicit verse jump
"""
import re
import time
from dataclasses import dataclass, field
from typing import Optional, Callable
import threading

from aliases import BOOK_IDS
from normalize import normalize_text


@dataclass
class ScriptureSession:
    """Holds the current scripture reading session state"""
    book: Optional[str] = None
    chapter: Optional[int] = None
    start_verse: int = 1
    end_verse: Optional[int] = None  # None = single verse mode
    current_verse: int = 1
    chunk_size: int = 3
    is_range_mode: bool = False
    last_updated: float = 0.0
    
    def get_current_chunk(self) -> tuple[int, int]:
        """Get the current verse range to display"""
        if not self.is_range_mode or self.end_verse is None:
            return (self.current_verse, self.current_verse)
        
        start = self.current_verse
        end = min(start + self.chunk_size - 1, self.end_verse)
        return (start, end)
    
    def can_advance(self) -> bool:
        """Check if there are more verses to show"""
        if not self.is_range_mode or self.end_verse is None:
            return False
        return self.current_verse + self.chunk_size <= self.end_verse
    
    def advance(self) -> bool:
        """Move to next chunk, returns True if advanced"""
        if not self.can_advance():
            return False
        self.current_verse += self.chunk_size
        self.last_updated = time.time()
        return True
    
    def to_reference_string(self) -> str:
        """Format current position as string"""
        if not self.book or not self.chapter:
            return ""
        
        start, end = self.get_current_chunk()
        if start == end:
            return f"{self.book} {self.chapter}:{start}"
        return f"{self.book} {self.chapter}:{start}-{end}"
    
    def to_dict(self) -> dict:
        """Convert to dict for IPC"""
        start, end = self.get_current_chunk()
        return {
            "book": self.book,
            "bookId": BOOK_IDS.get(self.book) if self.book else None,
            "chapter": self.chapter,
            "verse": start,
            "endVerse": end if end != start else None,
            "rangeEnd": self.end_verse if self.is_range_mode else None,
            "isRange": self.is_range_mode,
            "canAdvance": self.can_advance(),
        }


# Global session
_session = ScriptureSession()

# Chapter timer for auto-defaulting to verse 1
_chapter_timer: Optional[threading.Timer] = None

# Callback for emitting updates
_emit_callback: Optional[Callable] = None


# Commands that trigger "next"
NEXT_COMMANDS = [
    "next verse",
    "next",
    "continue",
    "go on",
    "keep going",
    "move on",
]

# Commands that trigger "previous"
PREVIOUS_COMMANDS = [
    "previous verse",
    "previous",
    "go back",
    "back",
    "last verse",
    "before",
]

# Command debounce (in seconds)
COMMAND_DEBOUNCE = 0.8
_last_command_time: float = 0.0


def set_emit_callback(callback: Callable):
    """Set the callback for emitting session updates"""
    global _emit_callback
    _emit_callback = callback


def emit_session():
    """Emit current session to frontend"""
    if _emit_callback and _session.book and _session.chapter:
        _emit_callback(_session.to_dict())
        print(f"📖 Session: {_session.to_reference_string()}")


def _cancel_chapter_timer():
    """Cancel pending chapter timer"""
    global _chapter_timer
    if _chapter_timer:
        _chapter_timer.cancel()
        _chapter_timer = None


def _on_chapter_timeout():
    """Called when chapter timer expires - default to verse 1"""
    global _session
    if _session.book and _session.chapter and _session.current_verse is None:
        _session.current_verse = 1
        _session.start_verse = 1
        _session.is_range_mode = False
        print(f"⏱️ Auto-defaulting to verse 1: {_session.to_reference_string()}")
        emit_session()


def on_book_detected(book: str):
    """Handle new book detection"""
    global _session
    _cancel_chapter_timer()
    
    _session = ScriptureSession(
        book=book,
        chapter=None,
        last_updated=time.time()
    )
    print(f"📚 Book detected: {book}")


def on_chapter_detected(book: str, chapter: int):
    """Handle chapter detection - start 2s timer for verse"""
    global _session, _chapter_timer
    
    _cancel_chapter_timer()
    
    _session.book = book
    _session.chapter = chapter
    _session.current_verse = 1  # Default, but don't emit yet
    _session.is_range_mode = False
    _session.last_updated = time.time()
    
    print(f"📑 Chapter detected: {book} {chapter} (waiting 2s for verse...)")
    
    # Start timer - if no verse comes in 3s, default to verse 1
    _chapter_timer = threading.Timer(3.0, _on_chapter_timeout)
    _chapter_timer.start()


def on_verse_detected(book: str, chapter: int, verse: int):
    """Handle single verse detection"""
    global _session
    
    # Cancel chapter timer since we got a verse
    _cancel_chapter_timer()
    
    _session.book = book
    _session.chapter = chapter
    _session.current_verse = verse
    _session.start_verse = verse
    _session.end_verse = None
    _session.is_range_mode = False
    _session.last_updated = time.time()
    
    emit_session()


def on_range_detected(book: str, chapter: int, start: int, end: int):
    """Handle verse range detection (e.g., 'verses 4 to 9')"""
    global _session
    
    _cancel_chapter_timer()
    
    _session.book = book
    _session.chapter = chapter
    _session.start_verse = start
    _session.end_verse = end
    _session.current_verse = start
    _session.is_range_mode = True
    _session.last_updated = time.time()
    
    print(f"📖 Range detected: {book} {chapter}:{start}-{end}")
    emit_session()


def on_explicit_verse(verse: int):
    """Handle explicit verse jump (e.g., 'verse 7')"""
    global _session
    
    if not _session.book or not _session.chapter:
        return
    
    _cancel_chapter_timer()
    
    _session.current_verse = verse
    _session.start_verse = verse
    _session.end_verse = None
    _session.is_range_mode = False
    _session.last_updated = time.time()
    
    emit_session()


def on_next_command():
    """Handle 'next'/'continue' command"""
    global _session
    
    if _session.book and _session.chapter and _session.current_verse:
        _session.current_verse += 1
        _session.start_verse = _session.current_verse
        _session.end_verse = _session.current_verse
        _session.is_range_mode = False
        _session.last_updated = time.time()
        print(f"⏭️ Advancing to verse {_session.current_verse}")
        emit_session()


def on_previous_command():
    """Handle 'previous'/'go back' command"""
    global _session
    
    if _session.book and _session.chapter and _session.current_verse and _session.current_verse > 1:
        _session.current_verse -= 1
        _session.start_verse = _session.current_verse
        _session.end_verse = _session.current_verse
        _session.is_range_mode = False
        _session.last_updated = time.time()
        print(f"⏮️ Going back to verse {_session.current_verse}")
        emit_session()


def detect_range(text: str) -> Optional[tuple[int, int]]:
    """Detect verse range patterns like 'verse 2 to 3' or '4 through 9'"""
    text_lower = text.lower()
    
    patterns = [
        # "verse 2 to 3" or "verses 2 to 3"
        r'verses?\s*(\d+)\s*(?:to|through|thru|and|-|,)\s*(\d+)',
        # "2 to 3" standalone (now supports 'and' and ',')
        r'(\d+)\s*(?:to|through|thru|-|and|,)\s*(\d+)',
        # "from verse 2 to verse 3"
        r'from\s*(?:verse\s*)?(\d+)\s*(?:to|through|thru)\s*(?:verse\s*)?(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            start = int(match.group(1))
            end = int(match.group(2))
            if end > start:  # Valid range
                print(f"📊 Range pattern matched: {start} to {end}")
                return (start, end)
    return None


def is_next_command(text: str) -> bool:
    """Check if text contains a next/continue command"""
    text_lower = text.lower()
    return any(cmd in text_lower for cmd in NEXT_COMMANDS)


def is_previous_command(text: str) -> bool:
    """Check if text contains a previous/back command"""
    text_lower = text.lower()
    return any(cmd in text_lower for cmd in PREVIOUS_COMMANDS)


def check_command_debounce() -> bool:
    """Check if enough time has passed since last command"""
    global _last_command_time
    now = time.time()
    if now - _last_command_time < COMMAND_DEBOUNCE:
        print("⏭️ Command debounced (too fast)")
        return False
    _last_command_time = now
    return True


def process_text(text: str) -> Optional[dict]:
    """
    Process incoming text and update session.
    Returns session dict if update occurred, None otherwise.
    """
    global _session
    
    normalized = normalize_text(text)
    
    # Check for next/continue commands (with debounce)
    if is_next_command(text):
        if check_command_debounce():
            print("⏭️ Next command detected")
            on_next_command()
            return _session.to_dict() if _session.book else None
        return None
    
    # Check for previous/back commands (with debounce)
    if is_previous_command(text):
        if check_command_debounce():
            print("⏮️ Previous command detected")
            on_previous_command()
            return _session.to_dict() if _session.book else None
        return None
    
    # Check for verse range
    verse_range = detect_range(text)
    
    # Import here to avoid circular dependency
    from state_machine import detect_book, extract_numbers
    
    book = detect_book(normalized)
    numbers = extract_numbers(normalized)
    
    # Handle different cases
    if book and len(numbers) >= 1:
        chapter = numbers[0]
        
        if verse_range:
            # Range detected: "Genesis 1:4-9"
            on_range_detected(book, chapter, verse_range[0], verse_range[1])
            return _session.to_dict()
        elif len(numbers) >= 2:
            # Book + chapter + verse
            on_verse_detected(book, chapter, numbers[1])
            return _session.to_dict()
        else:
            # Book + chapter only - start timer
            on_chapter_detected(book, chapter)
            return None  # Don't emit yet, wait for timer
    
    elif _session.book and _session.chapter:
        # No book in text, but we have active session
        
        if verse_range:
            on_range_detected(_session.book, _session.chapter, verse_range[0], verse_range[1])
            return _session.to_dict()
        
        # Check for "verse X" pattern
        verse_match = re.search(r'verse\s*(\d+)', normalized)
        if verse_match:
            on_explicit_verse(int(verse_match.group(1)))
            return _session.to_dict()
        
        # Just numbers - might be verse update
        if len(numbers) == 1 and "verse" in text.lower():
            on_explicit_verse(numbers[0])
            return _session.to_dict()
    
    return None


def get_session() -> ScriptureSession:
    """Get current session"""
    return _session


def reset_session():
    """Reset the session"""
    global _session
    _cancel_chapter_timer()
    _session = ScriptureSession()


# Test
if __name__ == "__main__":
    import time as t
    
    def test_emit(data):
        print(f"  → EMIT: {data}")
    
    set_emit_callback(test_emit)
    
    print("\n🧪 Testing Session Manager:\n")
    
    tests = [
        ("mark chapter 3", 2.5),  # Should auto-default to verse 1
        ("genesis 1 4", 0),
        ("verse 5", 0),
        ("next verse", 0),
        ("genesis 1 verse 4 to 9", 0),
        ("next", 0),
        ("next", 0),
    ]
    
    for text, delay in tests:
        print(f"\n  Input: '{text}'")
        process_text(text)
        if delay:
            print(f"  (waiting {delay}s...)")
            t.sleep(delay)
