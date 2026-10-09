import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Search, 
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { AdminCategory, deleteCategory } from '../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';

interface CategoriesTabProps {
  onOpenAddCategory: () => void;
  onEditCategory: (category: AdminCategory) => void;
  onSelectCategoryFilter: (categoryName: string) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  onOpenAddCategory,
  onEditCategory,
  onSelectCategoryFilter,
}) => {
  const dispatch = useAppDispatch();
  const { categories, products } = useAppSelector((state) => state.adminProducts);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({
    'home-kitchen': true,
    'smart-life-gadget': true,
  });

  const toggleExpand = (id: string) => {
    setExpandedCategoryIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    categories.forEach((c) => (all[c.id] = true));
    setExpandedCategoryIds(all);
  };

  const collapseAll = () => {
    setExpandedCategoryIds({});
  };

  // Product counts per category and subcategory
  const productCountMap = useMemo(() => {
    const map: Record<string, { total: number; subcategories: Record<string, number> }> = {};

    categories.forEach((c) => {
      map[c.name] = { total: 0, subcategories: {} };
      c.subcategories.forEach((sub) => {
        map[c.name].subcategories[sub] = 0;
      });
    });

    products.forEach((p) => {
      if (map[p.category]) {
        map[p.category].total += 1;
        if (p.subcategory && map[p.category].subcategories[p.subcategory] !== undefined) {
          map[p.category].subcategories[p.subcategory] += 1;
        }
      }
    });

    return map;
  }, [categories, products]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.badge && c.badge.toLowerCase().includes(q)) ||
        c.subcategories.some((sub) => sub.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const handleDeleteCategory = (cat: AdminCategory) => {
    const count = productCountMap[cat.name]?.total || 0;
    const msg = count > 0 
      ? `Category "${cat.name}" has ${count} associated products in the store. Are you sure you want to delete this category?` 
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (window.confirm(msg)) {
      dispatch(deleteCategory(cat.id));
      toast.success(`Category "${cat.name}" deleted`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            Categories & Subcategory Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize catalog departments, badges, nested sub-tags, and product assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={onOpenAddCategory}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search category or sub-category name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {filteredCategories.length} categories
        </span>
      </div>

      {/* Category Tree List */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No categories found</p>
            <p className="text-xs text-slate-400 mt-1">Try another search or add a new category</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isExpanded = !!expandedCategoryIds[cat.id];
            const stats = productCountMap[cat.name] || { total: 0, subcategories: {} };

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Main Category Header Row */}
                <div className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {cat.imageUrl && (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate">
                          {cat.name}
                        </h3>
                        {cat.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cat.subcategories.length} sub-categories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* View Products in this Category */}
                    <button
                      onClick={() => onSelectCategoryFilter(cat.name)}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold transition-colors"
                      title="Filter All Products by this category"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{stats.total} products</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Edit Category Button */}
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Category Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Category Button */}
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories Tree Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:px-14">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                      Sub-Categories
                    </div>

                    {cat.subcategories.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No subcategories created yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {cat.subcategories.map((sub, idx) => {
                          const subProductCount = stats.subcategories[sub] || 0;
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-xs font-medium text-slate-800 truncate">
                                  {sub}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                {subProductCount} items
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
