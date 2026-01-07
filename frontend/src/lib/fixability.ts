// frontend/src/lib/fixability.ts
// Pure utility functions for issue fixability classification

import { Issue, FixabilityGroup } from '@/types/assessment';
import { ZapIcon, WrenchIcon, InfoIcon } from '@/components/icons';

// Icon mapping for fixability groups
export const FIXABILITY_ICONS: Record<FixabilityGroup, typeof ZapIcon> = {
  quick_win: ZapIcon,
  needs_attention: WrenchIcon,
  fyi: InfoIcon,
};

// Classify an issue by fixability
export function classifyIssue(issue: Issue): FixabilityGroup {
  // Has both found + suggestion = easy fix (unless critical)
  if (issue.found && issue.suggestion && issue.severity !== 'critical') {
    return 'quick_win';
  }
  // Critical or needs manual work
  if (issue.severity === 'critical' || !issue.found) {
    return 'needs_attention';
  }
  // Info-level observations
  return 'fyi';
}

// Group issues by fixability
export function groupIssuesByFixability(issues: Issue[]): Record<FixabilityGroup, Issue[]> {
  const groups: Record<FixabilityGroup, Issue[]> = {
    quick_win: [],
    needs_attention: [],
    fyi: [],
  };

  issues.forEach((issue) => {
    const group = classifyIssue(issue);
    groups[group].push(issue);
  });

  return groups;
}

// Fixability group labels (can be used server-side)
export const FIXABILITY_LABELS: Record<FixabilityGroup, string> = {
  quick_win: 'Quick Wins',
  needs_attention: 'Needs Attention',
  fyi: 'FYI',
};

// Fixability group colors (Tailwind classes)
export const FIXABILITY_COLORS: Record<FixabilityGroup, { colors: string; hoverColors: string }> = {
  quick_win: {
    colors: 'bg-teal-50 border-teal-200 text-teal-700',
    hoverColors: 'hover:bg-teal-100 hover:border-teal-300',
  },
  needs_attention: {
    colors: 'bg-amber-50 border-amber-200 text-amber-700',
    hoverColors: 'hover:bg-amber-100 hover:border-amber-300',
  },
  fyi: {
    colors: 'bg-sky-50 border-sky-200 text-sky-600',
    hoverColors: 'hover:bg-sky-100 hover:border-sky-300',
  },
};
