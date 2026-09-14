/**
 * @file src/components/shared/PreferenceModal.jsx
 * @description Initial contractor intake modal utilizing the new custom Dialog primitives.
 */
import React, { useState } from 'react';
import { usePreferenceStore } from '@/store/usePreferenceStore';
import { Sliders, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PreferenceModal() {
  const { preferences, updatePreferences } = usePreferenceStore();

  const [sectors, setSectors] = useState(['Civil Works']);
  const [location, setLocation] = useState('Baramulla');
  const [minVal, setMinVal] = useState('200000');
  const [preferEmd, setPreferEmd] = useState(false);

  if (preferences.isConfigured) return null;

  const sectorOptions = [
    'Civil Works', 'Electrical Works', 'Pipes & Water Supply', 
    'Roads & Bridges', 'Information Technology', 'Mechanical Works'
  ];

  const toggleSector = (sec) => {
    setSectors(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updatePreferences({
      targetSectors: sectors,
      preferredLocations: location ? [location] : [],
      minTenderValue: Number(minVal) || 0,
      preferEmdExemption: preferEmd,
    });
  };

  return (
    <Dialog open={!preferences.isConfigured}>
      <DialogContent>
        <DialogHeader className="mb-6 flex flex-row items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-dalBlue/10 text-dalBlue flex items-center justify-center shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle>Tailor Your Tender Feed</DialogTitle>
            <DialogDescription>Configure your business scope to prioritize relevant bids.</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-charcoal mb-2 uppercase tracking-wide">Work Domains</label>
            <div className="flex flex-wrap gap-2">
              {sectorOptions.map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => toggleSector(sec)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                    sectors.includes(sec)
                      ? 'bg-dalBlue text-white border-dalBlue'
                      : 'bg-paper text-charcoal/70 border-border hover:border-dalBlue/40'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal mb-1 uppercase tracking-wide">Preferred District</label>
            <Input 
              value={location} onChange={(e) => setLocation(e.target.value)} 
              placeholder="e.g. Srinagar, Jammu" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal mb-1 uppercase tracking-wide">Minimum Contract Value (INR)</label>
            <Input 
              type="number" value={minVal} onChange={(e) => setMinVal(e.target.value)} 
              placeholder="e.g. 500000" 
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox" id="emdOpt" checked={preferEmd} onChange={(e) => setPreferEmd(e.target.checked)}
              className="w-4 h-4 rounded border-border text-dalBlue focus:ring-dalBlue"
            />
            <label htmlFor="emdOpt" className="text-xs text-charcoal font-bold cursor-pointer">
              Prioritize MSME / EMD Exempt tenders
            </label>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => updatePreferences({ isConfigured: true })}>
              Skip
            </Button>
            <Button type="submit" variant="default" className="bg-chinarRed hover:bg-chinarRed-800 gap-2">
              Apply Filters <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}