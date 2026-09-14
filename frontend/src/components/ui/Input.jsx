/**
 * @file src/components/ui/Input.jsx
 * @description Standard form text input with dark mode support and enterprise focus states.
 */
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-border dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-charcoal dark:text-slate-100 placeholder:text-charcoal/40 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-dalBlue/30 dark:focus:ring-blue-500/30 focus:border-dalBlue dark:focus:border-blue-500 transition-all disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';