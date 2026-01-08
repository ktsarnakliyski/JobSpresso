// frontend/src/components/profiles/ProfileList.tsx

'use client';

import { Card, Button } from '@/components/ui';
import { VoiceProfile } from '@/types/voice-profile';
import { ProfileCard } from './ProfileCard';

interface ProfileListProps {
  profiles: VoiceProfile[];
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onEdit: (id: string) => void;
  onCreateNew: () => void;
  onImport: () => void;
}

export function ProfileList({
  profiles,
  onDelete,
  onSetDefault,
  onEdit,
  onCreateNew,
  onImport,
}: ProfileListProps) {
  // Empty state
  if (profiles.length === 0) {
    return (
      <Card className="animate-fade-up [animation-delay:100ms] opacity-0">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-navy-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">
            Capture Your Voice
          </h3>
          <p className="text-navy-600 mb-6 max-w-sm mx-auto">
            Create a voice profile to ensure all your job descriptions sound authentically you.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onCreateNew}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Profile
            </Button>
            <Button variant="outline" onClick={onImport}>
              Import Profiles
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Profiles list
  return (
    <div className="space-y-4">
      {profiles.map((profile, index) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          index={index}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
