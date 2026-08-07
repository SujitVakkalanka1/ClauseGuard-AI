import React from 'react';
import { 
  FileText, 
  Coins, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface ProcessingProgressProps {
  currentStep: number;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ currentStep }) => {
  const steps = [
    { id: 1, name: 'Extracting PDF & Document Text', icon: FileText },
    { id: 2, name: 'Executing Algorand TestNet x402 Payment', icon: Coins },
    { id: 3, name: 'Analyzing Contract via Pydantic AI Schema', icon: Cpu },
    { id: 4, name: 'Evaluating Risk Scores & Safe Phrasing', icon: ShieldCheck },
  ];

  return (
    <div className="w-full max-w-xl mx-auto bg-[#0A192F] text-white rounded-3xl p-8 border border-[#C5A059]/40 space-y-6 shadow-2xl daylight-grid">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] mb-4 animate-bounce">
          <Loader2 size={32} className="animate-spin text-[#C5A059]" />
        </div>
        <h3 className="text-2xl font-serif text-white">
          AI Risk Scanner in Progress
        </h3>
        <p className="text-xs font-mono text-[#C5A059] mt-1">
          Secured by Algorand TestNet x402 Protocol
        </p>
      </div>

      {/* Progress Steps List */}
      <div className="space-y-3 pt-2">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                isCurrent
                  ? 'bg-[#112240] border-[#C5A059] text-white shadow-lg scale-[1.02]'
                  : isCompleted
                  ? 'bg-[#112240]/60 border-emerald-500/30 text-slate-300'
                  : 'bg-[#112240]/30 border-white/5 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : isCurrent
                      ? 'bg-[#C5A059] text-[#0A192F] font-bold border-[#C5A059]'
                      : 'bg-slate-900 text-slate-600 border-slate-800'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <span className="text-xs font-mono font-bold">{step.id}</span>
                  )}
                </div>
                <span className={`text-xs font-mono font-semibold ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {step.name}
                </span>
              </div>

              {isCurrent && (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] font-semibold animate-pulse border border-[#C5A059]/30">
                  Processing...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
