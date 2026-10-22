import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Percent, 
  ShoppingBag,
  LayoutGrid
} from 'lucide-react';
import { HERO_TEMPLATED_BANNERS, HeroBanner } from '../data/storeData';
import { 
  getCategoryIcon, 
  CategorySidebarItem, 
  getCachedCategories 
} from './HeroCategorySidebar';
import { storefrontProductsApi } from '../api';
import { 
  sortCategoriesByCanonicalSequence, 
  extractSubcategoriesFromCategory
} from '../utils/categorySequence';

export interface HeroProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectCategory }) => {
  // Static curated promo banners - uses the created high-resolution static banners
  const banners: HeroBanner[] = HERO_TEMPLATED_BANNERS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredCatIdx, setHoveredCatIdx] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);

  // Independent left sidebar categories - completely decoupled from banner carousel
  const [sidebarCategories, setSidebarCategories] = useState<CategorySidebarItem[]>(() => getCachedCategories());

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const totalBanners = banners.length;

  // Load dynamic categories for the left sidebar only
  useEffect(() => {
    storefrontProductsApi.getCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const dynamicItems: CategorySidebarItem[] = res.map((cat: any) => {
            const catId = cat.slug || cat._id || cat.id;
            const subcats: string[] = extractSubcategoriesFromCategory(cat, res);

            return {
              id: catId,
              name: cat.name,
              order: typeof cat.order === 'number' ? cat.order : undefined,
              targetSectionId: `section-${catId}`,
              icon: getCategoryIcon(cat.name, catId),
              subcategories: subcats,
            };
          });

          const sortedItems = sortCategoriesByCanonicalSequence(dynamicItems);
          setSidebarCategories(sortedItems);
        }
      })
      .catch((err) => {
        console.warn('Hero categories fetch error, keeping fallback:', err?.message);
      });
  }, []);

  // Clamp currentIndex if banners list size changes
  useEffect(() => {
    if (currentIndex >= banners.length && banners.length > 0) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

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

  // Touch swipe support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) handleNext();
    else if (diff < -45) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Preload banner images so transitions are instant
  useEffect(() => {
    banners.forEach((banner) => {
      if (banner.image) {
        const img = new Image();
        img.src = banner.image;
      }
    });
  }, [banners]);

  const currentBanner: HeroBanner = banners[currentIndex] || banners[0] || HERO_TEMPLATED_BANNERS[0];

  const handleBannerClick = (banner: HeroBanner) => {
    if (banner.categoryId) {
      onSelectCategory?.(banner.categoryId);
    }
    // Also smooth scroll down to category section if present on current view
    if (banner.targetClass) {
      const el = document.querySelector(`.${banner.targetClass}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (banner.categoryId) {
      const el = document.getElementById(banner.categoryId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const bannerVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.45 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0.9,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.45 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  return (
    <section
      className="relative isolate bg-gradient-to-b from-amber-50/40 via-white to-white py-3 sm:py-5 flex flex-col items-center justify-center border-b border-slate-200/80"
      aria-label="Apna Bharat Bazar Hero Slider"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
    >
      {/* Background festive ambient blur container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-6xl h-[280px] bg-gradient-to-r from-amber-200/30 via-orange-200/20 to-amber-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* =========================================================================
            DESKTOP 3-COLUMN HERO LAYOUT:
            [ Left: Explore By Category ]  [ Center: Banner Carousel ]  [ Right: Value Proposition Cards ]
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_240px] xl:grid-cols-[270px_1fr_250px] gap-3.5 xl:gap-4 items-stretch lg:h-[490px] xl:h-[510px]">
          
          {/* 1. LEFT OF HERO: "Explore By Category" Sidebar (Desktop) */}
          <aside
            className="hidden lg:flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-visible select-none h-full relative"
            aria-label="Explore By Category Menu"
            onMouseLeave={() => setHoveredCatIdx(null)}
          >
            {/* Header */}
            <div className="bg-[#121e36] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 rounded-t-2xl">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                <ShoppingBag className="w-4 h-4 text-[#A44101] stroke-[2.2]" />
                Explore By Category
              </span>
            </div>

            {/* Category List */}
            <ul className="flex-1 min-h-0 divide-y divide-slate-100 flex flex-col justify-between py-1">
              {sidebarCategories.map((cat, idx) => {
                const IconComponent = cat.icon || getCategoryIcon(cat.name || '', cat.id || '');
                const subcategories = cat.subcategories || [];
                const isHoveredItem = hoveredCatIdx === idx;

                return (
                  <li
                    key={cat.id}
                    className="flex-1 min-h-0 flex relative"
                    onMouseEnter={() => setHoveredCatIdx(idx)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (cat.id) {
                          onSelectCategory?.(cat.id);
                        }
                      }}
                      className={`w-full h-full px-3 py-1 flex items-center justify-between text-left transition-colors cursor-pointer group ${
                        isHoveredItem
                          ? 'bg-amber-50 text-[#A44101]'
                          : 'text-slate-700 hover:text-navy hover:bg-slate-50'
                      }`}
                      aria-label={`Browse ${cat.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isHoveredItem ? 'text-[#A44101]' : 'text-slate-500 group-hover:text-[#A44101]'
                        }`} />
                        <span className={`text-[11.5px] xl:text-[12px] truncate ${
                          isHoveredItem ? 'text-[#A44101] font-bold' : 'font-medium text-slate-800'
                        }`}>
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <ChevronRight className={`w-3.5 h-3.5 transition-all ${
                          isHoveredItem ? 'text-[#A44101] translate-x-0.5' : 'text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5'
                        }`} />
                      </div>
                    </button>

                    {/* Flyout panel on hover for subcategories */}
                    {isHoveredItem && subcategories && subcategories.length > 0 && (
                      <div
                        className={`absolute left-full ${
                          idx >= 5 ? 'bottom-0' : 'top-0'
                        } ml-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 z-50 flex flex-col justify-between animate-fadeIn before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']`}
                        onMouseEnter={() => setHoveredCatIdx(idx)}
                        onMouseLeave={() => setHoveredCatIdx(null)}
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                            <span className="text-xs font-bold text-navy uppercase tracking-wider">
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
                              Subcategories
                            </span>
                          </div>

                          <div className="space-y-1">
                            {subcategories.map((sub, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoveredCatIdx(null);
                                  if (cat.id) {
                                    onSelectCategory?.(cat.id, sub);
                                  }
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#A44101] hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                              >
                                <span>{sub}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5 transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHoveredCatIdx(null);
                              if (cat.id) {
                                onSelectCategory?.(cat.id);
                              }
                            }}
                            className="w-full text-center text-xs font-bold text-[#A44101] hover:underline cursor-pointer py-0.5 block"
                          >
                            Explore All {cat.name} &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Footer: View All Categories */}
            <div className="bg-slate-50 border-t border-slate-100 px-3.5 py-2 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => onSelectCategory?.('explore-all')}
                className="w-full flex items-center justify-between text-navy hover:text-[#A44101] transition-colors cursor-pointer text-xs font-bold"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#A44101]" />
                  <span>View All Categories</span>
                </span>
                <ArrowRight className="w-3 h-3 text-[#A44101]" />
              </button>
            </div>
          </aside>

          {/* 2. RIGHT OF HERO: Promotional Banner Carousel */}
          <div
            className="relative w-full h-[250px] sm:h-[380px] lg:h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200/90 bg-slate-900 select-none group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#A44101] shadow-lg border border-white/60 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#A44101]"
              aria-label="Previous category banner"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#A44101] shadow-lg border border-white/60 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#A44101]"
              aria-label="Next category banner"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>

            {/* Animated Banner Slide */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentBanner.id}
                onClick={() => handleBannerClick(currentBanner)}
                custom={direction}
                variants={bannerVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full block cursor-pointer overflow-hidden focus:outline-none"
                aria-label={currentBanner.alt}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBannerClick(currentBanner);
                  }
                }}
              >
                <img
                  src={currentBanner.image}
                  alt={currentBanner.alt}
                  className="w-full h-full object-cover sm:object-fill lg:object-cover"
                  loading="eager"
                />

                {/* Subtle hover gradient sheen */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            </AnimatePresence>

            {/* OfferWaleBaba Style Pill Indicators at Bottom Center */}
            <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 shadow-lg">
              {banners.map((banner, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`transition-all duration-300 rounded-full focus:outline-none ${
                      isActive
                        ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-[#A44101] shadow-xs'
                        : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/60 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${idx + 1}: ${banner.categoryName || banner.title}`}
                    aria-selected={isActive}
                    role="tab"
                  />
                );
              })}
            </div>

            {/* Quick Active Category Pill Tag Top Right */}
            <div className="absolute top-3 sm:top-5 right-3 sm:right-6 z-20 pointer-events-none hidden xs:flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentBanner.categoryName || 'Apna Bharat Bazar Deals'}</span>
            </div>
          </div>

          {/* 3. RIGHT OF HERO: Value Proposition Cards (Desktop) */}
          <aside
            className="hidden lg:flex flex-col justify-between gap-3 h-full select-none"
            aria-label="Store Value Guarantees"
          >
            {/* Card 1: Direct Factory Price */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all p-3.5 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Percent className="w-5 h-5 text-[#A44101]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-[13px] text-navy leading-tight truncate">
                  Direct Factory Price
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                  Wholesale rates for everyone
                </p>
              </div>
            </div>

            {/* Card 2: Pan India Shipping */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all p-3.5 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-[13px] text-navy leading-tight truncate">
                  Pan India Shipping
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                  Fast &amp; reliable delivery
                </p>
              </div>
            </div>

            {/* Card 3: 100% Quality Checked */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all p-3.5 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-[13px] text-navy leading-tight truncate">
                  100% Quality Checked
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                  Genuine verified items
                </p>
              </div>
            </div>

            {/* Card 4: Zero Minimum Order */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all p-3.5 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-[13px] text-navy leading-tight truncate">
                  Zero Minimum Order
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                  Buy 1 piece or bulk
                </p>
              </div>
            </div>
          </aside>

        </div>

        {/* =========================================================================
            CATEGORY QUICK-SELECTOR CHIPS (Mobile & Tablet < lg screens)
           ========================================================================= */}
        <div className="lg:hidden mt-3 sm:mt-4 w-full">
          <div className="flex items-center justify-between pb-1 px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#A44101]" />
              Explore By Category
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
            {sidebarCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.id) {
                    onSelectCategory?.(cat.id);
                  }
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 border bg-white hover:bg-amber-50/60 text-slate-700 hover:text-[#A44101] border-slate-200 hover:border-amber-300 shadow-xs cursor-pointer"
                title={`View ${cat.name}`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            TRUST & VALUE PROPOSITION STRIP (Mobile & Tablet < lg screens)
           ========================================================================= */}
        <div className="lg:hidden mt-3 sm:mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex items-center gap-2.5 hover:border-amber-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4 text-[#A44101]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-navy leading-tight truncate">Direct Factory Price</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Wholesale rates for everyone</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex items-center gap-2.5 hover:border-amber-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-navy leading-tight truncate">Pan India Shipping</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Fast & reliable delivery</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex items-center gap-2.5 hover:border-amber-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-navy leading-tight truncate">100% Quality Checked</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Genuine verified items</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex items-center gap-2.5 hover:border-amber-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-navy leading-tight truncate">Zero Minimum Order</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Buy 1 piece or bulk</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
