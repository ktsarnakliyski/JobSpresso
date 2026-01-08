# backend/app/routers/analyze.py

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models.assessment import AssessmentResult, AssessmentCategory
from app.models.voice_profile import VoiceProfile
from app.services.assessment_service import AssessmentService
from app.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


def get_assessment_service() -> AssessmentService:
    settings = get_settings()
    return AssessmentService(claude_api_key=settings.anthropic_api_key)


class AnalyzeRequestBody(BaseModel):
    jd_text: str = Field(..., min_length=50, max_length=50000)
    voice_profile: Optional[VoiceProfile] = None


class CategoryEvidenceResponse(BaseModel):
    score: float
    status: str  # good, warning, critical
    supporting_excerpts: list[str]
    missing_elements: list[str]
    opportunity: str
    impact_prediction: Optional[str] = None


class QuestionCoverageResponse(BaseModel):
    question_id: str
    question_text: str
    is_answered: bool
    importance: str
    evidence: Optional[str] = None
    suggestion: Optional[str] = None
    impact_stat: str


class AnalyzeResponse(BaseModel):
    # Core scores
    overall_score: float
    interpretation: str
    category_scores: dict[str, float]
    issues: list[dict]
    positives: list[str]
    improved_text: str

    # Evidence-based breakdown (COSMO-inspired)
    category_evidence: dict[str, CategoryEvidenceResponse]

    # Question coverage (Rufus Q&A-inspired)
    question_coverage: list[QuestionCoverageResponse]
    questions_answered: int
    questions_total: int
    question_coverage_percent: int

    # HR metrics
    estimated_application_boost: Optional[int] = None


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("10/minute")
async def analyze_jd(
    request: Request,
    body: AnalyzeRequestBody,
    service: AssessmentService = Depends(get_assessment_service),
):
    """
    Analyze a job description and return scores, issues, and improvements.
    Enhanced with evidence-based scoring and candidate question coverage.
    """
    try:
        result = await service.analyze(
            jd_text=body.jd_text,
            voice_profile=body.voice_profile,
        )

        # Build category evidence response
        category_evidence = {}
        for cat, evidence in result.category_evidence.items():
            category_evidence[cat.value] = CategoryEvidenceResponse(
                score=evidence.score,
                status=evidence.status.value,
                supporting_excerpts=evidence.supporting_excerpts,
                missing_elements=evidence.missing_elements,
                opportunity=evidence.opportunity,
                impact_prediction=evidence.impact_prediction,
            )

        # Build question coverage response
        question_coverage = [
            QuestionCoverageResponse(
                question_id=q.question_id,
                question_text=q.question_text,
                is_answered=q.is_answered,
                importance=q.importance,
                evidence=q.evidence,
                suggestion=q.suggestion,
                impact_stat=q.impact_stat,
            )
            for q in result.question_coverage
        ]

        return AnalyzeResponse(
            overall_score=result.overall_score,
            interpretation=result.interpretation.value,
            category_scores={
                cat.value: score for cat, score in result.category_scores.items()
            },
            issues=[
                {
                    "severity": issue.severity.name.lower(),
                    "category": issue.category.value,
                    "description": issue.description,
                    "found": issue.found,
                    "suggestion": issue.suggestion,
                    "impact": issue.impact,
                }
                for issue in result.issues
            ],
            positives=result.positives,
            improved_text=result.improved_text,
            category_evidence=category_evidence,
            question_coverage=question_coverage,
            questions_answered=result.questions_answered,
            questions_total=result.questions_total,
            question_coverage_percent=result.question_coverage_percent,
            estimated_application_boost=result.estimated_application_boost,
        )
    except ValueError as e:
        # Validation errors - safe to expose
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")
