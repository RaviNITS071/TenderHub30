/**
 * @file src/components/shared/Pagination.jsx
 * @description Standardized pagination controls interacting with React Query page states.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-border px-4 py-3 rounded-xl mt-6 shadow-sm gap-4">
      <span className="text-xs font-semibold text-charcoal/60">
        Page <strong className="text-charcoal">{currentPage}</strong> of <strong className="text-charcoal">{totalPages}</strong>
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(1)} disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {/* Current page indicator block */}
        <div className="h-10 px-4 flex items-center justify-center bg-paper rounded-lg text-sm font-bold text-dalBlue border border-border">
          {currentPage}
        </div>

        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline" size="icon"
          onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}