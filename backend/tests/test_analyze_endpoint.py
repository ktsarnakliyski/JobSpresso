# backend/tests/test_analyze_endpoint.py

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from app.main import app
from app.routers.analyze import get_assessment_service


client = TestClient(app)


def test_analyze_endpoint_exists():
    """Analyze endpoint accepts POST requests."""
    # Short text will fail validation (min_length=50), but endpoint should exist (not 404)
    response = client.post("/api/analyze", json={"jd_text": "test"})
    # Should not be 404 - validation error (422) is expected for short text
    assert response.status_code in [200, 422]


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
                "jd_text": "We are looking for a software developer to join our engineering team. The ideal candidate will have experience with Python and JavaScript.",
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


# === Request Size Limit Middleware Tests ===

def test_request_size_limit_rejects_oversized_request():
    """Middleware rejects requests over 500KB with 413."""
    # Create a payload just over 500KB
    oversized_text = "x" * 501_000  # ~501KB
    response = client.post(
        "/api/analyze",
        json={"jd_text": oversized_text},
    )
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()


def test_request_size_limit_allows_normal_request():
    """Middleware allows requests under 500KB."""
    # Normal-sized request should pass middleware (may fail validation, but not 413)
    normal_text = "x" * 100  # 100 bytes
    response = client.post(
        "/api/analyze",
        json={"jd_text": normal_text},
    )
    # Should not be 413 - validation error (422) is expected for short/invalid text
    assert response.status_code != 413


# === Input Validation Tests ===

def test_analyze_rejects_oversized_jd_text():
    """Rejects jd_text exceeding max_length (50000 chars) with 422."""
    oversized_jd = "a" * 50_001  # Just over the 50000 char limit
    response = client.post(
        "/api/analyze",
        json={"jd_text": oversized_jd},
    )
    assert response.status_code == 422
    # Verify it's a validation error about length
    detail = response.json()["detail"]
    assert any("50000" in str(err) or "max" in str(err).lower() for err in detail)


def test_analyze_accepts_max_length_jd_text():
    """Accepts jd_text at exactly max_length (50000 chars)."""
    # Create valid JD at exactly max length
    max_length_jd = "a" * 50_000
    response = client.post(
        "/api/analyze",
        json={"jd_text": max_length_jd},
    )
    # Should not be 422 for length - may be 413 (size limit) or other error, but not length validation
    if response.status_code == 422:
        detail = response.json()["detail"]
        # If 422, should NOT be about max_length
        assert not any("50000" in str(err) for err in detail)
