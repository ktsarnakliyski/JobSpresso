// frontend/src/components/ui/ErrorCard.tsx

'use client';

import { Card } from './Card';

interface ErrorCardProps {
  title?: string;
  message: string;
}

export function ErrorCard({ title = 'Error', message }: ErrorCardProps) {
  return (
    <Card className="border-red-200 bg-red-50 animate-scale-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-red-800">{title}</h3>
          <p className="text-sm text-red-600 mt-1">{message}</p>
        </div>
      </div>
    </Card>
  );
}
