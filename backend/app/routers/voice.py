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


class StructureAnalysis(BaseModel):
    leads_with_benefits: bool = False
    typical_section_order: list[str] = []
    includes_salary: bool = False


class VocabularyAnalysis(BaseModel):
    commonly_used: list[str] = []
    notably_avoided: list[str] = []


class BrandSignals(BaseModel):
    values: list[str] = []
    personality: str = ""


class ExtractVoiceResponse(BaseModel):
    """Enhanced voice extraction response with Voice DNA fields."""
    # Core tone
    tone: str
    tone_formality: int
    tone_description: str

    # Style
    address_style: str
    sentence_style: str

    # Structure analysis (new)
    structure_analysis: StructureAnalysis

    # Vocabulary (enhanced)
    vocabulary: VocabularyAnalysis

    # Brand (new)
    brand_signals: BrandSignals

    # Summary
    summary: str

    # Legacy fields for compatibility
    words_commonly_used: list[str] = []
    words_avoided: list[str] = []
    structure_preference: str = "mixed"


@router.post("/extract", response_model=ExtractVoiceResponse)
async def extract_voice_profile(
    body: ExtractVoiceRequest,
    service: ClaudeService = Depends(get_claude_service),
):
    """Extract voice profile characteristics from example JDs."""
    if not body.example_jds or len(body.example_jds) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one example JD is required"
        )

    try:
        result = await service.extract_voice_profile(body.example_jds)

        # Parse structure analysis
        struct = result.get("structure_analysis", {})
        structure_analysis = StructureAnalysis(
            leads_with_benefits=struct.get("leads_with_benefits", False),
            typical_section_order=struct.get("typical_section_order", []),
            includes_salary=struct.get("includes_salary", False),
        )

        # Parse vocabulary
        vocab = result.get("vocabulary", {})
        vocabulary = VocabularyAnalysis(
            commonly_used=vocab.get("commonly_used", []),
            notably_avoided=vocab.get("notably_avoided", []),
        )

        # Parse brand signals
        brand = result.get("brand_signals", {})
        brand_signals = BrandSignals(
            values=brand.get("values", []),
            personality=brand.get("personality", ""),
        )

        return ExtractVoiceResponse(
            tone=result.get("tone", "professional"),
            tone_formality=result.get("tone_formality", 3),
            tone_description=result.get("tone_description", "Professional"),
            address_style=result.get("address_style", "direct_you"),
            sentence_style=result.get("sentence_style", "balanced"),
            structure_analysis=structure_analysis,
            vocabulary=vocabulary,
            brand_signals=brand_signals,
            summary=result.get("summary", ""),
            # Legacy fields
            words_commonly_used=vocabulary.commonly_used,
            words_avoided=vocabulary.notably_avoided,
            structure_preference="mixed",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
