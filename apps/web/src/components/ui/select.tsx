'use client';

import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border bg-white/5 px-3 py-2 text-sm text-white ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-white/10',
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 pointer-events-none" />
      </div>
    );
  },
);
Select.displayName = 'Select';

export { Select };
