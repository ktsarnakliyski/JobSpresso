// frontend/src/components/profiles/CreateProfileWizard.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui';
import {
  PathSelection,
  ExampleUpload,
  VoiceDNAPreview,
  GuidedQuestionnaire,
  VoiceProfileEditor,
  CreationPath,
} from '@/components/voice';
import {
  VoiceProfile,
  VoiceExtractionResult,
  CreationMethod,
} from '@/types/voice-profile';

type WizardStep =
  | 'path-select' // Choose creation path
  | 'examples-upload' // Upload example JDs
  | 'guided' // Answer questionnaire
  | 'preview' // Show extracted voice
  | 'edit'; // Fine-tune profile

interface CreateProfileWizardProps {
  isExtracting: boolean;
  extractError: string | null;
  onExtractFromExamples: (examples: string[]) => Promise<VoiceExtractionResult | null>;
  onResetExtraction: () => void;
  onSaveProfile: (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function CreateProfileWizard({
  isExtracting,
  extractError,
  onExtractFromExamples,
  onResetExtraction,
  onSaveProfile,
  onClose,
}: CreateProfileWizardProps) {
  const [step, setStep] = useState<WizardStep>('path-select');
  const [creationPath, setCreationPath] = useState<CreationPath | null>(null);
  const [extractedVoice, setExtractedVoice] = useState<VoiceExtractionResult | null>(null);
  const [sourceExamples, setSourceExamples] = useState<string[]>([]);

  // Path selection
  const handlePathSelect = useCallback((path: CreationPath) => {
    setCreationPath(path);
    if (path === 'examples') {
      setStep('examples-upload');
    } else {
      setStep('guided');
    }
  }, []);

  // Examples upload
  const handleExamplesSubmit = useCallback(
    async (examples: string[]) => {
      setSourceExamples(examples);
      const result = await onExtractFromExamples(examples);
      if (result) {
        setExtractedVoice(result);
        setStep('preview');
      }
    },
    [onExtractFromExamples]
  );

  // Guided questionnaire complete
  const handleGuidedComplete = useCallback((result: VoiceExtractionResult) => {
    setExtractedVoice(result);
    setStep('preview');
  }, []);

  // Accept extracted voice
  const handleAcceptVoice = useCallback(() => {
    setStep('edit');
  }, []);

  // Go to edit mode
  const handleAdjustVoice = useCallback(() => {
    setStep('edit');
  }, []);

  // Back navigation
  const handleBack = useCallback(() => {
    switch (step) {
      case 'path-select':
        onClose();
        break;
      case 'examples-upload':
      case 'guided':
        setStep('path-select');
        setCreationPath(null);
        break;
      case 'preview':
        if (creationPath === 'examples') {
          setStep('examples-upload');
        } else {
          setStep('guided');
        }
        break;
      case 'edit':
        setStep('preview');
        break;
      default:
        onClose();
    }
  }, [step, creationPath, onClose]);

  // Handle save from editor
  const handleEditorSave = useCallback(
    (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
      onSaveProfile(profile);
      // Reset wizard state
      setStep('path-select');
      setCreationPath(null);
      setExtractedVoice(null);
      setSourceExamples([]);
      onResetExtraction();
      onClose();
    },
    [onSaveProfile, onResetExtraction, onClose]
  );

  // Handle back from editor
  const handleEditorBack = useCallback(() => {
    setStep('preview');
  }, []);

  // Wizard steps
  if (step === 'path-select') {
    return (
      <div className="space-y-8">
        <Card className="animate-scale-in">
          <PathSelection onSelect={handlePathSelect} />
        </Card>
      </div>
    );
  }

  if (step === 'examples-upload') {
    return (
      <div className="space-y-8">
        <Card className="animate-scale-in">
          <ExampleUpload
            onSubmit={handleExamplesSubmit}
            onBack={handleBack}
            isLoading={isExtracting}
          />
          {extractError && (
            <p className="mt-4 text-sm text-red-600">{extractError}</p>
          )}
        </Card>
      </div>
    );
  }

  if (step === 'guided') {
    return (
      <div className="space-y-8">
        <Card className="animate-scale-in">
          <GuidedQuestionnaire
            onComplete={handleGuidedComplete}
            onBack={handleBack}
          />
        </Card>
      </div>
    );
  }

  if (step === 'preview' && extractedVoice) {
    return (
      <div className="space-y-8">
        <div className="animate-scale-in">
          <VoiceDNAPreview
            result={extractedVoice}
            onAccept={handleAcceptVoice}
            onAdjust={handleAdjustVoice}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  if (step === 'edit') {
    return (
      <div className="space-y-8">
        <Card className="animate-scale-in">
          <VoiceProfileEditor
            initialData={extractedVoice || undefined}
            createdVia={(creationPath as CreationMethod) ?? 'manual'}
            sourceExamples={sourceExamples}
            onSave={handleEditorSave}
            onBack={handleEditorBack}
          />
        </Card>
      </div>
    );
  }

  return null;
}
