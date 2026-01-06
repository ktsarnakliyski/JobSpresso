// frontend/src/app/generate/page.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea, Input, LoadingSpinner, ErrorCard, CopyButton } from '@/components/ui';
import { VoiceProfileSelector } from '@/components/VoiceProfileSelector';
import { useGenerate, GenerateInput } from '@/hooks/useGenerate';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { cn } from '@/lib/utils';

interface FormData {
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
  const [showOptional, setShowOptional] = useState(false);

  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    isLoaded,
  } = useVoiceProfiles();

  const { generate, isLoading, error, result, reset } = useGenerate();

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!formData.roleTitle.trim() || !formData.responsibilities.trim() || !formData.requirements.trim()) {
      return;
    }

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

  const handleDownload = useCallback(() => {
    if (!result?.generatedJd) return;

    const blob = new Blob([result.generatedJd], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.roleTitle.replace(/\s+/g, '_')}_JD.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result?.generatedJd, formData.roleTitle]);

  const handleReset = useCallback(() => {
    setFormData(initialFormData);
    reset();
  }, [reset]);

  const isFormValid =
    formData.roleTitle.trim() &&
    formData.responsibilities.trim() &&
    formData.requirements.trim();

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-espresso-900 tracking-tight">Generate Job Description</h1>
        <p className="text-espresso-600 mt-2">
          Fill in the details and we will generate a polished job description for you.
        </p>
      </div>

      {/* Input Form */}
      <Card className="animate-fade-up [animation-delay:100ms] opacity-0">
        <div className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-5">
            <Input
              label={<>Role Title <span className="text-red-500">*</span></>}
              placeholder="e.g., Senior Software Engineer"
              value={formData.roleTitle}
              onChange={(e) => handleChange('roleTitle', e.target.value)}
              disabled={isLoading}
            />

            <TextArea
              label={<>Responsibilities <span className="text-red-500">*</span></>}
              placeholder="Enter each responsibility on a new line..."
              value={formData.responsibilities}
              onChange={(e) => handleChange('responsibilities', e.target.value)}
              rows={5}
              disabled={isLoading}
            />

            <TextArea
              label={<>Requirements <span className="text-red-500">*</span></>}
              placeholder="Enter each requirement on a new line..."
              value={formData.requirements}
              onChange={(e) => handleChange('requirements', e.target.value)}
              rows={5}
              disabled={isLoading}
            />
          </div>

          {/* Optional Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-espresso-600 hover:text-espresso-900 transition-colors font-medium"
          >
            <svg
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                showOptional && 'rotate-90'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {showOptional ? 'Hide' : 'Show'} Optional Fields
          </button>

          {/* Optional Fields */}
          {showOptional && (
            <div className="space-y-5 pl-5 border-l-2 border-espresso-200 animate-fade-up">
              <TextArea
                label="Company Description"
                placeholder="Brief description of your company..."
                value={formData.companyDescription}
                onChange={(e) => handleChange('companyDescription', e.target.value)}
                rows={3}
                disabled={isLoading}
              />

              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  label="Team Size"
                  placeholder="e.g., 5-10 people"
                  value={formData.teamSize}
                  onChange={(e) => handleChange('teamSize', e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  label="Salary Range"
                  placeholder="e.g., $120k - $160k"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange('salaryRange', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Input
                label="Location"
                placeholder="e.g., Remote, San Francisco, Hybrid"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                disabled={isLoading}
              />

              <TextArea
                label="Benefits"
                placeholder="Enter each benefit on a new line..."
                value={formData.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                rows={3}
                disabled={isLoading}
              />

              <TextArea
                label="Nice-to-Have"
                placeholder="Enter each nice-to-have on a new line..."
                value={formData.niceToHave}
                onChange={(e) => handleChange('niceToHave', e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Voice Profile */}
          <VoiceProfileSelector
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelect={selectProfile}
            isLoaded={isLoaded}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="-ml-1 mr-2" />
                  Generating...
                </>
              ) : 'Generate'}
            </Button>
            {(result || formData.roleTitle) && (
              <Button variant="outline" onClick={handleReset}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorCard title="Generation Failed" message={error} />}

      {/* Results Section */}
      {result && (
        <div className="space-y-5 animate-fade-up">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-espresso-900">
                  Generated Job Description
                </h3>
                <p className="text-sm text-espresso-500 mt-0.5">
                  {result.wordCount} words
                </p>
              </div>
              <div className="flex gap-2">
                <CopyButton text={result.generatedJd} />
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Button>
              </div>
            </div>

            <div className="bg-espresso-50 rounded-xl p-5 whitespace-pre-wrap font-mono text-sm text-espresso-800 leading-relaxed">
              {result.generatedJd}
            </div>
          </Card>

          {/* Notes */}
          {result.notes && result.notes.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-espresso-900 mb-4">Notes</h3>
              <ul className="space-y-3">
                {result.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-espresso-700">{note}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
