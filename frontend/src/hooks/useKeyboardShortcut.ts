// frontend/src/hooks/useKeyboardShortcut.ts

'use client';

import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  /** The callback to execute when the shortcut is triggered */
  onTrigger: () => void;
  /** Whether the shortcut should be enabled */
  enabled?: boolean;
  /** The key to listen for (default: 'Enter') */
  key?: string;
  /** Whether Cmd (Mac) or Ctrl (Windows/Linux) should be held */
  withModifier?: boolean;
}

/**
 * Hook to handle keyboard shortcuts consistently across the app.
 * Default: Cmd/Ctrl+Enter
 */
export function useKeyboardShortcut({
  onTrigger,
  enabled = true,
  key = 'Enter',
  withModifier = true,
}: UseKeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierPressed = withModifier ? (e.metaKey || e.ctrlKey) : true;

      if (modifierPressed && e.key === key && enabled) {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTrigger, enabled, key, withModifier]);
}
