# backend/app/models/assessment.py

from enum import Enum
from typing import Optional
from pydantic import BaseModel, computed_field

from app.services.field_mappings import CATEGORY_WEIGHTS


class EvidenceStatus(str, Enum):
    """Status indicator for category evidence (like COSMO's checkmarks)."""
    GOOD = "good"  # ✓ - Score >= 80
    WARNING = "warning"  # ⚠ - Score 50-79
    CRITICAL = "critical"  # ✗ - Score < 50

    @classmethod
    def from_score(cls, score: float) -> "EvidenceStatus":
        if score >= 80:
            return cls.GOOD
        elif score >= 50:
            return cls.WARNING
        else:
            return cls.CRITICAL


class CategoryEvidence(BaseModel):
    """Evidence supporting a category score (COSMO-inspired)."""
    score: float
    status: EvidenceStatus
    supporting_excerpts: list[str]  # Text from JD that earns points
    missing_elements: list[str]  # What's absent or needs improvement
    opportunity: str  # Main actionable improvement
    impact_prediction: Optional[str] = None  # e.g., "Adding X could increase Y by Z%"


class QuestionCoverageItem(BaseModel):
    """Whether a candidate question is answered (Rufus Q&A-inspired)."""
    question_id: str
    question_text: str
    is_answered: bool
    importance: str  # high, medium, low
    evidence: Optional[str] = None  # Excerpt that answers the question
    suggestion: Optional[str] = None  # How to answer if missing
    impact_stat: str  # Research-backed statistic


class AssessmentCategory(str, Enum):
    INCLUSIVITY = "inclusivity"
    READABILITY = "readability"
    STRUCTURE = "structure"
    COMPLETENESS = "completeness"
    CLARITY = "clarity"
    VOICE_MATCH = "voice_match"

    @property
    def label(self) -> str:
        labels = {
            self.INCLUSIVITY: "Inclusivity",
            self.READABILITY: "Readability",
            self.STRUCTURE: "Structure",
            self.COMPLETENESS: "Completeness",
            self.CLARITY: "Clarity",
            self.VOICE_MATCH: "Voice Match",
        }
        return labels[self]


class IssueSeverity(int, Enum):
    INFO = 1
    WARNING = 2
    CRITICAL = 3


class ScoreInterpretation(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    NEEDS_WORK = "needs_work"
    POOR = "poor"
    CRITICAL = "critical"

    @classmethod
    def from_score(cls, score: float) -> "ScoreInterpretation":
        if score >= 90:
            return cls.EXCELLENT
        elif score >= 75:
            return cls.GOOD
        elif score >= 60:
            return cls.NEEDS_WORK
        elif score >= 40:
            return cls.POOR
        else:
            return cls.CRITICAL

    @property
    def color(self) -> str:
        colors = {
            self.EXCELLENT: "green",
            self.GOOD: "green",
            self.NEEDS_WORK: "yellow",
            self.POOR: "orange",
            self.CRITICAL: "red",
        }
        return colors[self]


class Issue(BaseModel):
    severity: IssueSeverity
    category: AssessmentCategory
    description: str
    found: Optional[str] = None
    suggestion: Optional[str] = None
    impact: Optional[str] = None


class AssessmentResult(BaseModel):
    """Full assessment result with evidence and question coverage."""
    # Core scores
    category_scores: dict[AssessmentCategory, float]
    issues: list[Issue]
    positives: list[str]
    improved_text: str

    # NEW: Evidence-based breakdown (COSMO-inspired)
    category_evidence: dict[AssessmentCategory, CategoryEvidence] = {}

    # NEW: Candidate question coverage (Rufus Q&A-inspired)
    question_coverage: list[QuestionCoverageItem] = []
    questions_answered: int = 0
    questions_total: int = 0

    # NEW: HR-specific metrics
    estimated_application_boost: Optional[int] = None  # e.g., 35 means +35%

    @computed_field
    @property
    def overall_score(self) -> float:
        """Calculate weighted overall score using CATEGORY_WEIGHTS from field_mappings."""
        total = sum(
            score * CATEGORY_WEIGHTS.get(category.value, 0)
            for category, score in self.category_scores.items()
        )
        return round(total, 2)

    @computed_field
    @property
    def interpretation(self) -> ScoreInterpretation:
        return ScoreInterpretation.from_score(self.overall_score)

    @computed_field
    @property
    def question_coverage_percent(self) -> int:
        if self.questions_total == 0:
            return 0
        return round((self.questions_answered / self.questions_total) * 100)
