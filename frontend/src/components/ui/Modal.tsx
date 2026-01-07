// frontend/src/components/ui/Modal.tsx

'use client';

import { useEffect, useRef, useCallback, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  footer,
  size = 'md',
  children,
  className,
  ...props
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Trap focus within modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      // Guard against empty focusable elements
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus the modal after animation starts
      const focusTimer = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end sm:items-center justify-center',
        'animate-in fade-in duration-200'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-navy-900/40 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white',
          'shadow-xl',
          // Mobile: slide up from bottom as drawer
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[90vh] overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out',
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100">
            <h2 id="modal-title" className="text-lg font-semibold text-navy-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                'p-2 -mr-2 rounded-lg text-navy-400',
                'hover:bg-navy-100 hover:text-navy-600',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500'
              )}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={cn('px-6 py-5 overflow-y-auto', !footer && 'pb-6')}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-navy-100 bg-navy-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render modal at document root
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

Modal.displayName = 'Modal';
