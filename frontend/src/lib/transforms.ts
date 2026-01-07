// frontend/src/lib/transforms.ts

import { VoiceProfile } from '@/types/voice-profile';

/**
 * Transform frontend VoiceProfile (camelCase) to backend format (snake_case)
 */
export function transformVoiceProfileToBackend(profile: VoiceProfile) {
  return {
    // Core fields
    id: profile.id,
    name: profile.name,
    tone: profile.tone,
    address_style: profile.addressStyle,
    sentence_style: profile.sentenceStyle,
    words_to_avoid: profile.wordsToAvoid,
    words_to_prefer: profile.wordsToPrefer,
    structure_preference: profile.structurePreference,
    example_jd: profile.exampleJd,
    is_default: profile.isDefault,

    // Voice DNA Phase 2 fields
    tone_formality: profile.toneFormality,
    tone_description: profile.toneDescription,
    structure_preferences: profile.structurePreferences
      ? {
          lead_with_benefits: profile.structurePreferences.leadWithBenefits,
          section_order: profile.structurePreferences.sectionOrder,
          include_salary_prominently: profile.structurePreferences.includeSalaryProminently,
        }
      : undefined,
    brand_values: profile.brandValues,
    source_examples: profile.sourceExamples,
    created_via: profile.createdVia,
    rules:
      profile.rules?.map((rule) => ({
        id: rule.id,
        text: rule.text,
        rule_type: rule.ruleType,
        target: rule.target,
        value: rule.value,
        source: rule.source,
        active: rule.active,
      })) ?? [],
    format_guidance: profile.formatGuidance,
  };
}
