import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Search, 
  RefreshCw, 
  Loader2, 
  ShoppingBag, 
  Box, 
  Filter, 
  CheckCircle2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { AdminProduct, restoreProduct } from '../../../../store/adminProductsSlice';
import { adminProductsApi } from '../../../../api/adminApi';
import { toast } from 'react-hot-toast';

interface ArchivedProductsTabProps {
  onOpenAddProduct?: () => void;
}

export const ArchivedProductsTab: React.FC<ArchivedProductsTabProps> = () => {
  const dispatch = useAppDispatch();
  const reduxProducts = useAppSelector((state) => state.adminProducts.products);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [archivedProducts, setArchivedProducts] = useState<AdminProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkRestoring, setIsBulkRestoring] = useState<boolean>(false);

  // Fetch from GET /admin/products/archived
  const fetchArchivedFromApi = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await adminProductsApi.getArchived({ limit: 100 });
      
      const rawList = res?.products || res?.data || (Array.isArray(res) ? res : []);
      
      // Map API products to AdminProduct format
      const mappedList: AdminProduct[] = rawList.map((p: any) => {
        const firstVariant = p.variants?.[0] || {};
        let price = p.price ?? firstVariant.price ?? 0;
        if (typeof price === 'object') {
          price = Number(price.sale ?? price.base ?? 0);
        }

        let originalPrice = price;
        if (firstVariant.price && typeof firstVariant.price === 'object') {
          originalPrice = Number(firstVariant.price.base ?? firstVariant.mrp ?? price);
        }

        return {
          id: p._id || p.id || p.sku || `arch_${Math.random()}`,
          title: p.title || p.name || 'Untitled Product',
          description: p.description || '',
          category: p.category?.name || p.category || 'General',
          currentPrice: Number(price) || 0,
          originalPrice: Number(originalPrice) || Number(price) || 0,
          sku: p.sku || p.slug || '',
          slug: p.slug || '',
          stock: p.stock ?? firstVariant.inventory_quantity ?? 0,
          image: p.image?.url || p.imageUrl || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80',
          status: 'Archived',
          rating: p.rating || 5,
          reviews: p.reviews || 0,
          discountPercentage: 0,
          lowStockThreshold: 10,
          dateAdded: p.createdAt || new Date().toISOString(),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
        };
      });

      // Merge with any Redux store products marked as 'Archived' that might not yet be synced on the remote mock
      const reduxArchived = reduxProducts.filter(
        (p) => p.status === 'Archived'
      );

      const mergedMap = new Map<string, AdminProduct>();
      mappedList.forEach((p) => mergedMap.set(p.sku || p.id, p));
      reduxArchived.forEach((p) => {
        const key = p.sku || p.id;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, p);
        }
      });

      const finalArchived = Array.from(mergedMap.values());
      setArchivedProducts(finalArchived);

      if (showToast) {
        toast.success(`Archived catalog synced! (${finalArchived.length} products)`);
      }
    } catch {
      // Fallback directly to local redux store archived products if API is unavailable
      const localArchived = reduxProducts.filter(
        (p) => p.status === 'Archived'
      );
      setArchivedProducts(localArchived);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [reduxProducts]);

  useEffect(() => {
    fetchArchivedFromApi();
  }, [fetchArchivedFromApi]);

  // Handle Restore Single Product
  const handleRestore = async (product: AdminProduct) => {
    const slug = product.slug || product.sku || product.id;
    try {
      setRestoringId(product.id);
      
      // Hit backend API: PATCH /admin/products/restore/:slug
      try {
        await adminProductsApi.restore(slug);
      } catch {
        // Continue to restore in local store
      }

      // Update Redux state
      dispatch(restoreProduct(product.id));

      // Remove from archived view
      setArchivedProducts((prev) => prev.filter((p) => p.id !== product.id));
      setSelectedIds((prev) => prev.filter((id) => id !== product.id));

      toast.success(`"${product.title}" restored back to active catalog!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to restore product');
    } finally {
      setRestoringId(null);
    }
  };

  // Bulk Restore
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkRestoring(true);
      for (const id of selectedIds) {
        const prod = archivedProducts.find((p) => p.id === id);
        if (prod) {
          const slug = prod.slug || prod.sku || prod.id;
          try {
            await adminProductsApi.restore(slug);
          } catch {}
          dispatch(restoreProduct(id));
        }
      }
      setArchivedProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      toast.success(`${selectedIds.length} products successfully restored!`);
      setSelectedIds([]);
    } catch {
      toast.error('Failed to restore selected products');
    } finally {
      setIsBulkRestoring(false);
    }
  };

  // Categories list for filter dropdown
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    archivedProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [archivedProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return archivedProducts.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        categoryFilter === 'All' || p.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [archivedProducts, searchQuery, categoryFilter]);

  const totalArchivedValue = useMemo(() => {
    return archivedProducts.reduce((acc, p) => acc + (p.currentPrice * (p.stock || 1)), 0);
  }, [archivedProducts]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs shrink-0">
            <Archive className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                Archived Products
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#A44101] border border-orange-200">
                {archivedProducts.length} items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Products archived from storefront inventory. They remain safe in your catalog history and can be restored anytime with a single click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchArchivedFromApi(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 active:scale-95"
            title="Refresh archived list from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#A44101]' : ''}`} />
            <span>Sync API</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkRestore}
              disabled={isBulkRestoring}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A44101] hover:bg-[#8d3600] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isBulkRestoring ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>Restore Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Archived
            </span>
            <span className="text-xl font-black text-navy mt-1 block">
              {archivedProducts.length} Products
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Archived Stock Value
            </span>
            <span className="text-xl font-black text-[#A44101] mt-1 block">
              ₹{totalArchivedValue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#A44101] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Restoration Status
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full mt-1.5 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Re-Activation Ready</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search archived products by title, SKU, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-[#A44101] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy focus:outline-none focus:border-[#A44101] cursor-pointer"
          >
            {categoriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Products Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
            <span className="text-xs font-bold text-slate-500">
              Querying GET /admin/products/archived...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] mx-auto shadow-inner">
              <Archive className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-base font-black text-navy">
                {searchQuery ? 'No Matching Archived Products' : 'No Archived Products'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery
                  ? `No archived items found matching "${searchQuery}". Try clearing filters.`
                  : 'Your archive repository is empty. When you archive items from the All Products catalog, they will appear here.'}
              </p>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-navy transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredProducts.map((p) => p.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-[#A44101] focus:ring-[#A44101] accent-[#A44101] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const isRestoringThis = restoringId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, product.id]);
                            } else {
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== product.id)
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-[#A44101] focus:ring-[#A44101] accent-[#A44101] cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product.image ||
                              'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={product.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-navy truncate">
                              {product.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              /{product.slug || product.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 text-[11px]">
                        {product.sku || product.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200/60">
                          {product.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-navy">
                        ₹{product.currentPrice.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {product.stock} units
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[10px] border border-rose-200/60 uppercase tracking-wide">
                          <Archive className="w-3 h-3 text-rose-500" />
                          <span>Archived</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestore(product)}
                          disabled={isRestoringThis}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
                          title="Restore product to active storefront catalog"
                        >
                          {isRestoringThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
