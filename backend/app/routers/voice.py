# backend/app/routers/voice.py

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, ConfigDict

from app.config import get_settings
from app.services.claude_service import ClaudeService
from app.rate_limit import limiter

logger = logging.getLogger(__name__)


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


class SuggestedRuleResponse(BaseModel):
    """API response model for AI-suggested rules (flat structure).

    This is the flattened version sent to frontend. The internal model
    SuggestedRule (in models/voice_profile.py) has nested ProfileRule.
    Frontend converts these flat suggestions to ProfileRule when accepting.
    """
    text: str  # Natural language rule
    rule_type: str = "custom"  # "exclude" | "include" | "format" | "order" | "limit" | "custom"
    target: Optional[str] = None
    value: Optional[str] = None
    confidence: float = 0.8
    evidence: str = ""


class RawClaudeVoiceResponse(BaseModel):
    """Model for parsing raw Claude voice extraction response with defaults."""
    tone: str = "professional"
    tone_formality: int = 3
    tone_description: str = "Professional"
    address_style: str = "direct_you"
    sentence_style: str = "balanced"
    structure_analysis: StructureAnalysis = StructureAnalysis()
    vocabulary: VocabularyAnalysis = VocabularyAnalysis()
    brand_signals: BrandSignals = BrandSignals()
    suggested_rules: list[dict] = []
    format_guidance: Optional[str] = None
    summary: str = ""

    model_config = ConfigDict(extra="ignore")  # Ignore unexpected fields from Claude


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

    # AI-suggested rules based on patterns
    suggested_rules: list[SuggestedRuleResponse] = []

    # Optional format guidance
    format_guidance: Optional[str] = None

    # Summary
    summary: str

    # Legacy fields for compatibility
    words_commonly_used: list[str] = []
    words_avoided: list[str] = []
    structure_preference: str = "mixed"


@router.post("/extract", response_model=ExtractVoiceResponse)
@limiter.limit("5/minute")
async def extract_voice_profile(
    request: Request,
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

        # Parse raw response with Pydantic model (handles defaults automatically)
        parsed = RawClaudeVoiceResponse.model_validate(result)

        # Parse suggested rules with confidence clamping
        suggested_rules = []
        for rule in parsed.suggested_rules:
            if isinstance(rule, dict) and rule.get("text"):
                try:
                    conf = float(rule.get("confidence", 0.8))
                except (ValueError, TypeError):
                    conf = 0.8
                suggested_rules.append(SuggestedRuleResponse(
                    text=rule.get("text", ""),
                    rule_type=rule.get("rule_type", "custom"),
                    target=rule.get("target"),
                    value=rule.get("value"),
                    confidence=min(1.0, max(0.0, conf)),
                    evidence=rule.get("evidence", ""),
                ))

        return ExtractVoiceResponse(
            tone=parsed.tone,
            tone_formality=min(5, max(1, parsed.tone_formality)),
            tone_description=parsed.tone_description,
            address_style=parsed.address_style,
            sentence_style=parsed.sentence_style,
            structure_analysis=parsed.structure_analysis,
            vocabulary=parsed.vocabulary,
            brand_signals=parsed.brand_signals,
            suggested_rules=suggested_rules,
            format_guidance=parsed.format_guidance,
            summary=parsed.summary,
            # Legacy fields
            words_commonly_used=parsed.vocabulary.commonly_used,
            words_avoided=parsed.vocabulary.notably_avoided,
            structure_preference="mixed",
        )
    except ValueError as e:
        # Validation errors - safe to expose
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Voice extraction failed")
        raise HTTPException(status_code=500, detail="Voice extraction failed. Please try again.")
