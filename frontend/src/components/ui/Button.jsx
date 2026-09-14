/**
 * @file src/components/ui/Button.jsx
 * @description Standardized button primitive with variants matching the Dal Blue theme, dark mode, and tactile interactions.
 */
import { cn } from '@/utils/cn';

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-display font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dalBlue/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";
  
  const variants = {
    default: "bg-dalBlue text-white hover:bg-dalBlue-800 dark:bg-dalBlue-600 dark:hover:bg-dalBlue shadow-sm hover:shadow-md",
    destructive: "bg-chinarRed text-white hover:bg-chinarRed-700 shadow-sm hover:shadow-md",
    outline: "border border-border dark:border-slate-700 bg-white dark:bg-slate-900 text-charcoal dark:text-slate-200 hover:bg-paper dark:hover:bg-slate-800 hover:text-dalBlue dark:hover:text-white shadow-sm",
    ghost: "text-charcoal/80 dark:text-slate-300 hover:bg-dalBlue/10 dark:hover:bg-slate-800/80 hover:text-dalBlue dark:hover:text-white",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10 p-0",
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