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
    DIRECT_YOU = "direct_you"
    THIRD_PERSON = "third_person"
    WE_LOOKING = "we_looking"


class SentenceStyle(str, Enum):
    SHORT_PUNCHY = "short_punchy"
    BALANCED = "balanced"
    DETAILED = "detailed"


class StructurePreferences(BaseModel):
    """Preferences for JD structure and section ordering."""
    lead_with_benefits: bool = False
    section_order: list[str] = ["intro", "responsibilities", "requirements", "benefits"]
    include_salary_prominently: bool = False


class VoiceProfile(BaseModel):
    """Enhanced voice profile with Voice DNA attributes."""
    id: str
    name: str

    # Tone (enhanced from single enum to spectrum + description)
    tone_formality: int = 3  # 1=very formal, 5=very casual
    tone_description: str = "Professional"  # AI-extracted or user-written

    # Legacy fields (kept for compatibility)
    tone: ToneStyle = ToneStyle.PROFESSIONAL
    address_style: AddressStyle = AddressStyle.DIRECT_YOU
    sentence_style: SentenceStyle = SentenceStyle.BALANCED

    # Structure (new)
    structure_preferences: StructurePreferences = StructurePreferences()
    structure_preference: str = "mixed"  # Legacy field

    # Vocabulary
    words_to_avoid: list[str] = []
    words_to_prefer: list[str] = []

    # Brand personality (new)
    brand_values: list[str] = []  # e.g., ["innovation", "collaboration"]

    # Source tracking (new)
    source_examples: list[str] = []  # JDs used to create this profile
    created_via: str = "manual"  # "examples" | "guided" | "manual"

    # Metadata
    example_jd: Optional[str] = None  # Legacy single example
    is_default: bool = False

    def to_prompt_context(self) -> str:
        """Generate prompt context for AI from this profile."""
        formality_descriptions = {
            1: "Very formal and corporate",
            2: "Professional and polished",
            3: "Professional but approachable",
            4: "Friendly and conversational",
            5: "Casual and energetic",
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
            f"Tone: {self.tone_description} ({formality_descriptions.get(self.tone_formality, 'Professional')})",
            f"Address Style: {address_descriptions[self.address_style]}",
            f"Sentence Style: {sentence_descriptions[self.sentence_style]}",
        ]

        # Structure preferences
        if self.structure_preferences.lead_with_benefits:
            parts.append("Structure: Lead with benefits and impact before listing requirements.")

        if self.structure_preferences.section_order:
            parts.append(f"Section Order: {' → '.join(self.structure_preferences.section_order)}")

        if self.structure_preferences.include_salary_prominently:
            parts.append("Include salary/compensation information prominently near the top.")

        # Vocabulary
        if self.words_to_avoid:
            parts.append(f"Words to AVOID: {', '.join(self.words_to_avoid)}")

        if self.words_to_prefer:
            parts.append(f"Words to PREFER: {', '.join(self.words_to_prefer)}")

        # Brand values
        if self.brand_values:
            parts.append(f"Brand Values to Reflect: {', '.join(self.brand_values)}")

        # Legacy example
        if self.example_jd:
            parts.append(f"Example JD for reference style:\n{self.example_jd[:1000]}")

        return "\n".join(parts)


class VoiceProfileCreate(BaseModel):
    """Input model for creating a voice profile."""
    name: str
    tone_formality: int = 3
    tone_description: str = "Professional"
    tone: ToneStyle = ToneStyle.PROFESSIONAL
    address_style: AddressStyle = AddressStyle.DIRECT_YOU
    sentence_style: SentenceStyle = SentenceStyle.BALANCED
    structure_preferences: StructurePreferences = StructurePreferences()
    structure_preference: str = "mixed"
    words_to_avoid: list[str] = []
    words_to_prefer: list[str] = []
    brand_values: list[str] = []
    source_examples: list[str] = []
    created_via: str = "manual"
    example_jd: Optional[str] = None
    is_default: bool = False


class ExtractVoiceRequest(BaseModel):
    """Input for extracting voice profile from example JDs."""
    example_jds: list[str]
    suggested_name: Optional[str] = None
