import React from 'react';
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
  ChevronRight 
} from 'lucide-react';

export interface CategorySidebarItem {
  id: string;
  name: string;
  targetSectionId: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Complete categories matching exact sequence of ALL_CATEGORIES_MENU in categories dropdown
export const HERO_CATEGORIES: CategorySidebarItem[] = [
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    targetSectionId: 'section-home-kitchen',
    icon: ChefHat,
  },
  {
    id: 'smart-life-gadget',
    name: 'Smart Life Gadgets',
    targetSectionId: 'section-smart-life-gadget',
    icon: Smartphone,
  },
  {
    id: 'baby-items',
    name: 'Baby Items',
    targetSectionId: 'section-baby-items',
    icon: Baby,
  },
  {
    id: 'stationary',
    name: 'Stationary',
    targetSectionId: 'section-stationary',
    icon: BookOpen,
  },
  {
    id: 'cleaning-housekeeping',
    name: 'Cleaning & Housekeeping',
    targetSectionId: 'section-cleaning-housekeeping',
    icon: Sparkle,
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    targetSectionId: 'section-sports-fitness',
    icon: Dumbbell,
  },
  {
    id: 'tours-travels',
    name: 'Tours & Travels',
    targetSectionId: 'section-tours-travels',
    icon: Plane,
  },
  {
    id: 'fashion-world',
    name: 'Fashion World',
    targetSectionId: 'section-fashion-world',
    icon: Shirt,
  },
  {
    id: 'gifts',
    name: 'Gifts & Novelties',
    targetSectionId: 'category-card-gifts',
    icon: Gift,
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    targetSectionId: 'section-beauty-personal-care',
    icon: Sparkles,
  },
  {
    id: 'home-improvement',
    name: 'Home Improvement',
    targetSectionId: 'category-card-home-improvement',
    icon: Wrench,
  },
  {
    id: 'car-accessories',
    name: 'Car Accessories',
    targetSectionId: 'section-car-accessories',
    icon: Car,
  },
  {
    id: 'mix-item',
    name: 'Mix Item Deals',
    targetSectionId: 'section-mix-item',
    icon: PackageCheck,
  },
];

interface HeroCategorySidebarProps {
  onCategoryClick?: (item: CategorySidebarItem) => void;
  onViewAllClick?: () => void;
}

export const HeroCategorySidebar: React.FC<HeroCategorySidebarProps> = ({
  onCategoryClick,
  onViewAllClick,
}) => {
  const handleItemClick = (item: CategorySidebarItem) => {
    if (onCategoryClick) {
      onCategoryClick(item);
    }

    const targetEl = document.getElementById(item.targetSectionId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const catCardEl = document.getElementById(`category-card-${item.id}`);
      if (catCardEl) {
        catCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const topCatEl = document.getElementById('top-categories');
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
      const topCatEl = document.getElementById('top-categories');
      if (topCatEl) {
        topCatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <aside
      className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between overflow-hidden select-none h-full"
      aria-label="Shop By Category Menu"
    >
      {/* 1. Header (Dark Navy with 4 squares icon) */}
      <div className="bg-[#121e36] text-white px-3.5 py-2 flex items-center gap-2 shrink-0">
        <LayoutGrid className="w-4 h-4 text-white shrink-0 stroke-[2.2]" />
        <h2 className="font-bold text-[13px] tracking-tight text-white leading-none">
          Shop By Category
        </h2>
      </div>

      {/* 2. List of Categories - small & adjusted to equal width & equal height */}
      <ul className="flex-1 min-h-0 divide-y divide-slate-100 flex flex-col">
        {HERO_CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <li key={cat.id} className="flex-1 min-h-0 flex">
              <button
                type="button"
                onClick={() => handleItemClick(cat)}
                className="w-full h-full px-3 py-0.5 flex items-center justify-between text-left text-slate-700 hover:text-navy hover:bg-slate-50 transition-colors group cursor-pointer"
                aria-label={`Browse ${cat.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#A44101] shrink-0 transition-colors stroke-[2]" />
                  <span className="text-[11px] xl:text-[11.5px] font-medium text-slate-800 group-hover:text-navy truncate">
                    {cat.name}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </button>
            </li>
          );
        })}
      </ul>

      {/* 3. Footer: View All Categories */}
      <div className="bg-slate-50/90 border-t border-slate-100 px-3.5 py-1.5 shrink-0">
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
