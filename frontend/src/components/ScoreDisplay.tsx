// frontend/src/components/ScoreDisplay.tsx

'use client';

import { useRef, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui';
import { CircularScore } from '@/components/CircularScore';
import { ActionSummary } from '@/components/ActionSummary';
import { IssuesPanel, IssuesPanelRef } from '@/components/IssuesPanel';
import { QuestionCoverageSection } from '@/components/QuestionCoverage';
import { CategoryEvidenceSection } from '@/components/CategoryEvidence';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  AssessmentResult,
  AssessmentCategory,
  EvidenceStatus,
  FixabilityGroup,
} from '@/types/assessment';

interface ScoreDisplayProps {
  result: AssessmentResult;
}

// Smart defaults for Zone 3 sections based on score
// Questions and Categories are important for understanding the analysis
function getZone3Defaults(score: number) {
  if (score >= 80) {
    // Excellent: show positives and questions (what candidates want to know)
    return { positives: true, questions: true, categories: false };
  }
  if (score >= 60) {
    // Good: show questions to help improve further
    return { positives: false, questions: true, categories: false };
  }
  // Needs work or poor: show questions and categories to understand what's missing
  return { positives: false, questions: true, categories: true };
}

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  const {
    overallScore,
    interpretation,
    categoryEvidence,
    questionCoverage,
    questionsAnswered,
    questionsTotal,
    questionCoveragePercent,
    estimatedApplicationBoost,
    issues,
    positives,
  } = result;

  const issuesPanelRef = useRef<IssuesPanelRef>(null);
  const zone3Defaults = getZone3Defaults(overallScore);

  // Build category statuses for ActionSummary
  const categoryStatuses = useMemo(() => {
    const statuses: Record<AssessmentCategory, EvidenceStatus> = {} as Record<AssessmentCategory, EvidenceStatus>;
    if (categoryEvidence) {
      Object.entries(categoryEvidence).forEach(([cat, evidence]) => {
        if (evidence?.status) {
          statuses[cat as AssessmentCategory] = evidence.status;
        }
      });
    }
    return statuses;
  }, [categoryEvidence]);

  // Handle chip click to scroll to issue group
  const handleChipClick = useCallback((group: FixabilityGroup) => {
    issuesPanelRef.current?.scrollToGroup(group);
  }, []);

  return (
    <div className="space-y-6">
      {/* ===== ZONE 1: COMMAND CENTER (Sticky) ===== */}
      <div className="sticky top-0 z-10 -mx-1 px-1 pt-1 -mt-1">
        <Card className={cn(
          'backdrop-blur-sm bg-white/95',
          'shadow-soft transition-shadow duration-200'
        )}>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Compact Circular Score */}
            <CircularScore
              score={overallScore}
              interpretation={interpretation}
              size="md"
              showLabel={true}
              estimatedBoost={estimatedApplicationBoost}
            />

            {/* Action Summary */}
            <div className="flex-1 w-full">
              <ActionSummary
                issues={issues}
                categoryStatuses={categoryStatuses}
                onChipClick={issues.length > 0 ? handleChipClick : undefined}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ===== ZONE 2: ACTION PANEL (Primary Focus) ===== */}
      {issues.length > 0 && (
        <IssuesPanel
          ref={issuesPanelRef}
          issues={issues}
          overallScore={overallScore}
        />
      )}

      {/* ===== ZONE 3: DEEP DIVE (Collapsible) ===== */}
      {/* Ordered by actionability: Questions (what to add) > Categories (what to fix) > Positives (what's good) */}
      <div className="space-y-4">
        {/* Question Coverage - Most actionable: shows what's missing */}
        {questionCoverage && questionCoverage.length > 0 && (
          <Card padding="none">
            <CollapsibleSection
              title="Question Coverage"
              subtitle="Does your posting answer what candidates want to know?"
              badge={
                <span className={cn(
                  'text-sm font-medium tabular-nums',
                  questionCoveragePercent >= 70 ? 'text-emerald-600' :
                  questionCoveragePercent >= 50 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {questionsAnswered}/{questionsTotal} ({questionCoveragePercent}%)
                </span>
              }
              defaultOpen={zone3Defaults.questions}
              headerClassName="px-6"
            >
              <div className="px-6">
                <QuestionCoverageSection
                  questions={questionCoverage}
                  coveragePercent={questionCoveragePercent}
                />
              </div>
            </CollapsibleSection>
          </Card>
        )}

        {/* Category Evidence Breakdown - Shows strengths/weaknesses by area */}
        {categoryEvidence && Object.keys(categoryEvidence).length > 0 && (
          <Card padding="none">
            <CollapsibleSection
              title="Category Breakdown"
              badge={
                <span className="text-sm text-navy-500">
                  {Object.keys(categoryEvidence).length} categories
                </span>
              }
              defaultOpen={zone3Defaults.categories}
              headerClassName="px-6"
            >
              <div className="px-6">
                <CategoryEvidenceSection categoryEvidence={categoryEvidence} />
              </div>
            </CollapsibleSection>
          </Card>
        )}

        {/* Positives - What's working well */}
        {positives.length > 0 && (
          <Card padding="none">
            <CollapsibleSection
              title="What's Working Well"
              badge={
                <span className="text-sm text-emerald-600 font-medium">
                  {positives.length} strengths
                </span>
              }
              defaultOpen={zone3Defaults.positives}
              headerClassName="px-6"
            >
              <div className="px-6">
                <ul className="space-y-3">
                  {positives.map((positive, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-navy-700">{positive}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleSection>
          </Card>
        )}
      </div>
    </div>
  );
}
