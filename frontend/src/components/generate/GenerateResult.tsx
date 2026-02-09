// frontend/src/components/generate/GenerateResult.tsx

'use client';

import posthog from 'posthog-js';
import { Card, Button, CopyButton } from '@/components/ui';

export interface GenerateResultData {
  generatedJd: string;
  wordCount: number;
  notes: string[] | null;
}

interface GenerateResultProps {
  result: GenerateResultData;
  roleTitle: string;
}

export function GenerateResult({ result, roleTitle }: GenerateResultProps) {
  const handleDownload = () => {
    const blob = new Blob([result.generatedJd], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roleTitle.replace(/\s+/g, '_')}_Job_Description.txt`;
    a.click();
    URL.revokeObjectURL(url);

    // Capture download event
    posthog.capture('jd_downloaded', {
      role_title: roleTitle,
      word_count: result.wordCount,
    });
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-navy-900">
              Generated Job Description
            </h3>
            <p className="text-sm text-navy-500 mt-0.5">
              {result.wordCount} words
            </p>
          </div>
          <div className="flex gap-2">
            <CopyButton text={result.generatedJd} />
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Button>
          </div>
        </div>

        <div className="bg-navy-50 rounded-xl p-5 whitespace-pre-wrap font-mono text-sm text-navy-800 leading-relaxed">
          {result.generatedJd}
        </div>
      </Card>

      {/* Notes */}
      {result.notes && result.notes.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Notes</h3>
          <ul className="space-y-3">
            {result.notes.map((note, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-navy-700">{note}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
