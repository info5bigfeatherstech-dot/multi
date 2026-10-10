import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Trash2, 
  ShoppingCart, 
  Check, 
  ArrowLeft, 
  Star, 
  Sparkles, 
  ShoppingBag
} from 'lucide-react';
import { getAllProducts, ProductItem } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';

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
  // Pre-populate with 4 popular products
  const initialWishlist = allProducts.slice(0, 4);
  const [wishlistItems, setWishlistItems] = useState<ProductItem[]>(initialWishlist);
  const [addedItems, setAddedItems] = useState<{ [id: string]: boolean }>({});
  const [allMoved, setAllMoved] = useState(false);

  // Auth guard: redirect to home if not logged in
  useEffect(() => {
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please log in or register to view your wishlist' });
      onBackToHome?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddToCart = (product: ProductItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    addToCart(product);
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  const handleMoveAllToCart = () => {
    const newAdded: { [id: string]: boolean } = {};
    wishlistItems.forEach((item) => {
      addToCart(item);
      newAdded[item.id] = true;
    });
    setAddedItems(newAdded);
    setAllMoved(true);
    setTimeout(() => {
      setAllMoved(false);
    }, 3000);
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      setWishlistItems([]);
    }
  };

  const totalOriginalPrice = wishlistItems.reduce((acc, item) => acc + item.originalPrice, 0);
  const totalCurrentPrice = wishlistItems.reduce((acc, item) => acc + item.currentPrice, 0);
  const totalSavings = totalOriginalPrice - totalCurrentPrice;

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 animate-fadeIn">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-navy hover:text-[#A44101] font-medium transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">My Wishlist</span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Page Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#A44101]/10 border border-[#A44101]/20 flex items-center justify-center text-[#A44101] shadow-xs">
              <Heart className="w-6 h-6 fill-[#A44101]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                My Saved Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later purchase
              </p>
            </div>
          </div>

          {wishlistItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleClearWishlist}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#A44101] hover:bg-[#A44101]/10 border border-slate-200 hover:border-[#A44101]/30 transition-colors cursor-pointer"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleMoveAllToCart}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-navy hover:bg-navy-light text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {allMoved ? <Check className="w-4 h-4 text-white" /> : <ShoppingCart className="w-4 h-4" />}
                <span>{allMoved ? 'All Added to Cart!' : 'Move All to Cart'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Main Content */}
        {wishlistItems.length === 0 ? (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4 bg-slate-50 rounded-3xl border border-slate-200 max-w-lg mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-[#A44101]/10 border border-[#A44101]/20 flex items-center justify-center mx-auto mb-4 text-[#A44101]">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy">Your Wishlist is Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Explore our trending categories and save items you love to revisit and purchase anytime!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                Start Shopping Now
              </button>
            </div>
          </motion.div>
        ) : (
          /* Items Grid with Summary Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Products Grid (3 Columns on Large) */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              <AnimatePresence>
                {wishlistItems.map((product) => {
                  const isAdded = !!addedItems[product.id];

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onSelectProduct?.(product)}
                      className="bg-white rounded-2xl border border-slate-200 shadow-soft hover:shadow-soft-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer relative"
                    >
                      {/* Delete from Wishlist Top-Right Button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemove(product.id, e)}
                        className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-[#A44101]/10 text-slate-500 hover:text-[#A44101] shadow-sm border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove from Wishlist"
                        aria-label={`Remove ${product.title} from wishlist`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Image Thumbnail */}
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 left-2 bg-[#A44101] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                          {product.discountPercentage}% OFF
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-[#A44101] uppercase tracking-wider text-[10px]">
                              {product.category}
                            </span>
                            <div className="flex items-center gap-1 text-navy font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-[#A44101] text-[#A44101]" />
                              <span>{product.rating}</span>
                              <span className="text-slate-400 font-normal">({product.reviews})</span>
                            </div>
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#A44101] transition-colors">
                            {product.title}
                          </h3>
                        </div>

                        {/* Price & Actions */}
                        <div className="pt-3 mt-3 border-t border-slate-100">
                          <div className="flex items-baseline justify-between mb-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-navy">
                                ₹{product.currentPrice}
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
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
                                  : 'bg-white hover:bg-slate-100 text-navy border-slate-300 hover:border-navy shadow-xs'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Added!</span>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isAuthenticated()) {
                                  requireAuth({ message: 'Please log in or register to proceed to checkout' });
                                  return;
                                }
                                onGoToCheckout?.();
                              }}
                              className="py-2 px-2 rounded-xl text-xs font-bold bg-navy hover:bg-navy-light text-white text-center flex items-center justify-center transition-colors shadow-xs cursor-pointer"
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

            {/* Wishlist Summary Sidebar */}
            <div className="lg:col-span-1 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A44101]" />
                <span>Wishlist Summary</span>
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Saved Items</span>
                  <span className="font-bold text-navy">{wishlistItems.length} products</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total MRP Value</span>
                  <span className="line-through">₹{totalOriginalPrice}</span>
                </div>
                <div className="flex justify-between text-[#A44101] font-bold">
                  <span>Total Savings</span>
                  <span>- ₹{totalSavings}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-navy">
                  <span>Effective Value</span>
                  <span>₹{totalCurrentPrice}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated()) {
                      requireAuth({ message: 'Please log in or register to proceed to checkout' });
                      return;
                    }
                    onGoToCheckout?.();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                </button>
                <p className="text-[10px] text-center text-slate-500">
                  Free Pan-India Delivery on orders above ₹499
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
