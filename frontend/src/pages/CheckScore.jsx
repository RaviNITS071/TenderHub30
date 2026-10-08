/**
 * @file frontend/src/pages/CheckScore.jsx
 * @description Bid Allocation Probability & Capacity Scoring Engine for Jammu & Kashmir Tenders.
 * Enforces authentication, captures contractor metrics on-demand, stores them in MongoDB,
 * and provides historical reference tracking.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Building2, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Sparkles, 
  History, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';

import { useAuthStore } from '@/store/useAuthStore';
import { bidScoreApi } from '@/services/bidScoreApi';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreSpeedometer } from '@/components/shared/ScoreSpeedometer';

export default function CheckScore() {
  const { tenderId: paramTenderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isPro } = useAuthStore();

  // State
  const [selectedTender, setSelectedTender] = useState(null);
  const [availableTenders, setAvailableTenders] = useState([]);
  const [tenderSearchTerm, setTenderSearchTerm] = useState('');
  const [manualTenderInput, setManualTenderInput] = useState(paramTenderId || '');
  const [isLoadingTender, setIsLoadingTender] = useState(false);

  // Form Fields (Contractor Metrics)
  const [registrationClass, setRegistrationClass] = useState('Class A Works');
  const [maxAnnualTurnover, setMaxAnnualTurnover] = useState('');
  const [ongoingCommitments, setOngoingCommitments] = useState('');
  const [largestSimilarWork, setLargestSimilarWork] = useState('');
  const [proposedQuotePercentage, setProposedQuotePercentage] = useState('-7.5');
  const [hasMachineryEquipment, setHasMachineryEquipment] = useState(true);
  const [hasValidGstClearance, setHasValidGstClearance] = useState(true);
  const [hasRegistrationCardRenewal, setHasRegistrationCardRenewal] = useState(true);
  const [hasActiveCdrFdrFacility, setHasActiveCdrFdrFacility] = useState(true);
  const [saveAsDefaultProfile, setSaveAsDefaultProfile] = useState(true);

  // Outcome & History
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'history'
  const [errorMessage, setErrorMessage] = useState('');
  const resultsRef = useRef(null);

  // 1. Fetch saved contractor metrics & history on load (if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadSavedMetrics = async () => {
      try {
        const metricsData = await bidScoreApi.getMetrics();
        if (metricsData) {
          if (metricsData.registrationClass) setRegistrationClass(metricsData.registrationClass);
          const f = metricsData.financialMetrics;
          if (f) {
            if (f.maxAnnualTurnover) setMaxAnnualTurnover(String(f.maxAnnualTurnover));
            if (f.ongoingCommitments) setOngoingCommitments(String(f.ongoingCommitments));
            if (f.largestSimilarWork) setLargestSimilarWork(String(f.largestSimilarWork));
            if (f.hasMachineryEquipment !== undefined) setHasMachineryEquipment(f.hasMachineryEquipment);
            if (f.hasValidGstClearance !== undefined) setHasValidGstClearance(f.hasValidGstClearance);
            if (f.hasRegistrationCardRenewal !== undefined) setHasRegistrationCardRenewal(f.hasRegistrationCardRenewal);
            if (f.hasActiveCdrFdrFacility !== undefined) setHasActiveCdrFdrFacility(f.hasActiveCdrFdrFacility);
          }
        }
      } catch (err) {
        console.error('Failed to load saved metrics:', err);
      }
    };

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const historyData = await bidScoreApi.getHistory();
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadSavedMetrics();
    loadHistory();
  }, [isAuthenticated]);

  // 2. Fetch tender candidates for dropdown
  useEffect(() => {
    const fetchRecentTenders = async () => {
      try {
        const res = await api.get('/tenders?limit=20');
        const list = res.data?.data?.tenders || res.data?.data || res.data?.tenders || [];
        setAvailableTenders(list);
      } catch (err) {
        console.error('Failed to fetch tenders list:', err);
      }
    };
    fetchRecentTenders();
  }, []);

  // 3. Load target tender if tenderId exists in URL
  useEffect(() => {
    const targetId = paramTenderId || manualTenderInput;
    if (!targetId) return;

    const fetchTargetTender = async () => {
      setIsLoadingTender(true);
      setErrorMessage('');
      try {
        const res = await api.get(`/tenders/${targetId}`);
        const found = res.data?.data || res.data;
        if (found) {
          setSelectedTender(found);
          setManualTenderInput(found.sourceTenderId || found._id);
        }
      } catch (err) {
        // Fallback: search in loaded tenders
        const match = availableTenders.find(t => t._id === targetId || t.sourceTenderId === targetId);
        if (match) {
          setSelectedTender(match);
        }
      } finally {
        setIsLoadingTender(false);
      }
    };

    fetchTargetTender();
  }, [paramTenderId, availableTenders]);

  // Select tender handler
  const handleSelectTender = (tender) => {
    setSelectedTender(tender);
    setManualTenderInput(tender.sourceTenderId || tender._id);
    setErrorMessage('');
  };

  // Run evaluation
  const handleCalculateScore = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    if (!selectedTender) {
      setErrorMessage('Please select or search for a target Jammu & Kashmir tender first.');
      return;
    }

    // Scroll smoothly to top / meter position so the user immediately watches the moving animation
    setTimeout(() => {
      if (resultsRef.current && window.innerWidth < 1024) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 40);

    setIsEvaluating(true);
    setErrorMessage('');

    try {
      const payload = {
        tenderId: selectedTender._id || selectedTender.sourceTenderId,
        maxAnnualTurnover: Number(maxAnnualTurnover) || 0,
        ongoingCommitments: Number(ongoingCommitments) || 0,
        largestSimilarWork: Number(largestSimilarWork) || 0,
        proposedQuotePercentage: Number(proposedQuotePercentage) || -5.0,
        registrationClass,
        hasMachineryEquipment,
        hasValidGstClearance,
        hasRegistrationCardRenewal,
        hasActiveCdrFdrFacility,
        saveAsDefaultProfile,
      };

      const response = await bidScoreApi.evaluateScore(payload);
      if (response.success && response.data) {
        setEvaluationResult(response.data);
        // Refresh history
        const refreshedHistory = await bidScoreApi.getHistory();
        setHistory(refreshedHistory);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to calculate bid score. Please check your inputs.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this evaluated contract from your history?')) return;
    try {
      await bidScoreApi.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item._id !== id));
      if (evaluationResult?.evaluationId === id) {
        setEvaluationResult(null);
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  // Helper format currency
  const formatINR = (val) => {
    if (!val || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // If user is not logged in: Show Institutional Auth-Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-dalBlue/10 dark:bg-blue-500/20 text-dalBlue dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-chinarRed font-mono">
              Authentication Required
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white">
              Bid Allocation Probability &amp; Capacity Check
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              To calculate CPWD / J&amp;K PWD Assessed Bid Capacity, Two-Cover statutory eligibility, and contract allocation odds, please log in with your verified Contractor Account.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 max-w-lg mx-auto text-left space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>J&amp;K PWD Formula: Assessed Capacity = (A &times; N &times; 2) &minus; B</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Two-Cover Technical Gatekeeper (Class, CDR, GST, Turnover)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Additional Performance Security (APS) Warnings for quotes below -15%</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Saves evaluations permanently into your Contractor Profile</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate(`/login?redirect=${encodeURIComponent('/check-score')}`)}
              className="w-full sm:w-auto px-6 py-2.5 bg-dalBlue hover:bg-dalBlue/90 text-white font-bold text-xs shadow-md"
            >
              Sign In to Contractor Workspace
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              onClick={() => navigate(`/signup?redirect=${encodeURIComponent('/check-score')}`)}
              variant="outline"
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold"
            >
              Register New Contractor Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-chinarRed font-mono uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>J&amp;K e-Procurement Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mt-1">
            Bid Allocation Probability &amp; Score
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Evaluate your assessed bid capacity, mandatory Two-Cover qualifications, and L1 winning probabilities for Jammu &amp; Kashmir tenders.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'calculator'
                ? 'bg-white dark:bg-slate-900 text-dalBlue dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Check Score
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-dalBlue dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Evaluated Bids ({history.length})</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: CALCULATOR & RESULT VIEW */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: TENDER SELECTION & CONTRACTOR FORM (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1: Select Target Contract */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-dalBlue dark:text-blue-300">
                  Step 1: Select Target Tender
                </span>
                {selectedTender && (
                  <button 
                    onClick={() => setSelectedTender(null)}
                    className="text-[11px] font-bold text-chinarRed hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              {selectedTender ? (
                <div className="bg-slate-50 dark:bg-slate-900/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-dalBlue/10 dark:bg-blue-500/20 text-dalBlue dark:text-blue-300">
                      ID: {selectedTender.sourceTenderId}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(selectedTender.estimatedValue)}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {selectedTender.title?.replace(/[[\]]/g, '')}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400">Dept</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate block">
                        {selectedTender.departmentName || selectedTender.organisationChain || 'J&K PWD'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400">Class</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {selectedTender.tendererClass || 'Class B/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Quick Select from Recent Tenders */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pick from Active J&amp;K Tenders:
                    </label>
                    <select
                      onChange={(e) => {
                        const tender = availableTenders.find(t => t._id === e.target.value || t.sourceTenderId === e.target.value);
                        if (tender) handleSelectTender(tender);
                      }}
                      defaultValue=""
                      className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-dalBlue"
                    >
                      <option value="" disabled>-- Select a recent tender --</option>
                      {availableTenders.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.sourceTenderId} • {t.title?.slice(0, 45)}... ({formatINR(t.estimatedValue)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <span className="bg-white dark:bg-slate-800 px-2 text-[10px] font-bold text-slate-400 uppercase">OR enter tender ID</span>
                    <div className="absolute inset-x-0 h-px bg-slate-200 dark:border-slate-700 -z-10" />
                  </div>

                  {/* Manual Tender ID Lookup */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 2026_APD_321986_1"
                      value={manualTenderInput}
                      onChange={(e) => setManualTenderInput(e.target.value)}
                      className="flex-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!manualTenderInput) return;
                        setIsLoadingTender(true);
                        try {
                          const res = await api.get(`/tenders/${manualTenderInput.trim()}`);
                          const found = res.data?.data || res.data;
                          if (found) setSelectedTender(found);
                        } catch {
                          setErrorMessage('Tender ID not found in database. Please check the ID or select from the list.');
                        } finally {
                          setIsLoadingTender(false);
                        }
                      }}
                      className="text-xs px-3 py-2"
                    >
                      {isLoadingTender ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Contractor Financial & Bidding Inputs */}
            <form onSubmit={handleCalculateScore} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-dalBlue dark:text-blue-300 block">
                Step 2: Contractor Credentials &amp; Bidding Quote
              </span>

              {/* Registration Class */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contractor Registration Class (J&amp;K PWD / CPWD):
                </label>
                <select
                  value={registrationClass}
                  onChange={(e) => setRegistrationClass(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  <option value="Class Special">Class Special / Super Class (Unlimited Value)</option>
                  <option value="Class A Works">Class A Works (Up to ₹10.0+ Crores)</option>
                  <option value="Class B Works">Class B Works (Up to ₹2.5 Crores)</option>
                  <option value="Class C Works">Class C Works (Up to ₹1.0 Crore)</option>
                  <option value="Class D Works">Class D Works (Up to ₹25 Lakhs)</option>
                </select>
              </div>

              {/* Max Annual Turnover (A) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Max Annual Civil Turnover in last 5 yrs (A):
                  </label>
                  <span className="text-[11px] font-mono font-bold text-dalBlue dark:text-blue-300">
                    {formatINR(maxAnnualTurnover)}
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 15000000 (1.5 Cr)"
                  value={maxAnnualTurnover}
                  onChange={(e) => setMaxAnnualTurnover(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">Peak turnover in any 1 FY among last 5 financial years</span>
              </div>

              {/* Ongoing Commitments (B) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ongoing Commitments during contract period (B):
                  </label>
                  <span className="text-[11px] font-mono font-bold text-dalBlue dark:text-blue-300">
                    {formatINR(ongoingCommitments)}
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 5000000 (50 Lakhs)"
                  value={ongoingCommitments}
                  onChange={(e) => setOngoingCommitments(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">Existing works in hand to complete during this contract period</span>
              </div>

              {/* Single Largest Similar Work */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Single Largest Completed Similar Work:
                  </label>
                  <span className="text-[11px] font-mono font-bold text-dalBlue dark:text-blue-300">
                    {formatINR(largestSimilarWork)}
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 8000000 (80 Lakhs)"
                  value={largestSimilarWork}
                  onChange={(e) => setLargestSimilarWork(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">Must be verified by completion certificate from Executive Engineer</span>
              </div>

              {/* Proposed Quoting Rate */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Proposed Bidding Rate (% vs Advertised SSR):
                  </label>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                    Number(proposedQuotePercentage) < -15 
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : Number(proposedQuotePercentage) <= -5
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  }`}>
                    {proposedQuotePercentage}%
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="-7.5"
                  value={proposedQuotePercentage}
                  onChange={(e) => setProposedQuotePercentage(e.target.value)}
                  className="w-full text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
                  required
                />
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>• <strong>-5% to -14.9%:</strong> Standard winning band in J&amp;K.</p>
                  <p>• <strong>Below -15%:</strong> Triggers mandatory Additional Performance Security (APS).</p>
                </div>
              </div>

              {/* Statutory Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRegistrationCardRenewal}
                    onChange={(e) => setHasRegistrationCardRenewal(e.target.checked)}
                    className="rounded border-slate-300 text-dalBlue focus:ring-dalBlue"
                  />
                  <span>Registration Card renewed for current Financial Year</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasValidGstClearance}
                    onChange={(e) => setHasValidGstClearance(e.target.checked)}
                    className="rounded border-slate-300 text-dalBlue focus:ring-dalBlue"
                  />
                  <span>Latest GSTR-3B filed &amp; Tax clearance ready</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasActiveCdrFdrFacility}
                    onChange={(e) => setHasActiveCdrFdrFacility(e.target.checked)}
                    className="rounded border-slate-300 text-dalBlue focus:ring-dalBlue"
                  />
                  <span>CDR / FDR pledged to Executive Engineer ready</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMachineryEquipment}
                    onChange={(e) => setHasMachineryEquipment(e.target.checked)}
                    className="rounded border-slate-300 text-dalBlue focus:ring-dalBlue"
                  />
                  <span>Machinery, Tippers, Vibratory Rollers / Plant available</span>
                </label>
              </div>

              {/* Save to Profile Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsDefaultProfile}
                    onChange={(e) => setSaveAsDefaultProfile(e.target.checked)}
                    className="rounded border-slate-300 text-dalBlue"
                  />
                  <span>Save/Update baseline metrics in my profile for future checks</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isEvaluating}
                className="w-full py-3 bg-dalBlue hover:bg-dalBlue/90 text-white font-bold text-xs shadow-md mt-2 flex items-center justify-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating Bid Capacity &amp; Allocation Odds...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span>Calculate Bid Score &amp; Save Outcome</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* RIGHT COLUMN: EVALUATION RESULTS DASHBOARD (7 cols) */}
          <div ref={resultsRef} className="lg:col-span-7">
            {isEvaluating && !evaluationResult ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
                <ScoreSpeedometer
                  score={50}
                  maxScore={100}
                  label="EVALUATING BID ALLOCATION ODDS..."
                  probability="Analyzing"
                  subtext={`Analyzing tender ${selectedTender?.sourceTenderId || ''} against J&K PWD formula`}
                  isCalculating={true}
                />
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Computing Assessed Bid Capacity (A &times; N &times; 2 &minus; B) &amp; L1 Quoting Margin...</span>
                </div>
              </div>
            ) : evaluationResult ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Animated Speedometer / Gauge (Credit-score style) */}
                <div className="space-y-4">
                  <ScoreSpeedometer
                    score={evaluationResult.results.totalScore}
                    maxScore={100}
                    label="CHECK YOUR BID SCORE"
                    probability={evaluationResult.results.allocationProbability}
                    subtext={`Evaluated for NIT: ${evaluationResult.tender.sourceTenderId}`}
                    isCalculating={isEvaluating}
                  />

                  {/* Tender Snapshot & Cover 1 Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Target Contract
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {evaluationResult.tender.title?.replace(/[[\]]/g, '')}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {evaluationResult.tender.departmentName || 'J&K PWD'} • Class {evaluationResult.inputs?.registrationClass}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Cover 1 Gatekeeper
                      </span>
                      <span className={`text-xs font-black inline-flex items-center gap-1.5 mt-0.5 ${
                        evaluationResult.results.isCover1Eligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {evaluationResult.results.isCover1Eligible ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Technically Responsive</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Disqualification Risk</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CPWD/PWD Bid Capacity Metric Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessed Capacity</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                      {formatINR(evaluationResult.results.assessedBidCapacity)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">(A &times; N &times; 2) &minus; B</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tender Value</span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                      {formatINR(evaluationResult.tender.estimatedValue)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Advertised Cost</span>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    evaluationResult.results.bidCapacitySurplus >= 0
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300'
                  }`}>
                    <span className="text-[10px] uppercase font-bold block">
                      {evaluationResult.results.bidCapacitySurplus >= 0 ? 'Capacity Surplus' : 'Capacity Deficit'}
                    </span>
                    <span className="text-sm font-black font-mono">
                      {formatINR(Math.abs(evaluationResult.results.bidCapacitySurplus))}
                    </span>
                    <span className="text-[9px] block">
                      {evaluationResult.results.bidCapacitySurplus >= 0 ? 'Eligible to Bid' : 'Deficit Disqualification'}
                    </span>
                  </div>
                </div>

                {/* 4 Pillars Scoring Meters */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    4-Pillar Evaluation Breakdown
                  </h3>

                  <div className="space-y-2.5">
                    {/* Pillar 1 */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 dark:text-slate-200">1. Assessed Bid Capacity &amp; Turnover</span>
                        <span className="font-mono text-dalBlue dark:text-blue-300 font-bold">
                          {evaluationResult.results.categoryScores.bidCapacityScore} / 30
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-dalBlue h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(evaluationResult.results.categoryScores.bidCapacityScore / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Pillar 2 */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 dark:text-slate-200">2. Technical Experience &amp; Class Match</span>
                        <span className="font-mono text-dalBlue dark:text-blue-300 font-bold">
                          {evaluationResult.results.categoryScores.technicalExperienceScore} / 25
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(evaluationResult.results.categoryScores.technicalExperienceScore / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Pillar 3 */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 dark:text-slate-200">3. Pricing Strategy &amp; L1 Corridor</span>
                        <span className="font-mono text-dalBlue dark:text-blue-300 font-bold">
                          {evaluationResult.results.categoryScores.pricingCompetitivenessScore} / 25
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(evaluationResult.results.categoryScores.pricingCompetitivenessScore / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Pillar 4 */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-700 dark:text-slate-200">4. Statutory J&amp;K Compliance (CDR, GST, Card)</span>
                        <span className="font-mono text-dalBlue dark:text-blue-300 font-bold">
                          {evaluationResult.results.categoryScores.statutoryComplianceScore} / 20
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(evaluationResult.results.categoryScores.statutoryComplianceScore / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Flags */}
                {evaluationResult.results.riskFlags && evaluationResult.results.riskFlags.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Critical Risk Flags &amp; APS Notifications</span>
                    </div>
                    <ul className="text-xs text-amber-900/80 dark:text-amber-200/90 space-y-1.5 pl-6 list-disc">
                      {evaluationResult.results.riskFlags.map((flag, idx) => (
                        <li key={idx} className="leading-relaxed">{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actionable Insights */}
                {evaluationResult.results.actionableInsights && evaluationResult.results.actionableInsights.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Strategic Recommendations</span>
                    </div>
                    <ul className="text-xs text-emerald-900/80 dark:text-emerald-200/90 space-y-1.5 pl-6 list-disc">
                      {evaluationResult.results.actionableInsights.map((ins, idx) => (
                        <li key={idx} className="leading-relaxed">{ins}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* J&K Submission Checklist */}
                {evaluationResult.results.jkSpecificGuidelines && evaluationResult.results.jkSpecificGuidelines.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-dalBlue dark:text-blue-400" />
                      <span>J&amp;K e-Procurement Portal Compliance Checklist</span>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pl-6 list-disc">
                      {evaluationResult.results.jkSpecificGuidelines.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Link to Tender */}
                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/tenders/${evaluationResult.tender.sourceTenderId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-dalBlue dark:text-blue-300 hover:underline"
                  >
                    <span>View Full Tender Notice &amp; Documents</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ) : (
              /* Empty Placeholder State */
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Calculator className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Score Evaluated Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Select a target Jammu &amp; Kashmir tender, enter your baseline turnover and quote rate, then click <strong>Calculate Bid Score</strong> to view your detailed probability breakdown.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: EVALUATED BIDS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                My Evaluated Bids &amp; Saved History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All contract-specific evaluations saved in your contractor profile for future review.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {history.length} Record(s)
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 flex justify-center items-center gap-2 text-xs font-semibold text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading your saved bid evaluations...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">No evaluations recorded yet. Run your first check on any tender.</p>
              <Button onClick={() => setActiveTab('calculator')} className="text-xs font-bold">
                Run a Bid Check Now
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => {
                    setEvaluationResult({
                      evaluationId: item._id,
                      tender: item.tenderSnapshot,
                      inputs: item.inputs,
                      results: item.results,
                    });
                    setActiveTab('calculator');
                  }}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 p-3 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-dalBlue dark:text-blue-300 border border-slate-200 dark:border-slate-700">
                        {item.tenderSnapshot?.sourceTenderId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-lg group-hover:text-dalBlue dark:group-hover:text-blue-400">
                      {item.tenderSnapshot?.title?.replace(/[[\]]/g, '')}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Value: <strong>{formatINR(item.tenderSnapshot?.estimatedValue)}</strong></span>
                      <span>Quote: <strong>{item.inputs?.proposedQuotePercentage}%</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white block font-mono">
                        {item.results?.totalScore} / 100
                      </span>
                      <Badge
                        variant={
                          item.results?.allocationProbability === 'High' ? 'success' :
                          item.results?.allocationProbability === 'Moderate' ? 'warning' :
                          'destructive'
                        }
                        className="text-[10px] px-2 py-0.5"
                      >
                        {item.results?.allocationProbability}
                      </Badge>
                    </div>

                    <button
                      onClick={(e) => handleDeleteHistory(item._id, e)}
                      title="Delete from history"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
