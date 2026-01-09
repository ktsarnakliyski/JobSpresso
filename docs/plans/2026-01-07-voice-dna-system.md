# Voice DNA System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign voice profile creation with dual-path flow (examples vs guided) that extracts and displays "Voice DNA" for fine-tuning.

**Architecture:** Backend enhances VoiceProfile model and extraction. Frontend adds creation wizard with path selection, analysis display, and fine-tune editor. Both paths converge to editable profile view before saving.

**Tech Stack:** FastAPI + Pydantic (backend), Next.js 14 + TypeScript + Tailwind (frontend), Claude API for voice extraction

---

## Phase 1: Enhanced Backend Model

### Task 1: Extend VoiceProfile Model

**Files:**
- Modify: `backend/app/models/voice_profile.py`
- Test: `backend/tests/test_voice_profile.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_voice_profile.py - add to existing file

def test_enhanced_voice_profile_fields():
    """Test new VoiceProfile fields for Voice DNA system."""
    profile = VoiceProfile(
        id="test-123",
        name="TechCorp Engineering",
        tone_formality=3,  # 1-5 scale
        tone_description="Professional but approachable",
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.BALANCED,
        structure_preferences=StructurePreferences(
            lead_with_benefits=True,
            section_order=["intro", "responsibilities", "benefits", "requirements"],
            include_salary_prominently=False,
        ),
        words_to_avoid=["ninja", "rockstar"],
        words_to_prefer=["team", "growth"],
        brand_values=["innovation", "collaboration"],
        source_examples=[],
        created_via="guided",
    )

    assert profile.tone_formality == 3
    assert profile.structure_preferences.lead_with_benefits is True
    assert profile.created_via == "guided"


def test_voice_profile_to_prompt_with_new_fields():
    """Test prompt generation includes new fields."""
    profile = VoiceProfile(
        id="test-456",
        name="Startup Voice",
        tone_formality=5,  # most casual
        tone_description="Energetic and direct",
        address_style=AddressStyle.DIRECT_YOU,
        sentence_style=SentenceStyle.SHORT_PUNCHY,
        structure_preferences=StructurePreferences(
            lead_with_benefits=True,
            section_order=["intro", "benefits", "responsibilities", "requirements"],
            include_salary_prominently=True,
        ),
        words_to_avoid=["synergy"],
        words_to_prefer=["impact", "ship"],
        brand_values=["speed", "ownership"],
        source_examples=[],
        created_via="examples",
    )

    prompt = profile.to_prompt_context()

    assert "Energetic and direct" in prompt
    assert "lead with benefits" in prompt.lower()
    assert "speed" in prompt.lower() or "ownership" in prompt.lower()
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_voice_profile.py::test_enhanced_voice_profile_fields -v`
Expected: FAIL with "unexpected keyword argument 'tone_formality'"

**Step 3: Write minimal implementation**

```python
# backend/app/models/voice_profile.py - replace entire file

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ToneStyle(str, Enum):
    FORMAL = "formal"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    CASUAL = "casual"
    STARTUP_CASUAL = "startup_casual"


class AddressStyle(str, Enum):
    DIRECT_YOU = "direct_you"
    THIRD_PERSON = "third_person"
    WE_LOOKING = "we_looking"


class SentenceStyle(str, Enum):
    SHORT_PUNCHY = "short_punchy"
    BALANCED = "balanced"
    DETAILED = "detailed"


class StructurePreferences(BaseModel):
    """Preferences for JD structure and section ordering."""
    lead_with_benefits: bool = False
    section_order: list[str] = ["intro", "responsibilities", "requirements", "benefits"]
    include_salary_prominently: bool = False


class VoiceProfile(BaseModel):
    """Enhanced voice profile with Voice DNA attributes."""
    id: str
    name: str

    # Tone (enhanced from single enum to spectrum + description)
    tone_formality: int = 3  # 1=very formal, 5=very casual
    tone_description: str = "Professional"  # AI-extracted or user-written

    # Legacy fields (kept for compatibility)
    tone: ToneStyle = ToneStyle.PROFESSIONAL
    address_style: AddressStyle = AddressStyle.DIRECT_YOU
    sentence_style: SentenceStyle = SentenceStyle.BALANCED

    # Structure (new)
    structure_preferences: StructurePreferences = StructurePreferences()
    structure_preference: str = "mixed"  # Legacy field

    # Vocabulary
    words_to_avoid: list[str] = []
    words_to_prefer: list[str] = []

    # Brand personality (new)
    brand_values: list[str] = []  # e.g., ["innovation", "collaboration"]

    # Source tracking (new)
    source_examples: list[str] = []  # JDs used to create this profile
    created_via: str = "manual"  # "examples" | "guided" | "manual"

    # Metadata
    example_jd: Optional[str] = None  # Legacy single example
    is_default: bool = False

    def to_prompt_context(self) -> str:
        """Generate prompt context for AI from this profile."""
        formality_descriptions = {
            1: "Very formal and corporate",
            2: "Professional and polished",
            3: "Professional but approachable",
            4: "Friendly and conversational",
            5: "Casual and energetic",
        }

        address_descriptions = {
            AddressStyle.DIRECT_YOU: 'Address candidates directly using "you" and "your".',
            AddressStyle.THIRD_PERSON: 'Use third person like "the candidate" or "the ideal person".',
            AddressStyle.WE_LOOKING: 'Frame from company perspective: "We\'re looking for someone who..."',
        }

        sentence_descriptions = {
            SentenceStyle.SHORT_PUNCHY: "Use short, punchy sentences. Maximum 2-3 sentences per paragraph.",
            SentenceStyle.BALANCED: "Use balanced sentence length. Mix of short and medium sentences.",
            SentenceStyle.DETAILED: "Use detailed, thorough sentences. Complete explanations.",
        }

        parts = [
            f"VOICE PROFILE: {self.name}",
            f"Tone: {self.tone_description} ({formality_descriptions.get(self.tone_formality, 'Professional')})",
            f"Address Style: {address_descriptions[self.address_style]}",
            f"Sentence Style: {sentence_descriptions[self.sentence_style]}",
        ]

        # Structure preferences
        if self.structure_preferences.lead_with_benefits:
            parts.append("Structure: Lead with benefits and impact before listing requirements.")

        if self.structure_preferences.section_order:
            parts.append(f"Section Order: {' → '.join(self.structure_preferences.section_order)}")

        if self.structure_preferences.include_salary_prominently:
            parts.append("Include salary/compensation information prominently near the top.")

        # Vocabulary
        if self.words_to_avoid:
            parts.append(f"Words to AVOID: {', '.join(self.words_to_avoid)}")

        if self.words_to_prefer:
            parts.append(f"Words to PREFER: {', '.join(self.words_to_prefer)}")

        # Brand values
        if self.brand_values:
            parts.append(f"Brand Values to Reflect: {', '.join(self.brand_values)}")

        # Legacy example
        if self.example_jd:
            parts.append(f"Example JD for reference style:\n{self.example_jd[:1000]}")

        return "\n".join(parts)


class VoiceProfileCreate(BaseModel):
    """Input model for creating a voice profile."""
    name: str
    tone_formality: int = 3
    tone_description: str = "Professional"
    tone: ToneStyle = ToneStyle.PROFESSIONAL
    address_style: AddressStyle = AddressStyle.DIRECT_YOU
    sentence_style: SentenceStyle = SentenceStyle.BALANCED
    structure_preferences: StructurePreferences = StructurePreferences()
    structure_preference: str = "mixed"
    words_to_avoid: list[str] = []
    words_to_prefer: list[str] = []
    brand_values: list[str] = []
    source_examples: list[str] = []
    created_via: str = "manual"
    example_jd: Optional[str] = None
    is_default: bool = False


class ExtractVoiceRequest(BaseModel):
    """Input for extracting voice profile from example JDs."""
    example_jds: list[str]
    suggested_name: Optional[str] = None
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_voice_profile.py -v`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/app/models/voice_profile.py backend/tests/test_voice_profile.py
git commit -m "feat(voice): enhance VoiceProfile model with Voice DNA fields"
```

---

### Task 2: Enhance Voice Extraction Claude Prompt

**Files:**
- Modify: `backend/app/services/claude_service.py`
- Test: `backend/tests/test_claude_service.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_claude_service.py - add to existing tests

def test_extract_voice_prompt_requests_enhanced_fields():
    """Test that voice extraction prompt asks for new Voice DNA fields."""
    service = ClaudeService(api_key="test-key")

    prompt = service._build_voice_extraction_prompt(["Example JD text here"])

    # Should request new fields
    assert "tone_formality" in prompt or "formality" in prompt.lower()
    assert "brand" in prompt.lower() or "values" in prompt.lower()
    assert "structure" in prompt.lower()
    assert "section" in prompt.lower() or "order" in prompt.lower()
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_claude_service.py::test_extract_voice_prompt_requests_enhanced_fields -v`
Expected: FAIL (method doesn't exist or prompt doesn't contain expected strings)

**Step 3: Write minimal implementation**

```python
# backend/app/services/claude_service.py - add method to ClaudeService class

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
    "summary": "<2-3 sentence summary of this voice>"
}}

Focus on patterns that appear consistently across the examples. Be specific."""

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
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

        # Fallback defaults
        return {
            "tone": "professional",
            "tone_formality": 3,
            "tone_description": "Professional",
            "address_style": "direct_you",
            "sentence_style": "balanced",
            "structure_analysis": {
                "leads_with_benefits": False,
                "typical_section_order": ["intro", "responsibilities", "requirements", "benefits"],
                "includes_salary": False,
            },
            "vocabulary": {"commonly_used": [], "notably_avoided": []},
            "brand_signals": {"values": [], "personality": ""},
            "summary": "Could not extract voice profile.",
        }
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_claude_service.py -v`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/app/services/claude_service.py backend/tests/test_claude_service.py
git commit -m "feat(voice): enhance voice extraction prompt for Voice DNA"
```

---

### Task 3: Update Voice Extraction Endpoint

**Files:**
- Modify: `backend/app/routers/voice.py`
- Test: `backend/tests/test_voice_endpoint.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_voice_endpoint.py - add test

@pytest.mark.asyncio
async def test_extract_voice_returns_enhanced_fields(client, mock_claude_service):
    """Test that extraction returns new Voice DNA fields."""
    mock_claude_service.extract_voice_profile.return_value = {
        "tone": "friendly",
        "tone_formality": 4,
        "tone_description": "Friendly and warm",
        "address_style": "direct_you",
        "sentence_style": "balanced",
        "structure_analysis": {
            "leads_with_benefits": True,
            "typical_section_order": ["intro", "benefits", "responsibilities", "requirements"],
            "includes_salary": False,
        },
        "vocabulary": {
            "commonly_used": ["team", "growth"],
            "notably_avoided": ["ninja"],
        },
        "brand_signals": {
            "values": ["innovation"],
            "personality": "Modern tech company",
        },
        "summary": "Friendly, benefit-focused voice.",
    }

    response = client.post(
        "/api/voice/extract",
        json={"example_jds": ["Sample JD text"]},
    )

    assert response.status_code == 200
    data = response.json()

    # New fields
    assert data["tone_formality"] == 4
    assert data["tone_description"] == "Friendly and warm"
    assert data["structure_analysis"]["leads_with_benefits"] is True
    assert "innovation" in data["brand_signals"]["values"]
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_voice_endpoint.py::test_extract_voice_returns_enhanced_fields -v`
Expected: FAIL (response doesn't have new fields)

**Step 3: Write minimal implementation**

```python
# backend/app/routers/voice.py - replace file

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.config import get_settings
from app.services.claude_service import ClaudeService


router = APIRouter(prefix="/api/voice", tags=["voice"])


def get_claude_service() -> ClaudeService:
    settings = get_settings()
    return ClaudeService(api_key=settings.anthropic_api_key)


class ExtractVoiceRequest(BaseModel):
    example_jds: list[str]
    suggested_name: Optional[str] = None


class StructureAnalysis(BaseModel):
    leads_with_benefits: bool = False
    typical_section_order: list[str] = []
    includes_salary: bool = False


class VocabularyAnalysis(BaseModel):
    commonly_used: list[str] = []
    notably_avoided: list[str] = []


class BrandSignals(BaseModel):
    values: list[str] = []
    personality: str = ""


class ExtractVoiceResponse(BaseModel):
    """Enhanced voice extraction response with Voice DNA fields."""
    # Core tone
    tone: str
    tone_formality: int
    tone_description: str

    # Style
    address_style: str
    sentence_style: str

    # Structure analysis (new)
    structure_analysis: StructureAnalysis

    # Vocabulary (enhanced)
    vocabulary: VocabularyAnalysis

    # Brand (new)
    brand_signals: BrandSignals

    # Summary
    summary: str

    # Legacy fields for compatibility
    words_commonly_used: list[str] = []
    words_avoided: list[str] = []
    structure_preference: str = "mixed"


@router.post("/extract", response_model=ExtractVoiceResponse)
async def extract_voice_profile(
    body: ExtractVoiceRequest,
    service: ClaudeService = Depends(get_claude_service),
):
    """Extract voice profile characteristics from example JDs."""
    if not body.example_jds or len(body.example_jds) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one example JD is required"
        )

    try:
        result = await service.extract_voice_profile(body.example_jds)

        # Parse structure analysis
        struct = result.get("structure_analysis", {})
        structure_analysis = StructureAnalysis(
            leads_with_benefits=struct.get("leads_with_benefits", False),
            typical_section_order=struct.get("typical_section_order", []),
            includes_salary=struct.get("includes_salary", False),
        )

        # Parse vocabulary
        vocab = result.get("vocabulary", {})
        vocabulary = VocabularyAnalysis(
            commonly_used=vocab.get("commonly_used", []),
            notably_avoided=vocab.get("notably_avoided", []),
        )

        # Parse brand signals
        brand = result.get("brand_signals", {})
        brand_signals = BrandSignals(
            values=brand.get("values", []),
            personality=brand.get("personality", ""),
        )

        return ExtractVoiceResponse(
            tone=result.get("tone", "professional"),
            tone_formality=result.get("tone_formality", 3),
            tone_description=result.get("tone_description", "Professional"),
            address_style=result.get("address_style", "direct_you"),
            sentence_style=result.get("sentence_style", "balanced"),
            structure_analysis=structure_analysis,
            vocabulary=vocabulary,
            brand_signals=brand_signals,
            summary=result.get("summary", ""),
            # Legacy fields
            words_commonly_used=vocabulary.commonly_used,
            words_avoided=vocabulary.notably_avoided,
            structure_preference="mixed",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_voice_endpoint.py -v`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/app/routers/voice.py backend/tests/test_voice_endpoint.py
git commit -m "feat(voice): update extraction endpoint with Voice DNA response"
```

---

## Phase 2: Frontend Types and State

### Task 4: Update Frontend Types

**Files:**
- Modify: `frontend/src/types/voice-profile.ts`

**Step 1: Review current types**

Run: `cat frontend/src/types/voice-profile.ts`

**Step 2: Update types to match enhanced backend**

```typescript
// frontend/src/types/voice-profile.ts - replace file

export type ToneStyle = 'formal' | 'professional' | 'friendly' | 'casual' | 'startup_casual';
export type AddressStyle = 'direct_you' | 'third_person' | 'we_looking';
export type SentenceStyle = 'short_punchy' | 'balanced' | 'detailed';
export type CreationMethod = 'examples' | 'guided' | 'manual';

export interface StructurePreferences {
  leadWithBenefits: boolean;
  sectionOrder: string[];
  includeSalaryProminently: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;

  // Tone (enhanced)
  toneFormality: number; // 1-5
  toneDescription: string;
  tone: ToneStyle; // legacy

  // Style
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;

  // Structure (new)
  structurePreferences: StructurePreferences;
  structurePreference: string; // legacy

  // Vocabulary
  wordsToAvoid: string[];
  wordsToPrefer: string[];

  // Brand (new)
  brandValues: string[];

  // Source tracking (new)
  sourceExamples: string[];
  createdVia: CreationMethod;

  // Metadata
  isDefault: boolean;
  createdAt?: string;
}

export interface VoiceProfileFormData {
  name: string;
  toneFormality: number;
  toneDescription: string;
  tone: ToneStyle;
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  structurePreferences: StructurePreferences;
  wordsToAvoid: string;
  wordsToPrefer: string;
  brandValues: string;
  structurePreference: string;
}

// Voice extraction response (from API)
export interface VoiceExtractionResult {
  tone: ToneStyle;
  toneFormality: number;
  toneDescription: string;
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  structureAnalysis: {
    leadsWithBenefits: boolean;
    typicalSectionOrder: string[];
    includesSalary: boolean;
  };
  vocabulary: {
    commonlyUsed: string[];
    notablyAvoided: string[];
  };
  brandSignals: {
    values: string[];
    personality: string;
  };
  summary: string;
}

// UI Options
export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal & Traditional' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Warm' },
  { value: 'casual', label: 'Casual' },
  { value: 'startup_casual', label: 'Startup Casual' },
] as const;

export const ADDRESS_OPTIONS = [
  { value: 'direct_you', label: 'Direct (You/Your)' },
  { value: 'third_person', label: 'Third Person (The candidate)' },
  { value: 'we_looking', label: 'Company Voice (We\'re looking for)' },
] as const;

export const SENTENCE_OPTIONS = [
  { value: 'short_punchy', label: 'Short & Punchy' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed & Thorough' },
] as const;

export const STRUCTURE_OPTIONS = [
  { value: 'bullet_heavy', label: 'Bullet-Heavy' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'paragraph_focused', label: 'Paragraph-Focused' },
] as const;

export const FORMALITY_LABELS: Record<number, string> = {
  1: 'Very Formal',
  2: 'Professional',
  3: 'Balanced',
  4: 'Friendly',
  5: 'Casual',
};
```

**Step 3: Run build to verify types**

Run: `cd frontend && npm run build`
Expected: Build may fail due to type mismatches (will fix in next tasks)

**Step 4: Commit**

```bash
git add frontend/src/types/voice-profile.ts
git commit -m "feat(voice): update frontend types for Voice DNA"
```

---

### Task 5: Create Voice Extraction Hook

**Files:**
- Create: `frontend/src/hooks/useVoiceExtraction.ts`

**Step 1: Write the hook**

```typescript
// frontend/src/hooks/useVoiceExtraction.ts

import { useState, useCallback } from 'react';
import { VoiceExtractionResult } from '@/types/voice-profile';

interface UseVoiceExtractionReturn {
  isExtracting: boolean;
  error: string | null;
  result: VoiceExtractionResult | null;
  extractFromExamples: (examples: string[]) => Promise<VoiceExtractionResult | null>;
  reset: () => void;
}

export function useVoiceExtraction(): UseVoiceExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceExtractionResult | null>(null);

  const extractFromExamples = useCallback(async (examples: string[]): Promise<VoiceExtractionResult | null> => {
    if (examples.length === 0) {
      setError('Please provide at least one example JD');
      return null;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch('/api/voice/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ example_jds: examples }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to extract voice profile');
      }

      const data = await response.json();

      // Transform snake_case to camelCase
      const transformed: VoiceExtractionResult = {
        tone: data.tone,
        toneFormality: data.tone_formality,
        toneDescription: data.tone_description,
        addressStyle: data.address_style,
        sentenceStyle: data.sentence_style,
        structureAnalysis: {
          leadsWithBenefits: data.structure_analysis?.leads_with_benefits ?? false,
          typicalSectionOrder: data.structure_analysis?.typical_section_order ?? [],
          includesSalary: data.structure_analysis?.includes_salary ?? false,
        },
        vocabulary: {
          commonlyUsed: data.vocabulary?.commonly_used ?? [],
          notablyAvoided: data.vocabulary?.notably_avoided ?? [],
        },
        brandSignals: {
          values: data.brand_signals?.values ?? [],
          personality: data.brand_signals?.personality ?? '',
        },
        summary: data.summary,
      };

      setResult(transformed);
      return transformed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isExtracting,
    error,
    result,
    extractFromExamples,
    reset,
  };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useVoiceExtraction.ts
git commit -m "feat(voice): add useVoiceExtraction hook"
```

---

## Phase 3: Frontend Components

### Task 6: Create Path Selection Component

**Files:**
- Create: `frontend/src/components/voice/PathSelection.tsx`

**Step 1: Write the component**

```typescript
// frontend/src/components/voice/PathSelection.tsx

'use client';

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export type CreationPath = 'examples' | 'guided';

interface PathSelectionProps {
  onSelect: (path: CreationPath) => void;
}

export function PathSelection({ onSelect }: PathSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-espresso-900">
          Create Voice Profile
        </h2>
        <p className="text-espresso-600 mt-2">
          Let&apos;s capture your unique writing style
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('examples')}
          className={cn(
            'p-6 rounded-2xl border-2 border-espresso-200 bg-white',
            'hover:border-espresso-400 hover:shadow-soft-lg',
            'transition-all duration-200 text-left group'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-espresso-100 flex items-center justify-center mb-4 group-hover:bg-espresso-200 transition-colors">
            <svg className="w-6 h-6 text-espresso-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-espresso-900 mb-2">
            From Examples
          </h3>
          <p className="text-espresso-600 text-sm">
            Upload 2-3 JDs you&apos;ve written before. We&apos;ll analyze your style automatically.
          </p>
          <p className="text-espresso-400 text-xs mt-3">
            Fastest if you have examples handy
          </p>
        </button>

        <button
          onClick={() => onSelect('guided')}
          className={cn(
            'p-6 rounded-2xl border-2 border-espresso-200 bg-white',
            'hover:border-espresso-400 hover:shadow-soft-lg',
            'transition-all duration-200 text-left group'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-espresso-100 flex items-center justify-center mb-4 group-hover:bg-espresso-200 transition-colors">
            <svg className="w-6 h-6 text-espresso-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-espresso-900 mb-2">
            Guide Me Through It
          </h3>
          <p className="text-espresso-600 text-sm">
            Answer a few questions about your writing style and preferences.
          </p>
          <p className="text-espresso-400 text-xs mt-3">
            Takes about 3 minutes
          </p>
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/voice/PathSelection.tsx
git commit -m "feat(voice): add PathSelection component"
```

---

### Task 7: Create Example Upload Component

**Files:**
- Create: `frontend/src/components/voice/ExampleUpload.tsx`

**Step 1: Write the component**

```typescript
// frontend/src/components/voice/ExampleUpload.tsx

'use client';

import { useState, useCallback } from 'react';
import { Button, TextArea } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ExampleUploadProps {
  onSubmit: (examples: string[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ExampleUpload({ onSubmit, onBack, isLoading }: ExampleUploadProps) {
  const [examples, setExamples] = useState<string[]>(['', '', '']);

  const handleExampleChange = useCallback((index: number, value: string) => {
    setExamples(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const validExamples = examples.filter(ex => ex.trim().length > 50);
    if (validExamples.length > 0) {
      onSubmit(validExamples);
    }
  }, [examples, onSubmit]);

  const filledCount = examples.filter(ex => ex.trim().length > 50).length;
  const canSubmit = filledCount >= 1 && !isLoading;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="text-espresso-600 hover:text-espresso-800 text-sm flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-xl font-semibold text-espresso-900">
          Paste Your Example JDs
        </h2>
        <p className="text-espresso-600 mt-2">
          Add 1-3 job descriptions you&apos;ve written. More examples = better accuracy.
        </p>
      </div>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-espresso-700">
                Example {index + 1} {index === 0 && <span className="text-red-500">*</span>}
              </label>
              {example.trim().length > 0 && (
                <span className={cn(
                  'text-xs',
                  example.trim().length > 50 ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {example.trim().length > 50 ? '✓ Good length' : 'Add more text'}
                </span>
              )}
            </div>
            <TextArea
              value={example}
              onChange={(e) => handleExampleChange(index, e.target.value)}
              placeholder={`Paste job description ${index + 1} here...`}
              rows={6}
              className={cn(
                example.trim().length > 50 && 'border-emerald-300 focus:border-emerald-500'
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-espresso-500">
          {filledCount} of 3 examples provided
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze My Style'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/voice/ExampleUpload.tsx
git commit -m "feat(voice): add ExampleUpload component"
```

---

### Task 8: Create Voice DNA Preview Component

**Files:**
- Create: `frontend/src/components/voice/VoiceDNAPreview.tsx`

**Step 1: Write the component**

```typescript
// frontend/src/components/voice/VoiceDNAPreview.tsx

'use client';

import { Card, Button, Badge } from '@/components/ui';
import { VoiceExtractionResult, FORMALITY_LABELS } from '@/types/voice-profile';
import { cn } from '@/lib/utils';

interface VoiceDNAPreviewProps {
  result: VoiceExtractionResult;
  onAccept: () => void;
  onAdjust: () => void;
  onBack: () => void;
}

export function VoiceDNAPreview({ result, onAccept, onAdjust, onBack }: VoiceDNAPreviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="text-espresso-600 hover:text-espresso-800 text-sm flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-xl font-semibold text-espresso-900">
          Here&apos;s What I Learned
        </h2>
        <p className="text-espresso-600 mt-2">
          Based on your examples, this is your writing voice:
        </p>
      </div>

      <Card className="space-y-5">
        {/* Summary */}
        <div className="p-4 bg-espresso-50 rounded-xl">
          <p className="text-espresso-800 italic">&quot;{result.summary}&quot;</p>
        </div>

        {/* Tone */}
        <div>
          <h4 className="text-sm font-medium text-espresso-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</span>
            Tone
          </h4>
          <p className="text-espresso-900 font-medium">{result.toneDescription}</p>
          <p className="text-sm text-espresso-500 mt-1">
            Formality: {FORMALITY_LABELS[result.toneFormality] || 'Balanced'}
          </p>
        </div>

        {/* Structure */}
        <div>
          <h4 className="text-sm font-medium text-espresso-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</span>
            Structure
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.structureAnalysis.leadsWithBenefits && (
              <Badge variant="default">Benefits-first</Badge>
            )}
            {result.structureAnalysis.includesSalary && (
              <Badge variant="default">Includes salary</Badge>
            )}
            {result.structureAnalysis.typicalSectionOrder.length > 0 && (
              <Badge variant="default">
                {result.structureAnalysis.typicalSectionOrder.length} sections
              </Badge>
            )}
          </div>
          {result.structureAnalysis.typicalSectionOrder.length > 0 && (
            <p className="text-sm text-espresso-500 mt-2">
              Order: {result.structureAnalysis.typicalSectionOrder.join(' → ')}
            </p>
          )}
        </div>

        {/* Vocabulary */}
        <div>
          <h4 className="text-sm font-medium text-espresso-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</span>
            Vocabulary
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {result.vocabulary.commonlyUsed.length > 0 && (
              <div>
                <p className="text-xs text-espresso-500 mb-1">Often uses:</p>
                <div className="flex flex-wrap gap-1">
                  {result.vocabulary.commonlyUsed.slice(0, 6).map((word) => (
                    <Badge key={word} variant="success" className="text-xs">{word}</Badge>
                  ))}
                </div>
              </div>
            )}
            {result.vocabulary.notablyAvoided.length > 0 && (
              <div>
                <p className="text-xs text-espresso-500 mb-1">Avoids:</p>
                <div className="flex flex-wrap gap-1">
                  {result.vocabulary.notablyAvoided.slice(0, 6).map((word) => (
                    <Badge key={word} variant="warning" className="text-xs">{word}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand Values */}
        {result.brandSignals.values.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-espresso-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">✓</span>
              Brand Values
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.brandSignals.values.map((value) => (
                <Badge key={value} variant="info">{value}</Badge>
              ))}
            </div>
            {result.brandSignals.personality && (
              <p className="text-sm text-espresso-500 mt-2">
                Personality: {result.brandSignals.personality}
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-espresso-500">
          Does this look right?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onAdjust}>
            Let Me Adjust
          </Button>
          <Button onClick={onAccept}>
            Yes, Save This
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/voice/VoiceDNAPreview.tsx
git commit -m "feat(voice): add VoiceDNAPreview component"
```

---

### Task 9: Create Guided Questionnaire Component

**Files:**
- Create: `frontend/src/components/voice/GuidedQuestionnaire.tsx`

**Step 1: Write the component**

```typescript
// frontend/src/components/voice/GuidedQuestionnaire.tsx

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { VoiceExtractionResult, ToneStyle, AddressStyle, SentenceStyle } from '@/types/voice-profile';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'personality',
    question: 'How would you describe your company\'s personality?',
    options: [
      { value: 'corporate', label: 'Corporate & Established', description: 'We maintain high standards' },
      { value: 'professional', label: 'Professional but Warm', description: 'Serious about work, but real people too' },
      { value: 'friendly', label: 'Friendly & Approachable', description: 'We\'re a welcoming team' },
      { value: 'casual', label: 'Casual & Energetic', description: 'We move fast and keep it real' },
      { value: 'mission', label: 'Mission-Driven', description: 'We\'re here to make a difference' },
    ],
  },
  {
    id: 'address',
    question: 'How do you typically address candidates?',
    options: [
      { value: 'direct_you', label: 'Direct: "You will..."', description: 'Personal and engaging' },
      { value: 'third_person', label: 'Formal: "The ideal candidate..."', description: 'Traditional and professional' },
      { value: 'we_looking', label: 'Team voice: "We\'re looking for..."', description: 'Collaborative feel' },
    ],
  },
  {
    id: 'detail',
    question: 'What matters more in your JDs?',
    options: [
      { value: 'vision', label: 'Inspiring Vision', description: 'Paint the big picture, inspire action' },
      { value: 'balanced', label: 'Balanced Mix', description: 'Vision + clear requirements' },
      { value: 'detailed', label: 'Detailed Requirements', description: 'Be thorough and specific' },
    ],
  },
  {
    id: 'structure',
    question: 'What should candidates see first?',
    options: [
      { value: 'benefits', label: 'Benefits & Impact', description: 'Lead with what they get' },
      { value: 'role', label: 'Role & Responsibilities', description: 'Lead with what they do' },
      { value: 'company', label: 'Company & Mission', description: 'Lead with who you are' },
    ],
  },
  {
    id: 'values',
    question: 'Which values best represent your company?',
    options: [
      { value: 'innovation', label: 'Innovation & Growth', description: 'Always learning, always improving' },
      { value: 'collaboration', label: 'Collaboration & Team', description: 'Better together' },
      { value: 'excellence', label: 'Excellence & Quality', description: 'High standards, great results' },
      { value: 'impact', label: 'Impact & Purpose', description: 'Making a real difference' },
    ],
  },
];

interface GuidedQuestionnaireProps {
  onComplete: (result: VoiceExtractionResult) => void;
  onBack: () => void;
}

export function GuidedQuestionnaire({ onComplete, onBack }: GuidedQuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleSelect = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));

    if (isLast) {
      // Build result from answers
      const result = buildResultFromAnswers({ ...answers, [currentQuestion.id]: value });
      onComplete(result);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentQuestion, isLast, answers, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      onBack();
    } else {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, onBack]);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={handleBack}
          className="text-espresso-600 hover:text-espresso-800 text-sm flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {currentIndex === 0 ? 'Back' : 'Previous'}
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-espresso-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-espresso-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-espresso-500 mb-2">
          Question {currentIndex + 1} of {QUESTIONS.length}
        </p>
        <h2 className="text-xl font-semibold text-espresso-900">
          {currentQuestion.question}
        </h2>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
              answers[currentQuestion.id] === option.value
                ? 'border-espresso-500 bg-espresso-50'
                : 'border-espresso-200 hover:border-espresso-300 hover:bg-espresso-50/50'
            )}
          >
            <p className="font-medium text-espresso-900">{option.label}</p>
            {option.description && (
              <p className="text-sm text-espresso-500 mt-1">{option.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildResultFromAnswers(answers: Record<string, string>): VoiceExtractionResult {
  // Map personality to tone
  const toneMap: Record<string, { tone: ToneStyle; formality: number; description: string }> = {
    corporate: { tone: 'formal', formality: 1, description: 'Corporate and professional' },
    professional: { tone: 'professional', formality: 2, description: 'Professional but approachable' },
    friendly: { tone: 'friendly', formality: 4, description: 'Friendly and warm' },
    casual: { tone: 'casual', formality: 5, description: 'Casual and energetic' },
    mission: { tone: 'professional', formality: 3, description: 'Purpose-driven and inspiring' },
  };

  // Map detail preference to sentence style
  const sentenceMap: Record<string, SentenceStyle> = {
    vision: 'short_punchy',
    balanced: 'balanced',
    detailed: 'detailed',
  };

  // Map structure preference
  const structureMap: Record<string, string[]> = {
    benefits: ['intro', 'benefits', 'responsibilities', 'requirements'],
    role: ['intro', 'responsibilities', 'requirements', 'benefits'],
    company: ['company', 'intro', 'responsibilities', 'requirements', 'benefits'],
  };

  // Map values
  const valuesMap: Record<string, string[]> = {
    innovation: ['innovation', 'growth', 'learning'],
    collaboration: ['collaboration', 'teamwork', 'together'],
    excellence: ['excellence', 'quality', 'standards'],
    impact: ['impact', 'purpose', 'difference'],
  };

  const toneInfo = toneMap[answers.personality] || toneMap.professional;
  const addressStyle = (answers.address as AddressStyle) || 'direct_you';
  const sentenceStyle = sentenceMap[answers.detail] || 'balanced';
  const sectionOrder = structureMap[answers.structure] || structureMap.balanced;
  const brandValues = valuesMap[answers.values] || [];

  return {
    tone: toneInfo.tone,
    toneFormality: toneInfo.formality,
    toneDescription: toneInfo.description,
    addressStyle,
    sentenceStyle,
    structureAnalysis: {
      leadsWithBenefits: answers.structure === 'benefits',
      typicalSectionOrder: sectionOrder,
      includesSalary: false,
    },
    vocabulary: {
      commonlyUsed: brandValues,
      notablyAvoided: [],
    },
    brandSignals: {
      values: brandValues,
      personality: toneInfo.description,
    },
    summary: `${toneInfo.description} voice that ${answers.structure === 'benefits' ? 'leads with benefits' : 'focuses on the role'}.`,
  };
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/voice/GuidedQuestionnaire.tsx
git commit -m "feat(voice): add GuidedQuestionnaire component"
```

---

### Task 10: Create Voice Profile Editor Component

**Files:**
- Create: `frontend/src/components/voice/VoiceProfileEditor.tsx`

**Step 1: Write the component**

```typescript
// frontend/src/components/voice/VoiceProfileEditor.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea, Select } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  VoiceProfile,
  VoiceExtractionResult,
  TONE_OPTIONS,
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  FORMALITY_LABELS,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
  CreationMethod,
} from '@/types/voice-profile';

interface VoiceProfileEditorProps {
  initialData?: VoiceExtractionResult;
  createdVia: CreationMethod;
  sourceExamples?: string[];
  onSave: (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

export function VoiceProfileEditor({
  initialData,
  createdVia,
  sourceExamples = [],
  onSave,
  onBack,
}: VoiceProfileEditorProps) {
  const [name, setName] = useState('');
  const [toneFormality, setToneFormality] = useState(initialData?.toneFormality ?? 3);
  const [toneDescription, setToneDescription] = useState(initialData?.toneDescription ?? 'Professional');
  const [tone, setTone] = useState<ToneStyle>(initialData?.tone ?? 'professional');
  const [addressStyle, setAddressStyle] = useState<AddressStyle>(initialData?.addressStyle ?? 'direct_you');
  const [sentenceStyle, setSentenceStyle] = useState<SentenceStyle>(initialData?.sentenceStyle ?? 'balanced');
  const [leadWithBenefits, setLeadWithBenefits] = useState(initialData?.structureAnalysis.leadsWithBenefits ?? false);
  const [includeSalary, setIncludeSalary] = useState(initialData?.structureAnalysis.includesSalary ?? false);
  const [wordsToPrefer, setWordsToPrefer] = useState(initialData?.vocabulary.commonlyUsed.join(', ') ?? '');
  const [wordsToAvoid, setWordsToAvoid] = useState(initialData?.vocabulary.notablyAvoided.join(', ') ?? '');
  const [brandValues, setBrandValues] = useState(initialData?.brandSignals.values.join(', ') ?? '');

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    const profile: Omit<VoiceProfile, 'id' | 'createdAt'> = {
      name: name.trim(),
      toneFormality,
      toneDescription,
      tone,
      addressStyle,
      sentenceStyle,
      structurePreferences: {
        leadWithBenefits,
        sectionOrder: leadWithBenefits
          ? ['intro', 'benefits', 'responsibilities', 'requirements']
          : ['intro', 'responsibilities', 'requirements', 'benefits'],
        includeSalaryProminently: includeSalary,
      },
      structurePreference: 'mixed',
      wordsToAvoid: wordsToAvoid.split(',').map(w => w.trim()).filter(Boolean),
      wordsToPrefer: wordsToPrefer.split(',').map(w => w.trim()).filter(Boolean),
      brandValues: brandValues.split(',').map(w => w.trim()).filter(Boolean),
      sourceExamples,
      createdVia,
      isDefault: false,
    };

    onSave(profile);
  }, [
    name, toneFormality, toneDescription, tone, addressStyle, sentenceStyle,
    leadWithBenefits, includeSalary, wordsToPrefer, wordsToAvoid, brandValues,
    sourceExamples, createdVia, onSave,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="text-espresso-600 hover:text-espresso-800 text-sm flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-xl font-semibold text-espresso-900">
          Fine-Tune Your Voice Profile
        </h2>
        <p className="text-espresso-600 mt-2">
          Adjust any settings to match your exact preferences.
        </p>
      </div>

      <Card className="space-y-6">
        {/* Profile Name */}
        <div>
          <label className="block text-sm font-medium text-espresso-700 mb-2">
            Profile Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., TechCorp Engineering, Startup Voice"
            className={cn(
              'w-full rounded-xl border border-espresso-200 px-4 py-2.5',
              'bg-white text-espresso-900',
              'focus:border-espresso-500 focus:ring-2 focus:ring-espresso-500/15 focus:outline-none'
            )}
          />
        </div>

        {/* Tone Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">Tone</h3>

          <div>
            <label className="block text-sm font-medium text-espresso-700 mb-3">
              Formality: {FORMALITY_LABELS[toneFormality]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={toneFormality}
              onChange={(e) => setToneFormality(Number(e.target.value))}
              className="w-full accent-espresso-600"
            />
            <div className="flex justify-between text-xs text-espresso-400 mt-1">
              <span>Formal</span>
              <span>Casual</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso-700 mb-2">
              Tone Description
            </label>
            <input
              type="text"
              value={toneDescription}
              onChange={(e) => setToneDescription(e.target.value)}
              placeholder="e.g., Professional but warm"
              className={cn(
                'w-full rounded-xl border border-espresso-200 px-4 py-2.5',
                'bg-white text-espresso-900',
                'focus:border-espresso-500 focus:ring-2 focus:ring-espresso-500/15 focus:outline-none'
              )}
            />
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">Style</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Address Style"
              options={ADDRESS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              value={addressStyle}
              onChange={(e) => setAddressStyle(e.target.value as AddressStyle)}
            />
            <Select
              label="Sentence Style"
              options={SENTENCE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              value={sentenceStyle}
              onChange={(e) => setSentenceStyle(e.target.value as SentenceStyle)}
            />
          </div>
        </div>

        {/* Structure Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">Structure</h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={leadWithBenefits}
                onChange={(e) => setLeadWithBenefits(e.target.checked)}
                className="w-4 h-4 rounded border-espresso-300 text-espresso-600 focus:ring-espresso-500"
              />
              <span className="text-espresso-700">Lead with benefits and impact</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSalary}
                onChange={(e) => setIncludeSalary(e.target.checked)}
                className="w-4 h-4 rounded border-espresso-300 text-espresso-600 focus:ring-espresso-500"
              />
              <span className="text-espresso-700">Include salary prominently</span>
            </label>
          </div>
        </div>

        {/* Vocabulary Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">Vocabulary</h3>

          <TextArea
            label="Words to Prefer"
            value={wordsToPrefer}
            onChange={(e) => setWordsToPrefer(e.target.value)}
            placeholder="team, growth, impact, collaborate (comma-separated)"
            rows={2}
          />
          <TextArea
            label="Words to Avoid"
            value={wordsToAvoid}
            onChange={(e) => setWordsToAvoid(e.target.value)}
            placeholder="ninja, rockstar, guru, synergy (comma-separated)"
            rows={2}
          />
        </div>

        {/* Brand Values */}
        <div>
          <TextArea
            label="Brand Values"
            value={brandValues}
            onChange={(e) => setBrandValues(e.target.value)}
            placeholder="innovation, collaboration, excellence (comma-separated)"
            rows={2}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          Save Profile
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/voice/VoiceProfileEditor.tsx
git commit -m "feat(voice): add VoiceProfileEditor component"
```

---

### Task 11: Create Component Index

**Files:**
- Create: `frontend/src/components/voice/index.ts`

**Step 1: Write the index**

```typescript
// frontend/src/components/voice/index.ts

export { PathSelection, type CreationPath } from './PathSelection';
export { ExampleUpload } from './ExampleUpload';
export { VoiceDNAPreview } from './VoiceDNAPreview';
export { GuidedQuestionnaire } from './GuidedQuestionnaire';
export { VoiceProfileEditor } from './VoiceProfileEditor';
```

**Step 2: Commit**

```bash
git add frontend/src/components/voice/index.ts
git commit -m "feat(voice): add component index"
```

---

## Phase 4: Integration

### Task 12: Rewrite Profiles Page with Wizard Flow

**Files:**
- Modify: `frontend/src/app/profiles/page.tsx`

**Step 1: Rewrite the page**

```typescript
// frontend/src/app/profiles/page.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { useVoiceExtraction } from '@/hooks/useVoiceExtraction';
import {
  PathSelection,
  ExampleUpload,
  VoiceDNAPreview,
  GuidedQuestionnaire,
  VoiceProfileEditor,
  CreationPath,
} from '@/components/voice';
import {
  VoiceProfile,
  VoiceExtractionResult,
  TONE_OPTIONS,
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  FORMALITY_LABELS,
} from '@/types/voice-profile';
import { cn } from '@/lib/utils';

type WizardStep =
  | 'list'           // Main profile list
  | 'path-select'    // Choose creation path
  | 'examples'       // Upload examples
  | 'guided'         // Guided questionnaire
  | 'preview'        // Voice DNA preview
  | 'editor';        // Fine-tune editor

export default function ProfilesPage() {
  const [step, setStep] = useState<WizardStep>('list');
  const [creationPath, setCreationPath] = useState<CreationPath | null>(null);
  const [extractionResult, setExtractionResult] = useState<VoiceExtractionResult | null>(null);
  const [sourceExamples, setSourceExamples] = useState<string[]>([]);
  const [editingProfile, setEditingProfile] = useState<VoiceProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { profiles, isLoaded, addProfile, updateProfile, deleteProfile, exportProfiles, importProfiles } = useVoiceProfiles();
  const { isExtracting, error: extractionError, extractFromExamples } = useVoiceExtraction();

  // Path selection
  const handlePathSelect = useCallback((path: CreationPath) => {
    setCreationPath(path);
    setStep(path === 'examples' ? 'examples' : 'guided');
  }, []);

  // Example upload flow
  const handleExamplesSubmit = useCallback(async (examples: string[]) => {
    setSourceExamples(examples);
    const result = await extractFromExamples(examples);
    if (result) {
      setExtractionResult(result);
      setStep('preview');
    }
  }, [extractFromExamples]);

  // Guided flow
  const handleGuidedComplete = useCallback((result: VoiceExtractionResult) => {
    setExtractionResult(result);
    setStep('preview');
  }, []);

  // Preview actions
  const handleAcceptPreview = useCallback(() => {
    setStep('editor');
  }, []);

  const handleAdjustPreview = useCallback(() => {
    setStep('editor');
  }, []);

  // Save profile
  const handleSaveProfile = useCallback((profileData: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
    if (editingProfile) {
      updateProfile(editingProfile.id, profileData);
    } else {
      addProfile(profileData);
    }
    resetWizard();
  }, [editingProfile, addProfile, updateProfile]);

  // Edit existing profile
  const handleEditProfile = useCallback((profile: VoiceProfile) => {
    setEditingProfile(profile);
    setExtractionResult({
      tone: profile.tone,
      toneFormality: profile.toneFormality,
      toneDescription: profile.toneDescription,
      addressStyle: profile.addressStyle,
      sentenceStyle: profile.sentenceStyle,
      structureAnalysis: {
        leadsWithBenefits: profile.structurePreferences.leadWithBenefits,
        typicalSectionOrder: profile.structurePreferences.sectionOrder,
        includesSalary: profile.structurePreferences.includeSalaryProminently,
      },
      vocabulary: {
        commonlyUsed: profile.wordsToPrefer,
        notablyAvoided: profile.wordsToAvoid,
      },
      brandSignals: {
        values: profile.brandValues,
        personality: profile.toneDescription,
      },
      summary: '',
    });
    setCreationPath('manual' as CreationPath);
    setStep('editor');
  }, []);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setStep('list');
    setCreationPath(null);
    setExtractionResult(null);
    setSourceExamples([]);
    setEditingProfile(null);
  }, []);

  // Import handler
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importProfiles(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importProfiles]);

  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-espresso-900">Voice Profiles</h1>
          <p className="text-espresso-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Render wizard steps
  if (step === 'path-select') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <PathSelection onSelect={handlePathSelect} />
      </div>
    );
  }

  if (step === 'examples') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ExampleUpload
          onSubmit={handleExamplesSubmit}
          onBack={resetWizard}
          isLoading={isExtracting}
        />
        {extractionError && (
          <p className="text-red-600 mt-4 text-sm">{extractionError}</p>
        )}
      </div>
    );
  }

  if (step === 'guided') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <GuidedQuestionnaire
          onComplete={handleGuidedComplete}
          onBack={resetWizard}
        />
      </div>
    );
  }

  if (step === 'preview' && extractionResult) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <VoiceDNAPreview
          result={extractionResult}
          onAccept={handleAcceptPreview}
          onAdjust={handleAdjustPreview}
          onBack={() => setStep(creationPath === 'examples' ? 'examples' : 'guided')}
        />
      </div>
    );
  }

  if (step === 'editor') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <VoiceProfileEditor
          initialData={extractionResult ?? undefined}
          createdVia={creationPath ?? 'manual'}
          sourceExamples={sourceExamples}
          onSave={handleSaveProfile}
          onBack={() => extractionResult ? setStep('preview') : resetWizard()}
        />
      </div>
    );
  }

  // Main profile list
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-espresso-900 tracking-tight">Voice Profiles</h1>
          <p className="text-espresso-600 mt-2">
            Create profiles that capture your unique writing style.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          {profiles.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={exportProfiles}>Export</Button>
              <Button variant="outline" size="sm" onClick={handleImport}>Import</Button>
            </>
          )}
          <Button onClick={() => setStep('path-select')}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Profile
          </Button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <Card className="animate-fade-up">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-espresso-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-espresso-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-espresso-900 mb-2">No Voice Profiles Yet</h3>
            <p className="text-espresso-600 mb-6 max-w-sm mx-auto">
              Create your first voice profile to customize how job descriptions are written.
            </p>
            <Button onClick={() => setStep('path-select')}>Create Your First Profile</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile, index) => (
            <Card
              key={profile.id}
              hover
              className={cn('animate-fade-up opacity-0', `[animation-delay:${(index + 1) * 50}ms]`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-espresso-900 truncate">{profile.name}</h3>
                    {profile.isDefault && <Badge variant="success">Default</Badge>}
                    {profile.createdVia && (
                      <Badge variant="default" className="text-xs">
                        {profile.createdVia === 'examples' ? 'From examples' :
                         profile.createdVia === 'guided' ? 'Guided' : 'Manual'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-espresso-600 mb-3">{profile.toneDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{FORMALITY_LABELS[profile.toneFormality] || 'Balanced'}</Badge>
                    <Badge variant="default">
                      {ADDRESS_OPTIONS.find(o => o.value === profile.addressStyle)?.label}
                    </Badge>
                    <Badge variant="default">
                      {SENTENCE_OPTIONS.find(o => o.value === profile.sentenceStyle)?.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {!profile.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => updateProfile(profile.id, { isDefault: true })}>
                      Set Default
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEditProfile(profile)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => deleteProfile(profile.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run build to verify**

Run: `cd frontend && npm run build`
Expected: Build passes (may need type fixes)

**Step 3: Commit**

```bash
git add frontend/src/app/profiles/page.tsx
git commit -m "feat(voice): rewrite profiles page with Voice DNA wizard"
```

---

### Task 13: Update useVoiceProfiles Hook

**Files:**
- Modify: `frontend/src/hooks/useVoiceProfiles.ts`

**Step 1: Update hook to handle new profile shape**

Read the current hook and update it to handle the new VoiceProfile type with all new fields. Ensure backward compatibility with existing localStorage profiles.

**Step 2: Test**

Run: `cd frontend && npm run build && npm run dev`
Navigate to /profiles and test the creation flow.

**Step 3: Commit**

```bash
git add frontend/src/hooks/useVoiceProfiles.ts
git commit -m "feat(voice): update useVoiceProfiles for new profile shape"
```

---

## Phase 5: Final Integration & Testing

### Task 14: End-to-End Testing

**Files:**
- None (manual testing)

**Step 1: Test Example Upload Flow**

1. Go to /profiles
2. Click "Create Profile"
3. Select "From Examples"
4. Paste a sample JD
5. Click "Analyze My Style"
6. Verify "Here's What I Learned" shows extracted data
7. Click "Yes, Save This" or "Let Me Adjust"
8. Fill in name, save
9. Verify profile appears in list

**Step 2: Test Guided Flow**

1. Go to /profiles
2. Click "Create Profile"
3. Select "Guide Me Through It"
4. Answer all questions
5. Verify preview shows generated profile
6. Save and verify

**Step 3: Test Edit Flow**

1. Click "Edit" on existing profile
2. Modify settings
3. Save
4. Verify changes persisted

**Step 4: Commit final**

```bash
git add -A
git commit -m "feat(voice): complete Voice DNA system implementation"
```

---

## Summary

| Phase | Tasks | Commits |
|-------|-------|---------|
| Phase 1: Backend | 3 tasks | 3 commits |
| Phase 2: Frontend Types | 2 tasks | 2 commits |
| Phase 3: Components | 6 tasks | 6 commits |
| Phase 4: Integration | 2 tasks | 2 commits |
| Phase 5: Testing | 1 task | 1 commit |

**Total: 14 tasks, ~14 commits**

---

Plan complete and saved to `docs/plans/2026-01-07-voice-dna-system.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach would you prefer?
