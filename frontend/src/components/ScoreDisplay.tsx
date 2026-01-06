// frontend/src/components/ScoreDisplay.tsx

'use client';

import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  AssessmentResult,
  AssessmentCategory,
  CATEGORY_LABELS,
  IssueSeverity,
} from '@/types/assessment';

interface ScoreDisplayProps {
  result: AssessmentResult;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-600';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-600';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-emerald-400';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getInterpretationStyle(interpretation: AssessmentResult['interpretation']): {
  bg: string;
  text: string;
  label: string;
} {
  const styles = {
    excellent: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Excellent' },
    good: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Good' },
    needs_work: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Needs Work' },
    poor: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Poor' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', label: 'Critical Issues' },
  };
  return styles[interpretation];
}

const SEVERITY_STYLES: Record<IssueSeverity, { bg: string; border: string; icon: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
  info: { bg: 'bg-sky-50', border: 'border-sky-200', icon: 'text-sky-500' },
};

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  const {
    overallScore,
    interpretation,
    categoryScores,
    issues,
    positives,
  } = result;

  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const infoIssues = issues.filter((i) => i.severity === 'info');
  const interpretationStyle = getInterpretationStyle(interpretation);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-espresso-900">Overall Score</h3>
            <div className={cn('inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg', interpretationStyle.bg)}>
              <span className={cn('text-sm font-medium', interpretationStyle.text)}>
                {interpretationStyle.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-5xl font-bold tabular-nums', getScoreColor(overallScore))}>
              {overallScore}
            </div>
            <div className="text-sm text-espresso-500 mt-1">out of 100</div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <h3 className="text-lg font-semibold text-espresso-900 mb-5">Category Breakdown</h3>
        <div className="space-y-5">
          {Object.entries(categoryScores).map(([category, score]) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-espresso-700 font-medium">
                  {CATEGORY_LABELS[category as AssessmentCategory] || category}
                </span>
                <span className={cn('font-semibold tabular-nums', getScoreColor(score))}>
                  {score}
                </span>
              </div>
              <div className="h-2 bg-espresso-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500 ease-out-expo', getBarColor(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Issues */}
      {issues.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-espresso-900">
              Issues Found
            </h3>
            <span className="text-sm text-espresso-500">{issues.length} total</span>
          </div>
          <div className="space-y-5">
            {criticalIssues.length > 0 && (
              <IssueSection
                title="Critical"
                severity="critical"
                issues={criticalIssues}
              />
            )}
            {warningIssues.length > 0 && (
              <IssueSection
                title="Warnings"
                severity="warning"
                issues={warningIssues}
              />
            )}
            {infoIssues.length > 0 && (
              <IssueSection
                title="Suggestions"
                severity="info"
                issues={infoIssues}
              />
            )}
          </div>
        </Card>
      )}

      {/* Positives */}
      {positives.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-espresso-900 mb-5">
            What&apos;s Working Well
          </h3>
          <ul className="space-y-3">
            {positives.map((positive, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-espresso-700">{positive}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

interface IssueSectionProps {
  title: string;
  severity: IssueSeverity;
  issues: AssessmentResult['issues'];
}

function IssueSection({ title, severity, issues }: IssueSectionProps) {
  const styles = SEVERITY_STYLES[severity];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant={
            severity === 'critical'
              ? 'error'
              : severity === 'warning'
              ? 'warning'
              : 'info'
          }
        >
          {title}
        </Badge>
        <span className="text-sm text-espresso-500">({issues.length})</span>
      </div>
      <ul className="space-y-3">
        {issues.map((issue, index) => (
          <li
            key={index}
            className={cn(
              'p-4 rounded-xl border',
              styles.bg,
              styles.border
            )}
          >
            <p className="font-medium text-espresso-900">{issue.description}</p>
            {issue.found && (
              <p className="text-sm mt-2 text-espresso-600">
                <span className="font-medium">Found:</span> &quot;{issue.found}&quot;
              </p>
            )}
            {issue.suggestion && (
              <p className="text-sm mt-1 text-espresso-600">
                <span className="font-medium">Suggestion:</span> {issue.suggestion}
              </p>
            )}
            {issue.impact && (
              <p className="text-sm mt-1 text-espresso-600">
                <span className="font-medium">Impact:</span> {issue.impact}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
