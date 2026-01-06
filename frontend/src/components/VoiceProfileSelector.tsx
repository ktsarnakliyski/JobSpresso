// frontend/src/components/VoiceProfileSelector.tsx

'use client';

import { VoiceProfile } from '@/types/voice-profile';
import { Select } from '@/components/ui';
import Link from 'next/link';

interface VoiceProfileSelectorProps {
  profiles: VoiceProfile[];
  selectedProfileId: string | null;
  onSelect: (id: string | null) => void;
  isLoaded: boolean;
}

export function VoiceProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
  isLoaded,
}: VoiceProfileSelectorProps) {
  if (!isLoaded) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Voice Profile
        </label>
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const options = [
    { value: '', label: 'No profile (use defaults)' },
    ...profiles.map((p) => ({
      value: p.id,
      label: p.isDefault ? `${p.name} (default)` : p.name,
    })),
  ];

  return (
    <div className="space-y-2">
      <Select
        label="Voice Profile"
        options={options}
        value={selectedProfileId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
      />
      {profiles.length === 0 && (
        <p className="text-sm text-gray-500">
          No profiles yet.{' '}
          <Link href="/profiles" className="text-blue-600 hover:underline">
            Create one
          </Link>{' '}
          to customize your output.
        </p>
      )}
    </div>
  );
}
