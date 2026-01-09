// frontend/src/components/QuestionCoverage.tsx

'use client';

import { useState, memo } from 'react';
import { Card } from '@/components/ui';
import { CheckIcon, QuestionIcon, ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { getProgressBarColor, getQuestionImportanceConfig } from '@/lib/status-config';
import { QuestionCoverage as QuestionCoverageType, QuestionImportance } from '@/types/assessment';

interface QuestionCoverageProps {
  questions: QuestionCoverageType[];
  questionsAnswered: number;
  questionsTotal: number;
  coveragePercent: number;
}

const IMPORTANCE_ORDER: QuestionImportance[] = ['high', 'medium', 'low'];

// Shared internal component for question groups content
interface QuestionGroupsContentProps {
  questions: QuestionCoverageType[];
  coveragePercent: number;
  showProgressBar?: boolean;
  spacing?: 'sm' | 'md';
}

function QuestionGroupsContent({
  questions,
  coveragePercent,
  showProgressBar = true,
  spacing = 'md',
}: QuestionGroupsContentProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<QuestionImportance>>(
    new Set<QuestionImportance>(['high', 'medium'])
  );

  // Group questions by importance
  const groupedQuestions = questions.reduce(
    (acc, q) => {
      const importance = q.importance as QuestionImportance;
      if (!acc[importance]) acc[importance] = [];
      acc[importance].push(q);
      return acc;
    },
    {} as Record<QuestionImportance, QuestionCoverageType[]>
  );

  const toggleGroup = (importance: QuestionImportance) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(importance)) {
        next.delete(importance);
      } else {
        next.add(importance);
      }
      return next;
    });
  };

  return (
    <>
      {/* Progress bar */}
      {showProgressBar && (
        <div className={cn('h-3 bg-navy-100 rounded-full overflow-hidden', spacing === 'sm' ? 'mb-4' : 'mb-6')}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out-expo"
            style={{
              width: `${coveragePercent}%`,
              backgroundColor: getProgressBarColor(coveragePercent).hex,
            }}
          />
        </div>
      )}

      {/* Question groups */}
      <div className={cn(spacing === 'sm' ? 'space-y-3' : 'space-y-4')}>
        {IMPORTANCE_ORDER.map((importance) => {
          const questionsInGroup = groupedQuestions[importance] || [];
          if (questionsInGroup.length === 0) return null;

          const config = getQuestionImportanceConfig(importance);
          const isExpanded = expandedGroups.has(importance);
          const answeredInGroup = questionsInGroup.filter((q) => q.isAnswered).length;

          const groupId = `question-group-${importance}`;

          return (
            <div key={importance} className="border border-navy-200/60 rounded-xl overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(importance)}
                aria-expanded={isExpanded}
                aria-controls={groupId}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3',
                  'hover:bg-navy-50/50 transition-colors',
                  config.bgColor
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-semibold', config.color)}>
                    {config.label}
                  </span>
                  <span className="text-sm text-navy-500">
                    {answeredInGroup}/{questionsInGroup.length} answered
                  </span>
                </div>
                <ChevronDownIcon isExpanded={isExpanded} className="text-navy-400" />
              </button>

              {/* Questions list */}
              {isExpanded && (
                <div id={groupId} className="divide-y divide-navy-100">
                  {questionsInGroup.map((question) => (
                    <QuestionItem key={question.questionId} question={question} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// Section variant (for use inside CollapsibleSection)
export function QuestionCoverageSection({
  questions,
  coveragePercent,
}: Pick<QuestionCoverageProps, 'questions' | 'coveragePercent'>) {
  return (
    <QuestionGroupsContent
      questions={questions}
      coveragePercent={coveragePercent}
      showProgressBar={true}
      spacing="sm"
    />
  );
}

// Full component with Card wrapper (for standalone use)
export function QuestionCoverage({
  questions,
  questionsAnswered,
  questionsTotal,
  coveragePercent,
}: QuestionCoverageProps) {
  return (
    <Card className="overflow-hidden">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-navy-900">
            Candidate Questions Coverage
          </h3>
          <p className="text-sm text-navy-500 mt-0.5">
            Does your posting answer what candidates want to know?
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-navy-900 tabular-nums">
            {questionsAnswered}/{questionsTotal}
          </div>
          <div className="text-sm text-navy-500">({coveragePercent}%)</div>
        </div>
      </div>

      <QuestionGroupsContent
        questions={questions}
        coveragePercent={coveragePercent}
        showProgressBar={true}
        spacing="md"
      />
    </Card>
  );
}

interface QuestionItemProps {
  question: QuestionCoverageType;
}

const QuestionItem = memo(function QuestionItem({ question }: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = question.evidence || question.suggestion;

  const content = (
    <>
      {/* Status icon */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          question.isAnswered ? 'bg-emerald-100' : 'bg-navy-100'
        )}
      >
        {question.isAnswered ? (
          <CheckIcon className="w-4 h-4 text-emerald-600" />
        ) : (
          <QuestionIcon className="w-4 h-4 text-navy-400" />
        )}
      </div>

      {/* Question content */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            'text-sm font-medium',
            question.isAnswered ? 'text-navy-900' : 'text-navy-600'
          )}
        >
          {question.questionText}
        </p>

        {question.impactStat && (
          <p className="text-xs text-navy-500 mt-1">{question.impactStat}</p>
        )}
      </div>

      {/* Expand indicator */}
      {hasDetails && (
        <ChevronDownIcon
          isExpanded={isExpanded}
          className="w-4 h-4 text-navy-400 flex-shrink-0"
        />
      )}
    </>
  );

  return (
    <div className="px-4 py-3 bg-white">
      {hasDetails ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className={cn(
            'w-full flex items-start gap-3 cursor-pointer',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded-lg'
          )}
        >
          {content}
        </button>
      ) : (
        <div className="flex items-start gap-3">
          {content}
        </div>
      )}

      {/* Expandable details */}
      {isExpanded && (
        <div className="mt-3 ml-9 space-y-2">
          {question.isAnswered && question.evidence && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs font-medium text-emerald-700 mb-1">
                Found in your posting:
              </p>
              <p className="text-sm text-emerald-900 italic">
                &quot;{question.evidence}&quot;
              </p>
            </div>
          )}

          {!question.isAnswered && question.suggestion && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-medium text-amber-700 mb-1">Suggestion:</p>
              <p className="text-sm text-amber-900">{question.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
