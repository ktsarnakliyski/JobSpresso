// frontend/src/components/CircularScore.tsx

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AssessmentResult } from '@/types/assessment';

interface CircularScoreProps {
  score: number;
  interpretation: AssessmentResult['interpretation'];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  estimatedBoost?: number;
  className?: string;
}

const INTERPRETATION_CONFIG: Record<
  AssessmentResult['interpretation'],
  { color: string; strokeColor: string; bgColor: string; label: string; description: string }
> = {
  excellent: {
    color: 'text-emerald-600',
    strokeColor: '#059669',
    bgColor: 'bg-emerald-50',
    label: 'Excellent',
    description: 'Your posting is highly optimized',
  },
  good: {
    color: 'text-emerald-500',
    strokeColor: '#10b981',
    bgColor: 'bg-emerald-50',
    label: 'Good',
    description: 'Minor improvements recommended',
  },
  needs_work: {
    color: 'text-amber-600',
    strokeColor: '#d97706',
    bgColor: 'bg-amber-50',
    label: 'Needs Work',
    description: 'Several areas to improve',
  },
  poor: {
    color: 'text-orange-600',
    strokeColor: '#ea580c',
    bgColor: 'bg-orange-50',
    label: 'Poor',
    description: 'Significant improvements needed',
  },
  critical: {
    color: 'text-red-600',
    strokeColor: '#dc2626',
    bgColor: 'bg-red-50',
    label: 'Critical',
    description: 'Major issues detected',
  },
};

const SIZE_CONFIG = {
  sm: { size: 120, strokeWidth: 8, fontSize: 'text-2xl', subSize: 'text-xs' },
  md: { size: 160, strokeWidth: 10, fontSize: 'text-4xl', subSize: 'text-sm' },
  lg: { size: 200, strokeWidth: 12, fontSize: 'text-5xl', subSize: 'text-base' },
};

export function CircularScore({
  score,
  interpretation,
  size = 'lg',
  showLabel = true,
  estimatedBoost,
  className,
}: CircularScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const config = INTERPRETATION_CONFIG[interpretation];
  const sizeConfig = SIZE_CONFIG[size];

  // Calculate SVG parameters
  const center = sizeConfig.size / 2;
  const radius = (sizeConfig.size - sizeConfig.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Animate score on mount
  useEffect(() => {
    setIsVisible(true);
    const duration = 1200;
    const startTime = Date.now();
    let animationId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-expo)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [score]);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {/* Circular Score Ring */}
      <div
        className="relative"
        style={{ width: sizeConfig.size, height: sizeConfig.size }}
        role="img"
        aria-label={`Score: ${animatedScore} out of 100, rated ${config.label}`}
      >
        {/* Background ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={sizeConfig.size}
          height={sizeConfig.size}
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e7dfd5"
            strokeWidth={sizeConfig.strokeWidth}
            className="opacity-40"
          />
        </svg>

        {/* Progress ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={sizeConfig.size}
          height={sizeConfig.size}
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={config.strokeColor}
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${config.strokeColor}40)`,
            }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums', sizeConfig.fontSize, config.color)}>
            {animatedScore}
          </span>
          <span className={cn('text-navy-500', sizeConfig.subSize)}>out of 100</span>
        </div>
      </div>

      {/* Label and description */}
      {showLabel && (
        <div className="text-center space-y-1">
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full',
              config.bgColor
            )}
          >
            <span className={cn('font-semibold', config.color)}>{config.label}</span>
          </div>
          <p className="text-sm text-navy-600">{config.description}</p>
        </div>
      )}

      {/* Estimated application boost */}
      {estimatedBoost && estimatedBoost > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-teal/10 rounded-xl border border-teal/20">
          <svg
            className="w-5 h-5 text-teal"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span className="text-sm font-medium text-teal">
            +{estimatedBoost}% potential application boost
          </span>
        </div>
      )}
    </div>
  );
}
