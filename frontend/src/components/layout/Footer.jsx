/**
 * @file src/components/layout/Footer.jsx
 * @description Official platform footer containing navigation links, legal disclaimers,
 * and contact information for the regional operations desk.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dalBlue text-white pt-16 pb-8 border-t-[6px] border-chinarRed mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand & Description */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-dalBlue" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">TenderHub</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-medium">
            AI-powered procurement intelligence. We automate the discovery, tracking, and analysis of government tenders to help contractors bid smarter and faster.
          </p>
        </div>

        {/* Monitored Sources */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-warningGold mb-5">Data Sources</h4>
          <ul className="space-y-3 text-sm text-white/80 font-medium">
            <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              J&K E-Tenders <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </li>
            <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              CPPP Portal <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </li>
            <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              GeM India <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </li>
          </ul>
        </div>

        {/* Internal Navigation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-warningGold mb-5">Quick Links</h4>
          <ul className="space-y-3 text-sm text-white/80 font-medium">
            <li><Link to="/tenders" className="hover:text-white transition-colors">Tender Directory</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Subscription Plans</Link></li>
            <li><Link to="/profile" className="hover:text-white transition-colors">Saved Workspaces</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">Platform Architecture</Link></li>
          </ul>
        </div>

        {/* Contact & Region */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-warningGold mb-5">Operations Desk</h4>
          <div className="flex items-start gap-3 text-sm text-white/80 font-medium">
            <MapPin className="w-5 h-5 text-chinarRed shrink-0 mt-0.5" />
            <span>NIT Campus, Hazratbal,<br />Srinagar, J&K 190006</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/80 font-medium">
            <Mail className="w-5 h-5 text-chinarRed shrink-0" />
            <span>enterprise@tenderhub.in</span>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 font-medium gap-4">
        <p>&copy; {new Date().getFullYear()} TenderHub Intelligence. All official tender documents are copyright of their respective issuing departments.</p>
        <div className="flex gap-6">
          <span className="cursor-pointer hover:text-white">Terms of Service</span>
          <span className="cursor-pointer hover:text-white">Privacy Policy</span>
        </div>
      </div>
    </footer>
  );
}