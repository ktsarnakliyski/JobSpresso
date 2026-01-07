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


def test_extract_voice_returns_suggested_rules():
    """Test that extraction returns suggested_rules from AI analysis."""
    mock_service = AsyncMock()
    mock_service.extract_voice_profile.return_value = {
        "tone": "professional",
        "tone_formality": 3,
        "tone_description": "Professional",
        "address_style": "direct_you",
        "sentence_style": "balanced",
        "structure_analysis": {
            "leads_with_benefits": False,
            "typical_section_order": ["intro", "responsibilities", "requirements"],
            "includes_salary": False,
        },
        "vocabulary": {
            "commonly_used": [],
            "notably_avoided": [],
        },
        "brand_signals": {
            "values": [],
            "personality": "",
        },
        "suggested_rules": [
            {
                "text": "Never include salary information",
                "rule_type": "exclude",
                "target": "salary",
                "confidence": 0.95,
                "evidence": "Observed in 0/3 examples",
            },
            {
                "text": "Use bullet points for requirements",
                "rule_type": "format",
                "target": "requirements",
                "value": "bullets",
                "confidence": 0.8,
                "evidence": "All examples used bullets",
            },
        ],
        "format_guidance": "Start with company culture section.",
        "summary": "Professional voice with consistent formatting.",
    }

    app.dependency_overrides[get_claude_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/voice/extract",
            json={"example_jds": ["Sample JD text"]},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify suggested_rules
        assert "suggested_rules" in data
        assert len(data["suggested_rules"]) == 2

        # First rule
        assert data["suggested_rules"][0]["text"] == "Never include salary information"
        assert data["suggested_rules"][0]["rule_type"] == "exclude"
        assert data["suggested_rules"][0]["target"] == "salary"
        assert data["suggested_rules"][0]["confidence"] == 0.95
        assert data["suggested_rules"][0]["evidence"] == "Observed in 0/3 examples"

        # Second rule
        assert data["suggested_rules"][1]["rule_type"] == "format"
        assert data["suggested_rules"][1]["value"] == "bullets"

        # Verify format_guidance
        assert data["format_guidance"] == "Start with company culture section."
    finally:
        app.dependency_overrides.clear()


def test_extract_voice_handles_missing_suggested_rules():
    """Test that extraction handles missing suggested_rules gracefully."""
    mock_service = AsyncMock()
    mock_service.extract_voice_profile.return_value = {
        "tone": "casual",
        "tone_formality": 4,
        "tone_description": "Casual",
        "address_style": "direct_you",
        "sentence_style": "short_punchy",
        "structure_analysis": {},
        "vocabulary": {},
        "brand_signals": {},
        "summary": "Casual voice.",
        # No suggested_rules or format_guidance
    }

    app.dependency_overrides[get_claude_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/voice/extract",
            json={"example_jds": ["Sample JD"]},
        )

        assert response.status_code == 200
        data = response.json()

        # Should default to empty list
        assert data["suggested_rules"] == []
        assert data["format_guidance"] is None
    finally:
        app.dependency_overrides.clear()


def test_extract_voice_validates_confidence_range():
    """Test that confidence values are clamped to 0.0-1.0 range."""
    mock_service = AsyncMock()
    mock_service.extract_voice_profile.return_value = {
        "tone": "professional",
        "tone_formality": 3,
        "tone_description": "Professional",
        "address_style": "direct_you",
        "sentence_style": "balanced",
        "structure_analysis": {},
        "vocabulary": {},
        "brand_signals": {},
        "suggested_rules": [
            {
                "text": "Rule with high confidence",
                "rule_type": "custom",
                "confidence": 1.5,  # Invalid: > 1.0
                "evidence": "Test",
            },
            {
                "text": "Rule with negative confidence",
                "rule_type": "custom",
                "confidence": -0.5,  # Invalid: < 0.0
                "evidence": "Test",
            },
        ],
        "summary": "Test.",
    }

    app.dependency_overrides[get_claude_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/voice/extract",
            json={"example_jds": ["Sample JD"]},
        )

        assert response.status_code == 200
        data = response.json()

        # Confidence should be clamped
        assert data["suggested_rules"][0]["confidence"] == 1.0  # Clamped from 1.5
        assert data["suggested_rules"][1]["confidence"] == 0.0  # Clamped from -0.5
    finally:
        app.dependency_overrides.clear()
