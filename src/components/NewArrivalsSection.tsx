import React, { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Sparkles, 
  ShoppingCart, 
  Check, 
  Heart, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Truck,
  ArrowRight
} from 'lucide-react';
import { NEW_ARRIVALS_PRODUCTS, ProductItem } from '../data/storeData';
import { useCart } from '../context/CartContext';

interface NewArrivalsSectionProps {
  onProductClick?: (product: ProductItem) => void;
  onExploreAll?: () => void;
}

export const NewArrivalsSection: React.FC<NewArrivalsSectionProps> = ({
  onProductClick,
  onExploreAll,
}) => {
  const { addToCart } = useCart();
  const shouldReduceMotion = useReducedMotion();
  const [addedItemIds, setAddedItemIds] = useState<{ [id: string]: boolean }>({});
  const [wishlistIds, setWishlistIds] = useState<{ [id: string]: boolean }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleAddToCart = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleToggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlistIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleViewAll = () => {
    if (onExploreAll) {
      onExploreAll();
    } else {
      const topCat = document.querySelector('.section-top-categories');
      if (topCat) {
        topCat.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section 
      className="section-new-arrivals py-8 sm:py-12 bg-gradient-to-b from-stone-50/60 via-white to-stone-50/40 border-b border-slate-200/80 relative overflow-hidden"
      aria-labelledby="new-arrivals-heading"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A44101]/10 text-[#A44101] text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Just Launched</span>
            </div>
            
            <div className="flex items-center gap-3">
              <h2 
                id="new-arrivals-heading"
                className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight font-roboto"
              >
                New Arrivals
              </h2>
              <span className="text-xs font-bold text-white bg-[#A44101] px-2.5 py-0.5 rounded-full shadow-2xs">
                5 Fresh Picks
              </span>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Discover the latest 5 additions to our direct-import catalog at introductory factory rates.
            </p>
          </div>

          {/* Controls: Nav arrows + View All */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleViewAll}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer mr-2 group"
            >
              <span>Explore all</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#A44101]" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Previous product"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Next product"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Products Grid / Horizontal Scroll */}
        <div 
          ref={scrollContainerRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        >
          {NEW_ARRIVALS_PRODUCTS.slice(0, 5).map((product, idx) => {
            const isAdded = addedItemIds[product.id];
            const isWishlisted = wishlistIds[product.id];
            const savings = product.originalPrice - product.currentPrice;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => onProductClick && onProductClick(product)}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#A44101]/40 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer snap-start min-w-[170px] sm:min-w-0"
              >
                {/* Top Image Container */}
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500"
                  />

                  {/* Badges: NEW & Discount */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#A44101] to-[#8C3701] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs tracking-wider">
                      <Zap className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                      NEW
                    </span>
                    <span className="bg-navy/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                      {product.discountPercentage}% OFF
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(product.id, e)}
                    className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-xs hover:bg-white text-slate-600 hover:text-rose-500 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-90"
                    aria-label="Add to wishlist"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                        isWishlisted ? 'fill-rose-500 text-rose-500' : ''
                      }`} 
                    />
                  </button>

                  {/* 48-Hour Shipping Strip on hover */}
                  <div className="absolute bottom-0 inset-x-0 bg-stone-900/80 backdrop-blur-xs text-stone-100 text-[10px] py-1 px-2 flex items-center justify-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Truck className="w-3 h-3 text-emerald-400" />
                    <span className="font-medium">48h Express Delivery</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                  <div>
                    {/* Category & Rating */}
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px] truncate max-w-[90px]">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-[10px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating}</span>
                        <span className="text-slate-400 font-normal">({product.reviews})</span>
                      </div>
                    </div>

                    {/* Product Title */}
                    <h3 
                      className="text-xs sm:text-sm font-semibold text-navy group-hover:text-[#A44101] transition-colors line-clamp-2 leading-snug"
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                  </div>

                  {/* Price & Action Area */}
                  <div className="pt-1.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-baseline justify-between gap-1 flex-wrap">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-black text-navy font-roboto">
                          ₹{product.currentPrice}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          ₹{product.originalPrice}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                        Save ₹{savings}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 shadow-2xs cursor-pointer active:scale-97 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#A44101] hover:bg-[#8C3701] text-white hover:shadow-xs'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
