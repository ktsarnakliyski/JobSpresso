// frontend/src/hooks/useAnalyze.ts

'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import { AssessmentResult, Issue, AssessmentCategory } from '@/types/assessment';
import { VoiceProfile } from '@/types/voice-profile';
import { transformVoiceProfileToBackend } from '@/lib/transforms';

interface AnalyzeResponse {
  overall_score: number;
  interpretation: string;
  category_scores: Record<string, number>;
  issues: Array<{
    severity: string;
    category: string;
    description: string;
    found?: string;
    suggestion?: string;
    impact?: string;
  }>;
  positives: string[];
  improved_text: string;
}

function transformResponse(response: AnalyzeResponse): AssessmentResult {
  return {
    overallScore: response.overall_score,
    interpretation: response.interpretation as AssessmentResult['interpretation'],
    categoryScores: response.category_scores as Record<AssessmentCategory, number>,
    issues: response.issues.map((issue) => ({
      severity: issue.severity as Issue['severity'],
      category: issue.category as AssessmentCategory,
      description: issue.description,
      found: issue.found,
      suggestion: issue.suggestion,
      impact: issue.impact,
    })),
    positives: response.positives,
    improvedText: response.improved_text,
  };
}

export function useAnalyze() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const analyze = useCallback(
    async (jdText: string, voiceProfile?: VoiceProfile) => {
      setIsLoading(true);
      setError(null);

      try {
        const body: { jd_text: string; voice_profile?: ReturnType<typeof transformVoiceProfileToBackend> } = {
          jd_text: jdText,
        };

        if (voiceProfile) {
          body.voice_profile = transformVoiceProfileToBackend(voiceProfile);
        }

        const response = await apiRequest<AnalyzeResponse>('/api/analyze', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        const transformed = transformResponse(response);
        setResult(transformed);
        return transformed;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Analysis failed';
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
    analyze,
    reset,
    isLoading,
    error,
    result,
  };
}
