// frontend/src/components/ui/CollapsibleSection.tsx

'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@/components/icons';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  /** Controlled mode: when provided, component is controlled by parent */
  isOpen?: boolean;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  onToggle?: (isOpen: boolean) => void;
  id?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  children,
  className,
  headerClassName,
  onToggle,
  id,
}: CollapsibleSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Measure content height for smooth animation
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (isOpen) {
          setContentHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [isOpen]);

  // Handle open state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (defaultOpen && contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
      return;
    }

    if (isOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    } else {
      setContentHeight(0);
    }
  }, [isOpen, defaultOpen]);

  const toggle = useCallback(() => {
    const newState = !isOpen;
    if (!isControlled) {
      setInternalIsOpen(newState);
    }
    onToggle?.(newState);
  }, [isOpen, isControlled, onToggle]);

  const sectionId = id || `collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const contentId = `${sectionId}-content`;

  return (
    <div className={cn('overflow-hidden', className)} id={sectionId}>
      {/* Header/Trigger */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cn(
          'w-full flex items-center justify-between gap-4',
          'py-4 px-1 text-left',
          'group transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded-lg',
          headerClassName
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDownIcon
            isExpanded={isOpen}
            className="text-navy-400 group-hover:text-navy-600 transition-colors flex-shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-navy-900 group-hover:text-navy-700 transition-colors truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-navy-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </button>

      {/* Collapsible Content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={sectionId}
        style={{
          height: contentHeight !== undefined ? `${contentHeight}px` : 'auto',
        }}
        className={cn(
          'transition-all duration-300 ease-out-expo',
          !isOpen && 'opacity-0',
          isOpen && 'opacity-100'
        )}
      >
        <div ref={contentRef} className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

CollapsibleSection.displayName = 'CollapsibleSection';
