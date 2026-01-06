# backend/app/services/claude_service.py

import json
import re
from typing import Optional
from pydantic import BaseModel
from anthropic import Anthropic
from app.models.voice_profile import VoiceProfile
from app.models.assessment import AssessmentCategory, IssueSeverity


class AnalyzeRequest(BaseModel):
    jd_text: str
    voice_profile: Optional[VoiceProfile] = None


class GenerateRequest(BaseModel):
    role_title: str
    responsibilities: list[str]
    requirements: list[str]
    company_description: Optional[str] = None
    team_size: Optional[str] = None
    salary_range: Optional[str] = None
    location: Optional[str] = None
    benefits: Optional[list[str]] = None
    nice_to_have: Optional[list[str]] = None


class ClaudeService:
    """Service for interacting with Claude API for JD analysis and generation."""

    SYSTEM_PROMPT = """You are JobSpresso, an expert job description analyzer and generator.
You help HR professionals and recruiters create inclusive, effective job descriptions.

Your expertise includes:
- Detecting biased language (gender, age, ability, cultural)
- Assessing readability and clarity
- Evaluating structure and completeness
- Matching tone to brand voice profiles
- Generating compelling job descriptions

Always provide specific, actionable feedback with concrete suggestions."""

    ANALYSIS_PROMPT_TEMPLATE = """Analyze this job description and provide detailed feedback.

{voice_context}

JOB DESCRIPTION TO ANALYZE:
---
{jd_text}
---

Provide your analysis as JSON with this exact structure:
{{
    "scores": {{
        "inclusivity": <0-100>,
        "readability": <0-100>,
        "clarity": <0-100>,
        "voice_match": <0-100 or null if no profile>
    }},
    "issues": [
        {{
            "severity": "critical" | "warning" | "info",
            "category": "inclusivity" | "readability" | "structure" | "completeness" | "clarity" | "voice_match",
            "description": "<what's wrong>",
            "found": "<exact text that's problematic>",
            "suggestion": "<specific replacement or fix>",
            "impact": "<why this matters, with data if applicable>"
        }}
    ],
    "positives": ["<things done well>"],
    "improved_text": "<the full improved version of the JD>"
}}

Be thorough but practical. Focus on changes that will measurably improve candidate response rates."""

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

    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    def _build_analysis_prompt(
        self, jd_text: str, voice_profile: Optional[VoiceProfile] = None
    ) -> str:
        """Build the analysis prompt with optional voice context."""
        voice_context = ""
        if voice_profile:
            voice_context = f"VOICE PROFILE TO MATCH:\n{voice_profile.to_prompt_context()}\n"

        return self.ANALYSIS_PROMPT_TEMPLATE.format(
            voice_context=voice_context, jd_text=jd_text
        )

    def _build_generation_prompt(
        self, request: GenerateRequest, voice_profile: Optional[VoiceProfile] = None
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

        return self.GENERATION_PROMPT_TEMPLATE.format(
            voice_context=voice_context,
            role_title=request.role_title,
            responsibilities="\n  - ".join(request.responsibilities),
            requirements="\n  - ".join(request.requirements),
            optional_fields=optional_fields,
        )

    def _parse_analysis_response(self, response_text: str) -> dict:
        """Parse Claude's JSON response for analysis."""
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        else:
            # Try to find raw JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}. Response: {response_text[:500]}")

    def _parse_generation_response(self, response_text: str) -> dict:
        """Parse Claude's JSON response for generation."""
        return self._parse_analysis_response(response_text)

    async def analyze(
        self, request: AnalyzeRequest
    ) -> dict:
        """Analyze a job description using Claude."""
        prompt = self._build_analysis_prompt(request.jd_text, request.voice_profile)

        message = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        if not message.content or not hasattr(message.content[0], 'text'):
            raise ValueError("Unexpected response format from Claude API: empty or invalid content")
        response_text = message.content[0].text
        return self._parse_analysis_response(response_text)

    async def generate(
        self, request: GenerateRequest, voice_profile: Optional[VoiceProfile] = None
    ) -> dict:
        """Generate a job description using Claude."""
        prompt = self._build_generation_prompt(request, voice_profile)

        message = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        if not message.content or not hasattr(message.content[0], 'text'):
            raise ValueError("Unexpected response format from Claude API: empty or invalid content")
        response_text = message.content[0].text
        return self._parse_generation_response(response_text)

    async def extract_voice_profile(self, example_jds: list[str]) -> dict:
        """Extract voice profile characteristics from example JDs."""
        prompt = f"""Analyze these example job descriptions and extract the voice/tone characteristics.

EXAMPLE JDs:
---
{chr(10).join(f"Example {i+1}:{chr(10)}{jd}{chr(10)}---" for i, jd in enumerate(example_jds))}

Extract and return as JSON:
{{
    "tone": "formal" | "professional" | "friendly" | "casual" | "startup_casual",
    "address_style": "direct_you" | "third_person" | "we_looking",
    "sentence_style": "short_punchy" | "balanced" | "detailed",
    "words_commonly_used": ["<words that appear frequently>"],
    "words_avoided": ["<words notably absent that are common in JDs>"],
    "structure_preference": "bullet_heavy" | "mixed" | "paragraph_focused",
    "summary": "<2-3 sentence description of the voice>"
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        if not message.content or not hasattr(message.content[0], 'text'):
            raise ValueError("Unexpected response format from Claude API: empty or invalid content")
        response_text = message.content[0].text
        return self._parse_analysis_response(response_text)
