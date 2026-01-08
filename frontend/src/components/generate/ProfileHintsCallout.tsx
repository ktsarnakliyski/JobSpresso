// frontend/src/components/generate/ProfileHintsCallout.tsx

'use client';

import { ProfileHint } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface ProfileHintsCalloutProps {
  hints: ProfileHint[];
  onShowMeWhere: () => void;
}

export function ProfileHintsCallout({ hints, onShowMeWhere }: ProfileHintsCalloutProps) {
  if (hints.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fade-up">
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">💡</span>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-900 mb-2">
            Add more context for better results
          </h4>
          <div className="space-y-1.5 text-sm text-amber-800">
            {hints.slice(0, 3).map((hint) => (
              <p key={hint.field} className="flex items-center gap-2">
                <span className="text-amber-600">•</span>
                <span>{hint.reason}</span>
              </p>
            ))}
            {hints.length > 3 && (
              <p className="text-amber-600 text-xs">
                +{hints.length - 3} more suggestion{hints.length - 3 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onShowMeWhere}
            className={cn(
              'mt-3 text-sm font-medium text-amber-700 hover:text-amber-900',
              'flex items-center gap-1 transition-colors'
            )}
          >
            Show me where
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
