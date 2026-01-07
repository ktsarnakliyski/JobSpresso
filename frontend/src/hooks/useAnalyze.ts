// frontend/src/hooks/useAnalyze.ts

'use client';

import { useState, useCallback } from 'react';
import { apiRequest } from '@/lib/api';
import {
  AssessmentResult,
  Issue,
  AssessmentCategory,
  CategoryEvidence,
  QuestionCoverage,
  EvidenceStatus,
  QuestionImportance,
} from '@/types/assessment';
import { VoiceProfile } from '@/types/voice-profile';
import { transformVoiceProfileToBackend } from '@/lib/transforms';

interface CategoryEvidenceResponse {
  score: number;
  status: string;
  supporting_excerpts: string[];
  missing_elements: string[];
  opportunity: string;
  impact_prediction?: string;
}

interface QuestionCoverageResponse {
  question_id: string;
  question_text: string;
  is_answered: boolean;
  importance: string;
  evidence?: string;
  suggestion?: string;
  impact_stat: string;
}

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
  // New fields
  category_evidence: Record<string, CategoryEvidenceResponse>;
  question_coverage: QuestionCoverageResponse[];
  questions_answered: number;
  questions_total: number;
  question_coverage_percent: number;
  estimated_application_boost?: number;
}

function transformCategoryEvidence(
  evidence: Record<string, CategoryEvidenceResponse>
): Record<AssessmentCategory, CategoryEvidence> {
  const result: Partial<Record<AssessmentCategory, CategoryEvidence>> = {};

  for (const [key, value] of Object.entries(evidence)) {
    result[key as AssessmentCategory] = {
      score: value.score,
      status: value.status as EvidenceStatus,
      supportingExcerpts: value.supporting_excerpts,
      missingElements: value.missing_elements,
      opportunity: value.opportunity,
      impactPrediction: value.impact_prediction,
    };
  }

  return result as Record<AssessmentCategory, CategoryEvidence>;
}

function transformQuestionCoverage(
  questions: QuestionCoverageResponse[]
): QuestionCoverage[] {
  return questions.map((q) => ({
    questionId: q.question_id,
    questionText: q.question_text,
    isAnswered: q.is_answered,
    importance: q.importance as QuestionImportance,
    evidence: q.evidence,
    suggestion: q.suggestion,
    impactStat: q.impact_stat,
  }));
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
    // New fields
    categoryEvidence: transformCategoryEvidence(response.category_evidence),
    questionCoverage: transformQuestionCoverage(response.question_coverage),
    questionsAnswered: response.questions_answered,
    questionsTotal: response.questions_total,
    questionCoveragePercent: response.question_coverage_percent,
    estimatedApplicationBoost: response.estimated_application_boost,
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
