# Add React.memo to List Item Components

## Objective
Wrap list item components in `React.memo` to prevent unnecessary re-renders when parent state changes but the item's props haven't changed. This improves performance when lists have many items.

## Files to Modify
- `frontend/src/components/IssuesPanel.tsx`
- `frontend/src/components/QuestionCoverage.tsx`
- `frontend/src/components/CategoryEvidence.tsx`

## Implementation Details

### 1. IssuesPanel.tsx - Memoize IssueCard and IssueGroup

Add React.memo import if not present:
```typescript
import { useMemo, useRef, forwardRef, useImperativeHandle, useState, useCallback, useEffect, memo } from 'react';
```

Wrap IssueCard (around line 207):
```typescript
const IssueCard = memo(function IssueCard({ issue }: IssueCardProps) {
  // ... existing implementation
});
```

Wrap IssueGroup (around line 144):
```typescript
const IssueGroup = memo(function IssueGroup({ group, issues, isOpen, onToggle }: IssueGroupProps) {
  // ... existing implementation
});
```

### 2. QuestionCoverage.tsx - Memoize QuestionItem

Add memo import:
```typescript
import { useState, memo } from 'react';
```

Wrap QuestionItem (around line 181):
```typescript
const QuestionItem = memo(function QuestionItem({ question }: QuestionItemProps) {
  // ... existing implementation
});
```

Also consider memoizing QuestionGroupsContent since it's used in multiple places:
```typescript
const QuestionGroupsContent = memo(function QuestionGroupsContent({
  questions,
  coveragePercent,
  showProgressBar = true,
  spacing = 'md',
}: QuestionGroupsContentProps) {
  // ... existing implementation
});
```

### 3. CategoryEvidence.tsx - Memoize CategoryCard

Add memo import:
```typescript
import { useState, useMemo, memo } from 'react';
```

Wrap CategoryCard (around line 66):
```typescript
const CategoryCard = memo(function CategoryCard({ category, evidence }: CategoryCardProps) {
  // ... existing implementation
});
```

### 4. Alternative syntax (arrow function style)

If you prefer arrow functions, you can use this pattern:
```typescript
interface IssueCardProps {
  issue: Issue;
}

const IssueCard: React.FC<IssueCardProps> = memo(({ issue }) => {
  // ... implementation
});

IssueCard.displayName = 'IssueCard';
```

### 5. When memo is most effective

React.memo is most beneficial when:
- The component renders often
- The component renders with the same props frequently
- The component is in a list
- The component does significant work during render

All our target components meet these criteria.

### 6. Custom comparison function (if needed)

If shallow comparison isn't enough, you can provide a custom comparator:
```typescript
const IssueCard = memo(function IssueCard({ issue }: IssueCardProps) {
  // ...
}, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render)
  return prevProps.issue.description === nextProps.issue.description;
});
```

For our components, the default shallow comparison should be sufficient.

## Acceptance Criteria
- [ ] IssueCard wrapped in React.memo
- [ ] IssueGroup wrapped in React.memo
- [ ] QuestionItem wrapped in React.memo
- [ ] CategoryCard wrapped in React.memo
- [ ] No TypeScript errors
- [ ] Components still render correctly
- [ ] displayName set for debugging (if using arrow function style)

## Testing
1. Run `npm run build` - should succeed without errors
2. Go to /analyze, submit a JD
3. Open React DevTools Profiler
4. Interact with the page (expand/collapse sections)
5. Check that memoized components show "Did not render" when their props didn't change

## Performance Verification
Using React DevTools Profiler:
1. Click "Start profiling"
2. Expand/collapse an issue group
3. Stop profiling
4. Look at the flame graph - memoized components should show as "Did not render" if their props didn't change

## Notes
- `memo` is imported from 'react' (same as `useState`, `useEffect`, etc.)
- Named function syntax (`memo(function Name() {})`) preserves component name in DevTools
- Arrow function style requires explicit `displayName` for DevTools
- memo only prevents re-renders when props are shallowly equal
- Don't over-use memo - it has a small cost for comparison
