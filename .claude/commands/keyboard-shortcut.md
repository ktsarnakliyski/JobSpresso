# Add Keyboard Shortcut (Cmd/Ctrl+Enter) for Primary Actions

## Objective
Add keyboard shortcut support so power users can quickly submit forms using Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux). This is a standard UX pattern in productivity tools.

## Files to Modify
- `frontend/src/app/analyze/page.tsx`
- `frontend/src/app/generate/page.tsx`

## Implementation Details

### 1. Update Analyze Page (`frontend/src/app/analyze/page.tsx`)

Add useEffect hook after the existing hooks (around line 40):
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

Add hint text below the button (after line 87):
```tsx
<p className="text-xs text-navy-400 mt-3">
  Pro tip: Press {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to analyze
</p>
```

### 2. Update Generate Page (`frontend/src/app/generate/page.tsx`)

The Generate page uses a form component, so we need to add the keyboard handler in the page component.

Add useEffect hook after the existing hooks (around line 40):
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

### 3. Update GenerateForm component to show hint

In `frontend/src/components/generate/GenerateForm.tsx`, add the hint text below the Generate button:
```tsx
<p className="text-xs text-navy-400 mt-3">
  Pro tip: Press {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to generate
</p>
```

## Acceptance Criteria
- [ ] Pressing Cmd+Enter on Mac triggers analyze/generate
- [ ] Pressing Ctrl+Enter on Windows/Linux triggers analyze/generate
- [ ] Shortcut only works when form is valid (required fields filled)
- [ ] Shortcut is disabled during loading state
- [ ] Hint text shows correct modifier key for user's platform
- [ ] Event is prevented to avoid default browser behavior

## Testing
1. Go to /analyze, paste text, press Cmd/Ctrl+Enter - should analyze
2. Go to /analyze with empty input, press shortcut - should not trigger
3. During analysis loading, press shortcut - should not trigger again
4. Go to /generate, fill required fields, press shortcut - should generate
5. Verify hint text shows correct key symbol for your OS

## Notes
- Use `e.preventDefault()` to prevent any default browser behavior
- Check `navigator.platform` for Mac detection (includes 'Mac')
- The useEffect dependencies must include all values used in the handler
- Use Unicode ⌘ symbol for Mac, "Ctrl" text for others
