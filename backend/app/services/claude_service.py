# backend/app/services/claude_service.py

import json
import re
from typing import Optional
from pydantic import BaseModel
from anthropic import AsyncAnthropic
from app.models.voice_profile import VoiceProfile


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

    ANALYSIS_PROMPT_TEMPLATE = """Analyze this job description and provide detailed, evidence-based feedback.

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
    "category_evidence": {{
        "inclusivity": {{
            "supporting_excerpts": ["<exact quotes from JD showing good inclusive language>"],
            "missing_elements": ["<specific inclusive elements that are missing>"],
            "opportunity": "<the single most impactful improvement for this category>",
            "impact_prediction": "<e.g., 'Removing gendered language could increase diverse applicants by 20%'>"
        }},
        "readability": {{
            "supporting_excerpts": ["<quotes of clear, simple language>"],
            "missing_elements": ["<jargon, complex sentences, or unclear phrasing>"],
            "opportunity": "<main readability improvement>",
            "impact_prediction": null
        }},
        "clarity": {{
            "supporting_excerpts": ["<specific, concrete descriptions>"],
            "missing_elements": ["<vague phrases that need more detail>"],
            "opportunity": "<how to make role expectations clearer>",
            "impact_prediction": null
        }},
        "voice_match": {{
            "supporting_excerpts": ["<text that matches the voice profile tone>"],
            "missing_elements": ["<aspects that don't match the profile>"],
            "opportunity": "<how to better match the voice>",
            "impact_prediction": null
        }}
    }},
    "issues": [
        {{
            "severity": "critical" | "warning" | "info",
            "category": "inclusivity" | "readability" | "structure" | "completeness" | "clarity" | "voice_match",
            "description": "<what's wrong>",
            "found": "<exact text that's problematic>",
            "suggestion": "<specific replacement or fix>",
            "impact": "<why this matters, with research-backed data if possible>"
        }}
    ],
    "positives": ["<specific things done well - quote the text when possible>"],
    "improved_text": "<the full improved version of the JD>"
}}

IMPORTANT GUIDELINES:
1. Always quote specific text from the JD to support your scores in supporting_excerpts
2. For each issue, provide the exact problematic text in "found"
3. Impact predictions should include research-backed statistics when possible (e.g., salary transparency increases applications by 30%)
4. Focus on changes that will measurably improve candidate response rates
5. Be practical - prioritize high-impact, easy-to-implement changes
6. If no voice profile is provided, set voice_match supporting_excerpts and missing_elements to empty arrays

CRITICAL - ISSUE QUALITY RULES (MANDATORY - VIOLATIONS INVALIDATE YOUR RESPONSE):

7. SINGLE-WORD ISSUES ARE ABSOLUTELY PROHIBITED.
   The "found" field must ALWAYS contain 2+ words.

   INVALID (will be rejected by system):
   {{"found": "analytical", ...}} ← REJECTED
   {{"found": "competitive", ...}} ← REJECTED
   {{"found": "driven", ...}} ← REJECTED

   VALID (multi-word phrases only):
   {{"found": "rockstar developer", "suggestion": "experienced developer"}}
   {{"found": "aggressive timeline", "suggestion": "ambitious timeline"}}
   {{"found": "man-hours required", "suggestion": "person-hours required"}}

8. Words like "analytical", "competitive", "driven", "ambitious", "logic", "independent",
   "confident", "decisive" are LEGITIMATE professional qualities - NOT bias issues.
   If the JD has gender language imbalance, mention it in category_evidence.inclusivity.opportunity,
   NOT as individual issues.

9. Every issue MUST have a SPECIFIC, COPY-PASTE-READY suggestion.
   BAD: "consider alternatives" ← REJECTED (not actionable)
   BAD: "Add team size information" ← REJECTED (not replacement text)
   GOOD: "competitive salary" → "$85K-$105K + equity" (specific replacement)

10. If you cannot provide a concrete replacement phrase, do NOT create an issue.

11. Maximum 5 issues total. Quality over quantity.

12. Issues must be for PHRASES (2+ words) that need replacement."""

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
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = "claude-sonnet-4-5-20250929"

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

    def _extract_response_text(self, message) -> str:
        """Extract text content from Claude API response, with validation."""
        if not message.content or not hasattr(message.content[0], 'text'):
            raise ValueError("Unexpected response format from Claude API: empty or invalid content")
        return message.content[0].text

    async def analyze(
        self, request: AnalyzeRequest
    ) -> dict:
        """Analyze a job description using Claude."""
        prompt = self._build_analysis_prompt(request.jd_text, request.voice_profile)

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,  # Reduced from 8192 for faster response
            temperature=0.3,  # Lower temperature for faster, more deterministic inference
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        # Check for truncation
        if message.stop_reason == "max_tokens":
            raise ValueError("Analysis response was truncated. The job description may be too long.")

        response_text = self._extract_response_text(message)
        return self._parse_analysis_response(response_text)

    async def generate(
        self, request: GenerateRequest, voice_profile: Optional[VoiceProfile] = None
    ) -> dict:
        """Generate a job description using Claude."""
        prompt = self._build_generation_prompt(request, voice_profile)

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = self._extract_response_text(message)
        return self._parse_generation_response(response_text)

    VOICE_EXTRACTION_PROMPT = """Analyze these job descriptions and extract the writing voice/style.

Example JDs to analyze:
{examples}

Extract the voice profile as JSON with this structure:
{{
    "tone": "formal" | "professional" | "friendly" | "casual" | "startup_casual",
    "tone_formality": <1-5, where 1=very formal, 5=very casual>,
    "tone_description": "<2-3 word description like 'Professional but warm' or 'Energetic and direct'>",
    "address_style": "direct_you" | "third_person" | "we_looking",
    "sentence_style": "short_punchy" | "balanced" | "detailed",
    "structure_analysis": {{
        "leads_with_benefits": <true/false>,
        "typical_section_order": ["<section1>", "<section2>", ...],
        "includes_salary": <true/false>
    }},
    "vocabulary": {{
        "commonly_used": ["<word1>", "<word2>", ...],
        "notably_avoided": ["<word1>", "<word2>", ...]
    }},
    "brand_signals": {{
        "values": ["<value1>", "<value2>", ...],
        "personality": "<brief description of brand personality>"
    }},
    "suggested_rules": [
        {{
            "text": "<natural language rule like 'Never include salary information'>",
            "rule_type": "exclude" | "include" | "format" | "order" | "limit" | "custom",
            "target": "<what it applies to, e.g., 'salary', 'requirements'>",
            "value": "<additional value if applicable, e.g., '5' for max items>",
            "confidence": <0.0-1.0>,
            "evidence": "<brief explanation like 'Observed in 0/3 examples'>"
        }}
    ],
    "format_guidance": "<optional: describe the consistent structure pattern if one exists>",
    "summary": "<2-3 sentence summary of this voice>"
}}

When analyzing for suggested_rules, look for:
- Sections consistently missing (e.g., salary never mentioned → suggest "Never include salary information")
- Format patterns (e.g., requirements always as bullets → suggest "Use bullet points for requirements")
- Section order patterns (e.g., benefits always first → suggest "Lead with benefits section")
- Length limits (e.g., requirements always 5-7 items → suggest "Maximum 7 requirement bullet points")
- Content that's always included (e.g., remote policy always mentioned → suggest "Always include remote work policy")

Focus on patterns that appear consistently across ALL examples. Be specific."""

    def _build_voice_extraction_prompt(self, example_jds: list[str]) -> str:
        """Build prompt for voice extraction."""
        examples_text = "\n\n---\n\n".join(
            f"Example {i+1}:\n{jd}" for i, jd in enumerate(example_jds)
        )
        return self.VOICE_EXTRACTION_PROMPT.format(examples=examples_text)

    async def extract_voice_profile(self, example_jds: list[str]) -> dict:
        """Extract voice profile characteristics from example JDs."""
        prompt = self._build_voice_extraction_prompt(example_jds)

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
