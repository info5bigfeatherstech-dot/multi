import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit,
  Archive,
  ArrowUpDown,
  CheckSquare,
  Square,
  RotateCcw,
  UploadCloud,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  Package
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import {
  AdminProduct,
  toggleProductStatus,
  toggleSelectProduct,
  selectAllProducts,
  clearSelection,
  assignBadges,
  removeBadge,
  updateProduct,
  resetToDefaultStore
} from '../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';

interface AllProductsTabProps {
  onEditProduct: (product: AdminProduct) => void;
  onArchiveProduct: (product: AdminProduct) => void;
  onStockAdjust: (product: AdminProduct) => void;
  onOpenAddProduct: () => void;
  onOpenBulkUpload: () => void;
  onOpenQuickCategory: () => void;
}

export const AllProductsTab: React.FC<AllProductsTabProps> = ({
  onEditProduct,
  onArchiveProduct,
  onStockAdjust,
  onOpenAddProduct,
  onOpenBulkUpload,
  onOpenQuickCategory,
}) => {
  const dispatch = useAppDispatch();
  const { products, categories, selectedProductIds, availableBadges } = useAppSelector(
    (state) => state.adminProducts
  );

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'in_stock' | 'low_stock' | 'out_of_stock'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Draft' | 'Archived'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'price_asc' | 'price_desc' | 'stock' | 'name'>('date');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Bulk action toolbar state
  const [selectedLabel, setSelectedLabel] = useState<string>('');

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q)) ||
        (p.badges && p.badges.some(b => b.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Stock filter
    if (stockFilter === 'in_stock') {
      list = list.filter((p) => p.stock > (p.lowStockThreshold || 10));
    } else if (stockFilter === 'low_stock') {
      list = list.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10));
    } else if (stockFilter === 'out_of_stock') {
      list = list.filter((p) => p.stock === 0);
    }

    // Status filter
    if (statusFilter !== 'All') {
      list = list.filter((p) => p.status === statusFilter);
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.currentPrice - b.currentPrice;
      if (sortBy === 'price_desc') return b.currentPrice - a.currentPrice;
      if (sortBy === 'stock') return a.stock - b.stock;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      // default 'date'
      return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
    });

    return list;
  }, [products, searchQuery, selectedCategory, stockFilter, statusFilter, sortBy]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Guard current page out of bounds
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, validCurrentPage, pageSize]);

  // Bulk selection calculations
  const pageProductIds = paginatedProducts.map(p => p.id);
  const isAllPageSelected = pageProductIds.length > 0 && pageProductIds.every(id => selectedProductIds.includes(id));
  const isSomePageSelected = pageProductIds.some(id => selectedProductIds.includes(id)) && !isAllPageSelected;

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAllProducts(pageProductIds));
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    dispatch(toggleProductStatus(id));
    const nextStatus = currentStatus === 'Active' ? 'Draft' : 'Active';
    toast.success(`Product status switched to ${nextStatus}`);
  };



  const handleSetEcomStatus = (status: 'Active' | 'Draft' | 'Archived') => {
    selectedProductIds.forEach((id) => {
      dispatch(updateProduct({ id, updates: { status } }));
    });
    toast.success(`Set Ecom status to ${status} for ${selectedProductIds.length} products`);
    setIsEcomDropdownOpen(false);
  };

  const handleSetWholesaleStatus = (status: 'Active' | 'Draft' | 'Archived') => {
    toast.success(`Set Wholesale channel to ${status} for ${selectedProductIds.length} products`);
    setIsWholesaleDropdownOpen(false);
  };

  const handleApplyLabel = () => {
    if (!selectedLabel) {
      toast.error('Please choose a label first');
      return;
    }
    dispatch(assignBadges({ productIds: selectedProductIds, badge: selectedLabel }));
    toast.success(`Label "${selectedLabel}" applied to ${selectedProductIds.length} products`);
  };

  const handleRemoveLabel = () => {
    if (selectedLabel) {
      dispatch(removeBadge({ productIds: selectedProductIds, badge: selectedLabel }));
      toast.success(`Label "${selectedLabel}" removed from ${selectedProductIds.length} products`);
    } else {
      selectedProductIds.forEach((id) => {
        dispatch(updateProduct({ id, updates: { badges: [], tag: undefined } }));
      });
      toast.success(`Labels removed from ${selectedProductIds.length} products`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all catalog data, categories, and inventory logs to default seed? Any local changes will be replaced.')) {
      dispatch(resetToDefaultStore());
      toast.success('Store reset to default state');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setStockFilter('All');
    setStatusFilter('All');
    setSortBy('date');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || stockFilter !== 'All' || statusFilter !== 'All' || sortBy !== 'date';

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-600" />
            Catalog & Products Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your master inventory, prices, variants, categories, and client-side storage
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            title="Reset store to original default mock data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>

          <button
            onClick={onOpenQuickCategory}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Category
          </button>

          <button
            onClick={onOpenBulkUpload}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Bulk CSV Upload
          </button>

          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product title, SKU, brand, or tag..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full h-10 px-3.5 bg-slate-50 border-slate-200 rounded-xl text-xs font-medium">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories ({categories.length})</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Filter */}
          <div>
            <Select
              value={stockFilter}
              onValueChange={(val) => {
                setStockFilter(val as any);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full h-10 px-3.5 bg-slate-50 border-slate-200 rounded-xl text-xs font-medium">
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Stock Levels</SelectItem>
                <SelectItem value="in_stock">In Stock (&gt;10)</SelectItem>
                <SelectItem value="low_stock">Low Stock (1-10 warning)</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as any);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full h-10 px-3.5 bg-slate-50 border-slate-200 rounded-xl text-xs font-medium">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active only</SelectItem>
                <SelectItem value="Draft">Draft only</SelectItem>
                <SelectItem value="Archived">Archived only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary controls row: Sort & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Found <strong className="text-slate-800">{totalItems}</strong> products
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[#A44101] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by:</span>
            </div>
            <div className="w-[170px]">
              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as any)}
              >
                <SelectTrigger className="h-8 px-2.5 bg-slate-50 border-slate-200 rounded-lg text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="date">Recently Added</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="stock">Stock Level</SelectItem>
                  <SelectItem value="name">Product Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 ml-1">
              <span>Rows:</span>
              <div className="w-[72px]">
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 px-2 bg-slate-50 border-slate-200 rounded-lg text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {selectedProductIds.length > 0 && (
        <div className="bg-white border border-orange-200/90 p-2.5 px-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          {/* Left Side: Badge & Label */}
          <div className="flex items-center gap-2.5">
            <span className="bg-[#FFEADB] text-[#F97316] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              {selectedProductIds.length} selected
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Bulk Actions:
            </span>
          </div>

          {/* Right Side: Action Pills, Dropdown & Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Set as Ecom Pill with Shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border border-[#10B981] text-[#059669] hover:bg-emerald-50 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white shadow-2xs cursor-pointer"
                >
                  <span>Set as Ecom</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#059669]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => handleSetEcomStatus('Active')} className="text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetEcomStatus('Draft')} className="text-slate-700 hover:text-amber-700 hover:bg-amber-50 cursor-pointer">
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetEcomStatus('Archived')} className="text-slate-700 hover:text-rose-700 hover:bg-rose-50 cursor-pointer">
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Set as Wholesale Pill with Shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border border-[#8B5CF6] text-[#7C3AED] hover:bg-purple-50 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white shadow-2xs cursor-pointer"
                >
                  <span>Set as Wholesale</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7C3AED]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => handleSetWholesaleStatus('Active')} className="text-slate-700 hover:text-purple-700 hover:bg-purple-50 cursor-pointer">
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetWholesaleStatus('Draft')} className="text-slate-700 hover:text-amber-700 hover:bg-amber-50 cursor-pointer">
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetWholesaleStatus('Archived')} className="text-slate-700 hover:text-rose-700 hover:bg-rose-50 cursor-pointer">
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Vertical Divider */}
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Choose label Dropdown with Shadcn Select */}
            <div className="w-[155px]">
              <Select
                value={selectedLabel || '__none__'}
                onValueChange={(val) => setSelectedLabel(val === '__none__' ? '' : val)}
              >
                <SelectTrigger className="h-8 px-3 bg-white border-slate-200 rounded-xl text-xs">
                  <SelectValue placeholder="Choose label..." />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="__none__">Choose label...</SelectItem>
                  {availableBadges.map((badge) => (
                    <SelectItem key={badge} value={badge}>
                      {badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apply label Button */}
            <button
              onClick={handleApplyLabel}
              className="bg-[#FBA588] hover:bg-[#fa9472] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs whitespace-nowrap"
            >
              Apply label
            </button>

            {/* Remove label Button */}
            <button
              onClick={handleRemoveLabel}
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Remove label
            </button>

            {/* Clear Button */}
            <button
              onClick={() => dispatch(clearSelection())}
              className="text-slate-500 hover:text-slate-800 text-xs font-medium px-2 py-1.5 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title={isAllPageSelected ? "Deselect all on this page" : "Select all on this page"}
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : isSomePageSelected ? (
                      <div className="w-4 h-4 bg-indigo-600/30 rounded flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-indigo-600" />
                      </div>
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU & Category</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
                  const isOutOfStock = product.stock === 0;

                  const displayImage = typeof product.image === 'string' && product.image
                    ? product.image
                    : ((product.image as any)?.url || (product.image as any)?.secure_url || '/images/products/placeholder.png');

                  const numCurrentPrice = Number(
                    typeof product.currentPrice === 'object'
                      ? ((product.currentPrice as any)?.sale ?? (product.currentPrice as any)?.base ?? 0)
                      : product.currentPrice || 0
                  );

                  const numOriginalPrice = Number(
                    typeof product.originalPrice === 'object'
                      ? ((product.originalPrice as any)?.base ?? (product.originalPrice as any)?.sale ?? numCurrentPrice)
                      : product.originalPrice || numCurrentPrice
                  );

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => dispatch(toggleSelectProduct(product.id))}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={displayImage}
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div className="min-w-0 max-w-xs md:max-w-md">
                            <h3 className="font-semibold text-slate-900 truncate text-xs sm:text-sm hover:text-indigo-600 transition-colors">
                              {product.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {product.brand && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {product.brand} •
                                </span>
                              )}
                              {product.tag && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  {product.tag}
                                </span>
                              )}
                              {product.badges?.map((badge, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Category */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-700">
                          {product.sku}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {product.category}
                          {product.subcategory && (
                            <span className="text-slate-400"> › {product.subcategory}</span>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-amber-700 mt-0.5 font-medium flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" /> Low stock alert
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          ₹{numCurrentPrice.toLocaleString()}
                        </div>
                        {numOriginalPrice > numCurrentPrice && (
                          <div className="text-[11px] text-slate-400 line-through">
                            ₹{numOriginalPrice.toLocaleString()}
                          </div>
                        )}
                        {product.discountPercentage > 0 && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            {product.discountPercentage}% OFF
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:scale-105 ${product.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : product.status === 'Draft'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          title="Click to toggle status (Active / Draft)"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'Active' ? 'bg-emerald-500' : product.status === 'Draft' ? 'bg-amber-500' : 'bg-slate-500'
                            }`} />
                          {product.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Stock Adjust Button */}
                          <button
                            onClick={() => onStockAdjust(product)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Quick Stock Adjustment"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>

                          {/* Edit Modal Button */}
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Archive / Delete Button */}
                          <button
                            onClick={() => onArchiveProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Archive / Remove Product"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Client-side Pagination Footer */}
        {totalItems > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Showing <strong className="text-slate-800">{(validCurrentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-slate-800">
                {Math.min(validCurrentPage * pageSize, totalItems)}
              </strong>{' '}
              of <strong className="text-slate-800">{totalItems}</strong> entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, and pages close to current page
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - validCurrentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const prev = array[index - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg font-semibold transition-all ${validCurrentPage === page
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
