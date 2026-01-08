# backend/app/services/field_mappings.py
"""
Centralized field mappings and constants for JobSpresso assessment.

This module provides a single source of truth for:
- Field keyword mappings (salary, compensation → salary field)
- Bias word definitions with categories and replacements
- Exclusion pattern detection
- Assessment category weights

Used by:
- AssessmentService._get_excluded_fields_from_profile()
- AssessmentService._issue_conflicts_with_exclusions()
- QuestionCoverageAnalyzer.analyze()
- scoring.py for bias word detection
- claude_service.py for improvement generation
"""
from typing import Optional

# Canonical mapping: field name -> list of keywords that indicate this field
# This is the single source of truth for all field/topic mappings
FIELD_KEYWORDS: dict[str, list[str]] = {
    "salary": ["salary", "compensation", "pay", "pay range", "wage"],
    "location": ["location", "remote", "hybrid", "on-site", "office"],
    "benefits": ["benefits", "perks", "insurance", "401k", "pto"],
    "team_size": ["team", "team_size", "team size", "team of", "person team"],
    "requirements_listed": ["requirements", "qualifications"],
}

# Reverse mapping: keyword -> field name (derived from FIELD_KEYWORDS)
# Used for detecting which field a keyword refers to
KEYWORD_TO_FIELD: dict[str, str] = {
    keyword: field
    for field, keywords in FIELD_KEYWORDS.items()
    for keyword in keywords
}

# Map question IDs to their corresponding field names
# Used by QuestionCoverageAnalyzer to skip questions for excluded fields
QUESTION_TO_FIELD: dict[str, str] = {
    "compensation": "salary",
    "remote_policy": "location",
    "benefits": "benefits",
    "team_culture": "team_size",
    "requirements_clarity": "requirements_listed",
}

# =============================================================================
# BIAS WORD DEFINITIONS
# =============================================================================
# Single source of truth for bias word detection and replacements.
# Note: We intentionally exclude legitimate professional qualities like
# "analytical", "competitive", "collaborative" - these are valid job requirements.
# Research on gender-coded language suggests IMBALANCE matters, not individual words.
# This list focuses on terms that are genuinely exclusionary or problematic.

# Consolidated bias terms with category and replacement
# Format: word -> {"category": str, "replacement": str}
BIAS_TERMS: dict[str, dict[str, str]] = {
    # Tech bro culture - exclusionary jargon
    "ninja": {"category": "problematic", "replacement": "expert"},
    "rockstar": {"category": "problematic", "replacement": "top performer"},
    "guru": {"category": "problematic", "replacement": "specialist"},
    "wizard": {"category": "problematic", "replacement": "expert"},
    "superhero": {"category": "problematic", "replacement": "high performer"},
    "unicorn": {"category": "problematic", "replacement": "versatile professional"},
    # Potentially discriminatory phrases
    "culture fit": {"category": "problematic", "replacement": "values alignment"},
    "native English speaker": {"category": "problematic", "replacement": "fluent English speaker"},
    # Unrealistic expectations
    "hit the ground running": {"category": "problematic", "replacement": "quickly onboard"},
    "wear many hats": {"category": "problematic", "replacement": "take on varied responsibilities"},
    "fast-paced environment": {"category": "problematic", "replacement": "dynamic environment"},
    "work hard play hard": {"category": "problematic", "replacement": "balanced work culture"},
    # Ageist terms - young bias
    "young": {"category": "ageist", "replacement": "early-career"},
    "digital native": {"category": "ageist", "replacement": "digitally fluent"},
    "recent graduate": {"category": "ageist", "replacement": "entry-level candidate"},
    "fresh": {"category": "ageist", "replacement": "new to the field"},
    "early career only": {"category": "ageist", "replacement": "entry-level"},
    # Ageist terms - old bias
    "overqualified": {"category": "ageist", "replacement": "highly experienced"},
}

# Derived: word lists by category (for backward compatibility with scoring.py)
BIAS_WORD_LISTS: dict[str, list[str]] = {}
for word, data in BIAS_TERMS.items():
    category = data["category"]
    if category not in BIAS_WORD_LISTS:
        BIAS_WORD_LISTS[category] = []
    BIAS_WORD_LISTS[category].append(word)

# Derived: word -> replacement mapping (for assessment_service.py)
BIAS_REPLACEMENTS: dict[str, str] = {
    word: data["replacement"] for word, data in BIAS_TERMS.items()
}

# =============================================================================
# EXCLUSION PATTERNS
# =============================================================================
# Patterns that indicate exclusion intent in voice profile rule text.
# Used by both backend (assessment_service.py) and frontend (validation.ts).
# Frontend must be kept in sync manually - this is the source of truth.

EXCLUSION_PATTERNS: list[str] = [
    "never include",
    "don't include",
    "do not include",
    "exclude",
    "skip",
    "omit",
    "no salary",
    "no location",
    "no benefits",
    "no team",
    "without salary",
    "without location",
    "without benefits",
]

# =============================================================================
# ASSESSMENT CATEGORY WEIGHTS
# =============================================================================
# Weights for calculating overall assessment score.
# Used by claude_service.py for improvement generation.

CATEGORY_WEIGHTS: dict[str, float] = {
    "inclusivity": 0.25,
    "readability": 0.20,
    "structure": 0.15,
    "completeness": 0.15,
    "clarity": 0.10,
    "voice_match": 0.15,
}

# =============================================================================
# ENUM MAPPINGS FOR API RESPONSE PARSING
# =============================================================================
# Maps string values from AI responses to enum values.
# Imported lazily to avoid circular imports.


def get_severity_map() -> dict:
    """Get severity string to enum mapping (lazy import to avoid circular deps)."""
    from app.models.assessment import IssueSeverity
    return {
        "critical": IssueSeverity.CRITICAL,
        "warning": IssueSeverity.WARNING,
        "info": IssueSeverity.INFO,
    }


def get_category_map() -> dict:
    """Get category string to enum mapping (lazy import to avoid circular deps)."""
    from app.models.assessment import AssessmentCategory
    return {
        "inclusivity": AssessmentCategory.INCLUSIVITY,
        "readability": AssessmentCategory.READABILITY,
        "structure": AssessmentCategory.STRUCTURE,
        "completeness": AssessmentCategory.COMPLETENESS,
        "clarity": AssessmentCategory.CLARITY,
        "voice_match": AssessmentCategory.VOICE_MATCH,
    }


def get_fields_for_keywords(text: str) -> set[str]:
    """
    Find all field names mentioned in the given text.

    Args:
        text: Text to search for keywords (case-insensitive)

    Returns:
        Set of field names found in the text
    """
    text_lower = text.lower()
    fields = set()

    for field, keywords in FIELD_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                fields.add(field)
                break  # Found this field, move to next

    return fields


def issue_mentions_excluded_field(
    description: str,
    found: str | None,
    suggestion: str | None,
    excluded_fields: set[str],
) -> bool:
    """
    Check if issue text mentions any excluded field.

    Args:
        description: Issue description
        found: Text that was found (may be None)
        suggestion: Suggested fix (may be None)
        excluded_fields: Set of field names that are excluded

    Returns:
        True if the issue mentions an excluded field
    """
    if not excluded_fields:
        return False

    issue_text = f"{description or ''} {found or ''} {suggestion or ''}".lower()

    for field in excluded_fields:
        if field in FIELD_KEYWORDS:
            for keyword in FIELD_KEYWORDS[field]:
                if keyword in issue_text:
                    return True

    return False
