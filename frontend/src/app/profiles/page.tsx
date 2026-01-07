// frontend/src/app/profiles/page.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { useVoiceExtraction } from '@/hooks/useVoiceExtraction';
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
  FORMALITY_LABELS,
  CreationMethod,
} from '@/types/voice-profile';
import { cn } from '@/lib/utils';

type WizardStep =
  | 'list' // Show profiles list
  | 'path-select' // Choose creation path
  | 'examples-upload' // Upload example JDs
  | 'guided' // Answer questionnaire
  | 'preview' // Show extracted voice
  | 'edit'; // Fine-tune profile

export default function ProfilesPage() {
  const [step, setStep] = useState<WizardStep>('list');
  const [creationPath, setCreationPath] = useState<CreationPath | null>(null);
  const [extractedVoice, setExtractedVoice] = useState<VoiceExtractionResult | null>(null);
  const [sourceExamples, setSourceExamples] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profiles,
    isLoaded,
    addProfile,
    updateProfile,
    deleteProfile,
    exportProfiles,
    importProfiles,
  } = useVoiceProfiles();

  const { isExtracting, error: extractError, extractFromExamples, reset: resetExtraction } = useVoiceExtraction();

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
      const result = await extractFromExamples(examples);
      if (result) {
        setExtractedVoice(result);
        setStep('preview');
      }
    },
    [extractFromExamples]
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

  // Save profile
  const handleSaveProfile = useCallback(
    (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
      addProfile(profile);
      // Reset wizard state
      setStep('list');
      setCreationPath(null);
      setExtractedVoice(null);
      setSourceExamples([]);
      resetExtraction();
    },
    [addProfile, resetExtraction]
  );

  // Back navigation
  const handleBack = useCallback(() => {
    switch (step) {
      case 'path-select':
        setStep('list');
        setCreationPath(null);
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
        setStep('list');
    }
  }, [step, creationPath]);

  // Profile actions
  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this profile?')) {
        deleteProfile(id);
      }
    },
    [deleteProfile]
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      updateProfile(id, { isDefault: true });
    },
    [updateProfile]
  );

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importProfiles(event.target?.result as string);
        if (result.success) {
          setImportError(null);
        } else {
          setImportError(result.error || 'Import failed');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importProfiles]
  );

  const startCreation = useCallback(() => {
    setStep('path-select');
  }, []);

  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-espresso-900 tracking-tight">Voice Profiles</h1>
          <p className="text-espresso-600 mt-2">Loading...</p>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-espresso-100 rounded-2xl shimmer" />
          <div className="h-32 bg-espresso-100 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

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
            createdVia={(creationPath as CreationMethod) || 'manual'}
            sourceExamples={sourceExamples}
            onSave={handleSaveProfile}
            onBack={handleBack}
          />
        </Card>
      </div>
    );
  }

  // Default: Profiles list
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-espresso-900 tracking-tight">Voice Profiles</h1>
          <p className="text-espresso-600 mt-2">
            Capture your unique writing style for consistent job descriptions.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          {profiles.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={exportProfiles}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Import
              </Button>
            </>
          )}
          <Button onClick={startCreation}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Profile
          </Button>
        </div>
      </div>

      {importError && (
        <Card className="border-red-200 bg-red-50 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700">{importError}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportError(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {profiles.length === 0 ? (
        <Card className="animate-fade-up [animation-delay:100ms] opacity-0">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-espresso-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-espresso-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-espresso-900 mb-2">
              Capture Your Voice
            </h3>
            <p className="text-espresso-600 mb-6 max-w-sm mx-auto">
              Create a voice profile to ensure all your job descriptions sound authentically you.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startCreation}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Profile
              </Button>
              <Button variant="outline" onClick={handleImport}>
                Import Profiles
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile, index) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              index={index}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProfileCardProps {
  profile: VoiceProfile;
  index: number;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

function ProfileCard({ profile, index, onDelete, onSetDefault }: ProfileCardProps) {
  return (
    <Card
      hover
      className={cn(
        'animate-fade-up opacity-0',
        `[animation-delay:${(index + 1) * 50}ms]`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-espresso-900 truncate">
              {profile.name}
            </h3>
            {profile.isDefault && <Badge variant="success">Default</Badge>}
            {profile.createdVia === 'examples' && (
              <Badge variant="info" className="text-xs">From Examples</Badge>
            )}
            {profile.createdVia === 'guided' && (
              <Badge variant="info" className="text-xs">Guided</Badge>
            )}
          </div>

          {/* Voice DNA Summary */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="default">
              {profile.toneDescription || FORMALITY_LABELS[profile.toneFormality] || 'Professional'}
            </Badge>
            {profile.structurePreferences?.leadWithBenefits && (
              <Badge variant="default">Benefits-first</Badge>
            )}
            {profile.brandValues && profile.brandValues.length > 0 && (
              <Badge variant="default">{profile.brandValues.length} values</Badge>
            )}
          </div>

          {/* Vocabulary preview */}
          {((profile.wordsToAvoid?.length ?? 0) > 0 || (profile.wordsToPrefer?.length ?? 0) > 0) && (
            <div className="text-sm text-espresso-600 space-y-1">
              {(profile.wordsToAvoid?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium text-espresso-700">Avoid:</span>{' '}
                  {profile.wordsToAvoid?.slice(0, 5).join(', ')}
                  {(profile.wordsToAvoid?.length ?? 0) > 5 && (
                    <span className="text-espresso-500"> +{(profile.wordsToAvoid?.length ?? 0) - 5} more</span>
                  )}
                </p>
              )}
              {(profile.wordsToPrefer?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium text-espresso-700">Prefer:</span>{' '}
                  {profile.wordsToPrefer?.slice(0, 5).join(', ')}
                  {(profile.wordsToPrefer?.length ?? 0) > 5 && (
                    <span className="text-espresso-500"> +{(profile.wordsToPrefer?.length ?? 0) - 5} more</span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4 flex-shrink-0">
          {!profile.isDefault && (
            <Button variant="ghost" size="sm" onClick={() => onSetDefault(profile.id)}>
              Set Default
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(profile.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
