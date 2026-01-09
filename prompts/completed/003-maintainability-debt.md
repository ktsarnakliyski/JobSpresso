---
execution: parallel
depends_on: []
---

<objective>
Analyze the JobSpresso codebase for **technical debt and maintainability concerns** - logic that will be hard to support, extend, or debug as the application grows.

Think like a developer who will maintain this code in 6 months. What will cause confusion? What will break when requirements change?
</objective>

<context>
Read CLAUDE.md for project conventions.

<application_structure>
- Backend: FastAPI services with Claude AI integration
- Frontend: Next.js with localStorage-based state
- MVP stage - expect features to be added
</application_structure>

<key_areas>
1. Assessment scoring system (6 categories with weights)
2. Voice profile rules and exclusion detection
3. Two-pass improvement system (analyze → optimize)
4. Question coverage analysis
</key_areas>
</context>

<analysis_requirements>
Launch **3 parallel sub-agents** using the Task tool:

<agent_1>
**Coupling & Dependencies Analyzer** (subagent_type: "general-purpose", model: "opus")

Analyze for:

1. **Tight Coupling**:
   - Services that know too much about each other
   - Components tightly bound to specific implementations
   - Hard-to-mock dependencies

2. **Hidden Dependencies**:
   - Implicit ordering requirements
   - Side effects that aren't obvious
   - Global state mutations

3. **Fragile Base Classes**:
   - Changes that would cascade through the system
   - Single points of failure

4. **Missing Abstractions**:
   - Direct API calls without service layer
   - Hardcoded business rules that should be configurable

5. **Circular Dependencies**:
   - Module import cycles
   - Bidirectional references

Files to analyze:
- All ./backend/app/services/*.py (service interdependencies)
- All ./frontend/src/hooks/*.ts (hook dependencies)
- All ./frontend/src/lib/*.ts (utility coupling)

Output format:
```
COUPLING ISSUE: [description]
FILES INVOLVED: [list]
RISK: [what breaks when this changes]
DECOUPLING SUGGESTION: [how to fix]
```
</agent_1>

<agent_2>
**Extensibility & Change-Readiness Analyzer** (subagent_type: "general-purpose", model: "opus")

Analyze for:

1. **Hardcoded Business Rules**:
   - Scoring thresholds embedded in code
   - Regex patterns without explanation
   - Magic numbers in calculations

2. **Missing Configuration**:
   - Values that should be environment variables
   - Settings that should be user-configurable
   - Feature flags that don't exist

3. **Difficult-to-Test Code**:
   - Functions with too many responsibilities
   - Tightly coupled to external services
   - Missing test coverage for edge cases

4. **Poor Error Messages**:
   - Generic error strings
   - Missing context in errors
   - Errors that don't help debugging

5. **Missing Documentation**:
   - Complex algorithms without comments
   - Non-obvious business logic
   - API contracts that aren't documented

Files to analyze:
- ./backend/app/services/scoring.py (scoring algorithms)
- ./backend/app/services/claude_service.py (AI prompts)
- ./backend/app/services/assessment_service.py (orchestration)
- ./frontend/src/lib/validation.ts (frontend validation)
- ./frontend/src/lib/fixability.ts (classification logic)

Output format:
```
MAINTAINABILITY ISSUE: [description]
FILE: path:lines
WHY IT'S A PROBLEM: [explanation]
FUTURE SCENARIO: [what happens when X changes]
RECOMMENDATION: [how to improve]
```
</agent_2>

<agent_3>
**Test Coverage & Quality Analyzer** (subagent_type: "general-purpose", model: "opus")

Analyze for:

1. **Missing Test Coverage**:
   - Critical paths without tests
   - Edge cases not covered
   - Error handling untested

2. **Test Quality Issues**:
   - Tests that don't actually verify behavior
   - Overly broad assertions
   - Tests that would pass even if code is broken

3. **Integration Gaps**:
   - Missing API endpoint tests
   - Frontend-backend contract tests
   - Missing mock coverage

4. **Test Maintainability**:
   - Brittle tests tied to implementation
   - Duplicated test setup
   - Hard-to-understand test names

Files to analyze:
- All ./backend/tests/*.py
- Compare test files to source files for coverage gaps

Output format:
```
COVERAGE GAP: [what's missing]
SOURCE FILE: [file that needs tests]
RISK: [what could break unnoticed]
RECOMMENDED TESTS: [specific test cases to add]
```
</agent_3>
</analysis_requirements>

<output_format>
After all 3 agents complete, consolidate into:

Save to: `./analyses/003-maintainability-debt.md`

Structure:
```markdown
# Technical Debt & Maintainability Analysis

## Executive Summary
- Coupling issues found: X
- Hardcoded values found: X
- Test coverage gaps: X

## Critical Maintainability Risks
[Issues that will cause pain soonest]

## Coupling Analysis
[Agent 1 findings organized by severity]

## Extensibility Analysis
[Agent 2 findings organized by impact]

## Test Coverage Analysis
[Agent 3 findings with specific test recommendations]

## Technical Debt Backlog
| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | ... | ... | ... |
| P1 | ... | ... | ... |

## Recommended Immediate Actions
1. [Most important fix]
2. [Second priority]
...
```
</output_format>

<verification>
- All service files analyzed for coupling
- Hardcoded values identified with locations
- Test coverage gaps mapped to source files
- Each issue has a clear "why it matters" explanation
- Prioritized backlog created
</verification>

<success_criteria>
- Comprehensive technical debt inventory
- Clear explanation of each maintainability risk
- Actionable recommendations with effort estimates
- Analysis saved to ./analyses/003-maintainability-debt.md
</success_criteria>
