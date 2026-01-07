// frontend/src/app/profiles/page.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, Button, Badge, Modal, ConfirmDialog } from '@/components/ui';
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
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  CreationMethod,
  RuleType,
} from '@/types/voice-profile';
import { cn } from '@/lib/utils';

// Icons for rule types
const RULE_TYPE_ICONS: Record<RuleType, string> = {
  exclude: '🚫',
  include: '✓',
  format: '📝',
  order: '↕️',
  limit: '#',
  custom: '⚙️',
};

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
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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
  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      deleteProfile(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteProfile]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const handleSetDefault = useCallback(
    (id: string) => {
      updateProfile(id, { isDefault: true });
    },
    [updateProfile]
  );

  // Edit existing profile
  const handleEdit = useCallback(
    (id: string) => {
      setEditingProfileId(id);
      setCreationPath(null);
      setExtractedVoice(null);
      setStep('edit');
    },
    []
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
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Voice Profiles</h1>
          <p className="text-navy-600 mt-2">Loading...</p>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-navy-100 rounded-2xl shimmer" />
          <div className="h-32 bg-navy-100 rounded-2xl shimmer" />
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
    // Find the profile being edited (if editing an existing one)
    const editingProfile = editingProfileId
      ? profiles.find((p) => p.id === editingProfileId)
      : null;

    // Convert existing profile to VoiceExtractionResult format for editor
    const initialDataForEditor: VoiceExtractionResult | undefined = editingProfile
      ? {
          tone: editingProfile.tone,
          toneFormality: editingProfile.toneFormality,
          toneDescription: editingProfile.toneDescription,
          addressStyle: editingProfile.addressStyle,
          sentenceStyle: editingProfile.sentenceStyle,
          structureAnalysis: {
            leadsWithBenefits: editingProfile.structurePreferences?.leadWithBenefits ?? false,
            typicalSectionOrder: editingProfile.structurePreferences?.sectionOrder ?? [],
            includesSalary: editingProfile.structurePreferences?.includeSalaryProminently ?? false,
          },
          vocabulary: {
            commonlyUsed: editingProfile.wordsToPrefer ?? [],
            notablyAvoided: editingProfile.wordsToAvoid ?? [],
          },
          brandSignals: {
            values: editingProfile.brandValues ?? [],
            personality: '',
          },
          suggestedRules: (editingProfile.rules ?? []).map((r) => ({
            text: r.text,
            ruleType: r.ruleType,
            target: r.target,
            value: r.value,
            confidence: 1,
            evidence: '',
          })),
          formatGuidance: editingProfile.formatGuidance,
          summary: editingProfile.toneDescription,
        }
      : extractedVoice || undefined;

    // Handle save for both new and existing profiles
    const handleEditorSave = (profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
      if (editingProfileId) {
        // Update existing profile
        updateProfile(editingProfileId, profile);
      } else {
        // Create new profile
        addProfile(profile);
      }
      // Reset wizard state
      setStep('list');
      setCreationPath(null);
      setExtractedVoice(null);
      setSourceExamples([]);
      setEditingProfileId(null);
      resetExtraction();
    };

    // Handle back navigation for edit mode
    const handleEditorBack = () => {
      if (editingProfileId) {
        // Editing existing - go back to list
        setStep('list');
        setEditingProfileId(null);
      } else if (creationPath) {
        // Creating new - go back to preview
        setStep('preview');
      } else {
        setStep('list');
      }
    };

    return (
      <div className="space-y-8">
        <Card className="animate-scale-in">
          <VoiceProfileEditor
            initialData={initialDataForEditor}
            createdVia={editingProfile?.createdVia ?? (creationPath as CreationMethod) ?? 'manual'}
            sourceExamples={editingProfile?.sourceExamples ?? sourceExamples}
            existingName={editingProfile?.name}
            onSave={handleEditorSave}
            onBack={handleEditorBack}
          />
        </Card>
      </div>
    );
  }

  // Get profile name for delete confirmation
  const profileToDelete = deleteConfirmId ? profiles.find(p => p.id === deleteConfirmId) : null;

  // Default: Profiles list
  return (
    <>
    <div className="space-y-8">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Voice Profiles</h1>
          <p className="text-navy-600 mt-2">
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
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-navy-500"
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
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              Capture Your Voice
            </h3>
            <p className="text-navy-600 mb-6 max-w-sm mx-auto">
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
              onDelete={handleDeleteRequest}
              onSetDefault={handleSetDefault}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      isOpen={!!deleteConfirmId}
      onConfirm={handleDeleteConfirm}
      onCancel={handleDeleteCancel}
      title="Delete Profile"
      message={profileToDelete
        ? `Are you sure you want to delete "${profileToDelete.name}"? This action cannot be undone.`
        : 'Are you sure you want to delete this profile? This action cannot be undone.'
      }
      confirmLabel="Delete"
      cancelLabel="Keep it"
      variant="destructive"
    />
    </>
  );
}

interface ProfileCardProps {
  profile: VoiceProfile;
  index: number;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onEdit: (id: string) => void;
}

function ProfileCard({ profile, index, onDelete, onSetDefault, onEdit }: ProfileCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Count active rules
  const activeRulesCount = profile.rules?.filter(r => r.active)?.length ?? 0;

  // Get style labels
  const addressLabel = ADDRESS_OPTIONS.find(o => o.value === profile.addressStyle)?.label || 'Direct (You/Your)';
  const sentenceLabel = SENTENCE_OPTIONS.find(o => o.value === profile.sentenceStyle)?.label || 'Balanced';

  return (
    <>
      <Card
        hover
        className={cn(
          'animate-fade-up opacity-0',
          `[animation-delay:${(index + 1) * 50}ms]`
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header with name and badges */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-navy-900 truncate">
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

            {/* Tone and style summary */}
            <p className="text-navy-700 mb-3">
              {profile.toneDescription || FORMALITY_LABELS[profile.toneFormality] || 'Professional'}
              <span className="text-navy-400 mx-2">•</span>
              {addressLabel}
            </p>

            {/* Voice DNA Summary - key differentiators */}
            <div className="bg-navy-50/70 rounded-xl px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-navy-600">
                {activeRulesCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span>📋</span>
                    <span>{activeRulesCount} rule{activeRulesCount !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {profile.formatGuidance && (
                  <span className="flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Format guidance</span>
                  </span>
                )}
                {profile.brandValues && profile.brandValues.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span>💎</span>
                    <span>{profile.brandValues.length} value{profile.brandValues.length !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {profile.structurePreferences?.leadWithBenefits && (
                  <span className="flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Benefits-first</span>
                  </span>
                )}
                {!activeRulesCount && !profile.formatGuidance && !(profile.brandValues?.length) && !profile.structurePreferences?.leadWithBenefits && (
                  <span className="text-navy-400">Basic profile</span>
                )}
              </div>
              <button
                onClick={() => setShowDetails(true)}
                className="mt-2 text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1 transition-colors"
              >
                View details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onEdit(profile.id)}>
              Edit
            </Button>
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

      {/* Profile Detail Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={profile.name}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            <Button onClick={() => { setShowDetails(false); onEdit(profile.id); }}>
              Edit Profile
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Rules Section */}
          {activeRulesCount > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Rules ({activeRulesCount} active)
              </h4>
              <div className="bg-navy-50 rounded-xl p-4 space-y-2">
                {profile.rules?.filter(r => r.active).map(rule => (
                  <div key={rule.id} className="flex items-start gap-2 text-sm">
                    <span className="text-base mt-0.5">{RULE_TYPE_ICONS[rule.ruleType]}</span>
                    <span className="text-navy-800">{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Format Guidance Section */}
          {profile.formatGuidance && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Format Guidance
              </h4>
              <div className="bg-navy-50 rounded-xl p-4">
                <p className="text-sm text-navy-700 italic">&quot;{profile.formatGuidance}&quot;</p>
              </div>
            </div>
          )}

          {/* Style Settings Section */}
          <div>
            <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
              Style Settings
            </h4>
            <div className="bg-navy-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-600">Formality</span>
                <span className="text-navy-800 font-medium">
                  {profile.toneDescription || FORMALITY_LABELS[profile.toneFormality]} ({profile.toneFormality}/5)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600">Address Style</span>
                <span className="text-navy-800 font-medium">{addressLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600">Sentences</span>
                <span className="text-navy-800 font-medium">{sentenceLabel}</span>
              </div>
              {profile.structurePreferences?.leadWithBenefits && (
                <div className="flex justify-between">
                  <span className="text-navy-600">Structure</span>
                  <span className="text-navy-800 font-medium">Benefits-first</span>
                </div>
              )}
              {profile.structurePreferences?.includeSalaryProminently && (
                <div className="flex justify-between">
                  <span className="text-navy-600">Salary</span>
                  <span className="text-navy-800 font-medium">Include prominently</span>
                </div>
              )}
            </div>
          </div>

          {/* Vocabulary Section */}
          {((profile.wordsToPrefer?.length ?? 0) > 0 || (profile.wordsToAvoid?.length ?? 0) > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Vocabulary
              </h4>
              <div className="bg-navy-50 rounded-xl p-4 space-y-3">
                {(profile.wordsToPrefer?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs text-navy-500 uppercase tracking-wide">Prefer</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.wordsToPrefer?.map(word => (
                        <Badge key={word} variant="success" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.wordsToAvoid?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs text-navy-500 uppercase tracking-wide">Avoid</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.wordsToAvoid?.map(word => (
                        <Badge key={word} variant="warning" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Values Section */}
          {profile.brandValues && profile.brandValues.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Brand Values
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.brandValues.map(value => (
                  <Badge key={value} variant="info">{value}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
