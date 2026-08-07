import React from 'react';
import { RiskLevel } from '@/lib/types';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold rounded-full gap-1',
    md: 'px-3 py-1 text-sm font-semibold rounded-full gap-1.5',
    lg: 'px-4 py-1.5 text-base font-bold rounded-full gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  if (level === 'High') {
    return (
      <span className={`inline-flex items-center bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30 backdrop-blur-md shadow-sm ${sizeClasses[size]}`}>
        <AlertTriangle size={iconSizes[size]} className="text-[#FB7185]" />
        High Risk
      </span>
    );
  }

  if (level === 'Medium') {
    return (
      <span className={`inline-flex items-center bg-amber-400/10 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-sm ${sizeClasses[size]}`}>
        <AlertCircle size={iconSizes[size]} className="text-amber-300" />
        Medium Risk
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30 backdrop-blur-md shadow-sm ${sizeClasses[size]}`}>
      <CheckCircle size={iconSizes[size]} className="text-[#2DD4BF]" />
      Low Risk
    </span>
  );
};
