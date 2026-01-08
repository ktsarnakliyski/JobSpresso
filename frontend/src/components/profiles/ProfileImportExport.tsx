// frontend/src/components/profiles/ProfileImportExport.tsx

'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui';

interface ProfileImportExportProps {
  hasProfiles: boolean;
  onExport: () => void;
  onImport: (jsonString: string) => { success: boolean; count?: number; error?: string };
  onImportError: (error: string) => void;
  onImportSuccess: () => void;
}

export function ProfileImportExport({
  hasProfiles,
  onExport,
  onImport,
  onImportError,
  onImportSuccess,
}: ProfileImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = onImport(event.target?.result as string);
        if (result.success) {
          onImportSuccess();
        } else {
          onImportError(result.error || 'Import failed');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [onImport, onImportError, onImportSuccess]
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      {hasProfiles && (
        <>
          <Button variant="outline" size="sm" onClick={onExport}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Import
          </Button>
        </>
      )}
    </>
  );
}
