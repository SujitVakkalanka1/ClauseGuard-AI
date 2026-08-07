'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HistoryItemResponse } from '@/lib/types';
import { fetchHistory } from '@/lib/api';
import { RiskBadge } from '@/components/RiskBadge';
import { 
  FileText, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  History, 
  AlertTriangle,
  FileSearch,
  Search,
  ExternalLink
} from 'lucide-react';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItemResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await fetchHistory();
        setHistoryItems(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis history.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filteredItems = historyItems.filter((item) =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 space-y-8 daylight-grid bg-[#F8F9FA] text-[#212529]">
      {/* Page Header */}
      <div className="pb-6 border-b border-[#0A192F]/10">
        <span className="text-xs font-mono text-[#C5A059] uppercase tracking-widest block mb-1 font-bold">
          AUDIT ARCHIVE
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#0A192F] tracking-tight flex items-center gap-3">
          <History className="text-[#C5A059]" />
          Contract Audit History
        </h1>
        <p className="text-[#212529] text-sm mt-1">
          Review past contract risk analyses, executive reports, and on-chain Algorand TestNet transactions.
        </p>
      </div>

      {/* Search Filter Bar */}
      {!loading && historyItems.length > 0 && (
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by contract name or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#0A192F]/15 rounded-xl text-xs font-mono text-[#0A192F] placeholder-slate-400 focus:outline-none focus:border-[#C5A059] transition-colors"
          />
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={36} className="animate-spin text-[#C5A059] mx-auto mb-3" />
          <p className="text-slate-500 font-mono text-sm">Loading historical reports...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 p-6 rounded-2xl text-center">
          <AlertTriangle size={32} className="mx-auto mb-2 text-red-600" />
          <p className="font-semibold text-base">{error}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="editorial-card rounded-3xl p-16 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0A192F] text-[#C5A059] mx-auto flex items-center justify-center border border-[#C5A059]/30">
            <FileSearch size={32} />
          </div>
          <h3 className="text-2xl font-serif text-[#0A192F]">
            {searchQuery ? 'No Contracts Match Search' : 'No Contracts Analyzed Yet'}
          </h3>
          <p className="text-[#212529] text-sm">
            {searchQuery ? 'Try clearing your search query filter.' : 'Upload your first legal agreement to generate a comprehensive risk audit report.'}
          </p>
          {!searchQuery && (
            <div className="pt-2">
              <Link
                href="/upload"
                className="btn-gold rounded-full px-6 py-3 text-sm font-bold inline-flex items-center gap-2"
              >
                <span>Upload Contract Now</span>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
            const formattedDate = new Date(item.upload_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="editorial-card rounded-2xl p-5 md:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#C5A059]/50 transition-all"
              >
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-serif text-[#0A192F] flex items-center gap-2">
                      <FileText size={18} className="text-[#C5A059]" />
                      {item.filename}
                    </h3>
                    <RiskBadge level={item.overallRisk as any} size="sm" />
                  </div>

                  <p className="text-xs text-[#212529] line-clamp-2 max-w-3xl">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-slate-400" />
                      {formattedDate}
                    </span>
                    <span>•</span>
                    <span className="text-red-600 font-semibold">{item.high_risk_count} High</span>
                    <span className="text-amber-600 font-semibold">{item.medium_risk_count} Med</span>
                    <span className="text-emerald-600 font-semibold">{item.low_risk_count} Low</span>

                    {item.payment_txid && (
                      <>
                        <span>•</span>
                        <a
                          href={`https://lora.algokit.io/testnet/transaction/${item.payment_txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#C5A059] underline font-bold flex items-center gap-1 hover:text-[#0A192F]"
                          title="View on Algorand Lora AlgoKit Explorer"
                        >
                          <span>TxID: {item.payment_txid.slice(0, 10)}...</span>
                          <ExternalLink size={12} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link
                    href={`/results/${item.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0A192F] hover:bg-[#112240] text-[#C5A059] border border-[#C5A059]/40 text-xs font-mono font-semibold transition-all group"
                  >
                    <span>View Report</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
