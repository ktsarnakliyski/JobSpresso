# Enhanced Loading States with Rotating Progress Messages

## Objective
Replace the static "Analyzing..." text with rotating, context-aware messages that reduce perceived wait time and demonstrate what the AI is doing. Research shows this can reduce perceived wait time by up to 40%.

## Files to Modify
- `frontend/src/components/ui/ProcessingMessages.tsx` (CREATE NEW)
- `frontend/src/app/analyze/page.tsx`
- `frontend/src/app/generate/page.tsx`

## Implementation Details

### 1. Create ProcessingMessages component

Create new file `frontend/src/components/ui/ProcessingMessages.tsx`:
```tsx
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
```

### 2. Export from UI index

In `frontend/src/components/ui/index.ts`, add:
```typescript
export { ProcessingMessages } from './ProcessingMessages';
```

### 3. Update Analyze Page (`frontend/src/app/analyze/page.tsx`)

Add the messages constant near the top of the file:
```typescript
const ANALYZE_MESSAGES = [
  'Analyzing your job description...',
  'Checking for inclusive language...',
  'Evaluating readability...',
  'Assessing structure and completeness...',
  'Comparing to best practices...',
  'Generating improvement suggestions...',
];
```

Import the new component:
```typescript
import { Card, Button, TextArea, LoadingSpinner, ErrorCard, CopyButton, ProcessingMessages } from '@/components/ui';
```

Update the loading state in the button (around lines 75-80):
```tsx
{isLoading ? (
  <>
    <LoadingSpinner className="-ml-1 mr-2" />
    <ProcessingMessages messages={ANALYZE_MESSAGES} />
  </>
) : 'Analyze'}
```

Add estimated time below the button:
```tsx
{isLoading && (
  <p className="text-xs text-navy-400 mt-2">Usually takes 10-15 seconds</p>
)}
```

### 4. Update Generate Page (`frontend/src/app/generate/page.tsx`)

This page uses GenerateForm which handles its own button. Update `frontend/src/components/generate/GenerateForm.tsx`:

Add messages constant:
```typescript
const GENERATE_MESSAGES = [
  'Generating your job description...',
  'Crafting compelling introduction...',
  'Structuring responsibilities...',
  'Formatting requirements...',
  'Applying voice profile...',
  'Polishing final output...',
];
```

Import and use ProcessingMessages in the loading state.

## Acceptance Criteria
- [ ] Messages rotate every 2.5 seconds during loading
- [ ] Smooth fade transition between messages
- [ ] Screen readers announce messages (aria-live)
- [ ] Estimated time shows below button during loading
- [ ] Messages stop rotating when loading completes
- [ ] Different messages for analyze vs generate

## Testing
1. Go to /analyze, submit a JD - messages should rotate
2. Watch for smooth transitions (no flicker)
3. Time the full process - messages should cycle appropriately
4. Test with screen reader - should announce updates
5. Go to /generate, submit - should show generate-specific messages

## Notes
- 2.5 seconds feels natural; 2s is too fast, 3s is too slow
- Fade duration of 150ms is smooth but quick
- Messages should feel progressive (early to late in process)
- `aria-live="polite"` announces without interrupting
