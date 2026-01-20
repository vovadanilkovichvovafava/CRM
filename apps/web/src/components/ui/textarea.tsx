'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500/50 focus:ring-red-500/50'
            : 'border-white/10',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
