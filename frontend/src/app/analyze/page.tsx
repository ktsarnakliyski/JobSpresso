// frontend/src/app/analyze/page.tsx

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import posthog from 'posthog-js';
import { Card, Button, LoadingSpinner, ErrorCard, CopyButton, ProcessingMessages, FullscreenTextArea } from '@/components/ui';
import { VoiceProfileSelector } from '@/components/VoiceProfileSelector';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { AnalysisHistory } from '@/components/AnalysisHistory';
import { useAnalyze } from '@/hooks/useAnalyze';
import { useAnalysisHistory } from '@/hooks/useAnalysisHistory';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import type { AnalysisHistoryEntry } from '@/types/history';

const ANALYZE_MESSAGES = [
  'Analyzing your job description...',
  'Checking for inclusive language...',
  'Evaluating readability...',
  'Assessing structure and completeness...',
  'Comparing to best practices...',
  'Generating improvement suggestions...',
];

// Time to wait for smooth scroll animation to complete before triggering analysis.
// Browser scroll behavior varies, 800ms provides buffer for most devices.
const SCROLL_ANIMATION_DELAY_MS = 800;

const SAMPLE_JD = `Senior Full-Stack Rockstar Developer — Join Our Ninja Team!

We're a fast-moving startup disrupting the B2B SaaS space and we're looking for a 10x engineer who can hit the ground running. If you're passionate about shipping at warp speed and thrive in a high-energy environment, we want you!

What you'll do:
- Own and ship full-stack features end-to-end with minimal guidance
- Work cross-functionally with product, design, and growth teams
- Be a culture carrier and mentor junior engineers
- Architect scalable systems that handle millions of requests

Requirements:
- 5+ years of experience (but we value skills over years)
- Expert-level React, Node.js, TypeScript, PostgreSQL, Redis, Kubernetes, AWS, Docker
- Strong opinions on code quality, testing, and CI/CD pipelines
- Experience with GraphQL, REST APIs, and microservices
- Startup DNA — scrappy, self-directed, and comfortable with ambiguity
- CS degree from a top university preferred

Nice to have:
- Experience with ML/AI integrations
- Open source contributions
- Built something from 0 to 1

What we offer:
- Competitive compensation (salary details shared later in the process)
- Equity with real upside
- Flexible work arrangements
- Unlimited PTO
- Top-tier health benefits
- A team that ships fast and breaks things

We move fast — if this sounds like you, apply now!`;

export default function AnalyzePage() {
  const [jdText, setJdText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const reassessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    isLoaded,
  } = useVoiceProfiles();

  const { analyze, isLoading, error, result, reset } = useAnalyze();
  const lastSavedResultRef = useRef<typeof result>(null);

  const {
    history,
    isLoaded: isHistoryLoaded,
    saveAnalysis,
    deleteEntry,
  } = useAnalysisHistory();

  const handleAnalyze = useCallback(async () => {
    if (!jdText.trim()) return;
    await analyze(jdText, selectedProfile || undefined);
  }, [jdText, selectedProfile, analyze]);

  const handleReassess = useCallback(async () => {
    const textToAnalyze = improvedText || result?.improvedText;
    if (!textToAnalyze?.trim()) return;

    // Capture reassess clicked event
    posthog.capture('jd_reassess_clicked', {
      has_user_edits: improvedText !== result?.improvedText && !!improvedText,
      word_count: textToAnalyze.split(/\s+/).length,
    });

    // 1. Update the input with improved text
    setJdText(textToAnalyze);

    // 2. Scroll to very top with animation (slight delay to let React update)
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 3. Wait for scroll to complete, then analyze
    if (reassessTimeoutRef.current) clearTimeout(reassessTimeoutRef.current);
    reassessTimeoutRef.current = setTimeout(async () => {
      await analyze(textToAnalyze, selectedProfile || undefined);
    }, SCROLL_ANIMATION_DELAY_MS);
  }, [improvedText, result?.improvedText, selectedProfile, analyze]);

  // Cleanup reassess timeout on unmount
  useEffect(() => {
    return () => {
      if (reassessTimeoutRef.current) clearTimeout(reassessTimeoutRef.current);
    };
  }, []);

  const handleReset = useCallback(() => {
    setJdText('');
    setImprovedText('');
    reset();
  }, [reset]);

  const handleRestoreHistory = useCallback((entry: AnalysisHistoryEntry) => {
    setJdText(entry.jdText);

    if (entry.voiceProfileId) {
      selectProfile(entry.voiceProfileId);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectProfile]);

  // Keyboard shortcut: Cmd/Ctrl+Enter to analyze
  useKeyboardShortcut({
    onTrigger: handleAnalyze,
    enabled: !!jdText.trim() && !isLoading,
  });

  // Scroll to results when analysis completes
  useEffect(() => {
    if (result && resultsRef.current) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  // Persist each completed analysis once.
  useEffect(() => {
    if (!result || !jdText.trim()) return;
    if (lastSavedResultRef.current === result) return;

    saveAnalysis(jdText, result, selectedProfileId || undefined);
    lastSavedResultRef.current = result;
  }, [result, jdText, selectedProfileId, saveAnalysis]);

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
          <div className="space-y-1.5">
            <FullscreenTextArea
              label="Job Description"
              placeholder="Paste your job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={10}
              disabled={isLoading}
              showWordCount
            />
            {!jdText && !isLoading && (
              <p className="text-xs text-navy-400">
                No JD on hand?{' '}
                <button
                  type="button"
                  onClick={() => setJdText(SAMPLE_JD)}
                  className="text-teal hover:text-teal/80 underline underline-offset-2 transition-colors"
                >
                  Try with a sample →
                </button>
              </p>
            )}
          </div>

          <VoiceProfileSelector
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelect={selectProfile}
            isLoaded={isLoaded}
          />

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={!jdText.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="-ml-1 mr-2" />
                    Analyzing...
                  </>
                ) : 'Analyze'}
              </Button>
              {(result || jdText) && (
                <Button variant="outline" onClick={handleReset}>
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
                <ProcessingMessages messages={ANALYZE_MESSAGES} />
              </div>
            ) : (
              <p className="text-xs text-navy-400">
                Tip: Press ⌘/Ctrl + Enter to analyze
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorCard title="Analysis Failed" message={error} />}

      {/* Results Section */}
      {result && (
        <div ref={resultsRef} className="space-y-6 animate-fade-up scroll-mt-24">
          <ScoreDisplay result={result} />

          {/* Improved Text */}
          {result.improvedText && (
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-navy-900">
                      Improved Version
                    </h3>
                    <p className="text-sm text-navy-500 mt-0.5">
                      Ready to use or customize further
                    </p>
                  </div>
                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    improvedText && improvedText !== result.improvedText
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-teal/10 text-teal'
                  }`}>
                    {improvedText && improvedText !== result.improvedText ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Your Edits
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Optimized
                      </>
                    )}
                  </span>
                </div>
                <CopyButton text={improvedText || result.improvedText} />
              </div>

              <FullscreenTextArea
                value={improvedText || result.improvedText}
                onChange={(e) => setImprovedText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />

              <div className="mt-5 flex items-center gap-3 pt-4 border-t border-navy-100">
                <Button onClick={handleReassess} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="-ml-1 mr-2" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Score This Version
                    </>
                  )}
                </Button>
                {improvedText && improvedText !== result.improvedText && (
                  <Button
                    variant="ghost"
                    onClick={() => setImprovedText(result.improvedText)}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      <AnalysisHistory
        history={history}
        isLoaded={isHistoryLoaded}
        onRestore={handleRestoreHistory}
        onDelete={deleteEntry}
      />
    </div>
  );
}
