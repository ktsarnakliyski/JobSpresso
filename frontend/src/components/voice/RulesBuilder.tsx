// frontend/src/components/voice/RulesBuilder.tsx

'use client';

import { useState, useCallback } from 'react';
import { Button, TextArea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ProfileRule, SuggestedRule, RuleType } from '@/types/voice-profile';

interface RulesBuilderProps {
  rules: ProfileRule[];
  suggestedRules?: SuggestedRule[];
  formatGuidance: string;
  onRulesChange: (rules: ProfileRule[]) => void;
  onFormatGuidanceChange: (guidance: string) => void;
}

function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const RULE_TYPE_ICONS: Record<RuleType, string> = {
  exclude: '🚫',
  include: '✓',
  format: '📝',
  order: '↕️',
  limit: '#',
  custom: '⚙️',
};

const RULE_TYPE_COLORS: Record<RuleType, string> = {
  exclude: 'bg-red-50 border-red-200 text-red-700',
  include: 'bg-green-50 border-green-200 text-green-700',
  format: 'bg-blue-50 border-blue-200 text-blue-700',
  order: 'bg-purple-50 border-purple-200 text-purple-700',
  limit: 'bg-amber-50 border-amber-200 text-amber-700',
  custom: 'bg-navy-50 border-navy-200 text-navy-700',
};

export function RulesBuilder({
  rules,
  suggestedRules = [],
  formatGuidance,
  onRulesChange,
  onFormatGuidanceChange,
}: RulesBuilderProps) {
  const [newRuleText, setNewRuleText] = useState('');
  const [showFormatGuidance, setShowFormatGuidance] = useState(!!formatGuidance);

  const addRule = useCallback(
    (text: string, ruleType: RuleType = 'custom', target?: string, value?: string, source: 'manual' | 'ai_suggested' = 'manual') => {
      if (!text.trim()) return;

      const newRule: ProfileRule = {
        id: generateRuleId(),
        text: text.trim(),
        ruleType,
        target,
        value,
        source,
        active: true,
      };

      onRulesChange([...rules, newRule]);
      setNewRuleText('');
    },
    [rules, onRulesChange]
  );

  const removeRule = useCallback(
    (id: string) => {
      onRulesChange(rules.filter((r) => r.id !== id));
    },
    [rules, onRulesChange]
  );

  const toggleRule = useCallback(
    (id: string) => {
      onRulesChange(
        rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
      );
    },
    [rules, onRulesChange]
  );

  const handleAddFromSuggested = useCallback(
    (suggested: SuggestedRule) => {
      addRule(suggested.text, suggested.ruleType, suggested.target, suggested.value, 'ai_suggested');
    },
    [addRule]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && newRuleText.trim()) {
        e.preventDefault();
        addRule(newRuleText);
      }
    },
    [newRuleText, addRule]
  );

  // Filter out suggested rules that are already added
  const pendingSuggestions = suggestedRules.filter(
    (suggested) => !rules.some((r) => r.text.toLowerCase() === suggested.text.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">
          Rules & Constraints
        </h3>
      </div>

      {/* Add Rule Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a rule, e.g., 'Never include salary information'"
            className={cn(
              'flex-1 rounded-xl border border-navy-200 px-4 py-2.5',
              'bg-white text-navy-900',
              'focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none',
              'placeholder:text-navy-400'
            )}
          />
          <Button
            onClick={() => addRule(newRuleText)}
            disabled={!newRuleText.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>

        {/* AI Suggested Rules */}
        {pendingSuggestions.length > 0 && (
          <div className="bg-navy-50/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-700">
              <span className="text-lg">💡</span>
              <span>AI Suggestions (from your examples)</span>
            </div>
            <div className="space-y-2">
              {pendingSuggestions.map((suggested) => (
                <div
                  key={suggested.text}
                  className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2 border border-navy-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-800 truncate">{suggested.text}</p>
                    {suggested.evidence && (
                      <p className="text-xs text-navy-500 truncate">{suggested.evidence}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddFromSuggested(suggested)}
                    className="shrink-0 text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Rules */}
      {rules.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-navy-600">Active Rules:</p>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 border',
                  rule.active
                    ? RULE_TYPE_COLORS[rule.ruleType]
                    : 'bg-navy-50 border-navy-200 text-navy-400 line-through'
                )}
              >
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="shrink-0 w-5 h-5 flex items-center justify-center"
                  title={rule.active ? 'Disable rule' : 'Enable rule'}
                >
                  <span className="text-sm">{RULE_TYPE_ICONS[rule.ruleType]}</span>
                </button>
                <span className="flex-1 text-sm">{rule.text}</span>
                {rule.source === 'ai_suggested' && (
                  <span className="text-xs opacity-60 shrink-0">AI</span>
                )}
                <button
                  onClick={() => removeRule(rule.id)}
                  className="shrink-0 text-navy-400 hover:text-red-500 transition-colors"
                  title="Remove rule"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Guidance Toggle & Input */}
      <div className="pt-2">
        {!showFormatGuidance ? (
          <button
            onClick={() => setShowFormatGuidance(true)}
            className="text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
          >
            <span>+ Add format guidance</span>
            <span className="text-xs text-navy-400">(optional)</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-navy-700">Format Guidance</label>
              <button
                onClick={() => {
                  setShowFormatGuidance(false);
                  onFormatGuidanceChange('');
                }}
                className="text-xs text-navy-400 hover:text-navy-600"
              >
                Remove
              </button>
            </div>
            <TextArea
              value={formatGuidance}
              onChange={(e) => onFormatGuidanceChange(e.target.value)}
              placeholder="Describe your preferred structure, e.g., 'Start with team culture and impact, then responsibilities, then requirements. Close with benefits and application process.'"
              rows={3}
            />
          </div>
        )}
      </div>
    </div>
  );
}
