/**
 * @file src/pages/TenderDetails.jsx
 * @description Comprehensive view of a single tender, directly mirroring the J&K eProcurement 
 * portal data structure while maintaining the Dal Blue + Chinar Accent design system.
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, FileText, IndianRupee, Heart, ExternalLink, AlertCircle, Download, Layers, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTender } from '@/hooks/useTenders';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { formatCurrencyINR, formatDateDisplay } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Animation variants
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// Helper to handle MongoDB's {"$date": "..."} format, raw strings, and "NA" fallbacks
const parseDate = (dateField) => {
  // 1. Immediately catch missing data or literal "NA" strings from the scraper
  if (!dateField || dateField === 'NA' || dateField === 'N/A') return null;
  
  // 2. Extract the date string if it is wrapped in MongoDB's $date object
  const dateStr = typeof dateField === 'object' && dateField.$date ? dateField.$date : dateField;
  
  // 3. Safety check: Ensure the extracted string can actually be parsed into a real date
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null; 
  
  return dateStr;
};

// Reusable Data Row for standardized tables
const DataRow = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 py-2.5 border-b border-border/50 dark:border-slate-700/50 last:border-0 gap-1 sm:gap-4">
    <span className="text-xs font-bold text-charcoal/60 dark:text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-charcoal dark:text-slate-200 break-words">
      {value === 'NA' || !value ? 'N/A' : value}
    </span>
  </div>
);

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tender, isLoading, isError } = useTender(id);
  const { toggleBookmark, isBookmarked } = useBookmarkStore();

  if (isLoading) return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-dalBlue border-t-transparent animate-spin" />
    </div>
  );

  if (isError || !tender) return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 flex flex-col items-center justify-center text-center p-4">
      <AlertCircle className="w-16 h-16 text-chinarRed mb-4" />
      <h2 className="text-2xl font-bold text-dalBlue dark:text-blue-400">Tender Not Found</h2>
      <Button onClick={() => navigate('/tenders')} className="mt-4">Back to Directory</Button>
    </div>
  );

  const bookmarked = isBookmarked(tender._id || tender.sourceTenderId);
  const orgParts = (tender.organisationChain || '').split('||').map(p => p.trim());
  const primaryOrg = orgParts[0] || tender.department;

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-charcoal/60 dark:text-slate-400 hover:text-dalBlue dark:hover:text-blue-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </button>

          <div className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl p-6 shadow-subtle relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-dalBlue" />
            
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono bg-dalBlue/5 dark:bg-slate-700 border-dalBlue/20 dark:border-slate-600 text-dalBlue dark:text-blue-400">
                    ID: {tender.sourceTenderId}
                  </Badge>
                  <Badge variant={tender.status === 'ACTIVE' ? 'success' : 'secondary'}>{tender.status || 'Published'}</Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-dalBlue dark:text-blue-400 leading-snug">
                  {tender.title?.replace(/[\[\]]/g, '')}
                </h1>
                <div className="flex items-center gap-2 text-sm font-semibold text-charcoal/70 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-chinarRed" /> {primaryOrg}
                </div>
              </div>

              <div className="flex md:flex-col gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => toggleBookmark(tender)}
                  variant={bookmarked ? "outline" : "default"}
                  className={`w-full md:w-auto gap-2 ${bookmarked ? 'border-chinarRed text-chinarRed hover:bg-chinarRed/10 dark:hover:bg-red-900/20' : 'bg-dalBlue hover:bg-dalBlue-800 text-white'}`}
                >
                  <Heart className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Saved' : 'Save Tender'}
                </Button>
                {tender.detailsUrl && (
                  <a href={tender.detailsUrl} target="_blank" rel="noreferrer" className="w-full">
                    <Button variant="outline" className="w-full gap-2 bg-white dark:bg-slate-800 text-charcoal dark:text-slate-200">
                      Original Portal <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Layout */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Details Section */}
            <motion.section variants={fadeUp} className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-6 shadow-subtle">
              <h3 className="text-lg font-bold text-dalBlue dark:text-blue-400 mb-4 border-b border-border dark:border-slate-700 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-chinarRed" /> Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="space-y-1">
                  <DataRow label="Organisation Chain" value={tender.organisationChain?.replace(/\|\|/g, ' > ')} />
                  <DataRow label="Tender Reference Number" value={tender.tenderReferenceNumber} />
                  <DataRow label="Tender ID" value={tender.sourceTenderId} />
                  <DataRow label="Tender Type" value={tender.tenderType} />
                  <DataRow label="Tender Category" value={tender.tenderCategory} />
                  <DataRow label="General Technical Evaluation Allowed" value={tender.generalTechnicalEvaluationAllowed} />
                </div>
                <div className="space-y-1">
                  <DataRow label="Payment Mode" value={tender.paymentMode} />
                  <DataRow label="Form Of Contract" value={tender.formOfContract} />
                  <DataRow label="No. of Covers" value={tender.noOfCovers} />
                  <DataRow label="ItemWise Technical Evaluation Allowed" value={tender.itemWiseTechnicalEvaluationAllowed} />
                  <DataRow label="Is Multi Currency Allowed For BOQ" value={tender.isMultiCurrencyAllowedForBOQ} />
                  <DataRow label="Allow Two Stage Bidding" value={tender.allowTwoStageBidding} />
                </div>
              </div>
            </motion.section>

            {/* Payment Instruments & Covers Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Instruments Table */}
              <motion.section variants={fadeUp} className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-6 shadow-subtle">
                <h3 className="text-sm font-bold text-dalBlue dark:text-blue-400 mb-4 border-b border-border dark:border-slate-700 pb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-warningGold" /> Payment Instruments
                </h3>
                {tender.paymentMode === 'Offline' && tender.offlineInstruments?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-charcoal dark:text-slate-300">
                      <thead className="bg-paper dark:bg-slate-900 text-xs uppercase text-charcoal/60 dark:text-slate-400 border-y border-border dark:border-slate-700">
                        <tr>
                          <th className="px-3 py-2">S.No</th>
                          <th className="px-3 py-2">Instrument Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tender.offlineInstruments.map((inst, idx) => (
                          <tr key={idx} className="border-b border-border/50 dark:border-slate-700/50">
                            <td className="px-3 py-2 font-semibold">{inst.sNo}</td>
                            <td className="px-3 py-2">{inst.instrumentType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-charcoal/60 dark:text-slate-400 font-semibold">Online payment or No instruments listed.</p>
                )}
              </motion.section>

              {/* Covers Information Table */}
              <motion.section variants={fadeUp} className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-6 shadow-subtle">
                <h3 className="text-sm font-bold text-dalBlue dark:text-blue-400 mb-4 border-b border-border dark:border-slate-700 pb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-chinarRed" /> Covers Information
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-charcoal dark:text-slate-300">
                    <thead className="bg-paper dark:bg-slate-900 text-xs uppercase text-charcoal/60 dark:text-slate-400 border-y border-border dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2">No</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tender.coversInfo?.map((cover, idx) => (
                        <tr key={idx} className="border-b border-border/50 dark:border-slate-700/50">
                          <td className="px-3 py-2 font-semibold">{cover.coverNo}</td>
                          <td className="px-3 py-2 text-xs">{cover.coverType || 'Finance'}</td>
                          <td className="px-3 py-2 text-xs font-bold text-dalBlue dark:text-blue-400 uppercase">{cover.documentType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            </div>
            
            {/* Work Item Details Section */}
            <motion.section variants={fadeUp} className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-6 shadow-subtle">
              <h3 className="text-lg font-bold text-dalBlue dark:text-blue-400 mb-4 border-b border-border dark:border-slate-700 pb-3">Work Item Details</h3>
              
              <div className="mb-6 p-4 bg-paper dark:bg-slate-900 rounded-lg border border-border/50 dark:border-slate-700">
                <span className="block text-xs font-bold uppercase text-charcoal/50 dark:text-slate-400 mb-1">Title & Work Description</span>
                <p className="text-sm font-semibold text-charcoal dark:text-slate-200 leading-relaxed">{tender.workDescription || tender.title}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className="space-y-1">
                  <DataRow label="NDA/Pre Qualification" value={tender.ndaPreQualification} />
                  <DataRow label="Independent External Monitor" value={tender.independentExternalMonitorRemarks} />
                  <DataRow label="Tender Value" value={formatCurrencyINR(tender.estimatedValue)} />
                  <DataRow label="Product Category" value={tender.productCategory} />
                  <DataRow label="Sub Category" value={tender.subCategory} />
                  <DataRow label="Contract Type" value={tender.contractType} />
                  <DataRow label="Location" value={tender.location} />
                  <DataRow label="Pincode" value={tender.pincode} />
                </div>
                <div className="space-y-1">
                  <DataRow label="Bid Validity (Days)" value={tender.bidValidityDays} />
                  <DataRow label="Period Of Work (Days)" value={tender.periodOfWorkDays} />
                  <DataRow label="Pre Bid Meeting Place" value={tender.preBidMeetingPlace} />
                  <DataRow label="Pre Bid Meeting Address" value={tender.preBidMeetingAddress} />
                  <DataRow label="Pre Bid Meeting Date" value={formatDateDisplay(parseDate(tender.preBidMeetingDate))} />
                  {/* Added Bid Opening Place here to match the portal perfectly */}
                  <DataRow label="Bid Opening Place" value={tender.bidOpeningPlace} />
                  <DataRow label="Should Allow NDA Tender" value={tender.shouldAllowNDATender} />
                  <DataRow label="Allow Preferential Bidder" value={tender.allowPreferentialBidder} />
                </div>
              </div>
            </motion.section>
            

            
          </div>

          {/* Right Column: Financials, Dates & Documents */}
          <div className="space-y-6">
            
            {/* Tender Fee & EMD Details */}
            <motion.section variants={fadeUp} className="bg-dalBlue dark:bg-slate-800 border border-dalBlue dark:border-slate-700 rounded-xl p-6 shadow-md text-white">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-warningGold" /> Fee & EMD Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Tender Fee Details</span>
                  <span className="text-2xl font-extrabold text-white">{formatCurrencyINR(tender.tenderFee)}</span>
                  <div className="mt-2 text-xs space-y-1 text-white/80">
                    <p>Fee Payable To: <strong className="text-white">{tender.feePayableTo || 'N/A'}</strong></p>
                    <p>Fee Payable At: <strong className="text-white">{tender.feePayableAt || 'N/A'}</strong></p>
                    <p>Exemption Allowed: <strong className={tender.tenderFeeExemptionAllowed === 'Yes' ? 'text-successGreen' : 'text-white'}>{tender.tenderFeeExemptionAllowed || 'N/A'}</strong></p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/20">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">EMD Fee Details</span>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-extrabold text-warningGold">{formatCurrencyINR(tender.emdAmount)}</span>
                    <span className="text-xs text-white/60 mb-1 font-bold">({tender.emdFeeType || 'N/A'} - {tender.emdPercentage || 'N/A'})</span>
                  </div>
                  <div className="text-xs space-y-1 text-white/80">
                    <p>EMD Payable To: <strong className="text-white">{tender.emdPayableTo || 'N/A'}</strong></p>
                    <p>EMD Payable At: <strong className="text-white">{tender.emdPayableAt || 'N/A'}</strong></p>
                    <p>Exemption Allowed: <strong className={tender.emdExemptionAllowed === 'Yes' ? 'text-successGreen' : 'text-white'}>{tender.emdExemptionAllowed || 'N/A'}</strong></p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Critical Dates Section */}
            <motion.section variants={fadeUp} className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-6 shadow-subtle">
              <h3 className="text-lg font-bold text-dalBlue dark:text-blue-400 mb-4 flex items-center gap-2 border-b border-border dark:border-slate-700 pb-3">
                <Calendar className="w-5 h-5 text-chinarRed" /> Critical Dates
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
                  <span className="text-[10px] font-bold uppercase text-charcoal/60 dark:text-slate-400">Published Date</span>
                  <span className="text-sm font-bold text-charcoal dark:text-slate-200">{formatDateDisplay(parseDate(tender.publishedDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
                  <span className="text-[10px] font-bold uppercase text-charcoal/60 dark:text-slate-400">Document Download Start</span>
                  <span className="text-sm font-bold text-charcoal dark:text-slate-200">{formatDateDisplay(parseDate(tender.documentDownloadStartDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
                  <span className="text-[10px] font-bold uppercase text-charcoal/60 dark:text-slate-400">Document Download End</span>
                  <span className="text-sm font-bold text-charcoal dark:text-slate-200">{formatDateDisplay(parseDate(tender.documentDownloadEndDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
                  <span className="text-[10px] font-bold uppercase text-charcoal/60 dark:text-slate-400">Clarification Start</span>
                  <span className="text-sm font-bold text-charcoal dark:text-slate-200">{formatDateDisplay(parseDate(tender.clarificationStartDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
                  <span className="text-[10px] font-bold uppercase text-charcoal/60 dark:text-slate-400">Clarification End</span>
                  <span className="text-sm font-bold text-charcoal dark:text-slate-200">{formatDateDisplay(parseDate(tender.clarificationEndDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 bg-successGreen/5 rounded-md px-2 -mx-2">
                  <span className="text-[10px] font-bold uppercase text-successGreen">Bid Submission Start</span>
                  <span className="text-sm font-bold text-successGreen">{formatDateDisplay(parseDate(tender.bidSubmissionStartDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 bg-chinarRed/5 rounded-md px-2 -mx-2">
                  <span className="text-[10px] font-bold uppercase text-chinarRed">Bid Submission End</span>
                  <span className="text-sm font-bold text-chinarRed">{formatDateDisplay(parseDate(tender.bidSubmissionEndDate))}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 pt-2 border-t border-border dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-charcoal/60 dark:text-slate-400">Bid Opening Date</span>
                  <span className="text-sm font-bold text-dalBlue dark:text-blue-400">{formatDateDisplay(parseDate(tender.bidOpeningDate))}</span>
                </div>
              </div>
            </motion.section>

            {/* Tender Documents Section */}
            <motion.section variants={fadeUp} className="bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl p-6 shadow-subtle">
              <h3 className="text-lg font-bold text-dalBlue dark:text-blue-400 mb-4 flex items-center gap-2 border-b border-border dark:border-slate-700 pb-3">
                <Download className="w-5 h-5 text-chinarRed" /> Tender Documents
              </h3>
              
              <div className="space-y-3">
                {tender.pdfUrls && tender.pdfUrls.length > 0 ? (
                  tender.pdfUrls.map((pdfStr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-slate-600 bg-paper dark:bg-slate-900 group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-6 h-6 text-chinarRed shrink-0" />
                        <span className="text-xs font-bold text-charcoal dark:text-slate-300 truncate">Tendernotice_{index + 1}.pdf</span>
                      </div>
                      <a href={pdfStr} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider hover:bg-dalBlue hover:text-white hover:border-dalBlue">
                          View PDF
                        </Button>
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm font-medium text-charcoal/60 dark:text-slate-400 mb-3">No direct PDF link found in database.</p>
                    <a href={tender.detailsUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2 bg-dalBlue hover:bg-dalBlue-800 text-white">
                        Download from Portal <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </motion.section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}