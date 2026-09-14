/**
 * @file src/pages/Profile.jsx
 * @description Contractor workspace. Manages bookmarked tenders, contractor credentials, and filter preferences.
 */
import { useState } from 'react';
import { Building, Heart, Sliders, CheckCircle2, Shield, MapPin, FolderArchive, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useBookmarkStore } from '@/store/useBookmarkStore';
import { usePreferenceStore } from '@/store/usePreferenceStore';
import { TenderCard } from '@/components/shared/TenderCard';
import { Button } from '@/components/ui/Button';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('saved');
  const savedTenders = useBookmarkStore((state) => state.savedTenders);
  const { preferences } = usePreferenceStore();

  const tabs = [
    { id: 'saved', icon: Heart, label: `Saved Tenders (${savedTenders.length})` },
    { id: 'company', icon: Building, label: 'Contractor Profile' },
    { id: 'alerts', icon: Sliders, label: 'Filter Preferences' }
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Contractor Profile Header Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-dalBlue text-white flex items-center justify-center font-display font-bold text-xl shadow-xs shrink-0">
              RS
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
                  Ravi Shankar
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <Shield className="w-3 h-3 fill-current" /> Verified Contractor
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  ID: NIT-S-2026
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-chinarRed" /> J&amp;K Public Works Division
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Saved Tenders
              </span>
              <span className="text-2xl font-bold font-mono text-dalBlue dark:text-white">
                {savedTenders.length}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Status
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold overflow-x-auto pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-dalBlue dark:border-blue-400 text-dalBlue dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Saved Tenders */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {savedTenders.length > 0 ? (
              <div className="space-y-4">
                {savedTenders.map((tender) => (
                  <TenderCard key={tender._id || tender.sourceTenderId} tender={tender} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-xs max-w-xl mx-auto">
                <FolderArchive className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white font-display mb-1">
                  No Saved Tenders
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
                  Click the heart icon on any tender in the directory to bookmark it here for quick tracking.
                </p>
                <Link to="/tenders">
                  <Button className="gap-2 bg-dalBlue hover:bg-dalBlue-700 text-white text-xs font-bold py-2">
                    Browse Tenders <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Contractor Credentials */}
        {activeTab === 'company' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-7 space-y-5 max-w-3xl shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Contractor Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered contractor information on the platform
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs">Edit</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              {[
                { label: 'Name / Contractor Entity', val: 'Ravi Shankar' },
                { label: 'Primary Jurisdiction', val: 'Jammu & Kashmir / North Zone' },
                { label: 'Affiliation / Division', val: 'NIT Srinagar, J&K' },
                { label: 'Account Authentication', val: 'Google Verified' },
                { label: 'Contractor Registration Class', val: 'Class A Works' },
                { label: 'Portal Verification', val: 'Active • L1 Compliant' }
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {field.label}
                  </label>
                  <div className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
                    {field.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Filter Preferences */}
        {activeTab === 'alerts' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 sm:p-7 space-y-5 max-w-3xl shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Preferred Tender Filters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Default parameters applied when browsing the directory
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs">Update</Button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Target Work Categories
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.targetSectors?.length > 0 ? (
                    preferences.targetSectors.map((sec, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {sec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">All categories active</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Preferred Location
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    {preferences.preferredLocations?.join(', ') || 'All 20 Districts'}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Minimum Value
                  </span>
                  <div className="font-mono font-bold text-dalBlue dark:text-blue-300 text-xs sm:text-sm">
                    ₹{preferences.minTenderValue?.toLocaleString('en-IN') || '0'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}