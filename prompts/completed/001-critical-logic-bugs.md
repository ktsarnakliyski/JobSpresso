---
execution: parallel
depends_on: []
---

<objective>
Perform a deep analysis of the entire JobSpresso application to identify **critical logic bugs and issues** that could cause incorrect behavior, crashes, or data corruption.

Act as an extremely senior software developer reviewing production code before a major release. Find issues that would break functionality, not style nitpicks.
</objective>

<context>
Read CLAUDE.md for project conventions.

<application_structure>
JobSpresso is a job description analyzer/generator with voice profiles.
- Backend: FastAPI + Python 3.12 (./backend/)
- Frontend: Next.js 14 + TypeScript (./frontend/)
- Assessment combines rule-based scoring with AI (Claude API)
</application_structure>

<files_to_analyze>
**Backend Services (Critical Logic):**
- ./backend/app/services/assessment_service.py - Main assessment orchestration
- ./backend/app/services/claude_service.py - AI integration, prompt building
- ./backend/app/services/scoring.py - Rule-based scoring algorithms
- ./backend/app/services/question_analyzer.py - Q&A coverage analysis
- ./backend/app/services/field_mappings.py - Shared constants and mappings

**Backend API Layer:**
- ./backend/app/routers/analyze.py - Analysis endpoint
- ./backend/app/routers/generate.py - Generation endpoint
- ./backend/app/routers/voice.py - Voice profile extraction

**Frontend Core Logic:**
- ./frontend/src/hooks/useAnalyze.ts - Analysis state management
- ./frontend/src/hooks/useGenerate.ts - Generation state management
- ./frontend/src/hooks/useVoiceProfiles.ts - Voice profile persistence
- ./frontend/src/lib/validation.ts - Profile hint generation
- ./frontend/src/lib/fixability.ts - Issue classification

**Data Models:**
- ./backend/app/models/assessment.py - Assessment result models
- ./backend/app/models/voice_profile.py - Voice profile models
- ./frontend/src/types/assessment.ts - Frontend type definitions
- ./frontend/src/types/voice-profile.ts - Frontend voice profile types
</files_to_analyze>
</context>

<analysis_requirements>
Launch **3 parallel sub-agents** using the Task tool, each analyzing different layers:

<agent_1>
**Backend Logic Reviewer** (subagent_type: "general-purpose", model: "opus")

Focus on:
1. **Async/await correctness**: Missing awaits, unawaited coroutines
2. **Error handling gaps**: Unhandled exceptions, missing try/catch
3. **Race conditions**: Concurrent state access issues
4. **Data validation**: Missing input validation, type mismatches
5. **API contract violations**: Response format inconsistencies
6. **Logic errors in scoring**: Incorrect calculations, wrong operators

Files: All ./backend/app/services/*.py and ./backend/app/routers/*.py
</agent_1>

<agent_2>
**Frontend Logic Reviewer** (subagent_type: "general-purpose", model: "opus")

Focus on:
1. **State management bugs**: Stale closures, missing dependencies in useEffect
2. **API integration issues**: Error handling, response parsing
3. **Type safety violations**: `as any` casts, missing null checks
4. **localStorage reliability**: Edge cases, serialization errors
5. **Conditional rendering bugs**: Missing null guards
6. **Form validation gaps**: Missing required field checks

Files: All ./frontend/src/hooks/*.ts, ./frontend/src/lib/*.ts
</agent_2>

<agent_3>
**Data Model Alignment Reviewer** (subagent_type: "general-purpose", model: "opus")

Focus on:
1. **Backend/Frontend type mismatches**: Field naming, optional vs required
2. **Serialization issues**: Enum handling, date formats
3. **Missing fields**: Backend returns data frontend doesn't expect
4. **Default value inconsistencies**: Different defaults in Python vs TypeScript

Files: Compare ./backend/app/models/*.py with ./frontend/src/types/*.ts
</agent_3>
</analysis_requirements>

<output_format>
After all 3 agents complete, consolidate findings into:

Save to: `./analyses/001-critical-logic-bugs.md`

Structure:
```markdown
# Critical Logic Bug Analysis

## Executive Summary
[Number of issues found by severity]

## CRITICAL Issues (Require Immediate Fix)
| Location | Issue | Impact | Recommended Fix |
|----------|-------|--------|-----------------|

## HIGH Priority Issues
| Location | Issue | Impact | Recommended Fix |
|----------|-------|--------|-----------------|

## MEDIUM Priority Issues
[Same table format]

## Agent Reports
### Backend Logic
[Full agent output]

### Frontend Logic
[Full agent output]

### Data Model Alignment
[Full agent output]
```
</output_format>

<verification>
- All 3 sub-agents completed their analysis
- Issues categorized by severity (CRITICAL/HIGH/MEDIUM)
- Each issue has a specific file:line reference
- Each issue has a concrete recommended fix
- No false positives from style preferences
</verification>

<success_criteria>
- Comprehensive coverage of all logic-critical files
- Zero CRITICAL issues left unidentified
- Clear, actionable recommendations for each finding
- Analysis saved to ./analyses/001-critical-logic-bugs.md
</success_criteria>
