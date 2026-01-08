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

// Type guards for runtime validation
const VALID_CATEGORIES: AssessmentCategory[] = [
  'inclusivity', 'readability', 'structure',
  'completeness', 'clarity', 'voice_match'
];

function isValidCategory(value: string): value is AssessmentCategory {
  return VALID_CATEGORIES.includes(value as AssessmentCategory);
}

const VALID_SEVERITIES = ['critical', 'warning', 'info'];

function isValidSeverity(value: string): value is Issue['severity'] {
  return VALID_SEVERITIES.includes(value);
}

const VALID_EVIDENCE_STATUSES = ['good', 'warning', 'critical'];

function isValidEvidenceStatus(value: string): value is EvidenceStatus {
  return VALID_EVIDENCE_STATUSES.includes(value);
}

const VALID_QUESTION_IMPORTANCES = ['high', 'medium', 'low'];

function isValidQuestionImportance(value: string): value is QuestionImportance {
  return VALID_QUESTION_IMPORTANCES.includes(value);
}

function transformCategoryEvidence(
  evidence: Record<string, CategoryEvidenceResponse>
): Record<AssessmentCategory, CategoryEvidence> {
  const result: Partial<Record<AssessmentCategory, CategoryEvidence>> = {};

  for (const [key, value] of Object.entries(evidence)) {
    if (!isValidCategory(key)) {
      console.warn(`Invalid category from API: ${key}`);
      continue;
    }
    const status = isValidEvidenceStatus(value.status) ? value.status : 'warning';
    result[key] = {
      score: value.score,
      status,
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
    importance: isValidQuestionImportance(q.importance) ? q.importance : 'medium',
    evidence: q.evidence,
    suggestion: q.suggestion,
    impactStat: q.impact_stat,
  }));
}

function transformResponse(response: AnalyzeResponse): AssessmentResult {
  // Transform issues with validation, skipping invalid ones
  const validIssues: Issue[] = [];
  for (const issue of response.issues) {
    if (!isValidCategory(issue.category)) {
      console.warn(`Invalid category in issue from API: ${issue.category}`);
      continue;
    }
    validIssues.push({
      severity: isValidSeverity(issue.severity) ? issue.severity : 'info',
      category: issue.category,
      description: issue.description,
      found: issue.found,
      suggestion: issue.suggestion,
      impact: issue.impact,
    });
  }

  return {
    overallScore: response.overall_score,
    interpretation: response.interpretation as AssessmentResult['interpretation'],
    categoryScores: response.category_scores as Record<AssessmentCategory, number>,
    issues: validIssues,
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
