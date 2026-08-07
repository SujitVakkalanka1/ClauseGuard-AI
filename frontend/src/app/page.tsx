import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2
} from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-[#212529] overflow-hidden selection:bg-[#C5A059] selection:text-[#0A192F]">
      
      {/* HERO SECTION WITH EDITORIAL BACKGROUND IMAGE & DEEP NAVY CONTAINER */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden border-b border-[#0A192F]/10 daylight-grid">
        
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 z-0 opacity-15">
          <Image
            src="/images/legal_hero_bg.png"
            alt="Editorial Legal Library Background"
            fill
            priority
            className="object-cover object-center filter brightness-110 contrast-120"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20">
          
          {/* Main Hero Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Area */}
            <div className="lg:col-span-7 space-y-8 text-left">
              
              {/* Micro Category Label */}
              <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-[#C5A059] bg-[#0A192F]/5 px-3 py-1 rounded-full border border-[#C5A059]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span>CONTRACT / RISK CONTROL</span>
              </div>

              {/* High-End Editorial Serif Headline in Deep Navy */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-normal text-[#0A192F] tracking-tight leading-[1.02]">
                Audit your legal contracts for less
              </h1>

              {/* Subtitle in Charcoal */}
              <p className="text-lg sm:text-xl text-[#212529] max-w-xl font-normal leading-relaxed">
                AI clause detection, instant risk analysis, and Algorand TestNet payment verification. $0 upfront. A lower legal risk profile every month.
              </p>

              {/* Dual Action Pill Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/upload"
                  className="btn-navy rounded-full px-8 py-4 text-base font-semibold inline-flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <span>Upload contract</span>
                </Link>

                <Link
                  href="/upload"
                  className="btn-gold rounded-full px-8 py-4 text-base font-semibold inline-flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <span>Start free audit</span>
                  <ArrowRight size={18} />
                </Link>
              </div>

              {/* Micro Trust Details */}
              <div className="pt-6 flex items-center gap-6 text-xs font-mono text-[#212529]/80 border-t border-[#0A192F]/10">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#C5A059]" />
                  <span>PDF & DOCX Support</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#C5A059]" />
                  <span>Algorand x402 Protocol</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#C5A059]" />
                  <span>Pydantic AI Schema</span>
                </div>
              </div>
            </div>

            {/* Right Side: Deep Navy Card with Muted Gold Accents */}
            <div className="lg:col-span-5 relative group">
              
              {/* Micro Architectural Label Above Block */}
              <div className="flex justify-between items-center text-[10px] font-mono text-[#212529]/70 mb-2 px-1">
                <span>x402 TESTNET COST</span>
                <span className="text-[#C5A059] font-bold">0.001 ALGO</span>
              </div>

              {/* Deep Navy Container with Gold Border */}
              <div className="bg-[#0A192F] rounded-3xl p-7 text-[#F8F9FA] shadow-2xl relative overflow-hidden space-y-8 border border-[#C5A059]/40 transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:shadow-2xl">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-[#0A192F] font-bold">
                      ✻
                    </div>
                    <span className="font-serif font-bold text-lg text-white">ClauseGuard AI</span>
                  </div>
                  <span className="text-xs font-mono bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 px-3 py-1 rounded-full font-semibold">
                    Live TestNet
                  </span>
                </div>

                {/* Main Metric Stat Box */}
                <div className="space-y-1 pt-2">
                  <span className="text-xs font-mono text-[#C5A059] uppercase tracking-wider block">Analysis Speed</span>
                  <div className="text-3xl font-mono font-extrabold text-white tracking-tight">
                    1.2s - 2.5s
                  </div>
                  <span className="text-xs text-slate-300 block">Instant PyMuPDF & LLM Pipeline</span>
                </div>

                {/* Progress Bar (Backup Stored Match) */}
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span>On-Chain Verification</span>
                    <span className="font-bold text-[#C5A059]">CONFIRMED</span>
                  </div>
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-[#C5A059]/20">
                    <div className="bg-[#C5A059] h-full rounded-full w-[85%] animate-pulse" />
                  </div>
                </div>

                {/* Micro Stat Footnote */}
                <div className="pt-2 flex justify-between items-center text-xs font-mono text-slate-300">
                  <span>Risk Scanner Status</span>
                  <span className="text-[#C5A059] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                    Active 99.4%
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SAMPLE DEMO CLAUSE CARD IN SOFT IVORY WITH DEEP NAVY BORDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-20">
        <div className="editorial-card rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden transition-all duration-500 hover:border-[#C5A059]/60 hover:scale-[1.01]">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#0A192F]/10">
            <div>
              <span className="text-xs font-mono font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
                Live Demo Clause Audit Output
              </span>
              <h2 className="text-xl md:text-3xl font-serif text-[#0A192F]">Uncapped Indemnification Clause</h2>
            </div>
            <RiskBadge level="High" size="lg" />
          </div>

          <div className="mt-6 space-y-4">
            
            {/* Original Text */}
            <div className="bg-[#F4F5F7] p-4 rounded-2xl border border-[#0A192F]/10">
              <span className="text-xs font-mono text-[#212529]/70 block mb-1">ORIGINAL CONTRACT TEXT</span>
              <p className="text-xs font-mono text-[#0A192F] leading-relaxed">
                "Client agrees to fully indemnify, defend, and hold harmless Service Provider from any and all third-party claims, attorney fees, or losses without limitation."
              </p>
            </div>

            {/* Why Risky */}
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
              <span className="text-xs font-bold text-red-600 block mb-1 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-red-600" />
                WHY IT'S RISKY
              </span>
              <p className="text-sm text-[#212529] leading-relaxed font-normal">
                Unilateral, uncapped indemnification exposes your company to unlimited financial liability even if the Service Provider is at fault.
              </p>
            </div>

            {/* Safer Reworded Alternative */}
            <div className="bg-[#C5A059]/10 border border-[#C5A059]/40 p-4 rounded-2xl">
              <span className="text-xs font-bold text-[#C5A059] block mb-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#C5A059]" />
                SAFER REWORDED ALTERNATIVE (MUTED GOLD ACCENT)
              </span>
              <p className="text-sm text-[#0A192F] font-medium leading-relaxed">
                "Each party shall indemnify the other solely for direct third-party claims arising from gross negligence or willful misconduct, capped at total fees paid under this Agreement in the preceding 12 months."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW (3-STEP GRID IN HIGH CONTRAST) */}
      <section id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-20">
        <div className="text-center mb-16 space-y-2">
          <span className="text-xs font-mono text-[#C5A059] uppercase tracking-widest block font-bold">PIPELINE WORKFLOW</span>
          <h2 className="text-4xl font-serif text-[#0A192F]">How ClauseGuard Operates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="editorial-card rounded-3xl p-8 space-y-4 border-t-4 border-t-[#C5A059] transition-all duration-500 hover:-translate-y-2 shadow-md">
            <span className="text-3xl font-serif text-[#C5A059] font-bold block">01</span>
            <h3 className="text-xl font-bold text-[#0A192F]">Upload Contract</h3>
            <p className="text-sm text-[#212529] leading-relaxed">
              Drag and drop your PDF or DOCX file. Frontend sends file to FastAPI backend.
            </p>
          </div>

          <div className="editorial-card rounded-3xl p-8 space-y-4 border-t-4 border-t-[#C5A059] transition-all duration-500 hover:-translate-y-2 shadow-md">
            <span className="text-3xl font-serif text-[#C5A059] font-bold block">02</span>
            <h3 className="text-xl font-bold text-[#0A192F]">x402 Algorand Gate</h3>
            <p className="text-sm text-[#212529] leading-relaxed">
              Backend returns 402 challenge. Submits 0.001 ALGO on TestNet with challenge reference ID.
            </p>
          </div>

          <div className="editorial-card rounded-3xl p-8 space-y-4 border-t-4 border-t-[#C5A059] transition-all duration-500 hover:-translate-y-2 shadow-md">
            <span className="text-3xl font-serif text-[#C5A059] font-bold block">03</span>
            <h3 className="text-xl font-bold text-[#0A192F]">Verified AI Report</h3>
            <p className="text-sm text-[#212529] leading-relaxed">
              Verifier validates transaction proof on-chain. Returns risk scores & safe rewording.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA IN DEEP NAVY WITH GOLD BUTTON */}
      <section className="max-w-5xl mx-auto px-4 text-center py-20 relative z-20">
        <div className="bg-[#0A192F] rounded-3xl p-10 md:p-14 text-[#F8F9FA] shadow-2xl relative overflow-hidden space-y-6 border border-[#C5A059]/40 transition-all duration-500 hover:scale-[1.01]">
          <h2 className="text-4xl md:text-6xl font-serif font-normal text-white tracking-tight">
            Ready to audit contracts on-chain?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base">
            Start Phase 3 AI contract risk scanning powered by Algorand TestNet.
          </p>

          <div className="pt-4">
            <Link
              href="/upload"
              className="btn-gold rounded-full px-8 py-4 text-base font-bold inline-flex items-center gap-2 shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <ShieldCheck size={20} />
              <span>Start contract audit now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
