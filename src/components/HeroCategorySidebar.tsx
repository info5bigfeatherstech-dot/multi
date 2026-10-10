import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Sparkle, 
  Sparkles, 
  Smartphone, 
  ChefHat, 
  Baby, 
  BookOpen, 
  Dumbbell, 
  Plane, 
  Shirt, 
  Gift, 
  Car, 
  Wrench, 
  Briefcase,
  ChevronRight 
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
  if (s.includes('earring') || s.includes('stud')) return Sparkle;
  if (s.includes('necklace') || s.includes('pendant')) return Sparkles;
  if (s.includes('chain')) return Sparkles;
  if (s.includes('hair') || s.includes('forehead')) return Sparkle;
  if (s.includes('nose') || s.includes('nath')) return Sparkle;
  if (s.includes('earphone') || s.includes('gadget') || s.includes('smart') || s.includes('phone')) return Smartphone;
  if (s.includes('mangalsutra')) return Sparkles;
  if (s.includes('ring')) return Sparkle;
  if (s.includes('anklet') || s.includes('toe')) return Sparkles;
  if (s.includes('bracelet') || s.includes('bangle')) return Sparkle;
  if (s.includes('kitchen') || s.includes('cook')) return ChefHat;
  if (s.includes('baby')) return Baby;
  if (s.includes('book') || s.includes('station')) return BookOpen;
  if (s.includes('fit') || s.includes('sport') || s.includes('gym')) return Dumbbell;
  if (s.includes('travel') || s.includes('tour')) return Plane;
  if (s.includes('fashion') || s.includes('cloth') || s.includes('wear')) return Shirt;
  if (s.includes('gift')) return Gift;
  if (s.includes('car')) return Car;
  if (s.includes('tool') || s.includes('wrench')) return Wrench;
  if (s.includes('bag') || s.includes('corporate')) return Briefcase;
  return LayoutGrid;
};

const CATEGORIES_CACHE_KEY = 'abb_dynamic_categories_cache';

const getCachedCategories = (): CategorySidebarItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((cat: any) => ({
          ...cat,
          icon: getCategoryIcon(cat.name, cat.id || cat.slug),
        }));
      }
    }
  } catch {}
  return [];
};

interface HeroCategorySidebarProps {
  onCategoryClick?: (item: CategorySidebarItem, subcategory?: string) => void;
  onViewAllClick?: () => void;
}

export const HeroCategorySidebar: React.FC<HeroCategorySidebarProps> = ({
  onCategoryClick,
  onViewAllClick,
}) => {
  // Strictly start from cached dynamic categories or empty state — NEVER show static mock categories
  const [categories, setCategories] = useState<CategorySidebarItem[]>(() => getCachedCategories());
  const [hoveredCat, setHoveredCat] = useState<CategorySidebarItem | null>(null);

  // Load dynamic categories from backend API
  useEffect(() => {
    storefrontProductsApi.getCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const dynamicItems: CategorySidebarItem[] = res.map((cat: any) => {
            const catId = cat.slug || cat._id || cat.id;
            const subcats: string[] = Array.isArray(cat.children) && cat.children.length > 0
              ? cat.children.map((c: any) => (typeof c === 'string' ? c : c.name || c.title))
              : (CATEGORY_SUBCATEGORIES[cat.slug] || [
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
            // Cache in localStorage to prevent any 1-sec flash on future visits
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
        }
      })
      .catch((err) => {
        console.warn('Hero categories fetch error:', err?.message);
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
