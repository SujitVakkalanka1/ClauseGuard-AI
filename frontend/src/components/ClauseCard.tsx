import React, { useState } from 'react';
import { ClauseAnalysis } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface ClauseCardProps {
  clause: ClauseAnalysis;
  index: number;
}

export const ClauseCard: React.FC<ClauseCardProps> = ({ clause, index }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopySuggestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clause.suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskBorderColor = {
    High: 'border-red-500/30 hover:border-red-500/50',
    Medium: 'border-amber-500/30 hover:border-amber-500/50',
    Low: 'border-emerald-500/30 hover:border-emerald-500/50',
  }[clause.risk];

  return (
    <div className={`editorial-card rounded-3xl border ${riskBorderColor} transition-all duration-300 shadow-md overflow-hidden bg-white`}>
      {/* Header Bar: RISK ASSESSED */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#F4F5F7] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-8 h-8 rounded-xl bg-[#0A192F] text-[#C5A059] text-xs font-mono font-bold flex items-center justify-center border border-[#C5A059]/30">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <h4 className="text-lg font-serif text-[#0A192F] tracking-tight">
            {clause.name}
          </h4>
          
          {/* SECTION 1: RISK ASSESSED BADGE */}
          <div className="flex items-center gap-2">
            <RiskBadge level={clause.risk} size="sm" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Risk Assessed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-xs font-mono hidden sm:inline">
            {isExpanded ? 'Collapse' : 'Expand Details'}
          </span>
          {isExpanded ? <ChevronUp size={18} className="text-[#C5A059]" /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expandable Content Body */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-3 border-t border-[#0A192F]/10 space-y-5 bg-[#F8F9FA]">
          
          {/* SECTION 1 SUMMARY BANNER: RISK ASSESSED */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0A192F] text-white border border-[#C5A059]/30 text-xs font-mono">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#C5A059]" />
              <span className="font-bold text-[#C5A059]">1. RISK ASSESSED:</span>
              <span className="text-slate-200">{clause.risk.toUpperCase()} LEVEL LEGAL EXPOSURE</span>
            </div>
            <span className="hidden sm:inline-block text-[10px] text-slate-400">
              Category: {clause.name}
            </span>
          </div>

          {/* SECTION 2: WHY IT IS CONSIDERED A RISK */}
          <div className="bg-red-500/5 rounded-2xl p-5 border border-red-500/25 space-y-2">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              2. WHY THIS IS CONSIDERED A RISK (VULNERABILITY & EXPOSURE)
            </h5>
            <p className="text-sm text-[#212529] leading-relaxed font-normal">
              {clause.reason}
            </p>
          </div>

          {/* Original Clause Text Reference */}
          <div>
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <FileText size={14} />
              Original Contract Clause Text
            </h5>
            <div className="bg-[#F4F5F7] p-4 rounded-2xl border border-[#0A192F]/10 font-mono text-xs text-[#0A192F] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
              "{clause.original}"
            </div>
          </div>

          {/* SECTION 3: ALTERNATIVE WAY TO OVERCOME */}
          <div className="bg-[#0A192F] text-white rounded-2xl p-5 border border-[#C5A059]/40 relative space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-2">
                <Lightbulb size={16} className="text-[#C5A059] animate-pulse" />
                3. ALTERNATIVE WAY TO OVERCOME (RECOMMENDED SAFE REWORDING)
              </h5>

              <button
                type="button"
                onClick={handleCopySuggestion}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-semibold text-[#0A192F] btn-gold rounded-full transition-all hover:scale-105 shadow-md"
                title="Copy alternative text to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-[#0A192F]" />
                    <span>Alternative Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Alternative</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#112240] p-4 rounded-xl border border-white/10 text-sm text-slate-100 leading-relaxed font-medium">
              "{clause.suggestion}"
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 pt-1">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Included in downloadable edited contract</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
