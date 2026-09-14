/**
 * @file src/components/ui/Badge.jsx
 * @description Small visual indicator for statuses, categories, and alerts.
 */
import React from 'react';
import { cn } from '@/utils/cn';

export function Badge({ className, variant = 'default', children, ...props }) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors";
  
  const variants = {
    default: "bg-dalBlue text-white",
    secondary: "bg-paper border border-border text-charcoal",
    outline: "border border-dalBlue/30 text-dalBlue",
    success: "bg-successGreen/10 text-successGreen border border-successGreen/20",
    warning: "bg-warningGold/10 text-warningGold border border-warningGold/20",
    destructive: "bg-chinarRed/10 text-chinarRed border border-chinarRed/20",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}