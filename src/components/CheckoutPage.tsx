import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Check, 
  Trash2, 
  Plus, 
  Minus, 
  Gift, 
  Coins, 
  Tag, 
  QrCode, 
  Lock,
  CheckCircle2, 
  PartyPopper,
  MapPin
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { AddAddressModal, NewAddressData } from './AddAddressModal';

interface CheckoutPageProps {
  onBackToHome?: () => void;
  onGoToWishlist?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToHome,
  onGoToWishlist,
}) => {
  const { cartItems, updateQty, removeFromCart, clearCart } = useCart();

  // Address selection: strictly empty until the person adds an address
  const [addresses, setAddresses] = useState<Array<{ id: string; name: string; type: string; phone: string; address: string; city: string; pincode: string }>>(() => {
    try {
      const saved = localStorage.getItem('abb_saved_addresses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userSaved = parsed
            .filter((a: any) => a.id !== 'addr-1' && a.id !== 'addr-2' && a.name !== 'Rahul Sharma')
            .map((a: any) => ({
              id: a.id,
              name: a.name,
              type: a.type || 'Home',
              phone: a.phone,
              address: a.addressLine || a.address || '',
              city: a.city,
              pincode: a.pincode,
            }));
          return userSaved;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('abb_saved_addresses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userSaved = parsed.filter((a: any) => a.id !== 'addr-1' && a.id !== 'addr-2' && a.name !== 'Rahul Sharma');
          if (userSaved.length > 0) return userSaved[0].id;
        }
      }
    } catch {
      // fallback
    }
    return '';
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleSaveNewAddress = (newAddr: NewAddressData) => {
    const formatted = {
      id: newAddr.id,
      name: newAddr.name,
      type: newAddr.type,
      phone: newAddr.phone,
      address: newAddr.fullAddressString,
      city: newAddr.city,
      pincode: newAddr.pincode,
    };
    const updated = [formatted, ...addresses];
    setAddresses(updated);
    setSelectedAddressId(formatted.id);
    setIsAddressModalOpen(false);
    try {
      localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');

  // Gift Intent Feature
  const [isGift, setIsGift] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftOccasion, setGiftOccasion] = useState('Birthday');

  // Coupons & Coins
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [useCoins, setUseCoins] = useState(false);

  // Order Placement State
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Calculations
  const subtotalMRP = cartItems.reduce((acc, item) => acc + item.originalPrice * item.qty, 0);
  const subtotalCurrent = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const catalogDiscount = subtotalMRP - subtotalCurrent;
  const coinsDiscount = useCoins ? 100 : 0;
  const deliveryFee = 0; // FREE Delivery
  const finalTotal = Math.max(0, subtotalCurrent - couponDiscount - coinsDiscount + deliveryFee);

  const handleQuantity = (id: string, delta: number) => {
    updateQty(id, delta);
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === 'BABA100') {
      setAppliedCoupon('BABA100');
      setCouponDiscount(100);
    } else if (cleanCode === 'SAVE50') {
      setAppliedCoupon('SAVE50');
      setCouponDiscount(50);
    } else if (cleanCode === 'FREESHIP') {
      setAppliedCoupon('FREESHIP');
      setCouponDiscount(0);
      alert('Free Express Delivery is already applied to your order!');
    } else {
      alert('Invalid coupon code. Try BABA100 or SAVE50');
    }
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    if (addresses.length === 0 || !selectedAddressId) {
      setIsAddressModalOpen(true);
      return;
    }
    setIsPlacingOrder(true);
    setTimeout(() => {
      setIsPlacingOrder(false);
      setOrderId(`OFB-${Math.floor(100000 + Math.random() * 900000)}`);
      setOrderPlaced(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  return (
    <div className="bg-stone-50/50 min-h-screen py-6 sm:py-10 animate-fadeIn">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Header */}
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
            <span className="text-slate-900 font-bold">Secure Checkout</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-navy font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <Lock className="w-3.5 h-3.5" />
              <span>256-Bit Bank Grade Encryption</span>
            </div>
          </div>
        </div>
        {orderPlaced ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-[#A44101]/10 border-4 border-[#A44101]/20 flex items-center justify-center text-[#A44101] mx-auto shadow-sm">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#A44101] bg-[#A44101]/10 px-3 py-1 rounded-full">
                Order Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-navy">
                Thank You for Your Order!
              </h1>
              <p className="text-sm text-slate-500">
                Order ID: <span className="font-bold text-navy">{orderId}</span>
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                We have received your order. A confirmation SMS with tracking details has been sent to your registered phone number.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-navy">Within 3-4 Business Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-[#A44101]">
                  {paymentMethod === 'cod' ? 'Cash on Delivery (Pending)' : 'Paid Online (Verified)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-black text-navy text-sm">₹{finalTotal}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto shadow-soft">
            <h2 className="text-xl font-bold text-navy">Your Cart is Empty</h2>
            <p className="text-xs text-mutedGray mt-2">Add items to proceed to checkout</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold uppercase tracking-wider hover:bg-navy-light cursor-pointer"
              >
                Start Shopping
              </button>
              {onGoToWishlist && (
                <button
                  type="button"
                  onClick={onGoToWishlist}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-navy text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  View Saved Wishlist
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Two Column Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (2 Cols): Address, Items, Payment, Gift */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SECTION 1: DELIVERY ADDRESS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-navy">Delivery Address</h2>
                      <p className="text-xs text-mutedGray">Where should we deliver your order?</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs font-bold text-[#A44101] hover:text-[#8C3701] flex items-center gap-1.5 cursor-pointer bg-[#A44101]/10 hover:bg-[#A44101]/15 px-3 py-1.5 rounded-xl transition-all active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-8 px-4 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/70 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
                      <MapPin className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy">No Delivery Address Added</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Please add your delivery address so we can ship your items safely.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add Delivery Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-navy bg-stone-50/80 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-navy">
                              {addr.type}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-navy fill-white" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-navy">{addr.name}</h4>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {addr.address}, {addr.city} - <span className="font-bold">{addr.pincode}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1.5">Phone: {addr.phone}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: ORDER ITEMS REVIEW */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-navy">Review Order Items ({cartItems.length})</h2>
                      <p className="text-xs text-slate-500">Standard Free Delivery applied to all items</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#A44101] bg-[#A44101]/10 px-2.5 py-0.5 rounded-full border border-[#A44101]/25">
                    Dispatched in 24 Hrs
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="text-[9px] font-bold text-[#A44101] uppercase tracking-wider">{item.category}</span>
                          <h4 className="text-xs font-bold text-navy line-clamp-1">{item.title}</h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-black text-navy">₹{item.price * item.qty}</span>
                            <span className="text-xs text-slate-400 line-through">₹{item.originalPrice * item.qty}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Delete Controls */}
                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-stone-50">
                          <button
                            type="button"
                            onClick={() => handleQuantity(item.id, -1)}
                            className="p-1.5 hover:bg-stone-200 text-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-navy">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantity(item.id, 1)}
                            className="p-1.5 hover:bg-stone-200 text-slate-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-[#A44101] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: GIFT INTENT / MESSAGE (Optional) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy">Send as a Gift?</h3>
                      <p className="text-xs text-mutedGray">Add a personalized message and greeting card</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A44101]"></div>
                  </label>
                </div>

                {isGift && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl border border-[#A44101]/20 bg-slate-50 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-navy">Recipient Name</label>
                        <input
                          type="text"
                          value={giftRecipient}
                          onChange={(e) => setGiftRecipient(e.target.value)}
                          placeholder="e.g. Priya"
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:border-[#A44101] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-navy">Occasion</label>
                        <select
                          value={giftOccasion}
                          onChange={(e) => setGiftOccasion(e.target.value)}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:border-[#A44101] focus:outline-none"
                        >
                          <option>Birthday</option>
                          <option>Anniversary</option>
                          <option>Diwali / Festival</option>
                          <option>Wedding</option>
                          <option>Thank You</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-navy">Gift Card Message</label>
                      <textarea
                        rows={2}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Write your wishes here..."
                        className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:border-[#A44101] focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* SECTION 4: PAYMENT METHOD SELECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy">Select Payment Method</h2>
                    <p className="text-xs text-mutedGray">Instant UPI, Cards, Netbanking or Cash on Delivery</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* UPI */}
                  <label className={`p-4 rounded-xl border-2 flex flex-col gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'upi' ? 'border-navy bg-stone-50/70' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          className="text-navy focus:ring-navy"
                        />
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-[#A44101]" />
                          <span className="text-xs font-bold text-navy">Instant UPI (GPay, PhonePe, Paytm, BHIM)</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Fastest &amp; Recommended
                      </span>
                    </div>

                    {paymentMethod === 'upi' && (
                      <div className="pl-6 pt-2 flex gap-2">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="Enter UPI ID (e.g. mobile@upi)"
                          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-navy"
                        />
                        <button
                          type="button"
                          onClick={() => alert('UPI ID Verified!')}
                          className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    )}
                  </label>

                  {/* Cards */}
                  <label className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'card' ? 'border-navy bg-stone-50/70' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="text-navy focus:ring-navy"
                      />
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-navy" />
                        <span className="text-xs font-bold text-navy">Credit / Debit Card (Visa, RuPay, MasterCard)</span>
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery */}
                  <label className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'cod' ? 'border-navy bg-stone-50/70' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-navy focus:ring-navy"
                      />
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#A44101]" />
                        <span className="text-xs font-bold text-navy">Cash on Delivery (Pay cash at doorstep)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">₹0 Extra Fee</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column (1 Col): Order Summary, Coupons, Final CTA */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Order Price Breakdown Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider pb-3 border-b border-slate-100">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Total MRP ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items)</span>
                    <span className="line-through">₹{subtotalMRP}</span>
                  </div>

                  <div className="flex justify-between text-[#A44101] font-bold">
                    <span>Product Savings</span>
                    <span>- ₹{catalogDiscount}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#A44101] font-bold">
                      <span>Coupon Discount ({appliedCoupon})</span>
                      <span>- ₹{couponDiscount}</span>
                    </div>
                  )}

                  {useCoins && (
                    <div className="flex justify-between text-[#A44101] font-bold">
                      <span>Baba Coins Redeemed</span>
                      <span>- ₹{coinsDiscount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-700">
                    <span>Delivery Charges</span>
                    <span className="text-[#A44101] font-bold">FREE</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                    <div>
                      <span className="block text-sm font-black text-navy">Total Payable</span>
                      <span className="text-[10px] text-slate-500">Inclusive of all taxes</span>
                    </div>
                    <span className="text-xl font-black text-navy">₹{finalTotal}</span>
                  </div>
                </div>

                {/* Redeem Baba Coins Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#A44101]" />
                    <div>
                      <span className="font-bold text-slate-800">Use 100 Baba Coins</span>
                      <p className="text-[10px] text-slate-500">Save ₹100 instantly</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCoins}
                    onChange={(e) => setUseCoins(e.target.checked)}
                    className="w-4 h-4 text-navy rounded cursor-pointer"
                  />
                </div>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#A44101]" />
                    <span>Apply Promo Code</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. BABA100"
                      className="flex-1 px-3 py-2 text-xs uppercase rounded-xl border border-slate-300 focus:outline-none focus:border-navy"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-navy font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <span className="block text-[11px] text-[#A44101] font-bold mt-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Code {appliedCoupon} applied successfully!</span>
                    </span>
                  )}
                </form>

                {/* Final Primary CTA Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full py-3.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-75"
                  >
                    {isPlacingOrder ? (
                      <span>Processing Payment...</span>
                    ) : addresses.length === 0 ? (
                      <>
                        <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                        <span>Add Delivery Address to Pay • ₹{finalTotal}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Place Order • ₹{finalTotal}</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-500 mt-2.5">
                    Safe &amp; Secure 256-Bit SSL Payment • 7 Days Easy Returns
                  </p>
                </div>
              </div>

              {/* Trust Badges Strip */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-navy shrink-0" />
                  <span>Free Pan-India Delivery within 3-4 days</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-navy shrink-0" />
                  <span>100% Genuine Direct Factory Products</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <PartyPopper className="w-4 h-4 text-navy shrink-0" />
                  <span>Earn 50 Baba Coins on this order</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* 2-Step Add Address Modal Popup */}
      <AddAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSaveAddress={handleSaveNewAddress}
      />
    </div>
  );
};
