// frontend/src/hooks/useVoiceProfiles.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  VoiceProfile,
  createDefaultVoiceProfile,
  createDefaultStructurePreferences,
} from '@/types/voice-profile';

const STORAGE_KEY = 'jobspresso_voice_profiles';
const SELECTED_PROFILE_KEY = 'jobspresso_selected_profile';

function generateId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Migrate legacy profiles to the new Voice DNA format.
 */
function migrateProfile(profile: Partial<VoiceProfile>): VoiceProfile {
  return createDefaultVoiceProfile({
    ...profile,
    // Ensure all new fields exist with defaults
    toneFormality: profile.toneFormality ?? 3,
    toneDescription: profile.toneDescription ?? 'Professional',
    structurePreferences: profile.structurePreferences ?? createDefaultStructurePreferences(),
    brandValues: profile.brandValues ?? [],
    sourceExamples: profile.sourceExamples ?? [],
    createdVia: profile.createdVia ?? 'manual',
    // Voice DNA Phase 2: Rules and format guidance
    rules: profile.rules ?? [],
    formatGuidance: profile.formatGuidance,
  });
}

export function useVoiceProfiles() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate any legacy profiles to new format
        const migrated = parsed.map(migrateProfile);
        setProfiles(migrated);
      } catch (e) {
        console.error('Failed to parse stored profiles:', e);
      }
    }

    const selectedId = localStorage.getItem(SELECTED_PROFILE_KEY);
    if (selectedId) {
      setSelectedProfileId(selectedId);
    }

    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever profiles change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles to localStorage:', e);
    }
  }, [profiles, isLoaded]);

  // Save selected profile ID
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (selectedProfileId) {
        localStorage.setItem(SELECTED_PROFILE_KEY, selectedProfileId);
      } else {
        localStorage.removeItem(SELECTED_PROFILE_KEY);
      }
    } catch (e) {
      console.error('Failed to save selected profile to localStorage:', e);
    }
  }, [selectedProfileId, isLoaded]);

  const addProfile = useCallback((profile: Omit<VoiceProfile, 'id' | 'createdAt'>) => {
    const newProfile: VoiceProfile = {
      ...createDefaultVoiceProfile(profile),
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    setProfiles((prev) => {
      // If this is set as default, unset others
      if (newProfile.isDefault) {
        return [...prev.map((p) => ({ ...p, isDefault: false })), newProfile];
      }
      return [...prev, newProfile];
    });

    return newProfile;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<VoiceProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates };
        }
        // If updating to default, unset others
        if (updates.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      })
    );
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    // Use functional update to avoid stale closure
    setSelectedProfileId((prev) => (prev === id ? null : prev));
  }, []);

  const selectProfile = useCallback((id: string | null) => {
    setSelectedProfileId(id);
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) || null;
  const defaultProfile = profiles.find((p) => p.isDefault) || null;

  const exportProfiles = useCallback(() => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `jobspresso-profiles-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }, [profiles]);

  const importProfiles = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as Partial<VoiceProfile>[];
      // Migrate and regenerate IDs
      const withNewIds = imported.map((p) =>
        migrateProfile({
          ...p,
          id: generateId(),
          createdAt: new Date().toISOString(),
        })
      );
      setProfiles((prev) => [...prev, ...withNewIds]);
      return { success: true, count: withNewIds.length };
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }
  }, []);

  return {
    profiles,
    selectedProfile,
    defaultProfile,
    selectedProfileId,
    isLoaded,
    addProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
    exportProfiles,
    importProfiles,
  };
}
