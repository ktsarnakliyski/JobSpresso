# backend/tests/test_analyze_endpoint.py

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from app.main import app
from app.routers.analyze import get_assessment_service


client = TestClient(app)


def test_analyze_endpoint_exists():
    """Analyze endpoint accepts POST requests."""
    response = client.post("/api/analyze", json={"jd_text": "test"})
    # Should not be 404
    assert response.status_code != 404


def test_analyze_returns_scores():
    """Returns assessment scores and issues."""
    from app.models.assessment import AssessmentCategory, AssessmentResult

    mock_result = AssessmentResult(
        category_scores={
            AssessmentCategory.INCLUSIVITY: 80,
            AssessmentCategory.READABILITY: 70,
            AssessmentCategory.STRUCTURE: 75,
            AssessmentCategory.COMPLETENESS: 70,
            AssessmentCategory.CLARITY: 80,
            AssessmentCategory.VOICE_MATCH: 75,
        },
        issues=[],
        positives=["Good structure"],
        improved_text="Improved JD here",
    )

    mock_service = AsyncMock()
    mock_service.analyze.return_value = mock_result

    # Use FastAPI dependency override
    app.dependency_overrides[get_assessment_service] = lambda: mock_service

    try:
        response = client.post(
            "/api/analyze",
            json={
                "jd_text": "We are looking for a developer.",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "category_scores" in data
    finally:
        # Clean up the override
        app.dependency_overrides.clear()


def test_analyze_requires_jd_text():
    """Rejects requests without jd_text."""
    response = client.post("/api/analyze", json={})
    assert response.status_code == 422
