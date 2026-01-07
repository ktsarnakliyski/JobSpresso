// frontend/src/components/voice/VoiceDNAPreview.tsx

'use client';

import { Card, Button, Badge, BackButton } from '@/components/ui';
import { VoiceExtractionResult, FORMALITY_LABELS } from '@/types/voice-profile';

// Reusable section header component to reduce duplication
function SectionHeader({
  children,
  variant = 'success'
}: {
  children: React.ReactNode;
  variant?: 'success' | 'amber' | 'teal';
}) {
  const styles = {
    success: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: '✓' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', icon: '💡' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', icon: '💡' },
  };
  const style = styles[variant];

  return (
    <h4 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-2">
      <span className={`w-5 h-5 rounded ${style.bg} flex items-center justify-center ${style.text} text-xs`}>
        {style.icon}
      </span>
      {children}
    </h4>
  );
}

interface VoiceDNAPreviewProps {
  result: VoiceExtractionResult;
  onAccept: () => void;
  onAdjust: () => void;
  onBack: () => void;
}

export function VoiceDNAPreview({ result, onAccept, onAdjust, onBack }: VoiceDNAPreviewProps) {
  // Validate formality is in range
  const formalityLabel = (result.toneFormality >= 1 && result.toneFormality <= 5)
    ? FORMALITY_LABELS[result.toneFormality]
    : 'Balanced';

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <h2 className="text-xl font-semibold text-navy-900">Here&apos;s What I Learned</h2>
        <p className="text-navy-600 mt-2">Based on your examples, this is your writing voice:</p>
      </div>

      <Card className="space-y-5">
        {/* Summary */}
        <div className="p-4 bg-navy-50 rounded-xl">
          <p className="text-navy-800 italic">&quot;{result.summary}&quot;</p>
        </div>

        {/* Tone */}
        <div>
          <SectionHeader>Tone</SectionHeader>
          <p className="text-navy-900 font-medium">{result.toneDescription}</p>
          <p className="text-sm text-navy-500 mt-1">
            Formality: {formalityLabel}
          </p>
        </div>

        {/* Structure */}
        <div>
          <SectionHeader>Structure</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {result.structureAnalysis.leadsWithBenefits && (
              <Badge variant="default">Benefits-first</Badge>
            )}
            {result.structureAnalysis.includesSalary && (
              <Badge variant="default">Includes salary</Badge>
            )}
            {result.structureAnalysis.typicalSectionOrder.length > 0 && (
              <Badge variant="default">
                {result.structureAnalysis.typicalSectionOrder.length} sections
              </Badge>
            )}
          </div>
          {result.structureAnalysis.typicalSectionOrder.length > 0 && (
            <p className="text-sm text-navy-500 mt-2">
              Order: {result.structureAnalysis.typicalSectionOrder.join(' → ')}
            </p>
          )}
        </div>

        {/* Vocabulary */}
        <div>
          <SectionHeader>Vocabulary</SectionHeader>
          <div className="grid md:grid-cols-2 gap-3">
            {result.vocabulary.commonlyUsed.length > 0 && (
              <div>
                <p className="text-xs text-navy-500 mb-1">Often uses:</p>
                <div className="flex flex-wrap gap-1">
                  {result.vocabulary.commonlyUsed.slice(0, 6).map((word) => (
                    <Badge key={word} variant="success" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {result.vocabulary.notablyAvoided.length > 0 && (
              <div>
                <p className="text-xs text-navy-500 mb-1">Avoids:</p>
                <div className="flex flex-wrap gap-1">
                  {result.vocabulary.notablyAvoided.slice(0, 6).map((word) => (
                    <Badge key={word} variant="warning" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brand Values */}
        {result.brandSignals.values.length > 0 && (
          <div>
            <SectionHeader>Brand Values</SectionHeader>
            <div className="flex flex-wrap gap-2">
              {result.brandSignals.values.map((value) => (
                <Badge key={value} variant="info">
                  {value}
                </Badge>
              ))}
            </div>
            {result.brandSignals.personality && (
              <p className="text-sm text-navy-500 mt-2">
                Personality: {result.brandSignals.personality}
              </p>
            )}
          </div>
        )}

        {/* Detected Patterns - shown for examples path */}
        {result.suggestedRules && result.suggestedRules.length > 0 && (
          <div className="border-t border-navy-100 pt-5">
            <SectionHeader variant="amber">Detected Patterns</SectionHeader>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <p className="text-sm text-navy-700 mb-3">
                Based on your examples, I noticed these patterns:
              </p>
              <ul className="space-y-2">
                {result.suggestedRules.slice(0, 5).map((rule) => (
                  <li key={rule.text} className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <div>
                      <span className="text-navy-800 text-sm">{rule.text}</span>
                      {rule.evidence && (
                        <span className="text-navy-500 text-xs ml-2">
                          ({rule.evidence})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-navy-500 mt-3">
                These will be added as rules you can adjust later.
              </p>
            </div>
          </div>
        )}

        {/* Want more control - shown for guided path */}
        {(!result.suggestedRules || result.suggestedRules.length === 0) && (
          <div className="border-t border-navy-100 pt-5">
            <SectionHeader variant="teal">Want More Control?</SectionHeader>
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
              <p className="text-sm text-navy-700 mb-2">
                You can add custom rules like:
              </p>
              <ul className="space-y-1 text-sm text-navy-600">
                <li className="flex items-center gap-2">
                  <span className="text-teal-600">•</span>
                  &quot;Never include salary information&quot;
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-600">•</span>
                  &quot;Max 5 requirements&quot;
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-600">•</span>
                  &quot;Always mention remote policy&quot;
                </li>
              </ul>
              <p className="text-xs text-navy-500 mt-3">
                Click &quot;Let Me Adjust&quot; to add rules.
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-navy-500">Does this look right?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onAdjust}>
            Let Me Adjust
          </Button>
          <Button onClick={onAccept}>Yes, Save This</Button>
        </div>
      </div>
    </div>
  );
}
