// frontend/src/lib/transforms.ts

import { VoiceProfile } from '@/types/voice-profile';

/**
 * Transform frontend VoiceProfile (camelCase) to backend format (snake_case)
 */
export function transformVoiceProfileToBackend(profile: VoiceProfile) {
  return {
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
  };
}
