'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, History, Edit3 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'workflow' | 'amendments' | 'history' | 'upload' | 'other'>('overview');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);

      // Section scroll spy on home page
      if (pathname === '/') {
        const workflowEl = document.getElementById('workflow');
        if (workflowEl) {
          const rect = workflowEl.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection('workflow');
          } else {
            setActiveSection('overview');
          }
        } else {
          setActiveSection('overview');
        }
      } else if (pathname === '/amendments') {
        setActiveSection('amendments');
      } else if (pathname === '/history') {
        setActiveSection('history');
      } else if (pathname === '/upload') {
        setActiveSection('upload');
      } else {
        setActiveSection('other');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-500">
      <div
        className={`floating-pill-nav flex items-center justify-between gap-3 sm:gap-5 pointer-events-auto w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? 'max-w-5xl lg:max-w-6xl rounded-2xl px-5 sm:px-7 py-2.5 bg-[#0A192F] text-[#F8F9FA] shadow-2xl shadow-[#0A192F]/40 border border-[#C5A059]/40 backdrop-blur-2xl'
            : 'max-w-4xl lg:max-w-5xl rounded-full px-4 sm:px-6 py-2.5 bg-[#0A192F]/95 text-[#F8F9FA] shadow-xl border border-[#C5A059]/30 backdrop-blur-xl'
        }`}
      >

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C5A059] to-[#D4AF37] flex items-center justify-center text-[#0A192F] font-bold text-sm shadow-md shadow-[#C5A059]/30 group-hover:scale-105 transition-transform duration-300">
            ✻
          </div>
          <span className="font-serif font-bold text-lg text-[#F8F9FA] tracking-tight whitespace-nowrap">
            ClauseGuard
          </span>
        </Link>

        {/* Center Links with Muted Gold Glowing Active Indicators */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-xs sm:text-sm font-medium">
          
          {/* Overview Link */}
          <Link
            href="/"
            className={`transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-[#C5A059]/20 text-[#C5A059] px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                : 'text-slate-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5'
            }`}
          >
            {activeSection === 'overview' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            )}
            <span>Overview</span>
          </Link>

          {/* Workflow Link */}
          <Link
            href="/#workflow"
            className={`transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'workflow'
                ? 'bg-[#C5A059]/20 text-[#C5A059] px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                : 'text-slate-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5'
            }`}
          >
            {activeSection === 'workflow' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            )}
            <span>Workflow</span>
          </Link>

          {/* Amendments Link */}
          <Link
            href="/amendments"
            className={`transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'amendments'
                ? 'bg-[#C5A059]/20 text-[#C5A059] px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                : 'text-slate-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5'
            }`}
          >
            <Edit3 size={14} className={activeSection === 'amendments' ? 'text-[#C5A059]' : 'text-slate-400'} />
            {activeSection === 'amendments' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            )}
            <span>Amendments</span>
          </Link>

          {/* History Link */}
          <Link
            href="/history"
            className={`transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'history'
                ? 'bg-[#C5A059]/20 text-[#C5A059] px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                : 'text-slate-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5'
            }`}
          >
            <History size={14} className={activeSection === 'history' ? 'text-[#C5A059]' : 'text-slate-400'} />
            {activeSection === 'history' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            )}
            <span>History</span>
          </Link>

          {/* x402 TestNet Status Pill */}
          <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-[#112240] text-slate-200 px-3 py-1 rounded-full border border-[#C5A059]/20 shadow-inner shrink-0 whitespace-nowrap ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            x402 TestNet
          </span>
        </nav>

        {/* Action Button */}
        <div className="flex items-center shrink-0">
          <Link
            href="/upload"
            className="btn-gold rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap"
          >
            <span>Analyze Contract</span>
            <ArrowRight size={14} />
          </Link>
        </div>



      </div>
    </header>
  );
};
