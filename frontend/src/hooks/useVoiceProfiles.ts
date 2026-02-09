// frontend/src/hooks/useVoiceProfiles.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import posthog from 'posthog-js';
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

  // Load from localStorage on mount — this is synchronizing with an external store,
  // which is a valid use of setState in an effect (runs after hydration to avoid mismatch)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map(migrateProfile);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- loading from external store on mount
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

  // Save to localStorage whenever profiles change (with debounce to prevent race conditions)
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      } catch (e) {
        console.error('Failed to save profiles to localStorage:', e);
      }
    }, 300);  // 300ms debounce

    return () => clearTimeout(timeoutId);
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

    // Capture profile creation event
    posthog.capture('voice_profile_created', {
      profile_name: newProfile.name,
      created_via: newProfile.createdVia,
      tone: newProfile.tone,
      has_rules: (newProfile.rules?.length ?? 0) > 0,
      rules_count: newProfile.rules?.length ?? 0,
      is_default: newProfile.isDefault,
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
    // Capture deletion event before removing
    posthog.capture('voice_profile_deleted');

    setProfiles((prev) => prev.filter((p) => p.id !== id));
    // Use functional update to avoid stale closure
    setSelectedProfileId((prev) => (prev === id ? null : prev));
  }, []);

  const selectProfile = useCallback((id: string | null) => {
    setSelectedProfileId(id);

    // Capture profile selection event (only when selecting, not deselecting)
    if (id) {
      posthog.capture('voice_profile_selected');
    }
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

    // Capture export event
    posthog.capture('profiles_exported', {
      profiles_count: profiles.length,
    });
  }, [profiles]);

  const importProfiles = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate it's an array
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'Expected an array of profiles' };
      }

      // Validate each profile has required fields
      for (let i = 0; i < parsed.length; i++) {
        const p = parsed[i];
        if (typeof p !== 'object' || p === null) {
          return { success: false, error: `Profile ${i + 1} is not a valid object` };
        }
        if (typeof p.name !== 'string' || !p.name.trim()) {
          return { success: false, error: `Profile ${i + 1} is missing a valid name` };
        }
      }

      // Migrate and regenerate IDs
      const withNewIds = parsed.map((p: Partial<VoiceProfile>) =>
        migrateProfile({
          ...createDefaultVoiceProfile(p),
          id: generateId(),
          createdAt: new Date().toISOString(),
        })
      );

      setProfiles((prev) => [...prev, ...withNewIds]);

      // Capture successful import event
      posthog.capture('profiles_imported', {
        imported_count: withNewIds.length,
      });

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
