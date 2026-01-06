# backend/tests/test_scoring.py

import pytest
from app.services.scoring import (
    calculate_readability_score,
    calculate_length_score,
    detect_structure_sections,
    calculate_structure_score,
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
    """Bias word lists should be populated."""
    assert len(BIAS_WORD_LISTS["masculine"]) > 0
    assert len(BIAS_WORD_LISTS["feminine"]) > 0
    assert "aggressive" in BIAS_WORD_LISTS["masculine"]
    assert "ninja" in BIAS_WORD_LISTS["problematic"]
