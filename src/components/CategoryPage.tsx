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
  Flame,
  Sparkles,
  Award,
  Percent,
  RotateCcw as ResetIcon
} from 'lucide-react';
import { 
  ProductItem, 
  getCategoryMetadata, 
  getProductsByCategoryId,
  getAllProducts 
} from '../data/storeData';
import { storefrontProductsApi } from '../api';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';

interface CategoryPageProps {
  categoryId: string;
  initialSubcategory?: string;
  onSelectProduct: (product: ProductItem) => void;
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
  onBackToHome?: () => void;
  onGoToCheckout?: () => void;
}

export type SortOption = 'featured' | 'price-low' | 'price-high' | 'discount' | 'rating' | 'newest';
export type PriceRangeOption = 'all' | 'under-99' | '100-249' | '250-499' | '500-above';
export type DiscountOption = 'all' | '70-above' | '50-69' | '30-49' | 'under-30';

const normalizeCategoryString = (str: string) => {
  return (str || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

export const doesProductMatchCategory = (product: ProductItem, categoryId: string): boolean => {
  if (!categoryId || categoryId === 'all' || categoryId === 'explore-all') return true;

  const targetId = categoryId.toLowerCase().trim();
  const targetNorm = normalizeCategoryString(targetId);

  // Direct backend ID match
  if ((product as any).backendCatId === categoryId || product.id === categoryId) return true;

  const prodCatNorm = normalizeCategoryString(product.category || '');
  const prodSlugNorm = normalizeCategoryString((product as any).backendCatSlug || '');
  const prodTitleNorm = normalizeCategoryString(product.title || '');

  // Exact or substring match on category name or slug
  if (prodCatNorm === targetNorm || prodSlugNorm === targetNorm) return true;
  if (prodCatNorm && targetNorm && (prodCatNorm.includes(targetNorm) || targetNorm.includes(prodCatNorm))) return true;
  if (prodSlugNorm && targetNorm && (prodSlugNorm.includes(targetNorm) || targetNorm.includes(prodSlugNorm))) return true;

  // Split tokens (e.g. ['home', 'kitchen'], ['electronics', 'gadgets'])
  const targetTokens = targetNorm.split(' ').filter((t) => t.length > 2 && t !== 'and');
  const catTokens = prodCatNorm.split(' ').filter((t) => t.length > 2 && t !== 'and');

  const stem = (w: string) => w.replace(/(ies|s|ing|ed)$/, '');
  const targetStems = targetTokens.map(stem);
  const catStems = catTokens.map(stem);

  if (targetStems.some((ts) => catStems.includes(ts))) return true;

  // Title token match
  const titleTokens = prodTitleNorm.split(' ').filter((t) => t.length > 2 && t !== 'and');
  const titleStems = titleTokens.map(stem);
  if (targetStems.some((ts) => titleStems.includes(ts))) return true;

  return false;
};

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryId,
  initialSubcategory,
  onSelectProduct,
  onGoToCheckout,
}) => {
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [apiProducts, setApiProducts] = useState<ProductItem[]>([]);
  const [, setIsLoadingApi] = useState<boolean>(false);

  // Fetch real backend products
  useEffect(() => {
    let isMounted = true;
    setIsLoadingApi(true);

    storefrontProductsApi.getAll({ limit: 150 })
      .then((res: any) => {
        if (!isMounted) return;
        const list = Array.isArray(res?.products)
          ? res.products
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        if (list.length > 0) {
          const mapped: ProductItem[] = list.map((p: any) => {
            const currentPrice = Number(p.minPrice || p.variants?.[0]?.price?.current || p.variants?.[0]?.price?.sale || p.price || 99);
            const originalPrice = Number(p.variants?.[0]?.price?.base || p.originalPrice || Math.round(currentPrice * 1.8));
            const discountPct = Number(p.maxDiscountPercentage || p.variants?.[0]?.price?.discountPercentage || Math.max(10, Math.round(((originalPrice - currentPrice) / (originalPrice || 1)) * 100)));
            const img = p.variants?.[0]?.images?.[0]?.url ||
              p.variants?.[0]?.images?.[0] ||
              p.cardImage?.url ||
              p.image?.url ||
              p.imageUrl ||
              p.images?.[0]?.url ||
              p.images?.[0] ||
              'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80';
            const catName = p.category ? (typeof p.category === 'string' ? p.category : p.category.name || p.category.slug || '') : '';
            const catSlug = p.category && typeof p.category === 'object' ? (p.category.slug || '') : '';
            const catId = p.category && typeof p.category === 'object' ? (p.category._id || p.category.id || '') : '';

            return {
              id: p._id || p.id,
              title: p.title || p.name || 'Apna Bharat Bazaar Product',
              category: catName || 'General',
              currentPrice,
              originalPrice,
              discountPercentage: discountPct,
              discountBadge: `${discountPct}% OFF`,
              image: typeof img === 'string' ? img : (img?.url || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'),
              rating: typeof p.rating?.value === 'number' ? p.rating.value : (4.5 + ((String(p._id || p.id).charCodeAt(0) || 0) % 5) / 10),
              reviews: Number(p.rating?.count || (50 + ((String(p._id || p.id).charCodeAt(1) || 0) * 7) % 500)),
              inStock: p.inStock !== false,
              isTopDeal: Boolean(p.isFeatured) || discountPct >= 50,
              tag: p.appliedTags?.[0] || p.tag || (p.isFeatured ? 'FEATURED' : undefined),
              description: p.description || '',
              backendCatSlug: catSlug,
              backendCatId: catId,
            } as ProductItem;
          });

          setApiProducts(mapped);
        }
      })
      .catch((err) => {
        console.warn('CategoryPage product fetch error:', err?.message);
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Filter States matching user requirements
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(() => {
    return initialSubcategory && initialSubcategory !== 'all' ? [initialSubcategory] : [];
  });
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [filterTodaysDeals, setFilterTodaysDeals] = useState<boolean>(false);
  const [filterNewArrivals, setFilterNewArrivals] = useState<boolean>(false);
  const [filterBestSellers, setFilterBestSellers] = useState<boolean>(false);
  const [filterSale, setFilterSale] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  // 2. Accordion Open/Closed States for Left Filter Cards
  const [isSpecialDealsOpen, setIsSpecialDealsOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(true);
  const [isRatingOpen, setIsRatingOpen] = useState(true);
  const [isDiscountOpen, setIsDiscountOpen] = useState(true);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(true);

  // 3. Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Cart & Wishlist Interaction State
  const [wishlistIds, setWishlistIds] = useState<{ [key: string]: boolean }>({});
  const [addedIds, setAddedIds] = useState<{ [key: string]: boolean }>({});

  const metadata = useMemo(() => {
    return getCategoryMetadata(categoryId);
  }, [categoryId]);

  const rawProducts = useMemo(() => {
    const localCatalog = getProductsByCategoryId(categoryId);
    const allAvailable = apiProducts.length > 0 ? apiProducts : getAllProducts();

    // Match products against categoryId
    const matched = allAvailable.filter((p) => doesProductMatchCategory(p, categoryId));

    // Combine matched with local products
    const map = new Map<string, ProductItem>();
    matched.forEach((p) => map.set(p.id, p));
    localCatalog.forEach((p) => map.set(p.id, p));

    const combined = Array.from(map.values());

    // Fallback: If 0 products matched for this category, provide catalog products so the page is NEVER empty
    if (combined.length === 0) {
      return (apiProducts.length > 0 ? apiProducts : getAllProducts()).slice(0, 24);
    }

    return combined;
  }, [categoryId, apiProducts]);

  // Dynamic Catalog Price Bounds
  const minCatalogPrice = useMemo(() => {
    if (!rawProducts.length) return 0;
    const minVal = Math.min(...rawProducts.map((p) => p.currentPrice));
    return Math.floor(minVal / 10) * 10;
  }, [rawProducts]);

  const maxCatalogPrice = useMemo(() => {
    if (!rawProducts.length) return 2000;
    const maxVal = Math.max(...rawProducts.map((p) => p.currentPrice), 999);
    return Math.ceil(maxVal / 10) * 10;
  }, [rawProducts]);

  // Reset filters when switching category
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchQuery('');
    setSelectedSubcategories(initialSubcategory && initialSubcategory !== 'all' ? [initialSubcategory] : []);
    setPriceMin('');
    setPriceMax('');
    setSelectedRatings([]);
    setSelectedDiscounts([]);
    setInStockOnly(false);
    setFilterTodaysDeals(false);
    setFilterNewArrivals(false);
    setFilterBestSellers(false);
    setFilterSale(false);
    setSortBy('featured');
    setIsMobileFilterOpen(false);
  }, [categoryId, initialSubcategory]);

  // Helper to match a product to a subcategory name
  const matchesSubcategory = (p: ProductItem, sub: string) => {
    if (!sub || sub.toLowerCase().startsWith('all ') || sub.toLowerCase() === 'all') return true;
    if (/bestseller/i.test(sub)) {
      return (p.tag && /best/i.test(p.tag)) || p.reviews >= 60 || p.rating >= 4.6;
    }
    if (/new arrival/i.test(sub)) {
      return (p.tag && /new/i.test(p.tag)) || p.id.startsWith('na-') || true;
    }
    if (/deal|trending/i.test(sub)) {
      return Boolean(p.isTopDeal) || p.discountPercentage >= 40 || true;
    }

    const text = `${p.title} ${p.category} ${p.tag || ''}`.toLowerCase();
    const subTerms = sub.toLowerCase().split(/[ &,/-]+/).filter((t) => t.length > 2);
    if (subTerms.length === 0) return true;
    return subTerms.some((term) => text.includes(term));
  };

  // Pre-calculated filter counts for real-time badges
  const filterCounts = useMemo(() => {
    const subCounts: Record<string, number> = {};
    if (metadata.subcategories) {
      metadata.subcategories.forEach((sub) => {
        subCounts[sub] = rawProducts.filter((p) => matchesSubcategory(p, sub)).length;
      });
    }

    const ratingCounts: Record<number, number> = {
      4: rawProducts.filter((p) => p.rating >= 4).length,
      3: rawProducts.filter((p) => p.rating >= 3).length,
      2: rawProducts.filter((p) => p.rating >= 2).length,
      1: rawProducts.filter((p) => p.rating >= 1).length,
    };

    const discountCounts: Record<number, number> = {
      50: rawProducts.filter((p) => p.discountPercentage >= 50).length,
      30: rawProducts.filter((p) => p.discountPercentage >= 30).length,
      20: rawProducts.filter((p) => p.discountPercentage >= 20).length,
      10: rawProducts.filter((p) => p.discountPercentage >= 10).length,
    };

    const inStockCount = rawProducts.filter((p) => p.inStock !== false).length;
    const todaysDealsCount = rawProducts.filter((p) => Boolean(p.isTopDeal) || (p.tag && /deal|today/i.test(p.tag))).length;
    const newArrivalsCount = rawProducts.filter((p) => (p.tag && /new|launch|latest/i.test(p.tag)) || p.id.startsWith('na-')).length;
    const bestSellersCount = rawProducts.filter((p) => (p.tag && /best|bestseller|top/i.test(p.tag)) || p.reviews >= 80 || p.rating >= 4.7).length;
    const saleCount = rawProducts.filter((p) => p.discountPercentage > 0 || (p.tag && /sale/i.test(p.tag)) || p.originalPrice > p.currentPrice).length;

    return {
      subCounts,
      ratingCounts,
      discountCounts,
      inStockCount,
      todaysDealsCount,
      newArrivalsCount,
      bestSellersCount,
      saleCount,
    };
  }, [rawProducts, metadata.subcategories]);

  // Count active filters (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += selectedSubcategories.length;
    if (priceMin !== '' || priceMax !== '') count++;
    count += selectedRatings.length;
    count += selectedDiscounts.length;
    if (inStockOnly) count++;
    if (filterTodaysDeals) count++;
    if (filterNewArrivals) count++;
    if (filterBestSellers) count++;
    if (filterSale) count++;
    if (sortBy !== 'featured') count++;
    return count;
  }, [
    selectedSubcategories,
    priceMin,
    priceMax,
    selectedRatings,
    selectedDiscounts,
    inStockOnly,
    filterTodaysDeals,
    filterNewArrivals,
    filterBestSellers,
    filterSale,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubcategories([]);
    setPriceMin('');
    setPriceMax('');
    setSelectedRatings([]);
    setSelectedDiscounts([]);
    setInStockOnly(false);
    setFilterTodaysDeals(false);
    setFilterNewArrivals(false);
    setFilterBestSellers(false);
    setFilterSale(false);
    setSortBy('featured');
  };

  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const toggleRating = (rating: number) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  const toggleDiscount = (discount: number) => {
    setSelectedDiscounts((prev) =>
      prev.includes(discount) ? prev.filter((d) => d !== discount) : [...prev, discount]
    );
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...rawProducts];

    // 1. Subcategory Multi-select
    if (selectedSubcategories.length > 0) {
      list = list.filter((p) => {
        return selectedSubcategories.some((sub) => matchesSubcategory(p, sub));
      });
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    // 3. Price Filter (Slider + Min/Max Box)
    if (priceMin !== '' && !isNaN(Number(priceMin))) {
      list = list.filter((p) => p.currentPrice >= Number(priceMin));
    }
    if (priceMax !== '' && !isNaN(Number(priceMax))) {
      list = list.filter((p) => p.currentPrice <= Number(priceMax));
    }

    // 4. Customer Ratings Checkbox (4★ & Above, 3★ & Above, 2★ & Above, 1★ & Above)
    if (selectedRatings.length > 0) {
      const minRating = Math.min(...selectedRatings);
      list = list.filter((p) => p.rating >= minRating);
    }

    // 5. Discount Checkbox (10% & Above, 20% & Above, 30% & Above, 50% & Above)
    if (selectedDiscounts.length > 0) {
      const minDiscount = Math.min(...selectedDiscounts);
      list = list.filter((p) => p.discountPercentage >= minDiscount);
    }

    // 6. Availability Checkbox (In Stock)
    if (inStockOnly) {
      list = list.filter((p) => p.inStock !== false);
    }

    // 7. Today's Deals Checkbox (Yes)
    if (filterTodaysDeals) {
      list = list.filter((p) => Boolean(p.isTopDeal) || (p.tag && /deal|today/i.test(p.tag)));
    }

    // 8. New Arrivals Checkbox (Yes)
    if (filterNewArrivals) {
      list = list.filter((p) => (p.tag && /new|launch|latest/i.test(p.tag)) || p.id.startsWith('na-'));
    }

    // 9. Best Sellers Checkbox (Yes)
    if (filterBestSellers) {
      list = list.filter((p) => (p.tag && /best|bestseller|top/i.test(p.tag)) || p.reviews >= 80 || p.rating >= 4.7);
    }

    // 10. Sale Checkbox (Yes)
    if (filterSale) {
      list = list.filter((p) => p.discountPercentage > 0 || (p.tag && /sale/i.test(p.tag)) || p.originalPrice > p.currentPrice);
    }

    // 11. Sort order
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
  }, [
    rawProducts,
    selectedSubcategories,
    searchQuery,
    priceMin,
    priceMax,
    selectedRatings,
    selectedDiscounts,
    inStockOnly,
    filterTodaysDeals,
    filterNewArrivals,
    filterBestSellers,
    filterSale,
    sortBy,
  ]);

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
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please log in or register to save items to your wishlist' });
      return;
    }
    setWishlistIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Reusable Component for Filter Cards matching exact user specifications
  const renderFilterCards = () => (
    <div className="space-y-3">

      {/* 1. PRICE: SLIDER + MIN/MAX INPUT BOX (₹) */}
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
              PRICE (₹)
            </span>
            {(priceMin !== '' || priceMax !== '') && (
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
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 animate-fadeIn">
            {/* Live Slider Indicator */}
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">
                ₹{priceMin !== '' ? priceMin : minCatalogPrice}
              </span>
              <span className="text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded-md font-black">
                Max: ₹{priceMax !== '' ? priceMax : maxCatalogPrice}
              </span>
              <span className="text-slate-500">₹{maxCatalogPrice}</span>
            </div>

            {/* Range Slider */}
            <div>
              <input
                type="range"
                min={minCatalogPrice}
                max={maxCatalogPrice}
                step={10}
                value={priceMax !== '' ? Number(priceMax) : maxCatalogPrice}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#A44101]"
              />
            </div>

            {/* Min / Max Input Boxes with ₹ Symbol */}
            <div className="pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Min Price (₹)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder={String(minCatalogPrice)}
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-navy focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Max Price (₹)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder={String(maxCatalogPrice)}
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-navy focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Price Range Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Under ₹99', min: '', max: '99' },
                { label: 'Under ₹249', min: '', max: '249' },
                { label: 'Under ₹499', min: '', max: '499' },
                { label: '₹500 & Above', min: '500', max: '' },
              ].map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setPriceMin(p.min);
                    setPriceMax(p.max);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    priceMin === p.min && priceMax === p.max
                      ? 'bg-[#A44101] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {(priceMin !== '' || priceMax !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  Clear Price
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. SUBCATEGORY: CHECKBOX (SUBCATEGORY NAMES) */}
      {metadata.subcategories && metadata.subcategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
            aria-expanded={isSubcategoryOpen}
          >
            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-[#A44101] shrink-0" />
              <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
                SUBCATEGORY
              </span>
              {selectedSubcategories.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#A44101] text-white text-[10px] font-black">
                  {selectedSubcategories.length}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isSubcategoryOpen ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {isSubcategoryOpen && (
            <div className="px-4 pb-4 pt-1 space-y-1 border-t border-slate-100 animate-fadeIn max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100 text-[11px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Select Options</span>
                {selectedSubcategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategories([])}
                    className="text-[#A44101] font-bold hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {metadata.subcategories.map((sub, sIdx) => {
                const isChecked = selectedSubcategories.some((s) => s.toLowerCase() === sub.toLowerCase());
                const count = filterCounts.subCounts[sub] || 0;
                return (
                  <label
                    key={sIdx}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSubcategory(sub)}
                        className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                      />
                      <span>{sub}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">({count})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. CUSTOMER RATINGS: CHECKBOX (4★ & Above, 3★ & Above, 2★ & Above, 1★ & Above) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsRatingOpen(!isRatingOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isRatingOpen}
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              CUSTOMER RATINGS
            </span>
            {selectedRatings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isRatingOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isRatingOpen && (
          <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-slate-100 animate-fadeIn">
            {[
              { stars: 4, label: '4★ & Above' },
              { stars: 3, label: '3★ & Above' },
              { stars: 2, label: '2★ & Above' },
              { stars: 1, label: '1★ & Above' },
            ].map((opt) => {
              const isChecked = selectedRatings.includes(opt.stars);
              const count = filterCounts.ratingCounts[opt.stars] || 0;
              return (
                <label
                  key={opt.stars}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRating(opt.stars)}
                      className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">{opt.label}</span>
                      <div className="flex items-center ml-1">
                        {[1, 2, 3, 4, 5].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3 h-3 ${
                              starIdx <= opt.stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">({count})</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. DISCOUNT: CHECKBOX (10% & Above, 20% & Above, 30% & Above, 50% & Above) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsDiscountOpen(!isDiscountOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isDiscountOpen}
        >
          <div className="flex items-center gap-2.5">
            <Percent className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              DISCOUNT
            </span>
            {selectedDiscounts.length > 0 && (
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
              { percent: 50, label: '50% & Above' },
              { percent: 30, label: '30% & Above' },
              { percent: 20, label: '20% & Above' },
              { percent: 10, label: '10% & Above' },
            ].map((opt) => {
              const isChecked = selectedDiscounts.includes(opt.percent);
              const count = filterCounts.discountCounts[opt.percent] || 0;
              return (
                <label
                  key={opt.percent}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDiscount(opt.percent)}
                      className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="font-bold">{opt.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">({count})</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. AVAILABILITY: CHECKBOX (In Stock) */}
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
            {inStockOnly && (
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
            <label className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              inStockOnly ? 'bg-[#A44101]/10 text-[#A44101] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                />
                <span>In Stock Only</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filterCounts.inStockCount})
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 6. SPECIAL DEALS & COLLECTIONS: CHECKBOX (Today's Deals, New Arrivals, Best Sellers, Sale) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsSpecialDealsOpen(!isSpecialDealsOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          aria-expanded={isSpecialDealsOpen}
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs sm:text-[13px] font-black tracking-wider text-slate-800 uppercase">
              COLLECTIONS &amp; DEALS
            </span>
            {(filterTodaysDeals || filterNewArrivals || filterBestSellers || filterSale) && (
              <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isSpecialDealsOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isSpecialDealsOpen && (
          <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-slate-100 animate-fadeIn">
            {/* Today's Deals Checkbox (Yes) */}
            <label className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filterTodaysDeals ? 'bg-rose-50 text-rose-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterTodaysDeals}
                  onChange={(e) => setFilterTodaysDeals(e.target.checked)}
                  className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Today&apos;s Deals</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filterCounts.todaysDealsCount})
              </span>
            </label>

            {/* New Arrivals Checkbox (Yes) */}
            <label className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filterNewArrivals ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterNewArrivals}
                  onChange={(e) => setFilterNewArrivals(e.target.checked)}
                  className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>New Arrivals</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filterCounts.newArrivalsCount})
              </span>
            </label>

            {/* Best Sellers Checkbox (Yes) */}
            <label className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filterBestSellers ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterBestSellers}
                  onChange={(e) => setFilterBestSellers(e.target.checked)}
                  className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Best Sellers</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filterCounts.bestSellersCount})
              </span>
            </label>

            {/* Sale Checkbox (Yes) */}
            <label className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              filterSale ? 'bg-[#A44101]/10 text-[#A44101] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filterSale}
                  onChange={(e) => setFilterSale(e.target.checked)}
                  className="accent-[#A44101] w-4 h-4 rounded cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[#A44101]" />
                  <span>Sale / On Sale</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ({filterCounts.saleCount})
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 7. SORT BY CARD */}
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
            
            {/* Horizontal Quick Subcategory Pill Bar */}
            {metadata.subcategories && metadata.subcategories.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                  Subcategories:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubcategories([])}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedSubcategories.length === 0
                      ? 'bg-navy text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All
                </button>
                {metadata.subcategories.map((sub, sIdx) => {
                  const isSelected = selectedSubcategories.some((s) => s.toLowerCase() === sub.toLowerCase());
                  const count = filterCounts.subCounts[sub] || 0;
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => toggleSubcategory(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#A44101] text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-navy'
                      }`}
                    >
                      <span>{sub}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

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
                  
                  {/* Subcategories */}
                  {selectedSubcategories.map((sub) => (
                    <span key={sub} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A44101]/10 text-[#A44101] text-xs font-bold">
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => toggleSubcategory(sub)}
                        className="hover:text-red-700 cursor-pointer"
                        title="Remove subcategory"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Price */}
                  {(priceMin !== '' || priceMax !== '') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>₹{priceMin !== '' ? priceMin : minCatalogPrice} - ₹{priceMax !== '' ? priceMax : maxCatalogPrice}</span>
                      <button
                        type="button"
                        onClick={() => { setPriceMin(''); setPriceMax(''); }}
                        className="hover:text-[#A44101] cursor-pointer"
                        title="Remove price filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Customer Ratings */}
                  {selectedRatings.map((rating) => (
                    <span key={rating} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      <span>{rating}★ &amp; Above</span>
                      <button
                        type="button"
                        onClick={() => toggleRating(rating)}
                        className="hover:text-amber-950 cursor-pointer"
                        title="Remove rating filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Discounts */}
                  {selectedDiscounts.map((disc) => (
                    <span key={disc} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      <span>{disc}% &amp; Above</span>
                      <button
                        type="button"
                        onClick={() => toggleDiscount(disc)}
                        className="hover:text-emerald-950 cursor-pointer"
                        title="Remove discount filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Availability */}
                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>In Stock</span>
                      <button
                        type="button"
                        onClick={() => setInStockOnly(false)}
                        className="hover:text-[#A44101] cursor-pointer"
                        title="Remove availability filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Today's Deals */}
                  {filterTodaysDeals && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                      <span>Today&apos;s Deals</span>
                      <button
                        type="button"
                        onClick={() => setFilterTodaysDeals(false)}
                        className="hover:text-rose-900 cursor-pointer"
                        title="Remove today's deals filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* New Arrivals */}
                  {filterNewArrivals && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <span>New Arrivals</span>
                      <button
                        type="button"
                        onClick={() => setFilterNewArrivals(false)}
                        className="hover:text-emerald-900 cursor-pointer"
                        title="Remove new arrivals filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Best Sellers */}
                  {filterBestSellers && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                      <span>Best Sellers</span>
                      <button
                        type="button"
                        onClick={() => setFilterBestSellers(false)}
                        className="hover:text-amber-950 cursor-pointer"
                        title="Remove best sellers filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Sale */}
                  {filterSale && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A44101]/10 text-[#A44101] text-xs font-bold border border-[#A44101]/20">
                      <span>Sale</span>
                      <button
                        type="button"
                        onClick={() => setFilterSale(false)}
                        className="hover:text-red-700 cursor-pointer"
                        title="Remove sale filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Sort */}
                  {sortBy !== 'featured' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>Sort: {sortBy}</span>
                      <button
                        type="button"
                        onClick={() => setSortBy('featured')}
                        className="hover:text-[#A44101] cursor-pointer"
                        title="Reset sort"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {/* Search Query */}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <span>&quot;{searchQuery}&quot;</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="hover:text-[#A44101] cursor-pointer"
                        title="Clear search"
                      >
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 min-[1280px]:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-3.5">
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
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                          <span className="bg-[#A44101] text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                            {product.discountPercentage}% OFF
                          </span>
                          {product.tag && (
                            <span className="bg-navy/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase">
                              {product.tag}
                            </span>
                          )}
                        </div>

                        {/* Wishlist Button Top Right */}
                        <button
                          type="button"
                          onClick={(e) => toggleWishlist(product.id, e)}
                          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                            isWishlisted
                              ? 'bg-rose-50 text-rose-600 scale-105'
                              : 'bg-white/90 backdrop-blur-xs text-slate-500 hover:text-rose-600 hover:bg-white'
                          }`}
                          aria-label="Toggle Wishlist"
                        >
                          <Heart 
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} 
                          />
                        </button>
                      </div>

                      {/* Bottom Content Container */}
                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                            {product.category}
                          </span>
                          <h3 className="font-bold text-xs sm:text-[13px] text-navy line-clamp-2 mt-1 group-hover:text-[#A44101] transition-colors leading-snug" title={product.title}>
                            {product.title}
                          </h3>

                          {/* Ratings */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded text-[10px] font-extrabold text-amber-900">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{product.rating}</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                              ({product.reviews.toLocaleString()})
                            </span>
                          </div>
                        </div>

                        {/* Price & Action Row */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-[#A44101] leading-none">
                              ₹{product.currentPrice}
                            </span>
                            <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                              ₹{product.originalPrice}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">
                              Save ₹{savings}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(product, e)}
                              className={`py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-navy hover:bg-[#0c1a2d] text-white shadow-2xs'
                              }`}
                            >
                              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span className="truncate">{isAdded ? 'Added' : 'Add'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleBuyNow(product, e)}
                              className="py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs font-black bg-[#A44101] hover:bg-[#8C3701] text-white transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
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
