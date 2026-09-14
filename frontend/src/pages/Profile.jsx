/**
 * @file src/pages/Profile.jsx
 * @description Contractor workspace. Manages bookmarked tenders, company details, and AI preferences.
 */
import React, { useState } from 'react';
import { Building, Heart, Sliders, CheckCircle2 } from 'lucide-react';

import { useBookmarkStore } from '@/store/useBookmarkStore';
import { usePreferenceStore } from '@/store/usePreferenceStore';
import { TenderCard } from '@/components/shared/TenderCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('saved');
  const savedTenders = useBookmarkStore((state) => state.savedTenders);
  const { preferences } = usePreferenceStore();

  return (
    <div className="min-h-screen bg-paper py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-subtle mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-dalBlue text-white flex items-center justify-center font-bold text-xl shadow-md">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-dalBlue">Ravi Shankar</h1>
                <Badge variant="success" className="uppercase tracking-wider text-[9px] px-1.5 py-0.5">Verified</Badge>
              </div>
              <p className="text-xs font-medium text-charcoal/60 mt-0.5">Contractor ID: NIT-S-2026 • Associated with J&K Division</p>
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <span className="block text-[11px] text-charcoal/60 font-bold uppercase tracking-wider mb-1">Status</span>
            <span className="text-xs font-bold text-dalBlue flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-successGreen" /> Account Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border mb-8 gap-6 text-sm font-bold overflow-x-auto">
          {[
            { id: 'saved', icon: Heart, label: `Saved Tenders (${savedTenders.length})` },
            { id: 'company', icon: Building, label: 'Company Credentials' },
            { id: 'alerts', icon: Sliders, label: 'Filter Preferences' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'border-chinarRed text-chinarRed' : 'border-transparent text-charcoal/70 hover:text-dalBlue'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Saved Tenders */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {savedTenders.length > 0 ? (
              savedTenders.map((tender) => (
                <TenderCard key={tender._id || tender.sourceTenderId} tender={tender} />
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-border rounded-xl p-16 text-center shadow-sm">
                <Heart className="w-10 h-10 text-dalBlue/30 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-dalBlue mb-2">No Saved Tenders</h4>
                <p className="text-sm font-medium text-charcoal/60">Click the heart icon on any tender in the directory to pin it here.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Company Credentials */}
        {activeTab === 'company' && (
          <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-dalBlue">Registration Details</h3>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              {[
                { label: 'Legal Name', val: 'Ravi Shankar (Independent)' },
                { label: 'Primary Location', val: 'Uttar Pradesh, India' },
                { label: 'Academic / Technical Background', val: 'B.Tech IT, NIT Srinagar' },
                { label: 'Contact', val: 'Verified via Google' }
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal/50 mb-1.5">{field.label}</label>
                  <div className="w-full bg-paper border border-border rounded-lg p-3 font-semibold text-charcoal">
                    {field.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: AI Preferences */}
        {activeTab === 'alerts' && (
          <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-dalBlue">Active Engine Filters</h3>
              <Button variant="outline" size="sm">Update Preferences</Button>
            </div>
            <div className="space-y-5 text-sm">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-charcoal/50 mb-2">Target Work Categories</span>
                <div className="flex flex-wrap gap-2">
                  {preferences.targetSectors?.length > 0 ? (
                    preferences.targetSectors.map((sec, i) => <Badge key={i} variant="outline" className="px-3 py-1 bg-paper">{sec}</Badge>)
                  ) : <span className="font-semibold text-charcoal">None specified</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-charcoal/50 mb-1.5">Preferred Locations</span>
                  <div className="font-bold text-dalBlue">{preferences.preferredLocations?.join(', ') || 'All Regions'}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-charcoal/50 mb-1.5">Minimum Value</span>
                  <div className="font-bold text-dalBlue">₹{preferences.minTenderValue?.toLocaleString('en-IN') || '0'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}