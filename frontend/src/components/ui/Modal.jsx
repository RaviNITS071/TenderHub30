/**
 * @file src/components/ui/Modal.jsx
 * @description Accessible modal dialog wrapper used for onboarding and confirmations.
 */
import React from 'react';
import { cn } from '@/utils/cn';

export function Dialog({ open, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      {children}
    </div>
  );
}

export function DialogContent({ className, children }) {
  return (
    <div className={cn("bg-white border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 relative", className)}>
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>;
}

export function DialogTitle({ className, children }) {
  return <h3 className={cn("text-xl font-bold leading-none tracking-tight text-dalBlue", className)}>{children}</h3>;
}

export function DialogDescription({ className, children }) {
  return <p className={cn("text-sm text-charcoal/60", className)}>{children}</p>;
}