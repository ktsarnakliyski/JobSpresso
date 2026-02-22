'use client';

import type { AnalysisHistoryEntry } from '@/types/history';

interface Props {
  history: AnalysisHistoryEntry[];
  isLoaded: boolean;
  onRestore: (entry: AnalysisHistoryEntry) => void;
  onDelete: (id: string) => void;
}

export function AnalysisHistory({
  history,
  isLoaded,
  onRestore,
  onDelete,
}: Props) {
  if (!isLoaded || history.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Recent Analyses
      </h3>
      <div className="space-y-2">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => onRestore(entry)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              aria-label={`Restore analysis: ${entry.jobTitle}`}
            >
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  entry.overallScore >= 80
                    ? 'bg-emerald-500'
                    : entry.overallScore >= 60
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                }`}
              >
                {entry.overallScore}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{entry.jobTitle}</p>
                <p className="text-xs text-gray-400">{formatTimeAgo(entry.savedAt)}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="ml-2 flex-shrink-0 rounded p-1 text-gray-300 transition-colors hover:text-red-400"
              aria-label="Remove from history"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
