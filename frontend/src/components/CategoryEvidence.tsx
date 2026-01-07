// frontend/src/components/CategoryEvidence.tsx

'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui';
import { ChevronDownIcon, CheckIcon, WarningIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { getEvidenceStatusConfig, getProgressBarColor, getStatusIcon } from '@/lib/status-config';
import {
  AssessmentCategory,
  CategoryEvidence as CategoryEvidenceType,
  EvidenceStatus,
  CATEGORY_LABELS,
} from '@/types/assessment';

interface CategoryEvidenceProps {
  categoryEvidence: Record<AssessmentCategory, CategoryEvidenceType>;
}

export function CategoryEvidence({ categoryEvidence }: CategoryEvidenceProps) {
  // Sort categories by score (worst first for priority) - memoized to prevent re-renders
  const sortedCategories = useMemo(
    () =>
      Object.entries(categoryEvidence).sort(([, a], [, b]) => a.score - b.score) as [
        AssessmentCategory,
        CategoryEvidenceType
      ][],
    [categoryEvidence]
  );

  return (
    <Card>
      <h3 className="text-lg font-semibold text-navy-900 mb-5">Detailed Breakdown</h3>
      <div className="space-y-3">
        {sortedCategories.map(([category, evidence]) => (
          <CategoryCard key={category} category={category} evidence={evidence} />
        ))}
      </div>
    </Card>
  );
}

interface CategoryCardProps {
  category: AssessmentCategory;
  evidence: CategoryEvidenceType;
}

function CategoryCard({ category, evidence }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getEvidenceStatusConfig(evidence.status);
  const statusIcon = getStatusIcon(evidence.status as EvidenceStatus);

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all duration-200',
        isExpanded ? 'border-navy-300 shadow-soft-md' : 'border-navy-200/60'
      )}
    >
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-navy-50/50 transition-colors"
      >
        {/* Status icon */}
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', statusConfig.bgColor)}>
          <span className={statusConfig.color}>{statusIcon}</span>
        </div>

        {/* Category name and score bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-navy-900">
              {CATEGORY_LABELS[category]}
            </span>
            <span className={cn('text-sm font-semibold tabular-nums', statusConfig.color)}>
              {Math.round(evidence.score)}
            </span>
          </div>
          <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out-expo',
                getProgressBarColor(evidence.score)
              )}
              style={{ width: `${evidence.score}%` }}
            />
          </div>
        </div>

        {/* Expand indicator */}
        <ChevronDownIcon isExpanded={isExpanded} className="text-navy-400 flex-shrink-0" />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-navy-100 bg-navy-50/30">
          {/* Opportunity - main improvement suggestion */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-navy-200/60">
            <p className="text-xs font-medium text-navy-500 mb-1">Opportunity</p>
            <p className="text-sm text-navy-800">{evidence.opportunity}</p>
            {evidence.impactPrediction && (
              <p className="text-xs text-teal mt-2 font-medium">{evidence.impactPrediction}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* What's working */}
            {evidence.supportingExcerpts.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1.5">
                  <CheckIcon className="w-3.5 h-3.5" />
                  What&apos;s Working
                </p>
                <ul className="space-y-1.5">
                  {evidence.supportingExcerpts.map((excerpt, i) => (
                    <li key={i} className="text-xs text-emerald-800 italic">
                      &quot;{excerpt}&quot;
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing elements */}
            {evidence.missingElements.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1.5">
                  <WarningIcon className="w-3.5 h-3.5" />
                  Missing
                </p>
                <ul className="space-y-1.5">
                  {evidence.missingElements.map((element, i) => (
                    <li key={i} className="text-xs text-amber-800">
                      {element}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Handle case where both are empty */}
          {evidence.supportingExcerpts.length === 0 && evidence.missingElements.length === 0 && (
            <p className="text-sm text-navy-500 italic">
              No specific evidence available for this category.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
