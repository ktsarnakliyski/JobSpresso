# backend/tests/test_claude_service.py

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.claude_service import ClaudeService, AnalyzeRequest, GenerateRequest
from app.models.voice_profile import VoiceProfile, ToneStyle, AddressStyle, SentenceStyle


@pytest.fixture
def mock_voice_profile():
    return VoiceProfile(
        id="test",
        name="Test Profile",
        tone=ToneStyle.PROFESSIONAL,
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.BALANCED,
        words_to_avoid=["ninja"],
        words_to_prefer=["collaborate"],
    )


@pytest.fixture
def claude_service():
    return ClaudeService(api_key="test-key")


def test_build_analysis_prompt(claude_service, mock_voice_profile):
    """Analysis prompt includes JD and voice profile context."""
    jd_text = "We are looking for a ninja developer."
    prompt = claude_service._build_analysis_prompt(jd_text, mock_voice_profile)

    assert "ninja developer" in prompt
    assert "Test Profile" in prompt
    assert "avoid" in prompt.lower()


def test_build_generation_prompt(claude_service, mock_voice_profile):
    """Generation prompt includes all input fields."""
    request = GenerateRequest(
        role_title="Senior Developer",
        responsibilities=["Write code", "Review PRs"],
        requirements=["5+ years Python"],
        company_description="A startup",
    )
    prompt = claude_service._build_generation_prompt(request, mock_voice_profile)

    assert "Senior Developer" in prompt
    assert "Write code" in prompt
    assert "5+ years Python" in prompt


def test_parse_analysis_response(claude_service):
    """Parses Claude's JSON response correctly."""
    mock_response = '''
    {
        "scores": {
            "inclusivity": 75,
            "readability": 80,
            "clarity": 85,
            "voice_match": 70
        },
        "issues": [
            {
                "severity": "warning",
                "category": "inclusivity",
                "description": "Found masculine-coded word",
                "found": "ninja",
                "suggestion": "developer",
                "impact": "May discourage diverse candidates"
            }
        ],
        "positives": ["Clear requirements section"],
        "improved_text": "We are looking for a developer."
    }
    '''
    result = claude_service._parse_analysis_response(mock_response)

    assert result["scores"]["inclusivity"] == 75
    assert len(result["issues"]) == 1
    assert result["issues"][0]["found"] == "ninja"


# --- Voice DNA Tests ---


def test_extract_voice_prompt_requests_enhanced_fields(claude_service):
    """Test that voice extraction prompt asks for new Voice DNA fields."""
    prompt = claude_service._build_voice_extraction_prompt(["Example JD text here"])

    # Should request new fields
    assert "tone_formality" in prompt or "formality" in prompt.lower()
    assert "brand" in prompt.lower() or "values" in prompt.lower()
    assert "structure" in prompt.lower()
    assert "section" in prompt.lower() or "order" in prompt.lower()


def test_voice_extraction_prompt_includes_all_examples(claude_service):
    """Test that voice extraction prompt includes all example JDs."""
    examples = [
        "We're a startup building cool stuff.",
        "Join our mission-driven team.",
        "Competitive salary and benefits."
    ]
    prompt = claude_service._build_voice_extraction_prompt(examples)

    assert "cool stuff" in prompt
    assert "mission-driven" in prompt
    assert "Competitive salary" in prompt
    assert "Example 1" in prompt
    assert "Example 2" in prompt
    assert "Example 3" in prompt
