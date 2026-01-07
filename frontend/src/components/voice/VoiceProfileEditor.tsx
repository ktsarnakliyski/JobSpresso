// frontend/src/components/voice/VoiceProfileEditor.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea, Select, BackButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  VoiceProfile,
  VoiceExtractionResult,
  ProfileRule,
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  FORMALITY_LABELS,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
  CreationMethod,
} from '@/types/voice-profile';
import { RulesBuilder } from './RulesBuilder';

// Helper to parse comma-separated strings into arrays
const parseCommaSeparated = (str: string): string[] =>
  str.split(',').map((w) => w.trim()).filter(Boolean);

// Shared input styling
const inputClasses = cn(
  'w-full rounded-xl border border-navy-200 px-4 py-2.5',
  'bg-white text-navy-900',
  'focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none'
);

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
  // Auto-populate rules from suggested rules (converted to ProfileRule format)
  const [rules, setRules] = useState<ProfileRule[]>(() => {
    if (!initialData?.suggestedRules?.length) return [];
    return initialData.suggestedRules.map((suggested, idx) => ({
      id: `suggested-${idx}-${Date.now()}`,
      text: suggested.text,
      ruleType: suggested.ruleType,
      target: suggested.target,
      value: suggested.value,
      source: 'ai_suggested' as const,
      active: true,
    }));
  });
  const [formatGuidance, setFormatGuidance] = useState(
    initialData?.formatGuidance ?? ''
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
      wordsToAvoid: parseCommaSeparated(wordsToAvoid),
      wordsToPrefer: parseCommaSeparated(wordsToPrefer),
      brandValues: parseCommaSeparated(brandValues),
      sourceExamples,
      createdVia,
      rules,
      formatGuidance: formatGuidance.trim() || undefined,
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
    rules,
    formatGuidance,
    onSave,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <h2 className="text-xl font-semibold text-navy-900">Fine-Tune Your Voice Profile</h2>
        <p className="text-navy-600 mt-2">Adjust any settings to match your exact preferences.</p>
      </div>

      <Card className="space-y-6">
        {/* Profile Name */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Profile Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., TechCorp Engineering, Startup Voice"
            className={inputClasses}
          />
        </div>

        {/* Tone Section */}
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
              onChange={(e) => setToneFormality(Number(e.target.value))}
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
              onChange={(e) => setToneDescription(e.target.value)}
              placeholder="e.g., Professional but warm"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">Style</h3>

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
          <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">
            Structure
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={leadWithBenefits}
                onChange={(e) => setLeadWithBenefits(e.target.checked)}
                className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-navy-700">Lead with benefits and impact</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSalary}
                onChange={(e) => setIncludeSalary(e.target.checked)}
                className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
              />
              <span className="text-navy-700">Include salary prominently</span>
            </label>
          </div>
        </div>

        {/* Vocabulary Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">
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

        {/* Rules & Constraints */}
        <RulesBuilder
          rules={rules}
          suggestedRules={initialData?.suggestedRules}
          formatGuidance={formatGuidance}
          onRulesChange={setRules}
          onFormatGuidanceChange={setFormatGuidance}
        />
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
