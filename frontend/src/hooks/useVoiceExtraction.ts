// frontend/src/hooks/useVoiceExtraction.ts

import { useState, useCallback } from 'react';
import posthog from 'posthog-js';
import {
  VoiceExtractionResult,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
  RuleType,
} from '@/types/voice-profile';
import { apiRequest } from '@/lib/api';

interface UseVoiceExtractionReturn {
  isExtracting: boolean;
  error: string | null;
  result: VoiceExtractionResult | null;
  extractFromExamples: (examples: string[]) => Promise<VoiceExtractionResult | null>;
  reset: () => void;
}

// Response type from the API (snake_case)
interface VoiceExtractionApiResponse {
  tone: ToneStyle;
  tone_formality: number;
  tone_description: string;
  address_style: AddressStyle;
  sentence_style: SentenceStyle;
  structure_analysis?: {
    leads_with_benefits?: boolean;
    typical_section_order?: string[];
    includes_salary?: boolean;
  };
  vocabulary?: {
    commonly_used?: string[];
    notably_avoided?: string[];
  };
  brand_signals?: {
    values?: string[];
    personality?: string;
  };
  suggested_rules?: Array<{
    text: string;
    rule_type: RuleType;
    target?: string;
    value?: string;
    confidence: number;
    evidence: string;
  }>;
  format_guidance?: string;
  summary: string;
}

export function useVoiceExtraction(): UseVoiceExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceExtractionResult | null>(null);

  const extractFromExamples = useCallback(
    async (examples: string[]): Promise<VoiceExtractionResult | null> => {
      if (examples.length === 0) {
        setError('Please provide at least one example');
        return null;
      }

      setIsExtracting(true);
      setError(null);

      try {
        const data = await apiRequest<VoiceExtractionApiResponse>('/api/voice/extract', {
          method: 'POST',
          body: JSON.stringify({ example_jds: examples }),
        });

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
          suggestedRules: (data.suggested_rules ?? []).map((rule) => ({
            text: rule.text,
            ruleType: rule.rule_type,
            target: rule.target,
            value: rule.value,
            confidence: rule.confidence,
            evidence: rule.evidence,
          })),
          formatGuidance: data.format_guidance,
          summary: data.summary,
        };

        setResult(transformed);

        // Capture successful voice extraction event
        posthog.capture('voice_extraction_completed', {
          examples_count: examples.length,
          detected_tone: transformed.tone,
          detected_address_style: transformed.addressStyle,
          detected_sentence_style: transformed.sentenceStyle,
          suggested_rules_count: transformed.suggestedRules?.length ?? 0,
        });

        return transformed;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);

        // Capture voice extraction failure event
        posthog.capture('voice_extraction_failed', {
          examples_count: examples.length,
          error_message: message,
        });

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
