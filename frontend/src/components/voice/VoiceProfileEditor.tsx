// frontend/src/components/voice/VoiceProfileEditor.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea, Select, BackButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  VoiceProfile,
  VoiceExtractionResult,
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  FORMALITY_LABELS,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
  CreationMethod,
} from '@/types/voice-profile';

interface VoiceProfileEditorProps {
  initialData?: VoiceExtractionResult;
  createdVia: CreationMethod;
  sourceExamples?: string[];
  onSave: (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => void;
  onBack: () => void;
  existingName?: string;
}

export function VoiceProfileEditor({
  initialData,
  createdVia,
  sourceExamples = [],
  onSave,
  onBack,
  existingName = '',
}: VoiceProfileEditorProps) {
  const [name, setName] = useState(existingName);
  const [toneFormality, setToneFormality] = useState(initialData?.toneFormality ?? 3);
  const [toneDescription, setToneDescription] = useState(
    initialData?.toneDescription ?? 'Professional'
  );
  const [tone] = useState<ToneStyle>(initialData?.tone ?? 'professional');
  const [addressStyle, setAddressStyle] = useState<AddressStyle>(
    initialData?.addressStyle ?? 'direct_you'
  );
  const [sentenceStyle, setSentenceStyle] = useState<SentenceStyle>(
    initialData?.sentenceStyle ?? 'balanced'
  );
  const [leadWithBenefits, setLeadWithBenefits] = useState(
    initialData?.structureAnalysis?.leadsWithBenefits ?? false
  );
  const [includeSalary, setIncludeSalary] = useState(
    initialData?.structureAnalysis?.includesSalary ?? false
  );
  const [wordsToPrefer, setWordsToPrefer] = useState(
    initialData?.vocabulary?.commonlyUsed?.join(', ') ?? ''
  );
  const [wordsToAvoid, setWordsToAvoid] = useState(
    initialData?.vocabulary?.notablyAvoided?.join(', ') ?? ''
  );
  const [brandValues, setBrandValues] = useState(
    initialData?.brandSignals?.values?.join(', ') ?? ''
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    const profile: Omit<VoiceProfile, 'id' | 'createdAt'> = {
      name: name.trim(),
      toneFormality,
      toneDescription,
      tone,
      addressStyle,
      sentenceStyle,
      structurePreferences: {
        leadWithBenefits,
        sectionOrder: leadWithBenefits
          ? ['intro', 'benefits', 'responsibilities', 'requirements']
          : ['intro', 'responsibilities', 'requirements', 'benefits'],
        includeSalaryProminently: includeSalary,
      },
      structurePreference: 'mixed',
      wordsToAvoid: wordsToAvoid
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
      wordsToPrefer: wordsToPrefer
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
      brandValues: brandValues
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
      sourceExamples,
      createdVia,
      isDefault: false,
    };

    onSave(profile);
  }, [
    name,
    toneFormality,
    toneDescription,
    tone,
    addressStyle,
    sentenceStyle,
    leadWithBenefits,
    includeSalary,
    wordsToPrefer,
    wordsToAvoid,
    brandValues,
    sourceExamples,
    createdVia,
    onSave,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <h2 className="text-xl font-semibold text-espresso-900">Fine-Tune Your Voice Profile</h2>
        <p className="text-espresso-600 mt-2">Adjust any settings to match your exact preferences.</p>
      </div>

      <Card className="space-y-6">
        {/* Profile Name */}
        <div>
          <label className="block text-sm font-medium text-espresso-700 mb-2">
            Profile Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., TechCorp Engineering, Startup Voice"
            className={cn(
              'w-full rounded-xl border border-espresso-200 px-4 py-2.5',
              'bg-white text-espresso-900',
              'focus:border-espresso-500 focus:ring-2 focus:ring-espresso-500/15 focus:outline-none'
            )}
          />
        </div>

        {/* Tone Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">Tone</h3>

          <div>
            <label className="block text-sm font-medium text-espresso-700 mb-3">
              Formality: {FORMALITY_LABELS[toneFormality]}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={toneFormality}
              onChange={(e) => setToneFormality(Number(e.target.value))}
              className="w-full accent-espresso-600"
            />
            <div className="flex justify-between text-xs text-espresso-400 mt-1">
              <span>Formal</span>
              <span>Casual</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-espresso-700 mb-2">
              Tone Description
            </label>
            <input
              type="text"
              value={toneDescription}
              onChange={(e) => setToneDescription(e.target.value)}
              placeholder="e.g., Professional but warm"
              className={cn(
                'w-full rounded-xl border border-espresso-200 px-4 py-2.5',
                'bg-white text-espresso-900',
                'focus:border-espresso-500 focus:ring-2 focus:ring-espresso-500/15 focus:outline-none'
              )}
            />
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">Style</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Address Style"
              options={ADDRESS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={addressStyle}
              onChange={(e) => setAddressStyle(e.target.value as AddressStyle)}
            />
            <Select
              label="Sentence Style"
              options={SENTENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={sentenceStyle}
              onChange={(e) => setSentenceStyle(e.target.value as SentenceStyle)}
            />
          </div>
        </div>

        {/* Structure Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">
            Structure
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={leadWithBenefits}
                onChange={(e) => setLeadWithBenefits(e.target.checked)}
                className="w-4 h-4 rounded border-espresso-300 text-espresso-600 focus:ring-espresso-500"
              />
              <span className="text-espresso-700">Lead with benefits and impact</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSalary}
                onChange={(e) => setIncludeSalary(e.target.checked)}
                className="w-4 h-4 rounded border-espresso-300 text-espresso-600 focus:ring-espresso-500"
              />
              <span className="text-espresso-700">Include salary prominently</span>
            </label>
          </div>
        </div>

        {/* Vocabulary Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-espresso-800 uppercase tracking-wide">
            Vocabulary
          </h3>

          <TextArea
            label="Words to Prefer"
            value={wordsToPrefer}
            onChange={(e) => setWordsToPrefer(e.target.value)}
            placeholder="team, growth, impact, collaborate (comma-separated)"
            rows={2}
          />
          <TextArea
            label="Words to Avoid"
            value={wordsToAvoid}
            onChange={(e) => setWordsToAvoid(e.target.value)}
            placeholder="ninja, rockstar, guru, synergy (comma-separated)"
            rows={2}
          />
        </div>

        {/* Brand Values */}
        <div>
          <TextArea
            label="Brand Values"
            value={brandValues}
            onChange={(e) => setBrandValues(e.target.value)}
            placeholder="innovation, collaboration, excellence (comma-separated)"
            rows={2}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          Save Profile
        </Button>
      </div>
    </div>
  );
}
