# TASK-SPEC: JobSpresso — Analysis History + Result Persistence

## Goal
Add localStorage-backed analysis history to the /analyze page. After every analysis, save the result. Show the last 10 saved analyses in a "Recent Analyses" panel so users can revisit results without re-running.

**Wow factor:** Instant history with one-click restore — paste JD, click analyze, get your score, close the tab. Come back tomorrow and your last 10 analyses are right there. No login, no server, just works.

---

## TypeScript Types

### New file: `frontend/src/types/history.ts`

```typescript
import { AssessmentResult } from './assessment';

export interface AnalysisHistoryEntry {
  id: string;                    // crypto.randomUUID()
  savedAt: number;               // Date.now()
  jobTitle: string;              // Extracted from JD text (first line or "Untitled JD")
  jdText: string;                // Full JD text (trimmed, max 10,000 chars)
  overallScore: number;          // result.overallScore
  interpretation: string;        // result.interpretation
  voiceProfileId?: string;       // ID of voice profile used (optional)
  result: AssessmentResult;      // Full analysis result
}

export const HISTORY_STORAGE_KEY = 'jobspresso_analysis_history';
export const HISTORY_MAX_ENTRIES = 10;
```

---

## New Hook: `frontend/src/hooks/useAnalysisHistory.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnalysisHistoryEntry, HISTORY_STORAGE_KEY, HISTORY_MAX_ENTRIES } from '@/types/history';
import { AssessmentResult } from '@/types/assessment';

function extractJobTitle(jdText: string): string {
  // Take the first non-empty line, strip common prefixes, truncate to 60 chars
  const firstLine = jdText.split('\n').find(l => l.trim().length > 2)?.trim() ?? '';
  return firstLine.slice(0, 60) || 'Untitled JD';
}

function loadFromStorage(): AnalysisHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnalysisHistoryEntry[];
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

  // Load from localStorage on mount
  useEffect(() => {
    setHistory(loadFromStorage());
    setIsLoaded(true);
  }, []);

  const saveAnalysis = useCallback(
    (jdText: string, result: AssessmentResult, voiceProfileId?: string): AnalysisHistoryEntry => {
      const entry: AnalysisHistoryEntry = {
        id: crypto.randomUUID(),
        savedAt: Date.now(),
        jobTitle: extractJobTitle(jdText),
        jdText: jdText.slice(0, 10_000),
        overallScore: result.overallScore,
        interpretation: result.interpretation,
        voiceProfileId,
        result,
      };

      setHistory(prev => {
        // Prepend new entry, keep max HISTORY_MAX_ENTRIES
        const updated = [entry, ...prev].slice(0, HISTORY_MAX_ENTRIES);
        saveToStorage(updated);
        return updated;
      });

      return entry;
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id);
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
```

---

## New Component: `frontend/src/components/AnalysisHistory.tsx`

A compact history panel showing the last 10 analyses.

```typescript
'use client';

import { AnalysisHistoryEntry } from '@/types/history';
import { formatDistanceToNow } from 'date-fns'; // Already likely installed; if not, use plain JS

interface Props {
  history: AnalysisHistoryEntry[];
  isLoaded: boolean;
  onRestore: (entry: AnalysisHistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function AnalysisHistory({ history, isLoaded, onRestore, onDelete }: Props) {
  // Don't render until localStorage is loaded (avoids hydration flash)
  if (!isLoaded || history.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Recent Analyses
      </h3>
      <div className="space-y-2">
        {history.map(entry => (
          <div
            key={entry.id}
            className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Left: score badge + title */}
            <button
              onClick={() => onRestore(entry)}
              className="flex items-center gap-3 flex-1 text-left min-w-0"
              aria-label={`Restore analysis: ${entry.jobTitle}`}
            >
              <span
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white
                  ${entry.overallScore >= 80 ? 'bg-emerald-500' :
                    entry.overallScore >= 60 ? 'bg-amber-400' :
                    'bg-red-400'}`}
              >
                {entry.overallScore}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{entry.jobTitle}</p>
                <p className="text-xs text-gray-400">
                  {formatTimeAgo(entry.savedAt)}
                </p>
              </div>
            </button>

            {/* Right: delete button */}
            <button
              onClick={() => onDelete(entry.id)}
              className="ml-2 flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
              aria-label="Remove from history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple time ago without date-fns dependency
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
```

---

## Changes to `frontend/src/app/analyze/page.tsx`

### Import additions:
```typescript
import { useAnalysisHistory } from '@/hooks/useAnalysisHistory';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import { AnalysisHistoryEntry } from '@/types/history';
```

### Inside `AnalyzePage` component, add:
```typescript
const { history, isLoaded, saveAnalysis, deleteEntry } = useAnalysisHistory();
```

### After a successful analysis, save to history:
Find the `handleAnalyze` callback (or the effect that sets `result`). After `analyze()` succeeds and `result` is set, call `saveAnalysis`:

**Approach:** Add a `useEffect` that watches `result` and saves when it changes:
```typescript
useEffect(() => {
  if (result && jdText) {
    saveAnalysis(jdText, result, selectedProfileId || undefined);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [result]);
```
(Only fire on result change, not on every render. Don't include saveAnalysis or jdText in deps to avoid re-saving on unrelated renders.)

### Restore handler:
```typescript
const handleRestoreHistory = useCallback((entry: AnalysisHistoryEntry) => {
  setJdText(entry.jdText);
  // Select the voice profile if it was saved and still exists
  if (entry.voiceProfileId) {
    selectProfile(entry.voiceProfileId);
  }
  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [selectProfile]);
```

### Add history panel in JSX:
Place the `<AnalysisHistory>` component BELOW the voice profile selector, ABOVE the JD textarea (or below the textarea — either works, but below textarea is less intrusive):

```tsx
{/* After the textarea / before the Analyze button — OR after the voice profile selector */}
<AnalysisHistory
  history={history}
  isLoaded={isLoaded}
  onRestore={handleRestoreHistory}
  onDelete={deleteEntry}
/>
```

Exact placement: inside the left/input column, between the JD input card and the analyze button, or at the bottom of the page below results — choose bottom of page (after results section) so it doesn't clutter the input flow.

**Final placement:** After the results `<div ref={resultsRef}>` block, at the bottom of the page:
```tsx
<AnalysisHistory
  history={history}
  isLoaded={isLoaded}
  onRestore={handleRestoreHistory}
  onDelete={deleteEntry}
/>
```

---

## Files to Create
1. `frontend/src/types/history.ts` — new type definitions
2. `frontend/src/hooks/useAnalysisHistory.ts` — new hook
3. `frontend/src/components/AnalysisHistory.tsx` — new component

## Files to Modify
4. `frontend/src/app/analyze/page.tsx` — add history hook, restore handler, useEffect for saving, and `<AnalysisHistory>` component in JSX

---

## Testing

### Build test (must pass):
```bash
cd /Users/ktsarnakliyski/projects/JobSpresso/frontend && npm run build
```

### Manual verification:
1. Navigate to /analyze
2. Paste a JD and run analysis
3. Results appear → "Recent Analyses" section shows below with the entry (score badge + title + time)
4. Click the history entry → JD text is restored in textarea
5. Reload the page → history is still there (localStorage persisted)
6. Click X on an entry → it's removed
7. Run 10+ analyses → only last 10 are shown

---

## Over-Deliver Ideas (implement if time allows)

1. **Pin/star entries** — add a ⭐ button to pin important analyses so they survive the 10-entry rotation
2. **Score trend** — a tiny sparkline showing score history across the last analyses
3. **Copy title** — clicking the job title copies it to clipboard
4. **Keyboard shortcut** — Ctrl/Cmd+H to toggle history panel

---

## Implementation Notes

- Do NOT use `date-fns` unless it's already in `package.json` — use the `formatTimeAgo` helper inline
- The `<AnalysisHistory>` component returns `null` when empty — no "empty state" clutter
- `crypto.randomUUID()` is available in all modern browsers (Next.js 16 targets modern browsers)
- Do NOT store the full `improvedText` in history if it's very large — the `result` object includes it via `result.improvedText`. Storage is fine for 10 entries of ~50KB each.
- The `isLoaded` flag prevents hydration mismatch (SSR renders no history, CSR loads from localStorage)

---

**Task ID:** kd740r4r4pzetpd7zcr5jgr9c981n3f6
