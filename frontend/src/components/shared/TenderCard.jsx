/**
 * @file src/components/shared/TenderCard.jsx
 * @description Production horizontal tender card. Displays authority hierarchy, contract type,
 * estimated value, closing countdown, and bookmarking functionality mapped directly to schema keys.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Heart, ExternalLink, FileSpreadsheet } from 'lucide-react';

import { formatCurrencyINR, formatDateDisplay } from '@/utils/formatters';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function TenderCard({ tender }) {
  const { toggleBookmark, isBookmarked } = useBookmarkStore();
  const navigate = useNavigate();
  
  const tenderId = tender._id || tender.sourceTenderId;
  const bookmarked = isBookmarked(tenderId);
  
  // Extract department from organisationChain hierarchy (e.g. "AGRICULTURE||Dept...")
  const orgParts = (tender.organisationChain || '').split('||').map((p) => p.trim());
  const issuingDept = orgParts[0] || tender.department || 'Issuing Authority';
  const subDept = orgParts.length > 1 ? orgParts[orgParts.length - 1] : '';

  // Calculate days remaining to bid submission deadline
  const calculateDaysLeft = (closingDateStr) => {
    if (!closingDateStr) return null;
    const diff = new Date(closingDateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const daysLeft = calculateDaysLeft(tender.bidSubmissionEndDate?.$date || tender.closingDate);

  return (
    <article className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 hover:border-dalBlue/40 dark:hover:border-blue-500/50 rounded-xl p-5 shadow-subtle hover:shadow-card transition-all duration-200 group">
      
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="font-mono text-[10px] uppercase dark:text-slate-300 dark:border-slate-600">
              {tender.sourceTenderId || tender.tenderReferenceNumber || 'REF-ACTIVE'}
            </Badge>
            <span className="text-xs font-bold text-dalBlue dark:text-blue-400 truncate max-w-[250px]" title={issuingDept}>
              {issuingDept}
            </span>
          </div>

          <h3 className="text-base font-bold text-charcoal dark:text-slate-200 group-hover:text-dalBlue dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
            {tender.title?.replace(/[\[\]]/g, '') || 'Tender Notice'}
          </h3>
          {subDept && <p className="text-xs text-charcoal/50 dark:text-slate-400 mt-1 truncate">{subDept}</p>}
        </div>

        {/* Favorite / Bookmark Toggle */}
        <button
          type="button"
          onClick={() => toggleBookmark(tender)}
          className={`p-2.5 rounded-lg border transition-all ${
            bookmarked
              ? 'bg-chinarRed/10 border-chinarRed text-chinarRed dark:bg-red-500/10 dark:border-red-500 dark:text-red-400'
              : 'border-border text-charcoal/40 hover:text-chinarRed hover:border-chinarRed/30 bg-paper dark:bg-slate-900 dark:border-slate-700 dark:text-slate-500 dark:hover:text-red-400 dark:hover:border-red-500/50'
          }`}
          title={bookmarked ? 'Remove from Saved' : 'Save this Tender'}
        >
          <Heart className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Middle Financials & Timeline Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 my-2 border-y border-border/60 dark:border-slate-700 bg-paper/40 dark:bg-slate-900/50 rounded-lg px-4">
        <div>
          <span className="block text-[11px] text-charcoal/60 dark:text-slate-400 font-semibold uppercase tracking-wide">Estimated Value</span>
          <span className="text-sm font-extrabold text-dalBlue dark:text-blue-400">
            {formatCurrencyINR(tender.estimatedValue)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-charcoal/60 dark:text-slate-400 font-semibold uppercase tracking-wide">EMD Amount</span>
          <span className="text-sm font-bold text-charcoal dark:text-slate-200">
            {formatCurrencyINR(tender.emdAmount)}
            {tender.emdExemptionAllowed === 'Yes' && (
              <span className="ml-1 text-[10px] text-successGreen font-extrabold" title="MSME Exemption Allowed">(Exempt)</span>
            )}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-charcoal/60 dark:text-slate-400 font-semibold uppercase tracking-wide">Closing Date</span>
          <span className="text-sm font-bold text-charcoal dark:text-slate-200">
            {formatDateDisplay(tender.bidSubmissionEndDate?.$date || tender.closingDate)}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-charcoal/60 dark:text-slate-400 font-semibold uppercase tracking-wide">Timeline Alert</span>
          {daysLeft !== null && daysLeft >= 0 ? (
            <span className={`inline-flex items-center gap-1 text-sm font-extrabold ${
                daysLeft <= 3 ? 'text-chinarRed dark:text-red-400' : daysLeft <= 7 ? 'text-warningGold' : 'text-successGreen'
              }`}>
              <Clock className="w-3.5 h-3.5" /> {daysLeft === 0 ? 'Closes Today' : `${daysLeft} days left`}
            </span>
          ) : (
            <span className="text-sm text-charcoal/40 dark:text-slate-500 font-bold">Closed</span>
          )}
        </div>
      </div>

      {/* Bottom Attributes and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 px-3 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">
            <MapPin className="w-3 h-3 text-chinarRed dark:text-red-400" />
            <span className="truncate max-w-[150px]">{tender.location || 'Jammu & Kashmir'}</span>
          </Badge>
          <Badge variant="default" className="bg-dalBlue/10 text-dalBlue dark:bg-blue-500/10 dark:text-blue-400 border-none px-3">
            {tender.productCategory || 'Works'}
          </Badge>
          {tender.coversInfo?.some((c) => c.documentType === '.xls') && (
            <Badge variant="success" className="gap-1">
              <FileSpreadsheet className="w-3 h-3" /> BOQ
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/tenders/${tender._id || tender.sourceTenderId}`)}
            className="gap-1.5 px-4 py-2 text-xs shadow-sm bg-dalBlue hover:bg-dalBlue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 transition-all"
          >
            View Full Details <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </article>
  );
}