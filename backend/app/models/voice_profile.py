# backend/app/models/voice_profile.py

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ToneStyle(str, Enum):
    FORMAL = "formal"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    CASUAL = "casual"
    STARTUP_CASUAL = "startup_casual"


class AddressStyle(str, Enum):
    DIRECT_YOU = "direct_you"  # "You will..."
    THIRD_PERSON = "third_person"  # "The candidate will..."
    WE_LOOKING = "we_looking"  # "We're looking for someone who..."


class SentenceStyle(str, Enum):
    SHORT_PUNCHY = "short_punchy"
    BALANCED = "balanced"
    DETAILED = "detailed"


class VoiceProfile(BaseModel):
    id: str
    name: str
    tone: ToneStyle
    address_style: AddressStyle = AddressStyle.DIRECT_YOU
    sentence_style: SentenceStyle = SentenceStyle.BALANCED
    words_to_avoid: list[str] = []
    words_to_prefer: list[str] = []
    structure_preference: str = "mixed"  # bullet_heavy, mixed, paragraph_focused
    example_jd: Optional[str] = None
    is_default: bool = False

    def to_prompt_context(self) -> str:
        """Generate prompt context for AI from this profile."""
        tone_descriptions = {
            ToneStyle.FORMAL: "Formal and traditional corporate tone. Professional language, complete sentences, traditional structure.",
            ToneStyle.PROFESSIONAL: "Professional but approachable. Business language without being stiff.",
            ToneStyle.FRIENDLY: "Friendly and warm. Conversational while maintaining professionalism.",
            ToneStyle.CASUAL: "Casual and relaxed. Conversational, uses contractions, feels human.",
            ToneStyle.STARTUP_CASUAL: "Startup casual. Energetic, direct, growth-focused, uses modern language.",
        }

        address_descriptions = {
            AddressStyle.DIRECT_YOU: 'Address candidates directly using "you" and "your".',
            AddressStyle.THIRD_PERSON: 'Use third person like "the candidate" or "the ideal person".',
            AddressStyle.WE_LOOKING: 'Frame from company perspective: "We\'re looking for someone who..."',
        }

        sentence_descriptions = {
            SentenceStyle.SHORT_PUNCHY: "Use short, punchy sentences. Maximum 2-3 sentences per paragraph.",
            SentenceStyle.BALANCED: "Use balanced sentence length. Mix of short and medium sentences.",
            SentenceStyle.DETAILED: "Use detailed, thorough sentences. Complete explanations.",
        }

        parts = [
            f"VOICE PROFILE: {self.name}",
            f"Tone: {tone_descriptions[self.tone]}",
            f"Address Style: {address_descriptions[self.address_style]}",
            f"Sentence Style: {sentence_descriptions[self.sentence_style]}",
        ]

        if self.words_to_avoid:
            parts.append(f"Words to AVOID: {', '.join(self.words_to_avoid)}")

        if self.words_to_prefer:
            parts.append(f"Words to PREFER: {', '.join(self.words_to_prefer)}")

        if self.example_jd:
            parts.append(f"Example JD for reference style:\n{self.example_jd[:1000]}")

        return "\n".join(parts)


class VoiceProfileCreate(BaseModel):
    """Input model for creating a voice profile."""
    name: str
    tone: ToneStyle
    address_style: AddressStyle = AddressStyle.DIRECT_YOU
    sentence_style: SentenceStyle = SentenceStyle.BALANCED
    words_to_avoid: list[str] = []
    words_to_prefer: list[str] = []
    structure_preference: str = "mixed"
    example_jd: Optional[str] = None
    is_default: bool = False


class ExtractVoiceRequest(BaseModel):
    """Input for extracting voice profile from example JDs."""
    example_jds: list[str]
    suggested_name: Optional[str] = None
