// frontend/src/app/generate/page.tsx

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, Button, TextArea, Input, LoadingSpinner, ErrorCard, CopyButton } from '@/components/ui';
import { VoiceProfileSelector } from '@/components/VoiceProfileSelector';
import { useGenerate, GenerateInput } from '@/hooks/useGenerate';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { getProfileHints, ProfileHint } from '@/lib/validation';
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
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

  // Refs for scrolling to specific fields
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    isLoaded,
  } = useVoiceProfiles();

  const { generate, isLoading, error, result, reset } = useGenerate();

  // Compute profile hints based on selected profile and form data
  const profileHints = useMemo<ProfileHint[]>(() => {
    return getProfileHints(selectedProfile, formData);
  }, [selectedProfile, formData]);

  // Check if any hints are for optional fields (fields in the collapsible section)
  const optionalFields = useMemo(() =>
    ['companyDescription', 'teamSize', 'salaryRange', 'location', 'benefits', 'niceToHave'],
    []
  );
  const hintsNeedOptionalSection = useMemo(() => {
    return profileHints.some((h) => optionalFields.includes(h.field));
  }, [profileHints, optionalFields]);

  // Auto-expand optional section when profile needs those fields
  useEffect(() => {
    if (hintsNeedOptionalSection && selectedProfile) {
      setShowOptional(true);
    }
    // Note: We intentionally omit showOptional from deps - we only want to auto-expand,
    // not prevent manual collapse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintsNeedOptionalSection, selectedProfile]);

  // Clear highlights after 3 seconds
  useEffect(() => {
    if (highlightedFields.size > 0) {
      const timer = setTimeout(() => {
        setHighlightedFields(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  // Handle "Show me where" - scroll to first missing field and highlight
  const handleShowMeWhere = useCallback(() => {
    if (profileHints.length === 0) return;

    // Expand optional section if needed
    if (hintsNeedOptionalSection && !showOptional) {
      setShowOptional(true);
    }

    // Set highlighted fields
    const fieldsToHighlight = new Set(profileHints.map((h) => h.field));
    setHighlightedFields(fieldsToHighlight);

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Scroll to first field after a short delay (to allow section expansion)
    scrollTimeoutRef.current = setTimeout(() => {
      const firstField = profileHints[0]?.field;
      const ref = fieldRefs.current[firstField];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [profileHints, hintsNeedOptionalSection, showOptional]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Helper to get field highlight class
  const getFieldHighlightClass = (field: string) => {
    if (highlightedFields.has(field)) {
      return 'ring-2 ring-amber-300 border-amber-300';
    }
    return '';
  };

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
    a.download = `${formData.roleTitle.replace(/\s+/g, '_')}_Job_Description.txt`;
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
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Generate Job Description</h1>
        <p className="text-navy-600 mt-2">
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
            className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-900 transition-colors font-medium"
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
            <div className="space-y-5 pl-5 border-l-2 border-navy-200 animate-fade-up">
              <div
                ref={(el) => { fieldRefs.current.companyDescription = el; }}
                className={cn('rounded-xl transition-all duration-300', getFieldHighlightClass('companyDescription'))}
              >
                <TextArea
                  label="Company Description"
                  placeholder="Brief description of your company..."
                  value={formData.companyDescription}
                  onChange={(e) => handleChange('companyDescription', e.target.value)}
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div
                  ref={(el) => { fieldRefs.current.teamSize = el; }}
                  className={cn('rounded-xl transition-all duration-300', getFieldHighlightClass('teamSize'))}
                >
                  <Input
                    label="Team Size"
                    placeholder="e.g., 5-10 people"
                    value={formData.teamSize}
                    onChange={(e) => handleChange('teamSize', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div
                  ref={(el) => { fieldRefs.current.salaryRange = el; }}
                  className={cn('rounded-xl transition-all duration-300', getFieldHighlightClass('salaryRange'))}
                >
                  <Input
                    label="Salary Range"
                    placeholder="e.g., $120k - $160k"
                    value={formData.salaryRange}
                    onChange={(e) => handleChange('salaryRange', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div
                ref={(el) => { fieldRefs.current.location = el; }}
                className={cn('rounded-xl transition-all duration-300', getFieldHighlightClass('location'))}
              >
                <Input
                  label="Location"
                  placeholder="e.g., Remote, San Francisco, Hybrid"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div
                ref={(el) => { fieldRefs.current.benefits = el; }}
                className={cn('rounded-xl transition-all duration-300', getFieldHighlightClass('benefits'))}
              >
                <TextArea
                  label="Benefits"
                  placeholder="Enter each benefit on a new line..."
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div
                ref={(el) => { fieldRefs.current.niceToHave = el; }}
                className={cn('rounded-xl transition-all duration-300', getFieldHighlightClass('niceToHave'))}
              >
                <TextArea
                  label="Nice-to-Have"
                  placeholder="Enter each nice-to-have on a new line..."
                  value={formData.niceToHave}
                  onChange={(e) => handleChange('niceToHave', e.target.value)}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Voice Profile */}
          <VoiceProfileSelector
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelect={selectProfile}
            isLoaded={isLoaded}
          />

          {/* Profile Hints Callout */}
          {profileHints.length > 0 && selectedProfile && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fade-up">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">💡</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 mb-2">
                    Add more context for better results
                  </h4>
                  <div className="space-y-1.5 text-sm text-amber-800">
                    {profileHints.slice(0, 3).map((hint) => (
                      <p key={hint.field} className="flex items-center gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{hint.reason}</span>
                      </p>
                    ))}
                    {profileHints.length > 3 && (
                      <p className="text-amber-600 text-xs">
                        +{profileHints.length - 3} more suggestion{profileHints.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleShowMeWhere}
                    className={cn(
                      'mt-3 text-sm font-medium text-amber-700 hover:text-amber-900',
                      'flex items-center gap-1 transition-colors'
                    )}
                  >
                    Show me where
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

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
                <h3 className="text-lg font-semibold text-navy-900">
                  Generated Job Description
                </h3>
                <p className="text-sm text-navy-500 mt-0.5">
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

            <div className="bg-navy-50 rounded-xl p-5 whitespace-pre-wrap font-mono text-sm text-navy-800 leading-relaxed">
              {result.generatedJd}
            </div>
          </Card>

          {/* Notes */}
          {result.notes && result.notes.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-navy-900 mb-4">Notes</h3>
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
                    <span className="text-navy-700">{note}</span>
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
