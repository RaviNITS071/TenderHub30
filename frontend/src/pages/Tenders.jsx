/**
 * @file src/pages/Tenders.jsx
 * @description Enterprise tender directory with precise schema-mapped filters:
 * Advanced Search, Organisation, Department, Location, and Closing Date.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, Filter, FileText, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTenders } from '@/hooks/useTenders';
import { useDebounce } from '@/hooks/useDebounce';
import { TenderCard } from '@/components/shared/TenderCard';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export default function Tenders() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Precise State for the 5 Requested Filters
  const [advancedSearch, setAdvancedSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(advancedSearch, 600); // Protects API from spam
  
  const [organisation, setOrganisation] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [closingDate, setClosingDate] = useState(''); // e.g., '7', '15', '30' days
  
  const [currentPage, setCurrentPage] = useState(1);

  // Sync initial URL params if the user navigated from the Home page search bar
  useEffect(() => {
    if (searchParams.get('search')) setAdvancedSearch(searchParams.get('search'));
  }, [searchParams]);

  // 2. Construct API Query Object
  const queryFilters = {
    search: debouncedSearch,
    organisation: organisation,
    department: department,
    location: location,
    closingDays: closingDate, // Backend should use this to filter bidSubmissionEndDate
    page: currentPage,
    limit: 10,
  };

  const { data, isLoading, isError, error } = useTenders(queryFilters);

  const tenders = data?.data || [];
  const totalCount = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalCount / 10) || 1;

  // 3. Handlers
  const handleReset = () => {
    setAdvancedSearch('');
    setOrganisation('');
    setDepartment('');
    setLocation('');
    setClosingDate('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-[#0f172a] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-dalBlue dark:text-blue-400 tracking-tight">Tender Directory</h1>
            <p className="text-sm text-charcoal/60 dark:text-slate-400 mt-1 font-medium">
              Filter by exact organisation hierarchy, location, and deadline parameters.
            </p>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-2 text-xs">
            <RotateCcw className="w-4 h-4" /> Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* ---------------- FILTER SIDEBAR ---------------- */}
{/* ---------------- FILTER SIDEBAR ---------------- */}
          <aside className="lg:col-span-1 bg-white dark:bg-[#1e293b] border border-border dark:border-slate-700 rounded-xl p-5 shadow-subtle space-y-6 sticky top-24 h-[80vh] overflow-y-auto scrollbar-hide">            <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-slate-700 text-dalBlue dark:text-blue-400">
              <Filter className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Search Parameters</h3>
            </div>

            {/* 1. Advanced Search */}
            <div>
              <label className="block text-xs font-bold text-charcoal dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-charcoal/40 dark:text-slate-500 absolute left-3 top-3" />
                <Input
                  type="text"
                  value={advancedSearch}
                  onChange={(e) => {
                    setAdvancedSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ID, Title, or Description..."
                  className="pl-9 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>

            {/* 2. Organisation Filter */}
            <div>
              <label className="block text-xs font-bold text-charcoal dark:text-slate-300 mb-1.5">Organisation (Parent)</label>
              <Select 
                value={organisation} 
                onValueChange={(val) => {
                  setOrganisation(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                  <SelectItem value="">All Organisations</SelectItem>
                  <SelectItem value="AGRICULTURE PRODUCTION DEPARTMENT">Agriculture Production Dept</SelectItem>
                  <SelectItem value="PUBLIC WORKS DEPARTMENT">Public Works Dept (PWD)</SelectItem>
                  <SelectItem value="JAL SHAKTI DEPARTMENT">Jal Shakti Dept</SelectItem>
                  <SelectItem value="EDUCATION DEPARTMENT">Education Dept</SelectItem>
                </SelectTrigger>
              </Select>
            </div>

            {/* 3. Department Filter */}
            <div>
              <label className="block text-xs font-bold text-charcoal dark:text-slate-300 mb-1.5">Sub-Department</label>
              <Select 
                value={department} 
                onValueChange={(val) => {
                  setDepartment(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="Directorate Agriculture">Directorate Agriculture</SelectItem>
                  <SelectItem value="PWD">PWD (R&B)</SelectItem>
                  <SelectItem value="Public Health Engineering">Public Health Engineering (PHE)</SelectItem>
                  <SelectItem value="Rural Development">Rural Development Dept</SelectItem>
                  <SelectItem value="Power Development">Power Development Dept</SelectItem>
                  <SelectItem value="Housing and Urban">Housing & Urban Development</SelectItem>
                  <SelectItem value="Tourism Department">Tourism Department</SelectItem>
                </SelectTrigger>
              </Select>
            </div>

            {/* 4. Location Filter */}
            <div>
              <label className="block text-xs font-bold text-charcoal dark:text-slate-300 mb-1.5">Execution Location</label>
              <Input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="City, District, or Pincode..."
                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>

            {/* 5. Closing Date Filter */}
            <div>
              <label className="block text-xs font-bold text-charcoal dark:text-slate-300 mb-1.5">Closing Date Timeline</label>
              <Select 
                value={closingDate} 
                onValueChange={(val) => {
                  setClosingDate(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                  <SelectItem value="">Any Date</SelectItem>
                  <SelectItem value="7">Closing in next 7 days</SelectItem>
                  <SelectItem value="15">Closing in next 15 days</SelectItem>
                  <SelectItem value="30">Closing in next 30 days</SelectItem>
                </SelectTrigger>
              </Select>
            </div>
          </aside>

          {/* ---------------- MAIN RESULTS FEED ---------------- */}
          <main className="lg:col-span-3 space-y-4">
            
            <div className="flex items-center justify-between bg-white dark:bg-[#1e293b] border border-border dark:border-slate-700 px-4 py-3 rounded-xl text-xs font-bold text-charcoal/70 dark:text-slate-400 shadow-sm">
              <span>
                Matches Found: <strong className="text-dalBlue dark:text-blue-400 text-sm">{totalCount}</strong> notices
              </span>
              <span>Sorted by Bid Deadline</span>
            </div>

            {/* Loading State */}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#1e293b] border border-border dark:border-slate-700 rounded-xl p-16 text-center space-y-4 shadow-subtle">
                <div className="w-10 h-10 rounded-full border-4 border-dalBlue border-t-transparent animate-spin mx-auto" />
                <p className="text-sm font-bold text-dalBlue dark:text-blue-400">Filtering database...</p>
              </motion.div>
            )}

            {/* Error State */}
            {isError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-chinarRed/10 border border-chinarRed/30 rounded-xl p-8 text-center text-chinarRed text-sm space-y-2">
                <p className="font-bold text-base">Unable to retrieve records.</p>
                <p>{error?.message || 'Please check your backend connection.'}</p>
              </motion.div>
            )}

            {/* Tender Feed */}
            {!isLoading && !isError && tenders.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {tenders.map((tender) => (
                  <TenderCard key={tender._id || tender.sourceTenderId} tender={tender} />
                ))}

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#1e293b] border border-border dark:border-slate-700 px-4 py-3 rounded-xl mt-6 shadow-sm gap-4">
                  <span className="text-xs font-semibold text-charcoal/60 dark:text-slate-400">
                    Page <strong className="text-charcoal dark:text-white">{currentPage}</strong> of <strong className="text-charcoal dark:text-white">{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}
                      className="dark:bg-slate-800 dark:border-slate-600 dark:text-white px-3"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    
                    <div className="h-9 px-4 flex items-center justify-center bg-paper dark:bg-slate-900 rounded-lg text-sm font-bold text-dalBlue dark:text-blue-400 border border-border dark:border-slate-700">
                      {currentPage}
                    </div>

                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}
                      className="dark:bg-slate-800 dark:border-slate-600 dark:text-white px-3"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && tenders.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#1e293b] border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-16 text-center space-y-3 shadow-sm">
                <FileText className="w-12 h-12 text-dalBlue/30 dark:text-slate-600 mx-auto" />
                <h4 className="text-lg font-bold text-dalBlue dark:text-blue-400">No Matching Tenders</h4>
                <p className="text-sm text-charcoal/60 dark:text-slate-400 max-w-sm mx-auto">
                  Adjust your search parameters. Try removing specific departments or extending the closing date timeline.
                </p>
                <Button onClick={handleReset} className="mt-4">
                  Clear All Filters
                </Button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}