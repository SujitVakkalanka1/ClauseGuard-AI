import React, { useEffect } from 'react';
import { ShieldCheck, ExternalLink, X } from 'lucide-react';

interface PaymentSuccessToastProps {
  txid: string;
  amount?: number;
  onClose: () => void;
}

export const PaymentSuccessToast: React.FC<PaymentSuccessToastProps> = ({
  txid,
  amount = 0.001,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 8000); // Auto-dismiss after 8s
    return () => clearTimeout(timer);
  }, [onClose]);

  const shortTxid = txid && txid.length > 18 ? `${txid.substring(0, 10)}...${txid.substring(txid.length - 8)}` : txid || 'On-Chain Confirmed';
  const explorerUrl = txid ? `https://lora.algokit.io/testnet/transaction/${txid}` : 'https://lora.algokit.io/testnet';

  return (
    <div className="fixed top-28 right-6 z-[9999] max-w-md w-full bg-[#0A192F] text-white border-2 border-[#C5A059] rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in slide-in-from-top-5 fade-in duration-500 space-y-3 daylight-grid">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        title="Dismiss Notification"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
          <ShieldCheck size={22} className="text-emerald-400" />
        </div>

        <div className="space-y-1.5 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-[#C5A059] uppercase tracking-wider">
              x402 PAYMENT VERIFIED
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              TestNet Confirmed
            </span>
          </div>

          <h4 className="text-sm font-serif font-bold text-white">
            Algorand Micropayment Successful ({amount} ALGO)
          </h4>

          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Transaction confirmed on Algorand TestNet round block. Contract risk audit unlocked.
          </p>

          {txid && (
            <div className="pt-1 flex items-center gap-2 text-xs font-mono border-t border-white/10">
              <span className="text-slate-400">TxID:</span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5A059] hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>{shortTxid}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
