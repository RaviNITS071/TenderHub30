/**
 * @file src/components/ui/Button.jsx
 * @description Standardized button primitive with variants matching the Dal Blue theme.
 */
import React from 'react';
import { cn } from '@/utils/cn';

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-dalBlue/50 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-dalBlue text-white hover:bg-dalBlue-800 shadow-sm",
    destructive: "bg-chinarRed text-white hover:bg-chinarRed-800 shadow-sm",
    outline: "border border-border bg-white text-charcoal hover:bg-paper hover:border-dalBlue/30 hover:text-dalBlue",
    ghost: "text-charcoal/80 hover:bg-dalBlue/10 hover:text-dalBlue",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}