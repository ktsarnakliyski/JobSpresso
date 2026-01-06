# backend/app/routers/voice.py

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.services.claude_service import ClaudeService


router = APIRouter(prefix="/api/voice", tags=["voice"])


def get_claude_service() -> ClaudeService:
    settings = get_settings()
    return ClaudeService(api_key=settings.anthropic_api_key)


class ExtractVoiceRequest(BaseModel):
    example_jds: list[str]
    suggested_name: Optional[str] = None


class ExtractVoiceResponse(BaseModel):
    tone: str
    address_style: str
    sentence_style: str
    words_commonly_used: list[str]
    words_avoided: list[str]
    structure_preference: str
    summary: str


@router.post("/extract", response_model=ExtractVoiceResponse)
async def extract_voice_profile(
    body: ExtractVoiceRequest,
    service: ClaudeService = Depends(get_claude_service),
):
    """
    Extract voice profile characteristics from example JDs.
    """
    if not body.example_jds or len(body.example_jds) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one example JD is required"
        )

    try:
        result = await service.extract_voice_profile(body.example_jds)

        return ExtractVoiceResponse(
            tone=result.get("tone", "professional"),
            address_style=result.get("address_style", "direct_you"),
            sentence_style=result.get("sentence_style", "balanced"),
            words_commonly_used=result.get("words_commonly_used", []),
            words_avoided=result.get("words_avoided", []),
            structure_preference=result.get("structure_preference", "mixed"),
            summary=result.get("summary", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
