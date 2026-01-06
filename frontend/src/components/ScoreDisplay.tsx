// frontend/src/components/ScoreDisplay.tsx

'use client';

import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  AssessmentResult,
  AssessmentCategory,
  CATEGORY_LABELS,
  INTERPRETATION_COLORS,
  SEVERITY_COLORS,
  IssueSeverity,
} from '@/types/assessment';

interface ScoreDisplayProps {
  result: AssessmentResult;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-500';
  return 'text-red-600';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-green-400';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function formatInterpretation(interpretation: AssessmentResult['interpretation']): string {
  return interpretation.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

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

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
            <p className={cn('text-sm', INTERPRETATION_COLORS[interpretation])}>
              {formatInterpretation(interpretation)}
            </p>
          </div>
          <div className={cn('text-5xl font-bold', getScoreColor(overallScore))}>
            {overallScore}
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(categoryScores).map(([category, score]) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">
                  {CATEGORY_LABELS[category as AssessmentCategory] || category}
                </span>
                <span className={cn('font-medium', getScoreColor(score))}>
                  {score}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', getBarColor(score))}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Issues Found ({issues.length})
          </h3>
          <div className="space-y-4">
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
                title="Info"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Positives ({positives.length})
          </h3>
          <ul className="space-y-2">
            {positives.map((positive, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-700">{positive}</span>
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
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
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
        <span className="text-sm text-gray-500">({issues.length})</span>
      </div>
      <ul className="space-y-3">
        {issues.map((issue, index) => (
          <li
            key={index}
            className={cn(
              'p-3 rounded-lg border',
              SEVERITY_COLORS[issue.severity]
            )}
          >
            <p className="font-medium">{issue.description}</p>
            {issue.found && (
              <p className="text-sm mt-1 opacity-80">
                Found: &quot;{issue.found}&quot;
              </p>
            )}
            {issue.suggestion && (
              <p className="text-sm mt-1 opacity-80">
                Suggestion: {issue.suggestion}
              </p>
            )}
            {issue.impact && (
              <p className="text-sm mt-1 opacity-80">
                Impact: {issue.impact}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
