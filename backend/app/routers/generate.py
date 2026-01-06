# backend/app/routers/generate.py

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.models.voice_profile import VoiceProfile
from app.services.claude_service import ClaudeService, GenerateRequest


router = APIRouter(prefix="/api", tags=["generate"])


def get_claude_service() -> ClaudeService:
    settings = get_settings()
    return ClaudeService(api_key=settings.anthropic_api_key)


class GenerateRequestBody(BaseModel):
    role_title: str
    responsibilities: list[str]
    requirements: list[str]
    company_description: Optional[str] = None
    team_size: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    benefits: Optional[list[str]] = None
    nice_to_have: Optional[list[str]] = None
    voice_profile: Optional[VoiceProfile] = None


class GenerateResponse(BaseModel):
    generated_jd: str
    word_count: int
    notes: list[str]


@router.post("/generate", response_model=GenerateResponse)
async def generate_jd(
    body: GenerateRequestBody,
    service: ClaudeService = Depends(get_claude_service),
):
    """
    Generate a job description from provided inputs.
    """
    try:
        request = GenerateRequest(
            role_title=body.role_title,
            responsibilities=body.responsibilities,
            requirements=body.requirements,
            company_description=body.company_description,
            team_size=body.team_size,
            salary_range=body.salary_range,
            location=body.location,
            benefits=body.benefits,
            nice_to_have=body.nice_to_have,
        )

        result = await service.generate(request, body.voice_profile)

        return GenerateResponse(
            generated_jd=result.get("generated_jd", ""),
            word_count=result.get("word_count", 0),
            notes=result.get("notes", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
