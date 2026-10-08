import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Tv, Shirt, ChefHat, Gamepad2, ArrowUpRight } from 'lucide-react';
import { DEAL_STRIP_CATEGORIES, DealCategoryTile } from '../data/storeData';

export const DealStrip: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const getCategoryIcon = (iconName: DealCategoryTile['iconName']) => {
    switch (iconName) {
      case 'Tv':
        return <Tv className="w-5 h-5 text-[#A44101] group-hover:text-white transition-colors" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5 text-[#A44101] group-hover:text-white transition-colors" />;
      case 'ChefHat':
        return <ChefHat className="w-5 h-5 text-[#A44101] group-hover:text-white transition-colors" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-[#A44101] group-hover:text-white transition-colors" />;
      default:
        return <Tv className="w-5 h-5 text-[#A44101] group-hover:text-white transition-colors" />;
    }
  };

  return (
    <section
      className="py-6 sm:py-8 bg-white border-b border-slate-200"
      aria-label="Category Quick Deals"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Deal Strip Header Subtitle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A44101]" />
            <h2 className="text-sm sm:text-base font-bold text-navy uppercase tracking-wider">
              Popular Discount Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              document.querySelector('.section-top-categories')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explore All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Cards in a row on desktop, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {DEAL_STRIP_CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.id}
              onClick={() => {
                const targetEl = document.querySelector(`.category-card-${cat.id}`) || document.querySelector(`.section-${cat.id}`) || document.querySelector('.section-top-categories');
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
              }}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.35 + idx * 0.08,
                duration: 0.35,
              }}
              whileHover={shouldReduceMotion ? {} : { y: -6 }}
              className="group bg-white rounded-theme p-4 sm:p-5 border border-slate-200/80 shadow-soft hover:shadow-soft-hover hover:border-[#A44101]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer focus:outline-none"
              aria-label={`${cat.title} Deals: ${cat.discountLabel}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const targetEl = document.querySelector(`.category-card-${cat.id}`) || document.querySelector(`.section-${cat.id}`) || document.querySelector('.section-top-categories');
                  if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-theme bg-[#A44101]/10 border border-[#A44101]/20 flex items-center justify-center group-hover:bg-[#A44101] group-hover:text-white transition-colors duration-200">
                  {getCategoryIcon(cat.iconName)}
                </div>
                
                {/* Sale Pill */}
                <span className="bg-[#A44101]/10 text-[#A44101] text-[11px] font-black px-2 py-0.5 rounded border border-[#A44101]/20">
                  {cat.discountLabel}
                </span>
              </div>

              <div className="mt-3 sm:mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-navy group-hover:text-[#A44101] transition-colors">
                    {cat.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {cat.itemCountText}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
