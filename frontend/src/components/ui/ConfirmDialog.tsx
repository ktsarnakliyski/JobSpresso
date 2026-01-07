// frontend/src/components/ui/ConfirmDialog.tsx

'use client';

import { useCallback, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// Delay for focus to allow animation to start
const FOCUS_DELAY_MS = 50;

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Generate unique IDs for ARIA attributes
  const titleId = useId();
  const descriptionId = useId();

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        // Trap focus between the two buttons
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element for restoration
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus cancel button by default (safer option)
      const focusTimer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, FOCUS_DELAY_MS);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        // Restore focus to previously focused element
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  // Early returns for closed state and SSR
  if (!isOpen) return null;
  if (typeof window === 'undefined') return null;

  const isDestructive = variant === 'destructive';

  const dialogContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-in fade-in duration-150'
      )}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {/* Backdrop with blur */}
      <div
        className={cn(
          'fixed inset-0',
          isDestructive
            ? 'bg-navy-900/50 backdrop-blur-sm'
            : 'bg-navy-900/40 backdrop-blur-sm',
          'animate-in fade-in duration-150'
        )}
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full max-w-md bg-white rounded-2xl overflow-hidden',
          'shadow-2xl',
          'animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out',
          // Subtle top border accent for destructive
          isDestructive && 'ring-1 ring-red-100'
        )}
      >
        {/* Icon header for destructive */}
        {isDestructive && (
          <div className="flex justify-center pt-6 pb-2">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-red-50 to-red-100',
              'ring-4 ring-red-50'
            )}>
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'px-6 text-center',
          isDestructive ? 'pt-3 pb-5' : 'py-6'
        )}>
          <h3
            id={titleId}
            className="text-lg font-semibold text-navy-900"
          >
            {title}
          </h3>
          <p
            id={descriptionId}
            className="mt-2 text-sm text-navy-600 leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className={cn(
          'flex gap-3 px-6 pb-6',
          'flex-col-reverse sm:flex-row sm:justify-center'
        )}>
          {/* Cancel - the safe harbor */}
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium text-sm',
              'bg-navy-100 text-navy-700',
              'hover:bg-navy-200',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2',
              'sm:min-w-[100px]'
            )}
          >
            {cancelLabel}
          </button>

          {/* Confirm - with weight for destructive */}
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium text-sm',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'sm:min-w-[100px]',
              isDestructive
                ? [
                    'bg-red-500 text-white',
                    'hover:bg-red-600',
                    'shadow-lg shadow-red-500/25',
                    'hover:shadow-xl hover:shadow-red-500/30',
                    'hover:scale-[1.02]',
                    'active:scale-[0.98]',
                    'focus-visible:ring-red-500',
                  ]
                : [
                    'bg-navy-900 text-white',
                    'hover:bg-navy-800',
                    'shadow-lg shadow-navy-900/25',
                    'focus-visible:ring-navy-500',
                  ]
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}

ConfirmDialog.displayName = 'ConfirmDialog';
