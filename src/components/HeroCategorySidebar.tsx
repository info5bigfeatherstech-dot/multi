import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Sparkles, 
  Smartphone, 
  ChefHat, 
  BookOpen, 
  Dumbbell, 
  Plane, 
  Gift, 
  ChevronRight,
  Home,
  Palette,
  Package
} from 'lucide-react';
import { CATEGORY_SUBCATEGORIES } from '../data/storeData';
import { storefrontProductsApi } from '../api';

export interface CategorySidebarItem {
  id: string;
  name: string;
  targetSectionId?: string;
  targetClass?: string;
  icon: React.ComponentType<{ className?: string }>;
  subcategories?: string[];
}

export const getCategoryIcon = (name = '', slug = ''): React.ComponentType<{ className?: string }> => {
  const s = `${name} ${slug}`.toLowerCase();
  if (s.includes('electronic') || s.includes('gadget') || s.includes('smart') || s.includes('phone') || s.includes('mobile')) return Smartphone;
  if (s.includes('gift') || s.includes('lifestyle')) return Gift;
  if (s.includes('home & living') || s.includes('home and living') || s.includes('living')) return Home;
  if (s.includes('home decor') || s.includes('decor')) return Palette;
  if (s.includes('jewel') || s.includes('access') || s.includes('necklace') || s.includes('earring') || s.includes('ring')) return Sparkles;
  if (s.includes('kitchen') || s.includes('dining') || s.includes('cook')) return ChefHat;
  if (s.includes('station') || s.includes('office') || s.includes('school') || s.includes('book')) return BookOpen;
  if (s.includes('travel') || s.includes('tour') || s.includes('outdoor')) return Plane;
  if (s.includes('sport') || s.includes('fit') || s.includes('gym')) return Dumbbell;
  if (s.includes('beauty') || s.includes('personal') || s.includes('skin') || s.includes('care')) return Sparkles;
  if (s.includes('mix') || s.includes('package') || s.includes('combo') || s.includes('wholesale')) return Package;
  return LayoutGrid;
};

// Canonical 11 Fallback Categories matching user's exact specification
export const FALLBACK_SIDEBAR_CATEGORIES: CategorySidebarItem[] = [
  {
    id: 'electronics-and-gadgets',
    name: 'Electronics & Gadgets',
    targetSectionId: 'section-electronics-and-gadgets',
    icon: Smartphone,
    subcategories: CATEGORY_SUBCATEGORIES['electronics-and-gadgets'] || [
      'USB Cables & Fast Chargers',
      'Mobile Holders & Stands',
      'Bluetooth Earbuds & Speakers',
      'Smartwatches & Straps'
    ],
  },
  {
    id: 'gifts-and-lifestyle',
    name: 'Gifts & Lifestyle',
    targetSectionId: 'section-gifts-and-lifestyle',
    icon: Gift,
    subcategories: CATEGORY_SUBCATEGORIES['gifts-and-lifestyle'] || [
      'Personalized & Novelty Gifts',
      'Keychains & Wallets',
      'Party Props & Birthday Decor'
    ],
  },
  {
    id: 'home-and-living',
    name: 'Home & Living',
    targetSectionId: 'section-home-and-living',
    icon: Home,
    subcategories: CATEGORY_SUBCATEGORIES['home-and-living'] || [
      'Cleaning Supplies & Mops',
      'Storage & Organizers',
      'Laundry Baskets & Hangers',
      'Bathroom Accessories'
    ],
  },
  {
    id: 'home-decor',
    name: 'Home Decor',
    targetSectionId: 'section-home-decor',
    icon: Palette,
    subcategories: CATEGORY_SUBCATEGORIES['home-decor'] || [
      'Wall Art & Frames',
      'Decorative Lights & Lamps',
      'Showpieces & Figurines',
      'Vases & Artificial Flowers'
    ],
  },
  {
    id: 'jewellery-and-accessories',
    name: 'Jewellery & Accessories',
    targetSectionId: 'section-jewellery-and-accessories',
    icon: Sparkles,
    subcategories: CATEGORY_SUBCATEGORIES['jewellery-and-accessories'] || [
      'Fashion Necklaces & Sets',
      'Trendy Earrings & Studs',
      'Bracelets & Bangles',
      'Hair Accessories & Clips'
    ],
  },
  {
    id: 'kitchen-and-dining',
    name: 'Kitchen & Dining',
    targetSectionId: 'section-kitchen-and-dining',
    icon: ChefHat,
    subcategories: CATEGORY_SUBCATEGORIES['kitchen-and-dining'] || [
      'Storage Containers & Jars',
      'Vegetable Choppers & Cutters',
      'Kitchen Utensils & Gadgets',
      'Water Bottles & Flasks'
    ],
  },
  {
    id: 'stationery-office-and-school',
    name: 'Stationery, Office & School',
    targetSectionId: 'section-stationery-office-and-school',
    icon: BookOpen,
    subcategories: CATEGORY_SUBCATEGORIES['stationery-office-and-school'] || [
      'Diaries & Organizers',
      'Pens, Highlighters & Markers',
      'Desk Tidy & Calculators',
      'School Supplies & Pencil Cases'
    ],
  },
  {
    id: 'travel-and-outdoor',
    name: 'Travel & Outdoor',
    targetSectionId: 'section-travel-and-outdoor',
    icon: Plane,
    subcategories: CATEGORY_SUBCATEGORIES['travel-and-outdoor'] || [
      'Luggage Tags & Travel Organizers',
      'Camping Gear & Flasks',
      'Car Accessories & Cushions'
    ],
  },
  {
    id: 'sports-and-fitness',
    name: 'Sports & Fitness',
    targetSectionId: 'section-sports-and-fitness',
    icon: Dumbbell,
    subcategories: CATEGORY_SUBCATEGORIES['sports-and-fitness'] || [
      'Resistance Bands & Dumbbells',
      'Yoga Mats & Water Shakers',
      'Badminton & Cricket Accessories'
    ],
  },
  {
    id: 'beauty-and-personal-care',
    name: 'Beauty & Personal Care',
    targetSectionId: 'section-beauty-and-personal-care',
    icon: Sparkles,
    subcategories: CATEGORY_SUBCATEGORIES['beauty-and-personal-care'] || [
      'Skincare & Face Wash',
      'Beauty & Makeup Tools',
      'Hair Trimmers & Shavers',
      'Personal Care & Hygiene'
    ],
  },
  {
    id: 'mix-items',
    name: 'Mix Items',
    targetSectionId: 'section-mix-items',
    icon: Package,
    subcategories: CATEGORY_SUBCATEGORIES['mix-items'] || [
      'Clearance Stock',
      'Bulk Combo Offers',
      'Assorted Wholesale Lots'
    ],
  },
];

const CATEGORIES_CACHE_KEY = 'abb_dynamic_categories_cache';

const getCachedCategories = (): CategorySidebarItem[] => {
  if (typeof window === 'undefined') return FALLBACK_SIDEBAR_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((cat: any) => ({
          ...cat,
          icon: getCategoryIcon(cat.name, cat.id || cat.slug),
          subcategories: cat.subcategories || CATEGORY_SUBCATEGORIES[cat.id] || CATEGORY_SUBCATEGORIES[cat.slug] || [
            `All ${cat.name}`,
            'Bestsellers',
            'New Arrivals',
            'Trending Deals'
          ],
        }));
      }
    }
  } catch {}
  return FALLBACK_SIDEBAR_CATEGORIES;
};

interface HeroCategorySidebarProps {
  onCategoryClick?: (item: CategorySidebarItem, subcategory?: string) => void;
  onViewAllClick?: () => void;
}

export const HeroCategorySidebar: React.FC<HeroCategorySidebarProps> = ({
  onCategoryClick,
  onViewAllClick,
}) => {
  // Always initialize immediately with cached or canonical fallback categories
  const [categories, setCategories] = useState<CategorySidebarItem[]>(() => getCachedCategories());
  const [hoveredCat, setHoveredCat] = useState<CategorySidebarItem | null>(null);

  // Load dynamic categories from backend API
  useEffect(() => {
    storefrontProductsApi.getCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const dynamicItems: CategorySidebarItem[] = res.map((cat: any) => {
            const catId = cat.slug || cat._id || cat.id;
            const normSlug = (cat.slug || cat.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const matchedFallback = FALLBACK_SIDEBAR_CATEGORIES.find(
              f => f.name.toLowerCase() === cat.name.toLowerCase() || f.id === catId || f.id === cat.slug
            );

            const subcats: string[] = Array.isArray(cat.children) && cat.children.length > 0
              ? cat.children.map((c: any) => (typeof c === 'string' ? c : c.name || c.title))
              : (matchedFallback?.subcategories ||
                 CATEGORY_SUBCATEGORIES[cat.slug] || 
                 CATEGORY_SUBCATEGORIES[normSlug] || [
                  `All ${cat.name}`,
                  'Bestsellers',
                  'New Arrivals',
                  'Trending Deals'
                ]);

            return {
              id: catId,
              name: cat.name,
              targetSectionId: `section-${catId}`,
              icon: getCategoryIcon(cat.name, catId),
              subcategories: subcats,
            };
          });

          setCategories(dynamicItems);

          try {
            // Cache in localStorage
            localStorage.setItem(
              CATEGORIES_CACHE_KEY,
              JSON.stringify(dynamicItems.map(({ id, name, targetSectionId, subcategories }) => ({
                id,
                name,
                targetSectionId,
                subcategories
              })))
            );
          } catch {}
        } else {
          setCategories(FALLBACK_SIDEBAR_CATEGORIES);
        }
      })
      .catch((err) => {
        console.warn('Hero categories fetch error, keeping fallback:', err?.message);
        setCategories(FALLBACK_SIDEBAR_CATEGORIES);
      });
  }, []);

  const handleItemClick = (item: CategorySidebarItem, subcategory?: string) => {
    setHoveredCat(null);
    const isAllSub = subcategory && (subcategory.toLowerCase().startsWith('all ') || subcategory.toLowerCase() === 'all');
    const targetSub = isAllSub ? undefined : subcategory;

    if (onCategoryClick) {
      onCategoryClick(item, targetSub);
      return;
    }

    // Direct routing to category page
    const subQuery = targetSub ? `?sub=${encodeURIComponent(targetSub)}` : '';
    window.history.pushState(null, '', `/category/${item.id}${subQuery}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleViewAll = () => {
    setHoveredCat(null);
    if (onViewAllClick) {
      onViewAllClick();
      return;
    }
    window.history.pushState(null, '', '/category/explore-all');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <aside
      className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between select-none h-full relative"
      aria-label="Shop By Category Menu"
      onMouseLeave={() => setHoveredCat(null)}
    >
      {/* 1. Header (Dark Navy with 4 squares icon) */}
      <div className="bg-[#121e36] text-white px-3.5 py-2 flex items-center gap-2 shrink-0 rounded-t-2xl">
        <LayoutGrid className="w-4 h-4 text-white shrink-0 stroke-[2.2]" />
        <h2 className="font-bold text-[13px] tracking-tight text-white leading-none">
          Shop By Category
        </h2>
      </div>

      {/* 2. List of Categories or Shimmer Skeleton (Never shows static categories) */}
      {categories.length === 0 ? (
        <div className="flex-1 min-h-0 divide-y divide-slate-100 flex flex-col p-2 space-y-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 min-h-0 flex items-center justify-between px-2 py-1 animate-pulse">
              <div className="flex items-center gap-2.5 w-full">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                <div className="h-3 rounded bg-slate-200" style={{ width: `${55 + (i % 5) * 8}%` }} />
              </div>
              <div className="w-2.5 h-2.5 rounded bg-slate-100 shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex-1 min-h-0 divide-y divide-slate-100 flex flex-col">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isHovered = hoveredCat?.id === cat.id;

            return (
              <li 
                key={cat.id} 
                className="flex-1 min-h-0 flex"
                onMouseEnter={() => setHoveredCat(cat)}
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(cat)}
                  className={`w-full h-full px-3 py-0.5 flex items-center justify-between text-left transition-colors group cursor-pointer ${
                    isHovered ? 'bg-[#A44101]/10 text-[#A44101]' : 'text-slate-700 hover:text-navy hover:bg-slate-50'
                  }`}
                  aria-label={`Browse ${cat.name}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 transition-colors stroke-[2] ${
                      isHovered ? 'text-[#A44101]' : 'text-slate-500 group-hover:text-[#A44101]'
                    }`} />
                    <span className={`text-[11px] xl:text-[11.5px] font-medium truncate ${
                      isHovered ? 'text-[#A44101] font-bold' : 'text-slate-800 group-hover:text-navy'
                    }`}>
                      {cat.name}
                    </span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-all shrink-0 ml-1 ${
                    isHovered ? 'text-[#A44101] translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5'
                  }`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 3. Flyout panel for subcategories on hover (Desktop) */}
      {hoveredCat && hoveredCat.subcategories && hoveredCat.subcategories.length > 0 && (
        <div 
          className="absolute left-full top-0 ml-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 flex flex-col justify-between animate-fadeIn"
          onMouseEnter={() => setHoveredCat(hoveredCat)}
          onMouseLeave={() => setHoveredCat(null)}
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">
                {hoveredCat.name}
              </span>
              <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
                Subcategories
              </span>
            </div>

            <div className="space-y-1">
              {hoveredCat.subcategories.map((sub, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleItemClick(hoveredCat, sub)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#A44101] hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span>{sub}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 mt-2.5">
            <button
              type="button"
              onClick={() => handleItemClick(hoveredCat)}
              className="w-full text-center text-xs font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer py-1 block"
            >
              Browse All in {hoveredCat.name} →
            </button>
          </div>
        </div>
      )}

      {/* 4. Footer: View All Categories */}
      <div className="bg-slate-50/90 border-t border-slate-100 px-3.5 py-1.5 shrink-0 rounded-b-2xl">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full flex items-center gap-2 text-navy hover:text-[#A44101] transition-colors cursor-pointer group"
          aria-label="View All Categories"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#A44101] transition-colors shrink-0" />
          <span className="font-bold text-[11.5px] text-slate-900 group-hover:text-[#A44101] transition-colors">
            View All Categories
          </span>
        </button>
      </div>
    </aside>
  );
};
