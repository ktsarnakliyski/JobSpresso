// frontend/src/components/voice/PathSelection.tsx

'use client';

import { cn } from '@/lib/utils';

export type CreationPath = 'examples' | 'guided';

interface PathSelectionProps {
  onSelect: (path: CreationPath) => void;
}

export function PathSelection({ onSelect }: PathSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-espresso-900">Create Voice Profile</h2>
        <p className="text-espresso-600 mt-2">Let&apos;s capture your unique writing style</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('examples')}
          className={cn(
            'p-6 rounded-2xl border-2 border-espresso-200 bg-white',
            'hover:border-espresso-400 hover:shadow-soft-lg',
            'transition-all duration-200 text-left group'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-espresso-100 flex items-center justify-center mb-4 group-hover:bg-espresso-200 transition-colors">
            <svg
              className="w-6 h-6 text-espresso-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-espresso-900 mb-2">From Examples</h3>
          <p className="text-espresso-600 text-sm">
            Upload 2-3 JDs you&apos;ve written before. We&apos;ll analyze your style automatically.
          </p>
          <p className="text-espresso-400 text-xs mt-3">Fastest if you have examples handy</p>
        </button>

        <button
          onClick={() => onSelect('guided')}
          className={cn(
            'p-6 rounded-2xl border-2 border-espresso-200 bg-white',
            'hover:border-espresso-400 hover:shadow-soft-lg',
            'transition-all duration-200 text-left group'
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-espresso-100 flex items-center justify-center mb-4 group-hover:bg-espresso-200 transition-colors">
            <svg
              className="w-6 h-6 text-espresso-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-espresso-900 mb-2">Guide Me Through It</h3>
          <p className="text-espresso-600 text-sm">
            Answer a few questions about your writing style and preferences.
          </p>
          <p className="text-espresso-400 text-xs mt-3">Takes about 3 minutes</p>
        </button>
      </div>
    </div>
  );
}
