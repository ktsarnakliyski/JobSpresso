# backend/app/services/issue_detector.py

"""Issue detection module for JD assessment.

Handles detection of various issues in job descriptions:
- Bias word detection
- Completeness issues (missing information)
- Readability issues
- Voice profile exclusion filtering
"""

import re
from typing import Optional
from app.models.assessment import (
    AssessmentCategory,
    Issue,
    IssueSeverity,
)
from app.models.voice_profile import VoiceProfile, RuleType
from app.services.scoring import (
    calculate_readability_score,
    calculate_completeness_score,
    detect_bias_words,
)
from app.services.field_mappings import (
    BIAS_REPLACEMENTS,
    EXCLUSION_PATTERNS,
    get_fields_for_keywords,
    issue_mentions_excluded_field,
)


class IssueDetector:
    """Detects issues in job descriptions using rule-based methods."""

    # Impact messages for missing information
    IMPACT_MAP = {
        "salary": "66% less engagement without salary transparency",
        "location": "Candidates need to know work arrangement",
        "benefits": "28% of candidates specifically look for benefits",
        "team_size": "Helps candidates understand the role context",
        "requirements_listed": "Clear requirements reduce unqualified applications",
    }

    def get_excluded_fields_from_profile(
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
                if rule.target:
                    excluded.update(get_fields_for_keywords(rule.target))
                excluded.update(get_fields_for_keywords(rule_lower))

            # Method 2: Detect exclusion intent from 'custom' rules only
            elif rule.rule_type == RuleType.CUSTOM:
                has_exclusion_intent = any(
                    pattern in rule_lower for pattern in EXCLUSION_PATTERNS
                )
                if has_exclusion_intent:
                    excluded.update(get_fields_for_keywords(rule_lower))

        return excluded

    def detect_bias_issues(self, text: str) -> list[Issue]:
        """Detect bias-related issues using word lists."""
        issues = []
        bias_found = detect_bias_words(text)

        for bias_type, words in bias_found.items():
            for word in words:
                suggestion = BIAS_REPLACEMENTS.get(
                    word, f"consider alternatives to '{word}'"
                )
                issues.append(Issue(
                    severity=IssueSeverity.WARNING,
                    category=AssessmentCategory.INCLUSIVITY,
                    description=f"Found {bias_type}-coded word: '{word}'",
                    found=word,
                    suggestion=suggestion,
                    impact="May discourage diverse candidates from applying",
                ))

        return issues

    def detect_completeness_issues(
        self, text: str, excluded_fields: Optional[set[str]] = None
    ) -> list[Issue]:
        """Detect missing information issues, respecting excluded fields."""
        issues = []
        excluded = excluded_fields or set()
        _, missing = calculate_completeness_score(text, excluded)

        for field in missing:
            if field in excluded:
                continue

            severity = (
                IssueSeverity.CRITICAL if field == "salary" else IssueSeverity.WARNING
            )
            issues.append(Issue(
                severity=severity,
                category=AssessmentCategory.COMPLETENESS,
                description=f"Missing {field.replace('_', ' ')}",
                suggestion=f"Add {field.replace('_', ' ')} information",
                impact=self.IMPACT_MAP.get(field, "Improves candidate decision-making"),
            ))

        # Check for salary mentioned without specifics
        if "salary" not in excluded:
            text_lower = text.lower()
            has_salary_word = bool(
                re.search(r'\bsalary\b|\bcompensation\b|\bpay\b', text_lower)
            )
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

    def detect_readability_issues(self, text: str) -> list[Issue]:
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

    def detect_all_issues(
        self, text: str, voice_profile: Optional[VoiceProfile] = None
    ) -> list[Issue]:
        """Detect all rule-based issues, respecting voice profile exclusions."""
        excluded_fields = self.get_excluded_fields_from_profile(voice_profile)

        issues = []
        issues.extend(self.detect_bias_issues(text))
        issues.extend(self.detect_completeness_issues(text, excluded_fields))
        issues.extend(self.detect_readability_issues(text))
        return issues

    def issue_conflicts_with_exclusions(
        self, issue: Issue, excluded_fields: set[str]
    ) -> bool:
        """
        Check if an AI-generated issue conflicts with voice profile exclusions.

        For example, if the user has "Never include salary information" as a rule,
        we should not show issues suggesting to add salary information.
        """
        return issue_mentions_excluded_field(
            description=issue.description,
            found=issue.found,
            suggestion=issue.suggestion,
            excluded_fields=excluded_fields,
        )
