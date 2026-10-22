import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { getAllProducts, ProductItem } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';
import { getWishlistIds, toggleWishlistItem } from '../utils/wishlistStorage';
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
  const allProducts = getAllProducts();
  
  // Load wishlisted products from local storage, or fallback to first 4 store products
  const [wishlistItems, setWishlistItems] = useState<ProductItem[]>(() => {
    const ids = getWishlistIds();
    if (ids.length > 0) {
      const all = allProducts.filter((p) => ids.includes(String(p.id)));
      if (all.length > 0) return all;
    }
    // Pre-populate with 4 popular products on fresh state
    const initial = allProducts.slice(0, 4);
    initial.forEach((p) => {
      const current = getWishlistIds();
      if (!current.includes(String(p.id))) {
        toggleWishlistItem(p.id);
      }
    });
    return initial;
  });
  const [addedItems, setAddedItems] = useState<{ [id: string]: boolean }>({});
  const [allMoved, setAllMoved] = useState(false);
  const viewMode = 'list';

  // Listen for external wishlist changes
  useEffect(() => {
    const handleWishlistChange = () => {
      const ids = getWishlistIds();
      const updated = allProducts.filter((p) => ids.includes(String(p.id)));
      setWishlistItems(updated);
    };
    window.addEventListener('abb_wishlist_change', handleWishlistChange);
    return () => {
      window.removeEventListener('abb_wishlist_change', handleWishlistChange);
    };
  }, [allProducts]);

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = wishlistItems.find((it) => it.id === id);
    const itemTitle = item?.title && item.title.length > 32 
      ? `${item.title.slice(0, 32)}...` 
      : (item?.title || 'Item');
    toggleWishlistItem(id);
    setWishlistItems((prev) => prev.filter((it) => it.id !== id));
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

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      try {
        localStorage.setItem('abb_storefront_wishlist_ids', JSON.stringify([]));
        window.dispatchEvent(new CustomEvent('abb_wishlist_change', { detail: { count: 0 } }));
      } catch {}
      setWishlistItems([]);
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
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saved items to revisit and purchase anytime. Prices &amp; discounts are saved live.
                </p>
              </div>
            </div>

            {wishlistItems.length > 0 && (
              <div className="flex items-center gap-2.5 shrink-0">
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
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Main Content */}
        {wishlistItems.length === 0 ? (
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
                            <span className="absolute top-1.5 left-1.5 bg-[#A44101] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              {product.discountPercentage}% OFF
                            </span>
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
                                <span className="text-xs text-slate-400 line-through ml-1.5">₹{product.originalPrice}</span>
                              </div>
                              <span className="text-xs font-bold text-[#A44101]">Save ₹{product.originalPrice - product.currentPrice}</span>
                            </div>
                          </div>

                          {/* Right: Pricing & Action Buttons */}
                          <div className="w-full sm:w-44 flex sm:flex-col justify-between items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 shrink-0">
                            
                            <div className="hidden sm:block text-right">
                              <div className="text-lg font-black text-navy">
                                ₹{product.currentPrice}
                              </div>
                              <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mt-0.5">
                                <span className="line-through">₹{product.originalPrice}</span>
                                <span className="font-bold text-[#A44101] text-[10px] bg-[#A44101]/10 px-1 py-0.2 rounded">
                                  Save ₹{product.originalPrice - product.currentPrice}
                                </span>
                              </div>
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
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <span className="absolute top-2 left-2 bg-[#A44101] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              {product.discountPercentage}% OFF
                            </span>

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
                                  <span className="text-xs text-slate-400 line-through">
                                    ₹{product.originalPrice}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1 py-0.2 rounded">
                                  Save ₹{product.originalPrice - product.currentPrice}
                                </span>
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
