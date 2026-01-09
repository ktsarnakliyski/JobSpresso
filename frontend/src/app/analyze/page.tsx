// frontend/src/app/analyze/page.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, Button, TextArea, LoadingSpinner, ErrorCard, CopyButton, ProcessingMessages } from '@/components/ui';
import { VoiceProfileSelector } from '@/components/VoiceProfileSelector';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';

const ANALYZE_MESSAGES = [
  'Analyzing your job description...',
  'Checking for inclusive language...',
  'Evaluating readability...',
  'Assessing structure and completeness...',
  'Comparing to best practices...',
  'Generating improvement suggestions...',
];

export default function AnalyzePage() {
  const [jdText, setJdText] = useState('');
  const [improvedText, setImprovedText] = useState('');

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

  const handleReset = useCallback(() => {
    setJdText('');
    setImprovedText('');
    reset();
  }, [reset]);

  // Keyboard shortcut: Cmd/Ctrl+Enter to analyze
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (jdText.trim() && !isLoading) {
          handleAnalyze();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jdText, isLoading, handleAnalyze]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Analyze Job Description</h1>
        <p className="text-navy-600 mt-2">
          Paste a job description to get a detailed assessment and improvement suggestions.
        </p>
      </div>

      {/* Input Section */}
      <Card className="animate-fade-up [animation-delay:100ms] opacity-0">
        <div className="space-y-5">
          <TextArea
            label="Job Description"
            placeholder="Paste your job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={10}
            disabled={isLoading}
            showWordCount
          />

          <VoiceProfileSelector
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelect={selectProfile}
            isLoaded={isLoaded}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={!jdText.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="-ml-1 mr-2" />
                  <ProcessingMessages messages={ANALYZE_MESSAGES} />
                </>
              ) : 'Analyze'}
            </Button>
            {!isLoading && <span className="text-xs text-navy-400">⌘/Ctrl + Enter</span>}
            {isLoading && <span className="text-xs text-navy-400">Usually takes 10-15 seconds</span>}
            {(result || jdText) && (
              <Button variant="outline" onClick={handleReset}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorCard title="Analysis Failed" message={error} />}

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-up">
          <ScoreDisplay result={result} />

          {/* Improved Text */}
          {result.improvedText && (
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-navy-900">
                    Improved Version
                  </h3>
                  <p className="text-sm text-navy-500 mt-0.5">
                    Edit below and reassess to see your changes scored
                  </p>
                </div>
                <CopyButton text={improvedText || result.improvedText} />
              </div>

              <TextArea
                value={improvedText || result.improvedText}
                onChange={(e) => setImprovedText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />

              {improvedText && improvedText !== result.improvedText && (
                <div className="mt-5 flex gap-3 pt-4 border-t border-navy-100">
                  <Button onClick={handleReassess} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="-ml-1 mr-2" />
                        Reassessing...
                      </>
                    ) : 'Reassess Changes'}
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
