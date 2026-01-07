# backend/tests/test_scoring.py

import pytest
from app.services.scoring import (
    calculate_readability_score,
    calculate_length_score,
    detect_structure_sections,
    calculate_structure_score,
    calculate_completeness_score,
    detect_bias_words,
    BIAS_WORD_LISTS,
)


def test_readability_score_simple_text():
    """Simple text should score high."""
    text = "We need a developer. You will write code. The team is small."
    score = calculate_readability_score(text)
    assert score >= 80


def test_readability_score_complex_text():
    """Complex jargon-heavy text should score lower."""
    text = """
    The ideal candidate will leverage cutting-edge methodologies to synergize
    cross-functional paradigms while simultaneously optimizing stakeholder
    engagement through innovative ideation frameworks.
    """
    score = calculate_readability_score(text)
    assert score < 60


def test_length_score_optimal():
    """300-650 words should score 100."""
    text = "word " * 400
    score = calculate_length_score(text)
    assert score == 100


def test_length_score_too_short():
    """Under 300 words should be penalized."""
    text = "word " * 100
    score = calculate_length_score(text)
    assert score < 100


def test_length_score_too_long():
    """Over 700 words should be penalized."""
    text = "word " * 900
    score = calculate_length_score(text)
    assert score < 80


def test_structure_detection():
    """Should detect common JD sections."""
    text = """
    ## About Us
    We are a company.

    ## The Role
    You will do things.

    ## Requirements
    - Python
    - JavaScript

    ## Benefits
    - Health insurance
    """
    sections = detect_structure_sections(text)
    assert "about" in sections
    assert "role" in sections
    assert "requirements" in sections
    assert "benefits" in sections


def test_structure_score_with_all_sections():
    """JD with all sections should score high."""
    text = """
    ## About Us
    We are a company.

    ## The Role
    You will do things.

    ## Requirements
    - Python

    ## What We Offer
    - Good salary
    """
    score = calculate_structure_score(text)
    assert score >= 80


def test_bias_word_lists_exist():
    """Bias word lists should contain genuinely problematic terms."""
    # Should have problematic and ageist categories
    assert "problematic" in BIAS_WORD_LISTS
    assert "ageist" in BIAS_WORD_LISTS
    assert len(BIAS_WORD_LISTS["problematic"]) > 0
    assert len(BIAS_WORD_LISTS["ageist"]) > 0

    # Should include genuinely problematic terms
    assert "ninja" in BIAS_WORD_LISTS["problematic"]
    assert "rockstar" in BIAS_WORD_LISTS["problematic"]
    assert "digital native" in BIAS_WORD_LISTS["ageist"]

    # Should NOT include legitimate professional qualities
    # (masculine/feminine categories were removed)
    assert "masculine" not in BIAS_WORD_LISTS
    assert "feminine" not in BIAS_WORD_LISTS


# Tests for calculate_completeness_score with excluded_fields
class TestCompletenessScoreWithExcludedFields:
    """Tests for completeness scoring with voice profile exclusions."""

    def test_no_excluded_fields_returns_normal_score(self):
        """Should calculate normal score when no fields excluded."""
        text = "word " * 100  # Minimal text, will have low completeness
        score, missing = calculate_completeness_score(text)
        assert score < 100  # Should have missing elements
        assert len(missing) > 0

    def test_excluding_salary_removes_from_missing(self):
        """Should not report salary as missing when excluded."""
        text = "We offer great benefits and remote work."  # No salary
        excluded = {"salary"}
        score, missing = calculate_completeness_score(text, excluded)
        assert "salary" not in missing

    def test_excluding_salary_redistributes_weight(self):
        """Should redistribute weight when salary excluded."""
        # Text with everything except salary
        text = """
        ## Requirements
        - Python experience

        ## Benefits
        - Health insurance

        Location: Remote
        Team of 5 engineers.
        """
        # Without exclusion, missing salary hurts score
        score_without_exclusion, _ = calculate_completeness_score(text)

        # With exclusion, salary weight redistributed
        score_with_exclusion, _ = calculate_completeness_score(text, {"salary"})

        # Score should be higher when salary is excluded (not penalized)
        assert score_with_exclusion > score_without_exclusion

    def test_excluding_multiple_fields(self):
        """Should handle multiple excluded fields."""
        text = "Basic job description with requirements listed."
        excluded = {"salary", "benefits", "team_size"}
        score, missing = calculate_completeness_score(text, excluded)

        # None of excluded fields should be in missing
        for field in excluded:
            assert field not in missing

    def test_excluding_all_fields_returns_perfect_score(self):
        """Should return 100 when all checkable fields are excluded."""
        text = "Minimal text"
        excluded = {"salary", "location", "benefits", "team_size", "requirements_listed"}
        score, missing = calculate_completeness_score(text, excluded)

        assert score == 100
        assert len(missing) == 0

    def test_empty_excluded_set_same_as_none(self):
        """Empty set should behave same as None."""
        text = "Test job description"
        score1, missing1 = calculate_completeness_score(text, set())
        score2, missing2 = calculate_completeness_score(text, None)

        assert score1 == score2
        assert missing1 == missing2

    def test_location_exclusion(self):
        """Should exclude location from checks."""
        text = """
        ## Requirements
        - Python
        $100,000 salary
        Great benefits
        Team of 10
        """  # No location
        excluded = {"location"}
        score, missing = calculate_completeness_score(text, excluded)

        assert "location" not in missing


# Tests for detect_bias_words function
class TestDetectBiasWords:
    """Tests for bias word detection."""

    def test_detects_problematic_single_words(self):
        """Should detect problematic terms like ninja, rockstar."""
        text = "We need a rockstar ninja developer to join our team."
        found = detect_bias_words(text)
        assert "problematic" in found
        assert "ninja" in found["problematic"]
        assert "rockstar" in found["problematic"]

    def test_detects_ageist_terms(self):
        """Should detect ageist terms."""
        text = "Looking for a young, digital native developer."
        found = detect_bias_words(text)
        assert "ageist" in found
        assert "young" in found["ageist"]
        assert "digital native" in found["ageist"]

    def test_detects_multi_word_phrases(self):
        """Should detect multi-word phrases like 'culture fit'."""
        text = "Must be a culture fit and hit the ground running."
        found = detect_bias_words(text)
        assert "problematic" in found
        assert "culture fit" in found["problematic"]
        assert "hit the ground running" in found["problematic"]

    def test_case_insensitive(self):
        """Should detect terms regardless of case."""
        text = "Looking for a ROCKSTAR developer who is a CULTURE FIT."
        found = detect_bias_words(text)
        assert "problematic" in found
        assert "rockstar" in found["problematic"]
        assert "culture fit" in found["problematic"]

    def test_no_bias_words_returns_empty(self):
        """Should return empty dict when no bias words found."""
        text = "We are looking for an experienced Python developer."
        found = detect_bias_words(text)
        # Should be empty or only have empty lists
        total_found = sum(len(words) for words in found.values())
        assert total_found == 0

    def test_legitimate_words_not_flagged(self):
        """Should NOT flag legitimate professional qualities."""
        text = "We need an analytical, competitive, and driven candidate."
        found = detect_bias_words(text)
        # These words should NOT be in the results
        all_words = [w for words in found.values() for w in words]
        assert "analytical" not in all_words
        assert "competitive" not in all_words
        assert "driven" not in all_words

    def test_detects_all_tech_bro_terms(self):
        """Should detect all tech bro culture terms."""
        text = "We need a guru wizard superhero unicorn."
        found = detect_bias_words(text)
        assert "problematic" in found
        assert "guru" in found["problematic"]
        assert "wizard" in found["problematic"]
        assert "superhero" in found["problematic"]
        assert "unicorn" in found["problematic"]

    def test_detects_red_flag_phrases(self):
        """Should detect workplace red flag phrases."""
        text = "Fast-paced environment where you wear many hats. We work hard play hard."
        found = detect_bias_words(text)
        assert "problematic" in found
        assert "fast-paced environment" in found["problematic"]
        assert "wear many hats" in found["problematic"]
        assert "work hard play hard" in found["problematic"]
