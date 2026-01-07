// frontend/src/types/assessment.ts

export type IssueSeverity = 'critical' | 'warning' | 'info';

export type EvidenceStatus = 'good' | 'warning' | 'critical';

export type QuestionImportance = 'high' | 'medium' | 'low';

export type AssessmentCategory =
  | 'inclusivity'
  | 'readability'
  | 'structure'
  | 'completeness'
  | 'clarity'
  | 'voice_match';

export interface Issue {
  severity: IssueSeverity;
  category: AssessmentCategory;
  description: string;
  found?: string;
  suggestion?: string;
  impact?: string;
}

// NEW: Evidence-based category breakdown (COSMO-inspired)
export interface CategoryEvidence {
  score: number;
  status: EvidenceStatus;
  supportingExcerpts: string[];
  missingElements: string[];
  opportunity: string;
  impactPrediction?: string;
}

// NEW: Candidate question coverage (Rufus Q&A-inspired)
export interface QuestionCoverage {
  questionId: string;
  questionText: string;
  isAnswered: boolean;
  importance: QuestionImportance;
  evidence?: string;
  suggestion?: string;
  impactStat: string;
}

export interface AssessmentResult {
  // Core scores
  overallScore: number;
  interpretation: 'excellent' | 'good' | 'needs_work' | 'poor' | 'critical';
  categoryScores: Record<AssessmentCategory, number>;
  issues: Issue[];
  positives: string[];
  improvedText: string;

  // Evidence-based breakdown
  categoryEvidence: Record<AssessmentCategory, CategoryEvidence>;

  // Question coverage
  questionCoverage: QuestionCoverage[];
  questionsAnswered: number;
  questionsTotal: number;
  questionCoveragePercent: number;

  // HR metrics
  estimatedApplicationBoost?: number;
}

export interface GenerateResult {
  generatedJd: string;
  wordCount: number;
  notes: string[];
}

export const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  inclusivity: 'Inclusivity',
  readability: 'Readability',
  structure: 'Structure',
  completeness: 'Completeness',
  clarity: 'Clarity',
  voice_match: 'Voice Match',
};

export const CATEGORY_WEIGHTS: Record<AssessmentCategory, number> = {
  inclusivity: 25,
  readability: 20,
  structure: 15,
  completeness: 15,
  clarity: 10,
  voice_match: 15,
};

export const INTERPRETATION_COLORS: Record<AssessmentResult['interpretation'], string> = {
  excellent: 'text-green-600',
  good: 'text-green-500',
  needs_work: 'text-yellow-600',
  poor: 'text-orange-500',
  critical: 'text-red-600',
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};
