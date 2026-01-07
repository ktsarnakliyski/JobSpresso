// frontend/src/types/voice-profile.ts

export type ToneStyle = 'formal' | 'professional' | 'friendly' | 'casual' | 'startup_casual';
export type AddressStyle = 'direct_you' | 'third_person' | 'we_looking';
export type SentenceStyle = 'short_punchy' | 'balanced' | 'detailed';
export type CreationMethod = 'examples' | 'guided' | 'manual';
export type RuleType = 'exclude' | 'include' | 'format' | 'order' | 'limit' | 'custom';

export interface ProfileRule {
  id: string;
  text: string; // Natural language rule: "Never include salary"
  ruleType: RuleType;
  target?: string; // What it applies to: "salary", "requirements"
  value?: string; // Additional value: "bullets", "5"
  source: 'manual' | 'ai_suggested' | 'extracted';
  active: boolean;
}

export interface SuggestedRule {
  text: string;
  ruleType: RuleType;
  target?: string;
  value?: string;
  confidence: number;
  evidence: string;
}

export interface StructurePreferences {
  leadWithBenefits: boolean;
  sectionOrder: string[];
  includeSalaryProminently: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;

  // Tone (enhanced)
  toneFormality: number; // 1-5
  toneDescription: string;
  tone: ToneStyle; // legacy

  // Style
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;

  // Structure (new)
  structurePreferences: StructurePreferences;
  structurePreference: string; // legacy

  // Vocabulary
  wordsToAvoid: string[];
  wordsToPrefer: string[];

  // Brand (new)
  brandValues: string[];

  // Source tracking (new)
  sourceExamples: string[];
  createdVia: CreationMethod;

  // Dynamic rules (new)
  rules: ProfileRule[];
  formatGuidance?: string;

  // Metadata
  exampleJd?: string; // legacy
  isDefault: boolean;
  createdAt?: string;
}

export interface VoiceProfileFormData {
  name: string;
  toneFormality: number;
  toneDescription: string;
  tone: ToneStyle;
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  structurePreferences: StructurePreferences;
  wordsToAvoid: string;
  wordsToPrefer: string;
  brandValues: string;
  structurePreference: string;
}

// Voice extraction response (from API)
export interface VoiceExtractionResult {
  tone: ToneStyle;
  toneFormality: number;
  toneDescription: string;
  addressStyle: AddressStyle;
  sentenceStyle: SentenceStyle;
  structureAnalysis: {
    leadsWithBenefits: boolean;
    typicalSectionOrder: string[];
    includesSalary: boolean;
  };
  vocabulary: {
    commonlyUsed: string[];
    notablyAvoided: string[];
  };
  brandSignals: {
    values: string[];
    personality: string;
  };
  suggestedRules: SuggestedRule[];
  formatGuidance?: string;
  summary: string;
}

// UI Options
export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal & Traditional' },
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Warm' },
  { value: 'casual', label: 'Casual' },
  { value: 'startup_casual', label: 'Startup Casual' },
] as const;

export const ADDRESS_OPTIONS = [
  { value: 'direct_you', label: 'Direct (You/Your)' },
  { value: 'third_person', label: 'Third Person (The candidate)' },
  { value: 'we_looking', label: "Company Voice (We're looking for)" },
] as const;

export const SENTENCE_OPTIONS = [
  { value: 'short_punchy', label: 'Short & Punchy' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed & Thorough' },
] as const;

export const STRUCTURE_OPTIONS = [
  { value: 'bullet_heavy', label: 'Bullet-Heavy' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'paragraph_focused', label: 'Paragraph-Focused' },
] as const;

export const FORMALITY_LABELS: Record<number, string> = {
  1: 'Very Formal',
  2: 'Professional',
  3: 'Balanced',
  4: 'Friendly',
  5: 'Casual',
};

/**
 * Maps rule targets and keywords to form field names.
 * Used for validation to check if profile rules reference missing data.
 */
export const RULE_TARGET_FIELD_MAP: Record<string, { field: string; label: string }> = {
  // Salary-related
  salary: { field: 'salaryRange', label: 'Salary Range' },
  compensation: { field: 'salaryRange', label: 'Salary Range' },
  pay: { field: 'salaryRange', label: 'Salary Range' },
  // Benefits-related
  benefits: { field: 'benefits', label: 'Benefits' },
  perks: { field: 'benefits', label: 'Benefits' },
  // Team/company-related
  team: { field: 'teamSize', label: 'Team Size' },
  team_size: { field: 'teamSize', label: 'Team Size' },
  // Location-related
  location: { field: 'location', label: 'Location' },
  remote: { field: 'location', label: 'Location' },
  office: { field: 'location', label: 'Location' },
  // Company culture
  culture: { field: 'companyDescription', label: 'Company Description' },
  company: { field: 'companyDescription', label: 'Company Description' },
  mission: { field: 'companyDescription', label: 'Company Description' },
};

/**
 * Create default structure preferences
 */
export function createDefaultStructurePreferences(): StructurePreferences {
  return {
    leadWithBenefits: false,
    sectionOrder: ['intro', 'responsibilities', 'requirements', 'benefits'],
    includeSalaryProminently: false,
  };
}

/**
 * Create a default voice profile (for migration/initialization)
 */
export function createDefaultVoiceProfile(partial: Partial<VoiceProfile> = {}): VoiceProfile {
  const defaults: VoiceProfile = {
    id: '',
    name: '',
    toneFormality: 3,
    toneDescription: 'Professional',
    tone: 'professional',
    addressStyle: 'direct_you',
    sentenceStyle: 'balanced',
    structurePreferences: createDefaultStructurePreferences(),
    structurePreference: 'mixed',
    wordsToAvoid: [],
    wordsToPrefer: [],
    brandValues: [],
    sourceExamples: [],
    createdVia: 'manual',
    rules: [],
    isDefault: false,
  };

  return {
    ...defaults,
    ...partial,
    // Ensure arrays are never undefined after spread
    rules: partial.rules ?? defaults.rules,
  };
}
