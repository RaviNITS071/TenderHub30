/**
 * @file src/components/ui/Button.jsx
 * @description Standardized button primitive with high-visibility focus states,
 * tactile interactions, and clear hover feedback.
 */
import { cn } from '@/utils/cn';

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-display font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-chinarRed focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none";
  
  const variants = {
    default: "bg-dalBlue text-white hover:bg-dalBlue-800 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-xs hover:shadow-md hover:ring-2 hover:ring-dalBlue/20 dark:hover:ring-blue-400/30",
    destructive: "bg-chinarRed text-white hover:bg-chinarRed-700 shadow-xs hover:shadow-md hover:ring-2 hover:ring-chinarRed/30",
    outline: "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-dalBlue dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-dalBlue dark:hover:text-blue-300 shadow-xs hover:shadow-sm",
    ghost: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-dalBlue dark:hover:text-white",
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-9 w-9 p-0",
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