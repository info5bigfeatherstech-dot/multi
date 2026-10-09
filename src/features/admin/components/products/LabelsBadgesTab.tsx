import React, { useState, useMemo } from 'react';
import { 
  Tag, 
  Sparkles, 
  Search, 
  CheckSquare, 
  Square, 
  X,
  Package
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
  assignBadges, 
  removeBadge, 
  toggleSelectProduct, 
  selectAllProducts, 
  clearSelection 
} from '../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../components/ui/select';

export const LabelsBadgesTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, availableBadges, selectedProductIds } = useAppSelector(
    (state) => state.adminProducts
  );

  const [activeBadgeFilter, setActiveBadgeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadgeToAssign, setSelectedBadgeToAssign] = useState<string>(availableBadges[0] || 'Trending');
  const [customBadgeInput, setCustomBadgeInput] = useState('');

  // Products filtered by search and badge
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (activeBadgeFilter !== 'All') {
      list = list.filter(p => 
        (p.badges && p.badges.includes(activeBadgeFilter)) ||
        p.tag === activeBadgeFilter
      );
    }

    return list;
  }, [products, searchQuery, activeBadgeFilter]);

  // Bulk actions
  const handleAssignBadgeToSelected = (badge: string) => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    const targetBadge = badge.trim();
    if (!targetBadge) return;

    dispatch(assignBadges({ productIds: selectedProductIds, badge: targetBadge }));
    toast.success(`Badge "${targetBadge}" assigned to ${selectedProductIds.length} products`);
  };

  const handleRemoveBadgeFromSelected = (badge: string) => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    dispatch(removeBadge({ productIds: selectedProductIds, badge }));
    toast.success(`Badge "${badge}" removed from selected products`);
  };

  const handleCreateAndAssignCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBadgeInput.trim()) return;
    handleAssignBadgeToSelected(customBadgeInput.trim());
    setCustomBadgeInput('');
  };

  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAllProducts(filteredProducts.map(p => p.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-indigo-600" />
            Product Labels & Promotional Badges
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bulk-assign ribbons and marketing flags ("Trending", "Sale", "New Launch", "Hot Deal") to increase conversions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {availableBadges.map((badge) => (
            <span
              key={badge}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Bulk Operations Control Center */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Bulk Badge Assignment Tool
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Preset Badges assignment */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Select Preset Badge to Assign
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selectedBadgeToAssign}
                  onValueChange={(val) => setSelectedBadgeToAssign(val)}
                >
                  <SelectTrigger className="h-9 px-3 bg-white border-slate-200 rounded-xl text-xs text-slate-800">
                    <SelectValue placeholder="Select Badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBadges.map((badge) => (
                      <SelectItem key={badge} value={badge}>
                        {badge}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => handleAssignBadgeToSelected(selectedBadgeToAssign)}
                disabled={selectedProductIds.length === 0}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                Apply ({selectedProductIds.length})
              </button>
              <button
                type="button"
                onClick={() => handleRemoveBadgeFromSelected(selectedBadgeToAssign)}
                disabled={selectedProductIds.length === 0}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Remove ({selectedProductIds.length})
              </button>
            </div>
          </div>

          {/* Custom Badge Creator */}
          <form 
            onSubmit={handleCreateAndAssignCustomBadge}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <label className="block text-xs font-semibold text-slate-700">
              Or Type Custom Badge Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. FLASH SALE 50%, BESTSELLER"
                value={customBadgeInput}
                onChange={(e) => setCustomBadgeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={selectedProductIds.length === 0 || !customBadgeInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                Create & Assign
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filter and Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search product title, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveBadgeFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeBadgeFilter === 'All'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({products.length})
          </button>
          {availableBadges.map((badge) => {
            const count = products.filter(p => p.badges?.includes(badge) || p.tag === badge).length;
            return (
              <button
                key={badge}
                onClick={() => setActiveBadgeFilter(badge)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeBadgeFilter === badge
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {badge} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid for Badge Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-2"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Displayed ({filteredProducts.length})</span>
            </button>

            {selectedProductIds.length > 0 && (
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {selectedProductIds.length} selected
              </span>
            )}
          </div>

          {selectedProductIds.length > 0 && (
            <button
              onClick={() => dispatch(clearSelection())}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Deselect all
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No products found for this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const isSelected = selectedProductIds.includes(p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => dispatch(toggleSelectProduct(p.id))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="mt-1">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>

                    {/* Image */}
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80';
                      }}
                    />

                    {/* Title & SKU */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 text-xs truncate">
                        {p.title}
                      </h3>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {p.sku} • ₹{p.currentPrice.toLocaleString()}
                      </p>

                      {/* Current badges container */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.badges && p.badges.length > 0 ? (
                          p.badges.map((badge, bIdx) => (
                            <span
                              key={bIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch(removeBadge({ productIds: [p.id], badge }));
                                toast.success(`Removed "${badge}"`);
                              }}
                              title="Click to remove badge"
                            >
                              <span>{badge}</span>
                              <X className="w-2.5 h-2.5 text-amber-600 hover:text-amber-900" />
                            </span>
                          ))
                        ) : p.tag ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(removeBadge({ productIds: [p.id], badge: p.tag || '' }));
                              toast.success(`Removed "${p.tag}"`);
                            }}
                          >
                            <span>{p.tag}</span>
                            <X className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No badges attached</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
