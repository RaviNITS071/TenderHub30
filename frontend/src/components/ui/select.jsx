/**
 * @file src/components/ui/Select.jsx
 * @description Lightweight native select wrapper that mimics the Shadcn API structure
 * for easy drop-in replacement in our Filter sidebars.
 */
import React from 'react';
import { cn } from '@/utils/cn';

// Wrapper context passing
export function Select({ value, onValueChange, children }) {
  return (
    <div className="relative w-full">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

// In our lightweight implementation, SelectTrigger and SelectContent merge into a native select
export function SelectTrigger({ className, children, value, onValueChange }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-dalBlue/30 focus:border-dalBlue appearance-none cursor-pointer",
        className
      )}
    >
      {children}
    </select>
  );
}

// Dummy components to satisfy the API shape (children of SelectTrigger handle this natively above)
export const SelectValue = ({ placeholder }) => <option value="" disabled>{placeholder}</option>;
export const SelectContent = ({ children }) => <>{children}</>;
export const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;