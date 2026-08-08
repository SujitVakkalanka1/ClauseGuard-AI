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
  Copy
} from 'lucide-react';

interface EditableClauseState {
  originalIndex: number;
  name: string;
  risk: RiskLevel;
  reason: string;
  original: string;
  suggestion: string; // AI auto-corrected proposal
  editedText: string; // Active editable user text
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
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [copiedClauseIdx, setCopiedClauseIdx] = useState<number | null>(null);

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


        // Map report clauses into local editable state
        const initialClauses: EditableClauseState[] = data.clauses.map((c, idx) => ({
          originalIndex: idx,
          name: c.name,
          risk: c.risk,
          reason: c.reason,
          original: c.original,
          suggestion: c.suggestion,
          editedText: c.suggestion || c.original, // Default to AI auto-correction
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
      prev.map((c) => (c.originalIndex === index ? { ...c, editedText: c.suggestion } : c))
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
      prev.map((c) => ({ ...c, editedText: c.suggestion || c.original }))
    );
  };

  // Global batch action: Reset all clauses to original contract text
  const handleBatchResetAllOriginal = () => {
    setClausesState((prev) => prev.map((c) => ({ ...c, editedText: c.original })));
  };

  // Save amendments to backend
  const handleSaveAmendments = async () => {
    if (!report || !selectedReportId) return;
    try {
      setSaving(true);
      const payload: ClauseAnalysis[] = clausesState.map((c) => ({
        name: c.name,
        risk: c.risk,
        reason: c.reason,
        suggestion: c.editedText, // User's customized amendment saved as suggestion
        original: c.original,
      }));

      const updated = await updateReportClauses(selectedReportId, payload);
      setReport(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {report && (
            <Link
              href={`/results/${report.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#0A192F]/15 hover:bg-[#F4F5F7] text-[#0A192F] text-xs font-mono font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Back to Audit Dashboard</span>
            </Link>
          )}

          {/* SAVE AMENDMENTS BUTTON */}
          <button
            onClick={handleSaveAmendments}
            disabled={saving || !report}
            className="btn-navy rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-md disabled:opacity-50"
            title="Save custom clause amendments to database"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin text-[#C5A059]" />
            ) : saveSuccess ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Save size={16} className="text-[#C5A059]" />
            )}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved to Database!' : 'Save Amendments'}</span>
          </button>

          {/* DOWNLOAD CUSTOM WORD CONTRACT BUTTON */}
          <button
            onClick={handleExportCustomDocx}
            disabled={downloading || !report}
            className="btn-gold rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-lg hover:scale-105 transition-all disabled:opacity-50"
            title="Export Microsoft Word (.docx) document with custom user amendments applied"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin text-[#0A192F]" />
            ) : downloadSuccess ? (
              <Check size={16} className="text-[#0A192F]" />
            ) : (
              <Download size={16} />
            )}
            <span>
              {downloading
                ? 'Exporting .docx...'
                : downloadSuccess
                ? 'Word Document Ready!'
                : 'Download Amended Contract (.docx)'}
            </span>
          </button>
        </div>
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

        {/* Global Batch Controls & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-72">
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
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
                {level === 'All' ? 'All Provisions' : `${level} Risk`}
              </button>
            ))}
          </div>

          {/* Global Batch Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApplyAiAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A192F] hover:bg-[#112240] text-[#C5A059] border border-[#C5A059]/30 text-xs font-mono font-semibold transition-all shadow-sm"
              title="Set all clause amendment text to AI auto-corrections"
            >
              <Sparkles size={13} className="text-[#C5A059]" />
              <span>Apply All AI Auto-Corrections</span>
            </button>

            <button
              onClick={handleBatchResetAllOriginal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-mono font-semibold transition-all shadow-sm"
              title="Reset all clause text back to original contract text"
            >
              <RotateCcw size={13} />
              <span>Reset All to Original</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Clause Editor Cards List */}
      {loading ? (
        <div className="editorial-card rounded-3xl p-20 text-center space-y-4 daylight-grid">
          <Loader2 size={36} className="animate-spin text-[#C5A059] mx-auto" />
          <h3 className="text-lg font-serif text-[#0A192F]">Loading Contract Clauses for Amendment...</h3>
        </div>
      ) : error || !report ? (
        <div className="editorial-card rounded-3xl p-12 text-center space-y-4">
          <AlertTriangle size={36} className="text-red-500 mx-auto" />
          <h3 className="text-xl font-serif text-[#0A192F]">No Contract Selected</h3>
          <p className="text-slate-600 text-sm">{error || 'Please select a contract from the dropdown menu above.'}</p>
        </div>
      ) : filteredClauses.length === 0 ? (
        <div className="editorial-card rounded-3xl p-12 text-center">
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
                className={`editorial-card rounded-3xl border ${riskBorderColor} transition-all duration-300 shadow-md bg-white overflow-hidden space-y-5 p-6`}
              >
                {/* Clause Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0A192F]/10 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="w-8 h-8 rounded-xl bg-[#0A192F] text-[#C5A059] text-xs font-mono font-bold flex items-center justify-center border border-[#C5A059]/30">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[#0A192F]">
                      {clauseItem.name}
                    </h3>
                    <RiskBadge level={clauseItem.risk} size="sm" />
                  </div>

                  {/* Amendment Status Indicator Tag */}
                  <div className="flex items-center gap-2">
                    {isCustomEdited ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold shadow-sm">
                        <Edit3 size={13} className="text-blue-600" />
                        Custom User Amendment
                      </span>
                    ) : isAiMatch ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold shadow-sm">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        AI Auto-Correction Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono font-semibold">
                        <FileText size={13} className="text-slate-500" />
                        Original Text Preserved
                      </span>
                    )}
                  </div>
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

    </div>
  );
}
