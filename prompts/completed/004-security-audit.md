---
execution: parallel
depends_on: []
---

<objective>
Perform a comprehensive **security audit** of the JobSpresso application. Identify vulnerabilities, insecure patterns, and potential attack vectors.

Focus on OWASP Top 10 risks and common web application vulnerabilities. Provide specific remediation for each finding.
</objective>

<context>
Read CLAUDE.md for project conventions.

<application_structure>
- Backend: FastAPI (Python) - handles job description analysis and AI calls
- Frontend: Next.js 14 - client-side rendering, no auth in MVP
- External dependency: Claude API for AI analysis
- No database in MVP - localStorage for voice profiles
- No user authentication currently
</application_structure>

<security_context>
- Application handles job descriptions (potentially sensitive company data)
- Makes API calls to Claude (API key must be protected)
- Voice profiles stored client-side
- No HTTPS enforcement in development
</security_context>
</context>

<analysis_requirements>
Launch **3 parallel sub-agents** using the Task tool:

<agent_1>
**Backend Security Auditor** (subagent_type: "general-purpose", model: "opus")

Analyze for:

1. **Injection Vulnerabilities**:
   - Prompt injection in AI calls
   - Command injection in any shell commands
   - Log injection risks

2. **API Security**:
   - Missing rate limiting
   - No request size limits
   - Missing input validation
   - Insecure CORS configuration

3. **Sensitive Data Exposure**:
   - API keys in code or logs
   - Sensitive data in error messages
   - Overly verbose logging

4. **Insecure Configuration**:
   - Debug mode in production
   - Missing security headers
   - Insecure defaults

5. **Dependency Vulnerabilities**:
   - Check requirements.txt for known CVEs
   - Outdated packages with security issues

Files to analyze:
- ./backend/app/main.py (app configuration)
- ./backend/app/config.py (settings)
- ./backend/app/routers/*.py (all endpoints)
- ./backend/app/services/claude_service.py (AI integration)
- ./backend/requirements.txt (dependencies)

Output format:
```
VULNERABILITY: [name]
SEVERITY: CRITICAL/HIGH/MEDIUM/LOW
LOCATION: file:line
DESCRIPTION: [what's wrong]
ATTACK SCENARIO: [how it could be exploited]
REMEDIATION: [specific fix with code example]
```
</agent_1>

<agent_2>
**Frontend Security Auditor** (subagent_type: "general-purpose", model: "opus")

Analyze for:

1. **XSS Vulnerabilities**:
   - dangerouslySetInnerHTML usage
   - Unescaped user input in renders
   - Unsafe URL handling

2. **Client-Side Data Security**:
   - Sensitive data in localStorage
   - Data exposure in browser console
   - Insecure data serialization

3. **Insecure Communication**:
   - API calls without HTTPS
   - Missing error handling exposing info
   - CORS bypass attempts possible

4. **Dependency Vulnerabilities**:
   - Check package.json for known CVEs
   - Outdated packages with security issues

5. **Information Disclosure**:
   - Source maps in production
   - Verbose error messages
   - Debug information leaking

Files to analyze:
- ./frontend/src/lib/api.ts (API calls)
- ./frontend/src/hooks/*.ts (data handling)
- ./frontend/src/app/**/*.tsx (all pages)
- ./frontend/src/components/**/*.tsx (all components)
- ./frontend/package.json (dependencies)

Output format:
```
VULNERABILITY: [name]
SEVERITY: CRITICAL/HIGH/MEDIUM/LOW
LOCATION: file:line
DESCRIPTION: [what's wrong]
ATTACK SCENARIO: [how it could be exploited]
REMEDIATION: [specific fix with code example]
```
</agent_2>

<agent_3>
**AI/LLM Security Auditor** (subagent_type: "general-purpose", model: "opus")

Analyze for:

1. **Prompt Injection**:
   - User input inserted into prompts without sanitization
   - Ability to override system prompts
   - Jailbreak vectors

2. **Data Leakage via AI**:
   - Sensitive data sent to Claude API
   - PII in job descriptions not sanitized
   - API responses logged inappropriately

3. **AI Output Handling**:
   - Unsafe parsing of AI responses
   - Code execution from AI output
   - Trusting AI output without validation

4. **API Key Security**:
   - Key exposure risks
   - Key rotation capability
   - Scope limitation of API key

5. **Rate Limiting & Costs**:
   - Potential for cost attacks
   - Missing usage limits
   - No per-user quotas

Files to analyze:
- ./backend/app/services/claude_service.py (all prompts and AI calls)
- ./backend/app/services/assessment_service.py (AI integration points)
- ./backend/app/config.py (API key handling)

Output format:
```
AI SECURITY ISSUE: [name]
SEVERITY: CRITICAL/HIGH/MEDIUM/LOW
LOCATION: file:line
DESCRIPTION: [what's wrong]
ATTACK SCENARIO: [how it could be exploited]
REMEDIATION: [specific fix with code example]
```
</agent_3>
</analysis_requirements>

<output_format>
After all 3 agents complete, consolidate into:

Save to: `./analyses/004-security-audit.md`

Structure:
```markdown
# Security Audit Report

## Executive Summary
- Critical vulnerabilities: X
- High severity: X
- Medium severity: X
- Low severity: X

## CRITICAL Vulnerabilities (Require Immediate Action)
| ID | Vulnerability | Location | Remediation |
|----|--------------|----------|-------------|

## HIGH Severity Vulnerabilities
[Same table format]

## MEDIUM Severity Vulnerabilities
[Same table format]

## LOW Severity / Informational
[Same table format]

## OWASP Top 10 Coverage
| Category | Status | Findings |
|----------|--------|----------|
| A01:2021 Broken Access Control | ✓/⚠️/✗ | ... |
| A02:2021 Cryptographic Failures | ... | ... |
| A03:2021 Injection | ... | ... |
| ... | ... | ... |

## Backend Findings
[Full agent output]

## Frontend Findings
[Full agent output]

## AI/LLM Findings
[Full agent output]

## Remediation Roadmap
### Immediate (< 1 day)
1. [Critical fix 1]
2. [Critical fix 2]

### Short-term (< 1 week)
1. [High priority fix]

### Medium-term (< 1 month)
1. [Medium priority improvements]

## Security Recommendations
[General security improvements not tied to specific vulnerabilities]
```
</output_format>

<verification>
- All OWASP Top 10 categories evaluated
- Each vulnerability has specific file:line reference
- Each vulnerability has concrete remediation
- Attack scenarios explain real-world risk
- Dependencies checked for known CVEs
</verification>

<success_criteria>
- Zero CRITICAL vulnerabilities left without remediation plan
- All API endpoints reviewed for security
- AI/LLM specific risks assessed
- Clear prioritized remediation roadmap
- Analysis saved to ./analyses/004-security-audit.md
</success_criteria>
