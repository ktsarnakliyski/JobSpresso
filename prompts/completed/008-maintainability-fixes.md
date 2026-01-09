---
execution: sequential
depends_on: []
---

<objective>
Address the top maintainability issues identified in the technical debt audit:

1. **Duplicated EXCLUSION_PATTERNS** - Add sync verification test
2. **Category weights in 3 places** - Consolidate to single source of truth
3. **Missing integration tests** - Add test for two-pass improvement system
4. **useVoiceExtraction uses different API pattern** - Refactor to use apiRequest
5. **AI model hardcoded** - Move to environment variable
</objective>

<context>
Read CLAUDE.md for project conventions.

<audit_findings>
From ./analyses/003-maintainability-debt.md:

**P0 Issues (Must Fix):**
- EXCLUSION_PATTERNS duplicated in field_mappings.py and validation.ts
- Category weights defined in: assessment.py, field_mappings.py, frontend assessment.ts
- No integration tests for full analysis pipeline

**P2 Issues (Should Fix):**
- useVoiceExtraction uses raw fetch() instead of apiRequest()
- AI model hardcoded in claude_service.py
</audit_findings>

<files_to_modify>
- ./backend/tests/test_frontend_sync.py (new file) - Sync verification test
- ./backend/app/models/assessment.py - Remove weight property, use CATEGORY_WEIGHTS
- ./frontend/src/types/assessment.ts - Remove local weights, receive from API
- ./backend/tests/test_assessment_integration.py (new file) - Integration tests
- ./frontend/src/hooks/useVoiceExtraction.ts - Use apiRequest
- ./backend/app/services/claude_service.py - Use env var for model
- ./backend/app/config.py - Add claude_model setting
</files_to_modify>
</context>

<requirements>
<functional>
1. Add automated test that fails if EXCLUSION_PATTERNS diverge between frontend/backend
2. Consolidate category weights to single source (field_mappings.py)
3. Add integration test for analyze() that verifies:
   - Full pipeline works
   - Improvements are generated
   - Error fallback works
4. Refactor useVoiceExtraction to use apiRequest for consistency
5. Make Claude model configurable via CLAUDE_MODEL env var
</functional>

<quality>
- Sync test should be clear about which patterns differ
- Integration tests should use mocked Claude responses (recorded fixtures)
- All changes should be backward compatible
</quality>
</requirements>

<implementation_guide>

<fix_1_sync_test>
**Create sync verification test**

File: backend/tests/test_frontend_sync.py

```python
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
    # Looks for: const EXCLUSION_PATTERNS = [ ... ]
    match = re.search(
        r"const EXCLUSION_PATTERNS\s*=\s*\[(.*?)\]",
        content,
        re.DOTALL
    )
    assert match, "Could not find EXCLUSION_PATTERNS in validation.ts"

    # Parse the patterns from the match
    patterns_str = match.group(1)
    # Extract quoted strings
    frontend_patterns = re.findall(r"['\"]([^'\"]+)['\"]", patterns_str)

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
```
</fix_1_sync_test>

<fix_2_consolidate_weights>
**Remove weight property from AssessmentCategory enum**

File: backend/app/models/assessment.py

Remove the `weight` property from AssessmentCategory and update any code that uses it:

```python
# REMOVE this from AssessmentCategory:
# @property
# def weight(self) -> int:
#     weights = {...}
#     return weights.get(self, 0)

# Instead, import from field_mappings where needed:
from app.services.field_mappings import CATEGORY_WEIGHTS

# Update overall_score calculation if it exists:
@property
def overall_score(self) -> float:
    """Calculate weighted overall score."""
    total = 0.0
    for category in AssessmentCategory:
        weight = CATEGORY_WEIGHTS.get(category.value, 0)
        score = getattr(self, category.value, 0)
        total += score * weight
    return round(total, 1)
```

**Update frontend to receive weights from API (optional)**

For now, just add a comment that weights should come from API in future:
```typescript
// TODO: These weights should be received from API to stay in sync with backend
// See: backend/app/services/field_mappings.py CATEGORY_WEIGHTS
export const CATEGORY_WEIGHTS: Record<AssessmentCategory, number> = {
  // Keep existing values for now
};
```
</fix_2_consolidate_weights>

<fix_3_integration_tests>
**Add integration test for analysis pipeline**

File: backend/tests/test_assessment_integration.py

```python
"""Integration tests for the assessment pipeline."""

import pytest
from unittest.mock import AsyncMock, patch

from app.services.assessment_service import AssessmentService


# Sample JD with known issues
SAMPLE_JD_WITH_BIAS = """
We're looking for a rockstar ninja developer to join our fast-paced team.
You should be a digital native who can hit the ground running.

Requirements:
- 5+ years experience
- Strong coding skills
"""

# Mock Claude response for analysis
MOCK_ANALYSIS_RESPONSE = {
    "category_scores": {
        "inclusivity": 45,
        "readability": 75,
        "structure": 60,
        "completeness": 50,
        "clarity": 70,
        "voice_match": 80,
    },
    "issues": [
        {
            "category": "inclusivity",
            "severity": "high",
            "description": "Uses exclusionary tech jargon",
            "found": "rockstar ninja",
            "suggestion": "expert developer",
        }
    ],
    "interpretation": "needs_improvement",
}


@pytest.fixture
def mock_claude_client():
    """Create a mock Claude client."""
    with patch("app.services.claude_service.AsyncAnthropic") as mock:
        client = AsyncMock()
        mock.return_value = client
        yield client


@pytest.mark.asyncio
async def test_analyze_detects_bias_issues(mock_claude_client):
    """Full analysis pipeline should detect bias words."""
    # Setup mock response
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text=str(MOCK_ANALYSIS_RESPONSE).replace("'", '"'))]
    mock_claude_client.messages.create.return_value = mock_response

    service = AssessmentService(claude_api_key="test-key")
    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Verify bias words detected by rule-based scoring
    assert result.category_scores["inclusivity"] < 80
    # Verify issues list contains bias-related issues
    bias_issues = [i for i in result.issues if "rockstar" in str(i) or "ninja" in str(i)]
    assert len(bias_issues) > 0


@pytest.mark.asyncio
async def test_analyze_generates_improvement(mock_claude_client):
    """Analysis should include improved version of JD."""
    # Setup mock responses for analysis and improvement
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text=str(MOCK_ANALYSIS_RESPONSE).replace("'", '"'))]
    mock_claude_client.messages.create.return_value = mock_response

    service = AssessmentService(claude_api_key="test-key")
    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Verify improved_text is present
    assert result.improved_text is not None
    assert len(result.improved_text) > 0


@pytest.mark.asyncio
async def test_analyze_fallback_on_improvement_failure(mock_claude_client):
    """If improvement generation fails, should fall back to original text."""
    # First call succeeds (analysis), second fails (improvement)
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text=str(MOCK_ANALYSIS_RESPONSE).replace("'", '"'))]

    call_count = 0
    async def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count > 1:  # Improvement call
            raise Exception("API error")
        return mock_response

    mock_claude_client.messages.create.side_effect = side_effect

    service = AssessmentService(claude_api_key="test-key")
    result = await service.analyze(SAMPLE_JD_WITH_BIAS)

    # Should fall back to original text
    assert result.improved_text == SAMPLE_JD_WITH_BIAS
```
</fix_3_integration_tests>

<fix_4_voice_extraction_api>
**Refactor useVoiceExtraction to use apiRequest**

File: frontend/src/hooks/useVoiceExtraction.ts

```typescript
import { apiRequest } from '@/lib/api';

// Change from raw fetch:
// const response = await fetch('/api/voice/extract', {...});

// To apiRequest:
const extractFromExamples = useCallback(async (examples: string[]) => {
  setIsExtracting(true);
  setError(null);

  try {
    const response = await apiRequest<VoiceExtractionResponse>('/api/voice/extract', {
      method: 'POST',
      body: JSON.stringify({ example_jds: examples }),
    });

    setResult(response);
    return response;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Extraction failed';
    setError(errorMessage);
    throw e;
  } finally {
    setIsExtracting(false);
  }
}, []);
```
</fix_4_voice_extraction_api>

<fix_5_model_env_var>
**Make Claude model configurable**

File: backend/app/config.py
```python
class Settings(BaseSettings):
    # ... existing settings
    claude_model: str = "claude-sonnet-4-5-20250929"
```

File: backend/app/services/claude_service.py
```python
from app.config import settings

class ClaudeService:
    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = settings.claude_model  # Changed from hardcoded string
```
</fix_5_model_env_var>

</implementation_guide>

<verification>
1. Run all tests: `cd backend && pytest -v`
2. Run frontend build: `cd frontend && npm run build`
3. Verify sync test works:
   - Temporarily add a pattern to only backend
   - Run test, should fail
   - Remove pattern, test should pass
4. Test with CLAUDE_MODEL env var:
   - Set CLAUDE_MODEL=claude-3-opus
   - Verify it's used (add debug log or check in debugger)
5. Test voice extraction still works after apiRequest change
</verification>

<success_criteria>
- Sync test catches divergence between frontend/backend patterns
- Category weights have single source of truth
- Integration tests cover main analysis pipeline
- useVoiceExtraction uses consistent API pattern
- Claude model configurable via environment
- All tests passing
</success_criteria>
