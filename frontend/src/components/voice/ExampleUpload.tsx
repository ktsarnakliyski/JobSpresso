// frontend/src/components/voice/ExampleUpload.tsx

'use client';

import { useState, useCallback } from 'react';
import { Button, TextArea, BackButton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ExampleUploadProps {
  onSubmit: (examples: string[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ExampleUpload({ onSubmit, onBack, isLoading }: ExampleUploadProps) {
  const [examples, setExamples] = useState<string[]>(['', '', '']);

  const handleExampleChange = useCallback((index: number, value: string) => {
    setExamples((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const validExamples = examples.filter((ex) => ex.trim().length > 50);
    if (validExamples.length > 0) {
      onSubmit(validExamples);
    }
  }, [examples, onSubmit]);

  const filledCount = examples.filter((ex) => ex.trim().length > 50).length;
  const canSubmit = filledCount >= 1 && !isLoading;

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <h2 className="text-xl font-semibold text-navy-900">Paste Your Examples</h2>
        <p className="text-navy-600 mt-2">
          Add 1-3 job descriptions you&apos;ve written. More examples = better accuracy.
        </p>
      </div>

      <div className="space-y-4">
        {examples.map((example, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy-700">
                Example {index + 1} {index === 0 && <span className="text-red-500">*</span>}
              </label>
              {example.trim().length > 0 && (
                <span
                  className={cn(
                    'text-xs',
                    example.trim().length > 50 ? 'text-emerald-600' : 'text-amber-600'
                  )}
                >
                  {example.trim().length > 50 ? '✓ Good length' : 'Add more text'}
                </span>
              )}
            </div>
            <TextArea
              value={example}
              onChange={(e) => handleExampleChange(index, e.target.value)}
              placeholder={`Paste job description ${index + 1} here...`}
              rows={6}
              className={cn(
                example.trim().length > 50 && 'border-emerald-300 focus:border-emerald-500'
              )}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-navy-500">{filledCount} of 3 examples provided</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze My Style'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
