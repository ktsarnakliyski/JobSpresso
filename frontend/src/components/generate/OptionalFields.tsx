// frontend/src/components/generate/OptionalFields.tsx

'use client';

import React from 'react';
import { TextArea, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface OptionalFieldData {
  companyDescription: string;
  teamSize: string;
  salaryRange: string;
  location: string;
  benefits: string;
  niceToHave: string;
}

interface OptionalFieldsProps {
  data: OptionalFieldData;
  onChange: (field: keyof OptionalFieldData, value: string) => void;
  isLoading: boolean;
  highlightedFields: Set<string>;
  fieldRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export function OptionalFields({ data, onChange, isLoading, highlightedFields, fieldRefs }: OptionalFieldsProps) {
    const setFieldRef = (field: string) => (el: HTMLDivElement | null) => {
      fieldRefs.current[field] = el;
    };

    const getHighlightClass = (field: string) => {
      if (highlightedFields.has(field)) {
        return 'ring-2 ring-amber-300 border-amber-300';
      }
      return '';
    };

    return (
      <div className="space-y-5 pl-5 border-l-2 border-navy-200 animate-fade-up">
        <div
          ref={setFieldRef('companyDescription')}
          className={cn('rounded-xl transition-all duration-300', getHighlightClass('companyDescription'))}
        >
          <TextArea
            label="Company Description"
            placeholder="Brief description of your company..."
            value={data.companyDescription}
            onChange={(e) => onChange('companyDescription', e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div
            ref={setFieldRef('teamSize')}
            className={cn('rounded-xl transition-all duration-300', getHighlightClass('teamSize'))}
          >
            <Input
              label="Team Size"
              placeholder="e.g., 5-10 people"
              value={data.teamSize}
              onChange={(e) => onChange('teamSize', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div
            ref={setFieldRef('salaryRange')}
            className={cn('rounded-xl transition-all duration-300', getHighlightClass('salaryRange'))}
          >
            <Input
              label="Salary Range"
              placeholder="e.g., $120k - $160k"
              value={data.salaryRange}
              onChange={(e) => onChange('salaryRange', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div
          ref={setFieldRef('location')}
          className={cn('rounded-xl transition-all duration-300', getHighlightClass('location'))}
        >
          <Input
            label="Location"
            placeholder="e.g., Remote, San Francisco, Hybrid"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div
          ref={setFieldRef('benefits')}
          className={cn('rounded-xl transition-all duration-300', getHighlightClass('benefits'))}
        >
          <TextArea
            label="Benefits"
            placeholder="Enter each benefit on a new line..."
            value={data.benefits}
            onChange={(e) => onChange('benefits', e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div
          ref={setFieldRef('niceToHave')}
          className={cn('rounded-xl transition-all duration-300', getHighlightClass('niceToHave'))}
        >
          <TextArea
            label="Nice-to-Have"
            placeholder="Enter each nice-to-have on a new line..."
            value={data.niceToHave}
            onChange={(e) => onChange('niceToHave', e.target.value)}
            rows={3}
            disabled={isLoading}
          />
        </div>
      </div>
    );
}
