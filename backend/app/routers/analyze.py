# backend/app/routers/analyze.py

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.models.assessment import AssessmentResult, AssessmentCategory
from app.models.voice_profile import VoiceProfile
from app.services.assessment_service import AssessmentService


router = APIRouter(prefix="/api", tags=["analyze"])


def get_assessment_service() -> AssessmentService:
    settings = get_settings()
    return AssessmentService(claude_api_key=settings.anthropic_api_key)


class AnalyzeRequestBody(BaseModel):
    jd_text: str
    voice_profile: Optional[VoiceProfile] = None


class AnalyzeResponse(BaseModel):
    overall_score: float
    interpretation: str
    category_scores: dict[str, float]
    issues: list[dict]
    positives: list[str]
    improved_text: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_jd(
    body: AnalyzeRequestBody,
    service: AssessmentService = Depends(get_assessment_service),
):
    """
    Analyze a job description and return scores, issues, and improvements.
    """
    try:
        result = await service.analyze(
            jd_text=body.jd_text,
            voice_profile=body.voice_profile,
        )

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
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
