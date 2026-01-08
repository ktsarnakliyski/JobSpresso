# backend/app/routers/voice.py

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

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

        # Parse suggested rules
        raw_rules = result.get("suggested_rules", [])
        suggested_rules = []
        for rule in raw_rules:
            if isinstance(rule, dict) and rule.get("text"):
                # Safely parse confidence with fallback
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
            tone=result.get("tone", "professional"),
            tone_formality=min(5, max(1, result.get("tone_formality", 3))),
            tone_description=result.get("tone_description", "Professional"),
            address_style=result.get("address_style", "direct_you"),
            sentence_style=result.get("sentence_style", "balanced"),
            structure_analysis=structure_analysis,
            vocabulary=vocabulary,
            brand_signals=brand_signals,
            suggested_rules=suggested_rules,
            format_guidance=result.get("format_guidance"),
            summary=result.get("summary", ""),
            # Legacy fields
            words_commonly_used=vocabulary.commonly_used,
            words_avoided=vocabulary.notably_avoided,
            structure_preference="mixed",
        )
    except ValueError as e:
        # Validation errors - safe to expose
        raise HTTPException(status_code=400, detail=str(e))
    except (TypeError, KeyError) as e:
        logger.exception("Failed to process extraction result")
        raise HTTPException(
            status_code=500,
            detail="Failed to process extraction result. Please try again."
        )
    except Exception as e:
        # Log unexpected errors but don't expose internal details
        logger.exception("Unexpected error in voice extraction")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during voice extraction"
        )
