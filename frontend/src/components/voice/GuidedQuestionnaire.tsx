// frontend/src/components/voice/GuidedQuestionnaire.tsx

'use client';

import { useState, useCallback } from 'react';
import { BackButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  VoiceExtractionResult,
  ToneStyle,
  AddressStyle,
  SentenceStyle,
} from '@/types/voice-profile';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'personality',
    question: "How would you describe your company's personality?",
    options: [
      { value: 'corporate', label: 'Corporate & Established', description: 'We maintain high standards' },
      { value: 'professional', label: 'Professional but Warm', description: 'Serious about work, but real people too' },
      { value: 'friendly', label: 'Friendly & Approachable', description: "We're a welcoming team" },
      { value: 'casual', label: 'Casual & Energetic', description: 'We move fast and keep it real' },
      { value: 'mission', label: 'Mission-Driven', description: "We're here to make a difference" },
    ],
  },
  {
    id: 'address',
    question: 'How do you typically address candidates?',
    options: [
      { value: 'direct_you', label: 'Direct: "You will..."', description: 'Personal and engaging' },
      { value: 'third_person', label: 'Formal: "The ideal candidate..."', description: 'Traditional and professional' },
      { value: 'we_looking', label: "Team voice: \"We're looking for...\"", description: 'Collaborative feel' },
    ],
  },
  {
    id: 'detail',
    question: 'What matters more in your JDs?',
    options: [
      { value: 'vision', label: 'Inspiring Vision', description: 'Paint the big picture, inspire action' },
      { value: 'balanced', label: 'Balanced Mix', description: 'Vision + clear requirements' },
      { value: 'detailed', label: 'Detailed Requirements', description: 'Be thorough and specific' },
    ],
  },
  {
    id: 'structure',
    question: 'What should candidates see first?',
    options: [
      { value: 'benefits', label: 'Benefits & Impact', description: 'Lead with what they get' },
      { value: 'role', label: 'Role & Responsibilities', description: 'Lead with what they do' },
      { value: 'company', label: 'Company & Mission', description: 'Lead with who you are' },
    ],
  },
  {
    id: 'values',
    question: 'Which values best represent your company?',
    options: [
      { value: 'innovation', label: 'Innovation & Growth', description: 'Always learning, always improving' },
      { value: 'collaboration', label: 'Collaboration & Team', description: 'Better together' },
      { value: 'excellence', label: 'Excellence & Quality', description: 'High standards, great results' },
      { value: 'impact', label: 'Impact & Purpose', description: 'Making a real difference' },
    ],
  },
];

interface GuidedQuestionnaireProps {
  onComplete: (result: VoiceExtractionResult) => void;
  onBack: () => void;
}

export function GuidedQuestionnaire({ onComplete, onBack }: GuidedQuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleSelect = useCallback(
    (value: string) => {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

      if (isLast) {
        // Build result from answers
        const result = buildResultFromAnswers({ ...answers, [currentQuestion.id]: value });
        onComplete(result);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentQuestion, isLast, answers, onComplete]
  );

  const handleBack = useCallback(() => {
    if (currentIndex === 0) {
      onBack();
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, onBack]);

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={handleBack} label={currentIndex === 0 ? 'Back' : 'Previous'} />

        {/* Progress bar */}
        <div className="h-1 bg-espresso-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-espresso-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-espresso-500 mb-2">
          Question {currentIndex + 1} of {QUESTIONS.length}
        </p>
        <h2 className="text-xl font-semibold text-espresso-900">{currentQuestion.question}</h2>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
              answers[currentQuestion.id] === option.value
                ? 'border-espresso-500 bg-espresso-50'
                : 'border-espresso-200 hover:border-espresso-300 hover:bg-espresso-50/50'
            )}
          >
            <p className="font-medium text-espresso-900">{option.label}</p>
            {option.description && (
              <p className="text-sm text-espresso-500 mt-1">{option.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function buildResultFromAnswers(answers: Record<string, string>): VoiceExtractionResult {
  // Map personality to tone
  const toneMap: Record<string, { tone: ToneStyle; formality: number; description: string }> = {
    corporate: { tone: 'formal', formality: 1, description: 'Corporate and professional' },
    professional: { tone: 'professional', formality: 2, description: 'Professional but approachable' },
    friendly: { tone: 'friendly', formality: 4, description: 'Friendly and warm' },
    casual: { tone: 'casual', formality: 5, description: 'Casual and energetic' },
    mission: { tone: 'professional', formality: 3, description: 'Purpose-driven and inspiring' },
  };

  // Map detail preference to sentence style
  const sentenceMap: Record<string, SentenceStyle> = {
    vision: 'short_punchy',
    balanced: 'balanced',
    detailed: 'detailed',
  };

  // Map structure preference
  const structureMap: Record<string, string[]> = {
    benefits: ['intro', 'benefits', 'responsibilities', 'requirements'],
    role: ['intro', 'responsibilities', 'requirements', 'benefits'],
    company: ['company', 'intro', 'responsibilities', 'requirements', 'benefits'],
  };

  // Map values
  const valuesMap: Record<string, string[]> = {
    innovation: ['innovation', 'growth', 'learning'],
    collaboration: ['collaboration', 'teamwork', 'together'],
    excellence: ['excellence', 'quality', 'standards'],
    impact: ['impact', 'purpose', 'difference'],
  };

  const toneInfo = toneMap[answers.personality] || toneMap.professional;
  const addressStyle = (answers.address as AddressStyle) || 'direct_you';
  const sentenceStyle = sentenceMap[answers.detail] || 'balanced';
  const sectionOrder = structureMap[answers.structure] || structureMap.role;
  const brandValues = valuesMap[answers.values] || [];

  return {
    tone: toneInfo.tone,
    toneFormality: toneInfo.formality,
    toneDescription: toneInfo.description,
    addressStyle,
    sentenceStyle,
    structureAnalysis: {
      leadsWithBenefits: answers.structure === 'benefits',
      typicalSectionOrder: sectionOrder,
      includesSalary: false,
    },
    vocabulary: {
      commonlyUsed: brandValues,
      notablyAvoided: [],
    },
    brandSignals: {
      values: brandValues,
      personality: toneInfo.description,
    },
    summary: `${toneInfo.description} voice that ${answers.structure === 'benefits' ? 'leads with benefits' : 'focuses on the role'}.`,
  };
}
