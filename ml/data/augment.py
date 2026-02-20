"""
Data Augmentation for Bible Reference Training
Simulates common speech recognition errors:
- Character-level misspellings
- Word splitting (ASR tokenization errors)
- Accent/pronunciation variations
"""
import random

# Character-level noise (common ASR mistakes)
CHAR_NOISE = {
    "th": ["t", "d"],
    "ph": ["f"],
    "oo": ["u"],
    "ee": ["i"],
    "ou": ["o"],
    "ck": ["k"],
    "tt": ["t"],
    "h": [""],
    "wh": ["w"],
    "ght": ["t"],
    "tion": ["shun", "sion"],
}

def misspell(text: str) -> str:
    """Apply character-level noise to simulate ASR errors"""
    t = text
    for k, v in CHAR_NOISE.items():
        if k in t and random.random() < 0.4:
            t = t.replace(k, random.choice(v), 1)
    return t


def split_words(text: str) -> str:
    """Randomly split words to simulate ASR tokenization errors"""
    words = text.split()
    out = []

    for w in words:
        if len(w) > 4 and random.random() < 0.3:
            split = random.randint(2, len(w) - 2)
            out.append(w[:split])
            out.append(w[split:])
        else:
            out.append(w)

    return " ".join(out)


# Accent/pronunciation variations
ACCENT_MAP = {
    "er": ["a", "ah"],
    "or": ["o"],
    "ion": ["shun"],
    "s": ["sh"],
    "z": ["s"],
    "ch": ["sh", "tch"],
    "j": ["g"],
}

def accent_noise(text: str) -> str:
    """Apply accent/pronunciation variations"""
    t = text
    for k, v in ACCENT_MAP.items():
        if k in t and random.random() < 0.3:
            t = t.replace(k, random.choice(v), 1)
    return t


# Word-level variations (homophones, common mishearings)
WORD_NOISE = {
    "corinthians": ["korinthians", "crinthians", "corinthans"],
    "thessalonians": ["thesalonians", "thessolonians"],
    "ecclesiastes": ["eclesiastes", "ecclesiasties"],
    "deuteronomy": ["duteronomy", "deuteronomey"],
    "philippians": ["philipians", "filipians"],
    "colossians": ["colosians", "colossans"],
    "galatians": ["galatians", "galations"],
    "revelation": ["revelations", "revalation"],
    "psalm": ["salm", "som"],
    "psalms": ["salms", "soms"],
    "proverbs": ["proverb", "proverbes"],
    "chapter": ["chaper", "chaptor"],
    "verse": ["vers", "versh"],
}

def word_noise(text: str) -> str:
    """Apply word-level noise for common mishearings"""
    t = text
    for k, v in WORD_NOISE.items():
        if k in t and random.random() < 0.25:
            t = t.replace(k, random.choice(v), 1)
    return t


def corrupt(text: str) -> str:
    """Apply all noise transformations to simulate real ASR output"""
    t = text.lower()
    t = misspell(t)
    t = word_noise(t)
    t = split_words(t)
    t = accent_noise(t)
    # Clean up double spaces
    t = " ".join(t.split())
    return t


def generate_variants(text: str, n: int = 5) -> list[str]:
    """Generate n corrupted variants of a clean text"""
    variants = [text.lower()]  # Include clean version
    for _ in range(n - 1):
        variants.append(corrupt(text))
    return list(set(variants))  # Remove duplicates


if __name__ == "__main__":
    # Test the augmentation
    test_phrases = [
        "john chapter three verse sixteen",
        "first corinthians thirteen",
        "revelation twenty one",
        "psalm twenty three",
    ]
    
    for phrase in test_phrases:
        print(f"\nOriginal: {phrase}")
        print("Variants:")
        for v in generate_variants(phrase, 5):
            print(f"  - {v}")
