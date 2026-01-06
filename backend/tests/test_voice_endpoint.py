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
