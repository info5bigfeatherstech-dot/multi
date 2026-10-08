import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_TEMPLATED_BANNERS, HeroBanner } from '../data/storeData';
import { HeroCategorySidebar } from './HeroCategorySidebar';
import { HeroGstCard } from './HeroGstCard';

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const totalBanners = HERO_TEMPLATED_BANNERS.length;

  // Auto-advance banner every 4.5 seconds
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % totalBanners);
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, totalBanners]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  };

  const goToSlide = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) handleNext();
    else if (diff < -40) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Preload all promotional banner images so transitions are instant
  useEffect(() => {
    HERO_TEMPLATED_BANNERS.forEach((banner) => {
      const img = new Image();
      img.src = banner.image;
    });
  }, []);

  const currentBanner: HeroBanner = HERO_TEMPLATED_BANNERS[currentIndex];

  const bannerVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.42 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 1,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.42 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <section
      className="relative isolate bg-white py-3 sm:py-5 flex flex-col items-center justify-center overflow-hidden border-b border-slate-200"
      aria-label="Hero Section"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
    >
      {/* Background Soft Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[60vh] bg-slate-100/70 rounded-full blur-3xl -z-10 pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Main Container */}
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================================================
            DESKTOP 3-COLUMN HERO LAYOUT:
            [ Left: Shop By Category ]  [ Center: Hero Carousel ]  [ Right: 3 Value Cards ]
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] xl:grid-cols-[260px_1fr_260px] gap-3.5 xl:gap-4 items-stretch lg:h-[485px]">
          
          {/* 1. LEFT OF HERO: "Shop By Category" Sidebar (Desktop) */}
          <div className="hidden lg:block h-full">
            <HeroCategorySidebar />
          </div>

          {/* 2. CENTER OF HERO: Promotional Banner Carousel */}
          <div
            className="relative h-[250px] sm:h-[380px] lg:h-full min-h-[250px] rounded-2xl overflow-hidden shadow-soft border border-slate-200/90 bg-white select-none group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Prev Arrow */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-navy hover:text-[#A44101] shadow-md hover:shadow-lg border border-white/60 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer backdrop-blur-xs focus:outline-none"
              aria-label="Previous promotional banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-navy hover:text-[#A44101] shadow-md hover:shadow-lg border border-white/60 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer backdrop-blur-xs focus:outline-none"
              aria-label="Next promotional banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Animated Banner Slide */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.a
                key={currentBanner.id}
                href={currentBanner.linkUrl}
                custom={direction}
                variants={bannerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full block cursor-pointer overflow-hidden focus:outline-none"
                aria-label={currentBanner.alt}
              >
                <img
                  src={currentBanner.image}
                  alt={currentBanner.alt}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </motion.a>
            </AnimatePresence>

            {/* Dots Indicator Overlay at Bottom Center */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full">
              {HERO_TEMPLATED_BANNERS.map((banner, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'w-6 bg-[#A44101]' : 'w-2 bg-white/70 hover:bg-white'
                    }`}
                    aria-label={`Go to Banner ${idx + 1}`}
                    aria-selected={isActive}
                    role="tab"
                  />
                );
              })}
            </div>
          </div>

          {/* 3. RIGHT OF HERO: The 3 Value Guarantee Cards (Desktop) */}
          <div className="hidden lg:block h-full">
            <HeroGstCard />
          </div>

        </div>

        {/* =========================================================================
            TABLET & MOBILE RESPONSIVE SECTION (Below Banner on screens < 1024px)
           ========================================================================= */}
        {/* Tablet: 2-column layout */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4 mt-4">
          <div className="h-[460px]">
            <HeroCategorySidebar />
          </div>
          <div className="h-[460px]">
            <HeroGstCard />
          </div>
        </div>

        {/* Mobile: 3 Value Cards Row + Category Sidebar */}
        <div className="block md:hidden mt-3 space-y-3">
          {/* 3 Value Cards side by side */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-2 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full bg-[#A44101]/10 flex items-center justify-center mb-1">
                <span className="text-[#A44101] font-bold text-xs">🏷️</span>
              </div>
              <h4 className="font-extrabold text-[11px] text-navy leading-tight">Lowest Prices</h4>
              <p className="text-[9.5px] text-slate-500 mt-0.5">On Everything</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-2 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                <span className="text-navy font-bold text-xs">📄</span>
              </div>
              <h4 className="font-extrabold text-[11px] text-navy leading-tight">GST Inclusive</h4>
              <p className="text-[9.5px] text-slate-500 mt-0.5">No extra fee</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-2 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full bg-[#A44101]/10 flex items-center justify-center mb-1">
                <span className="text-[#A44101] font-bold text-xs">📦</span>
              </div>
              <h4 className="font-extrabold text-[11px] text-navy leading-tight">No MOQ</h4>
              <p className="text-[9.5px] text-slate-500 mt-0.5">Buy 1 or 1,000</p>
            </div>
          </div>

          {/* Category Sidebar on Mobile */}
          <div className="h-[450px]">
            <HeroCategorySidebar />
          </div>
        </div>

      </div>
    </section>
  );
};
