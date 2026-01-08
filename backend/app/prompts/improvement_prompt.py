# backend/app/prompts/improvement_prompt.py

"""Improvement prompt template for two-pass JD optimization."""

from typing import Optional
from app.models.voice_profile import VoiceProfile


# Two-pass improvement system: This prompt is used AFTER analysis to generate
# an improved version with full knowledge of how scoring works
IMPROVEMENT_PROMPT_TEMPLATE = """You are improving a job description. Your goal is to maximize its score when re-analyzed.

===============================================================================
CRITICAL RULE: NO HALLUCINATION
===============================================================================
You MUST NOT invent or add information that doesn't exist in the original.

X FORBIDDEN - Adding invented facts:
- Inventing salary: "Competitive salary" -> "$120,000-$150,000" (WRONG - no source)
- Inventing team size: Adding "team of 8 engineers" when not mentioned
- Inventing benefits: Adding "401k matching" when not mentioned
- Inventing location: Adding "Remote-first" when not specified

V ALLOWED - Restructuring and rephrasing:
- Better headers: "What you'll do" -> "## Responsibilities"
- Shorter sentences: Split complex sentences into simpler ones
- Bias word replacements: "rockstar" -> "expert" (use EXACT replacements below)
- Reformat to bullets: Convert paragraphs to bullet lists where appropriate
- Rephrase vague text: "competitive compensation" -> "competitive salary package"

===============================================================================
ORIGINAL JOB DESCRIPTION
===============================================================================
{original_jd}

===============================================================================
CURRENT ANALYSIS RESULTS
===============================================================================
Overall Score: {overall_score}/100

Category Scores:
- Inclusivity: {inclusivity_score}/100 (weight: 25%)
- Readability: {readability_score}/100 (weight: 20%)
- Structure: {structure_score}/100 (weight: 15%)
- Completeness: {completeness_score}/100 (weight: 15%)
- Clarity: {clarity_score}/100 (weight: 10%)
- Voice Match: {voice_match_score}/100 (weight: 15%)

===============================================================================
ISSUES TO FIX (Priority Order)
===============================================================================
{issues_list}

===============================================================================
HOW SCORING WORKS - Use this to maximize scores
===============================================================================

## READABILITY (20%) - Flesch-Kincaid Grade Level
Target: Grade 6-8 = 100 points
- Grade 9 = 92 pts, Grade 10 = 84 pts, Grade 12 = 68 pts, Grade 14+ = 52 pts

HOW TO IMPROVE:
- Use short sentences (under 20 words each)
- Use simple words (1-2 syllables preferred)
- Avoid jargon and corporate speak

Word replacements that help:
- "utilize" -> "use"
- "facilitate" -> "help"
- "leverage" -> "use"
- "synergize" -> "work together"
- "optimize" -> "improve"
- "implement" -> "build" or "create"
- "methodology" -> "method"

## STRUCTURE (15%) - Section Detection via Regex
The system looks for these headers (case-insensitive):

| Section | Patterns Detected | Points |
|---------|-------------------|--------|
| About | "about us", "company overview", "who we are" | +15 |
| Role | "the role", "position", "responsibilities", "what you'll do" | +25 |
| Requirements | "requirements", "qualifications", "must have", "what you'll need" | +30 |
| Benefits | "benefits", "what we offer", "perks", "compensation" | +20 |
| Nice-to-have | "nice to have", "bonus", "preferred", "plus" | +10 |

BONUS POINTS:
- Bullet points (-, *, -, 1.) -> +10 pts
- Headers (## or CAPS:) -> +5 pts

FORMAT FOR MAXIMUM STRUCTURE SCORE:
```
## About Us
[company description]

## The Role
[role description]

## Requirements
- requirement 1
- requirement 2

## Nice to Have
- bonus 1

## What We Offer
- benefit 1
```

## COMPLETENESS (15%) - Keyword Detection
The system searches for these keywords:

| Element | Detection Patterns | Points |
|---------|-------------------|--------|
| Salary | $, EUR, GBP, "k", "salary", "compensation", "pay range" | +30 |
| Location | "remote", "hybrid", "on-site", "office", "based in" | +20 |
| Requirements | "requirements", "qualifications", "must have" | +25 |
| Benefits | "benefits", "health", "insurance", "401k", "pto", "equity" | +15 |
| Team size | "team of X", "X-person team", "small team", "large team" | +10 |

NOTE: You can score points by mentioning these topics even if vague.
"Competitive salary" scores the salary keyword even without specific numbers.

## INCLUSIVITY (25%) - Bias Word Detection
Replace these EXACT terms with their suggested alternatives:

{bias_replacement_table}

IMPORTANT: Use SHORT replacements. "rockstar" -> "top performer" (not "top performer with expertise")

## CLARITY (10%) - AI Assessment
- Be specific about responsibilities
- Avoid vague phrases like "various tasks" or "other duties"
- Quantify when possible: "manage projects" -> "manage 3-5 concurrent projects"

## VOICE MATCH (15%) - AI Assessment
{voice_context}

===============================================================================
YOUR TASK
===============================================================================
Generate an IMPROVED version of the job description that:

1. FIXES all issues listed above (use exact replacements for bias words)
2. RESTRUCTURES with proper markdown headers to score Structure points
3. SIMPLIFIES sentences for better Readability (short sentences, simple words)
4. PRESERVES all factual information from the original (NO HALLUCINATION)
5. MAINTAINS the original tone and voice

PRIORITY ORDER for improvements:
1. Fix bias words (immediate impact on Inclusivity)
2. Add proper section headers (immediate impact on Structure)
3. Convert to bullet points where appropriate (Structure bonus)
4. Simplify complex sentences (Readability)
5. Preserve completeness keywords (don't remove salary/location/benefits mentions)

OUTPUT:
Return ONLY the improved job description text. No preamble, no explanation.
Do NOT include phrases like "Here's the improved version:" - just the JD text itself."""


def build_improvement_prompt(
    original_jd: str,
    scores: dict,
    issues: list[dict],
    voice_profile: Optional[VoiceProfile] = None,
) -> str:
    """Build the improvement prompt with full scoring context."""
    # Import centralized constants (no more circular dependency issue)
    from app.services.field_mappings import BIAS_REPLACEMENTS, CATEGORY_WEIGHTS

    # Calculate overall score (weighted average)
    overall_score = sum(
        scores.get(cat, 75) * weight for cat, weight in CATEGORY_WEIGHTS.items()
    )

    # Format issues list
    if issues:
        issues_lines = []
        for i, issue in enumerate(issues, 1):
            severity = issue.get("severity", "info").upper()
            category = issue.get("category", "unknown")
            description = issue.get("description", "")
            found = issue.get("found", "")
            suggestion = issue.get("suggestion", "")

            issue_text = f"{i}. [{severity}] {category}: {description}"
            if found:
                issue_text += f"\n   Found: \"{found}\""
            if suggestion:
                issue_text += f"\n   Fix: {suggestion}"
            issues_lines.append(issue_text)
        issues_list = "\n".join(issues_lines)
    else:
        issues_list = "No specific issues detected. Focus on structure and readability improvements."

    # Build voice context
    if voice_profile:
        voice_context = f"Match this voice profile:\n{voice_profile.to_prompt_context()}"
    else:
        voice_context = "No voice profile specified. Maintain a professional, inclusive tone."

    # Generate bias replacement table dynamically from single source of truth
    bias_table_rows = ["| Problematic Term | Replace With |", "|------------------|--------------|"]
    for term, replacement in BIAS_REPLACEMENTS.items():
        bias_table_rows.append(f"| {term} | {replacement} |")
    bias_replacement_table = "\n".join(bias_table_rows)

    return IMPROVEMENT_PROMPT_TEMPLATE.format(
        original_jd=original_jd,
        overall_score=round(overall_score),
        inclusivity_score=scores.get("inclusivity", 75),
        readability_score=scores.get("readability", 75),
        structure_score=scores.get("structure", 75),
        completeness_score=scores.get("completeness", 75),
        clarity_score=scores.get("clarity", 75),
        voice_match_score=scores.get("voice_match", 75) if voice_profile else "N/A",
        issues_list=issues_list,
        voice_context=voice_context,
        bias_replacement_table=bias_replacement_table,
    )
