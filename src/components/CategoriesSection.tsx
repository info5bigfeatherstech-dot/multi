import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';

export interface CategoryCardData {
  id: string;
  name: string;
  imageUrl: string;
  bgColor?: string;
  overlayColor?: string;
  isExploreAll?: boolean;
}

export const CATEGORIES_DETAILED_DATA: CategoryCardData[] = [
  // 1. Home & Kitchen
  {
    id: "home-kitchen",
    name: "HOME & KITCHEN",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 2. Health & Personal Care
  {
    id: "beauty-personal-care",
    name: "HEALTH & PERSONAL CARE",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 3. Smart Gadgets
  {
    id: "smart-life-gadget",
    name: "SMART GADGETS",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 4. Home Improvement
  {
    id: "home-improvement",
    name: "HOME IMPROVEMENT",
    imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 5. Office Products
  {
    id: "stationary",
    name: "OFFICE PRODUCTS",
    imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 6. Sports & Fitness
  {
    id: "sports-fitness",
    name: "SPORTS & FITNESS",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 7. Car Accessories
  {
    id: "car-accessories",
    name: "CAR ACCESSORIES",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  // 8. Explore All Categories
  {
    id: "explore-all",
    name: "EXPLORE ALL CATEGORIES",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-[#A44101]/10",
    overlayColor: "bg-[#A44101]/15",
    isExploreAll: true,
  },
  // Additional categories revealed on expand
  {
    id: "fashion-world",
    name: "FASHION WORLD",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  {
    id: "cleaning-housekeeping",
    name: "CLEANING & HOUSEKEEPING",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  {
    id: "gifts",
    name: "TOYS & GAMES",
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  {
    id: "tours-travels",
    name: "BAGS & LUGGAGE",
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  {
    id: "baby-items",
    name: "BABY CARE",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
  {
    id: "mix-item",
    name: "MIX ITEM DEALS",
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
  },
];

export const CategoriesSection: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Listen for category selection events from Header or other links
  useEffect(() => {
    const handleCategoryEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const catId = customEvent.detail;
      const found = CATEGORIES_DETAILED_DATA.find((c) => c.id === catId);
      if (found) {
        setShowAll(true);
      }
    };
    window.addEventListener('select-category', handleCategoryEvent);
    return () => window.removeEventListener('select-category', handleCategoryEvent);
  }, []);

  const displayedCategories = showAll 
    ? CATEGORIES_DETAILED_DATA 
    : CATEGORIES_DETAILED_DATA.slice(0, 8);

  const handleCardClick = (category: CategoryCardData) => {
    if (category.isExploreAll) {
      setShowAll(true);
      return;
    }

    const targetSection = document.getElementById(`section-${category.id}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      const catalog = document.getElementById('top-categories');
      if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleViewMore = () => {
    if (showAll) {
      setShowAll(false);
      document.getElementById('top-categories')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowAll(true);
    }
  };

  return (
    <section 
      id="top-categories" 
      className="py-10 sm:py-14 bg-white border-b border-slate-200/80 relative"
      aria-labelledby="categories-showcase-heading"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Title on Left, "All categories ->" on Right */}
        <div className="flex flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 
              id="categories-showcase-heading" 
              className="text-xl sm:text-2xl lg:text-3xl font-medium text-slate-800 tracking-tight font-roboto capitalize"
            >
              Curated for retailers and shoppers
            </h2>
          </div>

          <div>
            <button
              type="button"
              onClick={handleToggleViewMore}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors group cursor-pointer"
            >
              <span>{showAll ? 'Show less' : 'All categories'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#A44101]" />
            </button>
          </div>
        </div>

        {/* 4-Column Responsive Grid (4x2 = 8 cards matching reference) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {displayedCategories.map((cat, idx) => (
            <CategoryCard 
              key={cat.id} 
              category={cat} 
              index={idx}
              shouldReduceMotion={shouldReduceMotion}
              onClick={() => handleCardClick(cat)}
            />
          ))}
        </div>

        {/* Bottom View More / Show Less Toggle Button */}
        <div className="flex justify-center mt-8 sm:mt-10">
          <button
            type="button"
            onClick={handleToggleViewMore}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white hover:bg-stone-50 text-navy border-2 border-stone-300 hover:border-navy text-xs sm:text-sm font-black tracking-wide transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-95 group"
            aria-expanded={showAll}
          >
            <span>
              {showAll 
                ? 'Show Less Categories' 
                : `View More Categories (${CATEGORIES_DETAILED_DATA.length - 8} More)`}
            </span>
            {showAll ? (
              <ChevronUp className="w-4 h-4 text-[#A44101] transition-transform group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#A44101] transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        </div>

      </div>
    </section>
  );
};

// Distinctive Flatlay Category Card Component Matching Reference Screenshot
interface CategoryCardProps {
  category: CategoryCardData;
  index: number;
  shouldReduceMotion: boolean | null;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  index, 
  shouldReduceMotion, 
  onClick 
}) => {
  return (
    <motion.div
      id={`category-card-${category.id}`}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: 0.3 }}
      whileHover={shouldReduceMotion ? {} : { y: -3, scale: 1.015 }}
      onClick={onClick}
      className={`group rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-200/90 hover:border-[#A44101]/40 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative aspect-[16/10] sm:aspect-[7/4] ${category.bgColor || 'bg-slate-100'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Explore ${category.name}`}
    >
      {/* 1. Flatlay Product Photography Background */}
      <img
        src={category.imageUrl}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        loading="lazy"
      />

      {/* 2. Soft Tint Overlay for consistent contrast */}
      <div 
        className={`absolute inset-0 ${category.overlayColor || 'bg-slate-900/10'} group-hover:bg-black/5 transition-colors`} 
      />

      {/* 3. Center Category Title */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 text-center z-10 pointer-events-none">
        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-slate-800 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] leading-tight max-w-[90%] font-roboto">
          {category.name}
        </h3>
      </div>

      {/* 4. Bottom-Left Circular Arrow Button matching reference screenshot */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 z-10">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white text-navy shadow-sm flex items-center justify-center group-hover:bg-[#A44101] group-hover:text-white transition-all duration-300">
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </motion.div>
  );
};
