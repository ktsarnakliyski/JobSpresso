// frontend/src/components/voice/VoiceDNAPreview.tsx

'use client';

import { Card, Button, Badge, BackButton } from '@/components/ui';
import { VoiceExtractionResult, FORMALITY_LABELS } from '@/types/voice-profile';

interface VoiceDNAPreviewProps {
  result: VoiceExtractionResult;
  onAccept: () => void;
  onAdjust: () => void;
  onBack: () => void;
}

export function VoiceDNAPreview({ result, onAccept, onAdjust, onBack }: VoiceDNAPreviewProps) {
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
          <h4 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
              ✓
            </span>
            Tone
          </h4>
          <p className="text-navy-900 font-medium">{result.toneDescription}</p>
          <p className="text-sm text-navy-500 mt-1">
            Formality: {FORMALITY_LABELS[result.toneFormality] || 'Balanced'}
          </p>
        </div>

        {/* Structure */}
        <div>
          <h4 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
              ✓
            </span>
            Structure
          </h4>
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
          <h4 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
              ✓
            </span>
            Vocabulary
          </h4>
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
            <h4 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
                ✓
              </span>
              Brand Values
            </h4>
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
