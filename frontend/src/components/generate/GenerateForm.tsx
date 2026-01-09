// frontend/src/components/generate/GenerateForm.tsx

'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, Button, TextArea, Input, LoadingSpinner, ProcessingMessages } from '@/components/ui';
import { VoiceProfileSelector } from '@/components/VoiceProfileSelector';
import { VoiceProfile } from '@/types/voice-profile';
import { ProfileHint } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { OptionalFields } from './OptionalFields';
import { ProfileHintsCallout } from './ProfileHintsCallout';

export interface FormData {
  roleTitle: string;
  responsibilities: string;
  requirements: string;
  companyDescription: string;
  teamSize: string;
  salaryRange: string;
  location: string;
  benefits: string;
  niceToHave: string;
}

interface GenerateFormProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  isLoading: boolean;
  hasResult: boolean;
  profiles: VoiceProfile[];
  selectedProfile: VoiceProfile | null;
  selectedProfileId: string | null;
  onSelectProfile: (id: string | null) => void;
  isProfilesLoaded: boolean;
  profileHints: ProfileHint[];
}

const OPTIONAL_FIELD_NAMES = [
  'companyDescription', 'teamSize', 'salaryRange', 'location', 'benefits', 'niceToHave'
] as const;

const GENERATE_MESSAGES = [
  'Generating your job description...',
  'Crafting compelling introduction...',
  'Structuring responsibilities...',
  'Formatting requirements...',
  'Applying voice profile...',
  'Polishing final output...',
];

export function GenerateForm({
  formData,
  onChange,
  onGenerate,
  onReset,
  isLoading,
  hasResult,
  profiles,
  selectedProfile,
  selectedProfileId,
  onSelectProfile,
  isProfilesLoaded,
  profileHints,
}: GenerateFormProps) {
  const [showOptional, setShowOptional] = React.useState(false);
  const [highlightedFields, setHighlightedFields] = React.useState<Set<string>>(new Set());
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hintsNeedOptionalSection = useMemo(() => {
    return profileHints.some((h) => OPTIONAL_FIELD_NAMES.includes(h.field as typeof OPTIONAL_FIELD_NAMES[number]));
  }, [profileHints]);

  // Auto-expand optional section when profile needs those fields
  useEffect(() => {
    if (hintsNeedOptionalSection && selectedProfile) {
      setShowOptional(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintsNeedOptionalSection, selectedProfile]);

  // Clear highlights after 3 seconds
  useEffect(() => {
    if (highlightedFields.size > 0) {
      const timer = setTimeout(() => setHighlightedFields(new Set()), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Handle "Show me where" - scroll to first missing field and highlight
  const handleShowMeWhere = useCallback(() => {
    if (profileHints.length === 0) return;

    if (hintsNeedOptionalSection && !showOptional) setShowOptional(true);

    setHighlightedFields(new Set(profileHints.map((h) => h.field)));

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      const firstField = profileHints[0]?.field;
      const ref = fieldRefs.current[firstField];
      if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [profileHints, hintsNeedOptionalSection, showOptional]);

  const isFormValid =
    formData.roleTitle.trim() &&
    formData.responsibilities.trim() &&
    formData.requirements.trim();

  return (
    <Card className="animate-fade-up [animation-delay:100ms] opacity-0">
      <div className="space-y-6">
        {/* Required Fields */}
        <div className="space-y-5">
          <Input
            label={<>Role Title <span className="text-red-500">*</span></>}
            placeholder="e.g., Senior Software Engineer"
            value={formData.roleTitle}
            onChange={(e) => onChange('roleTitle', e.target.value)}
            disabled={isLoading}
          />
          <TextArea
            label={<>Responsibilities <span className="text-red-500">*</span></>}
            placeholder="Enter each responsibility on a new line..."
            value={formData.responsibilities}
            onChange={(e) => onChange('responsibilities', e.target.value)}
            rows={5}
            disabled={isLoading}
          />
          <TextArea
            label={<>Requirements <span className="text-red-500">*</span></>}
            placeholder="Enter each requirement on a new line..."
            value={formData.requirements}
            onChange={(e) => onChange('requirements', e.target.value)}
            rows={5}
            disabled={isLoading}
          />
        </div>

        {/* Optional Fields Toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 transition-colors font-medium"
        >
          <svg
            className={cn('w-4 h-4 transition-transform duration-200', showOptional && 'rotate-90')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showOptional ? 'Hide' : 'Show'} Optional Fields
        </button>

        {/* Optional Fields */}
        {showOptional && (
          <OptionalFields
            data={formData}
            onChange={onChange}
            isLoading={isLoading}
            highlightedFields={highlightedFields}
            fieldRefs={fieldRefs}
          />
        )}

        {/* Voice Profile */}
        <VoiceProfileSelector
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelect={onSelectProfile}
          isLoaded={isProfilesLoaded}
        />

        {/* Profile Hints Callout */}
        {selectedProfile && (
          <ProfileHintsCallout hints={profileHints} onShowMeWhere={handleShowMeWhere} />
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <Button onClick={onGenerate} disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="-ml-1 mr-2" />
                  Generating...
                </>
              ) : 'Generate'}
            </Button>
            {(hasResult || formData.roleTitle) && (
              <Button variant="outline" onClick={onReset}>
                Clear
              </Button>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-navy-600 animate-fade-in">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-navy-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-navy-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-navy-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <ProcessingMessages messages={GENERATE_MESSAGES} />
            </div>
          ) : (
            <p className="text-xs text-navy-400">
              Tip: Press ⌘/Ctrl + Enter to generate
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
