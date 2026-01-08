# backend/app/services/claude_service.py

"""
ClaudeService - Thin orchestrator for Claude API interactions.

Prompt templates have been extracted to app/prompts/ for better maintainability.
This service focuses on:
- API client management
- Request/response handling
- JSON parsing and validation
"""

import json
import re
from typing import Optional
from pydantic import BaseModel
from anthropic import AsyncAnthropic
from app.config import get_settings
from app.models.voice_profile import VoiceProfile
from app.prompts import (
    build_analysis_prompt,
    build_generation_prompt,
    build_improvement_prompt,
    build_voice_extraction_prompt,
)


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

    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = get_settings().claude_model

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

    def _parse_json_response(self, response_text: str) -> dict:
        """Parse Claude's JSON response, handling markdown code blocks."""
        # Extract JSON from response (handle markdown code blocks)
        json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(1)
        else:
            # Use brace-counting algorithm to extract first complete JSON object
            response_text = self._extract_json(response_text)

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            # Check for signs of truncation
            open_braces = response_text.count('{')
            close_braces = response_text.count('}')
            open_brackets = response_text.count('[')
            close_brackets = response_text.count(']')

            if open_braces > close_braces or open_brackets > close_brackets:
                raise ValueError(
                    f"AI response appears truncated (unmatched braces/brackets). "
                    f"This may happen with very long job descriptions. "
                    f"Try with a shorter JD or contact support."
                )

            raise ValueError(f"Failed to parse AI response as JSON: {e}. Response: {response_text[:500]}")

    def _extract_response_text(self, message) -> str:
        """Extract text content from Claude API response, with validation."""
        if not message.content or not hasattr(message.content[0], 'text'):
            raise ValueError("Unexpected response format from Claude API: empty or invalid content")
        return message.content[0].text

    async def analyze(self, request: AnalyzeRequest) -> dict:
        """Analyze a job description using Claude."""
        prompt = build_analysis_prompt(request.jd_text, request.voice_profile)

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=8192,  # Increased to handle detailed evidence for longer JDs
            temperature=0.3,  # Lower temperature for faster, more deterministic inference
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        # Check for truncation
        if message.stop_reason == "max_tokens":
            raise ValueError("Analysis response was truncated. The job description may be too long.")

        response_text = self._extract_response_text(message)
        return self._parse_json_response(response_text)

    async def generate(
        self, request: GenerateRequest, voice_profile: Optional[VoiceProfile] = None
    ) -> dict:
        """Generate a job description using Claude."""
        prompt = build_generation_prompt(request, voice_profile)

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = self._extract_response_text(message)
        return self._parse_json_response(response_text)

    async def generate_improvement(
        self,
        original_jd: str,
        scores: dict,
        issues: list[dict],
        voice_profile: Optional[VoiceProfile] = None,
    ) -> str:
        """
        Generate an improved JD using the two-pass approach.

        This is called AFTER the initial analysis, with full knowledge of:
        - Current scores for all 6 categories
        - Specific issues detected
        - How the scoring algorithms work

        Returns the improved JD text only.
        """
        prompt = build_improvement_prompt(
            original_jd=original_jd,
            scores=scores,
            issues=issues,
            voice_profile=voice_profile,
        )

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            temperature=0.2,  # Lower temperature for more consistent, focused output
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        # Check for truncation
        if message.stop_reason == "max_tokens":
            raise ValueError("Improvement response was truncated. The job description may be too long.")

        response_text = self._extract_response_text(message)

        # Clean up any preamble the model might add
        # Remove common prefixes like "Here's the improved version:"
        cleanup_patterns = [
            r"^Here['']s the improved (?:version|job description)[:\s]*\n*",
            r"^Improved (?:version|job description)[:\s]*\n*",
            r"^Below is the improved[:\s]*\n*",
        ]
        for pattern in cleanup_patterns:
            response_text = re.sub(pattern, "", response_text, flags=re.IGNORECASE)

        return response_text.strip()

    async def extract_voice_profile(self, example_jds: list[str]) -> dict:
        """Extract voice profile characteristics from example JDs."""
        prompt = build_voice_extraction_prompt(example_jds)

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = self._extract_response_text(message)

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback defaults
        return {
            "tone": "professional",
            "tone_formality": 3,
            "tone_description": "Professional",
            "address_style": "direct_you",
            "sentence_style": "balanced",
            "structure_analysis": {
                "leads_with_benefits": False,
                "typical_section_order": [
                    "intro",
                    "responsibilities",
                    "requirements",
                    "benefits",
                ],
                "includes_salary": False,
            },
            "vocabulary": {"commonly_used": [], "notably_avoided": []},
            "brand_signals": {"values": [], "personality": ""},
            "suggested_rules": [],
            "format_guidance": None,
            "summary": "Could not extract voice profile.",
        }
