import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowUpRight
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
    imageUrl: "/images/categories/electronics-and-gadgets.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["electronics-and-gadgets"],
  },
  // 2. Gifts & Lifestyle
  {
    id: "gifts-and-lifestyle",
    name: "GIFTS & LIFESTYLE",
    imageUrl: "/images/categories/gifts-and-lifestyle.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["gifts-and-lifestyle"],
  },
  // 3. Home & Living
  {
    id: "home-and-living",
    name: "HOME & LIVING",
    imageUrl: "/images/categories/home-and-living.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["home-and-living"],
  },
  // 4. Home Decor
  {
    id: "home-decor",
    name: "HOME DECOR",
    imageUrl: "/images/categories/home-decor.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["home-decor"],
  },
  // 5. Jewellery & Accessories
  {
    id: "jewellery-and-accessories",
    name: "JEWELLERY & ACCESSORIES",
    imageUrl: "/images/categories/jewellery-and-accessories.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["jewellery-and-accessories"],
  },
  // 6. Kitchen & Dining
  {
    id: "kitchen-and-dining",
    name: "KITCHEN & DINING",
    imageUrl: "/images/categories/kitchen-and-dining.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["kitchen-and-dining"],
  },
  // 7. Stationery, Office & School
  {
    id: "stationery-office-and-school",
    name: "STATIONERY, OFFICE & SCHOOL",
    imageUrl: "/images/categories/stationery-office-and-school.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["stationery-office-and-school"],
  },
  // 8. Travel & Outdoor
  {
    id: "travel-and-outdoor",
    name: "TRAVEL & OUTDOOR",
    imageUrl: "/images/categories/travel-and-outdoor.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["travel-and-outdoor"],
  },
  // 9. Sports & Fitness
  {
    id: "sports-and-fitness",
    name: "SPORTS & FITNESS",
    imageUrl: "/images/categories/sports-and-fitness.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["sports-and-fitness"],
  },
  // 10. Beauty & Personal Care
  {
    id: "beauty-and-personal-care",
    name: "BEAUTY & PERSONAL CARE",
    imageUrl: "/images/categories/beauty-and-personal-care.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["beauty-and-personal-care"],
  },
  // 11. Mix Items
  {
    id: "mix-items",
    name: "MIX ITEMS",
    imageUrl: "/images/categories/mix-items.jpg",
    bgColor: "bg-slate-900",
    overlayColor: "from-black/80 via-black/35 to-black/20",
    subcategories: CATEGORY_SUBCATEGORIES["mix-items"],
  },
  // 12. Explore All
  {
    id: "explore-all",
    name: "EXPLORE ALL CATEGORIES",
    imageUrl: "/images/categories/explore-all.jpg",
    bgColor: "bg-gradient-to-br from-[#A44101] to-[#6b2800]",
    overlayColor: "from-black/75 via-black/40 to-transparent",
    isExploreAll: true,
  },
];

interface CategoriesSectionProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
}) => {
  const displayedCategories = CATEGORIES_DETAILED_DATA;
  const shouldReduceMotion = useReducedMotion();

  const handleCardClick = (category: CategoryCardData, subcategory?: string) => {
    if (category.isExploreAll) {
      if (onSelectCategory) {
        onSelectCategory('explore-all');
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
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('explore-all');
                } else {
                  const catalog = document.querySelector('.section-top-categories');
                  if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors group cursor-pointer"
            >
              <span>All categories</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#A44101]" />
            </button>
          </div>
        </div>

        {/* 4-Column Responsive Grid displaying all category cards directly */}
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
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`category-card-${category.id} group rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-[#A44101]/50 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative aspect-[16/11] sm:aspect-[7/4.5] ${category.bgColor || 'bg-slate-900'}`}
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
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        loading="lazy"
      />

      {/* 2. Soft Tint Overlay for consistent contrast */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t ${category.overlayColor || 'from-black/80 via-black/35 to-black/20'} group-hover:from-black/85 group-hover:via-black/45 transition-colors`} 
      />

      {/* 3. Center Category Title */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4 text-center z-10">
        <h3 className="text-xs sm:text-sm md:text-[15px] lg:text-base font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] leading-tight max-w-[90%] font-roboto group-hover:scale-105 transition-transform duration-300">
          {category.name}
        </h3>
      </div>

      {/* 4. Bottom-Left Circular Arrow Button matching reference screenshot */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-10">
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 backdrop-blur-md text-slate-900 shadow-md flex items-center justify-center group-hover:bg-[#A44101] group-hover:text-white transition-all duration-300">
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </motion.div>
  );
};
