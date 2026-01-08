# backend/tests/conftest.py

import pytest

from app import rate_limit


@pytest.fixture(autouse=True)
def disable_rate_limiter():
    """Disable rate limiting during tests."""
    # Disable the shared limiter
    rate_limit.limiter.enabled = False

    yield

    # Re-enable after test (in case tests run in shared process)
    rate_limit.limiter.enabled = True
