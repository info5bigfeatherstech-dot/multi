import React from 'react';
import { DiyaGlow } from './DiyaGlow';

interface DiwaliDividerProps {
  className?: string;
}

export const DiwaliDivider: React.FC<DiwaliDividerProps> = ({ className = 'my-8 sm:my-12' }) => {
  return (
    <div
      className={`w-full max-w-4xl mx-auto flex items-center justify-center gap-4 px-4 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Left Gold Gradient Line */}
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />

      {/* Center Diya with subtle glow */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[#D4AF37] text-xs">✦</span>
        <DiyaGlow size="sm" />
        <span className="text-[#D4AF37] text-xs">✦</span>
      </div>

      {/* Right Gold Gradient Line */}
      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#D4AF37]/60 to-[#D4AF37]" />
    </div>
  );
};

