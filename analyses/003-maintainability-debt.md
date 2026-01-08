# Technical Debt & Maintainability Analysis

**Analysis Date:** 2026-01-08
**Codebase:** JobSpresso - Job Description Analyzer
**Stage:** MVP with Voice DNA Phase 2 features

## Executive Summary

| Metric | Count | Severity |
|--------|-------|----------|
| Coupling issues found | 8 | 3 High, 3 Medium, 2 Low |
| Hardcoded values found | 14 | 5 High, 6 Medium, 3 Low |
| Test coverage gaps | 6 | 2 Critical, 3 Moderate, 1 Minor |
| Duplicated logic | 4 | 2 High, 2 Medium |

**Overall Health:** Good for MVP, but several issues will cause pain as the codebase scales.

**Top 3 Risks:**
1. **Duplicated exclusion pattern logic** between backend (`field_mappings.py`) and frontend (`validation.ts`) - sync errors are inevitable
2. **Category weights defined in 3+ places** - drift will cause inconsistent scoring
3. **Missing integration tests** for the two-pass improvement system - regressions will be hard to catch

---

## Critical Maintainability Risks

### 1. Duplicated Exclusion Patterns (CRITICAL)

**Location:**
- Backend: `/backend/app/services/field_mappings.py` lines 105-119
- Frontend: `/frontend/src/lib/validation.ts` lines 44-58

**Issue:** The `EXCLUSION_PATTERNS` list is duplicated between backend and frontend with only a comment saying "keep in sync manually."

```python
# Backend (Python)
EXCLUSION_PATTERNS: list[str] = [
    "never include",
    "don't include",
    "do not include",
    # ... 13 patterns total
]
```

```typescript
// Frontend (TypeScript) - marked as "SOURCE OF TRUTH: backend/..."
const EXCLUSION_PATTERNS = [
  'never include',
  "don't include",  // Note: different quote style
  'do not include',
  // ... must match backend
];
```

**Why it matters:** When a developer adds a new exclusion pattern to the backend, they will almost certainly forget to update the frontend. This will cause:
- Voice profile rules to behave differently in UI hints vs. actual analysis
- User confusion when hints suggest adding fields that should be excluded
- Difficult-to-debug issues that only appear in specific edge cases

**Recommendation:**
- **Immediate:** Add an automated test that compares both lists
- **Better:** Create a shared JSON file that both read from, or expose patterns via API endpoint
- **Effort:** 2-4 hours

---

### 2. Category Weights Defined in Multiple Places (HIGH)

**Locations:**
1. `/backend/app/models/assessment.py` - `AssessmentCategory.weight` property (lines 54-63)
2. `/backend/app/services/field_mappings.py` - `CATEGORY_WEIGHTS` dict (lines 127-134)
3. `/frontend/src/types/assessment.ts` - `CATEGORY_WEIGHTS` const (lines 86-93)

**Issue:** The scoring weights (Inclusivity: 25%, Readability: 20%, etc.) are defined in three separate places.

```python
# assessment.py - as enum property
@property
def weight(self) -> int:
    weights = {
        self.INCLUSIVITY: 25,
        self.READABILITY: 20,
        # ...
    }
```

```python
# field_mappings.py - as dict
CATEGORY_WEIGHTS: dict[str, float] = {
    "inclusivity": 0.25,  # Note: different format (0.25 vs 25)
    "readability": 0.20,
    # ...
}
```

**Why it matters:**
- Weights could drift between locations causing inconsistent scores
- `AssessmentCategory.weight` uses integers (25), `CATEGORY_WEIGHTS` uses floats (0.25) - conversion errors possible
- Frontend weights could diverge from backend causing UI display inconsistencies

**Recommendation:**
- Consolidate to single source of truth in `field_mappings.py`
- Have `AssessmentCategory.weight` read from `CATEGORY_WEIGHTS`
- Frontend should receive weights from API response, not hardcode them
- **Effort:** 3-4 hours

---

### 3. Missing Integration Tests for Two-Pass Improvement System (HIGH)

**Location:** `/backend/app/services/assessment_service.py` lines 401-438

**Issue:** The two-pass improvement system (analyze -> generate improved version) is a critical business logic path with only mocked unit tests. There are no integration tests that:
1. Send a real JD through the full pipeline
2. Verify the improved version actually scores higher
3. Test error recovery when improvement generation fails

```python
# Current test only mocks the API call
@pytest.mark.asyncio
async def test_generate_improvement_calls_api(claude_service):
    """generate_improvement calls Claude API with correct parameters."""
    # ... only tests that API is called, not that improvements work
```

**Why it matters:**
- Regressions in improvement prompts won't be caught by tests
- The `except Exception` on line 436 silently falls back to original text - no test verifies this
- Changes to scoring algorithms could break improvements without detection

**Recommendation:**
- Add integration test with real (or recorded) Claude API responses
- Add test that verifies fallback behavior on failure
- Consider adding a "smoke test" that runs nightly with real API
- **Effort:** 4-6 hours

---

## Coupling Analysis

### High Severity

#### C1. ClaudeService Knows Too Much About Scoring

**Location:** `/backend/app/services/claude_service.py` lines 166-314

**Issue:** The `IMPROVEMENT_PROMPT_TEMPLATE` in ClaudeService contains detailed knowledge of how scoring algorithms work:

```python
## READABILITY (20%) - Flesch-Kincaid Grade Level
Target: Grade 6-8 = 100 points
- Grade 9 = 92 pts, Grade 10 = 84 pts, Grade 12 = 68 pts

## STRUCTURE (15%) - Section Detection via Regex
| Section | Patterns Detected | Points |
|---------|-------------------|--------|
| About | "about us", "company overview", "who we are" | +15 |
```

This tightly couples ClaudeService to the scoring implementation in `scoring.py`. If scoring logic changes, the prompt becomes stale.

**Impact:** Medium-High
**Recommendation:** Generate this documentation dynamically from `scoring.py` constants, or maintain as separate markdown file that both reference.

---

#### C2. AssessmentService Has Multiple Responsibilities

**Location:** `/backend/app/services/assessment_service.py`

**Issue:** AssessmentService does too many things:
1. Voice profile rule interpretation (lines 46-90)
2. Rule-based scoring (lines 92-102)
3. Bias issue detection (lines 104-123)
4. Completeness issue detection (lines 125-172)
5. AI issue conversion (lines 243-272)
6. Score merging (lines 225-241)
7. Evidence building (lines 274-314)
8. Question coverage analysis (lines 331-347)
9. Improvement generation orchestration (lines 401-450)

**Impact:** High - Changes to any one concern risk breaking others
**Recommendation:** Extract into focused services:
- `ExclusionDetector` - voice profile rule interpretation
- `IssueDetector` - all issue detection logic
- `ScoreCalculator` - merging and overall score
- Keep `AssessmentService` as thin orchestrator

---

#### C3. Frontend-Backend Type Drift Risk

**Location:**
- Backend: `/backend/app/models/voice_profile.py` - `VoiceProfile` class
- Frontend: `/frontend/src/types/voice-profile.ts` - `VoiceProfile` interface
- Transform: `/frontend/src/lib/transforms.ts` - `transformVoiceProfileToBackend`

**Issue:** Types are manually synchronized between backend Pydantic models and frontend TypeScript interfaces. The transform function must be updated whenever the model changes.

```python
# Backend adds a new field
class VoiceProfile(BaseModel):
    new_feature_flag: bool = False  # Added
```

```typescript
// Frontend must add it too, PLUS update transform:
export interface VoiceProfile {
  newFeatureFlag: boolean;  // Must remember to add
}

// And the transform:
export function transformVoiceProfileToBackend(profile: VoiceProfile) {
  return {
    new_feature_flag: profile.newFeatureFlag,  // Easy to forget
  };
}
```

**Impact:** High - New fields frequently get lost in transformation
**Recommendation:**
- Generate TypeScript types from OpenAPI spec
- Or use a shared schema (JSON Schema) that generates both
- **Effort:** 8-16 hours for proper setup

---

### Medium Severity

#### C4. Hidden Dependency on CANDIDATE_QUESTIONS Order

**Location:** `/backend/app/services/question_analyzer.py` lines 27-175

**Issue:** `CANDIDATE_QUESTIONS` is a dict, and Python 3.7+ preserves insertion order. However, the order is semantically meaningful for UI display but not explicitly documented or tested.

**Recommendation:** Add test verifying expected order, or use `OrderedDict` with explicit comment.

---

#### C5. Regex Patterns Scattered Across Files

**Locations:**
- `scoring.py` lines 109-114 (section detection patterns)
- `scoring.py` lines 187-207 (completeness check patterns)
- `question_analyzer.py` lines 33-174 (question detection patterns)

**Issue:** Detection patterns for similar concepts (salary, location, benefits) are defined separately in multiple files with different regex patterns.

```python
# scoring.py - completeness check
"salary": bool(re.search(
    r'\$\d|€\d|£\d|\d+k|\d{2},?\d{3}|salary|compensation|pay\s+range',
    text_lower
))

# question_analyzer.py - question coverage
"compensation": {
    "detection_patterns": [
        r"\$[\d,]+",  # Different regex!
        r"salary\s*(range)?",
        # ...
    ],
}
```

**Impact:** Medium - Different detection logic for same concepts leads to inconsistent results
**Recommendation:** Consolidate detection patterns into `field_mappings.py`

---

#### C6. useVoiceExtraction Uses Different API Pattern

**Location:** `/frontend/src/hooks/useVoiceExtraction.ts` line 30

**Issue:** Unlike `useAnalyze` and `useGenerate` which use `apiRequest()`, this hook uses raw `fetch()`:

```typescript
// useVoiceExtraction.ts - raw fetch
const response = await fetch('/api/voice/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ example_jds: examples }),
});

// useAnalyze.ts - uses apiRequest
const response = await apiRequest<AnalyzeResponse>('/api/analyze', {...});
```

**Impact:** Medium - Error handling is inconsistent, API URL configuration not used
**Recommendation:** Refactor to use `apiRequest` like other hooks

---

### Low Severity

#### C7. localStorage Keys Hardcoded

**Location:** `/frontend/src/hooks/useVoiceProfiles.ts` lines 12-13

```typescript
const STORAGE_KEY = 'jobspresso_voice_profiles';
const SELECTED_PROFILE_KEY = 'jobspresso_selected_profile';
```

**Impact:** Low - Would only matter if multiple instances or white-labeling
**Recommendation:** Move to shared constants file if app branding changes

---

#### C8. Profile Migration Has No Version Tracking

**Location:** `/frontend/src/hooks/useVoiceProfiles.ts` lines 22-36

**Issue:** The `migrateProfile` function handles legacy-to-new format conversion, but there's no version number stored. If a third format is added, migration path becomes unclear.

**Recommendation:** Store schema version in localStorage, migrate based on version number

---

## Extensibility Analysis

### High Impact

#### E1. Scoring Thresholds Are Magic Numbers

**Location:** `/backend/app/services/scoring.py`

**Issue:** Critical business logic thresholds are embedded as magic numbers:

```python
# Line 70 - Why 6-8? Where does this come from?
if 6 <= grade_level <= 8:
    return 100

# Line 89 - Why these exact ranges?
if 300 <= word_count <= 650:
    return 100

# Lines 133-140 - Why these exact weights?
if sections.get("about"):
    score += 15  # Why 15?
if sections.get("role"):
    score += 25  # Why 25?
```

**Why it matters:**
- Impossible to A/B test different thresholds
- No way to customize for different industries
- Hard to explain to users why their score is what it is

**Recommendation:**
- Extract to `ScoringConfig` class with documented defaults
- Allow override via environment variables for testing
- Add comments explaining research basis for each threshold

---

#### E2. Bias Words Cannot Be Customized Per-Customer

**Location:** `/backend/app/services/field_mappings.py` lines 59-83

**Issue:** The `BIAS_TERMS` dict is hardcoded. Different industries/regions may have different problematic terms.

```python
BIAS_TERMS: dict[str, dict[str, str]] = {
    "ninja": {"category": "problematic", "replacement": "expert"},
    "rockstar": {"category": "problematic", "replacement": "top performer"},
    # ... hardcoded list
}
```

**Why it matters:**
- Healthcare recruiters might need medical jargon exceptions
- UK vs US terminology differences
- Enterprise customers often want to add company-specific terms

**Recommendation:**
- Support loading additional terms from JSON/database
- Allow per-profile term overrides
- **Effort:** 4-6 hours

---

#### E3. Question Coverage Cannot Be Extended

**Location:** `/backend/app/services/question_analyzer.py` lines 27-175

**Issue:** `CANDIDATE_QUESTIONS` is a hardcoded dict. Adding new questions requires code changes.

**Why it matters:**
- Different job types need different questions (exec search vs. hourly)
- Sales would need questions about commission structure
- Engineering would need questions about tech stack

**Recommendation:**
- Move to JSON configuration file
- Add API endpoint to fetch questions (enables A/B testing)
- Allow question set override in analyze request

---

### Medium Impact

#### E4. AI Model Hardcoded

**Location:** `/backend/app/services/claude_service.py` line 318

```python
self.model = "claude-sonnet-4-5-20250929"
```

**Issue:** Model is hardcoded. Should be configurable via environment variable.

**Recommendation:** `self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")`

---

#### E5. Score Interpretation Thresholds Not Configurable

**Location:** `/backend/app/models/assessment.py` lines 92-102

```python
@classmethod
def from_score(cls, score: float) -> "ScoreInterpretation":
    if score >= 90:
        return cls.EXCELLENT
    elif score >= 75:
        return cls.GOOD
    # ...
```

**Why it matters:** Different customers may want different interpretations (stricter/looser grading)

---

#### E6. Error Messages Are Generic

**Location:** Multiple files

**Issue:** Error messages lack context for debugging:

```python
# claude_service.py line 392
raise ValueError(f"Failed to parse AI response as JSON: {e}. Response: {response_text[:500]}")
```

Better:
```python
raise ValueError(
    f"Failed to parse AI analysis response. "
    f"Error: {e}. "
    f"JD length: {len(original_jd)} chars. "
    f"Response preview: {response_text[:200]}"
)
```

---

### Low Impact

#### E7. Temperature Parameters Not Documented

**Location:** `/backend/app/services/claude_service.py` lines 413, 530

```python
temperature=0.3,  # Lower temperature for faster, more deterministic inference
temperature=0.2,  # Lower temperature for more consistent, focused output
```

**Issue:** Comments explain "why lower" but not "why these specific values"

---

## Test Coverage Analysis

### Critical Gaps

#### T1. No E2E Tests for Full Analysis Pipeline

**Missing:** Tests that send a JD through:
1. API endpoint
2. Rule-based scoring
3. AI analysis
4. Two-pass improvement
5. Response formatting

**Impact:** Can't verify the full user experience works

**Recommendation:** Add pytest fixtures with recorded API responses

---

#### T2. AssessmentService.analyze() Integration Tests Missing

**Location:** `/backend/tests/test_assessment_service.py`

**Issue:** Tests only cover helper methods (`_detect_rule_based_issues`, `_merge_scores`, etc.). No test covers the full `analyze()` method.

```python
# Current tests:
def test_rule_based_scores(...)  # Tests internal method
def test_detect_rule_based_issues(...)  # Tests internal method

# Missing:
async def test_analyze_full_pipeline(...)  # Would test public API
```

**Recommendation:** Add async test that mocks ClaudeService but runs full pipeline

---

### Moderate Gaps

#### T3. Frontend Hooks Have No Tests

**Location:** `/frontend/src/hooks/`

**Issue:** All 4 hooks (`useAnalyze`, `useGenerate`, `useVoiceExtraction`, `useVoiceProfiles`) have zero test coverage.

**Impact:** State management bugs, localStorage issues, and API integration errors won't be caught

**Recommendation:** Add Jest tests for:
- `useVoiceProfiles` - localStorage persistence
- `useAnalyze` - error handling, loading states

---

#### T4. Validation Logic Untested

**Location:** `/frontend/src/lib/validation.ts`

**Issue:** `getProfileHints()` and related functions have no tests despite complex logic around:
- Exclusion pattern detection
- Rule target parsing
- Keyword matching

**Recommendation:** Add unit tests for all exported functions

---

#### T5. Transform Functions Untested

**Location:** `/frontend/src/lib/transforms.ts`

**Issue:** `transformVoiceProfileToBackend()` has no tests. If fields are added/removed, transforms could break silently.

**Recommendation:** Add snapshot tests for known profile -> API payload conversions

---

### Minor Gaps

#### T6. Edge Cases in Scoring Not Covered

**Location:** `/backend/tests/test_scoring.py`

**Missing edge case tests:**
- Empty string input
- Unicode text
- Extremely long text (>10000 words)
- Text with only bullet points
- Text with only headers

---

## Technical Debt Backlog

| Priority | Issue | Effort | Impact | Category |
|----------|-------|--------|--------|----------|
| P0 | Duplicated EXCLUSION_PATTERNS between FE/BE | 2h | High | Coupling |
| P0 | No integration tests for two-pass improvement | 4h | High | Testing |
| P0 | Category weights defined in 3 places | 3h | High | Coupling |
| P1 | AssessmentService has too many responsibilities | 8h | High | Architecture |
| P1 | No frontend hook tests | 6h | High | Testing |
| P1 | Regex patterns scattered across files | 4h | Medium | Extensibility |
| P1 | FE/BE type sync is manual | 8h | High | Coupling |
| P2 | Magic number scoring thresholds | 4h | Medium | Extensibility |
| P2 | Bias words not customizable | 6h | Medium | Extensibility |
| P2 | AI model hardcoded | 0.5h | Low | Extensibility |
| P2 | useVoiceExtraction uses different API pattern | 1h | Low | Coupling |
| P3 | localStorage keys hardcoded | 0.5h | Low | Extensibility |
| P3 | Profile migration no version tracking | 2h | Low | Maintainability |
| P3 | Error messages generic | 2h | Low | Debuggability |

---

## Recommended Immediate Actions

### 1. Add Test for EXCLUSION_PATTERNS Sync (P0 - 2 hours)

Create a test that fails if backend and frontend patterns diverge:

```python
# backend/tests/test_frontend_sync.py
def test_exclusion_patterns_match_frontend():
    """Verify backend and frontend exclusion patterns are identical."""
    # Read frontend file
    with open("../frontend/src/lib/validation.ts") as f:
        content = f.read()

    # Extract patterns from TypeScript
    # Compare to field_mappings.EXCLUSION_PATTERNS
    # Fail if different
```

### 2. Consolidate Category Weights (P0 - 3 hours)

1. Remove weights from `AssessmentCategory.weight` property
2. Keep only `CATEGORY_WEIGHTS` in `field_mappings.py` as source of truth
3. Have frontend receive weights from API response
4. Update all references

### 3. Add AssessmentService Integration Test (P0 - 4 hours)

```python
@pytest.mark.asyncio
async def test_analyze_returns_improvement_that_scores_higher():
    """Improved text should score >= original."""
    service = AssessmentService(claude_api_key=os.getenv("CLAUDE_API_KEY"))

    jd = "We need a rockstar ninja to hit the ground running."
    result = await service.analyze(jd)

    # Improved version should fix bias issues
    assert "rockstar" not in result.improved_text
    assert "ninja" not in result.improved_text
```

### 4. Refactor useVoiceExtraction to Use apiRequest (P2 - 1 hour)

Quick win for consistency:

```typescript
// Change from raw fetch to apiRequest
const response = await apiRequest<VoiceExtractionResponse>('/api/voice/extract', {
  method: 'POST',
  body: JSON.stringify({ example_jds: examples }),
});
```

### 5. Move AI Model to Environment Variable (P2 - 0.5 hours)

```python
# claude_service.py
self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")
```

---

## Appendix: Files Analyzed

### Backend Services
- `/backend/app/services/scoring.py` (253 lines)
- `/backend/app/services/claude_service.py` (652 lines)
- `/backend/app/services/assessment_service.py` (451 lines)
- `/backend/app/services/question_analyzer.py` (278 lines)
- `/backend/app/services/field_mappings.py` (189 lines)

### Frontend Lib
- `/frontend/src/lib/validation.ts` (268 lines)
- `/frontend/src/lib/fixability.ts` (66 lines)
- `/frontend/src/lib/api.ts` (48 lines)
- `/frontend/src/lib/transforms.ts` (48 lines)
- `/frontend/src/lib/status-config.ts` (122 lines)

### Frontend Hooks
- `/frontend/src/hooks/useVoiceProfiles.ts` (182 lines)
- `/frontend/src/hooks/useAnalyze.ts` (170 lines)
- `/frontend/src/hooks/useGenerate.ts` (91 lines)
- `/frontend/src/hooks/useVoiceExtraction.ts` (108 lines)

### Tests
- `/backend/tests/test_scoring.py` (270 lines)
- `/backend/tests/test_claude_service.py` (342 lines)
- `/backend/tests/test_assessment_service.py` (331 lines)
- `/backend/tests/test_question_analyzer.py` (323 lines)
- `/backend/tests/test_field_mappings.py` (185 lines)
- `/backend/tests/test_analyze_endpoint.py` (65 lines)
- `/backend/tests/test_generate_endpoint.py` (62 lines)
- `/backend/tests/test_voice_endpoint.py` (267 lines)
- `/backend/tests/test_models.py` (52 lines)
