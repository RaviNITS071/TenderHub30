/**
 * @file src/components/ui/Badge.jsx
 * @description Small visual indicator for statuses, categories, and alerts with theme-aware styling.
 */
import { cn } from '@/utils/cn';

export function Badge({ className, variant = 'default', children, ...props }) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors";
  
  const variants = {
    default: "bg-dalBlue text-white shadow-xs",
    secondary: "bg-paper dark:bg-slate-800 border border-border dark:border-slate-700 text-charcoal dark:text-slate-200",
    outline: "border border-dalBlue/30 dark:border-blue-500/30 text-dalBlue dark:text-blue-300",
    success: "bg-successGreen/10 dark:bg-successGreen/20 text-successGreen dark:text-emerald-400 border border-successGreen/20 dark:border-emerald-500/30",
    warning: "bg-warningGold/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-warningGold/20 dark:border-amber-500/30",
    destructive: "bg-chinarRed/10 dark:bg-red-500/20 text-chinarRed dark:text-red-400 border border-chinarRed/20 dark:border-red-500/30",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}