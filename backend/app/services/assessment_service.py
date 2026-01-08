# backend/app/services/assessment_service.py

import logging
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
    calculate_structure_score,
    calculate_completeness_score,
)
from app.services.claude_service import ClaudeService, AnalyzeRequest
from app.services.question_analyzer import QuestionCoverageAnalyzer
from app.services.issue_detector import IssueDetector

logger = logging.getLogger(__name__)


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
        self.issue_detector = IssueDetector()

    def _calculate_rule_based_scores(
        self, text: str, excluded_fields: Optional[set[str]] = None
    ) -> dict[AssessmentCategory, float]:
        """Calculate scores using deterministic algorithms, respecting excluded fields."""
        completeness_score, _ = calculate_completeness_score(text, excluded_fields)

        return {
            AssessmentCategory.READABILITY: calculate_readability_score(text),
            AssessmentCategory.STRUCTURE: calculate_structure_score(text),
            AssessmentCategory.COMPLETENESS: completeness_score,
        }

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
        from app.services.field_mappings import get_severity_map, get_category_map

        issues = []
        severity_map = get_severity_map()
        category_map = get_category_map()

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
        # Get excluded fields from voice profile rules
        excluded_fields = self.issue_detector.get_excluded_fields_from_profile(voice_profile)

        # Rule-based analysis (fast, deterministic) - respects excluded fields
        rule_scores = self._calculate_rule_based_scores(jd_text, excluded_fields)
        rule_issues = self.issue_detector.detect_all_issues(jd_text, voice_profile)

        # Question coverage analysis (Rufus-inspired) - respects excluded topics
        question_coverage_raw = self.question_analyzer.analyze(jd_text, excluded_fields)
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

        # Combine issues (deduplicate by description and filter by excluded fields)
        ai_issues = self._convert_ai_issues(ai_response.get("issues", []))
        seen_descriptions = {i.description for i in rule_issues}

        # Filter AI issues that conflict with voice profile exclusions
        filtered_ai_issues = []
        for issue in ai_issues:
            if issue.description in seen_descriptions:
                continue  # Already in rule issues, skip duplicate

            # Check if this issue is about an excluded topic
            if self.issue_detector.issue_conflicts_with_exclusions(issue, excluded_fields):
                continue  # Skip issues about topics the user explicitly excluded

            filtered_ai_issues.append(issue)

        all_issues = rule_issues + filtered_ai_issues

        # Sort issues by severity
        all_issues.sort(key=lambda i: i.severity.value, reverse=True)

        # Calculate potential application boost
        bias_issue_count = sum(1 for i in all_issues if i.category == AssessmentCategory.INCLUSIVITY)
        estimated_boost = self.question_analyzer.estimate_application_boost(
            question_coverage_raw, bias_issue_count
        )

        # === TWO-PASS IMPROVEMENT SYSTEM ===
        # Pass 2: Generate improved version with full scoring context
        # This gives Claude knowledge of how scoring works so improvements actually score higher

        # Build scores dict for improvement prompt
        scores_for_improvement = {
            "inclusivity": final_scores.get(AssessmentCategory.INCLUSIVITY, 75),
            "readability": final_scores.get(AssessmentCategory.READABILITY, 75),
            "structure": final_scores.get(AssessmentCategory.STRUCTURE, 75),
            "completeness": final_scores.get(AssessmentCategory.COMPLETENESS, 75),
            "clarity": final_scores.get(AssessmentCategory.CLARITY, 75),
            "voice_match": final_scores.get(AssessmentCategory.VOICE_MATCH, 75),
        }

        # Format issues for improvement prompt
        issues_for_improvement = [
            {
                "severity": issue.severity.name.lower(),
                "category": issue.category.value,
                "description": issue.description,
                "found": issue.found,
                "suggestion": issue.suggestion,
            }
            for issue in all_issues
        ]

        # Generate improved version with full context
        # Wrap in try/except so Pass 1 results aren't lost if improvement fails
        try:
            improved_text = await self.claude_service.generate_improvement(
                original_jd=jd_text,
                scores=scores_for_improvement,
                issues=issues_for_improvement,
                voice_profile=voice_profile,
            )
        except Exception:
            logger.exception(
                "Improvement generation failed for JD (length=%d chars), using original text",
                len(jd_text)
            )
            # Fall back to original text if improvement generation fails
            improved_text = jd_text

        return AssessmentResult(
            category_scores=final_scores,
            issues=all_issues,
            positives=ai_response.get("positives", []),
            improved_text=improved_text,
            category_evidence=category_evidence,
            question_coverage=question_coverage,
            questions_answered=questions_answered,
            questions_total=len(question_coverage),
            estimated_application_boost=estimated_boost if estimated_boost > 0 else None,
        )
