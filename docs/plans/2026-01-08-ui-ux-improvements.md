# UI/UX Improvements Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement UI/UX improvements identified from comprehensive audit. Focus on accessibility, performance, and recruiter-focused UX enhancements.

**Execution Groups:**
- **Parallel Group 1 (Tasks 1.1-1.6):** No file conflicts - can run simultaneously
- **Sequential Group 2 (Tasks 2.1-2.4):** File overlaps - run one at a time after Group 1

---

## Phase 1: Parallel Improvements (No File Conflicts)

### Task 1.1: Add Word Count to TextArea Component

**Files:**
- Modify: `frontend/src/components/ui/TextArea.tsx`
- Modify: `frontend/src/app/analyze/page.tsx`

**Step 1: Update TextArea interface and add word count logic**

```typescript
// frontend/src/components/ui/TextArea.tsx

import { TextareaHTMLAttributes, forwardRef, useMemo } from 'react';
import { cn, getInputBaseClasses } from '@/lib/utils';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  showWordCount?: boolean;
  maxWords?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, id, disabled, showWordCount, maxWords, value, ...props }, ref) => {
    const wordCount = useMemo(() => {
      const text = value?.toString() || '';
      return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    }, [value]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-navy-700 mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          value={value}
          className={cn(
            getInputBaseClasses({ disabled, error: !!error }),
            'py-3 resize-none',
            className
          )}
          {...props}
        />
        {showWordCount && (
          <div className="flex justify-end mt-1.5">
            <span className={cn(
              'text-xs tabular-nums',
              maxWords && wordCount > maxWords ? 'text-red-600 font-medium' : 'text-navy-500'
            )}>
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
              {maxWords && ` / ${maxWords.toLocaleString()}`}
            </span>
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
```

**Step 2: Update analyze page to show word count**

In `frontend/src/app/analyze/page.tsx`, update the TextArea for job description input (around line 54-61):

```tsx
<TextArea
  label="Job Description"
  placeholder="Paste your job description here..."
  value={jdText}
  onChange={(e) => setJdText(e.target.value)}
  rows={10}
  disabled={isLoading}
  showWordCount
/>
```

**Step 3: Test the implementation**

```bash
cd frontend && npm run build
```

Visit `/analyze`, paste text, verify word count appears and updates in real-time.

**Step 4: Commit**

```bash
git add frontend/src/components/ui/TextArea.tsx frontend/src/app/analyze/page.tsx
git commit -m "feat(ui): add word count display to TextArea component

- Add showWordCount and maxWords props to TextArea
- Display word count below textarea when enabled
- Show warning color when exceeding maxWords
- Enable word count on analyze page for JD input"
```

---

### Task 1.2: Replace img with Next.js Image Component

**Files:**
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/next.config.mjs`

**Step 1: Update Layout.tsx to use Next.js Image**

```typescript
// frontend/src/components/Layout.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/analyze', label: 'Analyze' },
    { href: '/generate', label: 'Generate' },
    { href: '/profiles', label: 'Profiles' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-navy-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <Image
                src="/logo.png"
                alt="JobSpresso"
                width={144}
                height={36}
                priority
                className="h-9 w-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-navy-100 text-navy-900'
                        : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-navy-200/50 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-navy-500">
            JobSpresso — Craft job descriptions that attract the right talent
          </p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Update next.config.mjs with image optimization**

```javascript
// frontend/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

**Step 3: Test the implementation**

```bash
cd frontend && npm run build
```

Check DevTools Network tab - logo should now be served optimized.

**Step 4: Commit**

```bash
git add frontend/src/components/Layout.tsx frontend/next.config.mjs
git commit -m "perf: use Next.js Image component for logo optimization

- Replace <img> with <Image> for automatic WebP/AVIF optimization
- Add priority flag for above-fold loading
- Configure next.config.mjs with modern image formats
- Logo now ~20-40KB instead of 699KB"
```

---

### Task 1.3: Add Aria Labels for Accessibility

**Files:**
- Modify: `frontend/src/components/ui/BackButton.tsx`
- Modify: `frontend/src/components/CircularScore.tsx`
- Modify: `frontend/src/components/VoiceProfileSelector.tsx`
- Modify: `frontend/src/components/CategoryEvidence.tsx`

**Step 1: Update BackButton with aria-label**

```typescript
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
      aria-label={`Go back: ${label}`}
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
```

**Step 2: Update CircularScore with ARIA attributes**

In `frontend/src/components/CircularScore.tsx`, update the SVG container (around line 119-120):

```tsx
{/* Circular Score Ring */}
<div
  className="relative"
  style={{ width: sizeConfig.size, height: sizeConfig.size }}
  role="img"
  aria-label={`Score: ${animatedScore} out of 100, rated ${config.label}`}
>
  {/* Background ring */}
  <svg
    className="absolute inset-0 -rotate-90"
    width={sizeConfig.size}
    height={sizeConfig.size}
    aria-hidden="true"
  >
```

Also add `aria-hidden="true"` to the progress ring SVG (around line 139).

**Step 3: Update VoiceProfileSelector loading state**

In `frontend/src/components/VoiceProfileSelector.tsx`, update the loading div (around line 28):

```tsx
<div
  className="h-11 bg-navy-100 rounded-xl shimmer"
  role="status"
  aria-label="Loading voice profiles"
/>
```

**Step 4: Update CategoryCard with aria-expanded**

In `frontend/src/components/CategoryEvidence.tsx`, update the button (around line 79):

```tsx
<button
  onClick={() => setIsExpanded(!isExpanded)}
  aria-expanded={isExpanded}
  aria-controls={`category-${category}-content`}
  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-navy-50/50 transition-colors"
>
```

And add id to expanded content (around line 114):

```tsx
{isExpanded && (
  <div
    id={`category-${category}-content`}
    className="px-4 pb-4 pt-2 border-t border-navy-100 bg-navy-50/30"
  >
```

**Step 5: Test with screen reader or axe DevTools**

**Step 6: Commit**

```bash
git add frontend/src/components/ui/BackButton.tsx frontend/src/components/CircularScore.tsx frontend/src/components/VoiceProfileSelector.tsx frontend/src/components/CategoryEvidence.tsx
git commit -m "a11y: add ARIA labels to interactive components

- BackButton: add aria-label for screen readers
- CircularScore: add role=img and aria-label to SVG visualization
- VoiceProfileSelector: add role=status to loading state
- CategoryEvidence: add aria-expanded and aria-controls"
```

---

### Task 1.4: Add Wizard Progress Indicator

**Files:**
- Modify: `frontend/src/components/profiles/CreateProfileWizard.tsx`

**Step 1: Add step configuration and helper at top of file**

```typescript
// Add after imports in frontend/src/components/profiles/CreateProfileWizard.tsx

const WIZARD_STEPS = [
  { id: 'path-select', label: 'Choose Path' },
  { id: 'input', label: 'Input' },
  { id: 'preview', label: 'Preview' },
  { id: 'edit', label: 'Customize' },
] as const;

function getStepIndex(step: WizardStep): number {
  switch (step) {
    case 'path-select': return 0;
    case 'examples-upload':
    case 'guided': return 1;
    case 'preview': return 2;
    case 'edit': return 3;
    default: return 0;
  }
}
```

**Step 2: Create StepIndicator component**

```tsx
// Add before CreateProfileWizard function

interface StepIndicatorProps {
  currentStep: WizardStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="mb-8 animate-fade-up">
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {WIZARD_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all duration-300',
              index < currentIndex && 'bg-navy-400',
              index === currentIndex && 'bg-navy-800 scale-125',
              index > currentIndex && 'bg-navy-200'
            )}
            aria-current={index === currentIndex ? 'step' : undefined}
          />
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-sm text-navy-500">
        Step {currentIndex + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentIndex].label}
      </p>
    </div>
  );
}
```

**Step 3: Add StepIndicator to each wizard step return**

Update each step's return to include `<StepIndicator currentStep={step} />` at the top of the returned JSX. For example, path-select (around line 136):

```tsx
if (step === 'path-select') {
  return (
    <div className="space-y-8">
      <StepIndicator currentStep={step} />
      <Card className="animate-scale-in">
        <PathSelection onSelect={handlePathSelect} />
      </Card>
    </div>
  );
}
```

Repeat for: `examples-upload`, `guided`, `preview`, and `edit` steps.

**Step 4: Add cn import if not present**

```typescript
import { cn } from '@/lib/utils';
```

**Step 5: Test wizard flow**

Navigate to /profiles, click "Create Profile", verify step indicator shows and updates.

**Step 6: Commit**

```bash
git add frontend/src/components/profiles/CreateProfileWizard.tsx
git commit -m "feat(ux): add progress indicator to voice profile wizard

- Show step dots at top of wizard (1-4)
- Current step highlighted and scaled
- Display step label text below dots
- Helps users understand progress and time commitment"
```

---

### Task 1.5: Improve Copy Button Feedback

**Files:**
- Modify: `frontend/src/components/ui/CopyButton.tsx`

**Step 1: Update CopyButton with enhanced feedback**

```typescript
// frontend/src/components/ui/CopyButton.tsx

'use client';

import { useState, useCallback } from 'react';
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

  const handleCopy = useCallback(async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500); // Extended from 2000
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
  const colors = INLINE_VARIANTS[variant];

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500); // Extended from 2000
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
```

**Step 2: Test copy functionality**

Test both CopyButton (analyze results) and InlineCopyButton (issues panel).

**Step 3: Commit**

```bash
git add frontend/src/components/ui/CopyButton.tsx
git commit -m "feat(ux): enhance copy button feedback

- Extend feedback duration from 2s to 2.5s
- Add scale animation on copied state
- Add bounce animation to checkmark icon
- Change text color to emerald on success
- Add screen reader announcement for accessibility"
```

---

### Task 1.6: Implement Dynamic Imports for Modals/Wizards

**Files:**
- Modify: `frontend/src/app/profiles/page.tsx`

**Step 1: Update profiles page with dynamic imports**

```typescript
// frontend/src/app/profiles/page.tsx

'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, Button, ConfirmDialog } from '@/components/ui';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import { useVoiceExtraction } from '@/hooks/useVoiceExtraction';
import {
  ProfileList,
  ProfileImportExport,
} from '@/components/profiles';
import { VoiceProfile } from '@/types/voice-profile';

// Dynamic imports for conditionally rendered components
const CreateProfileWizard = dynamic(
  () => import('@/components/profiles/CreateProfileWizard').then(mod => mod.CreateProfileWizard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <div className="animate-fade-up">
          <div className="h-8 w-48 bg-navy-100 rounded-lg shimmer mb-2" />
          <div className="h-4 w-72 bg-navy-100 rounded shimmer" />
        </div>
        <Card className="animate-scale-in">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-navy-100 rounded shimmer" />
            <div className="h-32 bg-navy-100 rounded-xl shimmer" />
          </div>
        </Card>
      </div>
    )
  }
);

const EditProfileModal = dynamic(
  () => import('@/components/profiles/EditProfileModal').then(mod => mod.EditProfileModal),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <Card className="animate-scale-in">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-navy-100 rounded shimmer" />
            <div className="h-64 bg-navy-100 rounded-xl shimmer" />
          </div>
        </Card>
      </div>
    )
  }
);

type PageView = 'list' | 'create' | 'edit';

// ... rest of the component remains the same
```

**Step 2: Test code splitting**

```bash
cd frontend && npm run build
```

Check build output for separate chunks. Test /profiles page loading.

**Step 3: Commit**

```bash
git add frontend/src/app/profiles/page.tsx
git commit -m "perf: dynamic import wizard and modal components

- Use next/dynamic for CreateProfileWizard and EditProfileModal
- Reduce initial bundle size for profiles page
- Add loading skeletons for smooth UX during chunk load
- Disable SSR for client-only components"
```

---

## Phase 2: Sequential Improvements (File Overlaps)

### Task 2.1: Add Keyboard Shortcut (Cmd/Ctrl+Enter)

**Files:**
- Modify: `frontend/src/app/analyze/page.tsx`
- Modify: `frontend/src/app/generate/page.tsx`
- Modify: `frontend/src/components/generate/GenerateForm.tsx`

**Step 1: Update analyze page with keyboard shortcut**

In `frontend/src/app/analyze/page.tsx`, add useEffect after existing hooks (around line 40):

```typescript
// Keyboard shortcut: Cmd/Ctrl + Enter to analyze
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (jdText.trim() && !isLoading) {
        handleAnalyze();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [jdText, isLoading, handleAnalyze]);
```

Add `useEffect` to imports if not present.

Add hint text after the button (around line 87):

```tsx
<p className="text-xs text-navy-400 mt-3">
  Pro tip: Press {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to analyze
</p>
```

**Step 2: Update generate page with keyboard shortcut**

In `frontend/src/app/generate/page.tsx`, add similar useEffect:

```typescript
// Keyboard shortcut: Cmd/Ctrl + Enter to generate
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (formData.roleTitle.trim() && formData.responsibilities.trim() && formData.requirements.trim() && !isLoading) {
        handleGenerate();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [formData, isLoading, handleGenerate]);
```

Add `useEffect` to imports.

**Step 3: Update GenerateForm with hint text**

In `frontend/src/components/generate/GenerateForm.tsx`, add hint below the Generate button:

```tsx
<p className="text-xs text-navy-400 mt-3">
  Pro tip: Press {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to generate
</p>
```

**Step 4: Test keyboard shortcuts**

Test on both /analyze and /generate pages with Cmd+Enter (Mac) and Ctrl+Enter (Windows).

**Step 5: Commit**

```bash
git add frontend/src/app/analyze/page.tsx frontend/src/app/generate/page.tsx frontend/src/components/generate/GenerateForm.tsx
git commit -m "feat(ux): add keyboard shortcut (Cmd/Ctrl+Enter) for primary actions

- Analyze page: Cmd/Ctrl+Enter triggers analysis
- Generate page: Cmd/Ctrl+Enter triggers generation
- Show platform-specific hint text below buttons
- Shortcut disabled when loading or form invalid"
```

---

### Task 2.2: Add Enhanced Loading States with Rotating Messages

**Files:**
- Create: `frontend/src/components/ui/ProcessingMessages.tsx`
- Modify: `frontend/src/components/ui/index.ts`
- Modify: `frontend/src/app/analyze/page.tsx`
- Modify: `frontend/src/components/generate/GenerateForm.tsx`

**Step 1: Create ProcessingMessages component**

```typescript
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
```

**Step 2: Export from UI index**

In `frontend/src/components/ui/index.ts`, add:

```typescript
export { ProcessingMessages } from './ProcessingMessages';
```

**Step 3: Update analyze page with rotating messages**

In `frontend/src/app/analyze/page.tsx`:

Add messages constant near the top:

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

Update import:

```typescript
import { Card, Button, TextArea, LoadingSpinner, ErrorCard, CopyButton, ProcessingMessages } from '@/components/ui';
```

Update loading state in button (around lines 75-80):

```tsx
{isLoading ? (
  <>
    <LoadingSpinner className="-ml-1 mr-2" />
    <ProcessingMessages messages={ANALYZE_MESSAGES} />
  </>
) : 'Analyze'}
```

Add estimated time below button:

```tsx
{isLoading && (
  <p className="text-xs text-navy-400 mt-2">Usually takes 10-15 seconds</p>
)}
```

**Step 4: Update GenerateForm with rotating messages**

In `frontend/src/components/generate/GenerateForm.tsx`:

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

Import ProcessingMessages and update the loading state similarly.

**Step 5: Test rotating messages**

Submit analysis/generation and watch messages rotate.

**Step 6: Commit**

```bash
git add frontend/src/components/ui/ProcessingMessages.tsx frontend/src/components/ui/index.ts frontend/src/app/analyze/page.tsx frontend/src/components/generate/GenerateForm.tsx
git commit -m "feat(ux): add rotating progress messages during AI processing

- Create ProcessingMessages component with fade transitions
- Show context-aware messages during analysis/generation
- Display estimated time for user expectations
- Messages rotate every 2.5s to reduce perceived wait time"
```

---

### Task 2.3: Make QuestionItem Keyboard Accessible

**Files:**
- Modify: `frontend/src/components/QuestionCoverage.tsx`

**Step 1: Refactor QuestionItem to use semantic button**

Replace the QuestionItem function (around line 181-255) with:

```tsx
function QuestionItem({ question }: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = question.evidence || question.suggestion;

  const content = (
    <>
      {/* Status icon */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          question.isAnswered ? 'bg-emerald-100' : 'bg-navy-100'
        )}
      >
        {question.isAnswered ? (
          <CheckIcon className="w-4 h-4 text-emerald-600" />
        ) : (
          <QuestionIcon className="w-4 h-4 text-navy-400" />
        )}
      </div>

      {/* Question content */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            'text-sm font-medium',
            question.isAnswered ? 'text-navy-900' : 'text-navy-600'
          )}
        >
          {question.questionText}
        </p>

        {question.impactStat && (
          <p className="text-xs text-navy-500 mt-1">{question.impactStat}</p>
        )}
      </div>

      {/* Expand indicator */}
      {hasDetails && (
        <ChevronDownIcon
          isExpanded={isExpanded}
          className="w-4 h-4 text-navy-400 flex-shrink-0"
        />
      )}
    </>
  );

  return (
    <div className="px-4 py-3 bg-white">
      {hasDetails ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className={cn(
            'w-full flex items-start gap-3 cursor-pointer',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded-lg'
          )}
        >
          {content}
        </button>
      ) : (
        <div className="flex items-start gap-3">
          {content}
        </div>
      )}

      {/* Expandable details */}
      {isExpanded && (
        <div className="mt-3 ml-9 space-y-2">
          {question.isAnswered && question.evidence && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs font-medium text-emerald-700 mb-1">
                Found in your posting:
              </p>
              <p className="text-sm text-emerald-900 italic">
                &quot;{question.evidence}&quot;
              </p>
            </div>
          )}

          {!question.isAnswered && question.suggestion && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs font-medium text-amber-700 mb-1">Suggestion:</p>
              <p className="text-sm text-amber-900">{question.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Test keyboard navigation**

Tab through question items, use Enter/Space to toggle.

**Step 3: Commit**

```bash
git add frontend/src/components/QuestionCoverage.tsx
git commit -m "a11y: make QuestionItem keyboard accessible

- Use semantic button element for expandable items
- Add focus-visible ring for keyboard navigation
- Add aria-expanded attribute for screen readers
- Non-expandable items remain as plain divs"
```

---

### Task 2.4: Add React.memo to List Item Components

**Files:**
- Modify: `frontend/src/components/IssuesPanel.tsx`
- Modify: `frontend/src/components/QuestionCoverage.tsx`
- Modify: `frontend/src/components/CategoryEvidence.tsx`

**Step 1: Update IssuesPanel.tsx**

Add `memo` to imports:

```typescript
import { useMemo, useRef, forwardRef, useImperativeHandle, useState, useCallback, useEffect, memo } from 'react';
```

Wrap IssueCard (around line 207):

```typescript
const IssueCard = memo(function IssueCard({ issue }: IssueCardProps) {
  // ... existing implementation unchanged
});
```

Wrap IssueGroup (around line 144):

```typescript
const IssueGroup = memo(function IssueGroup({ group, issues, isOpen, onToggle }: IssueGroupProps) {
  // ... existing implementation unchanged
});
```

**Step 2: Update QuestionCoverage.tsx**

Add `memo` to imports:

```typescript
import { useState, memo } from 'react';
```

Wrap QuestionItem:

```typescript
const QuestionItem = memo(function QuestionItem({ question }: QuestionItemProps) {
  // ... existing implementation unchanged
});
```

**Step 3: Update CategoryEvidence.tsx**

Add `memo` to imports:

```typescript
import { useState, useMemo, memo } from 'react';
```

Wrap CategoryCard:

```typescript
const CategoryCard = memo(function CategoryCard({ category, evidence }: CategoryCardProps) {
  // ... existing implementation unchanged
});
```

**Step 4: Test with React DevTools Profiler**

Verify memoized components show "Did not render" when props unchanged.

**Step 5: Commit**

```bash
git add frontend/src/components/IssuesPanel.tsx frontend/src/components/QuestionCoverage.tsx frontend/src/components/CategoryEvidence.tsx
git commit -m "perf: add React.memo to list item components

- IssueCard and IssueGroup in IssuesPanel
- QuestionItem in QuestionCoverage
- CategoryCard in CategoryEvidence
- Prevents unnecessary re-renders when parent state changes"
```

---

## Final Steps

### Verification Checklist

After implementing all tasks:

- [ ] `npm run build` succeeds without errors
- [ ] All pages load without console errors
- [ ] Word count displays on analyze page
- [ ] Keyboard shortcuts work (Cmd/Ctrl+Enter)
- [ ] Logo loads optimized (check Network tab)
- [ ] Screen reader announces important elements
- [ ] Wizard shows progress indicator
- [ ] Copy button has enhanced feedback
- [ ] Loading messages rotate during analysis
- [ ] Tab navigation works on question items
- [ ] React DevTools shows memoized components

### Final Commit

```bash
git add .
git commit -m "chore: complete UI/UX improvements phase 1 and 2"
git push origin HEAD
```
