# Add Word Count to TextArea Component

## Objective
Add an optional word count display to the TextArea component. Recruiters need to know JD length for job board character/word limits without switching to external tools.

## Files to Modify
- `frontend/src/components/ui/TextArea.tsx`

## Implementation Details

### 1. Update the TextArea interface
Add new optional props:
```typescript
interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  showWordCount?: boolean;  // NEW: Enable word count display
  maxWords?: number;        // NEW: Optional max words (shows warning if exceeded)
}
```

### 2. Calculate word count
Create a helper to count words from the textarea value:
```typescript
const wordCount = useMemo(() => {
  const text = props.value?.toString() || '';
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}, [props.value]);
```

### 3. Add word count display after the textarea
Insert this after the `</textarea>` and before the error display:
```tsx
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
```

### 4. Update the analyze page to use word count
In `frontend/src/app/analyze/page.tsx`, update the TextArea usage:
```tsx
<TextArea
  label="Job Description"
  placeholder="Paste your job description here..."
  value={jdText}
  onChange={(e) => setJdText(e.target.value)}
  rows={10}
  disabled={isLoading}
  showWordCount  // ADD THIS
/>
```

## Acceptance Criteria
- [ ] Word count displays below textarea when `showWordCount` is true
- [ ] Count updates in real-time as user types
- [ ] Shows "1 word" vs "2 words" (proper pluralization)
- [ ] When `maxWords` is provided, shows "X / Y words"
- [ ] When over `maxWords`, text turns red with font-medium
- [ ] Numbers are formatted with locale separators (1,234)
- [ ] Empty textarea shows "0 words"
- [ ] Analyze page shows word count

## Testing
1. Go to /analyze page
2. Paste sample text - word count should appear
3. Clear text - should show "0 words"
4. Type single word - should show "1 word"
5. Type multiple words - should show correct count

## Notes
- Use `useMemo` to avoid recalculating on every render
- The count should be right-aligned below the textarea
- Keep styling subtle (text-xs, text-navy-500) to not distract from main content
