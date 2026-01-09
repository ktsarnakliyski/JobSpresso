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

export default function ProfilesPage() {
  const [view, setView] = useState<PageView>('list');
  const [editingProfile, setEditingProfile] = useState<VoiceProfile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    profiles,
    isLoaded,
    addProfile,
    updateProfile,
    deleteProfile,
    exportProfiles,
    importProfiles,
  } = useVoiceProfiles();

  const { isExtracting, error: extractError, extractFromExamples, reset: resetExtraction } = useVoiceExtraction();

  // Navigation
  const startCreation = useCallback(() => setView('create'), []);
  const closeWizard = useCallback(() => setView('list'), []);

  // Profile actions
  const handleEdit = useCallback((id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      setEditingProfile(profile);
      setView('edit');
    }
  }, [profiles]);

  const handleCloseEdit = useCallback(() => {
    setEditingProfile(null);
    setView('list');
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId) {
      deleteProfile(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteProfile]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  const handleSetDefault = useCallback(
    (id: string) => {
      updateProfile(id, { isDefault: true });
    },
    [updateProfile]
  );

  // Import/Export handlers
  const handleImportError = useCallback((error: string) => {
    setImportError(error);
  }, []);

  const handleImportSuccess = useCallback(() => {
    setImportError(null);
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Voice Profiles</h1>
          <p className="text-navy-600 mt-2">Loading...</p>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-navy-100 rounded-2xl shimmer" />
          <div className="h-32 bg-navy-100 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  // Create wizard view
  if (view === 'create') {
    return (
      <CreateProfileWizard
        isExtracting={isExtracting}
        extractError={extractError}
        onExtractFromExamples={extractFromExamples}
        onResetExtraction={resetExtraction}
        onSaveProfile={addProfile}
        onClose={closeWizard}
      />
    );
  }

  // Edit view
  if (view === 'edit' && editingProfile) {
    return (
      <EditProfileModal
        profile={editingProfile}
        onSave={updateProfile}
        onClose={handleCloseEdit}
      />
    );
  }

  // Get profile name for delete confirmation
  const profileToDelete = deleteConfirmId ? profiles.find(p => p.id === deleteConfirmId) : null;

  // Default: Profiles list view
  return (
    <>
      <div className="space-y-8">
        <div className="flex items-start justify-between animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Voice Profiles</h1>
            <p className="text-navy-600 mt-2">
              Capture your unique writing style for consistent job descriptions.
            </p>
          </div>
          {profiles.length > 0 && (
            <div className="flex gap-2">
              <ProfileImportExport
                hasProfiles={profiles.length > 0}
                onExport={exportProfiles}
                onImport={importProfiles}
                onImportError={handleImportError}
                onImportSuccess={handleImportSuccess}
              />
              <Button onClick={startCreation}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Profile
              </Button>
            </div>
          )}
        </div>

        {importError && (
          <Card className="border-red-200 bg-red-50 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-700">{importError}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setImportError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        <ProfileList
          profiles={profiles}
          onDelete={handleDeleteRequest}
          onSetDefault={handleSetDefault}
          onEdit={handleEdit}
          onCreateNew={startCreation}
          onImport={() => {
            // Trigger import from empty state - need to manually trigger file input
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            input?.click();
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Profile"
        message={profileToDelete
          ? `Are you sure you want to delete "${profileToDelete.name}"? This action cannot be undone.`
          : 'Are you sure you want to delete this profile? This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="destructive"
      />
    </>
  );
}
