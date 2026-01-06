# backend/tests/test_models.py

import pytest
from app.models.assessment import (
    AssessmentCategory,
    Issue,
    IssueSeverity,
    AssessmentResult,
    ScoreInterpretation,
)


def test_assessment_category_weights_sum_to_100():
    """All category weights should sum to 100."""
    total = sum(cat.weight for cat in AssessmentCategory)
    assert total == 100


def test_issue_severity_ordering():
    """Critical > Warning > Info."""
    assert IssueSeverity.CRITICAL.value > IssueSeverity.WARNING.value
    assert IssueSeverity.WARNING.value > IssueSeverity.INFO.value


def test_score_interpretation():
    """Score ranges map to correct labels."""
    assert ScoreInterpretation.from_score(95) == ScoreInterpretation.EXCELLENT
    assert ScoreInterpretation.from_score(80) == ScoreInterpretation.GOOD
    assert ScoreInterpretation.from_score(65) == ScoreInterpretation.NEEDS_WORK
    assert ScoreInterpretation.from_score(50) == ScoreInterpretation.POOR
    assert ScoreInterpretation.from_score(30) == ScoreInterpretation.CRITICAL


def test_assessment_result_overall_score_calculation():
    """Overall score calculated from weighted category scores."""
    result = AssessmentResult(
        category_scores={
            AssessmentCategory.INCLUSIVITY: 80,
            AssessmentCategory.READABILITY: 70,
            AssessmentCategory.STRUCTURE: 90,
            AssessmentCategory.COMPLETENESS: 60,
            AssessmentCategory.CLARITY: 85,
            AssessmentCategory.VOICE_MATCH: 75,
        },
        issues=[],
        positives=[],
        improved_text="",
    )
    # 80*0.25 + 70*0.20 + 90*0.15 + 60*0.15 + 85*0.10 + 75*0.15
    # = 20 + 14 + 13.5 + 9 + 8.5 + 11.25 = 76.25
    assert result.overall_score == 76.25
