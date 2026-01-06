# backend/tests/test_assessment_service.py

import pytest
from unittest.mock import AsyncMock, patch
from app.services.assessment_service import AssessmentService
from app.models.assessment import AssessmentCategory, IssueSeverity
from app.models.voice_profile import VoiceProfile, ToneStyle


@pytest.fixture
def assessment_service():
    return AssessmentService(claude_api_key="test-key")


@pytest.fixture
def sample_jd():
    return """
    ## About Us
    We are a fast-growing startup building amazing products.

    ## The Role
    We are looking for a rockstar developer to join our team.
    You will write code and ship features.

    ## Requirements
    - 5+ years of experience
    - Python expertise
    - Strong communication

    ## Benefits
    - Competitive salary
    - Health insurance
    - Remote work
    """


def test_rule_based_scores(assessment_service, sample_jd):
    """Rule-based scoring works without API."""
    scores = assessment_service._calculate_rule_based_scores(sample_jd)

    assert AssessmentCategory.READABILITY in scores
    assert AssessmentCategory.STRUCTURE in scores
    assert AssessmentCategory.COMPLETENESS in scores
    assert all(0 <= s <= 100 for s in scores.values())


def test_detect_rule_based_issues(assessment_service, sample_jd):
    """Detects bias words and missing elements."""
    issues = assessment_service._detect_rule_based_issues(sample_jd)

    # Should find "rockstar" as problematic
    bias_issues = [i for i in issues if i.category == AssessmentCategory.INCLUSIVITY]
    assert len(bias_issues) > 0

    # Should note missing salary specifics
    completeness_issues = [i for i in issues if i.category == AssessmentCategory.COMPLETENESS]
    assert any("salary" in str(i.description).lower() for i in completeness_issues)


def test_merge_scores(assessment_service):
    """Merges rule-based and AI scores correctly."""
    rule_scores = {
        AssessmentCategory.READABILITY: 80,
        AssessmentCategory.STRUCTURE: 75,
        AssessmentCategory.COMPLETENESS: 60,
    }
    ai_scores = {
        AssessmentCategory.INCLUSIVITY: 70,
        AssessmentCategory.CLARITY: 85,
        AssessmentCategory.VOICE_MATCH: 90,
    }

    merged = assessment_service._merge_scores(rule_scores, ai_scores)

    assert len(merged) == 6
    assert merged[AssessmentCategory.READABILITY] == 80
    assert merged[AssessmentCategory.INCLUSIVITY] == 70
