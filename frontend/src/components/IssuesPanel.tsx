// frontend/src/components/IssuesPanel.tsx

'use client';

import { useMemo, useRef, forwardRef, useImperativeHandle, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, InlineCopyButton } from '@/components/ui';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { Issue, FixabilityGroup, CATEGORY_LABELS } from '@/types/assessment';
import { groupIssuesByFixability, FIXABILITY_LABELS, FIXABILITY_COLORS, FIXABILITY_ICONS } from '@/lib/fixability';

// Track which group should be scrolled to after expansion
type PendingScroll = FixabilityGroup | null;

interface IssuesPanelProps {
  issues: Issue[];
  overallScore: number;
  className?: string;
}

export interface IssuesPanelRef {
  scrollToGroup: (group: FixabilityGroup) => void;
}

// Smart defaults based on score
function getDefaultOpenState(score: number, group: FixabilityGroup): boolean {
  if (score >= 80) return false; // Excellent: all collapsed
  if (score >= 60) return group === 'quick_win'; // Good: only quick wins
  if (score >= 40) return group === 'quick_win' || group === 'needs_attention'; // Needs work
  return group === 'quick_win' || group === 'needs_attention'; // Poor: critical sections open
}

export const IssuesPanel = forwardRef<IssuesPanelRef, IssuesPanelProps>(
  function IssuesPanel({ issues, overallScore, className }, ref) {
    const quickWinRef = useRef<HTMLDivElement>(null);
    const needsAttentionRef = useRef<HTMLDivElement>(null);
    const fyiRef = useRef<HTMLDivElement>(null);
    const [pendingScroll, setPendingScroll] = useState<PendingScroll>(null);

    // Track open states for controlled sections
    const [openStates, setOpenStates] = useState<Record<FixabilityGroup, boolean>>(() => ({
      quick_win: getDefaultOpenState(overallScore, 'quick_win'),
      needs_attention: getDefaultOpenState(overallScore, 'needs_attention'),
      fyi: getDefaultOpenState(overallScore, 'fyi'),
    }));

    // Handle toggle for a specific group
    const handleToggle = useCallback((group: FixabilityGroup, isOpen: boolean) => {
      setOpenStates(prev => ({ ...prev, [group]: isOpen }));
    }, []);

    // Scroll to group after it's expanded
    useEffect(() => {
      if (!pendingScroll) return;

      // Small delay to let the section expand
      const timer = setTimeout(() => {
        const targetRef = pendingScroll === 'quick_win' ? quickWinRef
          : pendingScroll === 'needs_attention' ? needsAttentionRef
          : fyiRef;
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingScroll(null);
      }, 100);

      return () => clearTimeout(timer);
    }, [pendingScroll, openStates]);

    // Expose scrollToGroup method
    useImperativeHandle(ref, () => ({
      scrollToGroup: (group: FixabilityGroup) => {
        // First expand the section
        setOpenStates(prev => ({ ...prev, [group]: true }));
        // Schedule scroll after expansion
        setPendingScroll(group);
      },
    }));

    // Group issues by fixability
    const groupedIssues = useMemo(() => groupIssuesByFixability(issues), [issues]);

    if (issues.length === 0) {
      return null;
    }

    return (
      <Card className={cn('', className)}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-navy-900">Issues & Fixes</h2>
          <span className="text-sm text-navy-500">{issues.length} total</span>
        </div>

        <div className="divide-y divide-navy-100">
          {/* Quick Wins */}
          {groupedIssues.quick_win.length > 0 && (
            <div ref={quickWinRef}>
              <IssueGroup
                group="quick_win"
                issues={groupedIssues.quick_win}
                isOpen={openStates.quick_win}
                onToggle={(isOpen) => handleToggle('quick_win', isOpen)}
              />
            </div>
          )}

          {/* Needs Attention */}
          {groupedIssues.needs_attention.length > 0 && (
            <div ref={needsAttentionRef}>
              <IssueGroup
                group="needs_attention"
                issues={groupedIssues.needs_attention}
                isOpen={openStates.needs_attention}
                onToggle={(isOpen) => handleToggle('needs_attention', isOpen)}
              />
            </div>
          )}

          {/* FYI */}
          {groupedIssues.fyi.length > 0 && (
            <div ref={fyiRef}>
              <IssueGroup
                group="fyi"
                issues={groupedIssues.fyi}
                isOpen={openStates.fyi}
                onToggle={(isOpen) => handleToggle('fyi', isOpen)}
              />
            </div>
          )}
        </div>
      </Card>
    );
  }
);

IssuesPanel.displayName = 'IssuesPanel';

// Issue Group Component
interface IssueGroupProps {
  group: FixabilityGroup;
  issues: Issue[];
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

function IssueGroup({ group, issues, isOpen, onToggle }: IssueGroupProps) {
  const Icon = FIXABILITY_ICONS[group];
  const label = FIXABILITY_LABELS[group];
  const { colors } = FIXABILITY_COLORS[group];

  const badge = (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium',
      colors
    )}>
      <Icon className="w-3 h-3" />
      {issues.length} {label}
    </span>
  );

  return (
    <CollapsibleSection
      title={label}
      badge={badge}
      isOpen={isOpen}
      onToggle={onToggle}
      id={`issues-${group}`}
    >
      <div className="space-y-4 pt-2">
        {issues.map((issue, index) => (
          <IssueCard key={index} issue={issue} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// Check if a suggestion is vague advice vs actionable (specific replacement)
function isVagueSuggestion(suggestion: string | undefined): boolean {
  if (!suggestion) return true;
  const trimmed = suggestion.trim().toLowerCase();
  // Vague patterns that indicate advice rather than a specific replacement
  const vaguePatterns = [
    /^consider\s/,
    /^try\s/,
    /^avoid\s/,
    /^ensure\s/,
    /^be\s+more\s/,
    /^make\s+sure\s/,
    /^add\s/,           // "Add team size information" - not copy-paste ready
    /^include\s/,       // "Include benefits" - not copy-paste ready
    /^remove\s/,        // "Remove jargon" - not copy-paste ready
    /^use\s/,           // "Use clearer language" - not copy-paste ready
    /consider\s+alternatives/,
  ];
  return vaguePatterns.some(pattern => pattern.test(trimmed));
}

// Convenience wrapper - true if suggestion is copy-paste ready
function isActionableSuggestion(suggestion: string | undefined): boolean {
  return !isVagueSuggestion(suggestion);
}

// Issue Card with Side-by-Side Diff
interface IssueCardProps {
  issue: Issue;
}

function IssueCard({ issue }: IssueCardProps) {
  const hasDiff = issue.found && issue.suggestion;
  const suggestionIsActionable = isActionableSuggestion(issue.suggestion);

  return (
    <div className="bg-navy-50/50 rounded-xl p-4 border border-navy-100">
      {/* Header: Category + Description */}
      <div className="flex items-start gap-2 mb-3">
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-md',
          'bg-navy-100 text-navy-600'
        )}>
          {CATEGORY_LABELS[issue.category] || issue.category}
        </span>
        <p className="text-sm font-medium text-navy-900 flex-1">{issue.description}</p>
      </div>

      {/* Side-by-Side Diff View */}
      {hasDiff && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Current (problematic) */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Current</span>
              {/* Show copy for found text when suggestion is vague advice */}
              {!suggestionIsActionable && issue.found && (
                <InlineCopyButton text={issue.found} variant="red" />
              )}
            </div>
            <p className="text-sm text-red-800 font-mono leading-relaxed">
              &quot;{issue.found}&quot;
            </p>
          </div>

          {/* Suggested (improved) */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                {suggestionIsActionable ? 'Suggested' : 'Advice'}
              </span>
              {/* Only show copy for actionable suggestions */}
              {suggestionIsActionable && issue.suggestion && (
                <InlineCopyButton text={issue.suggestion} variant="emerald" />
              )}
            </div>
            <p className="text-sm text-emerald-800 font-mono leading-relaxed">
              {issue.suggestion}
            </p>
          </div>
        </div>
      )}

      {/* Non-diff suggestion - only show copy if actionable */}
      {!hasDiff && issue.suggestion && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
              {suggestionIsActionable ? 'Suggestion' : 'Advice'}
            </span>
            {suggestionIsActionable && (
              <InlineCopyButton text={issue.suggestion} variant="sky" />
            )}
          </div>
          <p className="text-sm text-sky-800">{issue.suggestion}</p>
        </div>
      )}

      {/* Impact */}
      {issue.impact && (
        <p className="text-xs text-navy-500">
          <span className="font-medium">Impact:</span> {issue.impact}
        </p>
      )}
    </div>
  );
}
