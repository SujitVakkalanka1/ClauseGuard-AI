import React from 'react';
import { ShieldCheck, ArrowRight, Lock, Loader2, Coins } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  amount?: number;
  asset?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  amount = 0.001,
  asset = 'ALGO',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A192F] border border-[#C5A059]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-white backdrop-blur-2xl">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C5A059] to-[#D4AF37] p-0.5 shadow-lg shadow-[#C5A059]/20 mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-[#0A192F] rounded-[14px] flex items-center justify-center text-[#C5A059]">
              <Coins size={28} />
            </div>
          </div>
          <h3 className="text-2xl font-serif text-white tracking-tight">
            x402 Protocol Payment
          </h3>
          <p className="text-xs font-mono text-[#C5A059]">
            Algorand TestNet On-Chain Authorization
          </p>
        </div>

        {/* Invoice Summary Box */}
        <div className="bg-[#112240] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">Service Item:</span>
            <span className="text-white font-semibold">AI Clause Audit & Rewording</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300 font-medium">Network:</span>
            <span className="text-[#C5A059] font-mono text-xs font-semibold">Algorand TestNet</span>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-slate-200 font-bold text-sm">Total Required:</span>
            <div className="text-right">
              <span className="text-2xl font-black text-[#C5A059] font-mono">{amount} {asset}</span>
              <span className="text-[10px] text-slate-400 font-mono block">Single Contract Scan</span>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-200 font-mono">
          <div className="flex items-center gap-2 bg-[#112240] p-2.5 rounded-xl border border-white/10">
            <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            <span>AI Risk Scan</span>
          </div>
          <div className="flex items-center gap-2 bg-[#112240] p-2.5 rounded-xl border border-white/10">
            <Lock size={16} className="text-[#C5A059] flex-shrink-0" />
            <span>On-Chain Verified</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-full btn-gold text-[#0A192F] font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#0A192F]" />
                <span>Executing Algorand Tx...</span>
              </>
            ) : (
              <>
                <span>Continue & Confirm Payment</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-full bg-transparent hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
