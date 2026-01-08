"""Tests to verify frontend and backend constants stay in sync."""

import re
from pathlib import Path

from app.services.field_mappings import EXCLUSION_PATTERNS, CATEGORY_WEIGHTS


def test_exclusion_patterns_match_frontend():
    """Verify backend EXCLUSION_PATTERNS matches frontend validation.ts."""
    frontend_file = Path(__file__).parent.parent.parent / "frontend" / "src" / "lib" / "validation.ts"

    if not frontend_file.exists():
        # Skip if frontend not available (CI without frontend)
        import pytest
        pytest.skip("Frontend file not found")

    content = frontend_file.read_text()

    # Extract patterns from TypeScript array
    # Looks for: const EXCLUSION_PATTERNS = [ ... ];
    # Use non-greedy match with a proper terminator (];)
    match = re.search(
        r"const EXCLUSION_PATTERNS\s*=\s*\[(.*?)\];",
        content,
        re.DOTALL
    )
    assert match, "Could not find EXCLUSION_PATTERNS in validation.ts"

    # Parse patterns line by line to handle mixed quoting styles
    # Lines look like: '  'pattern',' or '  "pattern",'
    patterns_str = match.group(1)
    frontend_patterns = []

    for line in patterns_str.split('\n'):
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        # Remove trailing comma if present
        line = line.rstrip(',')
        # Extract content between outer quotes (single or double)
        if line.startswith("'") and line.endswith("'"):
            frontend_patterns.append(line[1:-1])
        elif line.startswith('"') and line.endswith('"'):
            frontend_patterns.append(line[1:-1])

    # Compare
    backend_set = set(EXCLUSION_PATTERNS)
    frontend_set = set(frontend_patterns)

    missing_in_frontend = backend_set - frontend_set
    missing_in_backend = frontend_set - backend_set

    assert not missing_in_frontend, f"Patterns in backend but not frontend: {missing_in_frontend}"
    assert not missing_in_backend, f"Patterns in frontend but not backend: {missing_in_backend}"


def test_category_weights_are_defined():
    """Verify CATEGORY_WEIGHTS contains all expected categories."""
    expected_categories = {
        "inclusivity",
        "readability",
        "structure",
        "completeness",
        "clarity",
        "voice_match",
    }

    assert set(CATEGORY_WEIGHTS.keys()) == expected_categories

    # Weights should sum to 1.0
    total = sum(CATEGORY_WEIGHTS.values())
    assert abs(total - 1.0) < 0.001, f"Weights should sum to 1.0, got {total}"
