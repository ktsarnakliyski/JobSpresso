// frontend/src/components/ActionSummary.tsx

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { groupIssuesByFixability, FIXABILITY_LABELS, FIXABILITY_COLORS, FIXABILITY_ICONS } from '@/lib/fixability';
import { Issue, FixabilityGroup, AssessmentCategory, EvidenceStatus, CATEGORY_LABELS } from '@/types/assessment';
import { EVIDENCE_STATUS_CONFIG } from '@/lib/status-config';

interface ActionSummaryProps {
  issues: Issue[];
  categoryStatuses: Record<AssessmentCategory, EvidenceStatus>;
  onChipClick?: (group: FixabilityGroup) => void;
  className?: string;
}

export function ActionSummary({
  issues,
  categoryStatuses,
  onChipClick,
  className,
}: ActionSummaryProps) {
  // Group issues by fixability
  const groupedIssues = useMemo(() => groupIssuesByFixability(issues), [issues]);

  // Only show chips with issues
  const activeGroups = (Object.keys(groupedIssues) as FixabilityGroup[]).filter(
    (group) => groupedIssues[group].length > 0
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Fixability Chips */}
      {activeGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeGroups.map((group) => {
            const Icon = FIXABILITY_ICONS[group];
            const label = FIXABILITY_LABELS[group];
            const { colors, hoverColors } = FIXABILITY_COLORS[group];
            const count = groupedIssues[group].length;

            return (
              <button
                key={group}
                type="button"
                onClick={() => onChipClick?.(group)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
                  'text-sm font-medium transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2',
                  colors,
                  onChipClick && hoverColors,
                  onChipClick && 'cursor-pointer',
                  !onChipClick && 'cursor-default'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{count}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Category Status Summary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {Object.entries(categoryStatuses).map(([cat, status]) => {
          const categoryLabel = CATEGORY_LABELS[cat as AssessmentCategory] || cat;
          const statusConfig = EVIDENCE_STATUS_CONFIG[status];
          return (
            <div
              key={cat}
              className="flex items-center gap-1.5 text-xs"
              title={`${categoryLabel}: ${statusConfig.label}`}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  status === 'good' && 'bg-emerald-500',
                  status === 'warning' && 'bg-amber-500',
                  status === 'critical' && 'bg-red-500'
                )}
              />
              <span className="text-navy-600 hidden sm:inline">{categoryLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ActionSummary.displayName = 'ActionSummary';
