'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalysisResponse, RiskLevel } from '@/lib/types';
import { fetchReportDetails } from '@/lib/api';
import { downloadEditedContractDocx, downloadExecutiveAuditReport, downloadSummaryPdfReport } from '@/lib/exportUtils';
import { RiskSummaryCards } from '@/components/RiskSummaryCards';
import { ClauseCard } from '@/components/ClauseCard';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle, 
  FileText, 
  Share2,
  Check,
  Download,
  FileCheck,
  Sparkles,
  Edit3,
  ShieldCheck
} from 'lucide-react';



export default function ResultsDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | RiskLevel>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!reportId) return;

    async function loadReport() {
      try {
        setLoading(true);
        const data = await fetchReportDetails(reportId);
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis report.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center daylight-grid bg-[#F8F9FA]">
        <Loader2 size={40} className="animate-spin text-[#C5A059] mx-auto mb-4" />
        <h2 className="text-xl font-serif text-[#0A192F]">Loading Risk Dashboard...</h2>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-32 pb-20 text-center daylight-grid bg-[#F8F9FA]">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-serif text-[#0A192F] mb-2">Report Not Found</h2>
        <p className="text-[#212529] text-sm mb-6">{error || 'The requested report could not be found.'}</p>
        <Link
          href="/upload"
          className="btn-gold rounded-full px-6 py-3 text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Analyze New Contract</span>
        </Link>
      </div>
    );
  }

  // Filter clauses
  const filteredClauses = report.clauses.filter((clause) => {
    const matchesRisk = riskFilter === 'All' || clause.risk === riskFilter;
    const matchesSearch =
      clause.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.original.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRisk && matchesSearch;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadEdited = () => {
    downloadEditedContractDocx(report.id, report.filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDownloadReport = () => {
    downloadExecutiveAuditReport(report);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 daylight-grid bg-[#F8F9FA] text-[#212529]">
      {/* Top Action Bar with Download Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/history"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#0A192F] hover:text-[#C5A059] font-bold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Audit History</span>
        </Link>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* VERIFIED ON-CHAIN BADGE */}
          {report.payment_txid && (
            <a
              href={`https://testnet.explorer.perawallet.app/tx/${report.payment_txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-mono font-bold hover:bg-emerald-500/20 transition-all shadow-sm"
              title="View cryptographic on-chain verification receipt on Algorand Pera Explorer"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Verified on-chain ({report.payment_txid.slice(0, 6)}...{report.payment_txid.slice(-4)})</span>
            </a>
          )}

          {/* EDIT & AMEND CLAUSES BUTTON */}
          <Link
            href={`/amendments?reportId=${report.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0A192F] hover:bg-[#112240] text-[#C5A059] border border-[#C5A059]/40 text-xs font-mono font-semibold transition-all shadow-md hover:scale-105"
            title="Open interactive clause editor to edit and customize amendments"
          >
            <Edit3 size={14} className="text-[#C5A059]" />
            <span>Edit & Amend Clauses</span>
          </Link>

          {/* DOWNLOAD PDF SUMMARY REPORT BUTTON */}
          <button
            onClick={() => downloadSummaryPdfReport(report.id, report.filename)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0A192F] hover:bg-[#112240] text-[#F8F9FA] border border-[#C5A059]/40 text-xs font-mono font-semibold transition-all shadow-md hover:scale-105 cursor-pointer"
            title="Download 1-page PDF Summary Report with charts and Algorand receipt"
          >
            <FileText size={14} className="text-[#C5A059]" />
            <span>Download Report (PDF)</span>
          </button>

          {/* DOWNLOAD EDITED WORD CONTRACT BUTTON */}
          <button
            onClick={handleDownloadEdited}
            className="btn-gold rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
            title="Download Microsoft Word (.docx) document with safe alternative rewordings applied"
          >
            {downloadSuccess ? (
              <>
                <Check size={16} className="text-[#0A192F]" />
                <span>Downloading Word Document...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Edited Contract (.docx)</span>
              </>
            )}
          </button>

          {/* DOWNLOAD AUDIT REPORT BUTTON */}
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0A192F] hover:bg-[#112240] text-[#C5A059] border border-[#C5A059]/40 text-xs font-mono font-semibold transition-all shadow-sm"
            title="Download full executive risk audit report (.txt)"
          >
            <FileCheck size={14} />
            <span>Download Text Audit Report</span>
          </button>

          {/* SHARE LINK */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#0A192F]/15 hover:bg-[#F4F5F7] text-[#0A192F] text-xs font-mono transition-colors shadow-sm"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>
        </div>

      </div>

      {/* Overview & Metric Cards */}
      <RiskSummaryCards
        summary={report.summary}
        overallRisk={report.overallRisk}
        clauses={report.clauses}
        filename={report.filename}
        paymentTxid={report.payment_txid}
        onDownloadEdited={handleDownloadEdited}
      />

      {/* Filter and Search Bar */}
      <div className="editorial-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause terms or risks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F5F7] border border-[#0A192F]/15 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-[#0A192F] placeholder:text-slate-400 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        {/* Risk Level Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-mono uppercase text-[#0A192F] mr-1 flex items-center gap-1 font-bold">
            <Filter size={14} /> Filter:
          </span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                riskFilter === level
                  ? 'bg-[#0A192F] text-[#C5A059] shadow-md border border-[#C5A059]/40'
                  : 'bg-white text-[#0A192F] hover:bg-[#F4F5F7] border border-[#0A192F]/15'
              }`}
            >
              {level === 'All' ? 'All Clauses' : `${level} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif text-[#0A192F]">
            Flagged Legal Provisions ({filteredClauses.length})
          </h3>
          <span className="text-xs font-mono text-[#212529]/70">
            Each clause details: Risk Assessed • Why It's a Risk • Safe Alternative
          </span>
        </div>

        {filteredClauses.length === 0 ? (
          <div className="editorial-card rounded-2xl p-12 text-center">
            <p className="text-[#212529] text-sm">No clauses found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClauses.map((clause, idx) => (
              <ClauseCard key={idx} clause={clause} index={idx} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Download Banner */}
      <div className="bg-[#0A192F] rounded-3xl p-8 text-white border border-[#C5A059]/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-xs font-mono text-[#C5A059] font-bold">
            <Sparkles size={14} className="text-[#C5A059] animate-pulse" />
            <span>WORD DOCUMENT (.DOCX) GENERATOR</span>
          </div>
          <h4 className="text-2xl font-serif text-white">Download Edited Word Contract</h4>
          <p className="text-slate-300 text-xs font-normal">
            Export a clean revised Word document of <span className="font-semibold text-white">{report.filename}</span> with safe alternative rewordings applied.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadEdited}
            className="btn-gold rounded-full px-6 py-3.5 text-xs font-bold inline-flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
          >
            <Download size={16} />
            <span>Download Edited Contract (.docx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
