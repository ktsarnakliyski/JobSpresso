# backend/app/services/field_mappings.py
"""
Centralized field mappings for voice profile exclusions.

This module provides a single source of truth for mapping between:
- User-facing topic keywords (salary, compensation, pay, etc.)
- Internal field names (salary, location, benefits, team_size, requirements_listed)
- Question IDs used in the question coverage analyzer

Used by:
- AssessmentService._get_excluded_fields_from_profile()
- AssessmentService._issue_conflicts_with_exclusions()
- QuestionCoverageAnalyzer.analyze()
"""

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
