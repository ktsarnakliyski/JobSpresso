# backend/tests/test_field_mappings.py
"""Tests for field_mappings module."""

import pytest
from app.services.field_mappings import (
    FIELD_KEYWORDS,
    KEYWORD_TO_FIELD,
    QUESTION_TO_FIELD,
    get_fields_for_keywords,
    issue_mentions_excluded_field,
)


class TestFieldKeywordsConsistency:
    """Test that FIELD_KEYWORDS and derived mappings are consistent."""

    def test_keyword_to_field_derived_correctly(self):
        """KEYWORD_TO_FIELD should contain all keywords from FIELD_KEYWORDS."""
        for field, keywords in FIELD_KEYWORDS.items():
            for keyword in keywords:
                assert keyword in KEYWORD_TO_FIELD
                assert KEYWORD_TO_FIELD[keyword] == field

    def test_all_question_fields_exist(self):
        """QUESTION_TO_FIELD values should all be valid field names."""
        for question_id, field in QUESTION_TO_FIELD.items():
            assert field in FIELD_KEYWORDS, f"Question '{question_id}' maps to unknown field '{field}'"

    def test_no_duplicate_keywords_across_fields(self):
        """Each keyword should map to exactly one field."""
        seen_keywords = {}
        for field, keywords in FIELD_KEYWORDS.items():
            for keyword in keywords:
                if keyword in seen_keywords:
                    pytest.fail(
                        f"Keyword '{keyword}' appears in both '{seen_keywords[keyword]}' and '{field}'"
                    )
                seen_keywords[keyword] = field


class TestGetFieldsForKeywords:
    """Test get_fields_for_keywords function."""

    def test_single_keyword_match(self):
        """Should find field when single keyword matches."""
        assert get_fields_for_keywords("salary information") == {"salary"}
        assert get_fields_for_keywords("remote work") == {"location"}
        assert get_fields_for_keywords("great benefits") == {"benefits"}

    def test_multiple_keywords_same_field(self):
        """Multiple keywords for same field should return field once."""
        # Both "salary" and "compensation" map to salary field
        assert get_fields_for_keywords("salary and compensation") == {"salary"}

    def test_multiple_fields(self):
        """Should find multiple fields when different keywords match."""
        result = get_fields_for_keywords("salary and benefits and team size")
        assert result == {"salary", "benefits", "team_size"}

    def test_case_insensitive(self):
        """Should match keywords case-insensitively."""
        assert get_fields_for_keywords("SALARY") == {"salary"}
        assert get_fields_for_keywords("Compensation") == {"salary"}
        assert get_fields_for_keywords("REMOTE") == {"location"}

    def test_no_match(self):
        """Should return empty set when no keywords match."""
        assert get_fields_for_keywords("hello world") == set()
        assert get_fields_for_keywords("") == set()

    def test_partial_word_match(self):
        """Keywords should match as substrings (current behavior)."""
        # "salary" is in "salaryRange"
        assert get_fields_for_keywords("salaryRange") == {"salary"}

    def test_all_field_keywords_detectable(self):
        """Each field should be detectable via at least one keyword."""
        for field, keywords in FIELD_KEYWORDS.items():
            # Test first keyword for each field
            result = get_fields_for_keywords(keywords[0])
            assert field in result, f"Field '{field}' not detected with keyword '{keywords[0]}'"


class TestIssueMentionsExcludedField:
    """Test issue_mentions_excluded_field function."""

    def test_description_mentions_excluded_field(self):
        """Should detect excluded field in description."""
        assert issue_mentions_excluded_field(
            description="Missing salary information",
            found=None,
            suggestion=None,
            excluded_fields={"salary"},
        )

    def test_found_mentions_excluded_field(self):
        """Should detect excluded field in found text."""
        assert issue_mentions_excluded_field(
            description="Generic issue",
            found="salary range",
            suggestion=None,
            excluded_fields={"salary"},
        )

    def test_suggestion_mentions_excluded_field(self):
        """Should detect excluded field in suggestion."""
        assert issue_mentions_excluded_field(
            description="Missing data",
            found=None,
            suggestion="Add salary information",
            excluded_fields={"salary"},
        )

    def test_no_match_when_field_not_excluded(self):
        """Should not match when field is not in excluded set."""
        assert not issue_mentions_excluded_field(
            description="Missing salary information",
            found=None,
            suggestion=None,
            excluded_fields={"benefits"},  # salary not excluded
        )

    def test_empty_excluded_fields(self):
        """Should return False when excluded_fields is empty."""
        assert not issue_mentions_excluded_field(
            description="Missing salary information",
            found=None,
            suggestion=None,
            excluded_fields=set(),
        )

    def test_all_none_fields(self):
        """Should handle all None fields without error."""
        assert not issue_mentions_excluded_field(
            description="",
            found=None,
            suggestion=None,
            excluded_fields={"salary"},
        )

    def test_case_insensitive_matching(self):
        """Should match keywords case-insensitively."""
        assert issue_mentions_excluded_field(
            description="Missing SALARY Information",
            found=None,
            suggestion=None,
            excluded_fields={"salary"},
        )

    def test_matches_keyword_variants(self):
        """Should match any keyword variant for a field."""
        # "compensation" is a keyword for salary field
        assert issue_mentions_excluded_field(
            description="Add compensation details",
            found=None,
            suggestion=None,
            excluded_fields={"salary"},
        )
        # "pay" is also a keyword for salary
        assert issue_mentions_excluded_field(
            description="Include pay range",
            found=None,
            suggestion=None,
            excluded_fields={"salary"},
        )

    def test_multiple_excluded_fields(self):
        """Should match if any excluded field is mentioned."""
        assert issue_mentions_excluded_field(
            description="Add benefits",
            found=None,
            suggestion=None,
            excluded_fields={"salary", "benefits"},
        )

    def test_unknown_field_ignored(self):
        """Should handle unknown fields in excluded_fields gracefully."""
        # "unknown_field" is not in FIELD_KEYWORDS
        assert not issue_mentions_excluded_field(
            description="Some issue",
            found=None,
            suggestion=None,
            excluded_fields={"unknown_field"},
        )
