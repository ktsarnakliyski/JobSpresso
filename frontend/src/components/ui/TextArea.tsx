// frontend/src/components/ui/TextArea.tsx

import { TextareaHTMLAttributes, forwardRef, useMemo } from 'react';
import { cn, getInputBaseClasses } from '@/lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  showWordCount?: boolean;
  maxWords?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, id, disabled, showWordCount, maxWords, value, ...props }, ref) => {
    const wordCount = useMemo(() => {
      const text = value?.toString() || '';
      return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    }, [value]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          value={value}
          className={cn(
            getInputBaseClasses({ disabled, error: !!error }),
            'py-3 resize-none',
            className
          )}
          {...props}
        />
        {showWordCount && (
          <div className="flex justify-end mt-1.5">
            <span className={cn(
              'text-xs tabular-nums',
              maxWords && wordCount > maxWords ? 'text-red-600 font-medium' : 'text-navy-500'
            )}>
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
              {maxWords && ` / ${maxWords.toLocaleString()}`}
            </span>
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
