'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HISTORY_STORAGE_KEY,
  HISTORY_MAX_ENTRIES,
} from '@/types/history';
import type { AnalysisHistoryEntry } from '@/types/history';
import type { AssessmentResult } from '@/types/assessment';

function extractJobTitle(jdText: string): string {
  const firstLine = jdText
    .split('\n')
    .find((line) => line.trim().length > 2)
    ?.trim() ?? '';

  return firstLine.slice(0, 60) || 'Untitled JD';
}

function loadFromStorage(): AnalysisHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as AnalysisHistoryEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(entries: AnalysisHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save analysis history:', e);
  }
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading from external store on mount
    setHistory(loadFromStorage());
    setIsLoaded(true);
  }, []);

  const saveAnalysis = useCallback((
    jdText: string,
    result: AssessmentResult,
    voiceProfileId?: string
  ): AnalysisHistoryEntry => {
    const entry: AnalysisHistoryEntry = {
      id: crypto.randomUUID(),
      savedAt: Date.now(),
      jobTitle: extractJobTitle(jdText),
      jdText: jdText.trim().slice(0, 10_000),
      overallScore: result.overallScore,
      interpretation: result.interpretation,
      voiceProfileId,
      result,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, HISTORY_MAX_ENTRIES);
      saveToStorage(updated);
      return updated;
    });

    return entry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((entry) => entry.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistory([]);
  }, []);

  return {
    history,
    isLoaded,
    saveAnalysis,
    deleteEntry,
    clearHistory,
  };
}
