import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShoppingCart, 
  Check, 
  Star, 
  Heart, 
  ShieldCheck, 
  Truck, 
  X, 
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';
import { UNDER_99_PRODUCTS, ProductItem } from '../data/storeData';

interface Under99SectionProps {
  onProductClick?: (product: ProductItem) => void;
}

export const Under99Section: React.FC<Under99SectionProps> = ({ onProductClick }) => {
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(99);
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const [wishlistIds, setWishlistIds] = useState<{ [key: string]: boolean }>({});
  const [quickBuyProduct, setQuickBuyProduct] = useState<ProductItem | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState({ name: '', phone: '', pincode: '', paymentMethod: 'cod' });
  const shouldReduceMotion = useReducedMotion();

  // Price filter tabs
  const priceFilters = [
    { label: 'All Under ₹99', maxPrice: 99 },
    { label: 'Under ₹49', maxPrice: 49 },
    { label: 'Under ₹69', maxPrice: 69 },
    { label: 'Under ₹79', maxPrice: 79 },
  ];

  // Filter products by selected max price
  const filteredProducts = useMemo(() => {
    return UNDER_99_PRODUCTS.filter((item) => item.currentPrice <= selectedMaxPrice);
  }, [selectedMaxPrice]);

  const handleAddToCart = (id: string) => {
    setAddedItemIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleToggleWishlist = (id: string) => {
    setWishlistIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickBuy = (product: ProductItem) => {
    setQuickBuyProduct(product);
    setOrderSuccess(false);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSuccess(true);
    setTimeout(() => {
      setQuickBuyProduct(null);
      setOrderSuccess(false);
      setFormData({ name: '', phone: '', pincode: '', paymentMethod: 'cod' });
    }, 2500);
  };

  return (
    <section 
      id="under-99-store" 
      className="py-10 sm:py-16 bg-white border-b border-slate-200 relative overflow-hidden"
      aria-label="Under 99 Rupees Products Section"
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Card / Banner */}
        <div className="bg-gradient-to-r from-navy via-navy to-[#A44101] rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black tracking-widest uppercase border border-white/30">
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                <span>BUDGET DHAMAKA • STEAL DEALS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-sm font-roboto">
                Under ₹99 Store
              </h2>
              <p className="text-white/90 text-sm sm:text-base font-normal">
                India's biggest pocket-friendly deals! Kitchen tools, personal care, baby essentials &amp; smart utilities at unbeatable factory rates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <div className="bg-white text-navy px-5 py-3 rounded-xl shadow-lg border border-white/80 text-center">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Starting At Only</span>
                <span className="text-3xl font-black text-[#A44101]">₹39<span className="text-sm text-navy/70 font-normal">.00</span></span>
              </div>
              <div className="bg-black/20 backdrop-blur-sm border border-white/20 text-white px-4 py-3 rounded-xl text-center">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-white/80">Max Price Cap</span>
                <span className="text-2xl font-black text-white">₹99</span>
              </div>
            </div>
          </div>

          {/* Quick Filter Pill Buttons inside the banner */}
          <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider mr-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Price Filter:
            </span>
            {priceFilters.map((tab) => (
              <button
                key={tab.maxPrice}
                type="button"
                onClick={() => setSelectedMaxPrice(tab.maxPrice)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                  selectedMaxPrice === tab.maxPrice
                    ? 'bg-white text-navy shadow-md scale-105'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="ml-auto text-xs font-semibold text-white/80 hidden sm:inline">
              Showing {filteredProducts.length} items
            </span>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-6">
          {filteredProducts.map((product: ProductItem, index: number) => {
            const isAdded = !!addedItemIds[product.id];
            const isWishlisted = !!wishlistIds[product.id];
            const youSave = product.originalPrice - product.currentPrice;

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: shouldReduceMotion ? 0 : index * 0.05, duration: 0.35 }}
                onClick={() => onProductClick?.(product)}
                className="bg-white rounded-2xl border border-stone-300 shadow-soft hover:shadow-soft-hover hover:border-[#A44101]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
              >
                {/* Visual Image & Badges */}
                <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-[#A44101] text-white text-xs font-black px-2.5 py-1 rounded-md shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-white text-white" />
                    <span>{product.discountPercentage}% OFF</span>
                  </div>

                  {/* Special Tag or Price Pill */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    <span className="bg-navy text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-md">
                      ₹{product.currentPrice} ONLY
                    </span>
                    <button
                      type="button"
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(product.id);
                      }}
                      className={`p-1.5 rounded-full shadow-md backdrop-blur-md transition-colors cursor-pointer ${
                        isWishlisted ? 'bg-[#A44101]/10 text-[#A44101]' : 'bg-white/85 text-slate-600 hover:text-[#A44101]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#A44101] text-[#A44101]' : ''}`} />
                    </button>
                  </div>

                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Category Pill Tag Bottom Left */}
                  <div className="absolute bottom-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {product.category}
                  </div>
                </div>

                {/* Product Details Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    {/* Star Rating & Reviews */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center text-[#A44101]">
                        <Star className="w-3.5 h-3.5 fill-[#A44101]" />
                        <span className="text-xs font-bold text-navy ml-1">{product.rating}</span>
                      </div>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({product.reviews} reviews)
                      </span>
                      <span className="ml-auto text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
                        Verified Deal
                      </span>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-bold text-navy text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#A44101] transition-colors">
                      {product.title}
                    </h3>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#A44101]">
                        ₹{product.currentPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                      <span className="ml-auto text-xs font-bold text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded-full">
                        Save ₹{youSave}
                      </span>
                    </div>

                    {/* Perks */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#A44101]" /> Free Delivery
                      </span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#A44101]" /> Cash on Delivery
                      </span>
                    </div>
                  </div>

                  {/* Actions: Add to Cart + Buy Now */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        isAdded
                          ? 'bg-[#A44101] text-white border-[#A44101]'
                          : 'bg-stone-100 text-navy hover:bg-stone-200 border-stone-300'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickBuy(product);
                      }}
                      className="w-full py-2.5 px-2 rounded-xl text-xs font-black transition-all bg-[#A44101] hover:bg-[#8C3701] text-white shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Buy Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Empty state if filter yields zero */}
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border border-stone-300">
            <p className="text-base font-bold text-navy">No products found in this price bracket.</p>
            <button
              type="button"
              onClick={() => setSelectedMaxPrice(99)}
              className="mt-3 px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg"
            >
              Show All Under ₹99
            </button>
          </div>
        )}

        {/* Bottom Trust Assurance Band */}
        <div className="mt-8 bg-white rounded-xl p-4 border border-stone-300 flex flex-wrap items-center justify-between gap-4 text-xs text-charcoal">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#A44101]/10 text-[#A44101] flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="font-bold text-navy block">100% Quality Guaranteed</span>
              <span className="text-slate-500 text-[11px]">All items hand-checked before packing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-navy flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <span className="font-bold text-navy block">Fast Dispatch</span>
              <span className="text-slate-500 text-[11px]">Orders dispatched within 24 hours</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-navy flex items-center justify-center font-bold">
              💳
            </div>
            <div>
              <span className="font-bold text-navy block">Cash On Delivery Available</span>
              <span className="text-slate-500 text-[11px]">Pay when it arrives at your doorstep</span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Buy Modal */}
      <AnimatePresence>
        {quickBuyProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                type="button"
                onClick={() => setQuickBuyProduct(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {orderSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 bg-[#A44101]/10 text-[#A44101] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-2xl font-black text-navy font-roboto">Order Placed Successfully!</h3>
                  <p className="text-sm text-slate-600">
                    Your Under ₹99 deal is confirmed! We will dispatch to your address shortly.
                  </p>
                  <div className="p-3 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 border border-slate-200">
                    Amount Payable on Delivery: ₹{quickBuyProduct.currentPrice}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmOrder} className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Sparkles className="w-5 h-5 text-[#A44101]" />
                    <h3 className="text-lg font-black text-navy font-roboto">Instant 1-Click Checkout</h3>
                  </div>

                  {/* Selected Item Preview */}
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <img
                      src={quickBuyProduct.image}
                      alt={quickBuyProduct.title}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{quickBuyProduct.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black text-[#A44101]">₹{quickBuyProduct.currentPrice}</span>
                        <span className="text-xs text-slate-400 line-through">₹{quickBuyProduct.originalPrice}</span>
                        <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.2 rounded">
                          {quickBuyProduct.discountPercentage}% OFF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Form Inputs */}
                  <div className="space-y-2.5 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-navy"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Mobile Number (for Order Updates &amp; OTP)</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-navy"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Pincode (Fast 48-Hour Delivery)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 110001"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-navy"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                            formData.paymentMethod === 'cod'
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          Cash on Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                            formData.paymentMethod === 'upi'
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          UPI / QR Code
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Confirm Button */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-3 font-semibold text-slate-600">
                      <span>Delivery Fee:</span>
                      <span className="text-[#A44101] font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-navy mb-4">
                      <span>Total Amount:</span>
                      <span className="text-lg text-[#A44101]">₹{quickBuyProduct.currentPrice}</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#A44101] hover:bg-[#8C3701] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Confirm Order @ ₹{quickBuyProduct.currentPrice}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Under99Section;
