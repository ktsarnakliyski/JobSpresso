# backend/tests/test_generate_endpoint.py

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from app.main import app


client = TestClient(app)


def test_generate_endpoint_exists():
    """Generate endpoint accepts POST requests."""
    response = client.post(
        "/api/generate",
        json={
            "role_title": "Developer",
            "responsibilities": ["Write code"],
            "requirements": ["Python"],
        }
    )
    assert response.status_code != 404


def test_generate_returns_jd():
    """Returns generated JD with metadata."""
    from app.routers.generate import get_claude_service

    mock_service = AsyncMock()
    mock_service.generate.return_value = {
        "generated_jd": "# Senior Developer\n\nWe are looking...",
        "word_count": 450,
        "notes": ["Consider adding salary range"],
    }

    # Use FastAPI dependency override
    app.dependency_overrides[get_claude_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/generate",
            json={
                "role_title": "Senior Developer",
                "responsibilities": ["Write code", "Review PRs"],
                "requirements": ["5+ years Python", "SQL experience"],
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "generated_jd" in data
        assert "word_count" in data
    finally:
        # Clean up the override
        app.dependency_overrides.clear()


def test_generate_requires_fields():
    """Rejects requests without required fields."""
    response = client.post("/api/generate", json={"role_title": "Dev"})
    assert response.status_code == 422
