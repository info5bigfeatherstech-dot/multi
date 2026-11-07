import React from 'react';
import { Sparkles /*, Truck */ } from 'lucide-react';
import { DiyaGlow } from './DiyaGlow';

export const DiwaliAnnouncementBar: React.FC = () => {
  return (
    <div
      className="bg-[#7A0C1E] text-white text-xs sm:text-[13px] py-1.5 sm:py-2 px-2.5 sm:px-4 border-b border-[#D4AF37]/50 relative z-40 overflow-hidden shadow-xs"
      role="region"
      aria-label="Festive Diwali Announcement"
    >
      {/* Soft Shimmer Sweep Overlay */}
      <div className="absolute inset-0 diwali-shimmer opacity-40 pointer-events-none" />

      <div className="w-full max-w-[1560px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Desktop Left: Festive Greetings with Diya */}
        <div className="hidden md:flex items-center space-x-2 text-[#FFE082] font-semibold">
          <DiyaGlow size="sm" />
          <span className="tracking-wide">Shubh Deepavali 2026</span>
        </div>

        {/* Center: Main Festive Announcement */}
        <div className="w-full md:w-auto flex items-center justify-center gap-2 text-center">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD54F] shrink-0 animate-pulse" />
          <span className="font-extrabold tracking-wide text-white text-[11px] sm:text-xs leading-tight">
            Happy Diwali! Festive Sale Live — <span className="text-[#FFD54F]">Up to 50% OFF</span> + Free Pan-India Delivery
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#FFD54F] shrink-0 animate-pulse" />
        </div>

        {/* Desktop Right: Fast Dispatch Guarantee (Commented Out) */}
        {/*
        <div className="hidden md:flex items-center space-x-2 text-[#FFE082] text-xs font-semibold">
          <Truck className="w-3.5 h-3.5 text-[#FFC107]" />
          <span>Guaranteed Pre-Diwali Dispatch</span>
        </div>
        */}
        <div className="hidden md:block w-36" aria-hidden="true" />
      </div>
    </div>
  );
};

