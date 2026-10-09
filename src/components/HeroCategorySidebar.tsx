import React, { useState } from 'react';
import { 
  LayoutGrid, 
  ChefHat, 
  Smartphone, 
  Baby, 
  BookOpen, 
  Sparkle, 
  Dumbbell, 
  Plane, 
  Shirt, 
  Gift, 
  Sparkles, 
  Wrench, 
  Car, 
  PackageCheck, 
  Briefcase,
  ChevronRight 
} from 'lucide-react';
import { CATEGORY_SUBCATEGORIES } from '../data/storeData';

export interface CategorySidebarItem {
  id: string;
  name: string;
  targetSectionId?: string;
  targetClass?: string;
  icon: React.ComponentType<{ className?: string }>;
  subcategories?: string[];
}

// Complete categories matching exact sequence of ALL_CATEGORIES_MENU
export const HERO_CATEGORIES: CategorySidebarItem[] = [
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    targetSectionId: 'section-home-kitchen',
    icon: ChefHat,
    subcategories: CATEGORY_SUBCATEGORIES['home-kitchen'],
  },
  {
    id: 'smart-life-gadget',
    name: 'Smart Life Gadgets',
    targetSectionId: 'section-smart-life-gadget',
    icon: Smartphone,
    subcategories: CATEGORY_SUBCATEGORIES['smart-life-gadget'],
  },
  {
    id: 'baby-items',
    name: 'Baby Items',
    targetSectionId: 'section-baby-items',
    icon: Baby,
    subcategories: CATEGORY_SUBCATEGORIES['baby-items'],
  },
  {
    id: 'stationary',
    name: 'Stationery',
    targetSectionId: 'section-stationary',
    icon: BookOpen,
    subcategories: CATEGORY_SUBCATEGORIES['stationary'],
  },
  {
    id: 'cleaning-housekeeping',
    name: 'Cleaning & Housekeeping',
    targetSectionId: 'section-cleaning-housekeeping',
    icon: Sparkle,
    subcategories: CATEGORY_SUBCATEGORIES['cleaning-housekeeping'],
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    targetSectionId: 'section-sports-fitness',
    icon: Dumbbell,
    subcategories: CATEGORY_SUBCATEGORIES['sports-fitness'],
  },
  {
    id: 'tours-travels',
    name: 'Tours & Travels',
    targetSectionId: 'section-tours-travels',
    icon: Plane,
    subcategories: CATEGORY_SUBCATEGORIES['tours-travels'],
  },
  {
    id: 'fashion-world',
    name: 'Fashion World',
    targetSectionId: 'section-fashion-world',
    icon: Shirt,
    subcategories: CATEGORY_SUBCATEGORIES['fashion-world'],
  },
  {
    id: 'gifts',
    name: 'Gifts',
    targetSectionId: 'category-card-gifts',
    icon: Gift,
    subcategories: CATEGORY_SUBCATEGORIES['gifts'],
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    targetSectionId: 'section-beauty-personal-care',
    icon: Sparkles,
    subcategories: CATEGORY_SUBCATEGORIES['beauty-personal-care'],
  },
  {
    id: 'home-improvement',
    name: 'Home Improvement',
    targetSectionId: 'category-card-home-improvement',
    icon: Wrench,
    subcategories: CATEGORY_SUBCATEGORIES['home-improvement'],
  },
  {
    id: 'car-accessories',
    name: 'Car Accessories',
    targetSectionId: 'section-car-accessories',
    icon: Car,
    subcategories: CATEGORY_SUBCATEGORIES['car-accessories'],
  },
  {
    id: 'corporate-gifting',
    name: 'Corporate Gifting',
    targetSectionId: 'category-card-corporate-gifting',
    icon: Briefcase,
    subcategories: CATEGORY_SUBCATEGORIES['corporate-gifting'],
  },
  {
    id: 'mix-item',
    name: 'Mix Item Deals',
    targetSectionId: 'section-mix-item',
    icon: PackageCheck,
    subcategories: CATEGORY_SUBCATEGORIES['mix-item'],
  },
];

interface HeroCategorySidebarProps {
  onCategoryClick?: (item: CategorySidebarItem, subcategory?: string) => void;
  onViewAllClick?: () => void;
}

export const HeroCategorySidebar: React.FC<HeroCategorySidebarProps> = ({
  onCategoryClick,
  onViewAllClick,
}) => {
  const [hoveredCat, setHoveredCat] = useState<CategorySidebarItem | null>(null);

  const handleItemClick = (item: CategorySidebarItem, subcategory?: string) => {
    if (onCategoryClick) {
      onCategoryClick(item, subcategory);
    }

    const targetSelector = item.targetClass || (item.targetSectionId ? `.${item.targetSectionId}` : `.section-${item.id}`);
    const targetEl = document.querySelector(targetSelector.startsWith('.') ? targetSelector : `.${targetSelector}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const catCardEl = document.querySelector(`.category-card-${item.id}`);
      if (catCardEl) {
        catCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const topCatEl = document.querySelector('.section-top-categories');
        if (topCatEl) {
          topCatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleViewAll = () => {
    if (onViewAllClick) {
      onViewAllClick();
    } else {
      const topCatEl = document.querySelector('.section-top-categories');
      if (topCatEl) {
        topCatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

      {/* 2. List of Categories */}
      <ul className="flex-1 min-h-0 divide-y divide-slate-100 flex flex-col">
        {HERO_CATEGORIES.map((cat) => {
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
