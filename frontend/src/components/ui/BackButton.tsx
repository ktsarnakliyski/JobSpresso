// frontend/src/components/ui/BackButton.tsx

'use client';

import { cn } from '@/lib/utils';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = 'Back', className }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-navy-600 hover:text-navy-800 text-sm flex items-center gap-1 mb-4',
        className
      )}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {label}
    </button>
  );
}
