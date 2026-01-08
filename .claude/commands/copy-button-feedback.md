# Improve Copy Button Success Feedback

## Objective
Enhance the copy button feedback to be more noticeable and reassuring. The current 2-second "Copied!" message may be too brief and the visual change too subtle for users to notice, especially when copying important content like job descriptions.

## Files to Modify
- `frontend/src/components/ui/CopyButton.tsx`

## Implementation Details

### 1. Extend feedback duration

Change the timeout from 2000ms to 2500ms for better visibility:

In `CopyButton` function (around line 60):
```typescript
setTimeout(() => setCopied(false), 2500);  // Changed from 2000
```

In `InlineCopyButton` function (around line 103):
```typescript
setTimeout(() => setCopied(false), 2500);  // Changed from 2000
```

### 2. Add animation to the copied state

Update the CopyButton's return statement to add a subtle scale animation:
```tsx
return (
  <Button
    variant="outline"
    size={size}
    onClick={handleCopy}
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
);
```

### 3. Add aria-live for screen reader announcement

Add accessibility announcement:
```tsx
return (
  <>
    <Button
      variant="outline"
      size={size}
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : `Copy ${label || 'to clipboard'}`}
      className={cn(
        'transition-all duration-200',
        copied && 'scale-105'
      )}
    >
      {/* ... existing content ... */}
    </Button>
    {/* Screen reader announcement */}
    <span role="status" aria-live="polite" className="sr-only">
      {copied ? 'Copied to clipboard' : ''}
    </span>
  </>
);
```

### 4. Update InlineCopyButton similarly

Apply the same improvements to InlineCopyButton:
- Extend timeout to 2500ms
- Add subtle scale on copied state
- Add screen reader announcement

```tsx
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
```

### 5. Add sr-only class if not already in globals.css

Check if `sr-only` exists. If not, add to `frontend/src/app/globals.css`:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Note: Tailwind includes this by default, so it should already be available.

## Acceptance Criteria
- [ ] "Copied!" message displays for 2.5 seconds (up from 2)
- [ ] Button slightly scales up (scale-105) when copied
- [ ] Checkmark icon has bounce animation
- [ ] Text color changes to emerald when copied
- [ ] Screen readers announce "Copied to clipboard"
- [ ] Both CopyButton and InlineCopyButton are updated

## Testing
1. Go to /analyze, submit a JD
2. Click "Copy" on the improved version
3. Observe: button should scale up, checkmark should bounce
4. "Copied!" should be visible for ~2.5 seconds
5. Test with screen reader - should announce copy success
6. Test InlineCopyButton in issues panel

## Notes
- The bounce animation adds playfulness without being distracting
- Scale-105 is subtle but noticeable
- Emerald color provides semantic meaning (success)
- 2.5s is long enough to notice but not annoying
