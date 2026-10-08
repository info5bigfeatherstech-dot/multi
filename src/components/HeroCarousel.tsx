import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Truck, Award, ShoppingCart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HERO_SLIDES, HeroSlide } from '../data/storeData';

export const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = HERO_SLIDES.length;

  // Auto-slide every 4 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, totalSlides]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Mobile swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext(); // swipe left -> next slide
    } else if (diff < -45) {
      handlePrev(); // swipe right -> prev slide
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide: HeroSlide = HERO_SLIDES[currentIndex];

  // Motion variants for smooth slide and fade
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <div
      className="relative w-full max-w-lg mx-auto select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Today's featured hot deals carousel"
    >
      {/* Decorative Subtle Glow Behind Carousel */}
      <div 
        className="absolute -inset-4 bg-[#A44101]/10 rounded-full blur-2xl -z-10 pointer-events-none transform -translate-y-2 scale-95" 
        aria-hidden="true" 
      />

      {/* Floating Chip 1: Overlapping Top-Left corner */}
      <div className="absolute -top-3.5 left-4 z-20 flex items-center gap-1.5 bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-navy-light/60">
        <Truck className="w-3.5 h-3.5 text-[#A44101]" />
        <span>{currentSlide.floatingTag1}</span>
      </div>

      {/* Floating Chip 2: Overlapping Top-Right corner */}
      <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1.5 bg-[#A44101] text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md border border-[#A44101]">
        <Award className="w-3.5 h-3.5 text-white" />
        <span>{currentSlide.floatingTag2}</span>
      </div>

      {/* Main Slide Card Container */}
      <div className="bg-white rounded-theme-lg p-5 sm:p-7 shadow-soft border border-slate-100 relative overflow-hidden min-h-[460px] flex flex-col justify-between">
        
        {/* Animated Slide Content */}
        <div className="relative flex-1 flex flex-col justify-between">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col h-full justify-between"
            >
              {/* Product Visual Area */}
              <div className="relative w-full h-56 sm:h-64 rounded-theme bg-slate-100 overflow-hidden group">
                
                {/* Large Pulsing Discount Badge */}
                <div className="absolute top-2 left-2 z-10 bg-[#A44101] text-white text-xs sm:text-sm font-black px-3 py-1.5 rounded-theme shadow-md flex items-center gap-1 animate-discount-pulse">
                  <Zap className="w-3.5 h-3.5 fill-current text-white" />
                  <span>{currentSlide.discountBadge}</span>
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-2 left-2 z-10 bg-white/95 text-navy text-xs font-bold px-2.5 py-1 rounded-theme shadow-sm border border-slate-200 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#A44101] text-[#A44101]" />
                  <span>{currentSlide.rating}</span>
                  <span className="text-slate-400 font-normal">({currentSlide.reviewCount})</span>
                </div>

                {/* Stock alert pill */}
                <div className="absolute bottom-2 right-2 z-10 bg-slate-100 text-navy text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">
                  ⚡ In Stock
                </div>

                {/* Product Photo */}
                <img
                  src={currentSlide.image}
                  alt={currentSlide.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="eager"
                />
              </div>

              {/* Product Info & Pricing Row */}
              <div className="pt-4 mt-1">
                <div className="text-[11px] font-bold text-[#A44101] uppercase tracking-wider mb-1">
                  {currentSlide.category}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-charcoal line-clamp-1 leading-snug">
                  {currentSlide.title}
                </h3>

                <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
                      ₹{currentSlide.currentPrice}
                    </span>
                    <span className="text-sm sm:text-base text-slate-400 line-through font-medium">
                      ₹{currentSlide.originalPrice}
                    </span>
                    <span className="text-xs font-bold text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded">
                      Save ₹{currentSlide.originalPrice - currentSlide.currentPrice}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="hidden sm:flex items-center gap-1.5 bg-[#A44101] hover:bg-[#8C3701] text-white px-3.5 py-2 rounded-theme text-xs font-extrabold shadow-sm transition-transform active:scale-95"
                    aria-label={`Buy ${currentSlide.title} now at ₹${currentSlide.currentPrice}`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Grab Deal</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Footer: Prev/Next & Dots Indicator */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
          
          {/* Slide Indicator Dots */}
          <div className="flex items-center space-x-2" role="tablist" aria-label="Slides">
            {HERO_SLIDES.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-7 bg-[#A44101]'
                      : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  aria-selected={isActive}
                  role="tab"
                />
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-full border border-slate-200 bg-white text-navy hover:bg-slate-50 hover:text-[#A44101] transition-colors shadow-sm focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-full border border-slate-200 bg-white text-navy hover:bg-slate-50 hover:text-[#A44101] transition-colors shadow-sm focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
