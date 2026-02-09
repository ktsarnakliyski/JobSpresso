// frontend/src/hooks/useGenerate.ts

'use client';

import { useState, useCallback } from 'react';
import posthog from 'posthog-js';
import { apiRequest } from '@/lib/api';
import { GenerateResult } from '@/types/assessment';
import { VoiceProfile } from '@/types/voice-profile';
import { transformVoiceProfileToBackend } from '@/lib/transforms';

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

export function useGenerate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const generate = useCallback(
    async (input: GenerateInput, voiceProfile?: VoiceProfile) => {
      setIsLoading(true);
      setError(null);

      // Capture generation started event
      posthog.capture('jd_generation_started', {
        role_title: input.roleTitle,
        has_voice_profile: !!voiceProfile,
      });

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
        if (voiceProfile) body.voice_profile = transformVoiceProfileToBackend(voiceProfile);

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

        // Capture successful generation event
        posthog.capture('jd_generation_completed', {
          role_title: input.roleTitle,
          word_count: transformed.wordCount,
          has_voice_profile: !!voiceProfile,
          has_company_description: !!input.companyDescription,
          has_salary_range: !!input.salaryRange,
          has_location: !!input.location,
          has_benefits: !!input.benefits?.length,
          responsibilities_count: input.responsibilities.length,
          requirements_count: input.requirements.length,
        });

        return transformed;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Generation failed';
        setError(message);

        // Capture generation failure event
        posthog.capture('jd_generation_failed', {
          role_title: input.roleTitle,
          error_message: message,
          has_voice_profile: !!voiceProfile,
        });

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
