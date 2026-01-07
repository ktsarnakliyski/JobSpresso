// frontend/src/components/ScoreDisplay.tsx

'use client';

import { Card, Badge } from '@/components/ui';
import { CircularScore } from '@/components/CircularScore';
import { QuestionCoverage } from '@/components/QuestionCoverage';
import { CategoryEvidence } from '@/components/CategoryEvidence';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { getEvidenceStatusConfig, getStatusIcon } from '@/lib/status-config';
import {
  AssessmentResult,
  AssessmentCategory,
  CATEGORY_LABELS,
  IssueSeverity,
  EvidenceStatus,
} from '@/types/assessment';

interface ScoreDisplayProps {
  result: AssessmentResult;
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
    categoryEvidence,
    questionCoverage,
    questionsAnswered,
    questionsTotal,
    questionCoveragePercent,
    estimatedApplicationBoost,
    issues,
    positives,
  } = result;

  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const infoIssues = issues.filter((i) => i.severity === 'info');

  // Get category status badges for the hero section with defensive checks
  const categoryBadges = Object.entries(categoryEvidence || {})
    .filter(([, evidence]) => evidence && evidence.status)
    .map(([cat, evidence]) => {
      const status = evidence.status;
      const config = getEvidenceStatusConfig(status);
      return {
        category: cat as AssessmentCategory,
        label: CATEGORY_LABELS[cat as AssessmentCategory],
        status,
        config,
      };
    });

  return (
    <div className="space-y-6">
      {/* Hero Score Section */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Circular Score */}
          <CircularScore
            score={overallScore}
            interpretation={interpretation}
            size="lg"
            showLabel={true}
            estimatedBoost={estimatedApplicationBoost}
          />

          {/* Category Status Badges */}
          <div className="flex-1 w-full">
            <h3 className="text-sm font-medium text-navy-500 mb-3">Category Overview</h3>
            <div className="flex flex-wrap gap-2">
              {categoryBadges.map(({ category, label, status, config }) => (
                <div
                  key={category}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <span className={config.color}>
                    {getStatusIcon(status as EvidenceStatus, 'w-3 h-3')}
                  </span>
                  <span className={cn('text-sm font-medium', config.color)}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Question Coverage */}
      {questionCoverage && questionCoverage.length > 0 && (
        <QuestionCoverage
          questions={questionCoverage}
          questionsAnswered={questionsAnswered}
          questionsTotal={questionsTotal}
          coveragePercent={questionCoveragePercent}
        />
      )}

      {/* Category Evidence Breakdown */}
      {categoryEvidence && Object.keys(categoryEvidence).length > 0 && (
        <CategoryEvidence categoryEvidence={categoryEvidence} />
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-navy-900">Issues Found</h3>
            <span className="text-sm text-navy-500">{issues.length} total</span>
          </div>
          <div className="space-y-5">
            {criticalIssues.length > 0 && (
              <IssueSection title="Critical" severity="critical" issues={criticalIssues} />
            )}
            {warningIssues.length > 0 && (
              <IssueSection title="Warnings" severity="warning" issues={warningIssues} />
            )}
            {infoIssues.length > 0 && (
              <IssueSection title="Suggestions" severity="info" issues={infoIssues} />
            )}
          </div>
        </Card>
      )}

      {/* Positives */}
      {positives.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-navy-900 mb-5">What&apos;s Working Well</h3>
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
            severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info'
          }
        >
          {title}
        </Badge>
        <span className="text-sm text-navy-500">({issues.length})</span>
      </div>
      <ul className="space-y-3">
        {issues.map((issue, index) => (
          <li key={index} className={cn('p-4 rounded-xl border', styles.bg, styles.border)}>
            <p className="font-medium text-navy-900">{issue.description}</p>
            {issue.found && (
              <p className="text-sm mt-2 text-navy-600">
                <span className="font-medium">Found:</span> &quot;{issue.found}&quot;
              </p>
            )}
            {issue.suggestion && (
              <p className="text-sm mt-1 text-navy-600">
                <span className="font-medium">Suggestion:</span> {issue.suggestion}
              </p>
            )}
            {issue.impact && (
              <p className="text-sm mt-1 text-navy-600">
                <span className="font-medium">Impact:</span> {issue.impact}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
