# backend/app/prompts/generation_prompt.py

"""Generation prompt template for job description generation."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.claude_service import GenerateRequest
from app.models.voice_profile import VoiceProfile


GENERATION_PROMPT_TEMPLATE = """Generate a job description based on these inputs.

{voice_context}

INPUTS:
- Role Title: {role_title}
- Key Responsibilities: {responsibilities}
- Must-Have Requirements: {requirements}
{optional_fields}

Generate a complete, compelling job description that:
1. Opens with an engaging company/role intro
2. Clearly explains the role and impact
3. Lists requirements as bullet points (must-haves separate from nice-to-haves)
4. Highlights benefits and growth opportunities
5. Uses inclusive, bias-free language
6. Matches the voice profile tone (if provided)
7. Stays within 400-600 words

Provide your response as JSON:
{{
    "generated_jd": "<the complete job description>",
    "word_count": <number>,
    "notes": ["<any suggestions for missing info>"]
}}"""


def build_generation_prompt(
    request: "GenerateRequest",
    voice_profile: VoiceProfile | None = None,
) -> str:
    """Build the generation prompt from request fields."""
    voice_context = ""
    if voice_profile:
        voice_context = f"VOICE PROFILE:\n{voice_profile.to_prompt_context()}\n"

    optional_parts = []
    if request.company_description:
        optional_parts.append(f"- Company: {request.company_description}")
    if request.team_size:
        optional_parts.append(f"- Team Size: {request.team_size}")
    if request.salary_range:
        optional_parts.append(f"- Salary: {request.salary_range}")
    if request.location:
        optional_parts.append(f"- Location: {request.location}")
    if request.benefits:
        optional_parts.append(f"- Benefits: {', '.join(request.benefits)}")
    if request.nice_to_have:
        optional_parts.append(f"- Nice-to-Have: {', '.join(request.nice_to_have)}")

    optional_fields = "\n".join(optional_parts) if optional_parts else "(none provided)"

    return GENERATION_PROMPT_TEMPLATE.format(
        voice_context=voice_context,
        role_title=request.role_title,
        responsibilities="\n  - ".join(request.responsibilities),
        requirements="\n  - ".join(request.requirements),
        optional_fields=optional_fields,
    )
