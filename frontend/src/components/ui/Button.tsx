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
        'bg-espresso-800 text-white',
        'hover:bg-espresso-700',
        'active:bg-espresso-900',
        'shadow-soft-md hover:shadow-soft-lg'
      ),
      secondary: cn(
        'bg-espresso-100 text-espresso-800',
        'hover:bg-espresso-200',
        'active:bg-espresso-300'
      ),
      outline: cn(
        'border border-espresso-300 bg-white text-espresso-700',
        'hover:bg-espresso-50 hover:border-espresso-400',
        'active:bg-espresso-100'
      ),
      ghost: cn(
        'text-espresso-600',
        'hover:bg-espresso-100 hover:text-espresso-800',
        'active:bg-espresso-200'
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
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-espresso-500 focus-visible:ring-offset-2',
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
