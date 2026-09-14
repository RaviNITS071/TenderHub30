/**
 * @file src/components/layout/Navbar.jsx
 * @description Responsive top navigation bar. Includes branding, active route highlighting,
 * and a dynamic badge for bookmarked tenders.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Heart, User, Menu } from 'lucide-react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';

export function Navbar() {
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    // Subscribe to the global store to get the count of saved tenders
    const savedTenders = useBookmarkStore((state) => state.savedTenders);

    const navLinks = [
        { label: 'Home', path: '/' },
        { label: 'Find Tenders', path: '/tenders' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'About', path: '/about' },
        { label: 'Contact', path: '/contact' },
    ];

    return (
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-border shadow-subtle">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Brand Identity */}
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-dalBlue flex items-center justify-center text-white shadow-sm">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold text-dalBlue leading-none tracking-tight">TenderHub</span>
                        <span className="text-[10px] text-charcoal/60 uppercase font-bold tracking-wider mt-0.5">Intelligence Platform</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-bold transition-colors duration-200 ${isActive
                                        ? 'text-chinarRed border-b-2 border-chinarRed pb-0.5'
                                        : 'text-charcoal/70 hover:text-dalBlue'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Action Center (Bookmarks & Profile) */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-lg text-charcoal/70 dark:text-gray-300 hover:bg-paper dark:hover:bg-slate-800 transition-all"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <Link
                        to="/profile"
                        className="relative p-2 rounded-lg text-charcoal/70 hover:text-dalBlue hover:bg-paper transition-all"
                        title="Saved Tenders"
                    >
                        <Heart className="w-5 h-5" />
                        {savedTenders.length > 0 && (
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-chinarRed text-white text-[10px] font-bold flex items-center justify-center border border-white">
                                {savedTenders.length}
                            </span>
                        )}
                    </Link>

                    <Link
                        to="/profile"
                        className="hidden sm:flex items-center gap-2 pl-4 border-l border-border text-sm font-bold text-dalBlue hover:text-dalBlue-800 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-dalBlue/10 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <span>Contractor Space</span>
                    </Link>

                    {/* Mobile Menu Toggle (Placeholder logic for future mobile expansion) */}
                    <button className="md:hidden p-2 text-charcoal/70 hover:text-dalBlue">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
}