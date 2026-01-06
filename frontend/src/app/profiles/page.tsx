// frontend/src/app/profiles/page.tsx

'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, Button, TextArea, Select, Badge } from '@/components/ui';
import { useVoiceProfiles } from '@/hooks/useVoiceProfiles';
import {
  VoiceProfile,
  VoiceProfileFormData,
  TONE_OPTIONS,
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  STRUCTURE_OPTIONS,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
} from '@/types/voice-profile';
import { cn } from '@/lib/utils';

const initialFormData: VoiceProfileFormData = {
  name: '',
  tone: 'professional',
  addressStyle: 'direct_you',
  sentenceStyle: 'balanced',
  wordsToAvoid: '',
  wordsToPrefer: '',
  structurePreference: 'mixed',
};

export default function ProfilesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VoiceProfileFormData>(initialFormData);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    profiles,
    isLoaded,
    addProfile,
    updateProfile,
    deleteProfile,
    exportProfiles,
    importProfiles,
  } = useVoiceProfiles();

  const handleChange = useCallback(
    (field: keyof VoiceProfileFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim()) return;

    const profileData: Omit<VoiceProfile, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      tone: formData.tone,
      addressStyle: formData.addressStyle,
      sentenceStyle: formData.sentenceStyle,
      wordsToAvoid: formData.wordsToAvoid
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
      wordsToPrefer: formData.wordsToPrefer
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
      structurePreference: formData.structurePreference,
      isDefault: false,
    };

    if (editingId) {
      updateProfile(editingId, profileData);
    } else {
      addProfile(profileData);
    }

    setFormData(initialFormData);
    setShowForm(false);
    setEditingId(null);
  }, [formData, editingId, addProfile, updateProfile]);

  const handleEdit = useCallback((profile: VoiceProfile) => {
    setFormData({
      name: profile.name,
      tone: profile.tone,
      addressStyle: profile.addressStyle,
      sentenceStyle: profile.sentenceStyle,
      wordsToAvoid: profile.wordsToAvoid.join(', '),
      wordsToPrefer: profile.wordsToPrefer.join(', '),
      structurePreference: profile.structurePreference,
    });
    setEditingId(profile.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Are you sure you want to delete this profile?')) {
        deleteProfile(id);
      }
    },
    [deleteProfile]
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      updateProfile(id, { isDefault: true });
    },
    [updateProfile]
  );

  const handleCancel = useCallback(() => {
    setFormData(initialFormData);
    setShowForm(false);
    setEditingId(null);
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importProfiles(event.target?.result as string);
        if (result.success) {
          setImportError(null);
        } else {
          setImportError(result.error || 'Import failed');
        }
      };
      reader.readAsText(file);

      // Reset file input
      e.target.value = '';
    },
    [importProfiles]
  );

  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-espresso-900 tracking-tight">Voice Profiles</h1>
          <p className="text-espresso-600 mt-2">Loading...</p>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-espresso-100 rounded-2xl shimmer" />
          <div className="h-32 bg-espresso-100 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-espresso-900 tracking-tight">Voice Profiles</h1>
          <p className="text-espresso-600 mt-2">
            Create and manage profiles to customize how job descriptions are written.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          {profiles.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={exportProfiles}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Import
              </Button>
            </>
          )}
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Profile
            </Button>
          )}
        </div>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportError(null)}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="animate-scale-in">
          <h2 className="text-lg font-semibold text-espresso-900 mb-5">
            {editingId ? 'Edit Profile' : 'Create New Profile'}
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-espresso-700 mb-2">
                Profile Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={cn(
                  'w-full rounded-xl border border-espresso-200 px-4 py-2.5',
                  'bg-white text-espresso-900',
                  'transition-all duration-200 ease-out-expo',
                  'placeholder:text-espresso-400',
                  'hover:border-espresso-300',
                  'focus:border-espresso-500 focus:ring-2 focus:ring-espresso-500/15 focus:outline-none'
                )}
                placeholder="e.g., Startup Voice, Corporate Formal"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Select
                label="Tone"
                options={TONE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={formData.tone}
                onChange={(e) => handleChange('tone', e.target.value as ToneStyle)}
              />

              <Select
                label="Address Style"
                options={ADDRESS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={formData.addressStyle}
                onChange={(e) => handleChange('addressStyle', e.target.value as AddressStyle)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Select
                label="Sentence Style"
                options={SENTENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={formData.sentenceStyle}
                onChange={(e) => handleChange('sentenceStyle', e.target.value as SentenceStyle)}
              />

              <Select
                label="Structure Preference"
                options={STRUCTURE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={formData.structurePreference}
                onChange={(e) =>
                  handleChange(
                    'structurePreference',
                    e.target.value as VoiceProfileFormData['structurePreference']
                  )
                }
              />
            </div>

            <TextArea
              label="Words to Avoid"
              placeholder="Enter words separated by commas (e.g., ninja, rockstar, guru)"
              value={formData.wordsToAvoid}
              onChange={(e) => handleChange('wordsToAvoid', e.target.value)}
              rows={2}
            />

            <TextArea
              label="Words to Prefer"
              placeholder="Enter words separated by commas (e.g., collaborative, innovative)"
              value={formData.wordsToPrefer}
              onChange={(e) => handleChange('wordsToPrefer', e.target.value)}
              rows={2}
            />

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                {editingId ? 'Update Profile' : 'Create Profile'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Profiles List */}
      {profiles.length === 0 && !showForm ? (
        <Card className="animate-fade-up [animation-delay:100ms] opacity-0">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-espresso-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-espresso-500"
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
            <h3 className="text-lg font-semibold text-espresso-900 mb-2">
              No Voice Profiles Yet
            </h3>
            <p className="text-espresso-600 mb-6 max-w-sm mx-auto">
              Create your first voice profile to customize how job descriptions are written.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowForm(true)}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Profile
              </Button>
              <Button variant="outline" onClick={handleImport}>
                Import Profiles
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile, index) => (
            <Card
              key={profile.id}
              hover
              className={cn(
                'animate-fade-up opacity-0',
                `[animation-delay:${(index + 1) * 50}ms]`
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-espresso-900 truncate">
                      {profile.name}
                    </h3>
                    {profile.isDefault && (
                      <Badge variant="success">Default</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="default">
                      {TONE_OPTIONS.find((o) => o.value === profile.tone)?.label}
                    </Badge>
                    <Badge variant="default">
                      {ADDRESS_OPTIONS.find((o) => o.value === profile.addressStyle)?.label}
                    </Badge>
                    <Badge variant="default">
                      {SENTENCE_OPTIONS.find((o) => o.value === profile.sentenceStyle)?.label}
                    </Badge>
                    <Badge variant="default">
                      {STRUCTURE_OPTIONS.find((o) => o.value === profile.structurePreference)?.label}
                    </Badge>
                  </div>
                  {(profile.wordsToAvoid.length > 0 || profile.wordsToPrefer.length > 0) && (
                    <div className="text-sm text-espresso-600 space-y-1">
                      {profile.wordsToAvoid.length > 0 && (
                        <p>
                          <span className="font-medium text-espresso-700">Avoid:</span>{' '}
                          {profile.wordsToAvoid.slice(0, 5).join(', ')}
                          {profile.wordsToAvoid.length > 5 && (
                            <span className="text-espresso-500"> +{profile.wordsToAvoid.length - 5} more</span>
                          )}
                        </p>
                      )}
                      {profile.wordsToPrefer.length > 0 && (
                        <p>
                          <span className="font-medium text-espresso-700">Prefer:</span>{' '}
                          {profile.wordsToPrefer.slice(0, 5).join(', ')}
                          {profile.wordsToPrefer.length > 5 && (
                            <span className="text-espresso-500"> +{profile.wordsToPrefer.length - 5} more</span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {!profile.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(profile.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(profile)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDelete(profile.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
