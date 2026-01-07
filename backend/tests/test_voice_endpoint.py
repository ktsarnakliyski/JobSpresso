# backend/tests/test_voice_endpoint.py

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from app.main import app
from app.routers.voice import get_claude_service


client = TestClient(app)


def test_extract_voice_endpoint_exists():
    """Extract voice endpoint accepts POST requests."""
    response = client.post(
        "/api/voice/extract",
        json={"example_jds": ["We are a startup..."]}
    )
    assert response.status_code != 404


def test_extract_voice_returns_profile():
    """Returns extracted voice profile characteristics."""
    mock_service = AsyncMock()
    mock_service.extract_voice_profile.return_value = {
        "tone": "casual",
        "address_style": "direct_you",
        "sentence_style": "short_punchy",
        "words_commonly_used": ["build", "ship"],
        "words_avoided": ["synergy"],
        "structure_preference": "bullet_heavy",
        "summary": "A casual, startup-friendly tone.",
    }

    # Use FastAPI dependency override
    app.dependency_overrides[get_claude_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/voice/extract",
            json={
                "example_jds": [
                    "We're building something cool. You'll ship features fast.",
                    "Join our team of builders. Move fast, ship often.",
                ]
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "tone" in data
        assert "sentence_style" in data
    finally:
        # Clean up the override
        app.dependency_overrides.clear()


def test_extract_voice_requires_examples():
    """Rejects requests without example JDs."""
    response = client.post("/api/voice/extract", json={"example_jds": []})
    assert response.status_code == 400


# --- Voice DNA Enhanced Endpoint Tests ---


def test_extract_voice_returns_enhanced_fields():
    """Test that extraction returns new Voice DNA fields."""
    mock_service = AsyncMock()
    mock_service.extract_voice_profile.return_value = {
        "tone": "friendly",
        "tone_formality": 4,
        "tone_description": "Friendly and warm",
        "address_style": "direct_you",
        "sentence_style": "balanced",
        "structure_analysis": {
            "leads_with_benefits": True,
            "typical_section_order": ["intro", "benefits", "responsibilities", "requirements"],
            "includes_salary": False,
        },
        "vocabulary": {
            "commonly_used": ["team", "growth"],
            "notably_avoided": ["ninja"],
        },
        "brand_signals": {
            "values": ["innovation"],
            "personality": "Modern tech company",
        },
        "summary": "Friendly, benefit-focused voice.",
    }

    app.dependency_overrides[get_claude_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/voice/extract",
            json={"example_jds": ["Sample JD text"]},
        )

        assert response.status_code == 200
        data = response.json()

        # New fields
        assert data["tone_formality"] == 4
        assert data["tone_description"] == "Friendly and warm"
        assert data["structure_analysis"]["leads_with_benefits"] is True
        assert "innovation" in data["brand_signals"]["values"]
        assert data["vocabulary"]["commonly_used"] == ["team", "growth"]
    finally:
        app.dependency_overrides.clear()
