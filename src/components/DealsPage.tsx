import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Sparkles, 
  Search, 
  ArrowUpDown, 
  Heart, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { ProductItem, getAllProducts } from '../data/storeData';
import { storefrontWishlistApi, apiClient } from '../api';
import { useCart } from '../context/CartContext';
import { isAuthenticated, requireAuth } from '../utils/authGuard';
import { toast } from 'react-hot-toast';

interface DealsPageProps {
  dealType: string; // 'today-deals' | 'on-sale' | 'today-arrival' | tag slug
  onSelectProduct: (product: ProductItem) => void;
  onBackToHome?: () => void;
  onGoToCheckout?: () => void;
}

type SortOption = 'discount' | 'price-low' | 'price-high' | 'rating' | 'popular';
type PriceFilter = 'all' | 'under-99' | '100-249' | '250-499' | '500-above';

export const DealsPage: React.FC<DealsPageProps> = ({
  dealType,
  onSelectProduct,
  onBackToHome,
}) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<PriceFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('discount');
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

  // Countdown timer for deals urgency (counts down to midnight)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 7,
    minutes: 42,
    seconds: 15,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute page title and details according to dealType
  const pageMeta = useMemo(() => {
    const type = (dealType || '').toLowerCase();
    if (type.includes('sale')) {
      return {
        title: 'On Sale - Mega Clearance Deals',
        badge: 'SALE • UP TO 80% OFF',
        icon: Flame,
        badgeBg: 'bg-[#A44101]',
        description: 'Exclusive factory direct markdowns, end of season wholesale pricing, and limited-stock clearance items.',
      };
    }
    if (type.includes('today') || type.includes('arrival')) {
      return {
        title: "Today's Flash Deals & New Arrivals",
        badge: "TODAY'S SPECIAL • 24H DISPATCH",
        icon: Flame,
        badgeBg: 'bg-[#A44101]',
        description: 'Verified top deals refreshed daily. High demand items ready for immediate 24-hour factory dispatch.',
      };
    }
    // Custom Tag/Campaign
    const readable = type.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${readable} Special Collection`,
      badge: 'LIMITED FESTIVE DEAL',
      icon: Sparkles,
      badgeBg: 'bg-[#A44101]',
      description: `Curated deals and wholesale discounts for ${readable}. Hand-selected top sellers at best direct prices.`,
    };
  }, [dealType]);

  // Load products from API and local database
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadDeals = async () => {
      try {
        let apiProducts: ProductItem[] = [];
        try {
          const res = await apiClient.get('/products/all?limit=250');
          const raw = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(raw) && raw.length > 0) {
            apiProducts = raw
              .map((p: any) => {
                const img =
                  p.variants?.[0]?.images?.[0]?.url ||
                  (typeof p.variants?.[0]?.images?.[0] === 'string' ? p.variants?.[0]?.images?.[0] : null) ||
                  p.cardImage?.url ||
                  (Array.isArray(p.images) && p.images[0]?.url) ||
                  (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http') ? p.thumbnail : null);

                if (!img) return null;

                const currentPrice = Number(
                  p.minPrice ||
                  p.variants?.[0]?.finalPrice ||
                  p.variants?.[0]?.price?.current ||
                  p.variants?.[0]?.price?.sale ||
                  p.price ||
                  99
                );
                const originalPrice = Number(
                  p.variants?.[0]?.price?.base ||
                  p.originalPrice ||
                  Math.round(currentPrice * 1.6)
                );
                const discountPercentage = Number(
                  p.maxDiscountPercentage ||
                  p.variants?.[0]?.discountPercentage ||
                  Math.max(10, Math.round(((originalPrice - currentPrice) / (originalPrice || 1)) * 100))
                );

                const catName = p.category
                  ? typeof p.category === 'string'
                    ? p.category
                    : p.category.name || p.category.slug || ''
                  : 'General';

                return {
                  id: p._id || p.id,
                  slug: p.slug,
                  title: p.title || p.name || 'Product',
                  category: catName || 'General',
                  currentPrice,
                  originalPrice,
                  discountPercentage,
                  image: img,
                  rating: typeof p.rating === 'number' ? p.rating : (p.rating?.value || 4.8),
                  reviews: p.soldInfo?.count || 85,
                  inStock: p.inStock !== undefined ? p.inStock : true,
                  isTopDeal: discountPercentage >= 40,
                  tag: discountPercentage >= 50 ? 'MEGA DEAL' : undefined,
                };
              })
              .filter(Boolean) as ProductItem[];
          }
        } catch (err) {
          console.warn('Could not fetch products from API for deals page:', err);
        }

        // Combine API products with fallback catalog
        const localCatalog = getAllProducts();
        const combinedMap = new Map<string, ProductItem>();
        apiProducts.forEach((p) => combinedMap.set(p.id, p));
        localCatalog.forEach((p) => {
          if (!combinedMap.has(p.id)) combinedMap.set(p.id, p);
        });

        let all = Array.from(combinedMap.values());

        // Filter according to dealType
        const type = (dealType || '').toLowerCase();
        let filtered: ProductItem[] = [];

        if (type.includes('sale')) {
          // On sale items: discount >= 35% or marked top deal
          filtered = all.filter((p) => p.discountPercentage >= 35 || p.isTopDeal);
          if (filtered.length < 8) filtered = all.slice(0, 24);
        } else if (type.includes('today') || type.includes('arrival')) {
          // Today's deals: top deals, under ₹299, or discount >= 40%
          filtered = all.filter((p) => p.isTopDeal || p.discountPercentage >= 40 || p.currentPrice <= 299);
          if (filtered.length < 8) filtered = all.slice(0, 24);
        } else {
          // Tag or keyword matching
          const tagTerm = type.replace(/[-_]/g, ' ');
          filtered = all.filter((p) => {
            const str = `${p.title} ${p.category} ${p.tag || ''}`.toLowerCase();
            return str.includes(tagTerm) || tagTerm.split(' ').some((w) => w.length > 2 && str.includes(w));
          });
          if (filtered.length < 4) {
            filtered = all.filter((p) => p.isTopDeal || p.discountPercentage >= 40);
          }
        }

        if (isMounted) {
          setProducts(filtered);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('Deals loading error:', e);
        if (isMounted) {
          setProducts(getAllProducts().slice(0, 20));
          setIsLoading(false);
        }
      }
    };

    loadDeals();

    return () => {
      isMounted = false;
    };
  }, [dealType]);

  // Wishlist handler
  const handleToggleWishlist = async (prod: ProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please sign in to add products to your wishlist' });
      return;
    }

    const next = new Set(wishlistIds);
    const isNowWishlisted = !next.has(prod.id);
    if (isNowWishlisted) {
      next.add(prod.id);
      toast.success(`"${prod.title.slice(0, 28)}..." added to wishlist!`, {
        icon: '❤️',
        duration: 2500,
      });
    } else {
      next.delete(prod.id);
      toast.success('Removed from wishlist');
    }
    setWishlistIds(next);

    try {
      await storefrontWishlistApi.toggle(prod.id, prod.slug || prod.id);
    } catch {
      // Background sync
    }
  };

  // Add to cart handler
  const handleAddToCart = (prod: ProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(prod, 1);
    setAddedItemIds((prev) => new Set(prev).add(prod.id));
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(prod.id);
        return next;
      });
    }, 2000);
  };

  // Extract unique categories available in these deals
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter and sort products
  const displayedProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Price range filter
    if (selectedPriceFilter === 'under-99') {
      result = result.filter((p) => p.currentPrice < 99);
    } else if (selectedPriceFilter === '100-249') {
      result = result.filter((p) => p.currentPrice >= 99 && p.currentPrice <= 249);
    } else if (selectedPriceFilter === '250-499') {
      result = result.filter((p) => p.currentPrice >= 250 && p.currentPrice <= 499);
    } else if (selectedPriceFilter === '500-above') {
      result = result.filter((p) => p.currentPrice >= 500);
    }

    // Sort order
    if (selectedSort === 'discount') {
      result.sort((a, b) => b.discountPercentage - a.discountPercentage);
    } else if (selectedSort === 'price-low') {
      result.sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (selectedSort === 'price-high') {
      result.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (selectedSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'popular') {
      result.sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedPriceFilter, selectedSort]);

  const IconComponent = pageMeta.icon;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-5 sm:py-8 font-sans animate-fadeIn select-none">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-[#A44101] font-semibold transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-navy truncate">{pageMeta.title}</span>
        </div>

        {/* Hero Deal Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-[#A44101] via-[#8C3701] to-navy p-6 sm:p-8 text-white overflow-hidden shadow-sm">
          {/* Subtle Background Glow Circles */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-xs font-black tracking-wide uppercase">
                <IconComponent className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{pageMeta.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {pageMeta.title}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                {pageMeta.description}
              </p>
            </div>

            {/* Urgency Countdown Card */}
            <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center min-w-[240px]">
              <div className="flex items-center justify-center gap-1.5 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Today's Deal Ends In</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-white">
                <div className="bg-black/30 rounded-lg px-2.5 py-1.5">
                  <span className="text-lg font-black font-mono">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-300">Hours</span>
                </div>
                <span className="text-lg font-black text-amber-300">:</span>
                <div className="bg-black/30 rounded-lg px-2.5 py-1.5">
                  <span className="text-lg font-black font-mono">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-300">Mins</span>
                </div>
                <span className="text-lg font-black text-amber-300">:</span>
                <div className="bg-black/30 rounded-lg px-2.5 py-1.5">
                  <span className="text-lg font-black font-mono">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-300">Secs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deals by product name or keyword..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#A44101] bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort by:</span>
              </span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as SortOption)}
                className="text-xs font-bold text-navy bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-[#A44101]"
              >
                <option value="discount">Highest Discount %</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Price Range & Category Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter:
            </span>

            {/* Price Filter Chips */}
            {[
              { id: 'all', label: 'All Prices' },
              { id: 'under-99', label: 'Under ₹99' },
              { id: '100-249', label: '₹99 - ₹249' },
              { id: '250-499', label: '₹250 - ₹499' },
              { id: '500-above', label: '₹500+' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPriceFilter(p.id as PriceFilter)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedPriceFilter === p.id
                    ? 'bg-[#A44101] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Reset Filters button if filtered */}
            {(selectedCategory !== 'all' || selectedPriceFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedPriceFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-[#A44101] hover:underline flex items-center gap-1 ml-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Category Pills if multiple exist */}
          {availableCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-navy text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                All Departments ({products.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer truncate max-w-[200px] ${
                    selectedCategory === cat
                      ? 'bg-navy text-white'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>
            Showing <strong className="text-navy">{displayedProducts.length}</strong> verified deal products
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Factory Wholesale Pricing</span>
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs animate-pulse space-y-3">
                <div className="aspect-square rounded-xl bg-slate-100" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-9 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
            {displayedProducts.map((prod) => {
              const isWish = wishlistIds.has(prod.id);
              const isAdded = addedItemIds.has(prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs hover:border-[#A44101] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  {/* Top Image Box */}
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center mb-3">
                      {/* Discount Badge */}
                      <span className="absolute top-2 left-2 z-10 bg-[#A44101] text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
                        {prod.discountPercentage}% OFF
                      </span>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleWishlist(prod, e)}
                        className={`absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          isWish
                            ? 'bg-rose-50 border-rose-300 text-rose-500 shadow-xs'
                            : 'bg-white/90 border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-white'
                        }`}
                        aria-label="Wishlist"
                      >
                        <Heart className={`w-4 h-4 ${isWish ? 'fill-rose-500' : ''}`} />
                      </button>

                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Category Label */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                      {prod.category}
                    </span>

                    {/* Product Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-navy line-clamp-2 leading-snug group-hover:text-[#A44101] transition-colors mt-0.5">
                      {prod.title}
                    </h3>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base sm:text-lg font-black text-navy">
                        ₹{prod.currentPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{prod.originalPrice}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">
                        Save ₹{prod.originalPrice - prod.currentPrice}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="pt-3 mt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(prod, e)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#A44101] hover:bg-[#8C3701] text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
              🔍
            </div>
            <h3 className="text-base font-bold text-navy">No Deals Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any deals matching your selected filters. Try searching for other terms or reset your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedPriceFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#A44101] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#8C3701] transition-colors"
            >
              Show All Available Deals
            </button>
          </div>
        )}

        {/* Wholesale Inquiry Strip */}
        <div className="rounded-2xl p-5 bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1 text-center sm:text-left">
            <span className="font-extrabold text-sm text-[#A44101] flex items-center justify-center sm:justify-start gap-1.5">
              <span>Ordering in Bulk for Business or Reselling?</span>
            </span>
            <p className="text-slate-600">
              Get special tier discounts on orders above ₹3,000 with GST invoice and pan-India subsidized freight.
            </p>
          </div>
          <a
            href="/bulk-orders"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/bulk-orders');
              window.dispatchEvent(new PopStateEvent('popstate'));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-2.5 bg-[#A44101] hover:bg-[#8C3701] text-white font-bold rounded-xl shrink-0 cursor-pointer transition-colors shadow-2xs"
          >
            Send Bulk Inquiry →
          </a>
        </div>

      </div>
    </div>
  );
};
