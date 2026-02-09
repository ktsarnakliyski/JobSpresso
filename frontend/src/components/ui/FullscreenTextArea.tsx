// frontend/src/components/ui/FullscreenTextArea.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface FullscreenTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label?: React.ReactNode;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  showWordCount?: boolean;
  className?: string;
  readOnly?: boolean;
}

export function FullscreenTextArea({
  value,
  onChange,
  label,
  placeholder,
  rows = 10,
  disabled,
  showWordCount,
  className,
  readOnly,
}: FullscreenTextAreaProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cleanup body overflow on unmount (prevent memory leak)
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleOpenFullscreen = useCallback(() => {
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.style.overflow = '';
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseFullscreen();
    }
  }, [handleCloseFullscreen]);

  // Calculate word count
  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <>
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-navy-700 mb-2">
            {label}
          </label>
        )}

        {/* Textarea wrapper with relative positioning for the button */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              'w-full px-4 py-3 rounded-xl border border-navy-200',
              'text-navy-900 placeholder:text-navy-400',
              'focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent',
              'transition-colors duration-150 resize-none',
              disabled && 'bg-navy-50 text-navy-500 cursor-not-allowed',
              className
            )}
          />

          {/* Floating expand button - inside textarea bounds */}
          <button
            type="button"
            onClick={handleOpenFullscreen}
            className={cn(
              'absolute bottom-3 right-3 p-2 rounded-lg',
              'bg-navy-900/80 text-white backdrop-blur-sm',
              'hover:bg-navy-900 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
              'shadow-lg',
              isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            )}
            aria-label="Open fullscreen editor"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* Word count outside textarea */}
        {showWordCount && (
          <div className="flex justify-end mt-1.5">
            <span className="text-xs tabular-nums text-navy-500">
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {typeof document !== 'undefined' && isFullscreen && createPortal(
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white animate-fade-in"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 bg-navy-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">
                  {label || 'Job Description'}
                </h2>
                {showWordCount && (
                  <p className="text-sm text-navy-500">
                    {wordCount} words
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseFullscreen}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy-700 bg-white border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-navy-100 rounded">
                Esc
              </kbd>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            <textarea
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              className={cn(
                'w-full h-full min-h-[calc(100vh-180px)] p-4',
                'text-base leading-relaxed text-navy-900',
                'bg-transparent border-0 resize-none',
                'focus:outline-none focus:ring-0',
                'placeholder:text-navy-400',
                className
              )}
              autoFocus
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

FullscreenTextArea.displayName = 'FullscreenTextArea';
