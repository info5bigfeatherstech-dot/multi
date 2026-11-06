import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Trash2, 
  ShoppingCart, 
  Check, 
  Star, 
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getAllProducts, ProductItem } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';
import { 
  getWishlistIds, 
  toggleWishlistItem, 
  syncWishlistStorage, 
  clearWishlistStorage 
} from '../utils/wishlistStorage';
import { storefrontWishlistApi, apiClient } from '../api';
import { 
  mapBackendProductToItem, 
  getCachedProduct, 
  cacheProduct, 
  isProductActive 
} from '../utils/productUtils';
import { toast } from 'react-hot-toast';

interface WishlistPageProps {
  onSelectProduct?: (product: ProductItem) => void;
  onBackToHome?: () => void;
  onGoToCheckout?: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onSelectProduct,
  onBackToHome,
  onGoToCheckout,
}) => {
  const { addToCart } = useCart();
  
  // Fast initial hydration from local cache
  const [wishlistItems, setWishlistItems] = useState<ProductItem[]>(() => {
    const ids = getWishlistIds();
    if (ids.length > 0) {
      const allStatic = getAllProducts();
      const matched = allStatic.filter((p) => ids.includes(String(p.id)));
      if (matched.length > 0) return matched;
    }
    return [];
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [addedItems, setAddedItems] = useState<{ [id: string]: boolean }>({});
  const [allMoved, setAllMoved] = useState(false);
  const viewMode = 'list';

  // Comprehensive asynchronous resolver for wishlisted products
  const loadWishlistItems = useCallback(async () => {
    setLoading(true);
    const localIds = getWishlistIds();

    // If no local IDs and not logged in, wishlist is legitimately empty
    if (localIds.length === 0 && !isAuthenticated()) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      const resolvedMap = new Map<string, ProductItem>();

      // 1. If authenticated, fetch server wishlist
      if (isAuthenticated()) {
        try {
          const apiRes = await storefrontWishlistApi.getWishlist();
          const rawList = apiRes?.items || apiRes?.products || (Array.isArray(apiRes) ? apiRes : []);
          if (Array.isArray(rawList)) {
            for (const item of rawList) {
              const prod = item?.product || item;
              if (prod && (prod._id || prod.id || prod.title || prod.name)) {
                if (isProductActive(prod)) {
                  const mapped = mapBackendProductToItem(prod);
                  resolvedMap.set(String(mapped.id), mapped);
                  if (mapped.slug) resolvedMap.set(String(mapped.slug), mapped);
                }
              }
            }
          }
        } catch (apiErr) {
          console.warn('Could not fetch server wishlist:', apiErr);
        }
      }

      // 2. Check local/session cache and static catalog for remaining IDs
      const allStatic = getAllProducts();
      for (const id of localIds) {
        if (resolvedMap.has(id)) continue;

        // Check sessionStorage cache
        const cached = getCachedProduct(id);
        if (cached && isProductActive(cached)) {
          resolvedMap.set(String(cached.id), cached);
          continue;
        }

        // Check static catalog
        const staticMatch = allStatic.find((p) => String(p.id) === id || p.slug === id);
        if (staticMatch && isProductActive(staticMatch)) {
          resolvedMap.set(String(staticMatch.id), staticMatch);
        }
      }

      // 3. For any remaining unresolved IDs (e.g. MongoDB ObjectIDs or slugs), fetch live catalog
      const stillUnresolved = localIds.filter((id) => !resolvedMap.has(id));
      if (stillUnresolved.length > 0) {
        try {
          const listRes: any = await apiClient.get('/products/all?limit=250');
          const rawList = listRes.data?.products || listRes.data?.data || (Array.isArray(listRes.data) ? listRes.data : []);
          if (Array.isArray(rawList) && rawList.length > 0) {
            for (const rawP of rawList) {
              if (!isProductActive(rawP)) continue;
              const pId = String(rawP._id || rawP.id || '');
              const pSlug = String(rawP.slug || '');
              if (
                stillUnresolved.includes(pId) || 
                stillUnresolved.includes(pSlug) ||
                stillUnresolved.some((u) => u.toLowerCase() === pId.toLowerCase() || u.toLowerCase() === pSlug.toLowerCase())
              ) {
                const mapped = mapBackendProductToItem(rawP);
                resolvedMap.set(String(mapped.id), mapped);
                cacheProduct(mapped);
              }
            }
          }
        } catch (catalogErr) {
          console.warn('Could not fetch catalog fallback for wishlist:', catalogErr);
        }
      }

      // 4. Deduplicate items by ID
      const finalItems = Array.from(new Set(resolvedMap.values())).filter(isProductActive);
      setWishlistItems(finalItems);

      // 5. CRITICAL SYNC:
      // Synchronize valid IDs with localStorage and Header badge.
      // If finalItems has 0 items (i.e. stored IDs were stale or deleted),
      // syncWishlistStorage([]) purges them and clears the header badge to 0!
      const validIds = finalItems.map((p) => String(p.id));
      syncWishlistStorage(validIds);

    } catch (err) {
      console.error('Error resolving wishlist items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWishlistItems();
  }, [loadWishlistItems]);

  // Listen for external wishlist changes (e.g. toggles from other tabs or components)
  useEffect(() => {
    const handleWishlistChange = () => {
      const ids = getWishlistIds();
      // If ids array changed length or became empty, re-resolve
      if (ids.length === 0) {
        setWishlistItems([]);
      }
    };
    window.addEventListener('abb_wishlist_change', handleWishlistChange);
    return () => {
      window.removeEventListener('abb_wishlist_change', handleWishlistChange);
    };
  }, []);

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = wishlistItems.find((it) => String(it.id) === String(id));
    const slug = item?.slug || item?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const itemTitle = item?.title && item.title.length > 32 
      ? `${item.title.slice(0, 32)}...` 
      : (item?.title || 'Item');
    toggleWishlistItem(id, slug);
    const updated = wishlistItems.filter((it) => String(it.id) !== String(id));
    setWishlistItems(updated);
    syncWishlistStorage(updated.map((it) => String(it.id)));
    toast(`${itemTitle} removed from wishlist`, {
      id: `wishlist-remove-${id}`,
      icon: '🤍',
    });
  };

  const handleAddToCart = (product: ProductItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    addToCart(product);
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2200);
  };

  const handleBuyNow = (product: ProductItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please log in or register to proceed to checkout' });
      return;
    }
    addToCart(product, 1, { silent: true });
    if (onGoToCheckout) {
      onGoToCheckout();
    } else {
      window.history.pushState(null, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMoveAllToCart = () => {
    if (!wishlistItems.length) return;
    const newAdded: { [id: string]: boolean } = {};
    wishlistItems.forEach((item) => {
      addToCart(item, 1, { silent: true });
      newAdded[item.id] = true;
    });
    setAddedItems(newAdded);
    setAllMoved(true);
    toast.success(`Moved all ${wishlistItems.length} items to cart!`, {
      icon: '🛒',
    });
    setTimeout(() => {
      setAllMoved(false);
    }, 3000);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please log in or register to proceed to checkout' });
      return;
    }
    wishlistItems.forEach((item) => {
      addToCart(item, 1, { silent: true });
    });
    if (onGoToCheckout) {
      onGoToCheckout();
    } else {
      window.history.pushState(null, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearWishlist = async () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      clearWishlistStorage();
      const currentList = [...wishlistItems];
      setWishlistItems([]);
      if (isAuthenticated()) {
        for (const it of currentList) {
          const slug = it.slug || it.id;
          if (slug) await storefrontWishlistApi.remove(slug).catch(() => {});
        }
      }
      toast('Wishlist cleared', { icon: '🗑️' });
    }
  };

  const filteredItems = wishlistItems;

  const totalOriginalPrice = wishlistItems.reduce((acc, item) => acc + item.originalPrice, 0);
  const totalCurrentPrice = wishlistItems.reduce((acc, item) => acc + item.currentPrice, 0);
  const totalSavings = totalOriginalPrice - totalCurrentPrice;
  const freeShippingThreshold = 499;
  const progressPercent = Math.min(100, Math.round((totalCurrentPrice / freeShippingThreshold) * 100));
  const isFreeShipping = totalCurrentPrice >= freeShippingThreshold;

  return (
    <div className="bg-white min-h-screen py-5 sm:py-8 font-sans">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* =========================================================================
            1. CLEAN E-COMMERCE PAGE HEADER (Breadcrumb + Simple Title + Theme Actions)
           ========================================================================= */}
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <button 
              type="button" 
              onClick={onBackToHome} 
              className="hover:text-navy cursor-pointer transition-colors"
            >
              Home
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-navy font-bold">My Wishlist</span>
          </nav>

          {/* Clean Store Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A44101]/10 border border-[#A44101]/20 flex items-center justify-center text-[#A44101] shrink-0">
                <Heart className="w-5 h-5 fill-[#A44101]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-navy tracking-tight">
                    My Wishlist
                  </h1>
                  <span className="text-xs font-bold text-[#A44101] bg-[#A44101]/10 px-2.5 py-0.5 rounded-full border border-[#A44101]/20">
                    {loading ? '...' : `${wishlistItems.length} ${wishlistItems.length === 1 ? 'item' : 'items'}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saved items to revisit and purchase anytime. Prices &amp; discounts are saved live.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => loadWishlistItems()}
                disabled={loading}
                className="p-2 rounded-xl text-slate-500 hover:text-navy hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Refresh wishlist"
                aria-label="Refresh wishlist"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {wishlistItems.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleClearWishlist}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#A44101] hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Wishlist</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleMoveAllToCart}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#A44101] hover:bg-[#8C3701] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    {allMoved ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                    <span>{allMoved ? 'All Added!' : 'Move All to Cart'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wishlist Main Content */}
        {loading ? (
          /* Sleek Loading State */
          <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-50/50 rounded-2xl border border-slate-100">
            <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading your wishlist items...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Clean Empty State */
          <div className="text-center py-16 px-4 bg-slate-50/70 rounded-2xl border border-slate-200 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#A44101]/10 border border-[#A44101]/20 flex items-center justify-center mx-auto mb-4 text-[#A44101]">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-navy">Your Wishlist is Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              You haven't saved any items yet. Explore our products and tap the heart icon to save your favorites!
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={onBackToHome}
                className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* =========================================================================
                2. LEFT COLUMN: Showcase Items
               ========================================================================= */}
            <div className="lg:col-span-8 space-y-4">

              {/* ===================================================================
                  SHOWCASE MODE A: CLEAN HORIZONTAL PRODUCT ROWS (List View)
                 =================================================================== */}
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredItems.map((product) => {
                      const isAdded = !!addedItems[product.id];

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs p-3.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-stretch gap-4 relative group"
                        >
                          {/* Left Image Thumbnail */}
                          <div 
                            onClick={() => onSelectProduct?.(product)}
                            className="relative w-full sm:w-36 h-36 sm:h-auto rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center aspect-square"
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {product.discountPercentage > 0 && (
                              <span className="absolute top-1.5 left-1.5 bg-[#A44101] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                {product.discountPercentage}% OFF
                              </span>
                            )}
                          </div>

                          {/* Middle Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] font-bold text-[#A44101] uppercase tracking-wider">
                                  {product.category}
                                </span>
                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded text-[11px] font-bold text-amber-900">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{product.rating}</span>
                                  <span className="text-slate-400 font-normal">({product.reviews})</span>
                                </div>
                              </div>

                              <h3 
                                onClick={() => onSelectProduct?.(product)}
                                className="text-sm font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer line-clamp-2 leading-snug"
                              >
                                {product.title}
                              </h3>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>In Stock • Ready for 24h dispatch</span>
                                </span>
                              </div>
                            </div>

                            {/* Mobile Price */}
                            <div className="sm:hidden flex items-baseline justify-between pt-2 border-t border-slate-100 mt-2">
                              <div>
                                <span className="text-base font-bold text-navy">₹{product.currentPrice}</span>
                                {product.originalPrice > product.currentPrice && (
                                  <span className="text-xs text-slate-400 line-through ml-1.5">₹{product.originalPrice}</span>
                                )}
                              </div>
                              {product.originalPrice > product.currentPrice && (
                                <span className="text-xs font-bold text-[#A44101]">Save ₹{product.originalPrice - product.currentPrice}</span>
                              )}
                            </div>
                          </div>

                          {/* Right: Pricing & Action Buttons */}
                          <div className="w-full sm:w-44 flex sm:flex-col justify-between items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 shrink-0">
                            
                            <div className="hidden sm:block text-right">
                              <div className="text-lg font-black text-navy">
                                ₹{product.currentPrice}
                              </div>
                              {product.originalPrice > product.currentPrice && (
                                <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mt-0.5">
                                  <span className="line-through">₹{product.originalPrice}</span>
                                  <span className="font-bold text-[#A44101] text-[10px] bg-[#A44101]/10 px-1 py-0.2 rounded">
                                    Save ₹{product.originalPrice - product.currentPrice}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="w-full space-y-2 mt-auto">
                              <button
                                type="button"
                                onClick={(e) => handleBuyNow(product, e)}
                                className="w-full py-2 px-3 rounded-xl bg-navy hover:bg-[#1E293B] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                              >
                                <span>Buy Now</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToCart(product, e)}
                                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                                    isAdded
                                      ? 'bg-[#A44101] text-white border-[#A44101]'
                                      : 'bg-white hover:bg-slate-50 text-navy border-slate-300 hover:border-navy shadow-xs'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-white" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5 text-navy" />
                                      <span>Add Cart</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleRemove(product.id, e)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-[#A44101] hover:bg-[#A44101]/10 border border-slate-200 transition-colors cursor-pointer shrink-0"
                                  title="Remove item from wishlist"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                /* ===================================================================
                    SHOWCASE MODE B: CLEAN PRODUCT CARDS (Grid View)
                   =================================================================== */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredItems.map((product) => {
                      const isAdded = !!addedItems[product.id];

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs flex flex-col justify-between overflow-hidden group relative"
                        >
                          {/* Image Stage */}
                          <div 
                            onClick={() => onSelectProduct?.(product)}
                            className="relative aspect-square bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center"
                          >
                            {(product.inStock === false || (typeof (product as any).stock === 'number' && (product as any).stock <= 0)) && (
                              <div className="absolute inset-0 z-20 bg-slate-950/45 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                                <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md border border-white/20">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {product.discountPercentage > 0 && (
                              <span className="absolute top-2 left-2 bg-[#A44101] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                {product.discountPercentage}% OFF
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleRemove(product.id, e)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-[#A44101]/10 text-slate-400 hover:text-[#A44101] shadow-xs border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-[#A44101] uppercase tracking-wider text-[10px]">
                                  {product.category}
                                </span>
                                <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{product.rating}</span>
                                </div>
                              </div>

                              <h3 
                                onClick={() => onSelectProduct?.(product)}
                                className="text-xs sm:text-sm font-bold text-navy line-clamp-2 leading-snug group-hover:text-[#A44101] transition-colors cursor-pointer"
                              >
                                {product.title}
                              </h3>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100">
                              <div className="flex items-baseline justify-between mb-2.5">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-bold text-navy">
                                    ₹{product.currentPrice}
                                  </span>
                                  {product.originalPrice > product.currentPrice && (
                                    <span className="text-xs text-slate-400 line-through">
                                      ₹{product.originalPrice}
                                    </span>
                                  )}
                                </div>
                                {product.originalPrice > product.currentPrice && (
                                  <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1 py-0.2 rounded">
                                    Save ₹{product.originalPrice - product.currentPrice}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleAddToCart(product, e)}
                                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                    isAdded
                                      ? 'bg-[#A44101] text-white border-[#A44101]'
                                      : 'bg-white hover:bg-slate-50 text-navy border-slate-300 hover:border-navy shadow-xs'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-white" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5 text-navy" />
                                      <span>Add Cart</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleBuyNow(product, e)}
                                  className="py-2 px-2 rounded-xl text-xs font-bold bg-navy hover:bg-[#1E293B] text-white text-center flex items-center justify-center transition-colors shadow-xs cursor-pointer active:scale-98"
                                >
                                  Buy Now
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

            </div>

            {/* =========================================================================
                3. RIGHT COLUMN: Order Summary Sidebar (Using Store Theme #A44101 & #0F172A)
               ========================================================================= */}
            <div className="lg:col-span-4 sticky top-28 space-y-4">
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-navy">
                    Order Summary
                  </h2>
                  <span className="text-xs font-bold text-[#A44101]">
                    {wishlistItems.length} products
                  </span>
                </div>

                {/* Free Shipping Progress */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Truck className={`w-4 h-4 ${isFreeShipping ? 'text-emerald-600' : 'text-[#A44101]'}`} />
                      <span className="font-bold text-slate-800">
                        {isFreeShipping ? 'Free Delivery Unlocked!' : 'Pan-India Delivery'}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-navy">
                      ₹{totalCurrentPrice} / ₹{freeShippingThreshold}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFreeShipping ? 'bg-emerald-500' : 'bg-[#A44101]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {isFreeShipping ? (
                      <span className="text-emerald-700 font-semibold">Eligible for Free Standard Delivery</span>
                    ) : (
                      <>Add <strong className="text-navy font-bold">₹{freeShippingThreshold - totalCurrentPrice}</strong> more for Free Shipping</>
                    )}
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Total MRP Value</span>
                    <span className="line-through">₹{totalOriginalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#A44101] font-bold">
                    <span>Total Savings</span>
                    <span>- ₹{totalSavings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Shipping</span>
                    <span className="font-bold text-slate-700">
                      {isFreeShipping ? <span className="text-emerald-600">FREE</span> : '₹49'}
                    </span>
                  </div>
                  
                  <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline text-navy">
                    <div>
                      <span className="text-sm font-bold block">Total Cart Value</span>
                      <span className="text-[10px] text-slate-400">Includes all taxes</span>
                    </div>
                    <span className="text-2xl font-black text-[#A44101]">
                      ₹{totalCurrentPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Primary Checkout CTA */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-98"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Proceed to 3-Step Checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMoveAllToCart}
                    className="w-full py-2.5 rounded-xl bg-navy hover:bg-[#1E293B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Move All Items to Cart</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100% Genuine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-[#A44101] shrink-0" />
                    <span>7-Day Returns</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
