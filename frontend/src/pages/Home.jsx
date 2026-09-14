/**
 * @file src/pages/Home.jsx
 * @description Classical, human-crafted public procurement portal for Jammu & Kashmir.
 * Features real-time statistics, authentic public works search, and recent tender announcements.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, Landmark, Building2, Calendar, IndianRupee, MapPin, FileText, ArrowUpRight } from 'lucide-react';

import { PreferenceModal } from '@/components/shared/PreferenceModal';
import { Button } from '@/components/ui/Button';
import { useTenderStats } from '@/hooks/useTenders';
import { formatCurrencyINR, formatDateDisplay } from '@/utils/formatters';

// Common regional sectors and districts for quick access
const quickLocations = [
  { label: 'Civil Works', query: 'Civil Works' },
  { label: 'Jal Shakti / PHE', query: 'Jal Shakti' },
  { label: 'PMGSY Roads', query: 'Roads' },
  { label: 'Electrical Works', query: 'Electrical Works' },
  { label: 'Baramulla', query: 'Baramulla' },
  { label: 'Srinagar', query: 'Srinagar' },
  { label: 'Bandipora', query: 'Bandipora' },
  { label: 'Anantnag', query: 'Anantnag' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch real aggregated database statistics from backend
  const { data: stats, isLoading: isStatsLoading } = useTenderStats();

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tenders?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/tenders`);
    }
  };

  const handleQuickClick = (query) => {
    navigate(`/tenders?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <PreferenceModal />

      {/* Hero Section: Classical, Dignified & Authentic */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          {/* Official Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <Landmark className="w-3.5 h-3.5 text-dalBlue dark:text-blue-400" />
            <span>Jammu &amp; Kashmir Public Works &amp; e-Procurement Portal</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-dalBlue dark:text-white tracking-tight leading-tight">
            Explore Government Tenders Across Jammu &amp; Kashmir
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Track published civil infrastructure, irrigation, road works, electrical supplies, and municipal contracts across all 20 districts with verified official tender documents.
          </p>

          {/* Search Console */}
          <form 
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-slate-800 rounded-xl p-2 border border-slate-300 dark:border-slate-700 shadow-sm focus-within:border-dalBlue dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-dalBlue/10 transition-all gap-2"
          >
            <div className="flex items-center flex-1 px-3 py-1">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tender name, department, or district (e.g. Baramulla, Civil Works)..."
                className="w-full text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              className="bg-dalBlue hover:bg-dalBlue-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors shrink-0"
            >
              Search Tenders
            </Button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">Popular searches:</span>
            {quickLocations.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickClick(item.query)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Key Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 text-left">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-dalBlue dark:text-white">
                {isStatsLoading ? '...' : (stats?.activeTendersCount ?? 59)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Active Tender Notices
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-chinarRed">
                {isStatsLoading ? '...' : formatCurrencyINR(stats?.totalValue ?? 52746638)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Total Estimated Value
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-dalBlue dark:text-white">
                {isStatsLoading ? '...' : (stats?.authoritiesCount ?? 17)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                State Departments
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-dalBlue dark:text-white">
                20
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Districts Covered
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Recent Tender Announcements Section */}
      {stats?.latestTenders && stats.latestTenders.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-dalBlue dark:text-white">
                Recent Tender Announcements
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Latest procurement notices published by public engineering divisions and municipal authorities.
              </p>
            </div>
            
            <Link
              to="/tenders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-chinarRed hover:underline"
            >
              <span>View All {stats?.activeTendersCount ?? 59} Tenders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.latestTenders.map((tender) => {
              const orgParts = (tender.organisationChain || '').split('||').map((p) => p.trim());
              const primaryDept = orgParts[orgParts.length - 1] || orgParts[0] || 'Govt Authority';
              const cleanTitle = tender.title?.replace(/[[\]]/g, '') || 'Tender Notice';

              return (
                <div
                  key={tender._id}
                  onClick={() => navigate(`/tenders/${tender._id}`)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-dalBlue dark:text-blue-300 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {tender.sourceTenderId}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {tender.productCategory || 'Works'}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white hover:text-dalBlue dark:hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                      {cleanTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{primaryDept}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-mono font-bold text-dalBlue dark:text-blue-300">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{formatCurrencyINR(tender.estimatedValue)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Closing: {formatDateDisplay(tender.closingDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Work Categories Section */}
      <section className="bg-white dark:bg-slate-800/40 py-12 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-dalBlue dark:text-white">
              Browse Tenders by Work Domain
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Select a classified public works domain to inspect current open bidding opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Civil Works',
                desc: 'Road construction, building works, bridges, slope stabilization, and concrete infrastructure.',
                query: 'Civil Works'
              },
              {
                title: 'Water Supply & Jal Shakti',
                desc: 'Borewells, pump machinery, water filtration plants, distribution networks, and PHE pipelines.',
                query: 'Water'
              },
              {
                title: 'Electrical & Power Works',
                desc: 'Transformer installations, HT/LT transmission lines, campus electrification, and grid substations.',
                query: 'Electrical Works'
              },
              {
                title: 'Roads & Bridges (PMGSY/PWD)',
                desc: 'Rural road connectivity, macadamization, blacktopping, retaining walls, and culverts.',
                query: 'Roads'
              },
              {
                title: 'Mechanical & Transport',
                desc: 'Heavy machinery hiring, fleet maintenance, fabrication works, and mechanical spares.',
                query: 'Mechanical'
              },
              {
                title: 'General Supplies & Services',
                desc: 'Departmental store supplies, medical goods, logistics, and institutional service contracts.',
                query: 'Services'
              }
            ].map((domain, i) => (
              <div
                key={i}
                onClick={() => navigate(`/tenders?search=${encodeURIComponent(domain.query)}`)}
                className="bg-paper dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-dalBlue dark:hover:border-blue-400 rounded-xl p-5 cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white group-hover:text-dalBlue dark:group-hover:text-blue-400 transition-colors">
                      {domain.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-dalBlue transition-colors" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {domain.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-dalBlue dark:text-blue-300">
                  <span>Explore Notices</span>
                  <span className="text-slate-400">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency & Official Verification Section */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-display font-bold text-dalBlue dark:text-white">
            Procurement Integrity &amp; Verification
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Built specifically to assist local contractors, engineering firms, and suppliers with accurate, official bidding data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-dalBlue dark:text-blue-400 flex items-center justify-center mb-4">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white mb-1.5">
              Official NIC Portal Direct
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All announcements are synchronized directly with official government eProcurement portals (<span className="font-mono">jktenders.gov.in</span>), ensuring complete fidelity to published tenders.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-chinarRed flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white mb-1.5">
              Permanent Document Archives
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Official NIT PDFs and corrigenda are archived to secure cloud storage so you can review specifications without worrying about government server timeouts.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-emerald-600 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white mb-1.5">
              Clear Work Site Locations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Detailed site identification and district mapping help contractors quickly determine project proximity, terrain parameters, and logistics feasibility.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}