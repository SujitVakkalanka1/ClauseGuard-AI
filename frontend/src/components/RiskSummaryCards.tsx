import React, { useState } from 'react';
import { ClauseAnalysis, RiskLevel } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  Link2, 
  Copy, 
  Check,
  Download
} from 'lucide-react';

interface RiskSummaryCardsProps {
  summary: string;
  overallRisk: RiskLevel;
  clauses: ClauseAnalysis[];
  filename: string;
  paymentTxid?: string;
  onDownloadEdited?: () => void;
}

export const RiskSummaryCards: React.FC<RiskSummaryCardsProps> = ({
  summary,
  overallRisk,
  clauses,
  filename,
  paymentTxid,
  onDownloadEdited
}) => {
  const [copied, setCopied] = useState(false);

  const highCount = clauses.filter(c => c.risk === 'High').length;
  const medCount = clauses.filter(c => c.risk === 'Medium').length;
  const lowCount = clauses.filter(c => c.risk === 'Low').length;

  const handleCopyTxid = () => {
    if (paymentTxid) {
      navigator.clipboard.writeText(paymentTxid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Header Card in Deep Navy with Gold Highlights */}
      <div className="editorial-card-dark rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-[#F8F9FA]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#C5A059] mb-1">
              <span>VERIFIED CONTRACT AUDIT REPORT</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
              {filename}
            </h1>
            
            {/* Real Algorand On-Chain Transaction Audit Badge */}
            {paymentTxid && (
              <div className="mt-3 inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#112240] border border-[#C5A059]/30 text-xs font-mono text-slate-200 shadow-inner">
                <Link2 size={14} className="text-[#C5A059]" />
                <span>Algorand TxID:</span>
                <span className="font-mono text-white text-xs">{paymentTxid.slice(0, 16)}...</span>
                
                <button
                  type="button"
                  onClick={handleCopyTxid}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-[#C5A059] transition-colors ml-1"
                  title="Copy full TxID to clipboard"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>

                <a
                  href={`https://lora.algokit.io/testnet/transaction/${paymentTxid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C5A059] underline flex items-center gap-1 hover:text-white ml-1 font-bold"
                  title="View on Algorand Lora AlgoKit Explorer"
                >
                  <span>Explorer</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-3 bg-[#112240] px-5 py-3 rounded-2xl border border-white/10">
              <span className="text-sm font-semibold text-slate-300">Overall Risk:</span>
              <RiskBadge level={overallRisk} size="lg" />
            </div>

            {onDownloadEdited && (
              <button
                type="button"
                onClick={onDownloadEdited}
                className="btn-gold rounded-full px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Download size={14} />
                <span>Download Edited Contract</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="pt-6">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C5A059] mb-2 flex items-center gap-2">
            <ShieldCheck size={18} />
            AI Executive Risk Summary
          </h3>
          <p className="text-slate-200 leading-relaxed text-base font-normal">
            {summary}
          </p>
        </div>
      </div>

      {/* Breakdown Metric Cards in Light Ivory Card with Deep Navy/Gold Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* High Risk Count */}
        <div className="editorial-card rounded-2xl border-red-500/30 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#212529]/70 block mb-1">High Risk Terms</span>
            <span className="text-3xl font-mono font-black text-red-600">{highCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Medium Risk Count */}
        <div className="editorial-card rounded-2xl border-amber-500/30 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#212529]/70 block mb-1">Medium Risk Terms</span>
            <span className="text-3xl font-mono font-black text-amber-600">{medCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* Low Risk Count */}
        <div className="editorial-card rounded-2xl border-emerald-500/30 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#212529]/70 block mb-1">Low Risk Terms</span>
            <span className="text-3xl font-mono font-black text-emerald-600">{lowCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Total Clauses Analyzed */}
        <div className="editorial-card rounded-2xl border-[#C5A059]/40 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#212529]/70 block mb-1">Flagged Clauses</span>
            <span className="text-3xl font-mono font-black text-[#0A192F]">{clauses.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#0A192F] text-[#C5A059] flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};
