// frontend/src/app/generate/page.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea } from '@/components/ui';
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
  const [copied, setCopied] = useState(false);
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

  const handleCopy = useCallback(async () => {
    if (!result?.generatedJd) return;
    await navigator.clipboard.writeText(result.generatedJd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result?.generatedJd]);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Job Description</h1>
        <p className="text-gray-600 mt-1">
          Fill in the details and we will generate a polished job description for you.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={cn(
                  'w-full rounded-lg border border-gray-300 px-4 py-2',
                  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
                )}
                placeholder="e.g., Senior Software Engineer"
                value={formData.roleTitle}
                onChange={(e) => handleChange('roleTitle', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsibilities <span className="text-red-500">*</span>
              </label>
              <TextArea
                placeholder="Enter each responsibility on a new line..."
                value={formData.responsibilities}
                onChange={(e) => handleChange('responsibilities', e.target.value)}
                rows={5}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements <span className="text-red-500">*</span>
              </label>
              <TextArea
                placeholder="Enter each requirement on a new line..."
                value={formData.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                rows={5}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Optional Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className={cn(
                'w-4 h-4 transition-transform',
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
            <div className="space-y-4 pl-4 border-l-2 border-gray-200">
              <TextArea
                label="Company Description"
                placeholder="Brief description of your company..."
                value={formData.companyDescription}
                onChange={(e) => handleChange('companyDescription', e.target.value)}
                rows={3}
                disabled={isLoading}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Size
                  </label>
                  <input
                    type="text"
                    className={cn(
                      'w-full rounded-lg border border-gray-300 px-4 py-2',
                      'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
                    )}
                    placeholder="e.g., 5-10 people"
                    value={formData.teamSize}
                    onChange={(e) => handleChange('teamSize', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    className={cn(
                      'w-full rounded-lg border border-gray-300 px-4 py-2',
                      'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
                    )}
                    placeholder="e.g., $120k - $160k"
                    value={formData.salaryRange}
                    onChange={(e) => handleChange('salaryRange', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className={cn(
                    'w-full rounded-lg border border-gray-300 px-4 py-2',
                    'focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20'
                  )}
                  placeholder="e.g., Remote, San Francisco, Hybrid"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  disabled={isLoading}
                />
              </div>

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
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate'}
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
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-medium text-red-800">Generation Failed</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Job Description
                </h3>
                <p className="text-sm text-gray-500">
                  {result.wordCount} words
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  Download
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-mono text-sm text-gray-800">
              {result.generatedJd}
            </div>
          </Card>

          {/* Notes */}
          {result.notes && result.notes.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <ul className="space-y-2">
                {result.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
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
                    <span className="text-gray-700">{note}</span>
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
