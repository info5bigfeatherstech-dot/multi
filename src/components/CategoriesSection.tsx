import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { CATEGORY_SUBCATEGORIES } from '../data/storeData';

export interface CategoryCardData {
  id: string;
  name: string;
  imageUrl: string;
  bgColor?: string;
  overlayColor?: string;
  isExploreAll?: boolean;
  subcategories?: string[];
}

export const CATEGORIES_DETAILED_DATA: CategoryCardData[] = [
  // 1. Home & Kitchen
  {
    id: "home-kitchen",
    name: "HOME & KITCHEN",
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["home-kitchen"],
  },
  // 2. Smart Life Gadgets
  {
    id: "smart-life-gadget",
    name: "SMART LIFE GADGETS",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["smart-life-gadget"],
  },
  // 3. Baby Items
  {
    id: "baby-items",
    name: "BABY ITEMS",
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["baby-items"],
  },
  // 4. Stationery
  {
    id: "stationary",
    name: "STATIONERY",
    imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["stationary"],
  },
  // 5. Cleaning & Housekeeping
  {
    id: "cleaning-housekeeping",
    name: "CLEANING & HOUSEKEEPING",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["cleaning-housekeeping"],
  },
  // 6. Sports & Fitness
  {
    id: "sports-fitness",
    name: "SPORTS & FITNESS",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["sports-fitness"],
  },
  // 7. Car Accessories
  {
    id: "car-accessories",
    name: "CAR ACCESSORIES",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["car-accessories"],
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
  // 9. Tours & Travels
  {
    id: "tours-travels",
    name: "TOURS & TRAVELS",
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["tours-travels"],
  },
  // 10. Fashion World
  {
    id: "fashion-world",
    name: "FASHION WORLD",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["fashion-world"],
  },
  // 11. Gifts
  {
    id: "gifts",
    name: "GIFTS",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["gifts"],
  },
  // 12. Beauty & Personal Care
  {
    id: "beauty-personal-care",
    name: "BEAUTY & PERSONAL CARE",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["beauty-personal-care"],
  },
  // 13. Home Improvement
  {
    id: "home-improvement",
    name: "HOME IMPROVEMENT",
    imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["home-improvement"],
  },
  // 14. Corporate Gifting
  {
    id: "corporate-gifting",
    name: "CORPORATE GIFTING",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["corporate-gifting"],
  },
  // 15. Mix Item Deals
  {
    id: "mix-item",
    name: "MIX ITEM DEALS",
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["mix-item"],
  },
];

interface CategoriesSectionProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
}) => {
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

  const handleCardClick = (category: CategoryCardData, subcategory?: string) => {
    if (category.isExploreAll) {
      if (onSelectCategory) {
        onSelectCategory('explore-all');
      } else {
        setShowAll(true);
      }
      return;
    }

    if (onSelectCategory) {
      onSelectCategory(category.id, subcategory);
    } else {
      const targetSection = document.querySelector(`.section-${category.id}`);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        const catalog = document.querySelector('.section-top-categories');
        if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleToggleViewMore = () => {
    if (showAll) {
      setShowAll(false);
      document.querySelector('.section-top-categories')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setShowAll(true);
    }
  };

  return (
    <section 
      className="section-top-categories py-10 sm:py-14 bg-white border-b border-slate-200/80 relative"
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
              Shop By Category
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
              onSelectSubcategory={(sub) => handleCardClick(cat, sub)}
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

// Distinctive Flatlay Category Card Component Matching Reference Screenshot with Subcategories
interface CategoryCardProps {
  category: CategoryCardData;
  index: number;
  shouldReduceMotion: boolean | null;
  onClick: () => void;
  onSelectSubcategory?: (subcategory: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  index, 
  shouldReduceMotion, 
  onClick,
  onSelectSubcategory,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: 0.3 }}
      whileHover={shouldReduceMotion ? {} : { y: -3, scale: 1.015 }}
      onClick={onClick}
      className={`category-card-${category.id} group rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-200/90 hover:border-[#A44101]/40 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative aspect-[16/11] sm:aspect-[7/4.5] ${category.bgColor || 'bg-slate-100'}`}
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
        className={`absolute inset-0 ${category.overlayColor || 'bg-slate-900/15'} group-hover:bg-slate-950/25 transition-colors`} 
      />

      {/* 3. Center Category Title & Subcategories Chips */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2.5 sm:p-3.5 text-center z-10">
        <h3 className="text-xs sm:text-sm md:text-[15px] lg:text-base font-bold text-slate-900 uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] leading-tight max-w-[92%] font-roboto">
          {category.name}
        </h3>

        {/* Subcategories tags */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-[96%]">
            {category.subcategories.slice(0, 3).map((sub, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSubcategory?.(sub);
                }}
                className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold bg-white/90 hover:bg-white text-slate-800 hover:text-[#A44101] shadow-2xs backdrop-blur-xs transition-all hover:scale-105 cursor-pointer"
                title={`Shop ${sub}`}
              >
                {sub}
              </span>
            ))}
            {category.subcategories.length > 3 && (
              <span className="px-1 sm:px-1.5 py-0.5 rounded-md text-[8.5px] sm:text-[9.5px] font-bold bg-white/80 text-slate-700 shadow-2xs">
                +{category.subcategories.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom-Left Circular Arrow Button matching reference screenshot */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-navy shadow-sm flex items-center justify-center group-hover:bg-[#A44101] group-hover:text-white transition-all duration-300">
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </motion.div>
  );
};
