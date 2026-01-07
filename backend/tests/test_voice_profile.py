# backend/tests/test_voice_profile.py

import pytest
from app.models.voice_profile import (
    VoiceProfile,
    ToneStyle,
    AddressStyle,
    SentenceStyle,
    StructurePreferences,
)


def test_voice_profile_creation():
    """Can create a voice profile with all fields."""
    profile = VoiceProfile(
        id="test-profile",
        name="TechStartup",
        tone=ToneStyle.CASUAL,
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.SHORT_PUNCHY,
        words_to_avoid=["synergy", "leverage"],
        words_to_prefer=["build", "ship"],
        structure_preference="bullet_heavy",
    )
    assert profile.name == "TechStartup"
    assert profile.tone == ToneStyle.CASUAL


def test_voice_profile_to_prompt():
    """Voice profile generates prompt context string."""
    profile = VoiceProfile(
        id="test",
        name="Test",
        tone=ToneStyle.FRIENDLY,
        tone_description="Friendly and warm",
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.BALANCED,
        words_to_avoid=["ninja"],
        words_to_prefer=["collaborate"],
    )
    prompt = profile.to_prompt_context()
    assert "friendly" in prompt.lower()
    assert "ninja" in prompt
    assert "collaborate" in prompt


# --- New Voice DNA Tests ---


def test_enhanced_voice_profile_fields():
    """Test new VoiceProfile fields for Voice DNA system."""
    profile = VoiceProfile(
        id="test-123",
        name="TechCorp Engineering",
        tone=ToneStyle.PROFESSIONAL,
        tone_formality=3,  # 1-5 scale
        tone_description="Professional but approachable",
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.BALANCED,
        structure_preferences=StructurePreferences(
            lead_with_benefits=True,
            section_order=["intro", "responsibilities", "benefits", "requirements"],
            include_salary_prominently=False,
        ),
        words_to_avoid=["ninja", "rockstar"],
        words_to_prefer=["team", "growth"],
        brand_values=["innovation", "collaboration"],
        source_examples=[],
        created_via="guided",
    )

    assert profile.tone_formality == 3
    assert profile.structure_preferences.lead_with_benefits is True
    assert profile.created_via == "guided"


def test_voice_profile_to_prompt_with_new_fields():
    """Test prompt generation includes new fields."""
    profile = VoiceProfile(
        id="test-456",
        name="Startup Voice",
        tone=ToneStyle.CASUAL,
        tone_formality=5,  # most casual
        tone_description="Energetic and direct",
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.SHORT_PUNCHY,
        structure_preferences=StructurePreferences(
            lead_with_benefits=True,
            section_order=["intro", "benefits", "responsibilities", "requirements"],
            include_salary_prominently=True,
        ),
        words_to_avoid=["synergy"],
        words_to_prefer=["impact", "ship"],
        brand_values=["speed", "ownership"],
        source_examples=[],
        created_via="examples",
    )

    prompt = profile.to_prompt_context()

    assert "Energetic and direct" in prompt
    assert "lead with benefits" in prompt.lower()
    assert "speed" in prompt.lower() or "ownership" in prompt.lower()


def test_structure_preferences_defaults():
    """StructurePreferences has sensible defaults."""
    prefs = StructurePreferences()
    assert prefs.lead_with_benefits is False
    assert prefs.section_order == ["intro", "responsibilities", "requirements", "benefits"]
    assert prefs.include_salary_prominently is False


def test_voice_profile_backward_compatibility():
    """New fields have defaults for backward compatibility."""
    # Old-style profile without new fields should still work
    profile = VoiceProfile(
        id="old-profile",
        name="Legacy",
        tone=ToneStyle.PROFESSIONAL,
    )
    assert profile.tone_formality == 3  # default
    assert profile.tone_description == "Professional"  # default
    assert profile.brand_values == []
    assert profile.created_via == "manual"
