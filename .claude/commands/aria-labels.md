# Add Aria Labels to Key Components for Accessibility

## Objective
Improve screen reader accessibility by adding proper ARIA attributes to interactive components that are missing them.

## Files to Modify
- `frontend/src/components/ui/BackButton.tsx`
- `frontend/src/components/CircularScore.tsx`
- `frontend/src/components/VoiceProfileSelector.tsx`

## Implementation Details

### 1. BackButton - Add aria-label (`frontend/src/components/ui/BackButton.tsx`)

Update the button element (around line 15):
```tsx
<button
  onClick={onClick}
  aria-label={`Go back: ${label}`}
  className={cn(
    'text-navy-600 hover:text-navy-800 text-sm flex items-center gap-1 mb-4',
    className
  )}
>
```

### 2. CircularScore - Add ARIA to SVG visualization (`frontend/src/components/CircularScore.tsx`)

Wrap the SVG visualization with proper ARIA attributes. Update the outer div (around line 120):
```tsx
{/* Circular Score Ring */}
<div
  className="relative"
  style={{ width: sizeConfig.size, height: sizeConfig.size }}
  role="img"
  aria-label={`Score: ${animatedScore} out of 100, rated ${config.label}`}
>
```

Also add `aria-hidden="true"` to the SVG elements since they're decorative:
```tsx
<svg
  className="absolute inset-0 -rotate-90"
  width={sizeConfig.size}
  height={sizeConfig.size}
  aria-hidden="true"
>
```

Add to both the background ring SVG (line 122) and the progress ring SVG (line 139).

### 3. VoiceProfileSelector - Add loading state announcement (`frontend/src/components/VoiceProfileSelector.tsx`)

Update the loading state div (around line 24-30):
```tsx
if (!isLoaded) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-navy-700 mb-2">
        Voice Profile
      </label>
      <div
        className="h-11 bg-navy-100 rounded-xl shimmer"
        role="status"
        aria-label="Loading voice profiles"
      />
    </div>
  );
}
```

### 4. CategoryEvidence - Add aria-expanded to CategoryCard (`frontend/src/components/CategoryEvidence.tsx`)

The CategoryCard button already works but should have explicit aria attributes. Update the button (around line 79):
```tsx
<button
  onClick={() => setIsExpanded(!isExpanded)}
  aria-expanded={isExpanded}
  aria-controls={`category-${category}-content`}
  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-navy-50/50 transition-colors"
>
```

And add id to the expanded content div (around line 114):
```tsx
{isExpanded && (
  <div
    id={`category-${category}-content`}
    className="px-4 pb-4 pt-2 border-t border-navy-100 bg-navy-50/30"
  >
```

## Acceptance Criteria
- [ ] BackButton announces "Go back: [label]" to screen readers
- [ ] CircularScore announces current score and rating level
- [ ] SVG elements are marked as decorative (aria-hidden)
- [ ] Loading states announce their purpose
- [ ] Expandable sections announce their state

## Testing
1. Use a screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to /analyze and trigger back button - should announce action
3. Submit an analysis - score should be announced
4. Loading states should announce what's loading
5. Use keyboard to navigate expandable sections

## Automated Testing
You can use axe DevTools browser extension to check for accessibility issues.

## Notes
- `role="img"` tells screen readers the element is an image
- `aria-label` provides the accessible name
- `aria-hidden="true"` hides decorative elements from screen readers
- `role="status"` announces loading state politely without interrupting
- `aria-expanded` communicates toggle state
- `aria-controls` links button to the content it controls
