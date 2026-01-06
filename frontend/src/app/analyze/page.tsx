// frontend/src/app/analyze/page.tsx

'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextArea } from '@/components/ui';
import { VoiceProfileSelector } from '@/components/VoiceProfileSelector';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';

export default function AnalyzePage() {
  const [jdText, setJdText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    isLoaded,
  } = useVoiceProfiles();

  const { analyze, isLoading, error, result, reset } = useAnalyze();

  const handleAnalyze = useCallback(async () => {
    if (!jdText.trim()) return;
    await analyze(jdText, selectedProfile || undefined);
  }, [jdText, selectedProfile, analyze]);

  const handleReassess = useCallback(async () => {
    if (!improvedText.trim()) return;
    await analyze(improvedText, selectedProfile || undefined);
  }, [improvedText, selectedProfile, analyze]);

  const handleCopy = useCallback(async () => {
    const textToCopy = improvedText || result?.improvedText || '';
    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [improvedText, result?.improvedText]);

  const handleReset = useCallback(() => {
    setJdText('');
    setImprovedText('');
    reset();
  }, [reset]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analyze Job Description</h1>
        <p className="text-gray-600 mt-1">
          Paste a job description to get a detailed assessment and improvement suggestions.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <div className="space-y-4">
          <TextArea
            label="Job Description"
            placeholder="Paste your job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={10}
            disabled={isLoading}
          />

          <VoiceProfileSelector
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelect={selectProfile}
            isLoaded={isLoaded}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={!jdText.trim() || isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </Button>
            {(result || jdText) && (
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
              <h3 className="font-medium text-red-800">Analysis Failed</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          <ScoreDisplay result={result} />

          {/* Improved Text */}
          {result.improvedText && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Improved Version
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <TextArea
                value={improvedText || result.improvedText}
                onChange={(e) => setImprovedText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />

              {improvedText && improvedText !== result.improvedText && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleReassess} disabled={isLoading}>
                    {isLoading ? 'Reassessing...' : 'Reassess Changes'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setImprovedText(result.improvedText)}
                  >
                    Reset to Original
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
