/**
 * @file src/pages/Tenders.jsx
 * @description Official public procurement directory for Jammu & Kashmir.
 * Features structured dropdown filters (Districts, Categories, Authorities, Divisions),
 * prominent interactive focus and selection states, and live notice analytics.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  RotateCcw, 
  Filter, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Clock, 
  Archive, 
  CalendarX,
  ArrowUpDown,
  MapPin,
  Layers,
  Building2,
  Calendar,
  X,
  Lock,
  Eye,
  Sparkles
} from 'lucide-react';

import { useTenders } from '@/hooks/useTenders';
import { useDebounce } from '@/hooks/useDebounce';
import { TenderCard } from '@/components/shared/TenderCard';
import { AuthPromptModal } from '@/components/shared/AuthPromptModal';
import { useAuthStore } from '@/store/useAuthStore';
import { billingApi } from '@/services/billingApi';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

// Static filter datasets mapped to government e-procurement nomenclature
const DISTRICT_OPTIONS = [
  { label: 'All Districts & Regions', value: '' },
  { label: 'Baramulla', value: 'Baramulla' },
  { label: 'Bandipora', value: 'Bandipora' },
  { label: 'Srinagar', value: 'Srinagar' },
  { label: 'Jammu', value: 'Jammu' },
  { label: 'Pulwama', value: 'Pulwama' },
  { label: 'Anantnag', value: 'Anantnag' },
  { label: 'Kulgam', value: 'Kulgam' },
  { label: 'Budgam', value: 'Budgam' },
  { label: 'Kupwara', value: 'Kupwara' },
  { label: 'Ganderbal', value: 'Ganderbal' },
  { label: 'Shopian', value: 'Shopian' },
  { label: 'Udhampur', value: 'Udhampur' },
  { label: 'Reasi', value: 'Reasi' },
  { label: 'Kathua', value: 'Kathua' },
  { label: 'Samba', value: 'Samba' },
  { label: 'Rajouri', value: 'Rajouri' },
  { label: 'Poonch', value: 'Poonch' },
  { label: 'Doda', value: 'Doda' },
  { label: 'Ramban', value: 'Ramban' },
  { label: 'Kishtwar', value: 'Kishtwar' },
];

const CATEGORY_OPTIONS = [
  { label: 'All Work Categories', value: '' },
  { label: 'Civil Works', value: 'Civil Works' },
  { label: 'Electrical Works', value: 'Electrical Works' },
  { label: 'Water Equipments & Boring', value: 'Water Equipments/ Meter/ Drilling/ Boring' },
  { label: 'Electrical & Maintenance', value: 'Electrical and Maintenance Works' },
  { label: 'Civil Works - Others', value: 'Civil Works - Others' },
  { label: 'Medicines & Health Supplies', value: 'Medicines' },
  { label: 'Miscellaneous Services', value: 'Miscellaneous Services' },
  { label: 'Miscellaneous Goods', value: 'Miscellaneous Goods' },
];

const AUTHORITY_OPTIONS = [
  { label: 'All Government Authorities', value: '' },
  { label: 'Rural Development & Panchayati Raj', value: 'Rural Development' },
  { label: 'Public Works Department (PWD)', value: 'PWD' },
  { label: 'Housing & Urban Development (HAUDD)', value: 'HAUDD' },
  { label: 'Irrigation & Flood Control (I and FC)', value: 'I and FC' },
  { label: 'Power Development Dept (DC-PDD)', value: 'DC-PDD' },
  { label: 'Jal Shakti / PHE Department', value: 'PHE' },
  { label: 'Forest Department', value: 'FOREST DEPARTMENT' },
  { label: 'Health & Medical Education', value: 'Health and Medical Education' },
  { label: 'Soil & Water Conservation Dept', value: 'Soil and Water Conservation' },
  { label: 'Power Development Corp (JKSPDC)', value: 'JKSPDC' },
  { label: 'Universities & Higher Education', value: 'University Department' },
  { label: 'SKUAST Agriculture University', value: 'SKUAST' },
  { label: 'Police Headquarters (DGP-JK)', value: 'DGP-JK' },
  { label: 'Forest Development Corp (JKSFC)', value: 'JKSFC' },
  { label: 'Shri Mata Vaishno Devi Shrine Board', value: 'SHRI MATA VAISHNO DEVI' },
  { label: 'Tourism Department', value: 'Tourism' },
  { label: 'Agriculture Production Department', value: 'AGRICULTURE PRODUCTION' },
  { label: 'Industries & Commerce (SICOP)', value: 'SICOP' },
  { label: 'J&K Sports Council', value: 'Sports Council' },
  { label: 'Horticulture Production Dept', value: 'Horticulture' },
];

const DIVISION_OPTIONS = [
  { label: 'All Divisions & Wings', value: '' },
  { label: 'Directorate Agriculture Kashmir', value: 'Directorate Agriculture Kashmir' },
  { label: 'Agriculture District Baramulla', value: 'Department of Agriculture District Baramulla' },
  { label: 'Command Area Development Pulwama', value: 'CAD Division Pulwama' },
  { label: 'Soil Conservation Anantnag/Kulgam', value: 'Asstt Soil Conservation Officer Anantnag' },
  { label: 'HADP / JKCIP Directorate', value: 'Mission Directorate HADP' },
  { label: 'CE-M & RE Wing Kashmir', value: 'CE-M and RE Wing Kashmir' },
  { label: 'CIRCLE II-Srinagar (ED-3rd)', value: 'CIRCLE II-Srinagar' },
  { label: 'ED-Anantnag & Bijbehara', value: 'ED-Anantnag' },
  { label: 'ED-Kulgam', value: 'ED-Kulgam' },
  { label: 'ED-Pulwama & Shopian', value: 'South Pulwama' },
  { label: 'CE-M & RE Wing Jammu', value: 'CE-M and RE Wing Jammu' },
  { label: 'STD-II Jammu', value: 'STD-II Jammu' },
  { label: 'ED-Rajouri & Batote', value: 'ED-Rajouri' },
  { label: 'ED-Udhampur', value: 'ED-Udhampur' },
  { label: 'Animal Husbandry Jammu', value: 'Animal Husbandry Jammu' },
  { label: 'Director Fisheries', value: 'DIRECTOR FISHERIES' },
];

const DEADLINE_OPTIONS = [
  { label: 'All Closing Deadlines', value: '' },
  { label: 'Closing in 3 Days (Urgent)', value: '3' },
  { label: 'Closing in 7 Days', value: '7' },
  { label: 'Closing in 15 Days', value: '15' },
  { label: 'Closing in 30 Days', value: '30' },
];

export default function Tenders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  const [subscription, setSubscription] = useState(null);

  // Refresh user quota and subscription status on directory mount
  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
      billingApi.getStatus().then((sub) => setSubscription(sub)).catch(() => {});
    }
  }, [isAuthenticated, checkAuth]);

  const isPro = Boolean(
    subscription?.hasActiveSubscription || 
    user?.role === 'admin' || 
    user?.role === 'owner' ||
    import.meta.env.VITE_TEST_MODE === 'true' ||
    (typeof window !== 'undefined' && window.location.port === '5175')
  );

  // Auth Prompt Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    title: 'Sign In to View Full Tender Details',
    subtitle: 'Official tender documents, BOQs, and authority specifications are protected.',
    redirectUrl: '/tenders'
  });

  const handleRequestAuth = (config = {}) => {
    setAuthModalConfig((prev) => ({ ...prev, ...config }));
    setAuthModalOpen(true);
  };

  const handleViewDetails = (tender) => {
    const tenderId = tender._id || tender.sourceTenderId;
    if (!isAuthenticated) {
      handleRequestAuth({
        title: 'Sign In to View Full Tender Details',
        subtitle: `Notice ${tender.sourceTenderId || tender.tenderReferenceNumber || 'NIT'}: ${tender.title?.slice(0, 80) || ''}...`,
        redirectUrl: `/tenders/${tenderId}`
      });
      return;
    }
    navigate(`/tenders/${tenderId}`);
  };

  // 1. Initial State from URL params
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [advancedSearch, setAdvancedSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(advancedSearch, 500);

  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [department, setDepartment] = useState('');
  const [closingDate, setClosingDate] = useState('');
  
  // Tab State: Latest vs Archived Tenders
  const [status, setStatus] = useState('active');
  const [sortBy, setSortBy] = useState('arrival');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Active filter count for badge
  const activeFilterCount = [
    Boolean(advancedSearch),
    Boolean(category),
    Boolean(location),
    Boolean(organisation),
    Boolean(department),
    Boolean(closingDate),
  ].filter(Boolean).length;

  // Unauthenticated guests get up to 25 items on page 1 so 15 are visible and remaining are blurred
  const queryLimit = isAuthenticated ? 10 : 25;

  // 2. Construct API Query
  const queryFilters = {
    search: debouncedSearch,
    category: category,
    organisation: organisation,
    department: department,
    location: location,
    closingDays: closingDate,
    status: status,
    sortBy: sortBy,
    page: currentPage,
    limit: queryLimit,
  };

  const { data, isLoading, isError, error } = useTenders(queryFilters);

  const tenders = data?.data || [];
  const totalCount = data?.meta?.total || 0;
  const activeCount = data?.meta?.activeCount ?? 0;
  const archivedCount = data?.meta?.archivedCount ?? 0;
  const expiredCount = data?.meta?.expiredCount ?? 0;
  const totalPages = Math.ceil(totalCount / (isAuthenticated ? 10 : 25)) || 1;

  // 3. Handlers
  const handleReset = () => {
    setAdvancedSearch('');
    setCategory('');
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
    if (!isAuthenticated && newPage > 1) {
      handleRequestAuth({
        title: 'Sign In to View More Tenders',
        subtitle: 'Guests are limited to previewing the 15 latest tender notices. Sign in to browse all pages and view details.',
        redirectUrl: '/tenders'
      });
      return;
    }
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Title & Reset Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                Tender Notice Directory
              </h1>
              {(import.meta.env.VITE_TEST_MODE === 'true' || (typeof window !== 'undefined' && window.location.port === '5175')) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Testing Port 5175: All Content &amp; Full Details Unlocked (No Login Required)</span>
                </span>
              ) : !isAuthenticated ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Guest Preview (15 Latest Notices)</span>
                </span>
              ) : isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>TenderHub Pro Active: All Notices &amp; WhatsApp Alerts Unlocked</span>
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
                  (user?.dailyViews?.viewsUsed ?? 0) >= (typeof user?.dailyViews?.viewsLimit === 'number' ? user.dailyViews.viewsLimit : 5)
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Daily Views: {user?.dailyViews?.viewsUsed ?? 0}/{user?.dailyViews?.viewsLimit === 'Unlimited' ? 'Unlimited' : (user?.dailyViews?.viewsLimit ?? 5)} used (24h limit)
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Official public works, civil contracts, and procurement notices published across J&amp;K.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="gap-1.5 text-xs self-start sm:self-auto hover:border-chinarRed hover:text-chinarRed transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </Button>
        </div>

        {/* Mobile/Tablet Filter Accordion Toggle (< lg) */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs text-xs font-bold text-dalBlue dark:text-blue-300 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dalBlue dark:text-blue-400 shrink-0" />
              <span>{mobileFiltersOpen ? 'Hide Search Filters' : 'Show Search Filters'}</span>
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dalBlue text-white dark:bg-blue-600">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span 
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="text-[11px] text-chinarRed hover:underline font-semibold"
                >
                  Reset
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* ---------------- FILTER SIDEBAR ---------------- */}
          <aside className={`lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs lg:sticky lg:top-20 flex flex-col max-h-[520px] sm:max-h-[560px] lg:max-h-[calc(100vh-6rem)] overflow-hidden transition-all ${
            mobileFiltersOpen ? 'flex mb-4 lg:mb-0' : 'hidden lg:flex'
          }`}>
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 text-dalBlue dark:text-blue-400 bg-white dark:bg-slate-800 shrink-0 select-none">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Search Filters</h2>
              </div>
              {activeFilterCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-dalBlue text-white dark:bg-blue-600 shadow-xs animate-in fade-in">
                  {activeFilterCount} active
                </span>
              )}
            </div>

            {/* Scrollable Filters Body with Dedicated Vertical Scrollbar */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 filter-scrollbar overscroll-contain">
              {/* Keyword Search Input */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Keyword / NIT No.</span>
                  {advancedSearch && (
                    <button 
                      onClick={() => { setAdvancedSearch(''); setCurrentPage(1); }}
                      className="text-[10px] text-slate-400 hover:text-chinarRed"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
                  <Input
                    type="text"
                    value={advancedSearch}
                    onChange={(e) => {
                      setAdvancedSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="e.g. Borewell, NIT No, Road..."
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              {/* District / Location Dropdown */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-chinarRed" /> District / Region
                  </span>
                  {location && (
                    <button 
                      onClick={() => { setLocation(''); setCurrentPage(1); }}
                      className="text-[10px] text-chinarRed font-bold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select value={location} onValueChange={(val) => { setLocation(val); setCurrentPage(1); }}>
                  <SelectTrigger className="text-xs">
                    {DISTRICT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectTrigger>
                </Select>
              </div>

              {/* Work Category Dropdown */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-dalBlue dark:text-blue-400" /> Work Domain / Category
                  </span>
                  {category && (
                    <button 
                      onClick={() => { setCategory(''); setCurrentPage(1); }}
                      className="text-[10px] text-chinarRed font-bold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select value={category} onValueChange={(val) => { setCategory(val); setCurrentPage(1); }}>
                  <SelectTrigger className="text-xs">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectTrigger>
                </Select>
              </div>

              {/* Government Authority Dropdown */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Procuring Authority
                  </span>
                  {organisation && (
                    <button 
                      onClick={() => { setOrganisation(''); setCurrentPage(1); }}
                      className="text-[10px] text-chinarRed font-bold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select value={organisation} onValueChange={(val) => { setOrganisation(val); setCurrentPage(1); }}>
                  <SelectTrigger className="text-xs">
                    {AUTHORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectTrigger>
                </Select>
              </div>

              {/* Division / Sub-Department Dropdown */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Executive Division / Wing</span>
                  {department && (
                    <button 
                      onClick={() => { setDepartment(''); setCurrentPage(1); }}
                      className="text-[10px] text-chinarRed font-bold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select value={department} onValueChange={(val) => { setDepartment(val); setCurrentPage(1); }}>
                  <SelectTrigger className="text-xs">
                    {DIVISION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectTrigger>
                </Select>
              </div>

              {/* Closing Date Window */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Submission Deadline
                  </span>
                  {closingDate && (
                    <button 
                      onClick={() => { setClosingDate(''); setCurrentPage(1); }}
                      className="text-[10px] text-chinarRed font-bold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </label>
                <Select value={closingDate} onValueChange={(val) => { setClosingDate(val); setCurrentPage(1); }}>
                  <SelectTrigger className="text-xs">
                    {DEADLINE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectTrigger>
                </Select>
              </div>
            </div>

            {/* Pinned Quick Reset in Sidebar Footer */}
            {activeFilterCount > 0 && (
              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="w-full text-xs text-chinarRed border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                >
                  Clear All Filters ({activeFilterCount})
                </Button>
              </div>
            )}
          </aside>

          {/* ---------------- MAIN RESULTS FEED ---------------- */}
          <main className="lg:col-span-3 space-y-4">
            
            {/* Top Tab Bar: Latest vs Archived Notices + Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 sm:p-2.5 rounded-2xl shadow-xs">
              {/* Menu Tabs with High-Contrast Active States */}
              <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('active');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chinarRed ${
                    status === 'active'
                      ? 'bg-dalBlue text-white shadow-sm font-bold border border-dalBlue dark:bg-blue-600 dark:border-blue-500 ring-2 ring-dalBlue/20 dark:ring-blue-400/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-dalBlue dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${status === 'active' ? 'text-white' : 'text-dalBlue dark:text-blue-400'}`} />
                  <span className="truncate">Latest Notices</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    status === 'active' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {activeCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatus('archived');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chinarRed ${
                    status === 'archived'
                      ? 'bg-amber-700 text-white dark:bg-amber-600 shadow-sm font-bold border border-amber-700 dark:border-amber-500 ring-2 ring-amber-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 font-medium'
                  }`}
                  title="Tenders whose download closed or awaiting bid opening"
                >
                  <Archive className={`w-3.5 h-3.5 shrink-0 ${status === 'archived' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                  <span className="truncate">Archived</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    status === 'archived' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {archivedCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatus('expired');
                    setCurrentPage(1);
                  }}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-chinarRed ${
                    status === 'expired'
                      ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm font-bold border border-slate-800 dark:border-slate-600 ring-2 ring-slate-800/20 dark:ring-slate-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 font-medium'
                  }`}
                  title="Tenders whose bid submission deadline has elapsed"
                >
                  <CalendarX className={`w-3.5 h-3.5 shrink-0 ${status === 'expired' ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">Expired</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    status === 'expired' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {expiredCount}
                  </span>
                </button>
              </div>

              {/* Sorting Selector */}
              <div className="flex items-center justify-between sm:justify-start gap-2 px-1 sm:px-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sort:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 sm:flex-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white hover:border-dalBlue dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-dalBlue/30 focus:border-dalBlue cursor-pointer shadow-xs transition-all truncate"
                >
                  <option value="arrival">Latest Published (Newest First)</option>
                  <option value="publishedAsc">Oldest Published First</option>
                  <option value="closingAsc">Closing Deadline (Soonest First)</option>
                  <option value="closingDesc">Closing Deadline (Furthest First)</option>
                  <option value="valueDesc">Estimated Value (High to Low)</option>
                  <option value="valueAsc">Estimated Value (Low to High)</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs shadow-xs">
                <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase text-[10px] mr-1">Active:</span>
                
                {advancedSearch && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-dalBlue dark:text-blue-200 border border-dalBlue/20 font-medium">
                    <span>Search: &quot;{advancedSearch}&quot;</span>
                    <button onClick={() => setAdvancedSearch('')} className="hover:text-chinarRed font-bold ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {location && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-dalBlue dark:text-blue-200 border border-dalBlue/20 font-medium">
                    <MapPin className="w-3 h-3 text-chinarRed" />
                    <span>District: {location}</span>
                    <button onClick={() => setLocation('')} className="hover:text-chinarRed font-bold ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {category && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-dalBlue dark:text-blue-200 border border-dalBlue/20 font-medium">
                    <Layers className="w-3 h-3" />
                    <span>Category: {category}</span>
                    <button onClick={() => setCategory('')} className="hover:text-chinarRed font-bold ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {organisation && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-dalBlue dark:text-blue-200 border border-dalBlue/20 font-medium">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate max-w-[160px]">Authority: {organisation}</span>
                    <button onClick={() => setOrganisation('')} className="hover:text-chinarRed font-bold ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {department && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-dalBlue dark:text-blue-200 border border-dalBlue/20 font-medium">
                    <span className="truncate max-w-[160px]">Division: {department}</span>
                    <button onClick={() => setDepartment('')} className="hover:text-chinarRed font-bold ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {closingDate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-dalBlue dark:text-blue-200 border border-dalBlue/20 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>Deadline: &le; {closingDate} days</span>
                    <button onClick={() => setClosingDate('')} className="hover:text-chinarRed font-bold ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleReset}
                  className="text-chinarRed font-bold hover:underline text-xs ml-auto cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Total Results Summary */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 shadow-xs">
              <span>
                Showing <strong className="font-mono text-sm text-dalBlue dark:text-blue-400 font-bold">{totalCount}</strong> {status === 'archived' ? 'archived notices' : status === 'expired' ? 'expired notices' : 'active notices'}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                <div className="w-8 h-8 rounded-full border-3 border-dalBlue border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading tender notices...</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-center text-red-700 dark:text-red-300 text-xs space-y-1">
                <p className="font-bold text-sm">Unable to load tender directory.</p>
                <p>{error?.message || 'Please verify database connection.'}</p>
              </div>
            )}

            {/* Tender Feed */}
            {!isLoading && !isError && tenders.length > 0 && (
              <div className="space-y-4">
                {tenders.map((tender, index) => {
                  const isBlurredCard = !isPro && index >= 15;
                  return (
                    <div key={tender._id || tender.sourceTenderId} className="space-y-4">
                      {/* Banner injected before first blurred tender card (index 15) */}
                      {!isPro && index === 15 && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-dalBlue to-slate-950 text-white p-5 sm:p-7 shadow-xl border border-dalBlue/50 my-6">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                                <Lock className="w-6 h-6 text-chinarRed" />
                              </div>
                              <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-mono font-bold text-blue-200 mb-1.5">
                                  <span>Viewing 15 of {totalCount} Active Notices</span>
                                </div>
                                <h3 className="text-base sm:text-lg font-display font-bold">
                                  {isAuthenticated ? 'Upgrade to TenderHub Pro (₹399/mo)' : 'Unlock All Tender Notices & Technical Details'}
                                </h3>
                                <p className="text-xs text-blue-100/80 mt-1 max-w-xl leading-relaxed">
                                  {isAuthenticated 
                                    ? 'Get unlimited tender views, 1-click BOQ Excel downloads, and automated WhatsApp alerts for your preferred J&K departments & districts.'
                                    : 'Cards below are blurred for preview. Log in or create a free contractor account to unlock all active tenders, search across 20 districts, and download BOQs.'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto shrink-0">
                              {isAuthenticated ? (
                                <Button
                                  type="button"
                                  onClick={() => navigate('/pricing')}
                                  className="w-full sm:w-auto bg-chinarRed hover:bg-chinarRed/90 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg cursor-pointer"
                                >
                                  Upgrade to Pro (₹399)
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={() => handleRequestAuth({
                                    title: 'Sign In to View More Tenders',
                                    subtitle: 'Sign in to unlock all tender notices and view full details (5 views/24 hours).',
                                    redirectUrl: '/tenders'
                                  })}
                                  className="w-full sm:w-auto bg-chinarRed hover:bg-chinarRed/90 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg cursor-pointer"
                                >
                                  Log In to View More Tenders
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div 
                        onClick={() => {
                          if (isBlurredCard) {
                            if (!isAuthenticated) {
                              handleRequestAuth({
                                title: 'Sign In to View More Tenders',
                                subtitle: 'Sign in to unlock all tender notices and view full details.',
                                redirectUrl: '/tenders'
                              });
                            } else {
                              navigate('/pricing');
                            }
                            return;
                          }
                        }}
                        className={isBlurredCard ? 'cursor-pointer' : ''}
                      >
                        <TenderCard 
                          tender={tender} 
                          isBlurred={isBlurredCard}
                          onViewDetails={() => handleViewDetails(tender)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Standard Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl mt-6 shadow-xs gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Page <strong className="text-slate-800 dark:text-white font-mono">{currentPage}</strong> of <strong className="text-slate-800 dark:text-white font-mono">{totalPages}</strong>
                    {!isAuthenticated && <span className="ml-2 text-slate-400 dark:text-slate-500 font-normal">(Sign in for all pages)</span>}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}
                      className="px-2.5 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                    </Button>
                    
                    <div className="h-8 px-3 flex items-center justify-center bg-dalBlue text-white dark:bg-blue-600 rounded-lg text-xs font-mono font-bold shadow-xs border border-dalBlue dark:border-blue-500">
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
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  {status === 'archived' ? 'No Archived Notices Found' : status === 'expired' ? 'No Expired Notices Found' : 'No Matching Tender Notices'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {status === 'archived'
                    ? 'No notices currently awaiting bid opening or with download concluded match your filters.'
                    : status === 'expired'
                    ? 'No expired notices match your current filters.'
                    : 'Try clearing specific department, category, or district filters to broaden your search results.'}
                </p>
                <div className="pt-2">
                  <Button variant="outline" onClick={handleReset} className="text-xs hover:border-dalBlue">
                    Reset All Filters
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={authModalConfig.title}
        subtitle={authModalConfig.subtitle}
        redirectUrl={authModalConfig.redirectUrl}
      />
    </div>
  );
}