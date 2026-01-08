// frontend/src/components/voice/editor/StyleSection.tsx

'use client';

import { Select } from '@/components/ui';
import {
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  AddressStyle,
  SentenceStyle,
} from '@/types/voice-profile';

interface StyleSectionProps {
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  onAddressStyleChange: (value: AddressStyle) => void;
  onSentenceStyleChange: (value: SentenceStyle) => void;
}

export function StyleSection({
  addressStyle,
  sentenceStyle,
  onAddressStyleChange,
  onSentenceStyleChange,
}: StyleSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">Style</h3>

      <div className="grid md:grid-cols-2 gap-4">
        <Select
          label="Address Style"
          options={ADDRESS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={addressStyle}
          onChange={(e) => onAddressStyleChange(e.target.value as AddressStyle)}
        />
        <Select
          label="Sentence Style"
          options={SENTENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={sentenceStyle}
          onChange={(e) => onSentenceStyleChange(e.target.value as SentenceStyle)}
        />
      </div>
    </div>
  );
}
