// frontend/src/components/ui/CopyButton.tsx

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ClipboardIcon, CheckIcon } from '@/components/icons';

// Color variants for inline copy buttons
const INLINE_VARIANTS = {
  red: {
    base: 'bg-red-100 text-red-700 hover:bg-red-200',
    copied: 'bg-red-200 text-red-800',
    ring: 'focus-visible:ring-red-500',
  },
  emerald: {
    base: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    copied: 'bg-emerald-200 text-emerald-800',
    ring: 'focus-visible:ring-emerald-500',
  },
  sky: {
    base: 'bg-sky-100 text-sky-700 hover:bg-sky-200',
    copied: 'bg-sky-200 text-sky-800',
    ring: 'focus-visible:ring-sky-500',
  },
} as const;

type InlineVariant = keyof typeof INLINE_VARIANTS;

interface CopyButtonProps {
  text: string;
  size?: 'sm' | 'md';
  label?: string;
  copiedLabel?: string;
}

interface InlineCopyButtonProps {
  text: string;
  variant?: InlineVariant;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyButton({
  text,
  size = 'sm',
  label = 'Copy',
  copiedLabel = 'Copied!',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [text]);

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        className={cn(
          'transition-all duration-200',
          copied && 'scale-105'
        )}
      >
        {copied ? (
          <>
            <svg
              className="w-4 h-4 mr-1.5 text-emerald-600 animate-[bounce_0.5s_ease-in-out]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-600">{copiedLabel}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {label}
          </>
        )}
      </Button>
      {/* Screen reader announcement */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  );
}

// Compact inline copy button for use within cards
export function InlineCopyButton({
  text,
  variant = 'emerald',
  label = 'Copy',
  copiedLabel = 'Copied!',
  className,
}: InlineCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colors = INLINE_VARIANTS[variant];

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [text]);

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2',
          colors.ring,
          copied ? cn(colors.copied, 'scale-105') : colors.base,
          className
        )}
      >
        {copied ? (
          <>
            <CheckIcon className="w-3 h-3" />
            {copiedLabel}
          </>
        ) : (
          <>
            <ClipboardIcon className="w-3 h-3" />
            {label}
          </>
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  );
}
