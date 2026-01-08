"""Integration tests for the assessment pipeline."""

import pytest
from unittest.mock import AsyncMock, patch

from app.services.assessment_service import AssessmentService


# Sample JD with known issues
SAMPLE_JD_WITH_BIAS = """
We're looking for a rockstar ninja developer to join our fast-paced team.
You should be a digital native who can hit the ground running.

Requirements:
- 5+ years experience
- Strong coding skills
"""

# Mock Claude response for analysis
MOCK_ANALYSIS_RESPONSE = {
    "scores": {
        "inclusivity": 45,
        "clarity": 70,
        "voice_match": 80,
    },
    "issues": [
        {
            "category": "inclusivity",
            "severity": "warning",
            "description": "Uses exclusionary tech jargon",
            "found": "rockstar ninja",
            "suggestion": "Use 'expert developer' instead",
        }
    ],
    "positives": ["Clear requirements section"],
    "category_evidence": {
        "inclusivity": {
            "supporting_excerpts": [],
            "missing_elements": ["Inclusive language"],
            "opportunity": "Remove exclusionary jargon",
        }
    },
}


@pytest.fixture
def mock_claude_service():
    """Create a mock for the ClaudeService."""
    with patch("app.services.assessment_service.ClaudeService") as MockClass:
        instance = MockClass.return_value
        instance.analyze = AsyncMock(return_value=MOCK_ANALYSIS_RESPONSE)
        instance.generate_improvement = AsyncMock(return_value="Improved JD text here")
        yield instance


@pytest.mark.asyncio
async def test_analyze_detects_bias_issues(mock_claude_service):
    """Full analysis pipeline should detect bias words."""
    service = AssessmentService(claude_api_key="test-key")

    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Verify bias words detected by rule-based scoring
    # The rule-based detector should find "rockstar", "ninja", "digital native"
    bias_issues = [
        i for i in result.issues
        if "rockstar" in str(i.found).lower()
        or "ninja" in str(i.found).lower()
        or "digital native" in str(i.found).lower()
    ]
    assert len(bias_issues) > 0, "Should detect bias words in the JD"


@pytest.mark.asyncio
async def test_analyze_generates_improvement(mock_claude_service):
    """Analysis should include improved version of JD."""
    service = AssessmentService(claude_api_key="test-key")

    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Verify improved_text is present
    assert result.improved_text is not None
    assert len(result.improved_text) > 0


@pytest.mark.asyncio
async def test_analyze_fallback_on_improvement_failure(mock_claude_service):
    """If improvement generation fails, should fall back to original text."""
    # Make improvement generation fail
    mock_claude_service.generate_improvement = AsyncMock(
        side_effect=Exception("API error")
    )

    service = AssessmentService(claude_api_key="test-key")

    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Should fall back to original text
    assert result.improved_text == SAMPLE_JD_WITH_BIAS


@pytest.mark.asyncio
async def test_analyze_calculates_overall_score(mock_claude_service):
    """Analysis should calculate weighted overall score."""
    service = AssessmentService(claude_api_key="test-key")

    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Overall score should be calculated from category scores
    assert result.overall_score > 0
    assert result.overall_score <= 100


@pytest.mark.asyncio
async def test_analyze_returns_category_evidence(mock_claude_service):
    """Analysis should return evidence for each category."""
    service = AssessmentService(claude_api_key="test-key")

    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Should have evidence for all categories
    from app.models.assessment import AssessmentCategory
    for category in AssessmentCategory:
        assert category in result.category_evidence


@pytest.mark.asyncio
async def test_analyze_with_question_coverage(mock_claude_service):
    """Analysis should include question coverage analysis."""
    service = AssessmentService(claude_api_key="test-key")

    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Should have question coverage data
    assert result.questions_total >= 0
    assert hasattr(result, 'question_coverage_percent')
