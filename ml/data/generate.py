"""
Training Data Generator for Bible Reference Resolver
Generates synthetic spoken phrases with augmentation for ASR noise
"""
import json
import random
from pathlib import Path

# Import augmentation
from augment import corrupt, generate_variants

BOOKS = {
    "Genesis": ["genesis"],
    "Exodus": ["exodus"],
    "Leviticus": ["leviticus"],
    "Numbers": ["numbers"],
    "Deuteronomy": ["deuteronomy"],
    "Joshua": ["joshua"],
    "Judges": ["judges"],
    "Ruth": ["ruth"],
    "1 Samuel": ["first samuel", "1 samuel", "one samuel"],
    "2 Samuel": ["second samuel", "2 samuel", "two samuel"],
    "1 Kings": ["first kings", "1 kings", "one kings"],
    "2 Kings": ["second kings", "2 kings", "two kings"],
    "1 Chronicles": ["first chronicles", "1 chronicles"],
    "2 Chronicles": ["second chronicles", "2 chronicles"],
    "Ezra": ["ezra"],
    "Nehemiah": ["nehemiah"],
    "Esther": ["esther"],
    "Job": ["job"],
    "Psalm": ["psalm", "psalms"],
    "Proverbs": ["proverbs"],
    "Ecclesiastes": ["ecclesiastes"],
    "Song of Solomon": ["song of songs", "song of solomon"],
    "Isaiah": ["isaiah"],
    "Jeremiah": ["jeremiah"],
    "Lamentations": ["lamentations"],
    "Ezekiel": ["ezekiel"],
    "Daniel": ["daniel"],
    "Hosea": ["hosea"],
    "Joel": ["joel"],
    "Amos": ["amos"],
    "Obadiah": ["obadiah"],
    "Jonah": ["jonah"],
    "Micah": ["micah"],
    "Nahum": ["nahum"],
    "Habakkuk": ["habakkuk"],
    "Zephaniah": ["zephaniah"],
    "Haggai": ["haggai"],
    "Zechariah": ["zechariah"],
    "Malachi": ["malachi"],
    "Matthew": ["matthew"],
    "Mark": ["mark"],
    "Luke": ["luke"],
    "John": ["john"],
    "Acts": ["acts", "acts of the apostles"],
    "Romans": ["romans"],
    "1 Corinthians": ["first corinthians", "1 corinthians"],
    "2 Corinthians": ["second corinthians", "2 corinthians"],
    "Galatians": ["galatians"],
    "Ephesians": ["ephesians"],
    "Philippians": ["philippians"],
    "Colossians": ["colossians"],
    "1 Thessalonians": ["first thessalonians", "1 thessalonians"],
    "2 Thessalonians": ["second thessalonians", "2 thessalonians"],
    "1 Timothy": ["first timothy", "1 timothy"],
    "2 Timothy": ["second timothy", "2 timothy"],
    "Titus": ["titus"],
    "Philemon": ["philemon"],
    "Hebrews": ["hebrews"],
    "James": ["james"],
    "1 Peter": ["first peter", "1 peter"],
    "2 Peter": ["second peter", "2 peter"],
    "1 John": ["first john", "1 john"],
    "2 John": ["second john", "2 john"],
    "3 John": ["third john", "3 john"],
    "Jude": ["jude"],
    "Revelation": ["revelation", "revelations"],
}

TEMPLATES = [
    # Simple references
    "{book} {chapter}",
    "{book} {chapter} {verse}",
    "{book} chapter {chapter}",
    "{book} chapter {chapter} verse {verse}",
    "{book} {chapter} verse {verse}",
    
    # With prepositions
    "turn to {book} {chapter}",
    "go to {book} {chapter} {verse}",
    "look at {book} chapter {chapter}",
    "read {book} {chapter}",
    "in {book} {chapter} {verse}",
    "from {book} chapter {chapter}",
    
    # Sermon style
    "let us read {book} {chapter}",
    "we read in {book} {chapter} {verse}",
    "the scripture says in {book} {chapter}",
    "as it is written in {book} {chapter} {verse}",
    "the bible says in {book} chapter {chapter}",
    
    # Casual style
    "check out {book} {chapter}",
    "{book} {chapter} starting at verse {verse}",
    "open your bibles to {book} {chapter}",
]


def generate_clean_example():
    """Generate a single clean training example"""
    book, aliases = random.choice(list(BOOKS.items()))
    alias = random.choice(aliases)
    
    chapter = random.randint(1, 30)
    verse = random.choice([None, random.randint(1, 35)])
    
    template = random.choice(TEMPLATES)
    
    text = template.format(
        book=alias,
        chapter=chapter,
        verse=verse if verse else ""
    ).strip()
    
    # Clean up double spaces
    text = " ".join(text.split())
    
    return {
        "text": text.lower(),
        "book": book,
        "chapter": chapter,
        "verse": verse
    }


def generate_examples(clean_text: str, label: dict, n: int = 5) -> list[dict]:
    """Generate multiple corrupted variants of a clean example"""
    rows = []
    for _ in range(n):
        rows.append({
            "text": corrupt(clean_text),
            **label
        })
    return rows


def generate_dataset(n_base: int = 1000, variants_per_example: int = 5) -> list[dict]:
    """Generate full training dataset with augmentation"""
    rows = []
    
    for _ in range(n_base):
        example = generate_clean_example()
        clean_text = example["text"]
        label = {
            "book": example["book"],
            "chapter": example["chapter"],
            "verse": example["verse"]
        }
        
        # Add clean version
        rows.append(example)
        
        # Add corrupted variants
        rows.extend(generate_examples(clean_text, label, variants_per_example))
    
    return rows


def save_dataset(rows: list[dict], path: str = "bible_resolver.jsonl"):
    """Save dataset as JSONL"""
    with open(path, "w") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")
    print(f"✅ Saved {len(rows)} examples to {path}")


if __name__ == "__main__":
    print("🎲 Generating training data...")
    
    # Generate 1000 base examples × 6 variants each = 6000 training examples
    data = generate_dataset(n_base=1000, variants_per_example=5)
    
    save_dataset(data, "bible_resolver.jsonl")
    
    # Show some examples
    print("\n📋 Sample examples:")
    for row in random.sample(data, 5):
        print(f"  '{row['text']}' → {row['book']} {row['chapter']}:{row['verse']}")
