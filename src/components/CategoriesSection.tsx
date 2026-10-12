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
  // 1. Electronics & Gadgets
  {
    id: "electronics-and-gadgets",
    name: "ELECTRONICS & GADGETS",
    imageUrl: "https://res.cloudinary.com/wo5f58fu/image/upload/v1790061569/categories/cards/electronics-and-gadgets-card-6ab20435a4ded8a3ec745887-1790061565303.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["electronics-and-gadgets"],
  },
  // 2. Gifts & Lifestyle
  {
    id: "gifts-and-lifestyle",
    name: "GIFTS & LIFESTYLE",
    imageUrl: "https://pub-b2f1be61e9c24db698b3c80da875965b.r2.dev/products/2026/07/love-pearl-chain-necklace-v-2633-1-img-0-1784529134136.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["gifts-and-lifestyle"],
  },
  // 3. Home & Living
  {
    id: "home-and-living",
    name: "HOME & LIVING",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873051/products/zip-color-naphthalene-balls-2929-1-i0-1788873050768.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["home-and-living"],
  },
  // 4. Home Decor
  {
    id: "home-decor",
    name: "HOME DECOR",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873051/products/zip-color-naphthalene-balls-2929-1-i0-1788873050768.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["home-decor"],
  },
  // 5. Jewellery & Accessories
  {
    id: "jewellery-and-accessories",
    name: "JEWELLERY & ACCESSORIES",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873024/products/zip-reusable-car-cleaning-gloves-2920-1-i0-1788873024777.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["jewellery-and-accessories"],
  },
  // 6. Kitchen & Dining
  {
    id: "kitchen-and-dining",
    name: "KITCHEN & DINING",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873047/products/zip-toothbrush-protector-cap-cover-2928-1-i0-1788873047623.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["kitchen-and-dining"],
  },
  // 7. Stationery, Office & School
  {
    id: "stationery-office-and-school",
    name: "STATIONERY, OFFICE & SCHOOL",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873009/products/zip-touch-soap-dispenser-for-kitchen-2915-1-i0-1788873009205.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["stationery-office-and-school"],
  },
  // 8. Travel & Outdoor
  {
    id: "travel-and-outdoor",
    name: "TRAVEL & OUTDOOR",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873033/products/zip-toothbrush-case-pack-of-5-2923-1-i0-1788873033558.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["travel-and-outdoor"],
  },
  // 9. Sports & Fitness
  {
    id: "sports-and-fitness",
    name: "SPORTS & FITNESS",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1778499343/categories/sports-and-fitness-69b7990226573d44aced3a4a-1778499341777.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["sports-and-fitness"],
  },
  // 10. Beauty & Personal Care
  {
    id: "beauty-and-personal-care",
    name: "BEAUTY & PERSONAL CARE",
    imageUrl: "https://pub-b2f1be61e9c24db698b3c80da875965b.r2.dev/categories/2026/06/beauty-and-personal-care-6a196ffad1c7c35896eaca75-1780309850852.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["beauty-and-personal-care"],
  },
  // 11. Mix Items
  {
    id: "mix-items",
    name: "MIX ITEMS",
    imageUrl: "https://res.cloudinary.com/dejsxuhnk/image/upload/v1778502352/categories/mix-items-1778502351223.webp",
    bgColor: "bg-slate-100",
    overlayColor: "bg-slate-900/10",
    subcategories: CATEGORY_SUBCATEGORIES["mix-items"],
  },
  // 12. Explore All
  {
    id: "explore-all",
    name: "EXPLORE ALL CATEGORIES",
    imageUrl: "https://res.cloudinary.com/wo5f58fu/image/upload/v1790061569/categories/cards/electronics-and-gadgets-card-6ab20435a4ded8a3ec745887-1790061565303.webp",
    bgColor: "bg-[#A44101]/10",
    overlayColor: "bg-[#A44101]/15",
    isExploreAll: true,
  },
];

interface CategoriesSectionProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
}) => {
  const [showAll, setShowAll] = useState(false);
  const categoriesList = CATEGORIES_DETAILED_DATA;
  const shouldReduceMotion = useReducedMotion();

  // Shop By Category cards remain static as requested

  // Listen for category selection events from Header or other links
  useEffect(() => {
    const handleCategoryEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const catId = customEvent.detail;
      const found = categoriesList.find((c) => c.id === catId);
      if (found) {
        setShowAll(true);
      }
    };
    window.addEventListener('select-category', handleCategoryEvent);
    return () => window.removeEventListener('select-category', handleCategoryEvent);
  }, [categoriesList]);

  const displayedCategories = showAll 
    ? categoriesList 
    : categoriesList.slice(0, 8);

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
  onClick,
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

      {/* 3. Center Category Title */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2.5 sm:p-3.5 text-center z-10">
        <h3 className="text-xs sm:text-sm md:text-[15px] lg:text-base font-bold text-slate-900 uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] leading-tight max-w-[92%] font-roboto">
          {category.name}
        </h3>
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
