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
        <label className="block text-sm font-medium text-espresso-700 mb-2">
          Voice Profile
        </label>
        <div className="h-11 bg-espresso-100 rounded-xl shimmer" />
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
        <p className="text-sm text-espresso-500">
          No profiles yet.{' '}
          <Link href="/profiles" className="text-espresso-700 font-medium hover:underline">
            Create one
          </Link>{' '}
          to customize your output.
        </p>
      )}
    </div>
  );
}
