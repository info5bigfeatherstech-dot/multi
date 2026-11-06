import React, { useState, useEffect } from 'react';
import { DiyaGlow } from './DiyaGlow';
import { Sparkles, Clock } from 'lucide-react';
import { DIWALI_CONFIG } from '../../config/diwaliConfig';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const DiwaliCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => {
    const target = new Date(DIWALI_CONFIG.saleEndDate).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const target = new Date(DIWALI_CONFIG.saleEndDate).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const format2Digits = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full bg-[#1B0B2E] text-white py-3 sm:py-3.5 border-y-2 border-[#D4AF37]/50 relative overflow-hidden shadow-md">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#7A0C1E]/60 via-[#1B0B2E] to-[#7A0C1E]/60 pointer-events-none" />

      {/* Shimmer sweep */}
      <div className="absolute inset-0 diwali-shimmer opacity-30 pointer-events-none" />

      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        
        {/* Left: Festive Headline with Diyas */}
        <div className="flex items-center gap-3">
          <DiyaGlow size="sm" />
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[#FFD54F] text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FFC107]" />
                Diwali Mahabachat Sale
              </span>
              <span className="hidden sm:inline-block bg-[#FF8A00] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                Limited Time
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white/90 font-serif">
              Flat 50% Off On Festive Catalog &amp; Corporate Hampers
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#D4AF37] font-bold uppercase tracking-wider mr-1 hidden sm:flex">
            <Clock className="w-3.5 h-3.5 text-[#FFC107]" />
            <span>Offer Ends In:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { val: format2Digits(timeLeft.days), lbl: 'DAYS' },
              { val: format2Digits(timeLeft.hours), lbl: 'HRS' },
              { val: format2Digits(timeLeft.minutes), lbl: 'MIN' },
              { val: format2Digits(timeLeft.seconds), lbl: 'SEC' },
            ].map((unit, idx) => (
              <React.Fragment key={unit.lbl}>
                <div className="flex flex-col items-center bg-[#2A1145] border border-[#D4AF37]/50 rounded-lg px-2 sm:px-2.5 py-1 min-w-[42px] sm:min-w-[48px] shadow-inner">
                  <span className="text-sm sm:text-base font-black text-[#FFF8E7] leading-none font-mono">
                    {unit.val}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-[#FFD54F] font-bold tracking-wider mt-0.5">
                    {unit.lbl}
                  </span>
                </div>
                {idx < 3 && <span className="text-[#D4AF37] font-black text-sm">:</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

