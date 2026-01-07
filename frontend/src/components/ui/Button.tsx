// frontend/src/components/ui/Button.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
      primary: cn(
        'bg-navy-800 text-white',
        'hover:bg-navy-700',
        'active:bg-navy-900',
        'shadow-soft-md hover:shadow-soft-lg'
      ),
      secondary: cn(
        'bg-navy-100 text-navy-800',
        'hover:bg-navy-200',
        'active:bg-navy-300'
      ),
      outline: cn(
        'border border-navy-300 bg-white text-navy-700',
        'hover:bg-navy-50 hover:border-navy-400',
        'active:bg-navy-100'
      ),
      ghost: cn(
        'text-navy-600',
        'hover:bg-navy-100 hover:text-navy-800',
        'active:bg-navy-200'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium',
          'transition-all duration-200 ease-out-expo',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
