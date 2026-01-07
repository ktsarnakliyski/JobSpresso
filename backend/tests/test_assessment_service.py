# backend/tests/test_assessment_service.py

import pytest
from unittest.mock import AsyncMock, patch
from app.services.assessment_service import AssessmentService
from app.models.assessment import AssessmentCategory, Issue, IssueSeverity
from app.models.voice_profile import VoiceProfile, ToneStyle, ProfileRule, RuleType


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


# Tests for _get_excluded_fields_from_profile
class TestGetExcludedFieldsFromProfile:
    """Tests for voice profile rule interpretation."""

    def test_no_profile_returns_empty_set(self, assessment_service):
        """Should return empty set when no profile provided."""
        excluded = assessment_service._get_excluded_fields_from_profile(None)
        assert excluded == set()

    def test_profile_without_rules_returns_empty_set(self, assessment_service):
        """Should return empty set when profile has no rules."""
        profile = VoiceProfile(id="test", name="Test", rules=[])
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert excluded == set()

    def test_exclude_rule_by_target(self, assessment_service):
        """Should extract excluded field from explicit rule target."""
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="Never include salary",
                    rule_type=RuleType.EXCLUDE,
                    target="salary",
                    active=True,
                )
            ],
        )
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert "salary" in excluded

    def test_exclude_rule_by_keyword_in_text(self, assessment_service):
        """Should extract excluded field from keywords in rule text."""
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="Never include salary information",
                    rule_type=RuleType.EXCLUDE,
                    active=True,
                )
            ],
        )
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert "salary" in excluded

    def test_inactive_rules_ignored(self, assessment_service):
        """Should ignore inactive rules."""
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="Never include salary",
                    rule_type=RuleType.EXCLUDE,
                    target="salary",
                    active=False,  # Inactive
                )
            ],
        )
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert "salary" not in excluded

    def test_include_rules_not_excluded(self, assessment_service):
        """Should only process EXCLUDE rules, not INCLUDE."""
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="Always include salary",
                    rule_type=RuleType.INCLUDE,
                    target="salary",
                    active=True,
                )
            ],
        )
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert "salary" not in excluded

    def test_multiple_exclude_rules_accumulate(self, assessment_service):
        """Should accumulate multiple excluded fields."""
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="No salary",
                    rule_type=RuleType.EXCLUDE,
                    target="salary",
                    active=True,
                ),
                ProfileRule(
                    id="2",
                    text="Skip benefits",
                    rule_type=RuleType.EXCLUDE,
                    target="benefits",
                    active=True,
                ),
            ],
        )
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert "salary" in excluded
        assert "benefits" in excluded

    def test_compensation_maps_to_salary(self, assessment_service):
        """Should map 'compensation' target to 'salary' field."""
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="No compensation info",
                    rule_type=RuleType.EXCLUDE,
                    target="compensation",
                    active=True,
                )
            ],
        )
        excluded = assessment_service._get_excluded_fields_from_profile(profile)
        assert "salary" in excluded


# Tests for voice profile exclusion in rule-based issues
class TestVoiceProfileExclusionInIssues:
    """Tests for voice profile rules affecting issue detection."""

    def test_salary_excluded_no_salary_issues(self, assessment_service):
        """Should not flag missing salary when excluded by voice profile."""
        jd = "Remote position with great benefits."  # No salary mentioned
        profile = VoiceProfile(
            id="test",
            name="Test",
            rules=[
                ProfileRule(
                    id="1",
                    text="Never include salary information",
                    rule_type=RuleType.EXCLUDE,
                    target="salary",
                    active=True,
                )
            ],
        )
        issues = assessment_service._detect_rule_based_issues(jd, profile)
        salary_issues = [
            i for i in issues if "salary" in i.description.lower()
        ]
        assert len(salary_issues) == 0
