import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Star, 
  ShoppingCart, 
  Heart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Tag,
  ChevronDown, 
  Zap, 
  ArrowUpDown, 
  IndianRupee, 
  Package, 
  X, 
  SlidersHorizontal,
  RotateCcw as ResetIcon
} from 'lucide-react';
import { 
  ProductItem, 
  getCategoryMetadata, 
  getProductsByCategoryId 
} from '../data/storeData';
import { useCart } from '../context/CartContext';

interface CategoryPageProps {
  categoryId: string;
  onSelectProduct: (product: ProductItem) => void;
  onSelectCategory?: (categoryId: string) => void;
  onBackToHome?: () => void;
  onGoToCheckout?: () => void;
}

export type SortOption = 'featured' | 'price-low' | 'price-high' | 'discount' | 'rating' | 'newest';
export type PriceRangeOption = 'all' | 'under-99' | '100-249' | '250-499' | '500-above';
export type DiscountOption = 'all' | '70-above' | '50-69' | '30-49' | 'under-30';

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryId,
  onSelectProduct,
  onGoToCheckout,
}) => {
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter States
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [priceRange, setPriceRange] = useState<PriceRangeOption>('all');
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [fastDispatchOnly, setFastDispatchOnly] = useState<boolean>(false);
  const [codOnly, setCodOnly] = useState<boolean>(false);
  const [discountOffer, setDiscountOffer] = useState<DiscountOption>('all');

  // 2. Accordion Open/Closed States for the 4 Left Cards
  const [isSortOpen, setIsSortOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(true);
  const [isDiscountOpen, setIsDiscountOpen] = useState(true);

  // 3. Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Cart & Wishlist Interaction State
  const [wishlistIds, setWishlistIds] = useState<{ [key: string]: boolean }>({});
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({});

  // Reset filters when switching category
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchQuery('');
    setSortBy('featured');
    setPriceRange('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setInStockOnly(false);
    setFastDispatchOnly(false);
    setCodOnly(false);
    setDiscountOffer('all');
    setIsMobileFilterOpen(false);
  }, [categoryId]);

  const metadata = useMemo(() => {
    return getCategoryMetadata(categoryId);
  }, [categoryId]);

  const rawProducts = useMemo(() => {
    return getProductsByCategoryId(categoryId);
  }, [categoryId]);

  // Count active filters (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== 'featured') count++;
    if (priceRange !== 'all' || customMinPrice || customMaxPrice) count++;
    if (inStockOnly || fastDispatchOnly || codOnly) count++;
    if (discountOffer !== 'all') count++;
    return count;
  }, [sortBy, priceRange, customMinPrice, customMaxPrice, inStockOnly, fastDispatchOnly, codOnly, discountOffer]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSortBy('featured');
    setPriceRange('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setInStockOnly(false);
    setFastDispatchOnly(false);
    setCodOnly(false);
    setDiscountOffer('all');
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...rawProducts];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    // Price Range Filter
    if (priceRange === 'under-99') {
      list = list.filter((p) => p.currentPrice <= 99);
    } else if (priceRange === '100-249') {
      list = list.filter((p) => p.currentPrice >= 100 && p.currentPrice <= 249);
    } else if (priceRange === '250-499') {
      list = list.filter((p) => p.currentPrice >= 250 && p.currentPrice <= 499);
    } else if (priceRange === '500-above') {
      list = list.filter((p) => p.currentPrice >= 500);
    }

    // Custom Min/Max Price filter
    if (customMinPrice && !isNaN(Number(customMinPrice))) {
      list = list.filter((p) => p.currentPrice >= Number(customMinPrice));
    }
    if (customMaxPrice && !isNaN(Number(customMaxPrice))) {
      list = list.filter((p) => p.currentPrice <= Number(customMaxPrice));
    }

    // Availability Filter
    if (inStockOnly) {
      list = list.filter((p) => p.inStock !== false);
    }
    if (fastDispatchOnly) {
      list = list.filter((p) => p.isTopDeal || p.inStock);
    }

    // Discount Offers Filter
    if (discountOffer === '70-above') {
      list = list.filter((p) => p.discountPercentage >= 70);
    } else if (discountOffer === '50-69') {
      list = list.filter((p) => p.discountPercentage >= 50 && p.discountPercentage <= 69);
    } else if (discountOffer === '30-49') {
      list = list.filter((p) => p.discountPercentage >= 30 && p.discountPercentage <= 49);
    } else if (discountOffer === 'under-30') {
      list = list.filter((p) => p.discountPercentage < 30);
    }

    // Sort order
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => b.discountPercentage - a.discountPercentage);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.reverse();
    }

    return list;
  }, [rawProducts, searchQuery, priceRange, customMinPrice, customMaxPrice, inStockOnly, fastDispatchOnly, discountOffer, sortBy]);

  const handleAddToCart = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleBuyNow = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product);
    if (onGoToCheckout) {
      onGoToCheckout();
    }
  };

  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlistIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Reusable Component for the 4 Filter Cards matching user screenshot
  const renderFilterCards = () => (
    <div className="space-y-3">
      {/* 1. SORT BY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isSortOpen}
        >
          <div className="flex items-center gap-2.5">
            <ArrowUpDown className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              SORT BY
            </span>
            {sortBy !== 'featured' && (
              <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isSortOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isSortOpen && (
          <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-slate-100 animate-fadeIn">
            {[
              { id: 'featured', label: 'Featured Deals' },
              { id: 'price-low', label: 'Price: Low to High' },
              { id: 'price-high', label: 'Price: High to Low' },
              { id: 'discount', label: 'Highest Discount (%)' },
              { id: 'rating', label: 'Customer Rating (Top Stars)' },
              { id: 'newest', label: 'Newest Arrivals' },
            ].map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="sort-option"
                    checked={isSelected}
                    onChange={() => setSortBy(opt.id as SortOption)}
                    className="accent-[#A44101] w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. PRICE RANGE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isPriceOpen}
        >
          <div className="flex items-center gap-2.5">
            <IndianRupee className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              PRICE RANGE
            </span>
            {(priceRange !== 'all' || customMinPrice || customMaxPrice) && (
              <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isPriceOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isPriceOpen && (
          <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100 animate-fadeIn">
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under-99', label: 'Under ₹99 (Pocket Deals)' },
                { id: '100-249', label: '₹100 to ₹249' },
                { id: '250-499', label: '₹250 to ₹499' },
                { id: '500-above', label: '₹500 & Above' },
              ].map((opt) => {
                const isSelected = priceRange === opt.id && !customMinPrice && !customMaxPrice;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <input
                      type="radio"
                      name="price-range"
                      checked={isSelected}
                      onChange={() => {
                        setPriceRange(opt.id as PriceRangeOption);
                        setCustomMinPrice('');
                        setCustomMaxPrice('');
                      }}
                      className="accent-[#A44101] w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            {/* Custom Min / Max Price Inputs */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                Custom Range (₹)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={customMinPrice}
                  onChange={(e) => {
                    setCustomMinPrice(e.target.value);
                    setPriceRange('all');
                  }}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-navy focus:outline-none focus:border-[#A44101]"
                />
                <span className="text-xs text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={customMaxPrice}
                  onChange={(e) => {
                    setCustomMaxPrice(e.target.value);
                    setPriceRange('all');
                  }}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-navy focus:outline-none focus:border-[#A44101]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. AVAILABILITY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsAvailabilityOpen(!isAvailabilityOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isAvailabilityOpen}
        >
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              AVAILABILITY
            </span>
            {(inStockOnly || fastDispatchOnly || codOnly) && (
              <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isAvailabilityOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isAvailabilityOpen && (
          <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-slate-100 animate-fadeIn">
            <label className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50 text-slate-700">
              <span>In Stock Only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50 text-slate-700">
              <span>Fast 24H Dispatch</span>
              <input
                type="checkbox"
                checked={fastDispatchOnly}
                onChange={(e) => setFastDispatchOnly(e.target.checked)}
                className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50 text-slate-700">
              <span>Cash on Delivery (COD)</span>
              <input
                type="checkbox"
                checked={codOnly}
                onChange={(e) => setCodOnly(e.target.checked)}
                className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* 4. DISCOUNT OFFERS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsDiscountOpen(!isDiscountOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isDiscountOpen}
        >
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              DISCOUNT OFFERS
            </span>
            {discountOffer !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isDiscountOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isDiscountOpen && (
          <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-slate-100 animate-fadeIn">
            {[
              { id: 'all', label: 'All Discounts' },
              { id: '70-above', label: '70% Off or More (Mega Deals)' },
              { id: '50-69', label: '50% to 69% Off' },
              { id: '30-49', label: '30% to 49% Off' },
              { id: 'under-30', label: 'Under 30% Off' },
            ].map((opt) => {
              const isSelected = discountOffer === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="discount-offer"
                    checked={isSelected}
                    onChange={() => setDiscountOffer(opt.id as DiscountOption)}
                    className="accent-[#A44101] w-3.5 h-3.5 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50/60 pb-16 font-roboto animate-fadeIn">
      {/* Category Hero Banner */}
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-slate-950 via-slate-900 to-navy text-white min-h-[180px] sm:min-h-[220px] flex items-center p-6 sm:p-10 border border-slate-800">
          <img
            src={metadata.image}
            alt={metadata.name}
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-transparent" />

          {/* Banner Details */}
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#A44101] text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                {metadata.badge}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white text-[11px] font-black">
                {metadata.bannerDiscount}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {metadata.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {metadata.tagline}
            </p>

            {/* Key Trust Perks */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] sm:text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#A44101]" />
                <span>Pan India Fast Delivery</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A44101]" />
                <span>Wholesale Factory Rates</span>
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#A44101]" />
                <span>7-Day Replacement</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Left Filters Sidebar + Right Products Grid */}
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Mobile / Tablet Filter Bar */}
        <div className="lg:hidden mb-4 flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#A44101]" />
            <span>Filters &amp; Sort</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#A44101] text-white text-[10px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">
              {filteredProducts.length} Items Found
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#A44101] underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ============================================================
              LEFT SIDEBAR: 4 FILTER ACCORDION CARDS (Desktop)
             ============================================================ */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-3 sticky top-[135px]">
            {/* Header: Title + Active Count + Reset */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-navy">
                  Refine Products
                </span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#A44101] text-white text-[10px] font-black shadow-2xs">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-[#A44101] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ResetIcon className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* The 4 Filter Cards */}
            {renderFilterCards()}
          </aside>

          {/* ============================================================
              RIGHT COLUMN: SEARCH TOOLBAR, ACTIVE TAGS & PRODUCT GRID
             ============================================================ */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            
            {/* Search Input Bar */}
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search within ${metadata.name}...`}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-navy focus:bg-white focus:outline-none focus:border-[#A44101] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-navy cursor-pointer font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-bold shrink-0 hidden sm:block">
                  Showing <span className="text-navy">{filteredProducts.length}</span> of {rawProducts.length} items
                </div>
              </div>

              {/* Active Filter Chips Strip */}
              {(activeFilterCount > 0 || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-2.5 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Applied:</span>
                  
                  {sortBy !== 'featured' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>Sort: {sortBy}</span>
                      <button type="button" onClick={() => setSortBy('featured')} className="hover:text-[#A44101]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {priceRange !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>Price: {priceRange}</span>
                      <button type="button" onClick={() => setPriceRange('all')} className="hover:text-[#A44101]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {(customMinPrice || customMaxPrice) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>₹{customMinPrice || '0'} - ₹{customMaxPrice || '∞'}</span>
                      <button type="button" onClick={() => { setCustomMinPrice(''); setCustomMaxPrice(''); }} className="hover:text-[#A44101]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>In Stock</span>
                      <button type="button" onClick={() => setInStockOnly(false)} className="hover:text-[#A44101]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {discountOffer !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>Discount: {discountOffer}</span>
                      <button type="button" onClick={() => setDiscountOffer('all')} className="hover:text-[#A44101]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>&quot;{searchQuery}&quot;</span>
                      <button type="button" onClick={() => setSearchQuery('')} className="hover:text-[#A44101]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#A44101] hover:underline ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Products Cards Grid */}
            {filteredProducts.length === 0 ? (
              /* Empty Search / Filter State */
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto my-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-navy">No products match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing some filters on the left or adjusting your search keywords to view available products.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {filteredProducts.map((product) => {
                  const isWishlisted = !!wishlistIds[product.id];
                  const isAdded = !!addedIds[product.id];
                  const savings = product.originalPrice - product.currentPrice;

                  return (
                    <div
                      key={product.id}
                      onClick={() => onSelectProduct(product)}
                      className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-[#A44101]/40 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative"
                    >
                      {/* Top Image Container */}
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                        />

                        {/* Discount Pill Top Left */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                          <span className="bg-[#A44101] text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded shadow-sm">
                            {product.discountPercentage}% OFF
                          </span>
                          {product.tag && (
                            <span className="bg-navy/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase">
                              {product.tag}
                            </span>
                          )}
                        </div>

                        {/* Wishlist Button Top Right */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(product.id, e)}
                          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                            isWishlisted
                              ? 'bg-rose-50 text-rose-600 scale-105'
                              : 'bg-white/90 backdrop-blur-xs text-slate-500 hover:text-rose-600 hover:bg-white'
                          }`}
                          aria-label="Toggle Wishlist"
                        >
                          <Heart 
                            className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} 
                          />
                        </button>
                      </div>

                      {/* Bottom Content Container */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {product.category}
                          </span>
                          <h3 className="font-bold text-xs sm:text-sm text-navy line-clamp-2 mt-1 group-hover:text-[#A44101] transition-colors leading-snug">
                            {product.title}
                          </h3>

                          {/* Ratings */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded text-[10px] font-extrabold text-amber-900">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{product.rating}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              ({product.reviews.toLocaleString()})
                            </span>
                          </div>
                        </div>

                        {/* Price & Action Row */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-black text-[#A44101] leading-none">
                              ₹{product.currentPrice}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              ₹{product.originalPrice}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 hidden sm:inline">
                              Save ₹{savings}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(product, e)}
                              className={`py-2 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-navy hover:bg-[#0c1a2d] text-white shadow-2xs'
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span className="truncate">{isAdded ? 'Added' : 'Add'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleBuyNow(product, e)}
                              className="py-2 px-2 rounded-lg text-xs font-black bg-[#A44101] hover:bg-[#8C3701] text-white transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span className="truncate">Buy Now</span>
                            </button>
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
      </div>

      {/* ============================================================
          MOBILE FILTER SLIDE-OVER DRAWER
         ============================================================ */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-navy/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Slide Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-slate-50 h-full shadow-2xl flex flex-col justify-between overflow-hidden z-10 animate-fadeIn">
            {/* Drawer Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#A44101]" />
                <h3 className="text-sm font-black text-navy uppercase">
                  Filters &amp; Sort
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#A44101] text-white text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-navy rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {renderFilterCards()}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-navy text-white text-xs font-black shadow-sm cursor-pointer"
              >
                View {filteredProducts.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Trust Strip */}
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-navy uppercase">Direct Wholesale Pricing</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Manufacturer direct rates with zero middleman</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-navy uppercase">7-Day Replacement</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Prompt assistance on verified damaged items</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-navy uppercase">24/7 WhatsApp Support</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">+91 93200 01717 instant assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
