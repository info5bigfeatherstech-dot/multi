import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Star, 
  ShoppingCart, 
  Check, 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { ALL_PRODUCTS_CATALOG, ProductItem } from '../data/storeData';

interface EveryProductSectionProps {
  onProductClick?: (product: ProductItem) => void;
}

export const EveryProductSection: React.FC<EveryProductSectionProps> = ({ onProductClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'discount' | 'price-asc' | 'price-desc'>('featured');
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const shouldReduceMotion = useReducedMotion();

  const categories = ['All', 'Home & Kitchen', 'Electronics', 'Fashion', 'Toys'];

  // Handle temporary "Added to Cart" state feedback
  const handleAddToCart = (id: string) => {
    setAddedItemIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = ALL_PRODUCTS_CATALOG.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'discount') {
      list = [...list].sort((a, b) => b.discountPercentage - a.discountPercentage);
    } else if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.currentPrice - b.currentPrice);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.currentPrice - a.currentPrice);
    }

    return list;
  }, [selectedCategory, searchFilter, sortBy]);

  return (
    <section 
      className="section-every-product-catalog py-12 sm:py-16 bg-white border-b border-slate-200"
      aria-label="Complete Product Deals Catalog"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-navy text-xs font-bold mb-2 border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-[#A44101]" />
              <span>Pan India Direct Deals</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy tracking-tight font-roboto">
              Every Product, <span className="text-navy">Unbeatable Deals</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-2xl font-normal">
              Explore authentic deals on kitchenware, daily utilities, smart electronics, and apparel at direct factory discount prices.
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-theme border border-slate-200 shrink-0 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#A44101]" />
            <span className="font-bold text-navy">{filteredProducts.length}</span> Products Available
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-canvas p-3 sm:p-4 rounded-theme border border-slate-200/80 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-theme text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-navy hover:bg-slate-50 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter products..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-theme text-navy focus:outline-none focus:border-[#A44101]"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-theme px-2.5 py-1.5 text-xs">
                <SlidersHorizontal className="w-3 solid text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-navy font-semibold focus:outline-none cursor-pointer"
                  aria-label="Sort product catalog"
                >
                  <option value="featured">Featured</option>
                  <option value="discount">Highest Discount</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-theme border border-dashed border-slate-300">
            <p className="text-base font-bold text-navy">No products match your filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting category or search criteria.</p>
            <button
              type="button"
              onClick={() => { setSelectedCategory('All'); setSearchFilter(''); }}
              className="mt-4 px-4 py-2 bg-[#A44101] hover:bg-[#8C3701] text-white rounded-theme text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, idx) => {
              const isAdded = !!addedItemIds[product.id];

              return (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: shouldReduceMotion ? 0 : idx * 0.05, duration: 0.3 }}
                  onClick={() => onProductClick?.(product)}
                  className="bg-white rounded-theme border border-slate-200 shadow-soft hover:shadow-soft-hover hover:border-[#A44101]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                >
                  {/* Image & Badges Container */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    
                    {/* Discount Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10 bg-[#A44101] text-white text-[11px] font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-white text-white" />
                      <span>{product.discountPercentage}% OFF</span>
                    </div>

                    {/* Tag Badge */}
                    {product.tag && (
                      <div className="absolute top-2.5 right-2.5 z-10 bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                        {product.tag}
                      </div>
                    )}

                    {/* Product Image */}
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Details Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-bold text-[#A44101] uppercase tracking-wider">
                          {product.category}
                        </span>
                        <div className="flex items-center gap-1 text-navy font-bold">
                          <Star className="w-3 h-3 fill-[#A44101] text-[#A44101]" />
                          <span>{product.rating}</span>
                          <span className="text-slate-400 font-normal">({product.reviews})</span>
                        </div>
                      </div>

                      {/* Product Title */}
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-navy transition-colors">
                        {product.title}
                      </h3>
                    </div>

                    {/* Price & CTA Section */}
                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-navy">
                            ₹{product.currentPrice}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
                          Save ₹{product.originalPrice - product.currentPrice}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product.id);
                          }}
                          className={`py-2 px-2 rounded-theme text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            isAdded
                              ? 'bg-[#A44101] text-white border-[#A44101]'
                              : 'bg-white hover:bg-slate-100 text-navy border-slate-300 hover:border-navy shadow-xs'
                          }`}
                          aria-label={`Add ${product.title} to cart`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span className="text-white">Added</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5 text-navy" />
                              <span className="text-navy font-bold">Add Cart</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick?.(product);
                          }}
                          className="py-2 px-2 rounded-theme text-xs font-bold bg-navy hover:bg-navy-light text-white text-center flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Trust Badges Banner at bottom of Every Product section */}
        <div className="mt-12 bg-canvas border border-slate-200 rounded-theme-lg p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-theme bg-[#A44101]/10 flex items-center justify-center text-[#A44101] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-navy">Pan India Doorstep Courier</div>
              <div className="text-[11px] text-slate-500">Dispatched within 24 hours of ordering</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-theme bg-[#A44101]/10 flex items-center justify-center text-[#A44101] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-navy">Lowest Price Guarantee</div>
              <div className="text-[11px] text-slate-500">Genuine products at lowest factory rates</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-theme bg-[#A44101]/10 flex items-center justify-center text-[#A44101] shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-navy">7-Day Easy Replacement</div>
              <div className="text-[11px] text-slate-500">Hassle-free support on defective items</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
