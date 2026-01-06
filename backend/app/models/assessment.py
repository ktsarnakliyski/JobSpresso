# backend/app/models/assessment.py

from enum import Enum
from typing import Optional
from pydantic import BaseModel, computed_field


class AssessmentCategory(str, Enum):
    INCLUSIVITY = "inclusivity"
    READABILITY = "readability"
    STRUCTURE = "structure"
    COMPLETENESS = "completeness"
    CLARITY = "clarity"
    VOICE_MATCH = "voice_match"

    @property
    def weight(self) -> int:
        weights = {
            self.INCLUSIVITY: 25,
            self.READABILITY: 20,
            self.STRUCTURE: 15,
            self.COMPLETENESS: 15,
            self.CLARITY: 10,
            self.VOICE_MATCH: 15,
        }
        return weights[self]

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
    category_scores: dict[AssessmentCategory, float]
    issues: list[Issue]
    positives: list[str]
    improved_text: str

    @computed_field
    @property
    def overall_score(self) -> float:
        total = sum(
            score * (category.weight / 100)
            for category, score in self.category_scores.items()
        )
        return round(total, 2)

    @computed_field
    @property
    def interpretation(self) -> ScoreInterpretation:
        return ScoreInterpretation.from_score(self.overall_score)
