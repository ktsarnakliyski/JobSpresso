# backend/app/services/assessment_service.py

import re
from typing import Optional
from app.models.assessment import (
    AssessmentCategory,
    AssessmentResult,
    Issue,
    IssueSeverity,
    CategoryEvidence,
    EvidenceStatus,
    QuestionCoverageItem,
)
from app.models.voice_profile import VoiceProfile
from app.services.scoring import (
    calculate_readability_score,
    calculate_length_score,
    calculate_structure_score,
    calculate_completeness_score,
    detect_bias_words,
)
from app.services.claude_service import ClaudeService, AnalyzeRequest
from app.services.question_analyzer import QuestionCoverageAnalyzer


# Replacement suggestions for common bias words
BIAS_REPLACEMENTS = {
    "aggressive": "ambitious",
    "ninja": "expert",
    "rockstar": "top performer",
    "guru": "specialist",
    "dominant": "leading",
    "driven": "motivated",
    "young": "early-career",
    "digital native": "digitally fluent",
    "hit the ground running": "quickly onboard",
}


class AssessmentService:
    """
    Combines rule-based scoring with AI-powered analysis.

    Rule-based: readability, structure, completeness, bias word detection
    AI-powered: inclusivity nuance, clarity, voice match, improvements
    Question coverage: Rufus-inspired candidate Q&A analysis
    """

    def __init__(self, claude_api_key: str):
        self.claude_service = ClaudeService(api_key=claude_api_key)
        self.question_analyzer = QuestionCoverageAnalyzer()

    def _calculate_rule_based_scores(self, text: str) -> dict[AssessmentCategory, float]:
        """Calculate scores using deterministic algorithms."""
        completeness_score, _ = calculate_completeness_score(text)

        return {
            AssessmentCategory.READABILITY: calculate_readability_score(text),
            AssessmentCategory.STRUCTURE: calculate_structure_score(text),
            AssessmentCategory.COMPLETENESS: completeness_score,
        }

    def _detect_bias_issues(self, text: str) -> list[Issue]:
        """Detect bias-related issues using word lists."""
        issues = []
        bias_found = detect_bias_words(text)

        for bias_type, words in bias_found.items():
            severity = IssueSeverity.WARNING

            for word in words:
                suggestion = BIAS_REPLACEMENTS.get(word, f"consider alternatives to '{word}'")
                issues.append(Issue(
                    severity=severity,
                    category=AssessmentCategory.INCLUSIVITY,
                    description=f"Found {bias_type}-coded word: '{word}'",
                    found=word,
                    suggestion=suggestion,
                    impact="May discourage diverse candidates from applying",
                ))

        return issues

    def _detect_completeness_issues(self, text: str) -> list[Issue]:
        """Detect missing information issues."""
        issues = []
        _, missing = calculate_completeness_score(text)

        impact_map = {
            "salary": "66% less engagement without salary transparency",
            "location": "Candidates need to know work arrangement",
            "benefits": "28% of candidates specifically look for benefits",
            "team_size": "Helps candidates understand the role context",
            "requirements_listed": "Clear requirements reduce unqualified applications",
        }

        for field in missing:
            severity = IssueSeverity.CRITICAL if field == "salary" else IssueSeverity.WARNING
            issues.append(Issue(
                severity=severity,
                category=AssessmentCategory.COMPLETENESS,
                description=f"Missing {field.replace('_', ' ')}",
                suggestion=f"Add {field.replace('_', ' ')} information",
                impact=impact_map.get(field, "Improves candidate decision-making"),
            ))

        # Check for salary mentioned without specifics
        text_lower = text.lower()
        has_salary_word = bool(re.search(r'\bsalary\b|\bcompensation\b|\bpay\b', text_lower))
        has_salary_specifics = bool(re.search(
            r'\$\d|€\d|£\d|\d+k|\d{2,3},?\d{3}|pay\s+range',
            text_lower
        ))
        if has_salary_word and not has_salary_specifics:
            issues.append(Issue(
                severity=IssueSeverity.CRITICAL,
                category=AssessmentCategory.COMPLETENESS,
                description="Missing salary range specifics",
                suggestion="Add specific salary range (e.g., $80,000 - $100,000)",
                impact="66% less engagement without salary transparency",
            ))

        return issues

    def _detect_readability_issues(self, text: str) -> list[Issue]:
        """Detect readability-related issues."""
        issues = []
        readability = calculate_readability_score(text)

        if readability < 60:
            issues.append(Issue(
                severity=IssueSeverity.WARNING,
                category=AssessmentCategory.READABILITY,
                description="Reading level too complex",
                suggestion="Simplify language to 8th grade reading level",
                impact="Higher readability increases application rates",
            ))

        return issues

    def _detect_rule_based_issues(self, text: str) -> list[Issue]:
        """Detect issues using word lists and pattern matching."""
        issues = []
        issues.extend(self._detect_bias_issues(text))
        issues.extend(self._detect_completeness_issues(text))
        issues.extend(self._detect_readability_issues(text))
        return issues

    def _merge_scores(
        self,
        rule_scores: dict[AssessmentCategory, float],
        ai_scores: dict[AssessmentCategory, float],
    ) -> dict[AssessmentCategory, float]:
        """Merge rule-based and AI scores, preferring rules where available."""
        merged = {}

        for category in AssessmentCategory:
            if category in rule_scores:
                merged[category] = rule_scores[category]
            elif category in ai_scores:
                merged[category] = ai_scores[category]
            else:
                merged[category] = 75  # Default neutral score

        return merged

    def _convert_ai_issues(self, ai_issues: list[dict]) -> list[Issue]:
        """Convert AI response issues to Issue models."""
        issues = []

        severity_map = {
            "critical": IssueSeverity.CRITICAL,
            "warning": IssueSeverity.WARNING,
            "info": IssueSeverity.INFO,
        }

        category_map = {
            "inclusivity": AssessmentCategory.INCLUSIVITY,
            "readability": AssessmentCategory.READABILITY,
            "structure": AssessmentCategory.STRUCTURE,
            "completeness": AssessmentCategory.COMPLETENESS,
            "clarity": AssessmentCategory.CLARITY,
            "voice_match": AssessmentCategory.VOICE_MATCH,
        }

        for ai_issue in ai_issues:
            issues.append(Issue(
                severity=severity_map.get(ai_issue.get("severity", "info"), IssueSeverity.INFO),
                category=category_map.get(ai_issue.get("category", "clarity"), AssessmentCategory.CLARITY),
                description=ai_issue.get("description", ""),
                found=ai_issue.get("found"),
                suggestion=ai_issue.get("suggestion"),
                impact=ai_issue.get("impact"),
            ))

        return issues

    def _build_category_evidence(
        self,
        final_scores: dict[AssessmentCategory, float],
        ai_evidence: dict,
        rule_scores: dict[AssessmentCategory, float],
    ) -> dict[AssessmentCategory, CategoryEvidence]:
        """Build evidence for each category from AI response and rule-based data."""
        evidence = {}

        for category in AssessmentCategory:
            score = final_scores.get(category, 75)
            status = EvidenceStatus.from_score(score)

            # Get AI-provided evidence for this category
            cat_key = category.value
            ai_cat_evidence = ai_evidence.get(cat_key, {})

            # Build evidence with fallbacks for rule-based categories
            supporting = ai_cat_evidence.get("supporting_excerpts", [])
            missing = ai_cat_evidence.get("missing_elements", [])
            opportunity = ai_cat_evidence.get("opportunity", "")
            impact = ai_cat_evidence.get("impact_prediction")

            # Add rule-based context for completeness/readability/structure
            if category == AssessmentCategory.COMPLETENESS and not opportunity:
                opportunity = "Add missing information like salary, location, or benefits"
            elif category == AssessmentCategory.READABILITY and not opportunity:
                opportunity = "Simplify language to 8th grade reading level"
            elif category == AssessmentCategory.STRUCTURE and not opportunity:
                opportunity = "Add clear sections with headers and bullet points"

            evidence[category] = CategoryEvidence(
                score=score,
                status=status,
                supporting_excerpts=supporting[:3],  # Limit to top 3
                missing_elements=missing[:3],
                opportunity=opportunity or f"Improve {category.label.lower()}",
                impact_prediction=impact,
            )

        return evidence

    async def analyze(
        self,
        jd_text: str,
        voice_profile: Optional[VoiceProfile] = None,
    ) -> AssessmentResult:
        """
        Full analysis combining rule-based and AI assessment.
        """
        # Rule-based analysis (fast, deterministic)
        rule_scores = self._calculate_rule_based_scores(jd_text)
        rule_issues = self._detect_rule_based_issues(jd_text)

        # Question coverage analysis (Rufus-inspired)
        question_coverage_raw = self.question_analyzer.analyze(jd_text)
        questions_answered = sum(1 for q in question_coverage_raw if q.is_answered)

        # Convert to model format
        question_coverage = [
            QuestionCoverageItem(
                question_id=q.question_id,
                question_text=q.question_text,
                is_answered=q.is_answered,
                importance=q.importance,
                evidence=q.evidence,
                suggestion=q.suggestion,
                impact_stat=q.impact_stat,
            )
            for q in question_coverage_raw
        ]

        # AI analysis (nuanced, contextual)
        ai_response = await self.claude_service.analyze(
            AnalyzeRequest(jd_text=jd_text, voice_profile=voice_profile)
        )

        # Extract AI scores
        ai_scores_raw = ai_response.get("scores", {})
        ai_scores = {}

        if ai_scores_raw.get("inclusivity") is not None:
            ai_scores[AssessmentCategory.INCLUSIVITY] = ai_scores_raw["inclusivity"]
        if ai_scores_raw.get("clarity") is not None:
            ai_scores[AssessmentCategory.CLARITY] = ai_scores_raw["clarity"]
        if ai_scores_raw.get("voice_match") is not None and voice_profile:
            ai_scores[AssessmentCategory.VOICE_MATCH] = ai_scores_raw["voice_match"]

        # Merge scores
        final_scores = self._merge_scores(rule_scores, ai_scores)

        # Build evidence-based breakdown
        ai_evidence = ai_response.get("category_evidence", {})
        category_evidence = self._build_category_evidence(
            final_scores, ai_evidence, rule_scores
        )

        # Combine issues (deduplicate by description)
        ai_issues = self._convert_ai_issues(ai_response.get("issues", []))
        seen_descriptions = {i.description for i in rule_issues}
        all_issues = rule_issues + [
            i for i in ai_issues if i.description not in seen_descriptions
        ]

        # Sort issues by severity
        all_issues.sort(key=lambda i: i.severity.value, reverse=True)

        # Calculate potential application boost
        bias_issue_count = sum(1 for i in all_issues if i.category == AssessmentCategory.INCLUSIVITY)
        estimated_boost = self.question_analyzer.estimate_application_boost(
            question_coverage_raw, bias_issue_count
        )

        return AssessmentResult(
            category_scores=final_scores,
            issues=all_issues,
            positives=ai_response.get("positives", []),
            improved_text=ai_response.get("improved_text", jd_text),
            category_evidence=category_evidence,
            question_coverage=question_coverage,
            questions_answered=questions_answered,
            questions_total=len(question_coverage),
            estimated_application_boost=estimated_boost if estimated_boost > 0 else None,
        )
