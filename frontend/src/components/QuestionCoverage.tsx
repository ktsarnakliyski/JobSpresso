// frontend/src/components/QuestionCoverage.tsx

'use client';

import { useState } from 'react';
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

export function QuestionCoverage({
  questions,
  questionsAnswered,
  questionsTotal,
  coveragePercent,
}: QuestionCoverageProps) {
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

  const importanceOrder: QuestionImportance[] = ['high', 'medium', 'low'];

  return (
    <Card className="overflow-hidden">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-espresso-900">
            Candidate Questions Coverage
          </h3>
          <p className="text-sm text-espresso-500 mt-0.5">
            Does your JD answer what candidates want to know?
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-espresso-900 tabular-nums">
            {questionsAnswered}/{questionsTotal}
          </div>
          <div className="text-sm text-espresso-500">({coveragePercent}%)</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-espresso-100 rounded-full overflow-hidden mb-6">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out-expo',
            getProgressBarColor(coveragePercent)
          )}
          style={{ width: `${coveragePercent}%` }}
        />
      </div>

      {/* Question groups */}
      <div className="space-y-4">
        {importanceOrder.map((importance) => {
          const questionsInGroup = groupedQuestions[importance] || [];
          if (questionsInGroup.length === 0) return null;

          const config = getQuestionImportanceConfig(importance);
          const isExpanded = expandedGroups.has(importance);
          const answeredInGroup = questionsInGroup.filter((q) => q.isAnswered).length;

          return (
            <div key={importance} className="border border-espresso-200/60 rounded-xl overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(importance)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3',
                  'hover:bg-espresso-50/50 transition-colors',
                  config.bgColor
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-semibold', config.color)}>
                    {config.label}
                  </span>
                  <span className="text-sm text-espresso-500">
                    {answeredInGroup}/{questionsInGroup.length} answered
                  </span>
                </div>
                <ChevronDownIcon isExpanded={isExpanded} className="text-espresso-400" />
              </button>

              {/* Questions list */}
              {isExpanded && (
                <div className="divide-y divide-espresso-100">
                  {questionsInGroup.map((question) => (
                    <QuestionItem key={question.questionId} question={question} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface QuestionItemProps {
  question: QuestionCoverageType;
}

function QuestionItem({ question }: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = question.evidence || question.suggestion;

  return (
    <div className="px-4 py-3 bg-white">
      <div
        className={cn('flex items-start gap-3', hasDetails && 'cursor-pointer')}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        {/* Status icon */}
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            question.isAnswered ? 'bg-emerald-100' : 'bg-espresso-100'
          )}
        >
          {question.isAnswered ? (
            <CheckIcon className="w-4 h-4 text-emerald-600" />
          ) : (
            <QuestionIcon className="w-4 h-4 text-espresso-400" />
          )}
        </div>

        {/* Question content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium',
              question.isAnswered ? 'text-espresso-900' : 'text-espresso-600'
            )}
          >
            {question.questionText}
          </p>

          {/* Impact stat - always show */}
          {question.impactStat && (
            <p className="text-xs text-espresso-500 mt-1">{question.impactStat}</p>
          )}

          {/* Expandable details */}
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {question.isAnswered && question.evidence && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-700 mb-1">
                    Found in your JD:
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

        {/* Expand indicator */}
        {hasDetails && (
          <ChevronDownIcon
            isExpanded={isExpanded}
            className="w-4 h-4 text-espresso-400 flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}
