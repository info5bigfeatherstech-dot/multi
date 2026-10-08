import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface EssentialCard {
  id: string;
  line1: string;
  line2: string;
  image: string;
  targetId: string;
  badge?: string;
}

const ESSENTIAL_CARDS: EssentialCard[] = [
  {
    id: 'kitchen-utilities',
    line1: 'KITCHEN &',
    line2: 'COOKWARE',
    image: '/banners/kitchen_essentials.jpg',
    targetId: 'home-kitchen',
  },
  {
    id: 'smart-gadgets',
    line1: 'ON-THE-GO',
    line2: 'SMART GADGETS',
    image: '/banners/smart_gadgets.jpg',
    targetId: 'smart-life-gadget',
  },
  {
    id: 'fitness-active',
    line1: 'WORKOUT &',
    line2: 'FITNESS GEAR',
    image: '/banners/fitness_gear.jpg',
    targetId: 'sports-fitness',
  },
];

export const EverydayEssentialsSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const handleCardClick = (targetId: string) => {
    const targetElement = document.querySelector(`.section-${targetId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      const topCategories = document.querySelector('.section-top-categories');
      if (topCategories) {
        topCategories.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleAllCollectionsClick = () => {
    const topCategories = document.querySelector('.section-top-categories');
    if (topCategories) {
      topCategories.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="section-everyday-essentials py-10 sm:py-14 bg-stone-50/80 border-y border-slate-200/80 relative"
      aria-labelledby="essentials-heading"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header: Subtitle + Main Title on Left, Link on Right */}
        <div className="flex flex-row items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-roboto">
              SHOP THE MOMENT
            </span>
            <h2 
              id="essentials-heading" 
              className="text-2xl sm:text-3xl lg:text-3xl font-medium text-slate-800 tracking-tight font-roboto"
            >
              Everyday Essentials & More
            </h2>
          </div>

          <div>
            <button
              type="button"
              onClick={handleAllCollectionsClick}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors group cursor-pointer"
            >
              <span>All collections</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#A44101]" />
            </button>
          </div>
        </div>

        {/* 3 Wide Flatlay Cards Grid matching reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {ESSENTIAL_CARDS.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: shouldReduceMotion ? 0 : idx * 0.08, duration: 0.35 }}
              whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.015 }}
              onClick={() => handleCardClick(card.targetId)}
              className="group rounded-2xl lg:rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative aspect-[16/9] sm:aspect-[16/10] bg-slate-100"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(card.targetId);
                }
              }}
              aria-label={`Explore ${card.line1} ${card.line2}`}
            >
              {/* Product Flatlay Photography */}
              <img
                src={card.image}
                alt={`${card.line1} ${card.line2}`}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="lazy"
              />

              {/* Subtle Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

              {/* Center Typography */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 pointer-events-none">
                <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-slate-800 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] leading-tight font-roboto">
                  {card.line1}
                </span>
                <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-slate-800 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] leading-tight font-roboto">
                  {card.line2}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
