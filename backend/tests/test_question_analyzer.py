# backend/tests/test_question_analyzer.py

import pytest
from app.services.question_analyzer import (
    QuestionCoverageAnalyzer,
    QuestionCoverage,
    CANDIDATE_QUESTIONS,
)


@pytest.fixture
def analyzer():
    return QuestionCoverageAnalyzer()


class TestQuestionCoverageAnalyzer:
    """Tests for QuestionCoverageAnalyzer.analyze() method."""

    def test_analyze_returns_all_questions(self, analyzer):
        """Should return coverage for all defined candidate questions."""
        result = analyzer.analyze("Some job description text")
        assert len(result) == len(CANDIDATE_QUESTIONS)
        assert all(isinstance(item, QuestionCoverage) for item in result)

    def test_analyze_empty_text(self, analyzer):
        """Should handle empty text without crashing."""
        result = analyzer.analyze("")
        assert len(result) == len(CANDIDATE_QUESTIONS)
        assert all(not item.is_answered for item in result)

    def test_detects_salary_with_dollar_amount(self, analyzer):
        """Should detect salary when dollar amounts are present."""
        jd = "This role offers $80,000 - $100,000 annually."
        result = analyzer.analyze(jd)

        salary_q = next(q for q in result if q.question_id == "compensation")
        assert salary_q.is_answered is True
        assert salary_q.evidence is not None

    def test_detects_salary_with_k_notation(self, analyzer):
        """Should detect salary with 'k' notation (e.g., 80k-100k)."""
        jd = "Compensation: 80k-100k based on experience"
        result = analyzer.analyze(jd)

        salary_q = next(q for q in result if q.question_id == "compensation")
        assert salary_q.is_answered is True

    def test_detects_remote_policy(self, analyzer):
        """Should detect remote work policy."""
        jd = "This is a fully remote position with flexible hours."
        result = analyzer.analyze(jd)

        remote_q = next(q for q in result if q.question_id == "remote_policy")
        assert remote_q.is_answered is True
        assert "remote" in remote_q.evidence.lower()

    def test_detects_hybrid_as_remote_policy(self, analyzer):
        """Should detect hybrid work as answering remote policy."""
        jd = "We offer a hybrid work model with 3 days in office."
        result = analyzer.analyze(jd)

        remote_q = next(q for q in result if q.question_id == "remote_policy")
        assert remote_q.is_answered is True

    def test_detects_day_to_day_responsibilities(self, analyzer):
        """Should detect daily responsibilities description."""
        jd = """
        Day-to-day you will:
        - Write Python code
        - Review pull requests
        - Attend daily standups
        """
        result = analyzer.analyze(jd)

        daily_q = next(q for q in result if q.question_id == "day_to_day")
        assert daily_q.is_answered is True

    def test_detects_growth_opportunities(self, analyzer):
        """Should detect career growth information."""
        jd = "Career development opportunities include mentorship and training budget."
        result = analyzer.analyze(jd)

        growth_q = next(q for q in result if q.question_id == "growth_opportunities")
        assert growth_q.is_answered is True

    def test_detects_team_description(self, analyzer):
        """Should detect team information."""
        jd = "You'll join a team of 5 engineers working on our core platform."
        result = analyzer.analyze(jd)

        team_q = next(q for q in result if q.question_id == "team_culture")
        assert team_q.is_answered is True

    def test_detects_benefits(self, analyzer):
        """Should detect benefits information."""
        jd = "Benefits include health insurance, 401k matching, and unlimited PTO."
        result = analyzer.analyze(jd)

        benefits_q = next(q for q in result if q.question_id == "benefits")
        assert benefits_q.is_answered is True

    def test_detects_requirements(self, analyzer):
        """Should detect qualification requirements."""
        jd = "Must-have: 3 years of experience in Python. Nice-to-have: AWS experience."
        result = analyzer.analyze(jd)

        req_q = next(q for q in result if q.question_id == "requirements_clarity")
        assert req_q.is_answered is True

    def test_missing_questions_have_suggestions(self, analyzer):
        """Unanswered questions should include suggestions."""
        jd = "Generic job description with minimal info."
        result = analyzer.analyze(jd)

        unanswered = [q for q in result if not q.is_answered]
        assert len(unanswered) > 0
        for q in unanswered:
            assert q.suggestion is not None
            assert len(q.suggestion) > 0

    def test_answered_questions_have_no_suggestion(self, analyzer):
        """Answered questions should not include suggestions."""
        jd = "$100,000 salary, fully remote, health benefits included."
        result = analyzer.analyze(jd)

        answered = [q for q in result if q.is_answered]
        assert len(answered) > 0
        for q in answered:
            assert q.suggestion is None

    def test_importance_levels_are_valid(self, analyzer):
        """All questions should have valid importance levels."""
        result = analyzer.analyze("test")
        valid_levels = {"high", "medium", "low"}

        for q in result:
            assert q.importance in valid_levels

    def test_impact_stats_are_present(self, analyzer):
        """All questions should have impact statistics."""
        result = analyzer.analyze("test")

        for q in result:
            assert q.impact_stat is not None
            assert len(q.impact_stat) > 0


class TestEstimateApplicationBoost:
    """Tests for QuestionCoverageAnalyzer.estimate_application_boost() method."""

    def test_all_questions_answered_gives_zero_boost(self, analyzer):
        """When all questions are answered, no additional boost is possible."""
        jd = """
        Salary: $100,000-$120,000
        Remote work available
        Day-to-day: coding, reviews, meetings
        Career growth through mentorship
        Team of 5 engineers
        Benefits: health, 401k, PTO
        Requirements: 3+ years experience
        Interview process: 3 rounds
        Start date: Immediately
        Reports to: Engineering Manager
        """
        coverage = analyzer.analyze(jd)
        boost = analyzer.estimate_application_boost(coverage)

        # All answered = no potential improvement boost
        assert boost == 0

    def test_missing_salary_gives_boost(self, analyzer):
        """Missing salary info should contribute to potential boost."""
        # JD with remote but no salary
        jd = "Remote position with great benefits"
        coverage = analyzer.analyze(jd)
        boost = analyzer.estimate_application_boost(coverage)

        # Should have boost because salary is missing
        assert boost >= 30  # Salary is the biggest contributor

    def test_missing_remote_gives_boost(self, analyzer):
        """Missing remote policy should contribute to potential boost."""
        # JD with salary but no remote info
        jd = "$100,000 salary with great benefits"
        coverage = analyzer.analyze(jd)
        boost = analyzer.estimate_application_boost(coverage)

        # Should have boost because remote policy is missing
        assert boost >= 10

    def test_empty_jd_gives_max_boost(self, analyzer):
        """Empty JD should give maximum potential boost."""
        coverage = analyzer.analyze("")
        boost = analyzer.estimate_application_boost(coverage)

        # Missing all key info = high potential boost
        assert boost >= 40

    def test_empty_coverage_list(self, analyzer):
        """Should handle empty coverage list."""
        boost = analyzer.estimate_application_boost([])
        assert boost == 0


class TestCandidateQuestions:
    """Tests for CANDIDATE_QUESTIONS configuration."""

    def test_all_questions_have_required_fields(self):
        """Each question should have all required configuration fields."""
        required_fields = {"question", "importance", "impact_stat", "detection_patterns", "suggestion"}

        for qid, qdata in CANDIDATE_QUESTIONS.items():
            assert required_fields.issubset(qdata.keys()), f"Question {qid} missing fields"

    def test_importance_values_are_valid(self):
        """Importance should be high, medium, or low."""
        valid_values = {"high", "medium", "low"}

        for qid, qdata in CANDIDATE_QUESTIONS.items():
            assert qdata["importance"] in valid_values, f"Invalid importance for {qid}"

    def test_detection_patterns_are_valid_regex(self):
        """Detection patterns should be valid regex."""
        import re

        for qid, qdata in CANDIDATE_QUESTIONS.items():
            for pattern in qdata["detection_patterns"]:
                try:
                    re.compile(pattern)
                except re.error as e:
                    pytest.fail(f"Invalid regex pattern in {qid}: {pattern} - {e}")


class TestExcludedTopics:
    """Tests for excluded_topics parameter in analyze() method."""

    def test_no_excluded_topics_returns_all_questions(self, analyzer):
        """Should return all questions when no topics excluded."""
        result = analyzer.analyze("Some job description")
        assert len(result) == len(CANDIDATE_QUESTIONS)

    def test_excluding_salary_removes_compensation_question(self, analyzer):
        """Should not include compensation question when salary excluded."""
        jd = "$100,000 salary"  # Would normally be answered
        result = analyzer.analyze(jd, excluded_topics={"salary"})

        question_ids = [q.question_id for q in result]
        assert "compensation" not in question_ids

    def test_excluding_location_removes_remote_policy_question(self, analyzer):
        """Should not include remote_policy question when location excluded."""
        jd = "Fully remote position"  # Would normally be answered
        result = analyzer.analyze(jd, excluded_topics={"location"})

        question_ids = [q.question_id for q in result]
        assert "remote_policy" not in question_ids

    def test_excluding_benefits_removes_benefits_question(self, analyzer):
        """Should not include benefits question when benefits excluded."""
        jd = "Health insurance and 401k included"  # Would normally be answered
        result = analyzer.analyze(jd, excluded_topics={"benefits"})

        question_ids = [q.question_id for q in result]
        assert "benefits" not in question_ids

    def test_excluding_team_size_removes_team_culture_question(self, analyzer):
        """Should not include team_culture question when team_size excluded."""
        jd = "Join a team of 5 engineers"  # Would normally be answered
        result = analyzer.analyze(jd, excluded_topics={"team_size"})

        question_ids = [q.question_id for q in result]
        assert "team_culture" not in question_ids

    def test_excluding_requirements_listed_removes_requirements_clarity(self, analyzer):
        """Should not include requirements_clarity when requirements_listed excluded."""
        jd = "Must have 5+ years experience"  # Would normally be answered
        result = analyzer.analyze(jd, excluded_topics={"requirements_listed"})

        question_ids = [q.question_id for q in result]
        assert "requirements_clarity" not in question_ids

    def test_excluding_multiple_topics(self, analyzer):
        """Should exclude multiple topics at once."""
        jd = "$100k salary, fully remote, great benefits"
        excluded = {"salary", "location", "benefits"}
        result = analyzer.analyze(jd, excluded_topics=excluded)

        question_ids = [q.question_id for q in result]
        assert "compensation" not in question_ids
        assert "remote_policy" not in question_ids
        assert "benefits" not in question_ids
        # Other questions should still be present
        assert "day_to_day" in question_ids
        assert "growth_opportunities" in question_ids

    def test_empty_excluded_set_same_as_none(self, analyzer):
        """Empty excluded set should behave same as None."""
        jd = "Some job description"
        result1 = analyzer.analyze(jd, excluded_topics=set())
        result2 = analyzer.analyze(jd, excluded_topics=None)

        assert len(result1) == len(result2)
        ids1 = {q.question_id for q in result1}
        ids2 = {q.question_id for q in result2}
        assert ids1 == ids2

    def test_non_mapped_topics_have_no_effect(self, analyzer):
        """Excluding topics without question mappings should have no effect."""
        jd = "Some job description"
        # These don't map to any questions
        result = analyzer.analyze(jd, excluded_topics={"unknown_topic", "another_topic"})

        assert len(result) == len(CANDIDATE_QUESTIONS)

    def test_question_count_matches_after_exclusion(self, analyzer):
        """Question count should decrease by number of excluded mapped topics."""
        jd = "Test JD"
        full_result = analyzer.analyze(jd)
        excluded_result = analyzer.analyze(jd, excluded_topics={"salary", "benefits"})

        # Should have 2 fewer questions (compensation and benefits)
        assert len(excluded_result) == len(full_result) - 2
