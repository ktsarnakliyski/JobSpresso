# Make QuestionItem Keyboard Accessible

## Objective
The QuestionItem component in QuestionCoverage.tsx is clickable to expand/collapse details, but it's not keyboard accessible. Users can't Tab to it or use Enter/Space to toggle it.

## Files to Modify
- `frontend/src/components/QuestionCoverage.tsx`

## Implementation Details

### 1. Identify the issue

Current code (around line 185-189):
```tsx
<div className="px-4 py-3 bg-white">
  <div
    className={cn('flex items-start gap-3', hasDetails && 'cursor-pointer')}
    onClick={() => hasDetails && setIsExpanded(!isExpanded)}
  >
```

The problem: Using a `<div>` with `onClick` is not keyboard accessible.

### 2. Solution: Use a button element

Refactor QuestionItem to use proper semantic HTML. Replace the clickable div with a button when the item has expandable details:

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

        {/* Impact stat - always show */}
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

### Key Changes
1. Use `<button>` instead of clickable `<div>` when `hasDetails` is true
2. Add `aria-expanded` to communicate state to screen readers
3. Add `focus-visible` ring for keyboard focus indication
4. Keep non-expandable items as plain `<div>` (no interactivity needed)
5. Add `text-left` to button content since buttons center by default

## Acceptance Criteria
- [ ] Can Tab to expandable question items
- [ ] Pressing Enter or Space toggles expansion
- [ ] Focus ring visible when focused via keyboard
- [ ] `aria-expanded` attribute updates correctly
- [ ] Non-expandable items don't receive focus
- [ ] Visual appearance unchanged

## Testing
1. Go to /analyze, submit a JD to get results
2. Tab through the page - question items should receive focus
3. Press Enter or Space on focused item - should expand/collapse
4. Use screen reader - should announce "expanded" / "collapsed"
5. Click still works as before

## Notes
- Only expandable items become buttons (items with evidence or suggestion)
- The `focus-visible` class ensures focus ring only shows for keyboard navigation
- `type="button"` prevents form submission if inside a form
- `text-left` on button ensures text alignment matches design
