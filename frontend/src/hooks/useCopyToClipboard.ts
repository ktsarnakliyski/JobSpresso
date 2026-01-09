// frontend/src/hooks/useCopyToClipboard.ts

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const COPY_FEEDBACK_DURATION_MS = 2500;

interface UseCopyToClipboardResult {
  /** Whether the text was recently copied */
  copied: boolean;
  /** Function to copy text to clipboard */
  copy: (text: string) => Promise<void>;
}

/**
 * Hook to handle copying text to clipboard with feedback state.
 * Automatically resets the copied state after 2.5 seconds.
 */
export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Clear any existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Reset copied state after delay
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, COPY_FEEDBACK_DURATION_MS);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  return { copied, copy };
}
