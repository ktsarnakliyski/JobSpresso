---
execution: sequential
depends_on: []
---

<objective>
Fix all CRITICAL and HIGH priority logic bugs identified in the code audit. These are bugs that could cause incorrect behavior, data loss, or crashes.
</objective>

<context>
Read CLAUDE.md for project conventions.

<audit_findings>
From ./analyses/001-critical-logic-bugs.md:

**CRITICAL (2 issues):**
1. JSON parsing regex vulnerability in claude_service.py:364-378
2. localStorage race condition in useVoiceProfiles.ts:68-75

**HIGH (5 issues):**
1. Silent improvement failure - no logging when AI fails (assessment_service.py:428-438)
2. Generic exception leaks internal error messages (analyze.py:134-135)
3. Unsafe type assertions on API data (useAnalyze.ts:67-68)
4. No validation for imported profiles (useVoiceProfiles.ts:150-165)
5. Multi-word bias phrases not detected correctly (scoring.py:168-176)
</audit_findings>

<files_to_modify>
- ./backend/app/services/claude_service.py - Fix JSON parsing
- ./backend/app/services/assessment_service.py - Add logging for improvement failures
- ./backend/app/services/scoring.py - Fix bias word detection for multi-word phrases
- ./backend/app/routers/analyze.py - Fix error handling (may be done in security prompt)
- ./frontend/src/hooks/useVoiceProfiles.ts - Add debouncing, validate imports
- ./frontend/src/hooks/useAnalyze.ts - Add runtime type validation
</files_to_modify>
</context>

<requirements>
<critical_fixes>

1. **Fix JSON Parsing Regex** (claude_service.py)
   - Current: Greedy regex `\{.*\}` matches from first { to LAST }
   - Problem: Can corrupt JSON when response has multiple JSON-like structures
   - Solution: Use brace-counting algorithm to extract first complete JSON object

2. **Fix localStorage Race Condition** (useVoiceProfiles.ts)
   - Current: Every profile change triggers immediate localStorage write
   - Problem: Rapid changes can interleave and cause data loss
   - Solution: Add 300ms debounce to localStorage writes

</critical_fixes>

<high_fixes>

3. **Add Logging for Improvement Failures** (assessment_service.py)
   - Current: Silent `except Exception` fallback
   - Solution: Log exception with context before falling back

4. **Add Runtime Type Validation** (useAnalyze.ts)
   - Current: `as AssessmentCategory` casts without validation
   - Solution: Add type guard functions to validate API responses

5. **Validate Imported Profiles** (useVoiceProfiles.ts)
   - Current: Only catches JSON.parse errors
   - Solution: Validate array structure and required fields

6. **Fix Multi-Word Bias Detection** (scoring.py)
   - Current: Word-split approach misses multi-word phrases
   - Solution: Use regex word boundaries for all bias term matching

</high_fixes>
</requirements>

<implementation_guide>

<fix_1_json_parsing>
**File:** backend/app/services/claude_service.py

Replace the regex-based JSON extraction with brace counting:

```python
def _extract_json(self, text: str) -> str:
    """Extract first complete JSON object from text using brace counting."""
    depth = 0
    start = None
    in_string = False
    escape_next = False

    for i, char in enumerate(text):
        if escape_next:
            escape_next = False
            continue
        if char == '\\':
            escape_next = True
            continue
        if char == '"' and not escape_next:
            in_string = not in_string
            continue
        if in_string:
            continue

        if char == '{':
            if depth == 0:
                start = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start is not None:
                return text[start:i+1]

    return text  # Fallback to original text
```

Update `_parse_analysis_response` to use this method instead of regex.
</fix_1_json_parsing>

<fix_2_localstorage_debounce>
**File:** frontend/src/hooks/useVoiceProfiles.ts

Add debouncing to the localStorage save effect:

```typescript
useEffect(() => {
  if (!isLoaded) return;

  const timeoutId = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles to localStorage:', e);
    }
  }, 300);  // 300ms debounce

  return () => clearTimeout(timeoutId);
}, [profiles, isLoaded]);
```
</fix_2_localstorage_debounce>

<fix_3_improvement_logging>
**File:** backend/app/services/assessment_service.py

Add logging before falling back:

```python
import logging

logger = logging.getLogger(__name__)

# In the improvement generation try/except:
try:
    improved_text = await self.claude_service.generate_improvement(...)
except Exception as e:
    logger.exception(
        "Improvement generation failed for JD (length=%d chars), using original text",
        len(jd_text)
    )
    improved_text = jd_text
```
</fix_3_improvement_logging>

<fix_4_type_validation>
**File:** frontend/src/hooks/useAnalyze.ts

Add type guard functions:

```typescript
const VALID_CATEGORIES: AssessmentCategory[] = [
  'inclusivity', 'readability', 'structure',
  'completeness', 'clarity', 'voice_match'
];

function isValidCategory(value: string): value is AssessmentCategory {
  return VALID_CATEGORIES.includes(value as AssessmentCategory);
}

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

function isValidSeverity(value: string): value is Issue['severity'] {
  return VALID_SEVERITIES.includes(value);
}

// Then use in the transform:
for (const [key, value] of Object.entries(response.evidence || {})) {
  if (!isValidCategory(key)) {
    console.warn(`Invalid category from API: ${key}`);
    continue;
  }
  // ... rest of transformation
}
```
</fix_4_type_validation>

<fix_5_import_validation>
**File:** frontend/src/hooks/useVoiceProfiles.ts

Add validation for imported profiles:

```typescript
const importProfiles = useCallback((jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'Expected an array of profiles' };
    }

    // Validate each profile has required fields
    for (let i = 0; i < parsed.length; i++) {
      const p = parsed[i];
      if (typeof p !== 'object' || p === null) {
        return { success: false, error: `Profile ${i + 1} is not a valid object` };
      }
      if (typeof p.name !== 'string' || !p.name.trim()) {
        return { success: false, error: `Profile ${i + 1} is missing a valid name` };
      }
    }

    // Proceed with import
    const withNewIds = parsed.map((p: Partial<VoiceProfile>) =>
      migrateProfile({
        ...createDefaultVoiceProfile(p),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })
    );

    setProfiles((prev) => [...prev, ...withNewIds]);
    return { success: true, count: withNewIds.length };
  } catch {
    return { success: false, error: 'Invalid JSON format' };
  }
}, []);
```
</fix_5_import_validation>

<fix_6_bias_detection>
**File:** backend/app/services/scoring.py

Fix multi-word bias phrase detection:

```python
import re

def detect_bias_words(text: str) -> dict[str, list[str]]:
    """Detect bias words in text using word boundary matching."""
    text_lower = text.lower()
    found: dict[str, list[str]] = {}

    for bias_type, word_list in BIAS_WORD_LISTS.items():
        matches = []
        for term in word_list:
            # Use word boundaries to match whole terms (including multi-word)
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, text_lower):
                matches.append(term)
        if matches:
            found[bias_type] = matches

    return found
```
</fix_6_bias_detection>

</implementation_guide>

<verification>
1. Run all backend tests: `cd backend && pytest -v`
2. Run frontend build: `cd frontend && npm run build`
3. Manual testing:
   - Test JSON parsing with complex responses (multi-JSON in response)
   - Test rapid profile updates don't lose data
   - Test importing invalid JSON shows proper error
   - Test multi-word bias terms ("hit the ground running") are detected
4. Check server logs show improvement failures with context
</verification>

<success_criteria>
- JSON parsing handles edge cases correctly
- localStorage writes are debounced (300ms)
- Improvement failures are logged with context
- Invalid API responses don't crash the frontend
- Import validation catches malformed profiles
- Multi-word bias phrases are detected
- All tests passing
</success_criteria>
