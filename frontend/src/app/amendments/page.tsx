'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AnalysisResponse, 
  HistoryItemResponse, 
  ClauseAnalysis, 
  RiskLevel 
} from '@/lib/types';
import { 
  fetchHistory, 
  fetchReportDetails, 
  updateReportClauses 
} from '@/lib/api';
import { 
  downloadCustomAmendedDocx 
} from '@/lib/exportUtils';
import { RiskBadge } from '@/components/RiskBadge';
import { PaymentSuccessToast } from '@/components/PaymentSuccessToast';
import { 
  Edit3, 
  Sparkles, 
  Save, 
  Download, 
  RotateCcw, 
  Check, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft, 
  Copy,
  Ban,
  ShieldCheck,
  X,
  Hash,
  Tag
} from 'lucide-react';

interface EditableClauseState {
  originalIndex: number;
  name: string;
  risk: RiskLevel;
  reason: string;
  original: string;
  suggestion: string; // AI auto-corrected proposal
  editedText: string; // Active editable user text
  line_number: number;
  topic: string;
}

export default function AmendmentsPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItemResponse[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [clausesState, setClausesState] = useState<EditableClauseState[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment Side Notification Toast State
  const [showPaymentToast, setShowPaymentToast] = useState(false);
  const [paymentTxid, setPaymentTxid] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const justPaidTxId = sessionStorage.getItem('justPaidTxId');
      if (justPaidTxId) {
        setPaymentTxid(justPaidTxId);
        setShowPaymentToast(true);
        sessionStorage.removeItem('justPaidTxId');
      }
    }
  }, []);


  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [copiedClauseIdx, setCopiedClauseIdx] = useState<number | null>(null);

  // Scroll tracking for panel transition towards left
  const [scrolled, setScrolled] = useState(false);
  const [activeClauseIdx, setActiveClauseIdx] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 240);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver Scroll Spy to highlight the currently visible clause section
  useEffect(() => {
    if (!clausesState.length) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id && id.startsWith('clause-card-')) {
            const indexStr = id.replace('clause-card-', '');
            const parsed = parseInt(indexStr, 10);
            if (!isNaN(parsed)) {
              setActiveClauseIdx(parsed);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-15% 0px -55% 0px', // Triggers when clause card enters middle-upper viewport
      threshold: 0.1,
    });

    clausesState.forEach((c) => {
      const el = document.getElementById(`clause-card-${c.originalIndex}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [clausesState]);



  // Load URL query param for reportId
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const repParam = urlParams.get('reportId');
    if (repParam && !isNaN(Number(repParam))) {
      setSelectedReportId(Number(repParam));
    }
  }, []);

  // Fetch history list
  useEffect(() => {
    async function loadHistory() {
      try {
        const items = await fetchHistory();
        setHistoryItems(items);
        if (!selectedReportId && items.length > 0) {
          setSelectedReportId(items[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load audit history:', err);
      }
    }
    loadHistory();
  }, []);

  // Fetch specific report details when selectedReportId changes
  useEffect(() => {
    if (!selectedReportId) {
      setLoading(false);
      return;
    }

    async function loadReportData() {
      if (!selectedReportId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchReportDetails(selectedReportId);
        setReport(data);


        // Sort report clauses serially by line_number ascending
        const sortedClauses = [...data.clauses].sort(
          (a, b) => (a.line_number || 0) - (b.line_number || 0)
        );

        // Map report clauses into local editable state (defaults to original text, gray state)
        const initialClauses: EditableClauseState[] = sortedClauses.map((c, idx) => ({
          originalIndex: idx,
          name: c.name,
          risk: c.risk,
          reason: c.reason,
          original: c.original,
          suggestion: c.suggestion,
          editedText: c.original, // Start as original text (GRAY state until user applies amendment)
          line_number: c.line_number || (idx * 14 + 3),
          topic: c.topic || c.name,
        }));
        setClausesState(initialClauses);

      } catch (err: any) {
        setError(err.message || 'Failed to load report clauses.');
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [selectedReportId]);

  // Handle single clause text edit
  const handleClauseTextChange = (index: number, newText: string) => {
    setClausesState((prev) =>
      prev.map((c) => (c.originalIndex === index ? { ...c, editedText: newText } : c))
    );
  };

  // Reset single clause to AI auto-correction
  const handleApplyAiSuggestion = (index: number) => {
    setClausesState((prev) =>
      prev.map((c) => {
        if (c.originalIndex !== index) return c;
        let targetText = c.suggestion ? c.suggestion.trim() : '';
        if (!targetText || targetText === c.original.trim()) {
          targetText = `[AMENDED PROVISION] Both parties agree to fair, mutual contract terms with standard 30-day notice and capped liabilities for ${c.name}.`;
        }
        return { ...c, editedText: targetText, suggestion: targetText };
      })
    );
  };

  // Reset single clause to original contract text
  const handleResetToOriginal = (index: number) => {
    setClausesState((prev) =>
      prev.map((c) => (c.originalIndex === index ? { ...c, editedText: c.original } : c))
    );
  };

  // Global batch action: Apply AI auto-correction to all clauses
  const handleBatchApplyAiAll = () => {
    setClausesState((prev) =>
      prev.map((c) => {
        let targetText = c.suggestion ? c.suggestion.trim() : '';
        if (!targetText || targetText === c.original.trim()) {
          targetText = `[AMENDED PROVISION] Both parties agree to fair, mutual contract terms with standard 30-day notice and capped liabilities for ${c.name}.`;
        }
        return { ...c, editedText: targetText, suggestion: targetText };
      })
    );
  };

  // Global batch action: Reset all clauses to original contract text
  const handleBatchResetAllOriginal = () => {
    setClausesState((prev) => prev.map((c) => ({ ...c, editedText: c.original })));
  };

  // Open save confirmation modal
  const handleSaveAmendments = () => {
    if (!report || !selectedReportId) return;
    setShowSaveModal(true);
  };

  // Perform actual backend save after user confirms in modal
  const executeSaveAmendments = async () => {
    if (!report || !selectedReportId) return;
    try {
      setSaving(true);
      const payload: ClauseAnalysis[] = clausesState.map((c) => ({
        name: c.name,
        risk: c.risk,
        reason: c.reason,
        suggestion: c.editedText, // User's customized amendment saved as suggestion
        original: c.original,
        line_number: c.line_number,
        topic: c.topic,
      }));

      const updated = await updateReportClauses(selectedReportId, payload);
      setReport(updated);
      setSaveSuccess(true);
      setShowSaveModal(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(`Error saving amendments: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Export custom Word document with exact user amendments
  const handleExportCustomDocx = async () => {
    if (!report || !selectedReportId) return;
    try {
      setDownloading(true);
      const payload: ClauseAnalysis[] = clausesState.map((c) => ({
        name: c.name,
        risk: c.risk,
        reason: c.reason,
        suggestion: c.editedText,
        original: c.original,
        line_number: c.line_number,
        topic: c.topic,
      }));

      await downloadCustomAmendedDocx(selectedReportId, report.filename, payload);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error exporting Word contract: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Copy clause text to clipboard
  const handleCopyClauseText = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseIdx(idx);
    setTimeout(() => setCopiedClauseIdx(null), 2000);
  };

  // Filter clauses by risk level & search query
  const filteredClauses = clausesState.filter((clause) => {
    const matchesRisk = riskFilter === 'All' || clause.risk === riskFilter;
    const matchesSearch =
      clause.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(clause.line_number).includes(searchQuery) ||
      clause.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.editedText.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  // Calculate statistics
  const totalClauses = clausesState.length;
  const highRiskCount = clausesState.filter((c) => c.risk === 'High').length;
  const medRiskCount = clausesState.filter((c) => c.risk === 'Medium').length;
  const customAmendedCount = clausesState.filter(
    (c) => c.editedText.trim() !== c.original.trim()
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-8 daylight-grid bg-[#F8F9FA] text-[#212529] min-h-screen">
      
      {/* Page Title & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#C5A059] font-bold uppercase tracking-wider mb-1">
          <Edit3 size={14} className="animate-pulse text-[#C5A059]" />
          <span>Contract Amendment Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0A192F] tracking-tight">
          Clause Amendments & Fine-Tuning
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          Review clause risk exposure, inspect AI auto-corrections, and manually edit or rewrite provisions to produce an execution-ready customized contract.
        </p>
      </div>

      {/* Contract Selector & Document Overview */}
      <div className="editorial-card rounded-3xl p-6 shadow-lg bg-white space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0A192F]/10 pb-4">
          
          {/* Document Picker Dropdown */}
          <div className="space-y-1.5 w-full md:w-auto">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText size={14} className="text-[#C5A059]" />
              Select Contract to Amend:
            </label>
            <div className="relative min-w-[280px] max-w-full">
              <select
                value={selectedReportId || ''}
                onChange={(e) => setSelectedReportId(Number(e.target.value))}
                className="w-full bg-[#F4F5F7] border border-[#0A192F]/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0A192F] focus:outline-none focus:border-[#C5A059] appearance-none pr-10 shadow-inner"
              >
                {historyItems.length === 0 ? (
                  <option value="">No contracts analyzed yet</option>
                ) : (
                  historyItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      #{item.id} — {item.filename} ({item.overallRisk} Risk)
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0A192F] pointer-events-none"
              />
            </div>
          </div>

          {/* Quick Metrics Cards */}
          {report && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#0A192F] text-white px-4 py-2 rounded-2xl border border-[#C5A059]/30 text-center">
                <div className="text-[10px] font-mono text-[#C5A059] uppercase">Overall Risk</div>
                <div className="text-sm font-bold font-mono text-white">{report.overallRisk}</div>
              </div>
              <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-200 text-center">
                <div className="text-[10px] font-mono text-red-600 uppercase">High Risk</div>
                <div className="text-sm font-bold font-mono text-red-700">{highRiskCount}</div>
              </div>
              <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-center">
                <div className="text-[10px] font-mono text-amber-700 uppercase">Med Risk</div>
                <div className="text-sm font-bold font-mono text-amber-800">{medRiskCount}</div>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200 text-center">
                <div className="text-[10px] font-mono text-emerald-700 uppercase">Amended Provisions</div>
                <div className="text-sm font-bold font-mono text-emerald-800">
                  {customAmendedCount} / {totalClauses}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: STICKY LEFT TRACKING SIDEBAR + RIGHT CLAUSE EDITOR CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
        
        {/* LEFT SIDEBAR COLUMN: CLAUSE STATUS & AMENDMENT TRACKING PANEL */}
        {report && totalClauses > 0 && (
          <aside
            className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              scrolled
                ? 'lg:fixed lg:left-4 xl:left-6 lg:top-28 z-40 lg:w-16 w-full translate-x-0'
                : 'lg:col-span-4 lg:sticky lg:top-28 z-30 w-full'
            }`}
          >
            {scrolled ? (
              /* CONTRACTED DOCK STATE (SLOWLY CONVERGED INTO FAR LEFT SIDEBAR WITH SMOOTH CUBIC-BEZIER TRANSITION) */
              <div className="bg-[#0A192F]/95 text-white rounded-3xl p-3 border-2 border-[#C5A059]/50 shadow-[0_15px_40px_rgba(10,25,47,0.8)] space-y-3 backdrop-blur-2xl flex flex-col items-center animate-in fade-in slide-in-from-left-6 duration-500 w-16">
                
                {/* Contracted Header Counter */}
                <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-2.5 w-full text-center">
                  <ShieldCheck size={18} className="text-[#C5A059] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#C5A059] font-bold">
                    {customAmendedCount}/{totalClauses}
                  </span>
                </div>

                {/* Contracted Clause Line & Number List */}
                <div className="space-y-2.5 max-h-[calc(100vh-230px)] overflow-y-auto w-full flex flex-col items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {clausesState.map((c) => {
                    const isAmended = c.editedText.trim() !== c.original.trim();
                    const isAiMatch = c.editedText.trim() === c.suggestion.trim();
                    const isActive = activeClauseIdx === c.originalIndex;

                    return (
                      <div key={c.originalIndex} className="relative group flex items-center justify-center w-full">
                        {/* Compact Clause Pill (#01, #02, ...) */}
                        <a
                          href={`#clause-card-${c.originalIndex}`}
                          className={`w-11 h-11 rounded-2xl border text-xs font-mono font-bold flex items-center justify-center relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-95 shadow-sm ${
                            isActive
                              ? 'bg-[#C5A059] text-[#0A192F] border-white ring-4 ring-[#C5A059]/40 scale-110 shadow-[0_0_16px_rgba(197,160,89,0.8)] z-10 font-black'
                              : isAmended
                              ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200 hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <span className="text-[12px] font-mono font-black tracking-tight">
                            #{String(c.originalIndex + 1).padStart(2, '0')}
                          </span>
                        </a>

                        {/* HOVER TOOLTIP CARD SHOWING LINE NUMBER, TOPIC & AMENDMENT STATUS */}
                        <div className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] scale-90 group-hover:scale-100 translate-x-1 group-hover:translate-x-3 z-50 min-w-[260px] max-w-xs bg-[#0A192F]/95 text-white p-4 rounded-2xl border border-[#C5A059]/60 shadow-[0_15px_35px_rgba(0,0,0,0.6)] space-y-2 backdrop-blur-2xl">
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-[#C5A059] font-bold">
                              <span>#{String(c.originalIndex + 1).padStart(2, '0')}</span>
                              <span>•</span>
                              <span className="bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded-md border border-[#C5A059]/30">
                                Line {c.line_number}
                              </span>
                            </div>
                            <RiskBadge level={c.risk} size="sm" />
                          </div>

                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                              Topic: {c.topic}
                            </div>
                            <h4 className="text-xs font-serif font-bold text-white line-clamp-2 leading-snug">
                              {c.name}
                            </h4>
                          </div>

                          <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono border-t border-white/10">
                            <span className="text-slate-400 font-medium">Status:</span>
                            <span className={`font-bold transition-colors duration-300 ${isAmended ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {isAmended ? (isAiMatch ? '✨ AI Amended' : '✏️ Custom') : '🚫 Preserved'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* EXPANDED FULL SIDEBAR STATE (WHEN AT TOP) */
              <div className="bg-[#0A192F] text-white rounded-3xl p-5 border border-[#C5A059]/40 shadow-2xl space-y-4 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#C5A059] shrink-0" />
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Clause Control Panel
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#C5A059] bg-[#112240] px-2.5 py-0.5 rounded-full border border-[#C5A059]/30 font-bold">
                    {customAmendedCount}/{totalClauses} Amended
                  </span>
                </div>

                {/* Status Pill Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-2xl text-emerald-300">
                    <div className="font-bold text-base text-emerald-400">{customAmendedCount}</div>
                    <div className="text-[10px] uppercase font-bold text-emerald-200">Amended</div>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-600/50 p-2.5 rounded-2xl text-slate-300">
                    <div className="font-bold text-base text-slate-300">{totalClauses - customAmendedCount}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Preserved</div>
                  </div>
                </div>

                {/* Vertical Clause Navigation List */}
                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {clausesState.map((c) => {
                    const isAmended = c.editedText.trim() !== c.original.trim();
                    const isAiMatch = c.editedText.trim() === c.suggestion.trim();
                    const isActive = activeClauseIdx === c.originalIndex;

                    return (
                      <a
                        key={c.originalIndex}
                        href={`#clause-card-${c.originalIndex}`}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-mono transition-all duration-300 hover:translate-x-1 ${
                          isActive
                            ? 'bg-[#C5A059] text-[#0A192F] border-white font-bold ring-2 ring-[#C5A059]/50 shadow-lg scale-[1.02]'
                            : isAmended
                            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200 hover:border-emerald-400 shadow-sm'
                            : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[170px]">
                          <div className="flex items-center gap-1.5 text-[10px] text-[#C5A059] font-bold">
                            <span className={isActive ? 'text-[#0A192F]' : ''}>#{String(c.originalIndex + 1).padStart(2, '0')}</span>
                            <span>•</span>
                            <span className={isActive ? 'text-[#0A192F]' : 'text-[#C5A059]'}>Line {c.line_number}</span>
                          </div>
                          <div className="truncate font-semibold text-xs" title={`${c.name} (${c.topic})`}>
                            {c.name}
                          </div>
                        </div>

                        <span className="shrink-0 font-bold flex items-center gap-1 text-[10px] ml-1">
                          {isAmended ? (
                            <>
                              <CheckCircle2 size={12} className={isActive ? 'text-[#0A192F]' : 'text-emerald-400'} />
                              <span className={isActive ? 'text-[#0A192F]' : 'text-emerald-300'}>{isAiMatch ? 'AI' : 'Custom'}</span>
                            </>
                          ) : (
                            <>
                              <Ban size={12} className={isActive ? 'text-[#0A192F]' : 'text-slate-400'} />
                              <span className={isActive ? 'text-[#0A192F]' : 'text-slate-400'}>Preserved</span>
                            </>
                          )}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}


        {/* MAIN WORKSPACE COLUMN: FILTER CONTROLS & CLAUSE CARDS */}
        <main
          className={`transition-all duration-500 ${
            report && totalClauses > 0 ? (scrolled ? 'lg:col-span-12' : 'lg:col-span-8') : 'lg:col-span-12'
          } space-y-6`}
        >


          
          {/* Global Batch Controls & Filter Toolbar */}
          <div className="editorial-card rounded-3xl p-5 bg-white border border-[#0A192F]/10 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by clause name or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F4F5F7] border border-[#0A192F]/15 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-[#0A192F] placeholder:text-slate-400 focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            {/* Risk Level Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-mono uppercase text-[#0A192F] font-bold flex items-center gap-1">
                <Filter size={13} /> Filter:
              </span>
              {(['All', 'High', 'Medium', 'Low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all ${
                    riskFilter === level
                      ? 'bg-[#0A192F] text-[#C5A059] shadow border border-[#C5A059]/40'
                      : 'bg-white text-[#0A192F] hover:bg-[#F4F5F7] border border-[#0A192F]/15'
                  }`}
                >
                  {level === 'All' ? 'All' : level}
                </button>
              ))}
            </div>

            {/* Global Batch Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchApplyAiAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#C5A059] border border-[#C5A059]/30 text-xs font-mono font-semibold transition-all shadow-sm"
                title="Set all clause amendment text to AI auto-corrections"
              >
                <Sparkles size={13} className="text-[#C5A059]" />
                <span>Apply All AI</span>
              </button>

              <button
                onClick={handleBatchResetAllOriginal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-mono font-semibold transition-all shadow-sm"
                title="Reset all clause text back to original contract text"
              >
                <RotateCcw size={13} />
                <span>Reset All</span>
              </button>
            </div>
          </div>

          {/* Main Clause Editor Cards List */}
          {loading ? (
            <div className="editorial-card rounded-3xl p-20 text-center space-y-4 daylight-grid bg-white">
              <Loader2 size={36} className="animate-spin text-[#C5A059] mx-auto" />
              <h3 className="text-lg font-serif text-[#0A192F]">Loading Contract Clauses for Amendment...</h3>
            </div>
          ) : error || !report ? (
            <div className="editorial-card rounded-3xl p-12 text-center space-y-4 bg-white">
              <AlertTriangle size={36} className="text-red-500 mx-auto" />
              <h3 className="text-xl font-serif text-[#0A192F]">No Contract Selected</h3>
              <p className="text-slate-600 text-sm">{error || 'Please select a contract from the dropdown menu above.'}</p>
            </div>
          ) : filteredClauses.length === 0 ? (
            <div className="editorial-card rounded-3xl p-12 text-center bg-white">
              <p className="text-slate-600 text-sm font-mono">No provisions match your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredClauses.map((clauseItem) => {

            const idx = clauseItem.originalIndex;
            const isAiMatch = clauseItem.editedText.trim() === clauseItem.suggestion.trim();
            const isOriginalMatch = clauseItem.editedText.trim() === clauseItem.original.trim();
            const isCustomEdited = !isAiMatch && !isOriginalMatch;

            const riskBorderColor = {
              High: 'border-red-500/40 hover:border-red-500/60',
              Medium: 'border-amber-500/40 hover:border-amber-500/60',
              Low: 'border-emerald-500/40 hover:border-emerald-500/60',
            }[clauseItem.risk];

            return (
              <div
                key={idx}
                id={`clause-card-${idx}`}
                className={`editorial-card rounded-3xl border ${riskBorderColor} transition-all duration-300 shadow-md bg-white overflow-hidden space-y-5 p-6 scroll-mt-28`}
              >

                {/* Clause Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0A192F]/10 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="w-8 h-8 rounded-xl bg-[#0A192F] text-[#C5A059] text-xs font-mono font-bold flex items-center justify-center border border-[#C5A059]/30">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-serif font-bold text-[#0A192F]">
                          {clauseItem.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 bg-[#0A192F]/5 text-[#0A192F] border border-[#0A192F]/15 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                          <Hash size={12} className="text-[#C5A059]" />
                          Line {clauseItem.line_number}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[#C5A059]/10 text-[#0A192F] border border-[#C5A059]/30 px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold">
                          <Tag size={12} className="text-[#C5A059]" />
                          {clauseItem.topic}
                        </span>
                      </div>
                    </div>
                    <RiskBadge level={clauseItem.risk} size="sm" />
                  </div>

                  {/* Amendment Status Indicator Tag */}
                  <div className="flex items-center gap-2">
                    {isOriginalMatch ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono font-bold shadow-sm">
                        <Ban size={13} className="text-slate-600" />
                        Ignored (Original Preserved)
                      </span>
                    ) : isCustomEdited ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold shadow-sm">
                        <Edit3 size={13} className="text-blue-600" />
                        Custom User Amendment
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold shadow-sm">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        AI Auto-Correction Active
                      </span>
                    )}
                  </div>
                </div>

                {/* USER DECISION SELECTION BAR (IGNORE RISK VS APPLY AMENDMENT) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-[#F4F5F7] rounded-2xl border border-[#0A192F]/10">
                  <button
                    type="button"
                    onClick={() => handleResetToOriginal(idx)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-out active:scale-95 hover:scale-[1.01] ${
                      isOriginalMatch
                        ? 'bg-slate-800 text-white shadow-md border border-slate-700 ring-2 ring-slate-400'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Ban size={14} className={isOriginalMatch ? 'text-amber-400' : 'text-slate-500'} />
                    <span>🚫 Ignore Risk (Keep Original)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyAiSuggestion(idx)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-out active:scale-95 hover:scale-[1.01] ${
                      !isOriginalMatch
                        ? 'btn-gold text-[#0A192F] shadow-md ring-2 ring-[#C5A059]'
                        : 'bg-white text-[#0A192F] hover:bg-[#F4F5F7] border border-slate-200'
                    }`}
                  >
                    <Sparkles size={14} className={!isOriginalMatch ? 'text-[#0A192F]' : 'text-[#C5A059]'} />
                    <span>✨ Apply Amendment (AI / Custom)</span>
                  </button>
                </div>



                {/* Risk Explanation Banner */}
                <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/20 text-xs leading-relaxed space-y-1">
                  <div className="font-mono font-bold text-red-700 uppercase flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-red-600" />
                    <span>Legal Exposure & Risk Assessment:</span>
                  </div>
                  <p className="text-[#212529] font-normal">{clauseItem.reason}</p>
                </div>

                {/* Side-by-Side Comparison Grid: Original Text vs AI Auto-Correction */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
                  
                  {/* ORIGINAL CLAUSE TEXT BOX */}
                  <div className="bg-[#F4F5F7] rounded-2xl p-4 border border-[#0A192F]/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-slate-500 font-bold uppercase mb-1">
                        <span className="flex items-center gap-1.5">
                          <FileText size={13} />
                          Original Contract Text
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyClauseText(idx * 2, clauseItem.original)}
                          className="hover:text-[#0A192F] transition-colors"
                          title="Copy original text"
                        >
                          {copiedClauseIdx === idx * 2 ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div className="text-[#0A192F] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                        "{clauseItem.original}"
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetToOriginal(idx)}
                      className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 py-1.5 rounded-xl transition-colors mt-2"
                    >
                      <RotateCcw size={12} />
                      <span>Use Original Text in Amendment</span>
                    </button>
                  </div>

                  {/* AI AUTO-CORRECTED SUGGESTION BOX */}
                  <div className="bg-[#0A192F] text-white rounded-2xl p-4 border border-[#C5A059]/40 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[#C5A059] font-bold uppercase mb-1">
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-[#C5A059] animate-pulse" />
                          AI Auto-Correction Suggestion
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyClauseText(idx * 2 + 1, clauseItem.suggestion)}
                          className="hover:text-white transition-colors"
                          title="Copy AI suggestion"
                        >
                          {copiedClauseIdx === idx * 2 + 1 ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div className="text-slate-100 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                        "{clauseItem.suggestion}"
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyAiSuggestion(idx)}
                      className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0A192F] btn-gold py-1.5 rounded-xl transition-all hover:scale-102 mt-2 shadow"
                    >
                      <Sparkles size={12} />
                      <span>Use AI Auto-Correction in Amendment</span>
                    </button>
                  </div>
                </div>

                {/* USER INTERACTIVE AMENDMENT TEXTAREA */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#0A192F] flex items-center gap-1.5">
                      <Edit3 size={14} className="text-[#C5A059]" />
                      Customized Final Amendment Text (Execution Draft):
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyAiSuggestion(idx)}
                        className="text-[11px] font-mono text-[#0A192F] hover:text-[#C5A059] font-bold underline"
                      >
                        Reset to AI Suggestion
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleResetToOriginal(idx)}
                        className="text-[11px] font-mono text-slate-500 hover:text-slate-800 font-medium underline"
                      >
                        Reset to Original
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={4}
                      value={clauseItem.editedText}
                      onChange={(e) => handleClauseTextChange(idx, e.target.value)}
                      placeholder="Enter customized clause text here..."
                      className="w-full bg-[#FAFBFD] border-2 border-[#0A192F]/20 rounded-2xl p-4 text-sm font-sans text-[#0A192F] leading-relaxed focus:outline-none focus:border-[#C5A059] focus:bg-white shadow-inner transition-all resize-y"
                    />
                    <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-400 pointer-events-none bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                      {clauseItem.editedText.length} chars
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Sticky Action Banner */}
      {report && (
        <div className="bg-[#0A192F] rounded-3xl p-8 text-white border border-[#C5A059]/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C5A059] font-bold uppercase">
              <Sparkles size={14} className="text-[#C5A059] animate-pulse" />
              <span>CUSTOM CONTRACT COMPILATION</span>
            </div>
            <h4 className="text-2xl font-serif text-white">Ready to Export Customized Contract?</h4>
            <p className="text-slate-300 text-xs font-normal">
              Download a clean Microsoft Word (.docx) document compiled with your exact customized amendments for <span className="font-semibold text-white">{report.filename}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveAmendments}
              disabled={saving}
              className="btn-navy border border-[#C5A059]/40 rounded-full px-6 py-3.5 text-xs font-bold inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin text-[#C5A059]" /> : <Save size={16} className="text-[#C5A059]" />}
              <span>{saving ? 'Saving...' : 'Save Amendments'}</span>
            </button>

            <button
              onClick={handleExportCustomDocx}
              disabled={downloading}
              className="btn-gold rounded-full px-6 py-3.5 text-xs font-bold inline-flex items-center gap-2 shadow-xl hover:scale-105 transition-all disabled:opacity-50"
            >
              {downloading ? <Loader2 size={16} className="animate-spin text-[#0A192F]" /> : <Download size={16} />}
              <span>{downloading ? 'Exporting...' : 'Download Amended Contract (.docx)'}</span>
            </button>
          </div>
        </div>
      )}
        </main>
      </div>

      {/* SAVE AMENDMENTS CONFIRMATION MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-[#0A192F]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 ease-out animate-in fade-in">
          <div className="bg-[#0A192F] text-white border border-[#C5A059]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_25px_60px_rgba(0,0,0,0.7)] space-y-6 daylight-grid relative transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in zoom-in-95">

            
            {/* Close Button */}
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#112240] text-[#C5A059] text-xs font-mono font-bold border border-[#C5A059]/30">
                <Save size={14} /> Confirm Save Action
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">
                Save Contract Amendments?
              </h3>
              <p className="text-slate-300 text-xs font-mono leading-relaxed">
                Please review your amendment summary before saving changes to <span className="text-[#C5A059] font-bold">{report?.filename}</span>.
              </p>
            </div>

            {/* Summary Statistics Cards (Shows how many amendments were made & how many were left) */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-3.5 rounded-2xl">
                <div className="text-2xl font-bold text-emerald-400 font-mono">{customAmendedCount}</div>
                <div className="text-[11px] text-emerald-200 font-bold uppercase mt-1">Amendments Made</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-600/50 p-3.5 rounded-2xl">
                <div className="text-2xl font-bold text-slate-300 font-mono">{totalClauses - customAmendedCount}</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">Preserved / Left</div>
              </div>
            </div>

            {/* Breakdown Clause List Preview */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-t border-b border-white/10 py-3">
              {clausesState.map((c) => {
                const isAmended = c.editedText.trim() !== c.original.trim();
                const isAiMatch = c.editedText.trim() === c.suggestion.trim();

                return (
                  <div
                    key={c.originalIndex}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#112240]/60 border border-white/5 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[280px]">
                      <span className="text-[#C5A059] font-bold shrink-0">
                        Line {c.line_number}
                      </span>
                      <span className="text-slate-400 shrink-0">•</span>
                      <span className="truncate text-slate-200" title={`${c.name} (${c.topic})`}>
                        #{String(c.originalIndex + 1).padStart(2, '0')} {c.name}
                      </span>
                    </div>
                    <span className={`font-bold flex items-center gap-1 text-[11px] shrink-0 ${isAmended ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isAmended ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span>{isAiMatch ? 'AI Amended' : 'Custom'}</span>
                        </>
                      ) : (
                        <>
                          <Ban size={12} className="text-slate-400" />
                          <span>Preserved</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: Cancel vs Confirm Save */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all border border-slate-600"
              >
                Cancel / Keep Editing
              </button>

              <button
                type="button"
                onClick={executeSaveAmendments}
                disabled={saving}
                className="btn-gold rounded-full px-6 py-3 text-xs font-mono font-bold inline-flex items-center gap-2 shadow-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#0A192F]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Confirm & Save Amendments</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Notification Toast After Successful Payment */}
      {showPaymentToast && (
        <PaymentSuccessToast
          txid={paymentTxid}
          amount={0.001}
          onClose={() => setShowPaymentToast(false)}
        />
      )}
    </div>
  );
}


