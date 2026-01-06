# backend/app/services/assessment_service.py

import re
from typing import Optional
from app.models.assessment import (
    AssessmentCategory,
    AssessmentResult,
    Issue,
    IssueSeverity,
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
    """

    def __init__(self, claude_api_key: str):
        self.claude_service = ClaudeService(api_key=claude_api_key)

    def _calculate_rule_based_scores(self, text: str) -> dict[AssessmentCategory, float]:
        """Calculate scores using deterministic algorithms."""
        completeness_score, _ = calculate_completeness_score(text)

        return {
            AssessmentCategory.READABILITY: calculate_readability_score(text),
            AssessmentCategory.STRUCTURE: calculate_structure_score(text),
            AssessmentCategory.COMPLETENESS: completeness_score,
        }

    def _detect_rule_based_issues(self, text: str) -> list[Issue]:
        """Detect issues using word lists and pattern matching."""
        issues = []

        # Bias word detection
        bias_found = detect_bias_words(text)

        for bias_type, words in bias_found.items():
            severity = IssueSeverity.WARNING
            if bias_type == "problematic":
                severity = IssueSeverity.WARNING

            for word in words:
                suggestion = BIAS_REPLACEMENTS.get(word, f"consider alternatives to '{word}'")
                issues.append(Issue(
                    severity=severity,
                    category=AssessmentCategory.INCLUSIVITY,
                    description=f"Found {bias_type}-coded word: '{word}'",
                    found=word,
                    suggestion=suggestion,
                    impact=f"May discourage diverse candidates from applying",
                ))

        # Completeness issues
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

        # Additional check: salary mentioned but no specific range/amount
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

        # Readability issues
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

        # Combine issues (deduplicate by description)
        ai_issues = self._convert_ai_issues(ai_response.get("issues", []))
        seen_descriptions = {i.description for i in rule_issues}
        all_issues = rule_issues + [
            i for i in ai_issues if i.description not in seen_descriptions
        ]

        # Sort issues by severity
        all_issues.sort(key=lambda i: i.severity.value, reverse=True)

        return AssessmentResult(
            category_scores=final_scores,
            issues=all_issues,
            positives=ai_response.get("positives", []),
            improved_text=ai_response.get("improved_text", jd_text),
        )
