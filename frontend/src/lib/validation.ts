// frontend/src/lib/validation.ts

import { VoiceProfile, ProfileRule, RULE_TARGET_FIELD_MAP } from '@/types/voice-profile';

export interface ProfileHint {
  field: string;
  label: string;
  reason: string;
  priority: 'recommended' | 'suggested';
}

export interface GenerateFormData {
  roleTitle?: string;
  companyDescription?: string;
  responsibilities?: string;
  requirements?: string;
  niceToHave?: string;
  benefits?: string;
  salaryRange?: string;
  location?: string;
  teamSize?: string;
}

/**
 * Check if a form field is considered "filled" (non-empty after trimming)
 */
function isFieldFilled(value: string | undefined): boolean {
  return !!value?.trim();
}

/**
 * Patterns that indicate exclusion intent in rule text.
 * Matches backend logic in assessment_service.py
 */
const EXCLUSION_PATTERNS = [
  'never include',
  "don't include",
  'do not include',
  'exclude',
  'skip',
  'omit',
  'no salary',
  'no location',
  'no benefits',
  'no team',
  'without salary',
  'without location',
  'without benefits',
];

/**
 * Check if a rule has exclusion intent (either explicit ruleType or text patterns).
 * Used to avoid suggesting fields that the user wants to exclude.
 */
function hasExclusionIntent(rule: ProfileRule): boolean {
  // Explicit exclude rule type
  if (rule.ruleType === 'exclude') {
    return true;
  }

  // Check for exclusion patterns in custom rules
  if (rule.ruleType === 'custom') {
    const lowerText = rule.text.toLowerCase();
    return EXCLUSION_PATTERNS.some(pattern => lowerText.includes(pattern));
  }

  return false;
}

/**
 * Check if a specific field is excluded by any active rule in the profile.
 * Used to avoid suggesting fields that have exclusion rules.
 */
function isFieldExcludedByRules(profile: VoiceProfile, fieldKeywords: string[]): boolean {
  const activeRules = profile.rules?.filter((r) => r.active) ?? [];

  for (const rule of activeRules) {
    if (!hasExclusionIntent(rule)) continue;

    const lowerText = rule.text.toLowerCase();
    const lowerTarget = rule.target?.toLowerCase() ?? '';

    // Check if any of the field keywords match the rule target or text
    for (const keyword of fieldKeywords) {
      if (lowerTarget === keyword || lowerText.includes(keyword)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parse format guidance or rule text for keywords that map to form fields.
 * Returns an array of field mappings found in the text.
 */
function findKeywordsInText(text: string): Array<{ field: string; label: string; keyword: string }> {
  const found: Array<{ field: string; label: string; keyword: string }> = [];
  const lowerText = text.toLowerCase();

  for (const [keyword, mapping] of Object.entries(RULE_TARGET_FIELD_MAP)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerText)) {
      // Avoid duplicates for the same field
      if (!found.some((f) => f.field === mapping.field)) {
        found.push({ ...mapping, keyword });
      }
    }
  }

  return found;
}

/**
 * Get profile hints - suggestions for improving generation based on profile requirements.
 *
 * This function checks if a voice profile references data that isn't provided in the form.
 * It returns "optimization hints" (not errors) - suggestions that would improve results.
 *
 * @param profile - The selected voice profile
 * @param formData - Current form field values
 * @returns Array of hints about missing data that would improve results
 */
export function getProfileHints(
  profile: VoiceProfile | null | undefined,
  formData: GenerateFormData
): ProfileHint[] {
  if (!profile) return [];

  const hints: ProfileHint[] = [];
  const addedFields = new Set<string>();

  // Helper to add a hint if field not already hinted
  const addHint = (field: string, label: string, reason: string, priority: ProfileHint['priority']) => {
    if (!addedFields.has(field)) {
      hints.push({ field, label, reason, priority });
      addedFields.add(field);
    }
  };

  // 1. Check active rules for targets that map to empty fields
  // Skip rules with exclusion intent - we don't want to suggest adding fields the user wants to exclude
  const activeRules = profile.rules?.filter((r) => r.active) ?? [];
  for (const rule of activeRules) {
    // Skip exclusion rules - these explicitly say NOT to include certain fields
    if (hasExclusionIntent(rule)) {
      continue;
    }

    // Check rule.target directly
    if (rule.target) {
      const mapping = RULE_TARGET_FIELD_MAP[rule.target.toLowerCase()];
      if (mapping && !isFieldFilled(formData[mapping.field as keyof GenerateFormData])) {
        addHint(
          mapping.field,
          mapping.label,
          `Rule "${rule.text}" references ${mapping.label.toLowerCase()}`,
          'recommended'
        );
      }
    }

    // Also scan rule text for keywords
    const keywordsInRule = findKeywordsInText(rule.text);
    for (const kw of keywordsInRule) {
      if (!isFieldFilled(formData[kw.field as keyof GenerateFormData])) {
        addHint(
          kw.field,
          kw.label,
          `Rule "${rule.text}" mentions ${kw.label.toLowerCase()}`,
          'recommended'
        );
      }
    }
  }

  // 2. Check structure preferences (skip if field is excluded by rules)
  if (profile.structurePreferences?.includeSalaryProminently) {
    const salaryExcluded = isFieldExcludedByRules(profile, ['salary', 'compensation', 'pay']);
    if (!salaryExcluded && !isFieldFilled(formData.salaryRange)) {
      addHint(
        'salaryRange',
        'Salary Range',
        'Your profile is set to include salary prominently',
        'recommended'
      );
    }
  }

  if (profile.structurePreferences?.leadWithBenefits) {
    const benefitsExcluded = isFieldExcludedByRules(profile, ['benefits', 'perks']);
    if (!benefitsExcluded && !isFieldFilled(formData.benefits)) {
      addHint(
        'benefits',
        'Benefits',
        'Your profile leads with benefits - adding some would improve the output',
        'suggested'
      );
    }
  }

  // 3. Check format guidance for keywords (skip if field is excluded by rules)
  if (profile.formatGuidance) {
    const keywordsInGuidance = findKeywordsInText(profile.formatGuidance);
    for (const kw of keywordsInGuidance) {
      // Skip if this field is excluded by rules
      if (isFieldExcludedByRules(profile, [kw.keyword])) {
        continue;
      }
      if (!isFieldFilled(formData[kw.field as keyof GenerateFormData])) {
        addHint(
          kw.field,
          kw.label,
          `Your format guidance mentions ${kw.label.toLowerCase()}`,
          'recommended'
        );
      }
    }
  }

  // 4. If brand values exist, company description would help provide context
  if (profile.brandValues && profile.brandValues.length > 0) {
    if (!isFieldFilled(formData.companyDescription)) {
      addHint(
        'companyDescription',
        'Company Description',
        `You have ${profile.brandValues.length} brand values - a company description helps apply them`,
        'suggested'
      );
    }
  }

  return hints;
}

/**
 * Check if any hints exist for the given profile and form data.
 * Useful for quick checks without getting the full list.
 */
export function hasProfileHints(
  profile: VoiceProfile | null | undefined,
  formData: GenerateFormData
): boolean {
  return getProfileHints(profile, formData).length > 0;
}

/**
 * Get fields that need attention for a profile.
 * Returns just the field names for highlighting purposes.
 */
export function getHintedFields(
  profile: VoiceProfile | null | undefined,
  formData: GenerateFormData
): string[] {
  return getProfileHints(profile, formData).map((h) => h.field);
}
