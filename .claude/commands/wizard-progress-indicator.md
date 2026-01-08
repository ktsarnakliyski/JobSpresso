# Add Progress Indicator to Voice Profile Wizard

## Objective
Add a visual step indicator to the CreateProfileWizard so users know where they are in the process and how many steps remain. This reduces abandonment and sets time expectations.

## Files to Modify
- `frontend/src/components/profiles/CreateProfileWizard.tsx`

## Implementation Details

### 1. Define step configuration

Add at the top of the file (after imports):
```typescript
const WIZARD_STEPS = [
  { id: 'path-select', label: 'Choose Path' },
  { id: 'input', label: 'Input' },  // examples-upload or guided
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

### 2. Create StepIndicator component

Add inside the file (before the main component):
```tsx
interface StepIndicatorProps {
  currentStep: WizardStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="mb-8">
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

### 3. Add StepIndicator to each wizard step

Update each step's return statement to include the indicator. For example, the path-select step (around line 136):

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

Do the same for:
- `examples-upload` step (around line 146)
- `guided` step (around line 163)
- `preview` step (around line 176)
- `edit` step (around line 191)

### 4. Alternative: Create wrapper component

Instead of adding to each step, create a wrapper:
```tsx
function WizardLayout({ step, children }: { step: WizardStep; children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <StepIndicator currentStep={step} />
      {children}
    </div>
  );
}
```

Then wrap each step's content:
```tsx
if (step === 'path-select') {
  return (
    <WizardLayout step={step}>
      <Card className="animate-scale-in">
        <PathSelection onSelect={handlePathSelect} />
      </Card>
    </WizardLayout>
  );
}
```

## Acceptance Criteria
- [ ] Step dots visible at top of wizard
- [ ] Current step dot is larger and darker
- [ ] Completed steps are medium gray
- [ ] Future steps are light gray
- [ ] Text shows "Step X of 4: [Label]"
- [ ] Indicator persists across all wizard steps
- [ ] Smooth transitions when moving between steps

## Testing
1. Go to /profiles, click "Create Profile"
2. Should see "Step 1 of 4: Choose Path" with first dot active
3. Select a path - should update to "Step 2 of 4: Input"
4. Continue through wizard - dots should update
5. Go back - indicator should reflect correct step

## Notes
- The wizard has branching (examples vs guided) but both count as step 2
- Use `aria-current="step"` for accessibility
- Keep the indicator above the Card for visual hierarchy
- Animation on current dot (scale-125) draws attention
