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
