// frontend/src/components/voice/editor/ToneSection.tsx

'use client';

import { FORMALITY_LABELS } from '@/types/voice-profile';
import { cn } from '@/lib/utils';

// Shared input styling
const inputClasses = cn(
  'w-full rounded-xl border border-navy-200 px-4 py-2.5',
  'bg-white text-navy-900',
  'focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none'
);

interface ToneSectionProps {
  toneFormality: number;
  toneDescription: string;
  onToneFormalityChange: (value: number) => void;
  onToneDescriptionChange: (value: string) => void;
}

export function ToneSection({
  toneFormality,
  toneDescription,
  onToneFormalityChange,
  onToneDescriptionChange,
}: ToneSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">Tone</h3>

      <div>
        <label className="block text-sm font-medium text-navy-700 mb-3">
          Formality: {FORMALITY_LABELS[toneFormality] || 'Balanced'}
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={toneFormality}
          onChange={(e) => onToneFormalityChange(Number(e.target.value))}
          className="w-full accent-navy-600"
        />
        <div className="flex justify-between text-xs text-navy-400 mt-1">
          <span>Formal</span>
          <span>Casual</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-700 mb-2">
          Tone Description
        </label>
        <input
          type="text"
          value={toneDescription}
          onChange={(e) => onToneDescriptionChange(e.target.value)}
          placeholder="e.g., Professional but warm"
          className={inputClasses}
        />
      </div>
    </div>
  );
}
