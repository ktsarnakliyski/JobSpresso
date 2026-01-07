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

  const extractFromExamples = useCallback(
    async (examples: string[]): Promise<VoiceExtractionResult | null> => {
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
    },
    []
  );

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
