// frontend/src/components/ui/CopyButton.tsx

'use client';

import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ClipboardIcon, CheckIcon } from '@/components/icons';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

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
  const { copied, copy } = useCopyToClipboard();

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={() => copy(text)}
        aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
        className={cn(
          'transition-all duration-200',
          copied && 'scale-105'
        )}
      >
        {copied ? (
          <>
            <CheckIcon className="w-4 h-4 mr-1.5 text-emerald-600 animate-[bounce_0.5s_ease-in-out]" />
            <span className="text-emerald-600">{copiedLabel}</span>
          </>
        ) : (
          <>
            <ClipboardIcon className="w-4 h-4 mr-1.5" />
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
  const { copied, copy } = useCopyToClipboard();
  const colors = INLINE_VARIANTS[variant];

  return (
    <>
      <button
        type="button"
        onClick={() => copy(text)}
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
