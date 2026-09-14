/**
 * @file src/pages/Home.jsx
 * @description High-conversion animated landing page with an infinite scrolling carousel,
 * Framer Motion reveal effects, and full dark mode support.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { PreferenceModal } from '@/components/shared/PreferenceModal';
import { Button } from '@/components/ui/Button';

// Animation variants for smooth reveal effects
const fadeUp = { 
  hidden: { opacity: 0, y: 30 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } 
};
const staggerContainer = { 
  visible: { transition: { staggerChildren: 0.15 } } 
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tenders?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/tenders`);
    }
  };

  const domainCards = [
    { title: 'Civil Works', count: '450+ Active', desc: 'Buildings, highways, bridges, and structural upgrades.' },
    { title: 'Jal Shakti', count: '180+ Active', desc: 'Pipes, filtration infrastructure, and deep borewell drilling.' },
    { title: 'IT & Electronics', count: '90+ Active', desc: 'Government server deployment, CCTV setups, and e-governance.' },
    { title: 'Power Distribution', count: '120+ Active', desc: 'Substation maintenance, transformer supply, and solar.' },
  ];

  // Duplicate cards to create a seamless infinite loop for the carousel
  const carouselItems = [...domainCards, ...domainCards];

  return (
    <div className="min-h-screen bg-paper dark:bg-[#0f172a] text-charcoal dark:text-slate-200 transition-colors duration-300 overflow-hidden">
      {/* Onboarding Modal */}
      <PreferenceModal />

      {/* Hero Section */}
      <section className="bg-dalBlue dark:bg-[#081e30] text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8 relative shadow-sm transition-colors duration-300">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-chinarRed/15 blur-3xl pointer-events-none" />
        <div className="absolute left-10 bottom-0 w-80 h-80 rounded-full bg-warningGold/10 blur-3xl pointer-events-none" />

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center space-y-6 relative z-10"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/90">
            <span className="w-2 h-2 rounded-full bg-successGreen animate-pulse" /> Real-time Sync Active: J&K Tenders & CPPP
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Bid Faster. Win Smarter with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-chinarRed to-warningGold">
              Tender Intelligence
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto font-medium">
            TenderHub extracts complex NIT specifications and summarizes BOQ requirements instantly, delivering matching opportunities straight to your dashboard.
          </motion.p>

          {/* Quick Search */}
          <motion.form variants={fadeUp} onSubmit={handleHeroSearch} className="max-w-2xl mx-auto mt-8 flex items-center bg-white dark:bg-[#1e293b] rounded-xl p-2 shadow-2xl focus-within:ring-2 focus-within:ring-chinarRed/50 transition-all">
            <Search className="w-5 h-5 text-charcoal/40 dark:text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, department, or district..."
              className="w-full px-3 py-2 text-sm text-charcoal dark:text-slate-200 focus:outline-none placeholder:text-charcoal/40 dark:placeholder:text-slate-500 bg-transparent"
            />
            <Button type="submit" variant="destructive" className="px-6 py-3 whitespace-nowrap gap-1.5 h-auto">
              Find Tenders <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.form>

          {/* KPI Bar */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-white/10 max-w-3xl mx-auto text-left mt-8">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">8,400+</div>
              <div className="text-xs text-white/60 font-bold uppercase tracking-wider">Tenders Indexed</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-warningGold">₹1,240 Cr</div>
              <div className="text-xs text-white/60 font-bold uppercase tracking-wider">Active Pipeline</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-white/60 font-bold uppercase tracking-wider">Official Grounding</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-chinarRed">Insta-Match</div>
              <div className="text-xs text-white/60 font-bold uppercase tracking-wider">Eligibility Engine</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="text-3xl font-bold text-dalBlue dark:text-blue-400 tracking-tight">Built for High-Stakes Contractors</h2>
          <p className="text-sm text-charcoal/70 dark:text-slate-400 mt-2 font-medium">Every tool is designed to reduce the overhead between tender publication and bid submission.</p>
        </motion.div>

        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { icon: Database, color: "text-dalBlue dark:text-blue-400", bg: "bg-dalBlue/10 dark:bg-blue-400/10", title: "Automated Aggregation", desc: "Background workers continuously query portals, handling multi-tier pagination and corrigendum updates in real-time.", tick: "No missed addendums" },
            { icon: Cpu, color: "text-chinarRed dark:text-red-400", bg: "bg-chinarRed/10 dark:bg-red-400/10", title: "AI Document Parsing", desc: "Our OpenAI pipelines scan dense 80-page NIT PDFs, extracting required turnover, past experience, and EMD structures.", tick: "Instant eligibility checks" },
            { icon: ShieldCheck, color: "text-warningGold", bg: "bg-warningGold/10", title: "Contractor Matching", desc: "Input your license grade, geographic footprint, and capacity. TenderHub filters out tenders outside your operational reach.", tick: "High-probability bidding" }
          ].map((feat, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white dark:bg-[#1e293b] border border-border dark:border-slate-700 rounded-2xl p-7 shadow-subtle flex flex-col justify-between hover:shadow-card transition-shadow">
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feat.bg} ${feat.color}`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-charcoal dark:text-slate-100 mb-2">{feat.title}</h3>
                <p className="text-sm text-charcoal/70 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-dalBlue dark:text-blue-400">
                <CheckCircle2 className="w-4 h-4 text-successGreen" /> {feat.tick}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Animated Infinite Carousel Section */}
      <section className="bg-white dark:bg-[#1e293b] py-20 border-y border-border dark:border-slate-700 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-dalBlue dark:text-blue-400">Active Procurement Categories</h2>
              <p className="text-sm text-charcoal/60 dark:text-slate-400 mt-1 font-medium">Direct feeds categorized by ministry classification.</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/tenders')} className="gap-1.5 font-bold text-chinarRed dark:text-red-400 hover:bg-chinarRed/10 dark:hover:bg-slate-800">
              View complete directory <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Infinite Framer Motion Carousel */}
          <div className="flex overflow-hidden relative w-full group">
            {/* Gradient masks for smooth fading on edges */}
            <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-white dark:from-[#1e293b] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-white dark:from-[#1e293b] to-transparent z-10 pointer-events-none" />
            
            <motion.div 
              className="flex gap-6 min-w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
            >
              {carouselItems.map((card, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/tenders?category=${encodeURIComponent(card.title)}`)}
                  className="w-72 bg-paper dark:bg-[#0f172a] border border-border dark:border-slate-700 hover:border-dalBlue/30 dark:hover:border-blue-500/50 p-5 rounded-xl cursor-pointer transition-all hover:shadow-subtle flex-shrink-0"
                >
                  <span className="text-[10px] font-bold text-chinarRed dark:text-red-400 uppercase tracking-wider bg-chinarRed/10 dark:bg-red-400/10 px-2 py-0.5 rounded">
                    {card.count}
                  </span>
                  <h4 className="text-base font-bold text-dalBlue dark:text-slate-100 mt-3 mb-1.5">{card.title}</h4>
                  <p className="text-xs text-charcoal/70 dark:text-slate-400 leading-relaxed font-medium">{card.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}