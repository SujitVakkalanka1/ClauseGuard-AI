import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#0A192F]/10 bg-[#0A192F] text-white py-8 mt-auto relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C5A059] flex items-center justify-center text-[#0A192F] font-bold text-sm shadow-md shadow-[#C5A059]/20">
            ✻
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-white tracking-tight block">ClauseGuard AI</span>
            <span className="text-xs text-slate-300">Powered by Algorand TestNet x402 Protocol & OpenAI / Gemini</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <a 
            href="https://lora.algokit.io/testnet" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1 hover:text-[#C5A059] transition-colors"
          >
            <span>Algorand Explorer</span>
            <ExternalLink size={12} />
          </a>
          <span>•</span>
          <a 
            href="https://lora.algokit.io/testnet/fund" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1 hover:text-[#C5A059] transition-colors"
          >
            <span>TestNet Dispenser</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
};
