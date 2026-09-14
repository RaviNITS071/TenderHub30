/**
 * @file src/pages/Tenders.jsx
 * @description Official public procurement directory for Jammu & Kashmir.
 * Features schema-mapped filters: Search, Organisation, Department, Location, and Closing Date.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, Filter, FileText, ChevronLeft, ChevronRight, Clock, Archive, ArrowUpDown } from 'lucide-react';

import { useTenders } from '@/hooks/useTenders';
import { useDebounce } from '@/hooks/useDebounce';
import { TenderCard } from '@/components/shared/TenderCard';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export default function Tenders() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Filter State
  const currentSearchParam = searchParams.get('search') || searchParams.get('category') || '';
  const [advancedSearch, setAdvancedSearch] = useState(currentSearchParam);
  const [prevSearchParam, setPrevSearchParam] = useState(currentSearchParam);
  if (currentSearchParam !== prevSearchParam) {
    setPrevSearchParam(currentSearchParam);
    setAdvancedSearch(currentSearchParam);
  }
  const debouncedSearch = useDebounce(advancedSearch, 600);
  
  const [organisation, setOrganisation] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [closingDate, setClosingDate] = useState('');
  
  // Tab State: Latest vs Archived Tenders
  const [status, setStatus] = useState('active');
  const [sortBy, setSortBy] = useState('arrival');
  
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Construct API Query
  const queryFilters = {
    search: debouncedSearch,
    organisation: organisation,
    department: department,
    location: location,
    closingDays: closingDate,
    status: status,
    sortBy: sortBy,
    page: currentPage,
    limit: 10,
  };

  const { data, isLoading, isError, error } = useTenders(queryFilters);

  const tenders = data?.data || [];
  const totalCount = data?.meta?.total || 0;
  const activeCount = data?.meta?.activeCount ?? 0;
  const archivedCount = data?.meta?.archivedCount ?? 0;
  const totalPages = Math.ceil(totalCount / 10) || 1;

  // 3. Handlers
  const handleReset = () => {
    setAdvancedSearch('');
    setOrganisation('');
    setDepartment('');
    setLocation('');
    setClosingDate('');
    setStatus('active');
    setSortBy('arrival');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Title & Reset Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Tender Notice Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Official public works, civil contracts, and procurement notices published across J&amp;K.
            </p>
          </div>
          <Button variant="outline" onClick={handleReset} className="gap-1.5 text-xs self-start sm:self-auto">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* ---------------- FILTER SIDEBAR ---------------- */}
          <aside className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs space-y-5 sticky top-20">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-dalBlue dark:text-blue-400">
              <Filter className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Search Filters</h2>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type="text"
                  value={advancedSearch}
                  onChange={(e) => {
                    setAdvancedSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Title, ref no, or work..."
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {/* Location / District */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                District / Location
              </label>
              <Input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="e.g. Baramulla, Srinagar, Jammu..."
                className="text-xs"
              />
            </div>

            {/* Organisation Chain */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Government Division
              </label>
              <Input
                type="text"
                value={organisation}
                onChange={(e) => {
                  setOrganisation(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="e.g. Jal Shakti, PWD, R&B..."
                className="text-xs"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Name
              </label>
              <Input
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="e.g. PHE Division, Irrigation..."
                className="text-xs"
              />
            </div>

            {/* Closing Date Window */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closing Deadline
              </label>
              <Select value={closingDate} onValueChange={(val) => { setClosingDate(val); setCurrentPage(1); }}>
                <SelectTrigger className="text-xs">
                  <SelectItem value="">All Closing Dates</SelectItem>
                  <SelectItem value="3">Closing in 3 Days (Urgent)</SelectItem>
                  <SelectItem value="7">Closing in 7 Days</SelectItem>
                  <SelectItem value="15">Closing in 15 Days</SelectItem>
                  <SelectItem value="30">Closing in 30 Days</SelectItem>
                </SelectTrigger>
              </Select>
            </div>
          </aside>

          {/* ---------------- MAIN RESULTS FEED ---------------- */}
          <main className="lg:col-span-3 space-y-4">
            
            {/* Top Tab Bar: Latest vs Archived Notices + Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-xs">
              {/* Menu Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('active');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    status === 'active'
                      ? 'bg-white dark:bg-slate-800 text-dalBlue dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-dalBlue dark:text-blue-400" />
                  <span>Latest Notices</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {activeCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatus('archived');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    status === 'archived'
                      ? 'bg-white dark:bg-slate-800 text-dalBlue dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Archived (Expired)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {archivedCount}
                  </span>
                </button>
              </div>

              {/* Sorting Selector */}
              <div className="flex items-center gap-1.5 px-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="arrival">Arrival Date (Newest First)</option>
                  <option value="closingAsc">Deadline (Soonest First)</option>
                  <option value="closingDesc">Deadline (Furthest First)</option>
                  <option value="valueDesc">Estimated Value (High to Low)</option>
                  <option value="valueAsc">Estimated Value (Low to High)</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {(advancedSearch || organisation || department || location || closingDate) && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs shadow-xs">
                <span className="font-semibold text-slate-400 uppercase text-[10px] mr-1">Active:</span>
                
                {advancedSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    <span>Search: &quot;{advancedSearch}&quot;</span>
                    <button onClick={() => setAdvancedSearch('')} className="hover:text-chinarRed font-bold ml-1">×</button>
                  </span>
                )}
                {organisation && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    <span>Division: {organisation}</span>
                    <button onClick={() => setOrganisation('')} className="hover:text-chinarRed font-bold ml-1">×</button>
                  </span>
                )}
                {department && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    <span>Dept: {department}</span>
                    <button onClick={() => setDepartment('')} className="hover:text-chinarRed font-bold ml-1">×</button>
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    <span>Location: {location}</span>
                    <button onClick={() => setLocation('')} className="hover:text-chinarRed font-bold ml-1">×</button>
                  </span>
                )}
                {closingDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                    <span>Closing in: {closingDate}d</span>
                    <button onClick={() => setClosingDate('')} className="hover:text-chinarRed font-bold ml-1">×</button>
                  </span>
                )}

                <button
                  onClick={handleReset}
                  className="text-chinarRed font-semibold hover:underline text-xs ml-auto"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Total Results Summary */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-400">
              <span>
                Showing <strong className="font-mono text-sm text-dalBlue dark:text-blue-400 font-bold">{totalCount}</strong> {status === 'archived' ? 'archived notices' : 'active notices'}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center space-y-3 shadow-xs">
                <div className="w-8 h-8 rounded-full border-3 border-dalBlue border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading tender notices...</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-6 text-center text-red-700 dark:text-red-300 text-xs space-y-1">
                <p className="font-bold text-sm">Unable to load tender directory.</p>
                <p>{error?.message || 'Please verify database connection.'}</p>
              </div>
            )}

            {/* Tender Feed */}
            {!isLoading && !isError && tenders.length > 0 && (
              <div className="space-y-3.5">
                {tenders.map((tender) => (
                  <TenderCard key={tender._id || tender.sourceTenderId} tender={tender} />
                ))}

                {/* Standard Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl mt-4 shadow-xs gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Page <strong className="text-slate-800 dark:text-white font-mono">{currentPage}</strong> of <strong className="text-slate-800 dark:text-white font-mono">{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}
                      className="px-2.5 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                    </Button>
                    
                    <div className="h-8 px-3 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-md text-xs font-mono font-bold text-dalBlue dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                      {currentPage}
                    </div>

                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}
                      className="px-2.5 text-xs"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && tenders.length === 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center space-y-2.5 shadow-xs">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  {status === 'archived' ? 'No Archived Notices Found' : 'No Matching Tender Notices'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {status === 'archived'
                    ? 'No expired notices match your current filters. Adjust your criteria or switch to Latest Notices.'
                    : 'Try clearing specific department or district filters to broaden your search results.'}
                </p>
                <div className="pt-2">
                  <Button variant="outline" onClick={handleReset} className="text-xs">
                    Reset All Filters
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}