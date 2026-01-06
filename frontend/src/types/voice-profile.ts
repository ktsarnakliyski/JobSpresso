// frontend/src/types/voice-profile.ts

export type ToneStyle =
  | 'formal'
  | 'professional'
  | 'friendly'
  | 'casual'
  | 'startup_casual';

export type AddressStyle = 'direct_you' | 'third_person' | 'we_looking';

export type SentenceStyle = 'short_punchy' | 'balanced' | 'detailed';

export interface VoiceProfile {
  id: string;
  name: string;
  tone: ToneStyle;
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  wordsToAvoid: string[];
  wordsToPrefer: string[];
  structurePreference: 'bullet_heavy' | 'mixed' | 'paragraph_focused';
  exampleJd?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface VoiceProfileFormData {
  name: string;
  tone: ToneStyle;
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  wordsToAvoid: string;
  wordsToPrefer: string;
  structurePreference: 'bullet_heavy' | 'mixed' | 'paragraph_focused';
}

export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
  { value: 'startup_casual', label: 'Startup Casual' },
] as const;

export const ADDRESS_OPTIONS = [
  { value: 'direct_you', label: 'Direct "You"' },
  { value: 'third_person', label: 'Third Person' },
  { value: 'we_looking', label: 'We\'re looking for...' },
] as const;

export const SENTENCE_OPTIONS = [
  { value: 'short_punchy', label: 'Short & Punchy' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
] as const;

export const STRUCTURE_OPTIONS = [
  { value: 'bullet_heavy', label: 'Bullet Heavy' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'paragraph_focused', label: 'Paragraph Focused' },
] as const;
