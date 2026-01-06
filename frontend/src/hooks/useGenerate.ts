// frontend/src/hooks/useGenerate.ts

'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { GenerateResult } from '@/types/assessment';
import { VoiceProfile } from '@/types/voice-profile';

export interface GenerateInput {
  roleTitle: string;
  responsibilities: string[];
  requirements: string[];
  companyDescription?: string;
  teamSize?: string;
  salaryRange?: string;
  location?: string;
  benefits?: string[];
  niceToHave?: string[];
}

interface GenerateResponse {
  generated_jd: string;
  word_count: number;
  notes: string[];
}

function transformVoiceProfile(profile: VoiceProfile) {
  return {
    id: profile.id,
    name: profile.name,
    tone: profile.tone,
    address_style: profile.addressStyle,
    sentence_style: profile.sentenceStyle,
    words_to_avoid: profile.wordsToAvoid,
    words_to_prefer: profile.wordsToPrefer,
    structure_preference: profile.structurePreference,
    is_default: profile.isDefault,
  };
}

export function useGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const generate = useCallback(
    async (input: GenerateInput, voiceProfile?: VoiceProfile) => {
      setIsLoading(true);
      setError(null);

      try {
        const body: Record<string, unknown> = {
          role_title: input.roleTitle,
          responsibilities: input.responsibilities,
          requirements: input.requirements,
        };

        if (input.companyDescription) body.company_description = input.companyDescription;
        if (input.teamSize) body.team_size = input.teamSize;
        if (input.salaryRange) body.salary_range = input.salaryRange;
        if (input.location) body.location = input.location;
        if (input.benefits) body.benefits = input.benefits;
        if (input.niceToHave) body.nice_to_have = input.niceToHave;
        if (voiceProfile) body.voice_profile = transformVoiceProfile(voiceProfile);

        const response = await apiRequest<GenerateResponse>('/api/generate', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        const transformed: GenerateResult = {
          generatedJd: response.generated_jd,
          wordCount: response.word_count,
          notes: response.notes,
        };

        setResult(transformed);
        return transformed;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Generation failed';
        setError(message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    generate,
    reset,
    isLoading,
    error,
    result,
  };
}
