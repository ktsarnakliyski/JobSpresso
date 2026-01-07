# backend/app/services/scoring.py

import re
import textstat
from typing import Optional


# Bias word lists - only genuinely problematic terms
# Note: We intentionally exclude legitimate professional qualities like
# "analytical", "competitive", "collaborative" - these are valid job requirements.
# Research on gender-coded language suggests IMBALANCE matters, not individual words.
# This list focuses on terms that are genuinely exclusionary or problematic.
BIAS_WORD_LISTS = {
    "problematic": [
        # Tech bro culture - exclusionary jargon
        "ninja",
        "rockstar",
        "guru",
        "wizard",
        "superhero",
        "unicorn",
        # Potentially discriminatory phrases
        "culture fit",  # Often used to justify discrimination
        "native English speaker",  # National origin discrimination
        # Unrealistic expectations
        "hit the ground running",  # No onboarding = red flag
        "wear many hats",  # Understaffed = red flag
        "fast-paced environment",  # Often means chaotic/burnout
        "work hard play hard",  # Often means overwork culture
    ],
    "ageist": [
        # Young bias
        "young",
        "digital native",  # Age discrimination (kept here only)
        "recent graduate",
        "fresh",
        "early career only",
        # Old bias
        "overqualified",
    ],
}


def calculate_readability_score(text: str) -> float:
    """
    Calculate readability score (0-100).
    Target: 6th-8th grade reading level.
    Uses Flesch-Kincaid Grade Level.
    """
    if not text.strip():
        return 0

    # Get Flesch-Kincaid Grade Level (lower = easier to read)
    grade_level = textstat.flesch_kincaid_grade(text)

    # Target is 6-8 grade level
    # Score 100 for grade 6-8, decrease for higher/lower
    if 6 <= grade_level <= 8:
        return 100
    elif grade_level < 6:
        # Simpler text is still good - minor penalty for being too simple
        # Grade 0-6 should score 80-100
        return max(80, 100 - (6 - grade_level) * 3)
    else:
        # Too complex - penalty increases with grade level
        penalty = (grade_level - 8) * 8
        return max(0, 100 - penalty)


def calculate_length_score(text: str) -> float:
    """
    Calculate length score (0-100).
    Optimal: 300-650 words.
    """
    word_count = len(text.split())

    if 300 <= word_count <= 650:
        return 100
    elif word_count < 300:
        # Too short - gradual penalty
        return max(50, 100 - (300 - word_count) * 0.25)
    elif word_count <= 700:
        # Slightly over - minor penalty
        return max(80, 100 - (word_count - 650) * 0.4)
    else:
        # Too long - steeper penalty
        return max(40, 100 - (word_count - 650) * 0.15)


def detect_structure_sections(text: str) -> dict[str, bool]:
    """
    Detect presence of common JD sections.
    Returns dict of section_type -> found.
    """
    text_lower = text.lower()

    section_patterns = {
        "about": [r"about\s+(us|the\s+company)", r"who\s+we\s+are", r"company\s+overview"],
        "role": [r"(the\s+)?role", r"position", r"what\s+you.?ll\s+do", r"responsibilities"],
        "requirements": [r"requirements?", r"qualifications?", r"what\s+you.?ll?\s+(need|bring)", r"must\s+have"],
        "benefits": [r"benefits?", r"what\s+we\s+offer", r"perks?", r"compensation"],
        "nice_to_have": [r"nice\s+to\s+have", r"bonus", r"preferred", r"plus"],
    }

    found = {}
    for section, patterns in section_patterns.items():
        found[section] = any(re.search(p, text_lower) for p in patterns)

    return found


def calculate_structure_score(text: str) -> float:
    """
    Calculate structure score (0-100).
    Checks for sections, bullet points, scanability.
    """
    sections = detect_structure_sections(text)
    score = 0

    # Core sections (weighted)
    if sections.get("about"):
        score += 15
    if sections.get("role"):
        score += 25
    if sections.get("requirements"):
        score += 30
    if sections.get("benefits"):
        score += 20

    # Nice to have section (bonus)
    if sections.get("nice_to_have"):
        score += 10

    # Check for bullet points or lists
    bullet_patterns = [r"^[\-\*\•]", r"^\d+\.", r"^[a-z]\)"]
    has_bullets = any(
        re.search(p, text, re.MULTILINE) for p in bullet_patterns
    )
    if has_bullets:
        score = min(100, score + 10)

    # Check for headers (markdown or plain)
    has_headers = bool(re.search(r"^#+\s|^[A-Z][A-Za-z\s]+:?\s*$", text, re.MULTILINE))
    if has_headers:
        score = min(100, score + 5)

    return min(100, score)


def detect_bias_words(text: str) -> dict[str, list[str]]:
    """
    Detect potentially biased words in text.
    Returns dict of bias_type -> list of found words.
    """
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))

    found = {}
    for bias_type, word_list in BIAS_WORD_LISTS.items():
        matches = [w for w in word_list if w in words or w in text_lower]
        if matches:
            found[bias_type] = matches

    return found


def check_completeness(text: str) -> dict[str, bool]:
    """
    Check for presence of key information.
    Returns dict of field -> present.
    """
    text_lower = text.lower()

    checks = {
        "salary": bool(re.search(
            r'\$\d|€\d|£\d|\d+k|\d{2},?\d{3}|salary|compensation|pay\s+range',
            text_lower
        )),
        "location": bool(re.search(
            r'remote|hybrid|on-?site|office|location|based\s+in|\bcity\b',
            text_lower
        )),
        "team_size": bool(re.search(
            r'\d+[\-\s]person|\d+\s+people|team\s+of\s+\d|small\s+team|large\s+team',
            text_lower
        )),
        "benefits": bool(re.search(
            r'benefits?|health|insurance|401k|pto|vacation|equity|stock',
            text_lower
        )),
        "requirements_listed": bool(re.search(
            r'requirements?|qualifications?|must\s+have|you.?ll\s+need',
            text_lower
        )),
    }

    return checks


def calculate_completeness_score(
    text: str, excluded_fields: Optional[set[str]] = None
) -> tuple[float, list[str]]:
    """
    Calculate completeness score and return missing elements.
    Excluded fields (from voice profile rules) are not penalized and not reported as missing.

    Returns (score, list of missing elements).
    """
    excluded = excluded_fields or set()
    checks = check_completeness(text)

    weights = {
        "salary": 30,  # Most important - research shows huge impact
        "location": 20,
        "requirements_listed": 25,
        "benefits": 15,
        "team_size": 10,
    }

    # Filter out excluded fields and redistribute weights proportionally
    active_weights = {k: v for k, v in weights.items() if k not in excluded}

    if active_weights:
        # Scale weights so they still sum to 100
        total_active_weight = sum(active_weights.values())
        scale_factor = 100 / total_active_weight

        score = sum(
            active_weights[k] * scale_factor
            for k, v in checks.items()
            if v and k not in excluded
        )
    else:
        # All fields excluded - default to perfect score
        score = 100

    # Only report missing fields that aren't excluded
    missing = [k for k, v in checks.items() if not v and k not in excluded]

    return score, missing
