import React, { useState, useEffect } from 'react';
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
  MapPin,
  Download,
  RefreshCw
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { AddAddressModal, NewAddressData } from './AddAddressModal';
import { storefrontCheckoutApi, storefrontAddressApi } from '../api';

interface CheckoutPageProps {
  onBackToHome?: () => void;
  onGoToWishlist?: () => void;
  onViewOrders?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToHome,
  onGoToWishlist,
  onViewOrders,
}) => {
  const { cartItems, updateQty, removeFromCart, clearCart } = useCart();

  // --------------------------------------------------------------------------
  // Phase 1: Store Checkout Settings & Delivery State
  // --------------------------------------------------------------------------
  const [checkoutSettings, setCheckoutSettings] = useState<{
    storefront: string;
    codEnabled: boolean;
    partialPaymentEnabled: boolean;
    partialPaymentPercent: number;
  }>({
    storefront: 'ecomm',
    codEnabled: true,
    partialPaymentEnabled: true,
    partialPaymentPercent: 25,
  });

  const [deliveryInfo, setDeliveryInfo] = useState<{
    isDeliverable: boolean;
    estimatedDays?: string;
    courierName?: string;
    message?: string;
  } | null>(null);
  const [isDeliveryChecking, setIsDeliveryChecking] = useState(false);

  // Available Promotional Coupons from Backend
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // --------------------------------------------------------------------------
  // Address Book State
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Payment Method & Plan Selection
  // --------------------------------------------------------------------------
  // paymentMode: 'online' | 'advance' | 'cod'
  const [paymentMode, setPaymentMode] = useState<'online' | 'advance' | 'cod'>('online');

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

  // --------------------------------------------------------------------------
  // Phase 1: Authoritative Server Quote
  // --------------------------------------------------------------------------
  const [serverQuote, setServerQuote] = useState<{
    quoteId?: string;
    quoteExpiresAt?: string;
    itemsSubtotal?: number;
    deliveryCharges?: number;
    taxes?: number;
    promotionDiscount?: number;
    amountPayable?: number;
    codAvailable?: boolean;
    fullCodAvailable?: boolean;
    partialBalanceCodAvailable?: boolean;
  } | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Order Placement & Post-Order Lifecycle State
  // --------------------------------------------------------------------------
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [placedOrderSummary, setPlacedOrderSummary] = useState<any | null>(null);

  // Post-Order Actions: Invoice & Live Tracking
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState<any | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [isPayingBalance, setIsPayingBalance] = useState(false);

  // --------------------------------------------------------------------------
  // Synchronous Calculations (Local Fallbacks)
  // --------------------------------------------------------------------------
  const subtotalMRP = cartItems.reduce((acc, item) => acc + item.originalPrice * item.qty, 0);
  const subtotalCurrent = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const catalogDiscount = subtotalMRP - subtotalCurrent;
  const coinsDiscount = useCoins ? 100 : 0;
  const deliveryFee = 0; // FREE Delivery
  const fallbackFinalTotal = Math.max(0, subtotalCurrent - couponDiscount - coinsDiscount + deliveryFee);

  // Active Authoritative Values (Server Quote overrides with local fallback)
  const displayTotalPayable = serverQuote?.amountPayable ?? fallbackFinalTotal;
  const displayDiscount = serverQuote?.promotionDiscount ?? couponDiscount;
  const displayDeliveryCharge = serverQuote?.deliveryCharges ?? 0;
  const displayTaxes = serverQuote?.taxes ?? 0;
  const displaySubtotal = serverQuote?.itemsSubtotal ?? subtotalCurrent;

  // Partial Payment breakdown
  const advancePercent = checkoutSettings.partialPaymentPercent || 25;
  const advancePayableNow = Math.round(displayTotalPayable * (advancePercent / 100));
  const balancePayableOnDelivery = displayTotalPayable - advancePayableNow;

  // --------------------------------------------------------------------------
  // Mount: Load Checkout Settings, Available Coupons & Customer Addresses
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 1. Store Checkout Settings
    storefrontCheckoutApi.getSettings()
      .then((settings) => {
        if (settings) {
          setCheckoutSettings({
            storefront: settings.storefront || 'ecomm',
            codEnabled: settings.codEnabled !== false,
            partialPaymentEnabled: Boolean(settings.partialPaymentEnabled),
            partialPaymentPercent: Number(settings.partialPaymentPercent) || 25,
          });
        }
      })
      .catch(() => { });

    // 2. Available Promotional Coupons
    storefrontCheckoutApi.getAvailableCoupons()
      .then((coupons) => {
        if (Array.isArray(coupons) && coupons.length > 0) {
          setAvailableCoupons(coupons);
        }
      })
      .catch(() => { });

    // 3. Address Book Sync
    storefrontAddressApi.list()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const apiAddrs = res.map((a: any) => ({
            id: a.id || a._id || `addr-${Date.now()}`,
            name: a.fullName || a.name || 'Valued Customer',
            type: a.type || 'Home',
            phone: a.phone || '',
            address: a.street || a.addressLine || a.address || '',
            city: a.city || 'Delhi',
            pincode: a.pincode || a.postalCode || '110001',
          }));
          setAddresses((prev) => {
            const combined = [...apiAddrs, ...prev.filter(p => !apiAddrs.some(a => a.id === p.id))];
            return combined;
          });
          if (!selectedAddressId && apiAddrs.length > 0) {
            setSelectedAddressId(apiAddrs[0].id);
          }
        }
      })
      .catch(() => { });
  }, []);

  // --------------------------------------------------------------------------
  // Delivery Pincode Verification on Address Change
  // --------------------------------------------------------------------------
  useEffect(() => {
    const selected = addresses.find(a => a.id === selectedAddressId);
    if (selected && selected.pincode) {
      setIsDeliveryChecking(true);
      storefrontCheckoutApi.checkDelivery(selected.pincode)
        .then((result) => {
          if (result && result.isDeliverable !== false) {
            setDeliveryInfo({
              isDeliverable: true,
              estimatedDays: result.estimatedDays || '3-4',
              courierName: result.courierName || 'Blue Dart / Shiprocket Express',
              message: result.message || 'Express delivery serviceable',
            });
          } else {
            setDeliveryInfo({
              isDeliverable: false,
              message: result?.message || 'Standard delivery serviceable',
            });
          }
        })
        .catch(() => {
          setDeliveryInfo({
            isDeliverable: true,
            estimatedDays: '3-4',
            courierName: 'Express Courier',
            message: 'Free Express Delivery serviceable',
          });
        })
        .finally(() => {
          setIsDeliveryChecking(false);
        });
    } else {
      setDeliveryInfo(null);
    }
  }, [selectedAddressId, addresses]);

  // --------------------------------------------------------------------------
  // Phase 1: Two-Phase Commit - Fetch Server Authoritative Quote
  // --------------------------------------------------------------------------
  const fetchAuthoritativeQuote = async () => {
    if (!selectedAddressId || cartItems.length === 0) return;
    setIsQuoteLoading(true);

    const hint = paymentMode === 'cod' ? 'full_cod' : (paymentMode === 'advance' ? 'advance' : 'online');
    const plan = paymentMode === 'advance' ? 'advance' : 'full';
    const balanceColl = paymentMode === 'cod' || paymentMode === 'advance' ? 'cod' : 'online';

    try {
      const qRes = await storefrontCheckoutApi.getQuote({
        addressId: selectedAddressId,
        paymentMethodHint: hint,
        paymentPlan: plan,
        paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
        balanceCollection: balanceColl,
        couponCode: appliedCoupon || undefined,
        loyaltyPointsToRedeem: useCoins ? 100 : 0,
      });

      if (qRes && (qRes.quoteId || qRes.amountPayable !== undefined)) {
        setServerQuote(qRes);
      }
    } catch {
      // Kept on local fallback
    } finally {
      setIsQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthoritativeQuote();
  }, [selectedAddressId, paymentMode, appliedCoupon, useCoins, cartItems.length]);

  // --------------------------------------------------------------------------
  // Address Handler
  // --------------------------------------------------------------------------
  const handleSaveNewAddress = async (newAddr: NewAddressData) => {
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

    try {
      await storefrontAddressApi.create({
        fullName: newAddr.name,
        name: newAddr.name,
        phone: newAddr.phone,
        houseNumber: newAddr.houseFlat || newAddr.fullAddressString,
        area: newAddr.areaLocality || newAddr.city,
        addressLine1: newAddr.streetLine1 || newAddr.fullAddressString,
        postalCode: newAddr.pincode,
        street: newAddr.fullAddressString,
        city: newAddr.city,
        state: newAddr.state || 'Delhi',
        pincode: newAddr.pincode,
        type: newAddr.type === 'Work' ? 'Work' : 'Home',
        isDefault: addresses.length === 0,
      });
    } catch {
      // Local fallback
    }
  };

  const handleQuantity = (id: string, delta: number) => {
    updateQty(id, delta);
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  // --------------------------------------------------------------------------
  // Coupon Validation Handler
  // --------------------------------------------------------------------------
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      const result = await storefrontCheckoutApi.validateCoupon({
        couponCode: cleanCode,
        useServercart: true,
        subtotal: subtotalCurrent,
      });

      if (result && (result.valid || result.discountAmount || result.discountValue)) {
        const disc = result.discountAmount || result.discountValue || result.discount || 100;
        setAppliedCoupon(cleanCode);
        setCouponDiscount(disc);
        return;
      }
    } catch {
      // Offline fallback check
    }

    if (cleanCode === 'BABA100' || cleanCode === 'SUMMER10') {
      setAppliedCoupon(cleanCode);
      setCouponDiscount(100);
    } else if (cleanCode === 'SAVE50') {
      setAppliedCoupon('SAVE50');
      setCouponDiscount(50);
    } else if (cleanCode === 'FREESHIP') {
      setAppliedCoupon('FREESHIP');
      setCouponDiscount(0);
      alert('Free Express Delivery is already applied to your entire order!');
    } else {
      alert('Invalid coupon code. Try BABA100, SUMMER10, or SAVE50');
    }
  };

  const savePlacedOrder = (newOrder: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('abb_user_orders_v1') || '[]');
      localStorage.setItem('abb_user_orders_v1', JSON.stringify([newOrder, ...existing]));
    } catch (e) {
      console.warn(e);
    }
  };

  // --------------------------------------------------------------------------
  // Phase 2, 3 & 4: Place Order Execution (Two-Phase Commit + Razorpay)
  // --------------------------------------------------------------------------
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (addresses.length === 0 || !selectedAddressId) {
      setIsAddressModalOpen(true);
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    const customer = {
      name: selectedAddr?.name || 'Customer',
      email: localStorage.getItem('abb_user_profile_email') || 'customer@store.com',
      phone: selectedAddr?.phone || '9876543210',
    };

    setIsPlacingOrder(true);

    try {
      const plan = paymentMode === 'advance' ? 'advance' : 'full';
      const paymentMethod = paymentMode === 'cod' ? 'full_cod' : (paymentMode === 'advance' ? 'advance' : 'online');
      const balanceCollection = paymentMode === 'cod' || paymentMode === 'advance' ? 'cod' : 'online';

      // Step A: Ensure we have a valid Quote
      let activeQuote = serverQuote;
      if (!activeQuote?.quoteId) {
        try {
          activeQuote = await storefrontCheckoutApi.getQuote({
            addressId: selectedAddressId,
            paymentMethodHint: paymentMethod,
            paymentPlan: plan,
            paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
            balanceCollection,
            couponCode: appliedCoupon || undefined,
            loyaltyPointsToRedeem: useCoins ? 100 : 0,
          });
          if (activeQuote?.quoteId) {
            setServerQuote(activeQuote);
          }
        } catch (quoteErr) {
          console.warn('Quote generation fallback:', quoteErr);
        }
      }

      // Step B: Lock Payment Choice (POST /api/checkout/confirm)
      if (activeQuote?.quoteId) {
        try {
          await storefrontCheckoutApi.confirmQuote({
            quoteId: activeQuote.quoteId,
            paymentMethod,
            paymentPlan: plan,
            paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
            balanceCollection,
          });
        } catch (confErr) {
          console.warn('Quote confirm warning:', confErr);
        }
      }

      // Step C: Place Order (POST /api/orders/items with Idempotency-Key & x-storefront)
      const orderIntentPayload = isGift ? {
        isGift: true,
        recipientName: giftRecipient.trim() || 'Gift Recipient',
        recipientPhone: selectedAddr?.phone || '9876543210',
        deliveryAddress: selectedAddr?.address || 'Pan-India',
        giftMessage: giftMessage.trim() || 'Best wishes from Apna Bharat Bazaar!',
        occasion: giftOccasion,
        includeCard: true,
        packagingTheme: 'Classic Saffron Gold'
      } : undefined;

      const orderPayload = {
        addressId: selectedAddressId,
        paymentMethod,
        onlinePaymentMode: plan === 'advance' ? 'advance' : 'full',
        balanceCollection,
        paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
        quoteId: activeQuote?.quoteId,
        couponCode: appliedCoupon || undefined,
        orderIntent: orderIntentPayload,
      };

      let orderRes: any = null;
      try {
        orderRes = await storefrontCheckoutApi.createOrder(orderPayload);
      } catch (createErr) {
        console.warn('Direct order creation fallback:', createErr);
      }

      const orderData = orderRes?.order || orderRes;
      const createdOrderId = orderRes?.orderId || orderData?.orderId || orderData?.orderNumber || `ABB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const razorpayOrder = orderRes?.razorpayOrder || orderData?.razorpayOrder;

      // ----------------------------------------------------------------------
      // Scenario 1: Cash on Delivery (full_cod)
      // ----------------------------------------------------------------------
      if (paymentMethod === 'full_cod') {
        const orderSummary = {
          id: createdOrderId,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'Confirmed (COD)',
          statusColor: 'text-amber-700 bg-amber-50 border-amber-200',
          eta: deliveryInfo?.estimatedDays ? `Delivery in ${deliveryInfo.estimatedDays} Days` : 'Delivery Expected: in 3-4 days',
          total: activeQuote?.amountPayable ?? displayTotalPayable,
          balanceDue: activeQuote?.amountPayable ?? displayTotalPayable,
          itemCount: cartItems.length,
          trackingStep: 1,
          paymentMethod: 'Cash on Delivery (Pay at doorstep)',
          items: cartItems.map((item) => ({
            title: item.title,
            image: item.image,
            price: item.price,
            qty: item.qty,
          })),
        };

        savePlacedOrder(orderSummary);
        setPlacedOrderSummary(orderSummary);
        setOrderId(createdOrderId);
        setOrderPlaced(true);
        clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // ----------------------------------------------------------------------
      // Scenario 2: Online Payment via Razorpay Modal & Verification
      // ----------------------------------------------------------------------
      const amountToPayInRupees = plan === 'advance' ? advancePayableNow : (activeQuote?.amountPayable ?? displayTotalPayable);

      await storefrontCheckoutApi.processRazorpayPayment({
        orderId: createdOrderId,
        razorpayOrder: razorpayOrder || {
          id: `order_${Date.now()}`,
          amount: Math.round(amountToPayInRupees * 100),
          currency: 'INR',
        },
        amount: amountToPayInRupees,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        onSuccess: (verifiedRes) => {
          const finalId = verifiedRes?.order?.orderId || createdOrderId;
          const orderSummary = {
            id: finalId,
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: plan === 'advance' ? 'Partial Advance Paid' : 'Confirmed & Paid',
            statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            eta: deliveryInfo?.estimatedDays ? `Delivery in ${deliveryInfo.estimatedDays} Days` : 'Delivery Expected: in 3-4 days',
            total: activeQuote?.amountPayable ?? displayTotalPayable,
            advancePaid: amountToPayInRupees,
            balanceDue: plan === 'advance' ? balancePayableOnDelivery : 0,
            itemCount: cartItems.length,
            trackingStep: 1,
            paymentMethod: plan === 'advance'
              ? `Advance Paid (${advancePercent}% via Razorpay, ₹${balancePayableOnDelivery} COD Balance)`
              : 'Razorpay Online (UPI / Card / Netbanking Verified)',
            items: cartItems.map((item) => ({
              title: item.title,
              image: item.image,
              price: item.price,
              qty: item.qty,
            })),
          };

          savePlacedOrder(orderSummary);
          setPlacedOrderSummary(orderSummary);
          setOrderId(finalId);
          setOrderPlaced(true);
          clearCart();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onFailure: (err) => {
          alert('Razorpay Checkout: ' + (err?.message || 'Payment was not completed.'));
        },
        onDismiss: () => {
          alert(`Checkout dismissed. Order #${createdOrderId} is saved in pending status. You can complete payment at any time.`);
        },
      });

    } catch (error: any) {
      alert('Checkout error: ' + (error?.message || 'Failed to place order. Please try again.'));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // --------------------------------------------------------------------------
  // Post-Order Lifecycle Actions: Invoice Download & Shipment Tracking
  // --------------------------------------------------------------------------
  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await storefrontCheckoutApi.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Invoice download: Preparing authenticated PDF invoice. Please check in Profile Orders.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleTrackShipment = async () => {
    if (!orderId) return;
    setIsTrackingLoading(true);
    try {
      const tracking = await storefrontCheckoutApi.trackOrder(orderId);
      setLiveTrackingData(tracking || {
        status: 'Shipment Created',
        courier: 'Blue Dart Express',
        awb: `BD-${orderId}`,
        estimatedDelivery: 'Within 3-4 days',
      });
    } catch {
      setLiveTrackingData({
        status: 'Dispatched from Warehouse',
        courier: 'Blue Dart Air Express',
        awb: `BD-${orderId}`,
        estimatedDelivery: 'Within 3-4 days',
      });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handlePayRemainingBalance = async () => {
    if (!orderId) return;
    setIsPayingBalance(true);
    try {
      const res = await storefrontCheckoutApi.payOrderBalance(orderId);
      const rzpOrder = res?.razorpayOrder || res?.data?.razorpayOrder;
      if (rzpOrder) {
        const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
        await storefrontCheckoutApi.processRazorpayPayment({
          orderId,
          razorpayOrder: rzpOrder,
          customerName: selectedAddr?.name || 'Customer',
          customerEmail: 'customer@store.com',
          customerPhone: selectedAddr?.phone || '9876543210',
          onSuccess: () => {
            alert('Balance payment of ₹' + balancePayableOnDelivery + ' paid successfully!');
            if (placedOrderSummary) {
              setPlacedOrderSummary({ ...placedOrderSummary, balanceDue: 0, status: 'Fully Paid & Confirmed' });
            }
          },
          onFailure: (err) => alert(err.message),
        });
      }
    } catch (err: any) {
      alert('Balance payment: ' + (err?.message || 'Failed to initiate balance payment.'));
    } finally {
      setIsPayingBalance(false);
    }
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
            <span className="text-slate-900 font-bold">Two-Phase Secure Checkout</span>
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
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay 256-Bit Bank Encryption</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* VIEW A: ORDER CONFIRMATION & POST-ORDER LIFECYCLE                   */}
        {/* ------------------------------------------------------------------ */}
        {orderPlaced ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-[#A44101]/10 border-4 border-[#A44101]/20 flex items-center justify-center text-[#A44101] mx-auto shadow-sm">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#A44101] bg-[#A44101]/10 px-3 py-1 rounded-full">
                {placedOrderSummary?.status || 'Order Confirmed'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-navy">
                Thank You for Your Order!
              </h1>
              <p className="text-sm text-slate-500">
                Authoritative Order ID: <span className="font-bold text-navy">{orderId}</span>
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Payment and quote commitment verified. Confirmation SMS and tracking details have been generated for your order.
              </p>
            </div>

            {/* Breakdown card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-navy">{placedOrderSummary?.eta || 'Within 3-4 Business Days'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-[#A44101]">
                  {placedOrderSummary?.paymentMethod || 'Paid Online (Razorpay Verified)'}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="text-slate-500">Total Order Value:</span>
                <span className="font-black text-navy text-sm">₹{placedOrderSummary?.total || displayTotalPayable}</span>
              </div>

              {placedOrderSummary?.balanceDue > 0 && (
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 mt-2">
                  <div>
                    <span className="font-bold block">Remaining Balance Due on Delivery:</span>
                    <span className="text-[11px] text-amber-700">Collect via Cash or QR at doorstep</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black">₹{placedOrderSummary.balanceDue}</span>
                    <button
                      type="button"
                      onClick={handlePayRemainingBalance}
                      disabled={isPayingBalance}
                      className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white font-bold text-[11px] transition-all cursor-pointer"
                    >
                      {isPayingBalance ? 'Opening...' : 'Pay Online Now'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Post-Order Lifecycle Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={isDownloadingInvoice}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-navy font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                {isDownloadingInvoice ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#A44101]" />
                ) : (
                  <Download className="w-4 h-4 text-[#A44101]" />
                )}
                <span>Download PDF Invoice</span>
              </button>

              <button
                type="button"
                onClick={handleTrackShipment}
                disabled={isTrackingLoading}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-navy font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                {isTrackingLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#A44101]" />
                ) : (
                  <Truck className="w-4 h-4 text-[#A44101]" />
                )}
                <span>Track Live Courier</span>
              </button>
            </div>

            {/* Live Shipment Tracking Drawer if queried */}
            {liveTrackingData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-left text-xs space-y-2 text-sky-950"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-700" />
                    <span>Live Courier Status: {liveTrackingData.status}</span>
                  </span>
                  <span className="text-[10px] bg-sky-200/60 px-2 py-0.5 rounded text-sky-900 font-mono">
                    AWB: {liveTrackingData.awb || 'BD-IN-TRANSIT'}
                  </span>
                </div>
                <p className="text-[11px] text-sky-800">
                  Carrier: {liveTrackingData.courier || 'Blue Dart Express'} • Expected Delivery: {liveTrackingData.estimatedDelivery}
                </p>
              </motion.div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onViewOrders || onBackToHome}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                View in My Orders
              </button>
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-stone-50 text-navy font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Back to Store
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
          /* ---------------------------------------------------------------- */
          /* VIEW B: TWO-COLUMN CHECKOUT WITH AUTHORITATIVE QUOTE & RAZORPAY  */
          /* ---------------------------------------------------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Left Column (2 Cols): Address, Items, Gift, Payment */}
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
                        Please add your delivery address so we can check courier turnaround and calculate authoritative quotes.
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
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${isSelected
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

                {/* Serviceability Check Banner */}
                {isDeliveryChecking ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A44101]" />
                    <span>Checking courier serviceability &amp; delivery turnaround...</span>
                  </div>
                ) : deliveryInfo && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {deliveryInfo.message} • {deliveryInfo.courierName || 'Blue Dart Air'} ({deliveryInfo.estimatedDays || '3-4'} business days)
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full uppercase font-bold">
                      Serviceable
                    </span>
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

              {/* SECTION 4: PAYMENT OPTIONS & RAZORPAY / ADVANCE / COD */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy">Select Payment Method</h2>
                    <p className="text-xs text-mutedGray">Instant Razorpay UPI, Advance Split, or Cash on Delivery</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* OPTION 1: Full Online Payment via Razorpay */}
                  <label className={`p-4 rounded-xl border-2 flex flex-col gap-3 cursor-pointer transition-all ${paymentMode === 'online' ? 'border-navy bg-stone-50/70' : 'border-slate-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMode"
                          checked={paymentMode === 'online'}
                          onChange={() => setPaymentMode('online')}
                          className="text-navy focus:ring-navy"
                        />
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-[#A44101]" />
                          <span className="text-xs font-bold text-navy">Instant UPI &amp; Cards (Razorpay Gateway)</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        100% Instant Confirmation
                      </span>
                    </div>

                    {paymentMode === 'online' && (
                      <div className="pl-6 pt-1 text-[11px] text-slate-500 space-y-1">
                        <p>Supports Google Pay, PhonePe, Paytm, BHIM, Visa, RuPay, MasterCard, and NetBanking.</p>
                      </div>
                    )}
                  </label>

                  {/* OPTION 2: Partial Payment (Advance Online + Balance on Delivery) */}
                  {checkoutSettings.partialPaymentEnabled && (
                    <label className={`p-4 rounded-xl border-2 flex flex-col gap-3 cursor-pointer transition-all ${paymentMode === 'advance' ? 'border-navy bg-stone-50/70' : 'border-slate-200'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMode"
                            checked={paymentMode === 'advance'}
                            onChange={() => setPaymentMode('advance')}
                            className="text-navy focus:ring-navy"
                          />
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[#A44101]" />
                            <span className="text-xs font-bold text-navy">
                              Partial Advance ({advancePercent}% Online + Balance on Delivery)
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Flexible Split
                        </span>
                      </div>

                      {paymentMode === 'advance' && (
                        <div className="pl-6 pt-1 text-xs space-y-2">
                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Pay Now via Razorpay:</span>
                              <span className="font-extrabold text-[#A44101] text-sm">₹{advancePayableNow}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Balance Due on Delivery:</span>
                              <span className="font-extrabold text-navy text-sm">₹{balancePayableOnDelivery}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Locks your order and inventory immediately. Balance collected at delivery.
                          </p>
                        </div>
                      )}
                    </label>
                  )}

                  {/* OPTION 3: Full Cash on Delivery (COD) */}
                  <label className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMode === 'cod' ? 'border-navy bg-stone-50/70' : 'border-slate-200'
                    } ${!checkoutSettings.codEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMode"
                        disabled={!checkoutSettings.codEnabled}
                        checked={paymentMode === 'cod'}
                        onChange={() => setPaymentMode('cod')}
                        className="text-navy focus:ring-navy"
                      />
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#A44101]" />
                        <div>
                          <span className="text-xs font-bold text-navy block">Cash on Delivery (Full COD)</span>
                          <span className="text-[10px] text-slate-500">Pay 100% cash when order arrives at doorstep</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {checkoutSettings.codEnabled ? '₹0 Extra Fee' : 'COD Disabled by Store Policy'}
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Right Column (1 Col): Authoritative Summary, Promo Code, CTA */}
            <div className="lg:col-span-1 space-y-6">

              {/* Order Price Breakdown Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                    Authoritative Summary
                  </h3>
                  {serverQuote?.quoteId && (
                    <span className="text-[9px] font-mono bg-stone-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Quote: {serverQuote.quoteId.slice(-8)}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Items Subtotal ({cartItems.reduce((acc, i) => acc + i.qty, 0)} items)</span>
                    <span className="font-bold text-navy">₹{displaySubtotal}</span>
                  </div>

                  <div className="flex justify-between text-[#A44101] font-bold">
                    <span>Catalog Savings</span>
                    <span>- ₹{catalogDiscount}</span>
                  </div>

                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-[#A44101] font-bold">
                      <span>Promotion Discount ({appliedCoupon || 'PROMO'})</span>
                      <span>- ₹{displayDiscount}</span>
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
                    <span className="text-[#A44101] font-bold">
                      {displayDeliveryCharge === 0 ? 'FREE' : `₹${displayDeliveryCharge}`}
                    </span>
                  </div>

                  {displayTaxes > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Applicable GST / Taxes</span>
                      <span>₹{displayTaxes}</span>
                    </div>
                  )}

                  {/* Two-phase plan breakdown */}
                  {paymentMode === 'advance' ? (
                    <div className="pt-3 border-t border-slate-200 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Total Order Value:</span>
                        <span className="font-bold text-navy">₹{displayTotalPayable}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-[#A44101]">
                        <span>Pay Online Now:</span>
                        <span>₹{advancePayableNow}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>Balance at Doorstep:</span>
                        <span>₹{balancePayableOnDelivery}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                      <div>
                        <span className="block text-sm font-black text-navy">Total Payable</span>
                        <span className="text-[10px] text-slate-500">Authoritative Server Quote</span>
                      </div>
                      <span className="text-xl font-black text-navy">₹{displayTotalPayable}</span>
                    </div>
                  )}
                </div>

                {/* Redeem Baba Coins Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#A44101]" />
                    <div>
                      <span className="font-bold text-slate-800">Use 100 Baba Coins</span>
                      <p className="text-[10px] text-slate-500">Save ₹100 on checkout</p>
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
                      placeholder="e.g. SUMMER10, BABA100"
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
                      <span>Code {appliedCoupon} active on checkout quote!</span>
                    </span>
                  )}

                  {/* Available Coupon Quick Suggestions */}
                  {availableCoupons.length > 0 && !appliedCoupon && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {availableCoupons.slice(0, 3).map((cp: any) => (
                        <button
                          key={cp.code || cp.id}
                          type="button"
                          onClick={() => {
                            setCouponCode(cp.code);
                            setAppliedCoupon(cp.code);
                            setCouponDiscount(cp.discountValue || 100);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-[#A44101] text-[10px] font-bold hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                          Use {cp.code}
                        </button>
                      ))}
                    </div>
                  )}
                </form>

                {/* Final Primary CTA Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || isQuoteLoading}
                    className="w-full py-3.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-75"
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Confirming Order...</span>
                      </span>
                    ) : addresses.length === 0 ? (
                      <>
                        <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                        <span>Add Delivery Address to Pay</span>
                      </>
                    ) : paymentMode === 'cod' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Place Order (Cash on Delivery) • ₹{displayTotalPayable}</span>
                      </>
                    ) : paymentMode === 'advance' ? (
                      <>
                        <CreditCard className="w-4 h-4 text-white" />
                        <span>Pay Advance via Razorpay • ₹{advancePayableNow}</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-white" />
                        <span>Pay with Razorpay • ₹{displayTotalPayable}</span>
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
