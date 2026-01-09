// frontend/src/components/ui/ProcessingMessages.tsx

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProcessingMessagesProps {
  messages: string[];
  intervalMs?: number;
  className?: string;
}

export function ProcessingMessages({
  messages,
  intervalMs = 2500,
  className
}: ProcessingMessagesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsTransitioning(false);
      }, 150);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [messages.length, intervalMs]);

  return (
    <span
      className={cn(
        'inline-block transition-opacity duration-150',
        isTransitioning ? 'opacity-0' : 'opacity-100',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {messages[currentIndex]}
    </span>
  );
}
