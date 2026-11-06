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
}

const DIWALI_SLIDES: DiwaliSlide[] = [
  {
    id: 1,
    badge: 'DIWALI FESTIVE SPECIAL',
    headline: 'Home & Kitchen',
    subtext: 'Premium unbranded cookware, brass dining accents, and modern kitchenware to celebrate delicious Diwali feasts.',
    ctaText: 'Explore Home & Kitchen',
    categoryId: 'home-kitchen',
    image: '/banners/hero_home_kitchen.jpg',
  },
  {
    id: 2,
    badge: 'FESTIVE TECH DEALS',
    headline: 'Smart Life Gadgets',
    subtext: 'Minimalist smart wearables, sleek wireless audio, and modern charging utilities with warm festive illumination.',
    ctaText: 'Explore Smart Gadgets',
    categoryId: 'smart-gadgets',
    image: '/banners/hero_smart_gadgets.jpg',
  },
  {
    id: 3,
    badge: 'GENTLE FESTIVE CARE',
    headline: 'Baby Items',
    subtext: 'Soft pastel cotton garments, handcrafted wooden rattles, and gentle feeding essentials for little celebrations.',
    ctaText: 'Explore Baby Items',
    categoryId: 'baby-items',
    image: '/banners/hero_baby_items.jpg',
  },
  {
    id: 4,
    badge: 'CREATIVE ESSENTIALS',
    headline: 'Stationery',
    subtext: 'Handcrafted leather-bound journals, brass fountain pens, and aesthetic desk organizers with subtle diya bokeh.',
    ctaText: 'Explore Stationery',
    categoryId: 'stationery',
    image: '/banners/hero_stationery.jpg',
  },
  {
    id: 5,
    badge: 'DIWALI KI TAIYARI',
    headline: 'Cleaning & Housekeeping',
    subtext: 'Eco-friendly bamboo scrubbers, natural cleaning solutions, and microfiber sets for a spotless festive home.',
    ctaText: 'Explore Cleaning Hacks',
    categoryId: 'cleaning-housekeeping',
    image: '/banners/hero_cleaning.jpg',
  },
  {
    id: 6,
    badge: 'HEALTH & VITALITY',
    headline: 'Sports & Fitness',
    subtext: 'High-grade matte dumbbells, non-slip yoga mats, and hydration bottles to keep your fitness glowing this Diwali.',
    ctaText: 'Explore Fitness Gear',
    categoryId: 'sports-fitness',
    image: '/banners/hero_sports_fitness.jpg',
  },
  {
    id: 7,
    badge: 'FESTIVE HOMECOMING',
    headline: 'Tours & Travels',
    subtext: 'Durable spinner luggage, leather travel wallets, and packing organizers for seamless holiday journeys.',
    ctaText: 'Explore Travel Gear',
    categoryId: 'tours-travels',
    image: '/banners/hero_tours_travels.jpg',
  },
  {
    id: 8,
    badge: 'ETHNIC & CONTEMPORARY',
    headline: 'Fashion World',
    subtext: 'Zari silk scarves, handcrafted leather belts, blank-dial luxury watches, and golden clutch accessories.',
    ctaText: 'Explore Festive Fashion',
    categoryId: 'fashion-world',
    image: '/banners/hero_fashion_world.jpg',
  },
  {
    id: 9,
    badge: 'TRADITIONAL CELEBRATIONS',
    headline: 'Gifts & Hampers',
    subtext: 'Embossed golden gift boxes, brass pooja accessories, and luxury corporate dry fruit platters at wholesale rates.',
    ctaText: 'Explore Diwali Gifts',
    categoryId: 'gifts',
    image: '/banners/hero_gifts.jpg',
  },
  {
    id: 10,
    badge: 'FESTIVE SELF-CARE',
    headline: 'Beauty & Personal Care',
    subtext: 'Jade facial rollers, herbal grooming kits, and pure amber botanical oils to bring out your natural festive glow.',
    ctaText: 'Explore Personal Care',
    categoryId: 'beauty-personal-care',
    image: '/banners/hero_beauty.jpg',
  },
  {
    id: 11,
    badge: 'DIY & CRAFTSMANSHIP',
    headline: 'Home Improvement',
    subtext: 'Precision cordless tools, brass measuring gear, and smart home maintenance kits for all your festive upgrades.',
    ctaText: 'Explore Home Improvement',
    categoryId: 'home-improvement',
    image: '/banners/hero_home_improvement.jpg',
  },
  {
    id: 12,
    badge: 'AUTO CARE & TRAVEL',
    headline: 'Car Accessories',
    subtext: 'Magnetic 360° cockpit mounts, high-power mini vacuums, and interior ambient lighting for safe festive drives.',
    ctaText: 'Explore Car Accessories',
    categoryId: 'car-accessories',
    image: '/banners/hero_car_accessories.jpg',
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
            className="hidden lg:flex flex-col bg-white rounded-2xl border border-[#D4AF37]/40 shadow-sm overflow-visible select-none h-full relative"
            aria-label="Diwali Category Menu"
          >
            {/* Header with Diya */}
            <div className="p-3.5 bg-gradient-to-r from-[#7A0C1E] to-[#4A0512] rounded-t-2xl flex items-center justify-between border-b border-[#D4AF37]/50">
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

            {/* Category list */}
            <nav className="flex-1 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
              {sidebarCategories.map((cat, idx) => {
                const IconComponent = cat.icon;
                const isHovered = hoveredCatIdx === idx;

                return (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => setHoveredCatIdx(idx)}
                    onMouseLeave={() => setHoveredCatIdx(null)}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectCategory?.(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isHovered
                          ? 'bg-[#FFF8E7] text-[#7A0C1E] font-bold border border-[#D4AF37]/60 shadow-2xs'
                          : 'text-slate-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComponent className={`w-4 h-4 shrink-0 transition-colors ${isHovered ? 'text-[#FF8A00]' : 'text-slate-400'}`} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isHovered ? 'translate-x-1 text-[#FF8A00]' : 'text-slate-300'}`} />
                    </button>

                    {/* Subcategories Flyout */}
                    {isHovered && cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="absolute left-full top-0 ml-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#D4AF37]/40 p-3 z-50">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#7A0C1E] block mb-2 font-serif">
                          {cat.name} Specials
                        </span>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {cat.subcategories.map((sub, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => onSelectCategory?.(cat.id, sub)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-[#7A0C1E] hover:bg-[#FFF8E7] transition-colors truncate block cursor-pointer"
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
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

                {/* Subtle Neutral Left Gradient for Crisp Text Legibility (No red cover tint) */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent pointer-events-none" />

                {/* Slide Text Content with Staggered Framer Motion Animation */}
                <div className="absolute inset-0 p-6 sm:p-8 md:p-12 flex flex-col justify-center items-start max-w-2xl text-left z-20">
                  
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37] text-[#1B0B2E] text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md mb-3"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-[#1B0B2E]" />
                    <span>{currentSlide.badge}</span>
                  </motion.div>

                  {/* Headline in Elegant Display Serif */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white font-serif tracking-tight leading-tight mb-2 sm:mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                  >
                    {currentSlide.headline}
                  </motion.h1>

                  {/* Subtext */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3 }}
                    className="text-xs sm:text-sm md:text-base text-white/95 max-w-lg mb-5 sm:mb-7 leading-relaxed font-sans drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
                  >
                    {currentSlide.subtext}
                  </motion.p>

                  {/* CTA Button with Gold Shimmer & Fireworks Burst Trigger */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    type="button"
                    onClick={(e) => handleCtaClick(e, currentSlide.categoryId)}
                    className="group relative inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] via-[#FFC107] to-[#D4AF37] hover:from-[#FFA000] hover:to-[#FFD54F] text-[#1B0B2E] text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
                  >
                    <span>{currentSlide.ctaText}</span>
                    <ArrowRight className="w-4 h-4 text-[#1B0B2E] group-hover:translate-x-1.5 transition-transform" />
                  </motion.button>
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
          <aside className="hidden lg:flex flex-col gap-3 h-full select-none justify-between">
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
