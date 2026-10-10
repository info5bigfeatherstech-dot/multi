import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Truck, 
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';

interface CartDrawerProps {
  onGoToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onGoToCheckout }) => {
  const { 
    cartItems, 
    isCartOpen, 
    closeCart, 
    updateQty, 
    removeFromCart, 
    totalCount, 
    subtotal, 
    totalOriginal, 
    totalSavings 
  } = useCart();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const handleCheckoutClick = () => {
    if (!isAuthenticated()) {
      closeCart();
      requireAuth({ message: 'Please log in or register to proceed to checkout' });
      return;
    }
    closeCart();
    onGoToCheckout();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-navy/80 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Slide-in Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between select-none"
            >
              {/* 1. Drawer Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#A44101]/10 flex items-center justify-center text-navy border border-[#A44101]/25">
                    <ShoppingBag className="w-5 h-5 text-navy stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 id="cart-drawer-title" className="text-base sm:text-lg font-black text-navy leading-tight">
                      Your Shopping Cart
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {totalCount} {totalCount === 1 ? 'item' : 'items'} in your cart
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  className="p-2 rounded-xl text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. Free Delivery Perk Pill */}
              <div className="bg-[#A44101]/5 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-navy font-bold">
                  <Truck className="w-4 h-4 text-[#A44101] shrink-0" />
                  <span>Free Express Delivery Across India</span>
                </div>
                <span className="text-[10px] bg-[#A44101] text-white font-black px-1.5 py-0.5 rounded uppercase">
                  Unlocked
                </span>
              </div>

              {/* 3. Drawer Body: Cart Items or Empty State */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-navy">Your cart is empty</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        Looks like you haven't added anything to your cart yet. Discover hot deals and lowest prices now!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeCart}
                      className="mt-2 bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Start Shopping Deals
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs hover:border-slate-300 transition-colors flex gap-3 items-center"
                      >
                        {/* Thumbnail */}
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                        />

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-[#A44101] uppercase tracking-wider block truncate">
                            {item.category}
                          </span>
                          <h4 className="text-xs sm:text-[13px] font-bold text-navy line-clamp-1 leading-snug">
                            {item.title}
                          </h4>

                          {/* Price */}
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-black text-navy">
                              ₹{item.price * item.qty}
                            </span>
                            {item.originalPrice > item.price && (
                              <span className="text-xs text-slate-400 line-through">
                                ₹{item.originalPrice * item.qty}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls & Delete */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, -1)}
                                className="p-1 hover:bg-slate-200 text-slate-700 rounded-l-lg transition-colors cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-navy">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.id, 1)}
                                className="p-1 hover:bg-slate-200 text-slate-700 rounded-r-lg transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-[#A44101] p-1 transition-colors cursor-pointer"
                              aria-label={`Remove ${item.title}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Drawer Footer: Price breakdown & CTA */}
              {cartItems.length > 0 && (
                <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3">
                  {/* Total Savings Pill */}
                  {totalSavings > 0 && (
                    <div className="bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-3 flex items-center justify-between text-xs">
                      <span className="font-bold text-navy flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#A44101]" /> Total Savings
                      </span>
                      <span className="font-black text-[#A44101]">₹{totalSavings} OFF</span>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Total MRP</span>
                      <span className="font-semibold line-through text-slate-400">₹{totalOriginal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-[#A44101]">FREE</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100 text-sm font-black text-navy">
                      <span>Final Payable</span>
                      <span className="text-base text-navy">₹{subtotal}</span>
                    </div>
                  </div>

                  {/* Checkout CTA Button */}
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    className="w-full py-3.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                  >
                    <span>Proceed to Checkout • ₹{subtotal}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  {/* Continue Shopping button */}
                  <button
                    type="button"
                    onClick={closeCart}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-navy py-1 transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
