# backend/app/prompts/__init__.py

"""
Prompt templates for Claude API interactions.

This module contains all prompt building functions extracted from claude_service.py
to keep the service layer focused on orchestration and API calls.
"""

from app.prompts.analysis_prompt import build_analysis_prompt
from app.prompts.generation_prompt import build_generation_prompt
from app.prompts.improvement_prompt import build_improvement_prompt
from app.prompts.voice_extraction_prompt import build_voice_extraction_prompt

__all__ = [
    "build_analysis_prompt",
    "build_generation_prompt",
    "build_improvement_prompt",
    "build_voice_extraction_prompt",
]
