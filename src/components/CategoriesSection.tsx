import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowUpRight
} from 'lucide-react';
import { CATEGORY_SUBCATEGORIES } from '../data/storeData';
import { storefrontProductsApi } from '../api';
import { sortCategoriesByCanonicalSequence, extractSubcategoriesFromCategory } from '../utils/categorySequence';

export interface CategoryCardData {
  id: string;
  name: string;
  imageUrl?: string;
  hasImage?: boolean;
  bgColor?: string;
  overlayColor?: string;
  isExploreAll?: boolean;
  subcategories?: string[];
  order?: number;
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

const EXPLORE_ALL_CARD: CategoryCardData = {
  id: "explore-all",
  name: "EXPLORE ALL CATEGORIES",
  imageUrl: "/images/categories/explore-all.jpg",
  bgColor: "bg-gradient-to-br from-[#A44101] to-[#6b2800]",
  overlayColor: "from-black/75 via-black/40 to-transparent",
  isExploreAll: true,
};

const CATEGORIES_DETAILED_CACHE_KEY = 'abb_dynamic_categories_detailed_cache';

const getInitialCategories = (): CategoryCardData[] => {
  if (typeof window === 'undefined') return CATEGORIES_DETAILED_DATA;
  try {
    const raw = localStorage.getItem(CATEGORIES_DETAILED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return CATEGORIES_DETAILED_DATA;
};

interface CategoriesSectionProps {
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
}) => {
  const [displayedCategories, setDisplayedCategories] = useState<CategoryCardData[]>(() => getInitialCategories());
  const shouldReduceMotion = useReducedMotion();

  // Load dynamic category cards and banners from API while strictly preserving canonical sequence
  useEffect(() => {
    storefrontProductsApi.getCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          // Strictly sort dynamic categories by canonical sequence
          const sortedCats = sortCategoriesByCanonicalSequence(res);

          const dynamicCards: CategoryCardData[] = sortedCats.map((cat: any) => {
            const catId = cat.slug || cat._id || cat.id;
            const matchedFallback = CATEGORIES_DETAILED_DATA.find(
              (f) =>
                f.id === catId ||
                f.id === cat.slug ||
                f.name.toLowerCase() === (cat.name || '').toLowerCase()
            );

            // Banner or card image returned dynamically from API (checks category and children)
            const directApiImg =
              (typeof cat.cardImage === 'string' && cat.cardImage.trim() ? cat.cardImage.trim() : cat.cardImage?.url?.trim()) ||
              (typeof cat.bannerImage === 'string' && cat.bannerImage.trim() ? cat.bannerImage.trim() : cat.bannerImage?.url?.trim()) ||
              (typeof cat.image === 'string' && cat.image.trim() ? cat.image.trim() : cat.image?.url?.trim()) ||
              (typeof cat.bannerImageUrl === 'string' && cat.bannerImageUrl.trim() ? cat.bannerImageUrl.trim() : undefined) ||
              (typeof cat.imageUrl === 'string' && cat.imageUrl.trim() ? cat.imageUrl.trim() : undefined);

            const findChildImage = (chList: any[]): string | undefined => {
              for (const ch of chList) {
                const img =
                  (typeof ch.cardImage === 'string' && ch.cardImage.trim() ? ch.cardImage.trim() : ch.cardImage?.url?.trim()) ||
                  (typeof ch.bannerImage === 'string' && ch.bannerImage.trim() ? ch.bannerImage.trim() : ch.bannerImage?.url?.trim()) ||
                  (typeof ch.image === 'string' && ch.image.trim() ? ch.image.trim() : ch.image?.url?.trim()) ||
                  (typeof ch.bannerImageUrl === 'string' && ch.bannerImageUrl.trim() ? ch.bannerImageUrl.trim() : undefined) ||
                  (typeof ch.imageUrl === 'string' && ch.imageUrl.trim() ? ch.imageUrl.trim() : undefined);
                if (img) return img;
                if (Array.isArray(ch.children) && ch.children.length > 0) {
                  const nested = findChildImage(ch.children);
                  if (nested) return nested;
                }
              }
              return undefined;
            };

            const childApiImg = !directApiImg && Array.isArray(cat.children) ? findChildImage(cat.children) : undefined;
            const apiImg = directApiImg || childApiImg;
            const hasBackendImg = Boolean(apiImg && apiImg.trim().length > 0);

            const subcats: string[] = extractSubcategoriesFromCategory(cat, res);

            return {
              id: catId,
              name: (cat.name || matchedFallback?.name || '').toUpperCase(),
              imageUrl: hasBackendImg ? apiImg : '',
              hasImage: hasBackendImg,
              bgColor: matchedFallback?.bgColor || 'bg-slate-900',
              overlayColor: matchedFallback?.overlayColor || 'from-black/80 via-black/35 to-black/20',
              subcategories: subcats,
              order: typeof cat.order === 'number' ? cat.order : undefined,
            };
          });

          // Strictly sort the dynamic cards according to canonical sequence
          const sortedCards = sortCategoriesByCanonicalSequence(dynamicCards);

          // Append "Explore All Categories" as the 12th card
          const finalCards = [...sortedCards, EXPLORE_ALL_CARD];
          setDisplayedCategories(finalCards);

          try {
            localStorage.setItem(CATEGORIES_DETAILED_CACHE_KEY, JSON.stringify(finalCards));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('CategoriesSection dynamic fetch error, keeping cached/fallback:', err?.message);
      });
  }, []);

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
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(category.hasImage && category.imageUrl && !imgError);

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: 0.3 }}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`category-card-${category.id} group rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-[#A44101]/50 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative aspect-[16/11] sm:aspect-[7/4.5] ${
        showImage ? (category.bgColor || 'bg-slate-900') : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white'
      }`}
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
      {/* 1. Flatlay Product Photography Background (only if coming from backend) */}
      {showImage ? (
        <>
          <img
            src={category.imageUrl}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={() => setImgError(true)}
          />

          {/* Soft Tint Overlay for consistent contrast */}
          <div 
            className={`absolute inset-0 bg-gradient-to-t ${category.overlayColor || 'from-black/80 via-black/35 to-black/20'} group-hover:from-black/85 group-hover:via-black/45 transition-colors`} 
          />
        </>
      ) : (
        /* Subtle texture / ambient glow for text-only card */
        <div className="absolute inset-0 bg-gradient-to-tr from-[#A44101]/20 via-transparent to-white/5 opacity-80 group-hover:opacity-100 transition-opacity" />
      )}

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
