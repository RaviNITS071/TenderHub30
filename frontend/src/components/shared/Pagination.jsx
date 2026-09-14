/**
 * @file src/components/shared/Pagination.jsx
 * @description Standardized pagination controls interacting with React Query page states, with dark mode and monospace indicators.
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#111827] border border-border dark:border-slate-800 px-4 py-3 rounded-2xl mt-6 shadow-card dark:shadow-none gap-4">
      <span className="text-xs font-semibold text-charcoal/60 dark:text-slate-400">
        Page <strong className="text-charcoal dark:text-slate-200 font-mono">{currentPage}</strong> of <strong className="text-charcoal dark:text-slate-200 font-mono">{totalPages}</strong>
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(1)} disabled={currentPage === 1}
          title="First Page"
          className="border-border dark:border-slate-800"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          title="Previous Page"
          className="border-border dark:border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {/* Current page indicator block */}
        <div className="h-10 px-4 flex items-center justify-center bg-paper dark:bg-slate-900 rounded-xl text-sm font-bold font-mono text-dalBlue dark:text-blue-300 border border-border dark:border-slate-800">
          {currentPage}
        </div>

        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          title="Next Page"
          className="border-border dark:border-slate-800"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
          title="Last Page"
          className="border-border dark:border-slate-800"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}