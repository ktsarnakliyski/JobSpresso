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
from app.models.voice_profile import VoiceProfile, RuleType
from app.services.scoring import (
    calculate_readability_score,
    calculate_length_score,
    calculate_structure_score,
    calculate_completeness_score,
    detect_bias_words,
)
from app.services.claude_service import ClaudeService, AnalyzeRequest
from app.services.question_analyzer import QuestionCoverageAnalyzer
from app.services.field_mappings import (
    FIELD_KEYWORDS,
    get_fields_for_keywords,
    issue_mentions_excluded_field,
)


# Replacement suggestions for bias words (synced with BIAS_WORD_LISTS in scoring.py)
BIAS_REPLACEMENTS = {
    # Tech bro culture terms
    "ninja": "expert",
    "rockstar": "top performer",
    "guru": "specialist",
    "wizard": "expert",
    "superhero": "high performer",
    "unicorn": "versatile professional",
    # Discriminatory phrases
    "culture fit": "values alignment",
    "digital native": "digitally fluent",
    "native English speaker": "fluent English speaker",
    # Unrealistic expectations
    "hit the ground running": "quickly onboard",
    "wear many hats": "take on varied responsibilities",
    "fast-paced environment": "dynamic environment",
    "work hard play hard": "balanced work culture",
    # Ageist terms
    "young": "early-career",
    "fresh": "new to the field",
    "overqualified": "highly experienced",
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

    # Patterns that indicate exclusion intent in rule text
    EXCLUSION_PATTERNS = [
        "never include",
        "don't include",
        "do not include",
        "exclude",
        "skip",
        "omit",
        "no salary",
        "no location",
        "no benefits",
        "no team",
        "without salary",
        "without location",
        "without benefits",
    ]

    def _get_excluded_fields_from_profile(
        self, voice_profile: Optional[VoiceProfile]
    ) -> set[str]:
        """
        Extract field names that should be excluded from completeness checks
        based on voice profile rules.

        Detects exclusions from:
        1. Explicit EXCLUDE rule_type
        2. Rule text containing exclusion intent ("never", "don't", "no", "skip")
           combined with topic keywords

        Returns set of field names like {'salary', 'benefits', 'team_size'}
        """
        if not voice_profile:
            return set()

        excluded: set[str] = set()

        for rule in voice_profile.rules:
            if not rule.active:
                continue

            rule_lower = rule.text.lower()

            # Method 1: Explicit EXCLUDE rule_type
            if rule.rule_type == RuleType.EXCLUDE:
                # Check by explicit target (use shared mapping)
                if rule.target:
                    excluded.update(get_fields_for_keywords(rule.target))

                # Check rule text for topic keywords
                excluded.update(get_fields_for_keywords(rule_lower))

            # Method 2: Detect exclusion intent from 'custom' rules only
            # E.g., "Never include salary information" → excludes salary
            # Only applies to CUSTOM rules, not INCLUDE/FORMAT/ORDER/LIMIT
            elif rule.rule_type == RuleType.CUSTOM:
                has_exclusion_intent = any(
                    pattern in rule_lower for pattern in self.EXCLUSION_PATTERNS
                )
                if has_exclusion_intent:
                    excluded.update(get_fields_for_keywords(rule_lower))

        return excluded

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

    def _detect_completeness_issues(
        self, text: str, excluded_fields: Optional[set[str]] = None
    ) -> list[Issue]:
        """Detect missing information issues, respecting excluded fields from voice profile."""
        issues = []
        excluded = excluded_fields or set()
        _, missing = calculate_completeness_score(text, excluded)

        impact_map = {
            "salary": "66% less engagement without salary transparency",
            "location": "Candidates need to know work arrangement",
            "benefits": "28% of candidates specifically look for benefits",
            "team_size": "Helps candidates understand the role context",
            "requirements_listed": "Clear requirements reduce unqualified applications",
        }

        for field in missing:
            # Skip fields excluded by voice profile rules
            if field in excluded:
                continue

            severity = IssueSeverity.CRITICAL if field == "salary" else IssueSeverity.WARNING
            issues.append(Issue(
                severity=severity,
                category=AssessmentCategory.COMPLETENESS,
                description=f"Missing {field.replace('_', ' ')}",
                suggestion=f"Add {field.replace('_', ' ')} information",
                impact=impact_map.get(field, "Improves candidate decision-making"),
            ))

        # Check for salary mentioned without specifics (only if salary not excluded)
        if "salary" not in excluded:
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

    def _detect_rule_based_issues(
        self, text: str, voice_profile: Optional[VoiceProfile] = None
    ) -> list[Issue]:
        """Detect issues using word lists and pattern matching, respecting voice profile rules."""
        excluded_fields = self._get_excluded_fields_from_profile(voice_profile)

        issues = []
        issues.extend(self._detect_bias_issues(text))
        issues.extend(self._detect_completeness_issues(text, excluded_fields))
        issues.extend(self._detect_readability_issues(text))
        return issues

    def _issue_conflicts_with_exclusions(
        self, issue: Issue, excluded_fields: set[str]
    ) -> bool:
        """
        Check if an AI-generated issue conflicts with voice profile exclusions.

        For example, if the user has "Never include salary information" as a rule,
        we should not show issues suggesting to add salary information.

        Args:
            issue: The Issue object to check
            excluded_fields: Set of field names excluded by voice profile rules

        Returns:
            True if the issue conflicts with exclusions and should be filtered out
        """
        return issue_mentions_excluded_field(
            description=issue.description,
            found=issue.found,
            suggestion=issue.suggestion,
            excluded_fields=excluded_fields,
        )

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
        # Get excluded fields from voice profile rules
        excluded_fields = self._get_excluded_fields_from_profile(voice_profile)

        # Rule-based analysis (fast, deterministic) - respects excluded fields
        rule_scores = self._calculate_rule_based_scores(jd_text, excluded_fields)
        rule_issues = self._detect_rule_based_issues(jd_text, voice_profile)

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
            if self._issue_conflicts_with_exclusions(issue, excluded_fields):
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
