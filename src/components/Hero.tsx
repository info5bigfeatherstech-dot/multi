import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Percent, 
  ShoppingBag,
  LayoutGrid,
  RotateCcw
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
  const [trackIndex, setTrackIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredCatIdx, setHoveredCatIdx] = useState<number | null>(null);

  // Extended banners for seamless infinite hardware-accelerated carousel
  const extendedBanners = [
    banners[banners.length - 1],
    ...banners,
    banners[0],
  ];

  // Derived real index (0..4) for indicators and metadata
  const activeRealIndex = ((trackIndex - 1) % banners.length + banners.length) % banners.length;

  // Refs for high-frequency pointer interaction without re-render lag
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const hasMovedRef = useRef(false);

  // Independent left sidebar categories - completely decoupled from banner carousel
  const [sidebarCategories, setSidebarCategories] = useState<CategorySidebarItem[]>(() => getCachedCategories());

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

  // Preload and decode banner images so transitions are instant
  useEffect(() => {
    banners.forEach((banner) => {
      if (banner.image) {
        const img = new Image();
        img.src = banner.image;
        if ('decode' in img) {
          img.decode().catch(() => {});
        }
      }
    });
  }, [banners]);

  // Smooth infinite slide navigation
  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev + 1);
  };

  const goToSlide = (realIdx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTrackIndex(realIdx + 1);
  };

  // Seamless infinite loop wrap
  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== trackRef.current) return;
    setIsTransitioning(false);
    setTrackIndex((current) => {
      if (current >= banners.length + 1) {
        return 1;
      }
      if (current <= 0) {
        return banners.length;
      }
      return current;
    });
  };

  // Autoplay (5s), pauses on hover, drag, or hidden tab
  useEffect(() => {
    if (isPaused || isDragging || isTransitioning) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setIsTransitioning(true);
      setTrackIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, isDragging, isTransitioning, banners.length]);

  // Pointer (Mouse + Touch) Gesture Handlers for real-time 1:1 hardware drag
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on arrows, dots, or buttons, ignore pointer drag completely
    if ((e.target as HTMLElement)?.closest('button, a')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDraggingRef.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartTime.current = Date.now();
    hasMovedRef.current = false;
    setIsDragging(true);
    setIsTransitioning(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;

    if (!hasMovedRef.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        // Vertical scroll dominates
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragOffset(0);
        return;
      }
      if (Math.abs(dx) > 6) {
        hasMovedRef.current = true;
        try {
          (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
        } catch (_) {}
      }
    }

    if (hasMovedRef.current) {
      setDragOffset(dx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // If releasing on arrows, dots, or buttons, ignore pointer drag click
    if ((e.target as HTMLElement)?.closest('button, a')) {
      isDraggingRef.current = false;
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    } catch (_) {}

    const totalDist = Math.hypot(e.clientX - dragStartX.current, e.clientY - dragStartY.current);
    const dx = e.clientX - dragStartX.current;
    const dt = Date.now() - dragStartTime.current;
    const velocity = Math.abs(dx) / Math.max(dt, 1);
    setDragOffset(0);

    // If total movement is under 12px, it is a pure click -> open category deals
    if (totalDist < 12) {
      handleBannerClick(banners[activeRealIndex]);
      return;
    }

    // Only swipe if there was deliberate horizontal gesture:
    // Distance > 60px OR (Distance > 35px with flick velocity > 0.6)
    if (dx < -60 || (dx < -35 && velocity > 0.6)) {
      // Swiped Left -> Next
      setIsTransitioning(true);
      setTrackIndex((prev) => prev + 1);
    } else if (dx > 60 || (dx > 35 && velocity > 0.6)) {
      // Swiped Right -> Prev
      setIsTransitioning(true);
      setTrackIndex((prev) => prev - 1);
    } else {
      // Snap back smoothly
      if (Math.abs(dx) > 0) {
        setIsTransitioning(true);
      }
    }
  };

  const handlePointerCancel = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
    setIsTransitioning(true);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

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

  return (
    <section
      className="relative isolate bg-gradient-to-b from-amber-50/40 via-white to-white py-3 sm:py-5 flex flex-col items-center justify-center border-b border-slate-200/80"
      aria-label="Hero Promotional Slider"
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
            className="hidden lg:flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-visible h-full relative"
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
                const hasSubcategories = Boolean(cat.subcategories && cat.subcategories.length > 0);
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
                        {hasSubcategories ? (
                          <ChevronRight className={`w-3.5 h-3.5 transition-all ${
                            isHoveredItem ? 'text-[#A44101] translate-x-0.5' : 'text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5'
                          }`} />
                        ) : (
                          <ArrowRight className={`w-3.5 h-3.5 transition-all ${
                            isHoveredItem ? 'text-[#A44101] translate-x-0.5' : 'text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5'
                          }`} />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Subcategories Flyout on the Right */}
            {hoveredCatIdx !== null && sidebarCategories[hoveredCatIdx]?.subcategories && sidebarCategories[hoveredCatIdx].subcategories!.length > 0 && (() => {
              const activeCat = sidebarCategories[hoveredCatIdx];
              const isLowerHalf = hoveredCatIdx >= 5;

              return (
                <div
                  className={`absolute left-full ${
                    isLowerHalf ? 'bottom-0' : 'top-0'
                  } ml-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 z-50 flex flex-col justify-between animate-fadeIn before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']`}
                  onMouseEnter={() => setHoveredCatIdx(hoveredCatIdx)}
                  onMouseLeave={() => setHoveredCatIdx(null)}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-xs font-bold text-navy uppercase tracking-wider truncate">
                        {activeCat.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded shrink-0">
                        Subcategories
                      </span>
                    </div>

                    <div className="space-y-1 max-h-[320px] overflow-y-auto">
                      {activeCat.subcategories!.map((sub, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredCatIdx(null);
                            if (activeCat.id) {
                              onSelectCategory?.(activeCat.id, sub);
                            }
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#A44101] hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate">{sub}</span>
                          <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5 transition-all shrink-0" />
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
                        if (activeCat.id) {
                          onSelectCategory?.(activeCat.id);
                        }
                      }}
                      className="w-full text-center text-xs font-bold text-[#A44101] hover:underline cursor-pointer py-0.5 block"
                    >
                      Explore All {activeCat.name} &rarr;
                    </button>
                  </div>
                </div>
              );
            })()}

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

          {/* 2. RIGHT OF HERO: Hardware-Accelerated Continuous Infinite Banner Carousel */}
          <div
            ref={containerRef}
            className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-full rounded-xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200/90 bg-slate-900 group select-none touch-pan-y"
            style={{
              contain: 'paint',
              isolation: 'isolate',
              transform: 'translate3d(0, 0, 0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              setIsPaused(false);
              if (isDraggingRef.current) {
                handlePointerCancel();
              }
            }}
            onDragStart={(e) => e.preventDefault()}
          >
            {/* Seamless Infinite Slider Track */}
            <div
              ref={trackRef}
              className="flex h-full w-full select-none"
              style={{
                transform: `translate3d(calc(-${trackIndex * 100}% + ${dragOffset}px), 0, 0)`,
                transition: isTransitioning
                  ? 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
                willChange: 'transform',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedBanners.map((banner, bIdx) => (
                <div
                  key={`${banner.id}-${bIdx}`}
                  className="w-full h-full shrink-0 relative overflow-hidden select-none"
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                  }}
                >
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="w-full h-full object-cover sm:object-fill lg:object-cover pointer-events-none select-none"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {/* Left Arrow Button */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-[#A44101] shadow-lg border border-white/60 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A44101]"
              aria-label="Previous category banner"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>

            {/* Right Arrow Button */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-[#A44101] shadow-lg border border-white/60 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A44101]"
              aria-label="Next category banner"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </button>

            {/* OfferWaleBaba Style Pill Indicators at Bottom Center */}
            <div
              className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/70 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 shadow-lg"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              {banners.map((banner, idx) => {
                const isActive = idx === activeRealIndex;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToSlide(idx);
                    }}
                    className={`transition-all duration-300 rounded-full focus:outline-none cursor-pointer ${
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
          </div>

          {/* 3. RIGHT OF HERO: Value Proposition Cards (Desktop) */}
          <aside
            className="hidden lg:flex flex-col justify-between gap-3 h-full"
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

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 sm:p-3 flex items-center gap-2.5 hover:border-amber-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-[#A44101]/10 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4 text-[#A44101]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-navy leading-tight truncate">7-Day Easy Replacement</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">Hassle-free support on verified damaged items</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
