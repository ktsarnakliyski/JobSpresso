---
execution: sequential
depends_on: []
---

<objective>
Refactor the two largest files in the codebase and address warning-level architecture issues:

**Critical (split these files):**
1. `claude_service.py` (651 lines) - God class doing analysis, generation, AND voice extraction
2. `profiles/page.tsx` (737 lines) - God component with wizard, list, edit, import/export

**Warning level (improve these):**
3. `generate/page.tsx` (493 lines) - Extract form sections
4. `VoiceProfileEditor.tsx` (302 lines) - Extract section sub-components
5. `assessment_service.py` (450 lines) - Extract prompt builders
</objective>

<context>
Read CLAUDE.md for project conventions.

<audit_findings>
From ./analyses/002-antipatterns-large-files.md:

The codebase has two "god" files that are hard to maintain:
- `claude_service.py`: Handles 3 different concerns (analysis, generation, voice extraction) with ~200 lines of inline prompts
- `profiles/page.tsx`: Handles 5+ concerns (list, create wizard, edit, delete, import/export) with 10+ useState calls

Warning-level files could benefit from extraction but are not critical.
</audit_findings>

<refactoring_targets>
**claude_service.py (651 lines) → Split into:**
- prompts/ directory with template files
- claude_client.py (API wrapper)
- Keep claude_service.py as thin orchestrator (~150 lines)

**profiles/page.tsx (737 lines) → Split into:**
- ProfileList.tsx (~100 lines)
- CreateProfileWizard.tsx (~250 lines)
- EditProfileDialog.tsx (~100 lines)
- ProfileImportExport.tsx (~80 lines)
- Keep profiles/page.tsx as layout (~50 lines)

**Warning level improvements:**
- generate/page.tsx: Extract GenerateForm and GenerateResult components
- VoiceProfileEditor.tsx: Extract ToneSection, VocabularySection sub-components
- assessment_service.py: Move prompt template building to separate module
</refactoring_targets>
</context>

<requirements>
<functional>
1. All existing functionality must work exactly the same after refactoring
2. No behavioral changes - this is pure refactoring
3. Maintain the same public API for all modules
4. Tests should pass without modification (or minimal updates for imports)
</functional>

<quality>
- Each new file should have a single, clear responsibility
- No file should exceed 300 lines after refactoring
- Minimize prop drilling - use composition patterns
- Keep related code together (co-location principle)
</quality>
</requirements>

<implementation_guide>

<phase_1_backend_prompts>
**Extract Prompt Templates**

Create a new directory structure:
```
backend/app/prompts/
  __init__.py
  analysis_prompt.py
  generation_prompt.py
  improvement_prompt.py
  voice_extraction_prompt.py
```

Each file exports a function that builds the prompt:
```python
# backend/app/prompts/analysis_prompt.py
def build_analysis_prompt(
    jd_text: str,
    voice_profile_context: str | None = None
) -> str:
    """Build the analysis prompt with optional voice profile context."""
    base_prompt = """You are an expert job description analyst...
    [MOVED FROM claude_service.py]
    """
    # ... build and return prompt
```

Update claude_service.py to import and use these:
```python
from app.prompts.analysis_prompt import build_analysis_prompt
from app.prompts.generation_prompt import build_generation_prompt
# etc.
```
</phase_1_backend_prompts>

<phase_2_claude_service>
**Slim Down claude_service.py**

After extracting prompts, claude_service.py should only contain:
1. ClaudeService class with API client initialization
2. `analyze()` method - calls prompt builder, makes API call, parses response
3. `generate()` method - same pattern
4. `generate_improvement()` method - same pattern
5. `extract_voice_profile()` method - same pattern
6. Response parsing methods (these can stay as they're tightly coupled to API responses)

Target: ~200-250 lines
</phase_2_claude_service>

<phase_3_profiles_page>
**Split profiles/page.tsx**

Create new components in `frontend/src/components/profiles/`:

```typescript
// ProfileList.tsx
interface ProfileListProps {
  profiles: VoiceProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (profile: VoiceProfile) => void;
  onDelete: (id: string) => void;
  onDuplicate: (profile: VoiceProfile) => void;
}

export function ProfileList({ profiles, selectedId, onSelect, onEdit, onDelete, onDuplicate }: ProfileListProps) {
  // Profile list rendering logic moved here
}
```

```typescript
// CreateProfileWizard.tsx
interface CreateProfileWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: VoiceProfile) => void;
}

export function CreateProfileWizard({ isOpen, onClose, onComplete }: CreateProfileWizardProps) {
  // All wizard state and step logic moved here
  const [step, setStep] = useState(0);
  // ... wizard implementation
}
```

```typescript
// ProfileImportExport.tsx
interface ProfileImportExportProps {
  profiles: VoiceProfile[];
  onImport: (json: string) => { success: boolean; count?: number; error?: string };
}

export function ProfileImportExport({ profiles, onImport }: ProfileImportExportProps) {
  // Import/export UI and logic
}
```

Update profiles/page.tsx to compose these:
```typescript
export default function ProfilesPage() {
  const { profiles, addProfile, updateProfile, deleteProfile, ... } = useVoiceProfiles();
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VoiceProfile | null>(null);

  return (
    <Layout>
      <PageHeader onCreateNew={() => setWizardOpen(true)} />

      <ProfileList
        profiles={profiles}
        onEdit={setEditingProfile}
        onDelete={deleteProfile}
        // ...
      />

      <CreateProfileWizard
        isOpen={isWizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(profile) => { addProfile(profile); setWizardOpen(false); }}
      />

      {editingProfile && (
        <EditProfileDialog
          profile={editingProfile}
          onSave={updateProfile}
          onClose={() => setEditingProfile(null)}
        />
      )}

      <ProfileImportExport profiles={profiles} onImport={importProfiles} />
    </Layout>
  );
}
```
</phase_3_profiles_page>

<phase_4_warning_improvements>
**generate/page.tsx - Extract Components**

Create:
- `GenerateForm.tsx` - All form fields and validation hints
- `GenerateResult.tsx` - Result display with copy functionality

**VoiceProfileEditor.tsx - Extract Sections**

Create sub-components for each form section:
- `ToneSection.tsx` - Formality, address style
- `VocabularySection.tsx` - Words to use/avoid
- `StructureSection.tsx` - Section ordering, preferences

**assessment_service.py - Optional**

If time permits, extract evidence prompt building to a separate module. This is lower priority.
</phase_4_warning_improvements>

</implementation_guide>

<verification>
1. Run all backend tests: `cd backend && pytest -v`
2. Run frontend build: `cd frontend && npm run build`
3. Verify no TypeScript errors
4. Manual testing:
   - Test full analysis flow
   - Test full generation flow
   - Test voice profile extraction
   - Test profile creation wizard
   - Test profile editing
   - Test import/export
5. Check file sizes:
   - claude_service.py should be < 300 lines
   - profiles/page.tsx should be < 100 lines
   - All new components should be < 300 lines
</verification>

<success_criteria>
- All functionality works identically to before
- claude_service.py reduced to ~200-250 lines
- profiles/page.tsx reduced to ~50-100 lines
- No file exceeds 300 lines
- All tests passing
- Clean component boundaries with minimal prop drilling
</success_criteria>
