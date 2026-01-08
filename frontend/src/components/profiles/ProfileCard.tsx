// frontend/src/components/profiles/ProfileCard.tsx

'use client';

import { useState } from 'react';
import { Card, Button, Badge, Modal } from '@/components/ui';
import {
  VoiceProfile,
  FORMALITY_LABELS,
  ADDRESS_OPTIONS,
  SENTENCE_OPTIONS,
  RuleType,
} from '@/types/voice-profile';
import { cn } from '@/lib/utils';

// Icons for rule types
const RULE_TYPE_ICONS: Record<RuleType, string> = {
  exclude: '🚫',
  include: '✓',
  format: '📝',
  order: '↕️',
  limit: '#',
  custom: '⚙️',
};

interface ProfileCardProps {
  profile: VoiceProfile;
  index: number;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onEdit: (id: string) => void;
}

export function ProfileCard({ profile, index, onDelete, onSetDefault, onEdit }: ProfileCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Count active rules
  const activeRulesCount = profile.rules?.filter(r => r.active)?.length ?? 0;

  // Get style labels
  const addressLabel = ADDRESS_OPTIONS.find(o => o.value === profile.addressStyle)?.label || 'Direct (You/Your)';
  const sentenceLabel = SENTENCE_OPTIONS.find(o => o.value === profile.sentenceStyle)?.label || 'Balanced';

  return (
    <>
      <Card
        hover
        className={cn(
          'animate-fade-up opacity-0',
          `[animation-delay:${(index + 1) * 50}ms]`
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Header with name and badges */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold text-navy-900 truncate">
                {profile.name}
              </h3>
              {profile.isDefault && <Badge variant="success">Default</Badge>}
              {profile.createdVia === 'examples' && (
                <Badge variant="info" className="text-xs">From Examples</Badge>
              )}
              {profile.createdVia === 'guided' && (
                <Badge variant="info" className="text-xs">Guided</Badge>
              )}
            </div>

            {/* Tone and style summary */}
            <p className="text-navy-700 mb-3">
              {profile.toneDescription || FORMALITY_LABELS[profile.toneFormality] || 'Professional'}
              <span className="text-navy-400 mx-2">•</span>
              {addressLabel}
            </p>

            {/* Voice DNA Summary - key differentiators */}
            <div className="bg-navy-50/70 rounded-xl px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-navy-600">
                {activeRulesCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span>📋</span>
                    <span>{activeRulesCount} rule{activeRulesCount !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {profile.formatGuidance && (
                  <span className="flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Format guidance</span>
                  </span>
                )}
                {profile.brandValues && profile.brandValues.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span>💎</span>
                    <span>{profile.brandValues.length} value{profile.brandValues.length !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {profile.structurePreferences?.leadWithBenefits && (
                  <span className="flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Benefits-first</span>
                  </span>
                )}
                {!activeRulesCount && !profile.formatGuidance && !(profile.brandValues?.length) && !profile.structurePreferences?.leadWithBenefits && (
                  <span className="text-navy-400">Basic profile</span>
                )}
              </div>
              <button
                onClick={() => setShowDetails(true)}
                className="mt-2 text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1 transition-colors"
              >
                View details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onEdit(profile.id)}>
              Edit
            </Button>
            {!profile.isDefault && (
              <Button variant="ghost" size="sm" onClick={() => onSetDefault(profile.id)}>
                Set Default
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onDelete(profile.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Profile Detail Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={profile.name}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            <Button onClick={() => { setShowDetails(false); onEdit(profile.id); }}>
              Edit Profile
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Rules Section */}
          {activeRulesCount > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Rules ({activeRulesCount} active)
              </h4>
              <div className="bg-navy-50 rounded-xl p-4 space-y-2">
                {profile.rules?.filter(r => r.active).map(rule => (
                  <div key={rule.id} className="flex items-start gap-2 text-sm">
                    <span className="text-base mt-0.5">{RULE_TYPE_ICONS[rule.ruleType]}</span>
                    <span className="text-navy-800">{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Format Guidance Section */}
          {profile.formatGuidance && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Format Guidance
              </h4>
              <div className="bg-navy-50 rounded-xl p-4">
                <p className="text-sm text-navy-700 italic">&quot;{profile.formatGuidance}&quot;</p>
              </div>
            </div>
          )}

          {/* Style Settings Section */}
          <div>
            <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
              Style Settings
            </h4>
            <div className="bg-navy-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-600">Formality</span>
                <span className="text-navy-800 font-medium">
                  {profile.toneDescription || FORMALITY_LABELS[profile.toneFormality]} ({profile.toneFormality}/5)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600">Address Style</span>
                <span className="text-navy-800 font-medium">{addressLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600">Sentences</span>
                <span className="text-navy-800 font-medium">{sentenceLabel}</span>
              </div>
              {profile.structurePreferences?.leadWithBenefits && (
                <div className="flex justify-between">
                  <span className="text-navy-600">Structure</span>
                  <span className="text-navy-800 font-medium">Benefits-first</span>
                </div>
              )}
              {profile.structurePreferences?.includeSalaryProminently && (
                <div className="flex justify-between">
                  <span className="text-navy-600">Salary</span>
                  <span className="text-navy-800 font-medium">Include prominently</span>
                </div>
              )}
            </div>
          </div>

          {/* Vocabulary Section */}
          {((profile.wordsToPrefer?.length ?? 0) > 0 || (profile.wordsToAvoid?.length ?? 0) > 0) && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Vocabulary
              </h4>
              <div className="bg-navy-50 rounded-xl p-4 space-y-3">
                {(profile.wordsToPrefer?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs text-navy-500 uppercase tracking-wide">Prefer</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.wordsToPrefer?.map(word => (
                        <Badge key={word} variant="success" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.wordsToAvoid?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs text-navy-500 uppercase tracking-wide">Avoid</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.wordsToAvoid?.map(word => (
                        <Badge key={word} variant="warning" className="text-xs">{word}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Values Section */}
          {profile.brandValues && profile.brandValues.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-navy-800 uppercase tracking-wide mb-3">
                Brand Values
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.brandValues.map(value => (
                  <Badge key={value} variant="info">{value}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
