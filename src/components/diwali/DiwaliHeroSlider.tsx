import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag
} from 'lucide-react';
import { DiyaGlow } from './DiyaGlow';
import { FairyLights } from './FairyLights';
import { Lanterns } from './Lanterns';
import { FallingPetals } from './FallingPetals';
import { triggerFireworksBurst } from './FireworksBurst';
import { 
  getCategoryIcon, 
  CategorySidebarItem, 
  getCachedCategories 
} from '../HeroCategorySidebar';
import { storefrontProductsApi } from '../../api';
import { 
  sortCategoriesByCanonicalSequence, 
  extractSubcategoriesFromCategory 
} from '../../utils/categorySequence';

export interface DiwaliHeroSliderProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
}

interface DiwaliSlide {
  id: number;
  badge: string;
  headline: string;
  subtext: string;
  ctaText: string;
  categoryId: string;
  image: string;
  discountOffer: string;
  priceStarting: string;
  mrpStrike: string;
  dealBadge: string;
  perks: string[];
}

const DIWALI_SLIDES: DiwaliSlide[] = [
  {
    id: 1,
    badge: 'DIWALI MEGA SALE',
    headline: 'Home & Kitchen',
    discountOffer: 'FLAT 70% OFF',
    priceStarting: '₹149',
    mrpStrike: '₹499',
    dealBadge: '🔥 Festive Bestseller',
    subtext: 'Direct factory cookware, brass dining accents & airtight storage at wholesale prices.',
    ctaText: 'Shop Kitchen Deals',
    categoryId: 'home-kitchen',
    image: '/banners/hero_home_kitchen.jpg',
    perks: ['⚡ 24h Factory Dispatch', '🏷️ Direct Factory Rates', '📦 Minimum Order ₹0'],
  },
  {
    id: 2,
    badge: 'TECH DHAMAKA FEST',
    headline: 'Smart Life Gadgets',
    discountOffer: 'UP TO 75% OFF',
    priceStarting: '₹199',
    mrpStrike: '₹799',
    dealBadge: '⚡ Trending Electronics',
    subtext: 'High-speed wireless chargers, smart wearables & audio accessories with warranty.',
    ctaText: 'Claim Gadget Deals',
    categoryId: 'smart-gadgets',
    image: '/banners/hero_smart_gadgets.jpg',
    perks: ['🔋 Fast Charging', '🛡️ Quality Tested', '🚚 Pan-India Shipping'],
  },
  {
    id: 3,
    badge: 'GENTLE CARE DEALS',
    headline: 'Baby Items & Care',
    discountOffer: 'FLAT 60% OFF',
    priceStarting: '₹99',
    mrpStrike: '₹299',
    dealBadge: '👶 Mommy Choice',
    subtext: '100% organic cotton essentials, safe feeding utilities & certified infant developmental toys.',
    ctaText: 'Explore Baby Offers',
    categoryId: 'baby-items',
    image: '/banners/hero_baby_items.jpg',
    perks: ['🌿 Certified Safe', '📦 Bulk Value Packs', '⚡ Priority Dispatch'],
  },
  {
    id: 4,
    badge: 'WHOLESALE STATIONERY',
    headline: 'Stationery & Office',
    discountOffer: 'UP TO 65% OFF',
    priceStarting: '₹49',
    mrpStrike: '₹199',
    dealBadge: '📚 Bulk School & Desk',
    subtext: 'Artisan notebooks, metallic pens, desk tidy organizers & school stationery bundles.',
    ctaText: 'Grab Stationery Deals',
    categoryId: 'stationery',
    image: '/banners/hero_stationery.jpg',
    perks: ['🏷️ Wholesale Pricing', '📦 Bulk Packs', '🚚 Safe Transit'],
  },
  {
    id: 5,
    badge: 'DIWALI KI TAIYARI',
    headline: 'Cleaning & Housekeeping',
    discountOffer: 'FLAT 65% OFF',
    priceStarting: '₹79',
    mrpStrike: '₹249',
    dealBadge: '✨ Festive Essential',
    subtext: 'Heavy-duty microfiber mops, bamboo brushes & storage racks for an effortless clean.',
    ctaText: 'Shop Cleaning Hacks',
    categoryId: 'cleaning-housekeeping',
    image: '/banners/hero_cleaning.jpg',
    perks: ['🧼 High Durability', '⚡ 24h Dispatch', '🏷️ Factory Direct'],
  },
  {
    id: 6,
    badge: 'FITNESS DHAMAKA',
    headline: 'Sports & Fitness',
    discountOffer: 'UP TO 70% OFF',
    priceStarting: '₹129',
    mrpStrike: '₹499',
    dealBadge: '💪 High Performance',
    subtext: 'Anti-slip textured yoga mats, resistance bands & sports shakers to stay active.',
    ctaText: 'Explore Fitness Gear',
    categoryId: 'sports-fitness',
    image: '/banners/hero_sports_fitness.jpg',
    perks: ['🏋️ Heavy-Duty Grip', '📦 Bulk Gym Packs', '⚡ Fast Delivery'],
  },
  {
    id: 7,
    badge: 'HOLIDAY TRAVEL SALE',
    headline: 'Tours & Travels',
    discountOffer: 'FLAT 60% OFF',
    priceStarting: '₹149',
    mrpStrike: '₹499',
    dealBadge: '✈️ Travel Ready',
    subtext: 'Lightweight spinner luggage, document organizers & memory foam travel pillows.',
    ctaText: 'Explore Travel Deals',
    categoryId: 'tours-travels',
    image: '/banners/hero_tours_travels.jpg',
    perks: ['🧳 Factory Direct', '🔒 Heavy Duty Locks', '⚡ Quick Delivery'],
  },
  {
    id: 8,
    badge: 'FESTIVE ETHNIC SALE',
    headline: 'Fashion World',
    discountOffer: 'UP TO 75% OFF',
    priceStarting: '₹199',
    mrpStrike: '₹799',
    dealBadge: '👗 Festive Trending',
    subtext: 'Zari-bordered stoles, luxury designer clutches, classic watches & festive accessories.',
    ctaText: 'Claim Fashion Deals',
    categoryId: 'fashion-world',
    image: '/banners/hero_fashion_world.jpg',
    perks: ['✨ Handcrafted Finish', '🚚 Free Delivery', '🏷️ Wholesale Rates'],
  },
  {
    id: 9,
    badge: 'CORPORATE & GIFTING',
    headline: 'Gifts & Hampers',
    discountOffer: 'FLAT 70% OFF',
    priceStarting: '₹199',
    mrpStrike: '₹699',
    dealBadge: '🎁 Festive Gifting',
    subtext: 'Luxury dry fruit boxes, brass pooja platters & custom branded corporate gift sets.',
    ctaText: 'Explore Gift Hampers',
    categoryId: 'gifts',
    image: '/banners/hero_gifts.jpg',
    perks: ['💼 Corporate GST Invoicing', '🏷️ Volume Tiers', '🚚 Pan-India Shipping'],
  },
  {
    id: 10,
    badge: 'NATURAL GLOW FEST',
    headline: 'Beauty & Personal Care',
    discountOffer: 'UP TO 65% OFF',
    priceStarting: '₹99',
    mrpStrike: '₹349',
    dealBadge: '🌸 Customer Favorite',
    subtext: 'Pure jade facial rollers, herbal grooming kits & botanical oils for radiant skin.',
    ctaText: 'Shop Beauty Deals',
    categoryId: 'beauty-personal-care',
    image: '/banners/hero_beauty.jpg',
    perks: ['🌿 100% Certified', '⚡ 24h Dispatch', '🏷️ Direct Wholesale'],
  },
  {
    id: 11,
    badge: 'DIY & TOOLS EXPO',
    headline: 'Home Improvement',
    discountOffer: 'FLAT 60% OFF',
    priceStarting: '₹149',
    mrpStrike: '₹499',
    dealBadge: '🛠️ Pro Hardware',
    subtext: 'Cordless electric screwdrivers, precision toolkit sets & smart household repair gear.',
    ctaText: 'Shop Tool Deals',
    categoryId: 'home-improvement',
    image: '/banners/hero_home_improvement.jpg',
    perks: ['⚡ High Torque', '🛡️ Quality Guaranteed', '📦 Factory Direct'],
  },
  {
    id: 12,
    badge: 'AUTO CARE DHAMAKA',
    headline: 'Car Accessories',
    discountOffer: 'UP TO 70% OFF',
    priceStarting: '₹129',
    mrpStrike: '₹449',
    dealBadge: '🚗 Driver Pick',
    subtext: '360° magnetic cockpit mounts, high-power mini car vacuums & interior ambient lighting.',
    ctaText: 'Grab Auto Deals',
    categoryId: 'car-accessories',
    image: '/banners/hero_car_accessories.jpg',
    perks: ['⚡ Same Day Dispatch', '🔌 High Power Suction', '🏷️ Wholesale Rates'],
  },
];

export const DiwaliHeroSlider: React.FC<DiwaliHeroSliderProps> = ({ onSelectCategory }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();

  // Category sidebar state
  const [sidebarCategories, setSidebarCategories] = useState<CategorySidebarItem[]>(() => getCachedCategories());
  const [hoveredCatIdx, setHoveredCatIdx] = useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Load categories for left sidebar
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
        console.warn('Diwali Hero categories fetch fallback:', err?.message);
      });
  }, []);

  // Autoplay (5s), pauses on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % DIWALI_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Preload slide images
  useEffect(() => {
    DIWALI_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + DIWALI_SLIDES.length) % DIWALI_SLIDES.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % DIWALI_SLIDES.length);
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

  // Touch Swipe
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

  const handleCtaClick = (e: React.MouseEvent, categoryId: string) => {
    triggerFireworksBurst(e);
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    // Also scroll down smoothly to target category section if exists
    const el = document.getElementById(categoryId) || document.getElementById(`section-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentSlide = DIWALI_SLIDES[currentIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : (dir > 0 ? '100%' : '-100%'),
      opacity: shouldReduceMotion ? 1 : 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.5 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : (dir > 0 ? '-100%' : '100%'),
      opacity: shouldReduceMotion ? 1 : 0.8,
      transition: {
        x: { type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.5 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  return (
    <section
      className="relative isolate bg-gradient-to-b from-[#FFF8E7] via-white to-[#FFF8E7]/40 py-3 sm:py-5 flex flex-col items-center justify-center border-b border-[#D4AF37]/30"
      aria-label="Diwali Festive Hero Slider"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decorative Twinkling Fairy Lights across the very top of Hero */}
      <FairyLights />

      {/* Decorative Hanging Akash Kandil Lanterns (Left & Right) */}
      <Lanterns />

      {/* Falling Marigold Petals Layer */}
      <FallingPetals />

      {/* Main Container */}
      <div className="w-full max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        
        {/* Desktop 3-Column Layout: [Left Sidebar] [Hero Slider] [Right Value Cards] */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_240px] xl:grid-cols-[270px_1fr_250px] gap-3.5 xl:gap-4 items-stretch lg:h-[490px] xl:h-[510px]">
          
          {/* 1. LEFT OF HERO: Category Navigation Sidebar with Diwali Accents */}
          <aside
            className="hidden lg:flex flex-col bg-white rounded-2xl border border-[#D4AF37]/40 shadow-sm overflow-visible h-full relative"
            aria-label="Diwali Category Menu"
            onMouseLeave={() => setHoveredCatIdx(null)}
          >
            {/* Header with Diya */}
            <div className="p-3.5 bg-gradient-to-r from-[#7A0C1E] to-[#4A0512] rounded-t-2xl flex items-center justify-between border-b border-[#D4AF37]/50 shrink-0">
              <div className="flex items-center gap-2">
                <DiyaGlow size="sm" />
                <span className="text-xs font-black text-[#FFF8E7] tracking-wider uppercase font-serif">
                  Festive Catalog
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF8A00] text-white px-2 py-0.5 rounded-full shadow-2xs">
                DIWALI
              </span>
            </div>

            {/* Category list - Fitted to height without inner scrollbars */}
            <nav className="flex-1 min-h-0 flex flex-col justify-between p-1.5">
              {sidebarCategories.map((cat, idx) => {
                const IconComponent = cat.icon;
                const isHovered = hoveredCatIdx === idx;
                const hasSubcategories = Boolean(cat.subcategories && cat.subcategories.length > 0);

                return (
                  <div
                    key={cat.id}
                    className="flex-1 min-h-0 flex items-center relative"
                    onMouseEnter={() => setHoveredCatIdx(idx)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setHoveredCatIdx(null);
                        onSelectCategory?.(cat.id);
                      }}
                      className={`w-full h-full flex items-center justify-between px-3 py-1 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isHovered
                          ? 'bg-[#FFF8E7] text-[#7A0C1E] font-bold border border-[#D4AF37]/60 shadow-2xs'
                          : 'text-slate-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComponent className={`w-3.5 h-3.5 shrink-0 transition-colors ${isHovered ? 'text-[#FF8A00]' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {hasSubcategories ? (
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isHovered ? 'translate-x-0.5 text-[#FF8A00]' : 'text-slate-300'}`} />
                      ) : (
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isHovered ? 'translate-x-0.5 text-[#FF8A00]' : 'text-slate-300'}`} />
                      )}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* 3. Subcategories Dropdown / Flyout on the Right */}
            {hoveredCatIdx !== null && sidebarCategories[hoveredCatIdx]?.subcategories && sidebarCategories[hoveredCatIdx].subcategories!.length > 0 && (() => {
              const activeCat = sidebarCategories[hoveredCatIdx];
              const isLowerHalf = hoveredCatIdx >= 5;

              return (
                <div
                  className={`absolute left-full ${
                    isLowerHalf ? 'bottom-0' : 'top-0'
                  } ml-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/60 p-4 z-50 flex flex-col justify-between animate-fadeIn before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-3 before:content-['']`}
                  onMouseEnter={() => setHoveredCatIdx(hoveredCatIdx)}
                  onMouseLeave={() => setHoveredCatIdx(null)}
                >
                  <div>
                    {/* Header with Diya and Subcategories badge */}
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2 truncate">
                        <DiyaGlow size="sm" />
                        <span className="text-xs font-black text-[#7A0C1E] uppercase tracking-wider font-serif truncate">
                          {activeCat.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF8A00]/15 text-[#FF8A00] px-2 py-0.5 rounded-full shrink-0">
                        Subcategories
                      </span>
                    </div>

                    {/* Subcategories clickable list */}
                    <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                      {activeCat.subcategories!.map((sub, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setHoveredCatIdx(null);
                            onSelectCategory?.(activeCat.id, sub);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#7A0C1E] hover:bg-[#FFF8E7] transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate">{sub}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Explore All */}
                  <div className="pt-2.5 border-t border-[#D4AF37]/30 mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setHoveredCatIdx(null);
                        onSelectCategory?.(activeCat.id);
                      }}
                      className="w-full text-center text-xs font-bold text-[#7A0C1E] hover:text-[#FF8A00] transition-colors cursor-pointer py-1 block font-serif"
                    >
                      Explore All in {activeCat.name} →
                    </button>
                  </div>
                </div>
              );
            })()}
          </aside>

          {/* 2. CENTER: The 12 Templated Banner Slides */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-[#D4AF37]/60 h-[360px] sm:h-[430px] lg:h-full bg-slate-900">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentSlide.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 w-full h-full"
              >
                {/* Background Image with High Resolution and Cover fit */}
                <img
                  src={currentSlide.image}
                  alt={currentSlide.headline}
                  className="w-full h-full object-cover object-center"
                />

                {/* Subtle Neutral Left Gradient for Crisp Commercial Billboard Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent sm:w-3/4 pointer-events-none" />

                {/* 1. Floating Commercial Retail Sale Burst Badge (Top-Right) */}
                <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-30 pointer-events-none select-none hidden xs:block">
                  <div className="bg-gradient-to-br from-red-600 via-[#B91C1C] to-amber-500 text-white rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl border-2 border-amber-300/60 flex flex-col items-center text-center backdrop-blur-xs">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-200 block">
                      FESTIVE DHAMAKA
                    </span>
                    <span className="text-xs sm:text-base font-black tracking-tight leading-none text-white drop-shadow-sm mt-0.5">
                      {currentSlide.discountOffer}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-amber-100 uppercase tracking-wider block mt-0.5">
                      LIMITED TIME DEAL
                    </span>
                  </div>
                </div>

                {/* 2. Slide Commercial Selling Text Content */}
                <div className="absolute inset-0 p-5 sm:p-8 md:p-10 flex flex-col justify-center items-start max-w-2xl text-left z-20">
                  
                  {/* Category & Sale Tag Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="inline-flex items-center gap-2 mb-2 sm:mb-2.5"
                  >
                    <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-[#1B0B2E] text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 fill-[#1B0B2E]" />
                      <span>{currentSlide.badge}</span>
                    </span>
                  </motion.div>

                  {/* Headline in Elegant Commercial Display Serif */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white font-serif tracking-tight leading-tight mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                  >
                    {currentSlide.headline}
                  </motion.h1>

                  {/* Commercial Price & Savings Row (Vibe of Selling) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="flex items-center gap-2 sm:gap-2.5 flex-wrap my-2 sm:my-2.5"
                  >
                    {/* Big Discount Pill */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[11px] sm:text-xs tracking-wide shadow-md border border-white/20">
                      <Tag className="w-3 h-3" />
                      <span>{currentSlide.discountOffer}</span>
                    </div>

                    {/* Starting Price with Strike-through */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-xs">
                      <span className="text-[10px] sm:text-[11px] text-slate-300">Starts @</span>
                      <span className="text-xs sm:text-sm font-black text-[#FFD54F]">{currentSlide.priceStarting}</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">{currentSlide.mrpStrike}</span>
                    </div>

                    {/* Deal of the Day Urgency Pill */}
                    <div className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] sm:text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{currentSlide.dealBadge}</span>
                    </div>
                  </motion.div>

                  {/* Subtext */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3 }}
                    className="text-xs sm:text-sm text-white/90 max-w-lg mb-4 sm:mb-5 leading-relaxed font-sans drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
                  >
                    {currentSlide.subtext}
                  </motion.p>

                  {/* CTA Button with Gold Shimmer & Fireworks Burst Trigger */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    type="button"
                    onClick={(e) => handleCtaClick(e, currentSlide.categoryId)}
                    className="group relative inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#FFC107] to-[#D4AF37] hover:from-[#FFA000] hover:to-[#FFD54F] text-[#1B0B2E] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
                  >
                    <span>{currentSlide.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-[#1B0B2E] group-hover:translate-x-1.5 transition-transform" />
                  </motion.button>

                  {/* Retail Urgency & Trust Perks Strip */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.4 }}
                    className="hidden sm:flex items-center gap-2 flex-wrap mt-3.5"
                  >
                    {currentSlide.perks.map((perk, pIdx) => (
                      <span
                        key={pIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/45 backdrop-blur-xs text-white/95 text-[10px] sm:text-[11px] font-semibold border border-white/10"
                      >
                        <span>{perk}</span>
                      </span>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#1B0B2E]/70 hover:bg-[#7A0C1E] text-[#D4AF37] hover:text-white border border-[#D4AF37]/50 flex items-center justify-center backdrop-blur-xs transition-all shadow-md z-30 cursor-pointer active:scale-90"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#1B0B2E]/70 hover:bg-[#7A0C1E] text-[#D4AF37] hover:text-white border border-[#D4AF37]/50 flex items-center justify-center backdrop-blur-xs transition-all shadow-md z-30 cursor-pointer active:scale-90"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Slide Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
              {DIWALI_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`transition-all rounded-full cursor-pointer ${
                    currentIndex === idx
                      ? 'w-7 sm:w-8 h-2 bg-[#D4AF37] shadow-md'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* 3. RIGHT OF HERO: Festive Value Proposition Cards (Desktop) */}
          <aside className="hidden lg:flex flex-col gap-3 h-full justify-between">
            {/* Card 1: Festive Guarantee */}
            <div className="flex-1 bg-gradient-to-br from-[#FFF8E7] to-white rounded-2xl p-4 border border-[#D4AF37]/40 shadow-xs flex flex-col justify-center items-start text-left relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#7A0C1E]/10 flex items-center justify-center text-[#7A0C1E] mb-2.5">
                <ShieldCheck className="w-5 h-5 text-[#7A0C1E]" />
              </div>
              <h3 className="text-xs font-black text-[#7A0C1E] uppercase tracking-wider font-serif">
                Authentic Quality
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                100% verified festive catalog directly from artisan hubs &amp; certified vendors.
              </p>
              <div className="diwali-corner-br" />
            </div>

            {/* Card 2: Festive Fast Dispatch */}
            <div className="flex-1 bg-gradient-to-br from-[#FFF8E7] to-white rounded-2xl p-4 border border-[#D4AF37]/40 shadow-xs flex flex-col justify-center items-start text-left relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#FF8A00]/10 flex items-center justify-center text-[#FF8A00] mb-2.5">
                <Truck className="w-5 h-5 text-[#FF8A00]" />
              </div>
              <h3 className="text-xs font-black text-[#7A0C1E] uppercase tracking-wider font-serif">
                Priority Dispatch
              </h3>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Dispatched within 24 hours to guarantee arrival well before Diwali rituals.
              </p>
              <div className="diwali-corner-br" />
            </div>

            {/* Card 3: Festive B2B & Bulk */}
            <div className="flex-1 bg-gradient-to-br from-[#1B0B2E] to-[#2D0F47] rounded-2xl p-4 border border-[#D4AF37]/60 shadow-md flex flex-col justify-center items-start text-left text-white relative overflow-hidden">
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#D4AF37] text-[#1B0B2E] px-1.5 py-0.2 rounded font-mono">
                  CORPORATE
                </span>
                <Tag className="w-3.5 h-3.5 text-[#FFD54F]" />
              </div>
              <h3 className="text-xs font-black text-[#FFE082] uppercase tracking-wider font-serif">
                Bulk Festive Gifting
              </h3>
              <p className="text-[11px] text-[#FFF8E7]/80 mt-1 leading-snug">
                Custom hampers, company logo branding, &amp; volume discounts starting ₹3,000.
              </p>
              <div className="diwali-corner-tl" />
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
};
