/**
 * @file src/pages/About.jsx
 * @description Educational page detailing the platform's mission and engineering standards.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Cpu, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function About() {
  return (
    <div className="min-h-screen bg-paper py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <div className="bg-white border border-border rounded-2xl p-8 sm:p-12 shadow-subtle space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-dalBlue/10 text-dalBlue text-xs font-bold uppercase tracking-wider">
            Our Mission
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dalBlue tracking-tight">
            Democratizing Public Procurement
          </h1>
          <p className="text-base text-charcoal/80 leading-relaxed font-medium">
            Public sector tenders represent immense infrastructural development, yet discovering them remains bogged down by outdated portal interfaces and unindexed scanned PDFs.
          </p>
          <p className="text-base text-charcoal/80 leading-relaxed font-medium">
            TenderHub was established to solve this. By uniting Playwright-driven government scrapers with deep OCR and OpenAI analysis, we transform messy NIT announcements into structured intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-xl p-8 shadow-subtle">
            <Database className="w-8 h-8 text-dalBlue mb-4" />
            <h3 className="text-lg font-bold text-dalBlue mb-2">Complete Verification</h3>
            <p className="text-sm text-charcoal/70 leading-relaxed font-medium">
              We never fabricate summaries. Every tender links directly back to its source ID and official portal.
            </p>
          </div>
          <div className="bg-white border border-border rounded-xl p-8 shadow-subtle">
            <Cpu className="w-8 h-8 text-chinarRed mb-4" />
            <h3 className="text-lg font-bold text-dalBlue mb-2">Deterministic Scoring</h3>
            <p className="text-sm text-charcoal/70 leading-relaxed font-medium">
              We match contractors using mathematical formulas based on project scale and past experience requirements.
            </p>
          </div>
        </div>

        <div className="bg-dalBlue text-white rounded-2xl p-10 text-center shadow-md">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Streamline your bidding operations today.</h2>
          <Link to="/tenders">
            <Button variant="destructive" size="lg" className="gap-2 text-sm mt-2">
              Browse Open Tenders <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}