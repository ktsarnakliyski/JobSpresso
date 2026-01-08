// frontend/src/components/voice/editor/StructureSection.tsx

'use client';

interface StructureSectionProps {
  leadWithBenefits: boolean;
  includeSalary: boolean;
  onLeadWithBenefitsChange: (value: boolean) => void;
  onIncludeSalaryChange: (value: boolean) => void;
}

export function StructureSection({
  leadWithBenefits,
  includeSalary,
  onLeadWithBenefitsChange,
  onIncludeSalaryChange,
}: StructureSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">
        Structure
      </h3>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={leadWithBenefits}
            onChange={(e) => onLeadWithBenefitsChange(e.target.checked)}
            className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
          />
          <span className="text-navy-700">Lead with benefits and impact</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSalary}
            onChange={(e) => onIncludeSalaryChange(e.target.checked)}
            className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
          />
          <span className="text-navy-700">Include salary prominently</span>
        </label>
      </div>
    </div>
  );
}
