// frontend/src/components/voice/VoiceProfileEditor.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea, BackButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  VoiceProfile,
  VoiceExtractionResult,
  ProfileRule,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
  CreationMethod,
} from '@/types/voice-profile';
import { RulesBuilder } from './RulesBuilder';
import {
  ToneSection,
  StyleSection,
  StructureSection,
  VocabularySection,
} from './editor';

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
        <ToneSection
          toneFormality={toneFormality}
          toneDescription={toneDescription}
          onToneFormalityChange={setToneFormality}
          onToneDescriptionChange={setToneDescription}
        />

        {/* Style Section */}
        <StyleSection
          addressStyle={addressStyle}
          sentenceStyle={sentenceStyle}
          onAddressStyleChange={setAddressStyle}
          onSentenceStyleChange={setSentenceStyle}
        />

        {/* Structure Section */}
        <StructureSection
          leadWithBenefits={leadWithBenefits}
          includeSalary={includeSalary}
          onLeadWithBenefitsChange={setLeadWithBenefits}
          onIncludeSalaryChange={setIncludeSalary}
        />

        {/* Vocabulary Section */}
        <VocabularySection
          wordsToPrefer={wordsToPrefer}
          wordsToAvoid={wordsToAvoid}
          onWordsToPreferChange={setWordsToPrefer}
          onWordsToAvoidChange={setWordsToAvoid}
        />

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
