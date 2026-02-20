"""
Canonical Book Aliases and Number Normalization
This is the source of truth for handling ASR errors
"""

# Book name aliases - handles common ASR mishearings
BOOK_ALIASES: dict[str, list[str]] = {
    "Genesis": [
        "genesis", "genes is", "jenesis", "gen is", "gen"
    ],
    "Exodus": [
        "exodus", "ex o dus", "eksodus", "egzodus", "exo dus"
    ],
    "Leviticus": [
        "leviticus", "levi ticus", "levitikas", "levi ticas"
    ],
    "Numbers": [
        "numbers", "numbas", "num bers", "numberss"
    ],
    "Deuteronomy": [
        "deuteronomy", "deutronomy", "deut er onomy", "dueteronomy"
    ],

    "Joshua": ["joshua", "josh u a", "josh"],
    "Judges": ["judges", "judjes", "jud ges"],
    "Ruth": ["ruth", "root"],
    
    "1 Samuel": [
        "1 samuel", "first samuel", "samuel one", "samuel 1", "one samuel"
    ],
    "2 Samuel": [
        "2 samuel", "second samuel", "samuel two", "samuel 2", "two samuel"
    ],
    "1 Kings": [
        "1 kings", "first kings", "kings one", "kings 1", "one kings"
    ],
    "2 Kings": [
        "2 kings", "second kings", "kings two", "kings 2", "two kings"
    ],
    "1 Chronicles": [
        "1 chronicles", "first chronicles", "chronicles one", "one chronicles"
    ],
    "2 Chronicles": [
        "2 chronicles", "second chronicles", "chronicles two", "two chronicles"
    ],
    
    "Ezra": ["ezra", "ez ra"],
    "Nehemiah": ["nehemiah", "nee a my a", "ne he miah"],
    "Esther": ["esther", "es ter"],
    "Job": ["job", "jobe"],
    
    "Psalms": [
        "psalms", "psalm", "salms", "sams", "songs", "sam"
    ],
    "Proverbs": [
        "proverbs", "pro verbs", "provabs", "proverb"
    ],
    "Ecclesiastes": [
        "ecclesiastes", "ecclesiastis", "eclesiastes", "ecclesi asties"
    ],
    "Song of Solomon": [
        "song of solomon", "song of songs", "songs of solomon", "song songs"
    ],

    "Isaiah": ["isaiah", "isaya", "izaya", "i say a"],
    "Jeremiah": ["jeremiah", "jeremiya", "jeramaya", "jerry my a"],
    "Lamentations": ["lamentations", "lament ations", "lamen tations"],
    "Ezekiel": ["ezekiel", "eze kyle", "ezikel", "e zekiel"],
    "Daniel": ["daniel", "dan yel", "danyel"],
    
    "Hosea": ["hosea", "ho zay a"],
    "Joel": ["joel", "joe l"],
    "Amos": ["amos", "aim us"],
    "Obadiah": ["obadiah", "oba dye a"],
    "Jonah": ["jonah", "jo na"],
    "Micah": ["micah", "my ka"],
    "Nahum": ["nahum", "nay hum"],
    "Habakkuk": ["habakkuk", "ha back uk", "habakuk"],
    "Zephaniah": ["zephaniah", "zef a nye a"],
    "Haggai": ["haggai", "hag eye"],
    "Zechariah": ["zechariah", "zeck a rye a"],
    "Malachi": ["malachi", "mal a ky"],

    "Matthew": [
        "matthew", "mathew", "mat stew", "math you", "matt you", "mat you"
    ],
    "Mark": ["mark", "mak", "marc"],
    "Luke": ["luke", "look", "luk", "luuk"],
    "John": ["john", "jon", "jawn", "jaan"],

    "Acts": ["acts", "act", "aks", "ax"],
    "Romans": ["romans", "rowmans", "romins", "romanz"],

    "1 Corinthians": [
        "1 corinthians", "first corinthians",
        "corinthians one", "fast corinthians", "core into shians",
        "one corinthians"
    ],
    "2 Corinthians": [
        "2 corinthians", "second corinthians",
        "corinthians two", "two corinthians"
    ],

    "Galatians": ["galatians", "galashians", "galations", "gala shuns"],
    "Ephesians": ["ephesians", "efeeshians", "efesians", "e fee shuns"],
    "Philippians": ["philippians", "philipians", "flipians", "fill ip e uns"],
    "Colossians": ["colossians", "colashians", "co losh uns"],

    "1 Thessalonians": [
        "1 thessalonians", "first thessalonians",
        "the salon onions one", "thessalonians one", "one thessalonians"
    ],
    "2 Thessalonians": [
        "2 thessalonians", "second thessalonians",
        "the salon onions two", "thessalonians two", "two thessalonians"
    ],

    "1 Timothy": ["1 timothy", "first timothy", "timothy one", "one timothy"],
    "2 Timothy": ["2 timothy", "second timothy", "timothy two", "two timothy"],
    "Titus": ["titus", "tight us", "tie tus"],
    "Philemon": ["philemon", "filemon", "fill e mon"],
    "Hebrews": ["hebrews", "heb ruse", "he brews"],
    "James": ["james", "jams", "jamz"],
    "1 Peter": ["1 peter", "first peter", "peter one", "one peter"],
    "2 Peter": ["2 peter", "second peter", "peter two", "two peter"],
    "1 John": ["1 john", "first john", "john one", "one john"],
    "2 John": ["2 john", "second john", "john two", "two john"],
    "3 John": ["3 john", "third john", "john three", "three john"],
    "Jude": ["jude", "jud", "jood"],
    "Revelation": ["revelation", "revelations", "rev elation", "revel ation"]
}

# Number aliases - handles ASR mishearings of spoken numbers
NUMBER_ALIASES: dict[str, int] = {
    "zero": 0,
    "one": 1, "won": 1,
    "two": 2, "to": 2, "too": 2,
    "three": 3, "tree": 3,
    "four": 4, "for": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8, "ate": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16, "six tin": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
    "twenty one": 21, "twenty two": 22, "twenty three": 23, "twenty four": 24,
    "twenty five": 25, "twenty six": 26, "twenty seven": 27, "twenty eight": 28,
    "twenty nine": 29,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    
    # Ordinal forms
    "first": 1, "second": 2, "third": 3,
}

# Build reverse lookup: alias -> canonical book name
def build_alias_map() -> dict[str, str]:
    """Build a mapping from all aliases to canonical book names"""
    result = {}
    for book, aliases in BOOK_ALIASES.items():
        for alias in aliases:
            result[alias] = book
    return result

ALIAS_TO_BOOK = build_alias_map()

# Book ID mapping for database
BOOK_IDS: dict[str, int] = {
    "Genesis": 0, "Exodus": 1, "Leviticus": 2, "Numbers": 3, "Deuteronomy": 4,
    "Joshua": 5, "Judges": 6, "Ruth": 7, "1 Samuel": 8, "2 Samuel": 9,
    "1 Kings": 10, "2 Kings": 11, "1 Chronicles": 12, "2 Chronicles": 13,
    "Ezra": 14, "Nehemiah": 15, "Esther": 16, "Job": 17, "Psalms": 18,
    "Proverbs": 19, "Ecclesiastes": 20, "Song of Solomon": 21, "Isaiah": 22,
    "Jeremiah": 23, "Lamentations": 24, "Ezekiel": 25, "Daniel": 26,
    "Hosea": 27, "Joel": 28, "Amos": 29, "Obadiah": 30, "Jonah": 31,
    "Micah": 32, "Nahum": 33, "Habakkuk": 34, "Zephaniah": 35, "Haggai": 36,
    "Zechariah": 37, "Malachi": 38, "Matthew": 39, "Mark": 40, "Luke": 41,
    "John": 42, "Acts": 43, "Romans": 44, "1 Corinthians": 45, "2 Corinthians": 46,
    "Galatians": 47, "Ephesians": 48, "Philippians": 49, "Colossians": 50,
    "1 Thessalonians": 51, "2 Thessalonians": 52, "1 Timothy": 53, "2 Timothy": 54,
    "Titus": 55, "Philemon": 56, "Hebrews": 57, "James": 58, "1 Peter": 59,
    "2 Peter": 60, "1 John": 61, "2 John": 62, "3 John": 63, "Jude": 64,
    "Revelation": 65,
}
