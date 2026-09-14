/**
 * @file src/components/layout/Navbar.jsx
 * @description Classical, human-crafted top navigation with reliable theme toggle,
 * clear institutional branding, and responsive mobile navigation.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Landmark, Heart, User, Menu, X, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useTheme } from '@/context/ThemeProvider';

export function Navbar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Subscribe to the global store for saved tenders count
  const savedTenders = useBookmarkStore((state) => state.savedTenders);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Browse Tenders', path: '/tenders' },
    { label: 'Pricing & Plans', path: '/pricing' },
    { label: 'About Platform', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Institutional Brand Identity */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-dalBlue text-white flex items-center justify-center shadow-xs">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-display font-black tracking-tight text-dalBlue dark:text-white leading-none">
                Tender<span className="text-chinarRed">Hub</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                J&amp;K
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-normal mt-0.5">
              Public Works &amp; Procurement
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-dalBlue dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Center: Theme, Saved & Contractor Workspace */}
        <div className="flex items-center gap-2">
          {/* Dependable Light/Dark Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-dalBlue dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Saved Tenders Indicator */}
          <Link
            to="/profile"
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-chinarRed dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Saved Tenders"
          >
            <Heart className="w-4 h-4" />
            {savedTenders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-chinarRed text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                {savedTenders.length}
              </span>
            )}
          </Link>

          {/* Contractor Workspace Button */}
          <Link
            to="/profile"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-dalBlue dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Contractor Space</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2 overflow-hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname === link.path
                    ? 'bg-slate-100 dark:bg-slate-800 text-dalBlue dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-dalBlue dark:text-white bg-slate-50 dark:bg-slate-800/60"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Contractor Workspace</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}