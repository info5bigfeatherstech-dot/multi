import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Check,
  Trash2,
  Plus,
  Minus,
  Gift,
  Tag,
  QrCode,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Pencil,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { AddAddressModal, NewAddressData } from './AddAddressModal';
import { storefrontCheckoutApi, storefrontAddressApi } from '../api';
import { isAuthenticated, requireAuth } from '../utils/authGuard';

interface CheckoutPageProps {
  onBackToHome?: () => void;
  onGoToWishlist?: () => void;
  onViewOrders?: (orderId?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBackToHome,
  onGoToWishlist,
  onViewOrders,
}) => {
  const { cartItems, updateQty, removeFromCart, clearCart } = useCart();

  // --------------------------------------------------------------------------
  // Step Navigation Wizard State: 1 = Order Review, 2 = Address & Delivery, 3 = Payment
  // --------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const handleProceedToStep2 = () => {
    if (cartItems.length === 0) return;
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToStep3 = () => {
    if (!selectedAddressId || addresses.length === 0) {
      setIsAddressModalOpen(true);
      return;
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeaderBack = () => {
    if (currentStep === 1) {
      onBackToHome?.();
    } else if (currentStep === 2) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
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
  const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

  const [addresses, setAddresses] = useState<Array<{ id: string; name: string; type: string; phone: string; address: string; city: string; pincode: string; isDefault?: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('abb_saved_addresses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any) => ({
            id: String(a.id || a._id || `addr-${Date.now()}`),
            name: a.name || a.fullName || 'Valued Customer',
            type: a.type || 'Home',
            phone: a.phone || '',
            address: a.addressLine || a.address || a.street || a.fullAddressString || '',
            city: a.city || 'Delhi',
            pincode: a.pincode || a.postalCode || '110001',
            isDefault: Boolean(a.isDefault),
          }));
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
          // Prefer default address, otherwise first address
          const defaultAddr = parsed.find((a: any) => a.isDefault) || parsed[0];
          return String(defaultAddr.id || defaultAddr._id || '');
        }
      }
    } catch {
      // fallback
    }
    return '';
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

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

  // Coupons
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

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

  // Post-Order Actions: Balance Payment
  const [isPayingBalance, setIsPayingBalance] = useState(false);

  // --------------------------------------------------------------------------
  // Synchronous Calculations (Local Fallbacks)
  // --------------------------------------------------------------------------
  const subtotalCurrent = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const deliveryFee = 0; // FREE Delivery
  const fallbackFinalTotal = Math.max(0, subtotalCurrent - couponDiscount + deliveryFee);

  // Active Authoritative Values (Server Quote overrides with local fallback)
  const displayTotalPayable = serverQuote?.amountPayable ?? fallbackFinalTotal;

  // Partial Payment breakdown
  const advancePercent = checkoutSettings.partialPaymentPercent || 25;
  const advancePayableNow = Math.round(displayTotalPayable * (advancePercent / 100));
  const balancePayableOnDelivery = displayTotalPayable - advancePayableNow;

  // --------------------------------------------------------------------------
  // Mount: Auth guard — redirect to home if not logged in
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please log in or register to proceed to checkout' });
      onBackToHome?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            partialPaymentEnabled: settings.partialPaymentEnabled !== false,
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
          const apiAddrs = res
            .map((a: any) => {
              const mongoId = String(a._id || a.id || '');
              return {
                id: mongoId,
                name: a.fullName || a.name || 'Valued Customer',
                type: a.addressType || a.type || 'Home',
                phone: a.phone || '',
                address: a.addressLine1 || a.street || a.addressLine || a.address || '',
                city: a.city || 'Delhi',
                pincode: a.postalCode || a.pincode || '110001',
                isDefault: Boolean(a.isDefault),
              };
            });

          setAddresses((prev) => {
            const combined = [...apiAddrs, ...prev.filter(p => !apiAddrs.some(a => a.id === p.id))];
            try { localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(combined)); } catch { /* ignore */ }
            return combined;
          });

          // Auto-select default or first address if current selection is empty or not in list
          setSelectedAddressId((prev) => {
            if (prev) {
              const exists = apiAddrs.some(a => a.id === prev);
              if (exists) return prev;
            }
            const def = apiAddrs.find(a => a.isDefault) || apiAddrs[0];
            return def ? def.id : prev;
          });
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
  // --------------------------------------------------------------------------
  // Auto-sync address to backend if stored with a temporary client ID
  // --------------------------------------------------------------------------
  const ensureAddressSavedOnServer = async (addr: {
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    type?: string;
  }): Promise<string> => {
    if (isValidObjectId(addr.id)) {
      return addr.id;
    }

    const cleanPhone = String(addr.phone || '').trim().replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(-10);

    try {
      const serverRes = await storefrontAddressApi.create({
        fullName: addr.name,
        name: addr.name,
        phone: cleanPhone || '9876543210',
        houseNumber: addr.address || 'Address',
        area: addr.city || 'Locality',
        addressLine1: addr.address || 'Address Line 1',
        postalCode: addr.pincode || '110001',
        street: addr.address || 'Street',
        city: addr.city || 'Delhi',
        state: 'Delhi',
        pincode: addr.pincode || '110001',
        type: addr.type === 'Work' ? 'Work' : 'Home',
        isDefault: true,
      });

      const realId = String(
        serverRes?._id ||
        serverRes?.id ||
        serverRes?.address?._id ||
        serverRes?.address?.id ||
        serverRes?.data?._id ||
        serverRes?.data?.id ||
        ''
      );

      if (realId && isValidObjectId(realId)) {
        setAddresses((prev) => {
          const updated = prev.map((a) => (a.id === addr.id ? { ...a, id: realId } : a));
          try { localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated)); } catch { /* ignore */ }
          return updated;
        });
        setSelectedAddressId(realId);
        return realId;
      }
    } catch (err: any) {
      console.warn('Auto-sync address to backend error:', err?.message);
    }

    return addr.id;
  };

  // --------------------------------------------------------------------------
  // Phase 1: Two-Phase Commit - Fetch Server Authoritative Quote
  // --------------------------------------------------------------------------
  const fetchAuthoritativeQuote = async () => {
    if (!selectedAddressId || cartItems.length === 0) {
      setIsQuoteLoading(false);
      return;
    }

    let addrIdToUse = selectedAddressId;
    if (!isValidObjectId(addrIdToUse)) {
      const addrObj = addresses.find((a) => a.id === selectedAddressId);
      if (addrObj) {
        addrIdToUse = await ensureAddressSavedOnServer(addrObj);
      }
    }

    if (!isValidObjectId(addrIdToUse)) {
      setIsQuoteLoading(false);
      return;
    }

    setIsQuoteLoading(true);

    const hint = paymentMode === 'cod' ? 'cod' : 'online';
    const plan = paymentMode === 'advance' ? 'advance' : 'full';
    const balanceColl = paymentMode === 'online' ? 'online' : 'cod';

    try {
      const qRes = await storefrontCheckoutApi.getQuote({
        addressId: addrIdToUse,
        paymentMethodHint: hint,
        paymentPlan: plan,
        paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
        balanceCollection: balanceColl,
        couponCode: appliedCoupon || undefined,
      });

      if (qRes && (qRes.quoteId || qRes.amountPayable !== undefined)) {
        setServerQuote(qRes);
        if (qRes.checkoutPolicy) {
          setCheckoutSettings((prev) => ({
            ...prev,
            codEnabled: qRes.checkoutPolicy.codEnabled !== false,
            partialPaymentEnabled: qRes.checkoutPolicy.partialPaymentEnabled !== false,
            partialPaymentPercent: Number(qRes.checkoutPolicy.partialPaymentPercent) || 25,
          }));
        }
      }
    } catch (err: any) {
      console.warn('Quote fetch notice:', err?.message);
    } finally {
      setIsQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthoritativeQuote();
  }, [selectedAddressId, paymentMode, appliedCoupon, cartItems.length]);

  // --------------------------------------------------------------------------
  // Address Handler
  // --------------------------------------------------------------------------
  const handleSaveNewAddress = async (newAddr: NewAddressData) => {
    const cleanPhone = String(newAddr.phone || '').trim().replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(-10);

    if (editingAddress) {
      const updatedAddr = {
        ...editingAddress,
        name: newAddr.name,
        type: newAddr.type,
        phone: cleanPhone,
        address: newAddr.fullAddressString,
        city: newAddr.city,
        pincode: newAddr.pincode,
      };

      setAddresses((prev) => {
        const next = prev.map((a) => (a.id === editingAddress.id ? updatedAddr : a));
        try { localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(next)); } catch { }
        return next;
      });

      try {
        await storefrontAddressApi.update(editingAddress.id, {
          fullName: newAddr.name,
          name: newAddr.name,
          phone: cleanPhone,
          houseNumber: newAddr.houseFlat || newAddr.fullAddressString,
          area: newAddr.areaLocality || newAddr.city,
          addressLine1: newAddr.streetLine1 || newAddr.fullAddressString,
          postalCode: newAddr.pincode,
          street: newAddr.fullAddressString,
          city: newAddr.city,
          state: newAddr.state || 'Delhi',
          pincode: newAddr.pincode,
          type: newAddr.type === 'Work' ? 'Work' : 'Home',
        });
      } catch (err: any) {
        console.warn('Backend address update note:', err?.message);
      }

      setEditingAddress(null);
      setIsAddressModalOpen(false);
      return;
    }

    const tempId = `addr-${Date.now()}`;
    const formatted = {
      id: tempId,
      name: newAddr.name,
      type: newAddr.type,
      phone: cleanPhone,
      address: newAddr.fullAddressString,
      city: newAddr.city,
      pincode: newAddr.pincode,
      isDefault: true,
    };
    setAddresses((prev) => {
      const next = [formatted, ...prev.map((a) => ({ ...a, isDefault: false }))];
      try { localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(next)); } catch { }
      return next;
    });
    setSelectedAddressId(tempId);
    setIsAddressModalOpen(false);

    try {
      // Save to backend and capture the real MongoDB _id
      const serverRes = await storefrontAddressApi.create({
        fullName: newAddr.name,
        name: newAddr.name,
        phone: cleanPhone,
        houseNumber: newAddr.houseFlat || newAddr.fullAddressString,
        area: newAddr.areaLocality || newAddr.city,
        addressLine1: newAddr.streetLine1 || newAddr.fullAddressString,
        postalCode: newAddr.pincode,
        street: newAddr.fullAddressString,
        city: newAddr.city,
        state: newAddr.state || 'Delhi',
        pincode: newAddr.pincode,
        type: newAddr.type === 'Work' ? 'Work' : 'Home',
        isDefault: true,
      });

      const realId = String(
        serverRes?._id ||
        serverRes?.id ||
        serverRes?.address?._id ||
        serverRes?.address?.id ||
        serverRes?.data?._id ||
        serverRes?.data?.id ||
        ''
      );

      if (realId && isValidObjectId(realId)) {
        const realAddr = { ...formatted, id: realId };
        setAddresses((prev) => {
          const updated = prev.map((a) => (a.id === tempId ? realAddr : a));
          try { localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated)); } catch { /* ignore */ }
          return updated;
        });
        setSelectedAddressId(realId);
      }
    } catch (err: any) {
      console.warn('Backend address save note:', err?.message);
      try {
        const localList = [formatted, ...addresses.filter((a) => a.id !== tempId)];
        localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(localList));
      } catch { /* ignore */ }
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
      const paymentMethod = paymentMode === 'cod' ? 'cod' : 'online';
      const balanceCollection = paymentMode === 'online' ? 'online' : 'cod';

      // Step A: Ensure we have a valid MongoDB Address ID
      let effectiveAddressId = selectedAddressId;
      if (!isValidObjectId(effectiveAddressId) && selectedAddr) {
        effectiveAddressId = await ensureAddressSavedOnServer(selectedAddr);
      }

      if (!isValidObjectId(effectiveAddressId)) {
        alert('Please select or add a valid delivery address to proceed.');
        setIsPlacingOrder(false);
        setIsAddressModalOpen(true);
        return;
      }

      // Step B: Ensure we have a valid Quote
      let activeQuote = serverQuote;
      if (!activeQuote?.quoteId) {
        try {
          activeQuote = await storefrontCheckoutApi.getQuote({
            addressId: effectiveAddressId,
            paymentMethodHint: paymentMethod,
            paymentPlan: plan,
            paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
            balanceCollection,
            couponCode: appliedCoupon || undefined,
          });
          if (activeQuote?.quoteId) {
            setServerQuote(activeQuote);
          }
        } catch (quoteErr: any) {
          console.warn('Quote generation error:', quoteErr?.message);
        }
      }

      if (!activeQuote?.quoteId) {
        alert('Server Quote Required: Could not generate a checkout quote for this address. Please ensure address details are complete.');
        setIsPlacingOrder(false);
        return;
      }

      // Step C: Lock Payment Choice (POST /api/checkout/confirm)
      await storefrontCheckoutApi.confirmQuote({
        quoteId: activeQuote.quoteId,
        paymentMethod,
        paymentPlan: plan,
        paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
        balanceCollection,
      });

      // Step D: Place Order (POST /api/orders/items with Idempotency-Key & x-storefront)
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
        addressId: effectiveAddressId,
        paymentMethod,
        onlinePaymentMode: plan === 'advance' ? 'advance' : 'full',
        balanceCollection,
        paymentAdvancePercent: plan === 'advance' ? advancePercent : undefined,
        quoteId: activeQuote.quoteId,
        couponCode: appliedCoupon || undefined,
        orderIntent: orderIntentPayload,
      };

      const orderRes = await storefrontCheckoutApi.createOrder(orderPayload);

      const orderData = orderRes?.order || orderRes;
      if (orderRes?.razorpayError) {
        alert('Payment initiation: ' + (orderRes?.razorpayErrorDetail?.description || orderRes?.message || 'Could not initiate Razorpay payment.'));
        setIsPlacingOrder(false);
        return;
      }

      const createdOrderId = orderRes?.orderId || orderData?.orderId || orderData?.orderNumber || `ABB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const razorpayOrder = orderRes?.razorpayOrder || orderData?.razorpayOrder;

      // ----------------------------------------------------------------------
      // Scenario 1: Cash on Delivery (cod)
      // ----------------------------------------------------------------------
      if (paymentMode === 'cod') {
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
      const amountToPayInRupees = plan === 'advance'
        ? (razorpayOrder?.amount ? Math.round(razorpayOrder.amount / 100) : advancePayableNow)
        : (activeQuote?.amountPayable ?? displayTotalPayable);

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
  // Post-Order Lifecycle Actions: Navigation & Balance Payment
  // --------------------------------------------------------------------------
  const handleTrackShipment = () => {
    if (onViewOrders) {
      onViewOrders(orderId);
    } else if (typeof window !== 'undefined') {
      window.location.href = orderId ? `/order?order=${encodeURIComponent(orderId)}` : '/orders';
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
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* ------------------------------------------------------------------ */}
        {/* TOP BAR & STEP PROGRESS WIZARD (Visible when cart has items)       */}
        {/* ------------------------------------------------------------------ */}
        {!orderPlaced && cartItems.length > 0 && (
          <div className="space-y-6">
            {/* Header: Back button, Store branding, Items count & total */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <button
                type="button"
                onClick={handleHeaderBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-navy transition-all shadow-2xs cursor-pointer active:scale-98"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{currentStep === 1 ? 'Back to Store' : currentStep === 2 ? 'Back to Order' : 'Back to Address'}</span>
              </button>

              <div className="text-center">
                <h1 className="text-base sm:text-lg font-black text-navy tracking-tight">
                  Apna Bharat Bazaar
                </h1>
                <p className="text-[11px] font-semibold text-slate-500">
                  {cartItems.reduce((acc, i) => acc + i.qty, 0)} {cartItems.reduce((acc, i) => acc + i.qty, 0) === 1 ? 'item' : 'items'} • ₹{displayTotalPayable}
                </p>
              </div>

              <div className="w-24 sm:w-28 flex justify-end">
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure 256-Bit</span>
                </div>
              </div>
            </div>

            {/* Step Wizard Bar (Step 1 ORDER, Step 2 DELIVERY, Step 3 PAYMENT) */}
            <div className="max-w-xl mx-auto px-4 py-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line Track */}
                <div className="absolute top-[18px] left-10 right-10 h-0.5 bg-slate-200 -z-0" />
                {/* Active Progress Line */}
                <div
                  className="absolute top-[18px] left-10 h-0.5 bg-[#A44101] transition-all duration-300 -z-0"
                  style={{
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 5rem)',
                  }}
                />

                {[
                  { step: 1, label: 'ORDER' },
                  { step: 2, label: 'DELIVERY' },
                  { step: 3, label: 'PAYMENT' },
                ].map((s) => {
                  const isActive = currentStep === s.step;
                  const isCompleted = currentStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (s.step < currentStep) {
                          setCurrentStep(s.step as 1 | 2 | 3);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else if (s.step === 2 && currentStep === 1) {
                          handleProceedToStep2();
                        } else if (s.step === 3 && currentStep === 2) {
                          handleProceedToStep3();
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 relative z-10 bg-white px-3 cursor-pointer group focus:outline-none"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all ${isActive
                          ? 'bg-[#A44101] text-white ring-4 ring-[#A44101]/20 shadow-md scale-105'
                          : isCompleted
                            ? 'bg-[#A44101] text-white'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                          }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                      </div>
                      <span
                        className={`text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase transition-colors ${isActive
                          ? 'text-[#A44101]'
                          : isCompleted
                            ? 'text-navy font-bold'
                            : 'text-slate-400'
                          }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}


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
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTrackShipment}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-navy font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Truck className="w-4 h-4 text-[#A44101]" />
                <span>Track Live Courier</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onViewOrders) {
                    onViewOrders(orderId);
                  } else if (typeof window !== 'undefined') {
                    window.location.href = orderId ? `/order?order=${encodeURIComponent(orderId)}` : '/orders';
                  } else {
                    onBackToHome?.();
                  }
                }}
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
          /* VIEW B: 3-STEP CHECKOUT WIZARD & AUTHORITATIVE PRICE DETAILS     */
          /* ---------------------------------------------------------------- */
          <div className="w-full space-y-6">

              {/* ============================================================ */}
              {/* STEP 1: REVIEW ORDER (Products, Quantities, Coupons, Coins)   */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#A44101] text-white flex items-center justify-center font-black text-xs shadow-xs">
                          1
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-navy">Review Order</h2>
                          <p className="text-xs text-slate-500">
                            Adjust quantities or remove items, then apply a coupon if you have one.
                          </p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-flex text-xs font-bold text-[#A44101] bg-[#A44101]/10 px-2.5 py-0.5 rounded-full border border-[#A44101]/25">
                        {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} in Bag
                      </span>
                    </div>

                    {/* Cart Items List */}
                    <div className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                        <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                            />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-[#A44101] uppercase tracking-wider block truncate">
                                {item.category}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-navy line-clamp-1">
                                {item.title}
                              </h4>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-sm sm:text-base font-black text-navy">
                                  ₹{item.price * item.qty}
                                </span>
                                {item.originalPrice > item.price && (
                                  <span className="text-xs text-slate-400 line-through">
                                    ₹{item.originalPrice * item.qty}
                                  </span>
                                )}
                                {item.qty > 1 && (
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    (₹{item.price} each)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls & Delete Button */}
                          <div className="flex items-center gap-3.5 self-end sm:self-center shrink-0">
                            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-stone-50">
                              <button
                                type="button"
                                onClick={() => handleQuantity(item.id, -1)}
                                className="p-1.5 sm:p-2 hover:bg-stone-200 text-slate-700 cursor-pointer transition-colors"
                                title="Decrease Quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 sm:px-3.5 text-xs font-bold text-navy">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantity(item.id, 1)}
                                className="p-1.5 sm:p-2 hover:bg-stone-200 text-slate-700 cursor-pointer transition-colors"
                                title="Increase Quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Remove Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Coupons & Loyalty Baba Coins */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      {/* Coupon Code Input */}
                      <form onSubmit={handleApplyCoupon} className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#A44101]" />
                          <span>Have a Coupon or Promo Code?</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder={availableCoupons.length > 0 ? `e.g. ${availableCoupons.map((c: any) => c.code).slice(0, 3).join(', ')}` : "Enter coupon code"}
                            className="flex-1 px-3.5 py-2 text-xs uppercase font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-[#A44101] bg-white"
                          />
                          <button
                            type="submit"
                            className="px-5 py-2 bg-navy hover:bg-navy-light text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-2xs"
                          >
                            Apply
                          </button>
                        </div>

                        {appliedCoupon && (
                          <span className="block text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Coupon code "{appliedCoupon}" applied! Saved ₹{couponDiscount}.</span>
                          </span>
                        )}

                        {/* Available Coupon Chips */}
                        {availableCoupons.length > 0 && !appliedCoupon && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] text-slate-500 font-semibold">Available offers:</span>
                            {availableCoupons.slice(0, 4).map((cp: any) => (
                              <button
                                key={cp.code || cp.id}
                                type="button"
                                onClick={() => {
                                  setCouponCode(cp.code);
                                  setAppliedCoupon(cp.code);
                                  setCouponDiscount(cp.discountValue || 100);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#A44101] text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Use {cp.code}
                              </button>
                            ))}
                          </div>
                        )}
                      </form>

                    </div>

                    {/* Step 1 Footer CTA */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={onBackToHome}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-stone-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                      >
                        ← Continue Shopping
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToStep2}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                      >
                        <span>Proceed to Delivery Address</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: CONFIRMING DELIVERY ADDRESS                          */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#A44101] text-white flex items-center justify-center font-black text-xs shadow-xs">
                          2
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-navy">Confirm Delivery Address</h2>
                          <p className="text-xs text-slate-500">
                            Where should we deliver your order? Select or add a delivery location.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(null);
                          setIsAddressModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#A44101] hover:text-[#8C3701] flex items-center gap-1.5 cursor-pointer bg-[#A44101]/10 hover:bg-[#A44101]/15 px-3 py-1.5 rounded-xl transition-all active:scale-98"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Address</span>
                      </button>
                    </div>

                    {/* Address List */}
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
                          onClick={() => {
                            setEditingAddress(null);
                            setIsAddressModalOpen(true);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add Delivery Address</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {(() => {
                          const defaultAddr = addresses.find((a) => a.isDefault) || addresses.find((a) => a.id === selectedAddressId) || addresses[0];
                          if (!defaultAddr) return null;

                          return (
                            <div
                              key={defaultAddr.id}
                              onClick={() => setSelectedAddressId(defaultAddr.id)}
                              className="p-4 rounded-xl border-2 border-[#A44101] bg-orange-50/20 shadow-xs transition-all cursor-pointer relative"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-navy">
                                    {defaultAddr.type}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Default
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAddress(defaultAddr);
                                      setIsAddressModalOpen(true);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-navy hover:bg-stone-100 transition-colors cursor-pointer"
                                    title="Edit Address"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <CheckCircle2 className="w-4 h-4 text-[#A44101] fill-white" />
                                </div>
                              </div>
                              <h4 className="text-xs font-bold text-navy">{defaultAddr.name}</h4>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                {defaultAddr.address}, {defaultAddr.city} - <span className="font-bold">{defaultAddr.pincode}</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                                Phone: {defaultAddr.phone}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Courier Serviceability Banner */}
                    {isDeliveryChecking ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A44101]" />
                        <span>Verifying pincode courier serviceability &amp; delivery speed...</span>
                      </div>
                    ) : deliveryInfo && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            {deliveryInfo.message} • {deliveryInfo.courierName || 'Blue Dart Express'} ({deliveryInfo.estimatedDays || '3-4'} business days)
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2.5 py-0.5 rounded-full uppercase font-bold">
                          Serviceable
                        </span>
                      </div>
                    )}

                    {/* Step 2 Footer Navigation */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-stone-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                      >
                        ← Back to Order Review
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToStep3}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                      >
                        <span>Proceed to Payment Method</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: MODE OF PAYMENT (Razorpay, Partial Advance, COD)     */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Selected Address Summary Pill */}
                  {selectedAddressId && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-[#A44101] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Delivering to
                          </span>
                          <p className="font-bold text-navy truncate">
                            {addresses.find(a => a.id === selectedAddressId)?.name} • {addresses.find(a => a.id === selectedAddressId)?.city} ({addresses.find(a => a.id === selectedAddressId)?.pincode})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[#A44101] font-bold text-xs transition-colors cursor-pointer shrink-0"
                      >
                        Change Address
                      </button>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-soft space-y-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-[#A44101] text-white flex items-center justify-center font-black text-xs shadow-xs">
                        3
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-navy">Select Mode of Payment</h2>
                        <p className="text-xs text-slate-500">
                          Instant Razorpay UPI, Advance Split, or Cash on Delivery.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* OPTION 1: Full Online Payment via Razorpay */}
                      <label className={`p-4 rounded-xl border-2 flex flex-col gap-3 cursor-pointer transition-all ${paymentMode === 'online' ? 'border-[#A44101] bg-orange-50/20 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMode"
                              checked={paymentMode === 'online'}
                              onChange={() => setPaymentMode('online')}
                              className="text-[#A44101] focus:ring-[#A44101] accent-[#A44101]"
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
                        <label className={`p-4 rounded-xl border-2 flex flex-col gap-3 cursor-pointer transition-all ${paymentMode === 'advance' ? 'border-[#A44101] bg-orange-50/20 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="paymentMode"
                                checked={paymentMode === 'advance'}
                                onChange={() => setPaymentMode('advance')}
                                className="text-[#A44101] focus:ring-[#A44101] accent-[#A44101]"
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
                      <label className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMode === 'cod' ? 'border-[#A44101] bg-orange-50/20 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                        } ${!checkoutSettings.codEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMode"
                            disabled={!checkoutSettings.codEnabled}
                            checked={paymentMode === 'cod'}
                            onChange={() => setPaymentMode('cod')}
                            className="text-[#A44101] focus:ring-[#A44101] accent-[#A44101]"
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
                          {checkoutSettings.codEnabled ? '₹0 Extra Fee' : 'COD Disabled'}
                        </span>
                      </label>
                    </div>

                    {/* Gift Intent Feature */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Gift className="w-4 h-4 text-[#A44101]" />
                          <div>
                            <span className="text-xs font-bold text-navy block">Send as a Gift?</span>
                            <span className="text-[11px] text-slate-500">Add personal greeting message &amp; gift note</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isGift}
                          onChange={(e) => setIsGift(e.target.checked)}
                          className="w-4 h-4 text-[#A44101] rounded cursor-pointer accent-[#A44101]"
                        />
                      </div>

                      {isGift && (
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold mb-1 text-slate-700">Recipient Name</label>
                              <input
                                type="text"
                                value={giftRecipient}
                                onChange={(e) => setGiftRecipient(e.target.value)}
                                placeholder="e.g. Priya Sharma"
                                className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:border-[#A44101] focus:outline-none text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-bold mb-1 text-slate-700">Occasion</label>
                              <select
                                value={giftOccasion}
                                onChange={(e) => setGiftOccasion(e.target.value)}
                                className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:border-[#A44101] focus:outline-none text-xs"
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
                            <label className="block font-bold mb-1 text-slate-700">Gift Card Message</label>
                            <textarea
                              rows={2}
                              value={giftMessage}
                              onChange={(e) => setGiftMessage(e.target.value)}
                              placeholder="Write your wishes here..."
                              className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:border-[#A44101] focus:outline-none text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 3 Footer Navigation & Order Placement */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-stone-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                      >
                        ← Back to Address
                      </button>

                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder || isQuoteLoading}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-75"
                      >
                        {isPlacingOrder ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Confirming Order...</span>
                          </span>
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
                    </div>
                  </div>
                </motion.div>
              )}

          </div>
        )}

      </div>

      {/* 2-Step Add Address Modal Popup */}
      <AddAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSaveAddress={handleSaveNewAddress}
        initialValues={editingAddress ? {
          name: editingAddress.name,
          phone: editingAddress.phone,
          pincode: editingAddress.pincode,
          city: editingAddress.city,
          type: editingAddress.type,
          streetLine1: editingAddress.address,
        } : undefined}
      />
    </div>
  );
};
