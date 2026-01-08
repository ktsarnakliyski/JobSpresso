# Anti-Patterns & Large Files Analysis

**Last Updated:** 2026-01-08
**Scope:** Backend (Python) and Frontend (TypeScript/TSX) source files

---

## File Size Summary

### Backend Files (Threshold: >300 lines)

| File | Lines | Status | Recommendation |
|------|-------|--------|----------------|
| `backend/app/services/assessment_service.py` | 446 | WARNING | Consider splitting into assessment orchestration + issue detection |
| `backend/app/services/question_analyzer.py` | 277 | OK | Well-structured, within limits |
| `backend/app/services/claude_service.py` | 272 | OK | Good separation after prompt extraction |
| `backend/app/services/scoring.py` | 256 | OK | Good modular design |
| `backend/app/prompts/improvement_prompt.py` | 221 | OK | Prompt template, acceptable size |
| `backend/app/services/field_mappings.py` | 217 | OK | Constants file, acceptable |
| `backend/app/models/voice_profile.py` | 195 | OK | Complex model, acceptable |
| `backend/app/routers/voice.py` | 170 | OK | Within limits |
| `backend/app/models/assessment.py` | 154 | OK | Well-structured |
| `backend/app/routers/analyze.py` | 144 | OK | Clean router |

**Note:** Prompts have been extracted to `backend/app/prompts/` directory, significantly reducing `claude_service.py` from previous 651 lines.

### Frontend Files (Threshold: >200 lines)

| File | Lines | Status | Recommendation |
|------|-------|--------|----------------|
| `frontend/src/components/IssuesPanel.tsx` | 282 | OVER | Extract issue card into separate component |
| `frontend/src/components/profiles/ProfileCard.tsx` | 271 | OVER | Extract modal content into separate component |
| `frontend/src/lib/validation.ts` | 267 | OVER | Logic is cohesive, acceptable for utility |
| `frontend/src/components/QuestionCoverage.tsx` | 255 | OVER | Extract question item into separate component |
| `frontend/src/components/voice/RulesBuilder.tsx` | 249 | OVER | Extract rule item/input into separate components |
| `frontend/src/components/ui/ConfirmDialog.tsx` | 232 | OVER | Consider simplifying animation states |
| `frontend/src/components/voice/VoiceProfileEditor.tsx` | 231 | OVER | Form sections already extracted - acceptable |
| `frontend/src/components/icons/index.tsx` | 220 | OVER | SVG icons file - acceptable for icons |
| `frontend/src/components/voice/VoiceDNAPreview.tsx` | 213 | OVER | Consider extracting section components |
| `frontend/src/types/voice-profile.ts` | 211 | OVER | Type definitions file - acceptable |
| `frontend/src/components/voice/GuidedQuestionnaire.tsx` | 210 | OVER | Data + logic mixed - extract QUESTIONS const |
| `frontend/src/components/profiles/CreateProfileWizard.tsx` | 208 | OK | Wizard pattern, borderline acceptable |
| `frontend/src/app/profiles/page.tsx` | 206 | OK | Page with state management, acceptable |
| `frontend/src/hooks/useVoiceProfiles.ts` | 204 | OK | Complex hook, within limits |
| `frontend/src/components/generate/GenerateForm.tsx` | 203 | OK | Large form, within limits |
| `frontend/src/hooks/useAnalyze.ts` | 202 | OK | API transformation logic |

**Note:** Major refactoring has been done - `profiles/page.tsx` reduced from 737 to 206 lines by extracting components.

---

## Top 10 Largest Files

1. **`backend/app/services/assessment_service.py`** - 446 lines (OVER backend threshold)
2. **`frontend/src/components/IssuesPanel.tsx`** - 282 lines (OVER frontend threshold)
3. **`backend/app/services/question_analyzer.py`** - 277 lines (OK)
4. **`backend/app/services/claude_service.py`** - 272 lines (OK - reduced from 651)
5. **`frontend/src/components/profiles/ProfileCard.tsx`** - 271 lines (OVER)
6. **`frontend/src/lib/validation.ts`** - 267 lines (OVER - acceptable for utility)
7. **`backend/app/services/scoring.py`** - 256 lines (OK)
8. **`frontend/src/components/QuestionCoverage.tsx`** - 255 lines (OVER)
9. **`frontend/src/components/voice/RulesBuilder.tsx`** - 249 lines (OVER)
10. **`frontend/src/components/ui/ConfirmDialog.tsx`** - 232 lines (OVER)

---

## Anti-Patterns by Category

### 1. DRY Violations

#### 1.1 Input Styling Duplication
**Files:** Multiple frontend components
**Location:** Various
**Description:** The `inputClasses` constant is defined independently in multiple files:
- `frontend/src/components/voice/VoiceProfileEditor.tsx` (lines 30-34)
- `frontend/src/components/voice/editor/ToneSection.tsx` (lines 9-13)
- `frontend/src/lib/utils.ts` has `getInputBaseClasses()` but it's not used everywhere

**Suggestion:** Use `getInputBaseClasses()` from `@/lib/utils` consistently across all components, or create a shared `INPUT_CLASSES` constant.

---

#### 1.2 Formality Labels Duplication
**Files:** Backend + Frontend
**Backend:** `backend/app/models/voice_profile.py` (lines 108-114)
**Frontend:** `frontend/src/types/voice-profile.ts` (lines 138-144)
**Description:** `FORMALITY_LABELS` / `formality_descriptions` defined in both places with same values.

**Suggestion:** This is an acceptable duplication for a frontend/backend boundary. Consider documenting it as "intentional duplicate" or generating frontend types from backend schema.

---

#### 1.3 Rule Type Icons Duplication
**Files:** `ProfileCard.tsx` and `RulesBuilder.tsx`
**Locations:**
- `frontend/src/components/profiles/ProfileCard.tsx` (lines 17-24)
- `frontend/src/components/voice/RulesBuilder.tsx` (lines 22-29)

**Description:** `RULE_TYPE_ICONS` mapping defined twice with identical values.

**Suggestion:** Extract to `@/types/voice-profile.ts` or create `@/lib/rule-utils.ts` with both icons and colors.

---

#### 1.4 Exclusion Patterns Duplication (Frontend/Backend)
**Files:**
- `backend/app/services/field_mappings.py` (lines 105-119)
- `frontend/src/lib/validation.ts` (lines 44-58)

**Description:** `EXCLUSION_PATTERNS` list duplicated between frontend and backend. Backend comments it as "source of truth" but there's no automated sync.

**Suggestion:** This is documented and acceptable for now. Consider adding a comment in frontend referencing the backend file, or generate from a shared schema.

---

### 2. Oversized Functions/Components

#### 2.1 Backend - `AssessmentService.analyze()` - 140 lines
**File:** `backend/app/services/assessment_service.py`
**Location:** Lines 308-446
**Description:** The main `analyze()` method is doing too much:
- Rule-based score calculation
- Question coverage analysis
- AI analysis orchestration
- Score merging
- Evidence building
- Issue filtering and deduplication
- Improvement generation
- Result assembly

**Suggestion:** Extract into smaller methods:
```python
async def analyze(self, jd_text, voice_profile):
    excluded_fields = self._get_excluded_fields(voice_profile)
    rule_analysis = self._perform_rule_analysis(jd_text, excluded_fields)
    question_analysis = self._analyze_questions(jd_text, excluded_fields)
    ai_analysis = await self._perform_ai_analysis(jd_text, voice_profile)
    merged = self._merge_analyses(rule_analysis, ai_analysis, question_analysis)
    improved = await self._generate_improvement(jd_text, merged, voice_profile)
    return self._build_result(merged, improved)
```

---

#### 2.2 `GuidedQuestionnaire` - Component with embedded data
**File:** `frontend/src/components/voice/GuidedQuestionnaire.tsx`
**Location:** Lines 21-70 (QUESTIONS const)
**Description:** 50+ lines of static question data embedded in the component file.

**Suggestion:** Extract `QUESTIONS` to a separate file `@/data/questionnaire-questions.ts` or `@/constants/guided-questionnaire.ts`.

---

#### 2.3 `CANDIDATE_QUESTIONS` constant - 150 lines of data
**File:** `backend/app/services/question_analyzer.py`
**Location:** Lines 26-175
**Description:** Large data structure embedded in service file.

**Suggestion:** Move to `backend/app/services/field_mappings.py` alongside other constants, or create `backend/app/data/candidate_questions.py`.

---

#### 2.4 Frontend Components Over Threshold
Components that exceed the 200-line threshold but are generally well-structured:

| Component | Lines | Issue | Recommendation |
|-----------|-------|-------|----------------|
| `IssuesPanel.tsx` | 282 | Monolithic | Extract `IssueCard` component |
| `ProfileCard.tsx` | 271 | Card + Modal combined | Extract `ProfileDetailModal` |
| `QuestionCoverage.tsx` | 255 | Nested rendering | Extract `QuestionItem` |
| `RulesBuilder.tsx` | 249 | Multiple responsibilities | Extract `RuleItem`, `SuggestedRuleItem` |
| `ConfirmDialog.tsx` | 232 | Complex animations | Consider simpler animation approach |

**Note:** Many previous god components have been refactored:
- `profiles/page.tsx`: 737 -> 206 lines (extracted to `ProfileList`, `CreateProfileWizard`, etc.)
- `generate/page.tsx`: 493 -> 133 lines (extracted to `GenerateForm`, `GenerateResult`)
- `claude_service.py`: 651 -> 272 lines (prompts extracted to `backend/app/prompts/`)

---

### 3. Complexity Issues

#### 3.1 Conditional Rendering in `IssuesPanel.tsx`
**File:** `frontend/src/components/IssuesPanel.tsx`
**Location:** Throughout component
**Description:** Multiple nested conditionals for rendering different issue states, groupings, and expansions.

**Suggestion:** Extract `IssueCard` as a separate component. Use a render prop pattern or compound components for cleaner logic.

---

#### 3.2 Prop Drilling in Generate Page
**File:** `frontend/src/app/generate/page.tsx`
**Description:** Multiple props passed through to `GenerateForm`:
- `formData`, `onChange`, `onGenerate`, `onReset`
- `profiles`, `selectedProfile`, `selectedProfileId`, `onSelectProfile`
- `isProfilesLoaded`, `profileHints`

**Suggestion:** Consider creating a `useGenerateForm()` hook that returns all form state and handlers, or use a form context.

---

#### 3.3 Type Assertion in `useAnalyze.ts`
**File:** `frontend/src/hooks/useAnalyze.ts`
**Location:** Lines 137-138
**Description:**
```typescript
categoryScores: response.category_scores as Record<AssessmentCategory, number>,
```
Type assertion without runtime validation of the category keys.

**Suggestion:** Use the existing `isValidCategory` guard to filter/validate at runtime:
```typescript
categoryScores: Object.fromEntries(
  Object.entries(response.category_scores)
    .filter(([key]) => isValidCategory(key))
) as Record<AssessmentCategory, number>
```

---

#### 3.4 Magic Numbers
**File:** `backend/app/services/assessment_service.py`
**Location:** Line 242
**Description:** `merged[category] = 75  # Default neutral score` - the default score of 75 is a magic number.

**Suggestion:** Extract to `DEFAULT_NEUTRAL_SCORE = 75` constant in `field_mappings.py`.

---

**File:** `backend/app/services/scoring.py`
**Locations:** Various
**Description:** Multiple hardcoded thresholds:
- Line 70-71: Grade level range 6-8
- Lines 75-79: Readability penalties (3, 8)
- Lines 89-99: Word count ranges (300, 650, 700)
- Lines 133-144: Section weights (15, 25, 30, 20, 10)

**Suggestion:** Extract to constants:
```python
TARGET_GRADE_LEVEL = (6, 8)
OPTIMAL_WORD_COUNT = (300, 650)
SECTION_WEIGHTS = {
    "about": 15,
    "role": 25,
    "requirements": 30,
    "benefits": 20,
    "nice_to_have": 10,
}
```

---

### 4. Naming Issues

#### 4.1 Inconsistent Casing in Constants
**File:** `frontend/src/components/generate/GenerateForm.tsx`
**Location:** Line 41-43
**Description:** `OPTIONAL_FIELD_NAMES` uses SCREAMING_SNAKE_CASE while other component-level constants use PascalCase or camelCase.

**Suggestion:** Be consistent. For constants that are truly constant (not derived), SCREAMING_SNAKE_CASE is appropriate, but ensure consistency across files.

---

#### 4.2 Vague Function Name: `_extract_json`
**File:** `backend/app/services/claude_service.py`
**Location:** Lines 64-108
**Description:** Name suggests simple extraction but does complex brace-counting parsing.

**Suggestion:** Rename to `_extract_first_json_object()` or `_parse_json_with_brace_counting()`.

---

#### 4.3 Ambiguous: `transformResponse`
**File:** `frontend/src/hooks/useAnalyze.ts`
**Location:** Line 117
**Description:** Generic name doesn't indicate what it transforms or to what format.

**Suggestion:** Rename to `transformAnalyzeApiResponse()` or `convertSnakeToCamelCase()`.

---

### 5. Import Organization Issues

#### 5.1 No Circular Imports Detected
The codebase correctly uses:
- Lazy imports in `field_mappings.py` for enum mappings
- Proper module boundaries between services, routers, and models
- Good practice: models don't import services

#### 5.2 Inconsistent Import Ordering
**Files:** Various frontend components
**Description:** Some files mix React imports, component imports, and type imports without consistent ordering.

**Standard order should be:**
1. React/framework imports
2. Third-party imports
3. Absolute imports (@/)
4. Relative imports (./)
5. Type imports

---

## Backend Findings

### File: `backend/app/services/assessment_service.py` (446 lines)
**ISSUE:** File Size Violation
**DESCRIPTION:** Exceeds 300-line threshold by 146 lines
**SUGGESTION:** Split into:
- `assessment_orchestrator.py` - Main analyze() flow
- `issue_detector.py` - Rule-based issue detection methods
- Keep scoring in existing `scoring.py`

---

### File: `backend/app/services/assessment_service.py` (446 lines)
**ISSUE:** Long Function - `analyze()`
**LOCATION:** Lines 308-446 (138 lines)
**DESCRIPTION:** Method has too many responsibilities
**SUGGESTION:** Extract phases into separate methods as outlined above

---

### File: `backend/app/services/question_analyzer.py` (277 lines)
**ISSUE:** Data/Logic Mixing
**LOCATION:** Lines 26-175
**DESCRIPTION:** 150 lines of `CANDIDATE_QUESTIONS` dict embedded in service
**SUGGESTION:** Move to `field_mappings.py` or dedicated data file

---

### File: `backend/app/services/scoring.py` (256 lines)
**ISSUE:** Magic Numbers
**LOCATION:** Throughout
**DESCRIPTION:** Multiple hardcoded scoring thresholds
**SUGGESTION:** Extract to named constants at top of file

---

## Frontend Findings

### File: `frontend/src/components/IssuesPanel.tsx` (282 lines)
**ISSUE:** Component Size Violation
**LOCATION:** Entire file
**DESCRIPTION:** Exceeds 200-line threshold by 82 lines
**SUGGESTION:** Extract `IssueCard` and `IssueGroupHeader` as separate components

---

### File: `frontend/src/components/profiles/ProfileCard.tsx` (271 lines)
**ISSUE:** Component Size Violation
**LOCATION:** Entire file
**DESCRIPTION:** Card + Modal in single component
**SUGGESTION:** Extract `ProfileDetailModal` into separate file

---

### File: `frontend/src/components/QuestionCoverage.tsx` (255 lines)
**ISSUE:** Component Size Violation
**LOCATION:** Entire file
**DESCRIPTION:** Exceeds 200-line threshold
**SUGGESTION:** Extract `QuestionItem` component (~50 lines each)

---

### File: `frontend/src/components/voice/RulesBuilder.tsx` (249 lines)
**ISSUE:** Component Size Violation + DRY Violation
**LOCATION:** Lines 22-38 (RULE_TYPE constants)
**DESCRIPTION:** Duplicates `RULE_TYPE_ICONS` from ProfileCard
**SUGGESTION:**
1. Extract shared `RULE_TYPE_ICONS` and `RULE_TYPE_COLORS` to shared file
2. Extract `RuleItem` and `SuggestedRuleItem` components

---

### File: `frontend/src/components/voice/GuidedQuestionnaire.tsx` (210 lines)
**ISSUE:** Data/Logic Mixing
**LOCATION:** Lines 21-70
**DESCRIPTION:** 50 lines of question data in component
**SUGGESTION:** Move `QUESTIONS` to `@/data/` or `@/constants/`

---

### File: `frontend/src/lib/validation.ts` (267 lines)
**ISSUE:** File Size Violation
**LOCATION:** Entire file
**DESCRIPTION:** Validation logic file exceeds threshold
**SUGGESTION:** This is a focused utility file. The size is justified by cohesive validation logic. Add header comment explaining the file's purpose.

---

### File: `frontend/src/components/ui/ConfirmDialog.tsx` (232 lines)
**ISSUE:** Component Size Violation
**LOCATION:** Entire file
**DESCRIPTION:** Complex animation and state logic
**SUGGESTION:** Consider using a simpler animation library or extracting animation hooks

---

### File: Multiple Components
**ISSUE:** Type Assertion Usage
**FILES:** `useAnalyze.ts`, `useVoiceExtraction.ts`
**DESCRIPTION:** `as` type assertions used without runtime validation
**SUGGESTION:** Add runtime type guards before assertions

---

## Refactoring Priority List

### High Priority (Impact: High, Effort: Medium)

1. **Split `assessment_service.py`**
   - Impact: Improves testability, readability
   - Effort: 2-3 hours
   - Risk: Low (no behavior change)

2. **Extract `IssueCard` from `IssuesPanel.tsx`**
   - Impact: Reduces component complexity
   - Effort: 1 hour
   - Risk: Low

3. **Consolidate `RULE_TYPE_ICONS/COLORS`**
   - Impact: Eliminates duplication, single source of truth
   - Effort: 30 minutes
   - Risk: Very low

### Medium Priority (Impact: Medium, Effort: Low)

4. **Extract `CANDIDATE_QUESTIONS` to data file**
   - Impact: Cleaner service code
   - Effort: 30 minutes
   - Risk: Very low

5. **Extract scoring constants**
   - Impact: Self-documenting code
   - Effort: 30 minutes
   - Risk: Very low

6. **Standardize input styling**
   - Impact: Consistent UI, easier maintenance
   - Effort: 1 hour
   - Risk: Low (visual only)

### Lower Priority (Impact: Low, Effort: Low)

7. **Rename `_extract_json` to `_extract_first_json_object`**
   - Impact: Better code clarity
   - Effort: 15 minutes
   - Risk: Very low

8. **Standardize import ordering**
   - Impact: Code consistency
   - Effort: 30 minutes (with ESLint rule)
   - Risk: None

9. **Add runtime type guards before type assertions**
   - Impact: Runtime safety
   - Effort: 1 hour
   - Risk: Very low

---

## Summary

The codebase is generally well-structured with good separation of concerns. Significant refactoring has already been done:

- `claude_service.py`: Reduced from 651 to 272 lines by extracting prompts to `backend/app/prompts/`
- `profiles/page.tsx`: Reduced from 737 to 206 lines by extracting to `ProfileList`, `ProfileCard`, `CreateProfileWizard`, etc.
- `generate/page.tsx`: Reduced from 493 to 133 lines by extracting to `GenerateForm`, `GenerateResult`

### Current Issues Summary

| Category | Count | Severity |
|----------|-------|----------|
| Backend files > 300 lines | 1 | `assessment_service.py` (446 lines) |
| Frontend files > 200 lines | 11 | 3 acceptable (icons, types, validation) |
| DRY Violations | 4 | `RULE_TYPE_ICONS`, input styling, formality labels, exclusion patterns |
| Magic Numbers | ~10 | In `scoring.py`, `assessment_service.py` |
| Type Assertion Usage | 2 | In hooks, without runtime guards |
| Naming Issues | 3 | `_extract_json`, `transformResponse`, constant casing |

### Key Recommendations

1. **Highest Impact**: Split `assessment_service.py` into orchestration + issue detection
2. **Quick Wins**: Consolidate `RULE_TYPE_ICONS`, extract scoring constants
3. **Nice to Have**: Extract child components from `IssuesPanel`, `ProfileCard`, `QuestionCoverage`

The most impactful remaining refactoring would be splitting `assessment_service.py` and extracting child components from the larger React components. The codebase has no circular import issues and follows good module boundaries.
