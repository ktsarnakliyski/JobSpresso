// frontend/src/lib/status-config.ts

import React from 'react';
import { CheckIcon, WarningIcon, XIcon } from '@/components/icons';
import { EvidenceStatus, QuestionImportance } from '@/types/assessment';

/**
 * Shared status configuration for evidence-based components.
 * Used by ScoreDisplay, CategoryEvidence, and QuestionCoverage.
 */

export const EVIDENCE_STATUS_CONFIG: Record<
  EvidenceStatus,
  { color: string; bgColor: string; borderColor: string; label: string }
> = {
  good: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    label: 'Good',
  },
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    label: 'Needs Work',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    label: 'Critical',
  },
};

export const QUESTION_IMPORTANCE_CONFIG: Record<
  QuestionImportance,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  high: {
    label: 'Must Answer',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  medium: {
    label: 'Should Answer',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  low: {
    label: 'Nice to Have',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
  },
};

/**
 * Check if importance is a valid QuestionImportance.
 */
export function isValidQuestionImportance(importance: string): importance is QuestionImportance {
  return importance === 'high' || importance === 'medium' || importance === 'low';
}

/**
 * Get question importance config with fallback for unknown values.
 */
export function getQuestionImportanceConfig(importance: string) {
  if (isValidQuestionImportance(importance)) {
    return QUESTION_IMPORTANCE_CONFIG[importance];
  }
  // Default to medium for unknown importance levels
  return QUESTION_IMPORTANCE_CONFIG.medium;
}

/**
 * Get progress bar color based on percentage.
 * Used by CategoryEvidence and QuestionCoverage components.
 * Returns both Tailwind class and hex color for reliability.
 */
export function getProgressBarColor(percent: number): { className: string; hex: string } {
  if (percent >= 80) return { className: 'bg-emerald-500', hex: '#10b981' };
  if (percent >= 60) return { className: 'bg-emerald-400', hex: '#34d399' };
  if (percent >= 50) return { className: 'bg-amber-500', hex: '#f59e0b' };
  if (percent >= 30) return { className: 'bg-orange-500', hex: '#f97316' };
  return { className: 'bg-red-500', hex: '#ef4444' };
}

/**
 * Check if status is a valid EvidenceStatus.
 */
export function isValidEvidenceStatus(status: string): status is EvidenceStatus {
  return status === 'good' || status === 'warning' || status === 'critical';
}

/**
 * Get evidence status config with fallback for unknown values.
 */
export function getEvidenceStatusConfig(status: string) {
  if (isValidEvidenceStatus(status)) {
    return EVIDENCE_STATUS_CONFIG[status];
  }
  // Default to warning for unknown statuses
  return EVIDENCE_STATUS_CONFIG.warning;
}

/**
 * Get status icon component for a given evidence status.
 * @param status - The evidence status
 * @param className - Optional className for the icon
 */
export function getStatusIcon(status: EvidenceStatus, className?: string): React.ReactNode {
  const icons: Record<EvidenceStatus, React.ReactNode> = {
    good: React.createElement(CheckIcon, { className }),
    warning: React.createElement(WarningIcon, { className }),
    critical: React.createElement(XIcon, { className }),
  };
  return icons[status] ?? icons.warning;
}
