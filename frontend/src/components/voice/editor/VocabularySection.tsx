// frontend/src/components/voice/editor/VocabularySection.tsx

'use client';

import { TextArea } from '@/components/ui';

interface VocabularySectionProps {
  wordsToPrefer: string;
  wordsToAvoid: string;
  onWordsToPreferChange: (value: string) => void;
  onWordsToAvoidChange: (value: string) => void;
}

export function VocabularySection({
  wordsToPrefer,
  wordsToAvoid,
  onWordsToPreferChange,
  onWordsToAvoidChange,
}: VocabularySectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">
        Vocabulary
      </h3>

      <TextArea
        label="Words to Prefer"
        value={wordsToPrefer}
        onChange={(e) => onWordsToPreferChange(e.target.value)}
        placeholder="team, growth, impact, collaborate (comma-separated)"
        rows={2}
      />
      <TextArea
        label="Words to Avoid"
        value={wordsToAvoid}
        onChange={(e) => onWordsToAvoidChange(e.target.value)}
        placeholder="ninja, rockstar, guru, synergy (comma-separated)"
        rows={2}
      />
    </div>
  );
}
