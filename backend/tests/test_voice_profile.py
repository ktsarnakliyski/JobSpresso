# backend/tests/test_voice_profile.py

import pytest
from app.models.voice_profile import VoiceProfile, ToneStyle, AddressStyle, SentenceStyle


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
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.BALANCED,
        words_to_avoid=["ninja"],
        words_to_prefer=["collaborate"],
    )
    prompt = profile.to_prompt_context()
    assert "friendly" in prompt.lower()
    assert "ninja" in prompt
    assert "collaborate" in prompt
