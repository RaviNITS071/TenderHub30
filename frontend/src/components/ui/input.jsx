/**
 * @file src/components/ui/Input.jsx
 * @description Standard form text input with consistent enterprise focus states.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-dalBlue/30 focus:border-dalBlue transition-all disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';