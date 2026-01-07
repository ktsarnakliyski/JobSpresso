// frontend/src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared base classes for input/textarea elements
 */
export function getInputBaseClasses({
  disabled,
  error,
}: {
  disabled?: boolean;
  error?: boolean;
}) {
  return cn(
    'w-full rounded-xl border border-navy-200 px-4',
    'bg-white text-navy-900',
    'transition-all duration-200 ease-out-expo',
    'placeholder:text-navy-400',
    'hover:border-navy-300',
    'focus:border-navy-500 focus:ring-2 focus:ring-navy-500/15 focus:outline-none',
    error && 'border-red-400 focus:border-red-500 focus:ring-red-500/15',
    disabled && 'opacity-60 cursor-not-allowed bg-navy-50 hover:border-navy-200'
  );
}
