---
execution: parallel
depends_on: []
---

<objective>
Analyze the entire JobSpresso application for **anti-patterns and oversized files** that violate clean code principles. Identify code that works but is poorly structured, hard to understand, or violates established patterns.

Focus on maintainability and readability issues, not functional bugs.
</objective>

<context>
Read CLAUDE.md for project conventions.

<application_structure>
- Backend: FastAPI + Python 3.12 (services, routers, models)
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- No database in MVP - localStorage for voice profiles
</application_structure>

<files_to_analyze>
**All source files in:**
- ./backend/app/services/*.py
- ./backend/app/routers/*.py
- ./backend/app/models/*.py
- ./frontend/src/app/**/*.tsx (pages)
- ./frontend/src/components/**/*.tsx
- ./frontend/src/hooks/*.ts
- ./frontend/src/lib/*.ts
- ./frontend/src/types/*.ts
</files_to_analyze>
</context>

<analysis_requirements>
Launch **2 parallel sub-agents** using the Task tool:

<agent_1>
**Backend Anti-Pattern Detector** (subagent_type: "general-purpose", model: "opus")

Analyze ALL Python files for:

1. **File Size Issues** (flag files > 300 lines):
   - Count lines per file
   - Identify files that should be split

2. **Function Length** (flag functions > 50 lines):
   - List functions that are too long
   - Suggest extraction points

3. **God Classes/Services**:
   - Classes doing too many things
   - Services with unclear boundaries

4. **DRY Violations**:
   - Duplicated logic across files
   - Copy-pasted patterns that should be shared

5. **Circular Dependencies**:
   - Import cycles between modules
   - Workarounds using local imports

6. **Magic Numbers/Strings**:
   - Hardcoded values that should be constants
   - Unexplained numeric thresholds

7. **Poor Naming**:
   - Vague function/variable names
   - Inconsistent naming conventions

Output format per issue:
```
FILE: path/to/file.py (X lines)
ISSUE: [Anti-pattern type]
LOCATION: lines X-Y
DESCRIPTION: [What's wrong]
SUGGESTION: [How to fix]
```
</agent_1>

<agent_2>
**Frontend Anti-Pattern Detector** (subagent_type: "general-purpose", model: "opus")

Analyze ALL TypeScript/TSX files for:

1. **Component Size** (flag components > 200 lines):
   - List oversized components
   - Suggest extraction points

2. **Prop Drilling**:
   - Props passed through multiple layers
   - Candidates for context or state management

3. **Business Logic in Components**:
   - Complex logic that should be in hooks/utils
   - API calls directly in components

4. **Conditional Rendering Hell**:
   - Deeply nested ternaries
   - Complex && chains

5. **Type Assertion Overuse**:
   - `as any`, `as unknown`
   - Type assertions hiding real issues

6. **Hook Dependencies**:
   - Missing or incorrect useEffect dependencies
   - Over-complicated dependency arrays

7. **CSS/Tailwind Issues**:
   - Extremely long className strings
   - Duplicated style patterns

8. **Import Organization**:
   - Circular imports
   - Inconsistent import ordering

Output format per issue:
```
FILE: path/to/file.tsx (X lines)
ISSUE: [Anti-pattern type]
LOCATION: lines X-Y
DESCRIPTION: [What's wrong]
SUGGESTION: [How to fix]
```
</agent_2>
</analysis_requirements>

<output_format>
After both agents complete, consolidate into:

Save to: `./analyses/002-antipatterns-large-files.md`

Structure:
```markdown
# Anti-Patterns & Large Files Analysis

## File Size Summary
| File | Lines | Status | Recommendation |
|------|-------|--------|----------------|

## Top 10 Largest Files
[Ranked list with line counts]

## Anti-Patterns by Category

### DRY Violations
[List with locations and suggestions]

### Oversized Functions/Components
[List with extraction recommendations]

### Complexity Issues
[Nested conditionals, prop drilling, etc.]

### Naming Issues
[Vague or inconsistent names]

## Backend Findings
[Full agent output]

## Frontend Findings
[Full agent output]

## Refactoring Priority List
1. [Highest impact refactor]
2. [Next priority]
...
```
</output_format>

<verification>
- All source files analyzed for line count
- Files > 300 lines (backend) or > 200 lines (frontend) flagged
- Each anti-pattern has specific location and fix suggestion
- No nitpicking on minor style issues
- Focus on patterns that hurt maintainability
</verification>

<success_criteria>
- Complete file size inventory
- Anti-patterns categorized and prioritized
- Actionable refactoring suggestions
- Analysis saved to ./analyses/002-antipatterns-large-files.md
</success_criteria>
