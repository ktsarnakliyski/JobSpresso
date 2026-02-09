// frontend/src/app/generate/page.tsx

'use client';

import { useState, useCallback, useMemo } from 'react';
import posthog from 'posthog-js';
import { ErrorCard } from '@/components/ui';
import { useGenerate, GenerateInput } from '@/hooks/useGenerate';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { getProfileHints } from '@/lib/validation';
import { GenerateForm, GenerateResult, FormData } from '@/components/generate';

const initialFormData: FormData = {
  roleTitle: '',
  responsibilities: '',
  requirements: '',
  companyDescription: '',
  teamSize: '',
  salaryRange: '',
  location: '',
  benefits: '',
  niceToHave: '',
};

export default function GeneratePage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    isLoaded,
  } = useVoiceProfiles();

  const { generate, isLoading, error, result, reset } = useGenerate();

  // Compute profile hints based on selected profile and form data
  const profileHints = useMemo(() => {
    return getProfileHints(selectedProfile, formData);
  }, [selectedProfile, formData]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!formData.roleTitle.trim() || !formData.responsibilities.trim() || !formData.requirements.trim()) {
      return;
    }

    // Capture generation started event
    posthog.capture('jd_generation_started', {
      role_title: formData.roleTitle.trim(),
      has_voice_profile: !!selectedProfile,
      has_company_description: !!formData.companyDescription.trim(),
      has_salary_range: !!formData.salaryRange.trim(),
      has_location: !!formData.location.trim(),
    });

    const input: GenerateInput = {
      roleTitle: formData.roleTitle.trim(),
      responsibilities: formData.responsibilities
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      requirements: formData.requirements
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (formData.companyDescription.trim()) {
      input.companyDescription = formData.companyDescription.trim();
    }
    if (formData.teamSize.trim()) {
      input.teamSize = formData.teamSize.trim();
    }
    if (formData.salaryRange.trim()) {
      input.salaryRange = formData.salaryRange.trim();
    }
    if (formData.location.trim()) {
      input.location = formData.location.trim();
    }
    if (formData.benefits.trim()) {
      input.benefits = formData.benefits
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (formData.niceToHave.trim()) {
      input.niceToHave = formData.niceToHave
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    await generate(input, selectedProfile || undefined);
  }, [formData, selectedProfile, generate]);

  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    reset();
  }, [reset]);

  // Check if form is valid for keyboard shortcut
  const isFormValid =
    !!formData.roleTitle.trim() &&
    !!formData.responsibilities.trim() &&
    !!formData.requirements.trim();

  // Keyboard shortcut: Cmd/Ctrl+Enter to generate
  useKeyboardShortcut({
    onTrigger: handleGenerate,
    enabled: isFormValid && !isLoading,
  });

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Generate Job Description</h1>
        <p className="text-navy-600 mt-2">
          Fill in the details and we will generate a polished job description for you.
        </p>
      </div>

      {/* Input Form */}
      <GenerateForm
        formData={formData}
        onChange={handleChange}
        onGenerate={handleGenerate}
        onReset={handleReset}
        isLoading={isLoading}
        hasResult={!!result}
        profiles={profiles}
        selectedProfile={selectedProfile}
        selectedProfileId={selectedProfileId}
        onSelectProfile={selectProfile}
        isProfilesLoaded={isLoaded}
        profileHints={profileHints}
      />

      {/* Error Display */}
      {error && <ErrorCard title="Generation Failed" message={error} />}

      {/* Results Section */}
      {result && (
        <GenerateResult
          result={result}
          roleTitle={formData.roleTitle}
        />
      )}
    </div>
  );
}
