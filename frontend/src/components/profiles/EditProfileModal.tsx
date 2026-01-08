// frontend/src/components/profiles/EditProfileModal.tsx

'use client';

import { useCallback } from 'react';
import { Card } from '@/components/ui';
import { VoiceProfileEditor } from '@/components/voice';
import {
  VoiceProfile,
  VoiceExtractionResult,
} from '@/types/voice-profile';

interface EditProfileModalProps {
  profile: VoiceProfile;
  onSave: (id: string, updates: Partial<VoiceProfile>) => void;
  onClose: () => void;
}

export function EditProfileModal({
  profile,
  onSave,
  onClose,
}: EditProfileModalProps) {
  // Convert existing profile to VoiceExtractionResult format for editor
  const initialDataForEditor: VoiceExtractionResult = {
    tone: profile.tone,
    toneFormality: profile.toneFormality,
    toneDescription: profile.toneDescription,
    addressStyle: profile.addressStyle,
    sentenceStyle: profile.sentenceStyle,
    structureAnalysis: {
      leadsWithBenefits: profile.structurePreferences?.leadWithBenefits ?? false,
      typicalSectionOrder: profile.structurePreferences?.sectionOrder ?? [],
      includesSalary: profile.structurePreferences?.includeSalaryProminently ?? false,
    },
    vocabulary: {
      commonlyUsed: profile.wordsToPrefer ?? [],
      notablyAvoided: profile.wordsToAvoid ?? [],
    },
    brandSignals: {
      values: profile.brandValues ?? [],
      personality: '',
    },
    suggestedRules: (profile.rules ?? []).map((r) => ({
      text: r.text,
      ruleType: r.ruleType,
      target: r.target,
      value: r.value,
      confidence: 1,
      evidence: '',
    })),
    formatGuidance: profile.formatGuidance,
    summary: profile.toneDescription,
  };

  // Handle save for existing profile
  const handleEditorSave = useCallback(
    (updatedProfile: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
      onSave(profile.id, updatedProfile);
      onClose();
    },
    [profile.id, onSave, onClose]
  );

  return (
    <div className="space-y-8">
      <Card className="animate-scale-in">
        <VoiceProfileEditor
          initialData={initialDataForEditor}
          createdVia={profile.createdVia ?? 'manual'}
          sourceExamples={profile.sourceExamples ?? []}
          existingName={profile.name}
          onSave={handleEditorSave}
          onBack={onClose}
        />
      </Card>
    </div>
  );
}
