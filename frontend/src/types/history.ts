import type { AssessmentResult } from './assessment';

export interface AnalysisHistoryEntry {
  id: string;
  savedAt: number;
  jobTitle: string;
  jdText: string;
  overallScore: number;
  interpretation: AssessmentResult['interpretation'];
  voiceProfileId?: string;
  result: AssessmentResult;
}

export const HISTORY_STORAGE_KEY = 'jobspresso_analysis_history';
export const HISTORY_MAX_ENTRIES = 10;
