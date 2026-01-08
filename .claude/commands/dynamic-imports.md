# Implement Dynamic Imports for Modals and Wizards

## Objective
Use Next.js dynamic imports to code-split the CreateProfileWizard and EditProfileModal components. These are large components that are only shown conditionally, so loading them upfront wastes bandwidth for users who never use them.

## Files to Modify
- `frontend/src/app/profiles/page.tsx`

## Implementation Details

### 1. Current implementation

The profiles page currently imports these components statically:
```typescript
import {
  ProfileList,
  ProfileImportExport,
  CreateProfileWizard,  // Large, conditionally rendered
  EditProfileModal,     // Large, conditionally rendered
} from '@/components/profiles';
```

### 2. Convert to dynamic imports

Update the imports section:
```typescript
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
```

### 3. Ensure components have named exports

Check that the components use named exports. In `frontend/src/components/profiles/CreateProfileWizard.tsx`:
```typescript
export function CreateProfileWizard({ ... }) { ... }
```

Same for `EditProfileModal.tsx`:
```typescript
export function EditProfileModal({ ... }) { ... }
```

If they use default exports, adjust the dynamic import:
```typescript
const CreateProfileWizard = dynamic(
  () => import('@/components/profiles/CreateProfileWizard'),
  { ssr: false }
);
```

### 4. Why ssr: false?

These components:
- Use localStorage (client-only)
- Are never visible on initial page load
- Have complex client-side state

Disabling SSR prevents hydration mismatches and reduces server bundle size.

### 5. Loading states

The loading components should match the visual structure of the actual components to prevent layout shift:
- Use shimmer animation for skeleton effect
- Match approximate heights and spacing
- Use the same Card wrapper as the real component

## Acceptance Criteria
- [ ] Initial page load doesn't include wizard/modal code
- [ ] Clicking "Create Profile" loads wizard dynamically
- [ ] Clicking "Edit" loads modal dynamically
- [ ] Loading skeleton shows while component loads
- [ ] No flash of unstyled content
- [ ] No hydration errors in console

## Testing
1. Open DevTools Network tab
2. Go to /profiles - note the JS files loaded
3. Click "Create Profile" - new chunk should load
4. Verify wizard appears after brief loading state
5. Navigate away and back - wizard shouldn't reload if cached
6. Test Edit flow similarly

## Bundle Analysis
To verify code splitting is working:
```bash
cd frontend
npm run build
```

Look for separate chunks for CreateProfileWizard and EditProfileModal in the build output.

## Notes
- Dynamic imports create separate JS chunks
- First load may have slight delay (chunk needs to download)
- Subsequent loads are instant (cached)
- Loading state should be fast enough that skeleton barely shows
- `ssr: false` is important for client-only components
