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
    'w-full rounded-xl border border-espresso-200 px-4',
    'bg-white text-espresso-900',
    'transition-all duration-200 ease-out-expo',
    'placeholder:text-espresso-400',
    'hover:border-espresso-300',
    'focus:border-espresso-500 focus:ring-2 focus:ring-espresso-500/15 focus:outline-none',
    error && 'border-red-400 focus:border-red-500 focus:ring-red-500/15',
    disabled && 'opacity-60 cursor-not-allowed bg-espresso-50 hover:border-espresso-200'
  );
}
