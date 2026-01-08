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


def test_voice_extraction_prompt_requests_suggested_rules(claude_service):
    """Test that voice extraction prompt asks for suggested_rules."""
    prompt = claude_service._build_voice_extraction_prompt(["Sample JD"])

    # Should request suggested_rules in the JSON structure
    assert "suggested_rules" in prompt
    assert "rule_type" in prompt
    assert "confidence" in prompt
    assert "evidence" in prompt

    # Should describe what patterns to look for
    assert "exclude" in prompt.lower() or "never" in prompt.lower()
    assert "format" in prompt.lower()
    assert "pattern" in prompt.lower()


def test_voice_extraction_prompt_requests_format_guidance(claude_service):
    """Test that voice extraction prompt asks for format_guidance."""
    prompt = claude_service._build_voice_extraction_prompt(["Sample JD"])

    assert "format_guidance" in prompt
    assert "structure" in prompt.lower()


# --- Two-Pass Improvement System Tests ---


def test_build_improvement_prompt_includes_original_jd(claude_service):
    """Improvement prompt includes the original JD text."""
    original_jd = "We are looking for a rockstar developer."
    scores = {"inclusivity": 60, "readability": 80, "structure": 70}
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    assert "rockstar developer" in prompt
    assert "ORIGINAL JOB DESCRIPTION" in prompt


def test_build_improvement_prompt_includes_scores(claude_service):
    """Improvement prompt includes all category scores."""
    original_jd = "Test JD"
    scores = {
        "inclusivity": 65,
        "readability": 80,
        "structure": 75,
        "completeness": 50,
        "clarity": 85,
        "voice_match": 70,
    }
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    assert "Inclusivity: 65/100" in prompt
    assert "Readability: 80/100" in prompt
    assert "Structure: 75/100" in prompt
    assert "Completeness: 50/100" in prompt
    assert "Clarity: 85/100" in prompt


def test_build_improvement_prompt_includes_issues(claude_service):
    """Improvement prompt includes formatted issues."""
    original_jd = "Test JD"
    scores = {"inclusivity": 60}
    issues = [
        {
            "severity": "warning",
            "category": "inclusivity",
            "description": "Found problematic term",
            "found": "rockstar",
            "suggestion": "top performer",
        }
    ]

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    assert "Found problematic term" in prompt
    assert '"rockstar"' in prompt
    assert "top performer" in prompt
    assert "[WARNING]" in prompt


def test_build_improvement_prompt_without_voice_profile(claude_service):
    """Improvement prompt handles missing voice profile."""
    original_jd = "Test JD"
    scores = {"inclusivity": 75}
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues, voice_profile=None)

    assert "No voice profile specified" in prompt
    assert "N/A" in prompt  # voice_match_score should be N/A


def test_build_improvement_prompt_with_voice_profile(claude_service, mock_voice_profile):
    """Improvement prompt includes voice profile context."""
    original_jd = "Test JD"
    scores = {"inclusivity": 75, "voice_match": 80}
    issues = []

    prompt = claude_service._build_improvement_prompt(
        original_jd, scores, issues, voice_profile=mock_voice_profile
    )

    assert "Test Profile" in prompt
    assert "Match this voice profile" in prompt


def test_build_improvement_prompt_calculates_overall_score(claude_service):
    """Improvement prompt calculates weighted overall score."""
    original_jd = "Test JD"
    # All scores at 100 should give overall of 100
    scores = {
        "inclusivity": 100,
        "readability": 100,
        "structure": 100,
        "completeness": 100,
        "clarity": 100,
        "voice_match": 100,
    }
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    assert "Overall Score: 100/100" in prompt


def test_build_improvement_prompt_empty_issues(claude_service):
    """Improvement prompt handles empty issues list gracefully."""
    original_jd = "Test JD"
    scores = {"inclusivity": 90}
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    assert "No specific issues detected" in prompt


def test_build_improvement_prompt_includes_scoring_algorithms(claude_service):
    """Improvement prompt includes scoring algorithm documentation."""
    original_jd = "Test JD"
    scores = {}
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    # Should include algorithm details
    assert "Flesch-Kincaid" in prompt
    assert "Grade 6-8" in prompt
    assert "READABILITY" in prompt
    assert "STRUCTURE" in prompt
    assert "COMPLETENESS" in prompt
    assert "INCLUSIVITY" in prompt


def test_build_improvement_prompt_includes_no_hallucination_rule(claude_service):
    """Improvement prompt emphasizes no hallucination constraint."""
    original_jd = "Test JD"
    scores = {}
    issues = []

    prompt = claude_service._build_improvement_prompt(original_jd, scores, issues)

    assert "NO HALLUCINATION" in prompt
    assert "FORBIDDEN" in prompt
    assert "Inventing salary" in prompt


@pytest.mark.asyncio
async def test_generate_improvement_calls_api(claude_service):
    """generate_improvement calls Claude API with correct parameters."""
    original_jd = "We need a ninja."
    scores = {"inclusivity": 60}
    issues = [{"severity": "warning", "category": "inclusivity", "description": "test"}]

    mock_message = MagicMock()
    mock_message.stop_reason = "end_turn"
    mock_message.content = [MagicMock(text="We need an expert.")]

    with patch.object(claude_service.client.messages, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_message

        result = await claude_service.generate_improvement(original_jd, scores, issues)

        assert mock_create.called
        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["temperature"] == 0.2  # Lower temperature for consistency
        assert call_kwargs["max_tokens"] == 4096
        assert "ninja" in call_kwargs["messages"][0]["content"]


@pytest.mark.asyncio
async def test_generate_improvement_cleans_preamble(claude_service):
    """generate_improvement removes preamble text from response."""
    original_jd = "Test JD"
    scores = {}
    issues = []

    mock_message = MagicMock()
    mock_message.stop_reason = "end_turn"
    mock_message.content = [MagicMock(text="Here's the improved version:\n\nActual JD content here.")]

    with patch.object(claude_service.client.messages, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_message

        result = await claude_service.generate_improvement(original_jd, scores, issues)

        assert "Here's the improved" not in result
        assert "Actual JD content here" in result


@pytest.mark.asyncio
async def test_generate_improvement_raises_on_truncation(claude_service):
    """generate_improvement raises error when response is truncated."""
    original_jd = "Test JD"
    scores = {}
    issues = []

    mock_message = MagicMock()
    mock_message.stop_reason = "max_tokens"  # Truncated
    mock_message.content = [MagicMock(text="Partial content...")]

    with patch.object(claude_service.client.messages, "create", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = mock_message

        with pytest.raises(ValueError, match="truncated"):
            await claude_service.generate_improvement(original_jd, scores, issues)
