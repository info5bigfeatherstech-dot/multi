import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  MapPin, 
  Coins, 
  Check, 
  ArrowLeft,
  Truck, 
  Plus, 
  Trash2, 
  Gift, 
  ChevronRight,
  Phone,
  Award,
  Loader2,
  LogOut,
  ShoppingBag,
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  Pencil,
  Copy
} from 'lucide-react';
import { fetchPincodeDetailsFromApi } from '../utils/pincodeApi';
import { 
  storefrontAuthApi, 
  storefrontAddressApi, 
  storefrontCheckoutApi 
} from '../api';
import { OrderDetailTrackingView } from './profile/OrderDetailTrackingView';

interface ProfilePageProps {
  onBackToHome?: () => void;
  onGoToWishlist?: () => void;
  onGoToCheckout?: () => void;
  onRequireAuth?: () => void;
}

type TabKey = 'profile' | 'orders' | 'addresses' | 'wallet' | 'settings';

const getTabFromLocation = (): TabKey => {
  if (typeof window === 'undefined') return 'profile';
  const path = window.location.pathname.toLowerCase();
  if (path === '/order' || path === '/orders' || path.startsWith('/order/') || path.startsWith('/orders/')) {
    return 'orders';
  }
  if (path === '/address' || path === '/addresses' || path.startsWith('/address/') || path.startsWith('/addresses/')) {
    return 'addresses';
  }
  if (path === '/profile') {
    return 'profile';
  }
  const hash = window.location.hash.toLowerCase();
  if (hash === '#orders' || hash === '#order') return 'orders';
  if (hash === '#addresses' || hash === '#address') return 'addresses';
  if (hash === '#profile') return 'profile';
  return 'profile';
};

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToHome,
  onGoToWishlist: _onGoToWishlist,
  onGoToCheckout,
  onRequireAuth,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>(getTabFromLocation);

  // User Profile Form State
  const [userName, setUserName] = useState(() => {
    try {
      const saved = localStorage.getItem('abb_user_profile_name');
      if (saved && saved !== 'Google User') return saved;
      return 'Rahul Sharma';
    } catch {
      return 'Rahul Sharma';
    }
  });
  const [userEmail, setUserEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('abb_user_profile_email');
      if (saved && saved !== 'user@gmail.com') return saved;
      return 'rahul.sharma@example.com';
    } catch {
      return 'rahul.sharma@example.com';
    }
  });
  const [userPhone, setUserPhone] = useState(() => {
    try {
      return localStorage.getItem('abb_user_profile_phone') || '+91 98765 43210';
    } catch {
      return '+91 98765 43210';
    }
  });
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Addresses State with localStorage persistence + API sync
  const [addresses, setAddresses] = useState<Array<{
    id: string;
    type: string;
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state?: string;
    pincode: string;
    isDefault?: boolean;
    houseNumber?: string;
    area?: string;
    addressLine1?: string;
    landmark?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('abb_saved_addresses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any) => ({
            id: a.id || a._id,
            name: a.name || a.fullName,
            type: a.type || 'Home',
            phone: a.phone,
            addressLine: a.addressLine || a.address || a.street || '',
            city: a.city,
            state: a.state || 'Delhi',
            pincode: a.pincode,
            isDefault: a.isDefault,
            houseNumber: a.houseNumber || '',
            area: a.area || '',
            addressLine1: a.addressLine1 || '',
            landmark: a.landmark || a.addressLine2 || '',
          }));
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Inline Address Form State (No Modal Popup)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrFullName, setAddrFullName] = useState(() => userName || '');
  const [addrPhone, setAddrPhone] = useState(() => userPhone.replace('+91 ', '') || '');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrHouseNumber, setAddrHouseNumber] = useState('');
  const [addrBuilding, setAddrBuilding] = useState('');
  const [addrFloor, setAddrFloor] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrAddressLine1, setAddrAddressLine1] = useState('');
  const [addrAddressLine2, setAddrAddressLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrType, setAddrType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState('');
  const [addressFormError, setAddressFormError] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeHint, setPincodeHint] = useState('');

  // Orders State strictly fetched from live API - NO DUMMY ORDERS
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dedicated inside order details page view state
  const [selectedOrderIdForInsideView, setSelectedOrderIdForInsideView] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oParam = params.get('order');
      if (oParam) return oParam;
      const hash = window.location.hash;
      if (hash.startsWith('#order-')) return hash.replace('#order-', '');
    }
    return null;
  });

  const handleOpenInsideOrder = (orderId: string) => {
    setSelectedOrderIdForInsideView(orderId);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/order?order=${encodeURIComponent(orderId)}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromLocation();
      setActiveTab(tab);
      const params = new URLSearchParams(window.location.search);
      const oParam = params.get('order');
      setSelectedOrderIdForInsideView(oParam || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-resolve MongoDB ObjectId (e.g. 6ad59f5a740cc5d773dae434) to public orderId (OWB-ECOMM-...)
  useEffect(() => {
    if (selectedOrderIdForInsideView && orders.length > 0) {
      const matched = orders.find(
        (o) => o._id === selectedOrderIdForInsideView || o.id === selectedOrderIdForInsideView || o.orderId === selectedOrderIdForInsideView
      );
      const publicId = matched?.orderId || matched?.id;
      if (publicId && publicId !== selectedOrderIdForInsideView) {
        setSelectedOrderIdForInsideView(publicId);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/order?order=${encodeURIComponent(publicId)}`);
        }
      }
    }
  }, [selectedOrderIdForInsideView, orders]);

  // Sync profile, addresses and orders from backend storefrontApi
  useEffect(() => {
    const token = localStorage.getItem('user_access_token');
    if (!token) {
      if (onRequireAuth) {
        onRequireAuth();
      } else if (onBackToHome) {
        onBackToHome();
      }
      return;
    }

    // 1. Fetch Profile
    storefrontAuthApi.getProfile()
      .then((profile) => {
        if (profile) {
          if (profile.name) setUserName(profile.name);
          if (profile.email) setUserEmail(profile.email);
          if (profile.phone) setUserPhone(profile.phone);
        }
      })
      .catch(() => {});

    // 2. Fetch Addresses
    storefrontAddressApi.list()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const apiAddrs = list.map((a: any) => ({
            id: a.id || a._id,
            name: a.fullName || a.name,
            type: a.type || 'Home',
            phone: a.phone,
            addressLine: a.street || a.addressLine || a.address || '',
            city: a.city,
            state: a.state || 'Delhi',
            pincode: a.pincode,
            isDefault: a.isDefault || false,
            houseNumber: a.houseNumber || '',
            area: a.area || '',
            addressLine1: a.addressLine1 || '',
            landmark: a.landmark || a.addressLine2 || '',
          }));
          setAddresses((prev) => {
            const merged = [...apiAddrs, ...prev.filter(p => !apiAddrs.some(a => a.id === p.id))];
            return merged;
          });
        }
      })
      .catch(() => {});

    // 3. Clean out legacy dummy mock orders from storage
    try {
      const saved = localStorage.getItem('abb_user_orders_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p: any) => p.id !== 'OFB-92841' && p.id !== 'OFB-84912');
          localStorage.setItem('abb_user_orders_v1', JSON.stringify(cleaned));
        }
      }
    } catch {}

    // 4. Fetch Live Orders from Backend API
    setIsLoadingOrders(true);
    setOrdersError(null);
    storefrontCheckoutApi.getMyOrders()
      .then((ordersRes) => {
        const orderList = Array.isArray(ordersRes) 
          ? ordersRes 
          : ordersRes?.orders || ordersRes?.items || ordersRes?.data || [];

        // Check local storage for session orders to enrich data if backend items are minimal
        let localOrdersMap: Record<string, any> = {};
        try {
          const saved = localStorage.getItem('abb_user_orders_v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              parsed.forEach((po: any) => {
                if (po.id) localOrdersMap[po.id] = po;
              });
            }
          }
        } catch {}

        if (Array.isArray(orderList) && orderList.length > 0) {
          const mapped = orderList.map((o: any) => {
            const orderId = o.orderId || o.orderNumber || o.id || o._id;
            const local = localOrdersMap[orderId] || (o._id ? localOrdersMap[o._id] : {}) || {};

            const status = o.orderStatus || o.status || local.status || 'Confirmed';
            let statusColor = 'text-[#A44101] bg-[#A44101]/10 border-[#A44101]/25';
            let trackingStep = 1;

            const s = String(status).toLowerCase();
            if (s.includes('deliver')) {
              statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
              trackingStep = 4;
            } else if (s.includes('out for delivery')) {
              statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
              trackingStep = 3;
            } else if (s.includes('ship')) {
              statusColor = 'text-sky-700 bg-sky-50 border-sky-200';
              trackingStep = 2;
            } else if (s.includes('cancel')) {
              statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
              trackingStep = 1;
            }

            // Extract pricing details
            const total = o.pricing?.finalTotal ?? o.pricing?.total ?? o.pricing?.amountPayable ?? o.total ?? o.totalAmount ?? o.amount ?? o.amountPayable ?? local.total ?? 0;
            const subtotal = o.pricing?.itemsSubtotal ?? o.pricing?.subtotal ?? o.subtotal ?? o.itemsTotal ?? local.subtotal ?? total;
            const deliveryCharges = o.pricing?.deliveryCharges ?? o.deliveryCharges ?? local.deliveryCharges ?? 0;
            const discount = o.pricing?.promotionDiscount ?? o.pricing?.discount ?? o.discount ?? local.discount ?? 0;

            // Extract shipping address
            const addrObj = o.shippingAddress || o.shipping?.address || o.deliveryAddress || o.address || local.shippingAddress || {};
            const recipientName = addrObj.fullName || addrObj.name || o.customer?.name || o.orderIntent?.recipientName || local.recipientName || 'Customer';
            const recipientPhone = addrObj.phone || o.customer?.phone || o.orderIntent?.recipientPhone || local.recipientPhone || '';
            const fullAddress = addrObj.fullAddress || addrObj.addressLine || addrObj.street || addrObj.address || [addrObj.houseNumber, addrObj.addressLine1, addrObj.area, addrObj.city, addrObj.state, addrObj.pincode || addrObj.postalCode].filter(Boolean).join(', ') || local.address || 'Standard Delivery Address';

            // Helper to extract items, variants and real product images directly from API response
            const extractItemsFromApi = (list: any[]) => {
              if (!Array.isArray(list) || list.length === 0) return [];
              return list.map((i: any, idx: number) => {
                const prod = (typeof i.productId === 'object' && i.productId !== null)
                  ? i.productId
                  : (typeof i.product === 'object' && i.product !== null ? i.product : {});

                const title = prod.name || prod.title || i.productTitle || i.title || i.name || 'Store Item';

                const matchingVariant = Array.isArray(prod.variants)
                  ? (prod.variants.find((v: any) => String(v._id || v.id) === String(i.variantId)) || prod.variants[0])
                  : null;

                const variantImg = matchingVariant?.images?.[0]?.url ||
                  (typeof matchingVariant?.images?.[0] === 'string' ? matchingVariant?.images?.[0] : null) ||
                  matchingVariant?.image?.url ||
                  matchingVariant?.image;

                const prodImg =
                  (Array.isArray(prod.images) ? (prod.images[0]?.url || (typeof prod.images[0] === 'string' ? prod.images[0] : null)) : null) ||
                  prod.cardImage?.url ||
                  prod.image?.url ||
                  (typeof prod.image === 'string' ? prod.image : null);

                const directImg =
                  i.image?.url ||
                  (typeof i.image === 'string' ? i.image : null) ||
                  (Array.isArray(i.images) ? (i.images[0]?.url || (typeof i.images[0] === 'string' ? i.images[0] : null)) : null) ||
                  i.thumbnail?.url ||
                  (typeof i.thumbnail === 'string' ? i.thumbnail : null);

                const image = variantImg || prodImg || directImg || '';
                const price = Number((i.priceSnapshot?.sale || i.priceSnapshot?.base) ?? (i.price ?? i.salePrice ?? i.unitPrice ?? i.currentPrice ?? prod.price ?? 0));
                const qty = Number(i.quantity ?? i.qty ?? i.count ?? 1);
                const category = prod.category?.name || prod.category || i.category || '';

                return {
                  id: i.productId?._id || i.productId?.id || i.productId || i.id || `item-${idx}`,
                  title,
                  image,
                  price,
                  qty,
                  category,
                };
              });
            };

            const rawItems = (o.items && o.items.length > 0) 
              ? o.items 
              : (o.orderItems || o.products || o.cartItems || local.items || []);

            const items = extractItemsFromApi(rawItems);

            return {
              id: orderId,
              date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (local.date || 'Recent'),
              time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
              status,
              statusColor,
              eta: o.estimatedDelivery 
                ? `Delivery Expected: ${new Date(o.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                : (local.eta || (s.includes('deliver') ? 'Delivered' : 'Delivery Expected: 3-5 days')),
              total,
              subtotal,
              deliveryCharges,
              discount,
              itemCount: items.length || 1,
              trackingStep,
              carrier: o.shipping?.carrier || o.carrier || local.carrier || 'Blue Dart Express',
              trackingNumber: o.shipping?.trackingNumber || o.trackingNumber || o.awbNumber || local.trackingNumber || `BD-${String(orderId).slice(-8).toUpperCase()}`,
              paymentMethod: o.paymentMethod || o.paymentMode || o.payment?.method || local.paymentMethod || 'Online Payment',
              paymentStatus: o.paymentStatus || o.payment?.status || (s.includes('pending') ? 'Pending' : 'Completed'),
              shippingAddress: {
                name: recipientName,
                phone: recipientPhone,
                address: fullAddress,
                city: addrObj.city || '',
                state: addrObj.state || '',
                pincode: addrObj.pincode || addrObj.postalCode || '',
                type: addrObj.type || 'Home',
              },
              items,
              orderId: o.orderId || orderId,
              _id: o._id,
              raw: o,
            };
          });
          setOrders(mapped);

          // Fetch full live order details from API for each order to get real product images and names
          orderList.forEach((o: any) => {
            const oId = o.orderId || o.orderNumber || o.id;
            if (!oId) return;
            storefrontCheckoutApi.getOrderDetails(oId)
              .then((res) => {
                const detail = res?.order || res?.data || res;
                const detailItems = detail?.items || detail?.orderItems || detail?.products || [];
                if (Array.isArray(detailItems) && detailItems.length > 0) {
                  const parsed = detailItems.map((i: any, idx: number) => {
                    const prod = (typeof i.productId === 'object' && i.productId !== null)
                      ? i.productId
                      : (typeof i.product === 'object' && i.product !== null ? i.product : {});

                    const title = prod.name || prod.title || i.productTitle || i.title || i.name || 'Store Item';

                    const matchingVariant = Array.isArray(prod.variants)
                      ? (prod.variants.find((v: any) => String(v._id || v.id) === String(i.variantId)) || prod.variants[0])
                      : null;

                    const variantImg = matchingVariant?.images?.[0]?.url ||
                      (typeof matchingVariant?.images?.[0] === 'string' ? matchingVariant?.images?.[0] : null) ||
                      matchingVariant?.image?.url ||
                      matchingVariant?.image;

                    const prodImg =
                      (Array.isArray(prod.images) ? (prod.images[0]?.url || (typeof prod.images[0] === 'string' ? prod.images[0] : null)) : null) ||
                      prod.cardImage?.url ||
                      prod.image?.url ||
                      (typeof prod.image === 'string' ? prod.image : null);

                    const directImg =
                      i.image?.url ||
                      (typeof i.image === 'string' ? i.image : null) ||
                      (Array.isArray(i.images) ? (i.images[0]?.url || (typeof i.images[0] === 'string' ? i.images[0] : null)) : null) ||
                      i.thumbnail?.url ||
                      (typeof i.thumbnail === 'string' ? i.thumbnail : null);

                    const image = variantImg || prodImg || directImg || '';
                    const price = Number((i.priceSnapshot?.sale || i.priceSnapshot?.base) ?? (i.price ?? i.salePrice ?? i.unitPrice ?? i.currentPrice ?? prod.price ?? 0));
                    const qty = Number(i.quantity ?? i.qty ?? i.count ?? 1);
                    const category = prod.category?.name || prod.category || i.category || '';

                    return {
                      id: i.productId?._id || i.productId?.id || i.productId || i.id || `item-${idx}`,
                      title,
                      image,
                      price,
                      qty,
                      category,
                    };
                  });

                  if (parsed.length > 0) {
                    setOrders((prev) =>
                      prev.map((ord) =>
                        (ord.id === oId || ord.orderId === oId || (o._id && ord._id === o._id))
                          ? { ...ord, items: parsed, itemCount: parsed.length }
                          : ord
                      )
                    );
                  }
                }
              })
              .catch(() => {});
          });
        } else {
          // If server returned 0 orders, check if there are genuine session orders from checkout
          try {
            const saved = localStorage.getItem('abb_user_orders_v1');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const realSessionOrders = parsed.filter((p: any) => 
                  p.id && p.id !== 'OFB-92841' && p.id !== 'OFB-84912'
                );
                setOrders(realSessionOrders);
                return;
              }
            }
          } catch {}
          setOrders([]);
        }
      })
      .catch((err) => {
        console.warn('Orders API error:', err);
        setOrders([]);
        setOrdersError('Unable to load orders at this time');
      })
      .finally(() => {
        setIsLoadingOrders(false);
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      localStorage.setItem('abb_user_profile_name', userName);
      localStorage.setItem('abb_user_profile_email', userEmail);
      localStorage.setItem('abb_user_profile_phone', userPhone);
      await storefrontAuthApi.updateProfile({
        name: userName,
        email: userEmail,
        phone: userPhone,
      });
    } catch {
      // offline fallback
    } finally {
      setIsSavingProfile(false);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2500);
    }
  };

  useEffect(() => {
    if (userName && !addrFullName) setAddrFullName(userName);
    if (userPhone && !addrPhone) setAddrPhone(userPhone.replace('+91 ', ''));
  }, [userName, userPhone]);

  const handleInlinePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setAddrPincode(cleaned);
    setPincodeHint('');
    if (cleaned.length === 6) {
      setIsFetchingPincode(true);
      try {
        const details = await fetchPincodeDetailsFromApi(cleaned);
        if (details) {
          if (details.city) setAddrCity(details.city);
          if (details.state) setAddrState(details.state);
          if (details.locality && !addrArea) setAddrArea(details.locality);
          setPincodeHint(`${details.city}${details.state ? `, ${details.state}` : ''}`);
        }
      } catch {
        // ignore
      } finally {
        setIsFetchingPincode(false);
      }
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrFullName(userName || '');
    setAddrPhone((userPhone || '').replace('+91 ', '') || '');
    setAddrPincode('');
    setAddrHouseNumber('');
    setAddrBuilding('');
    setAddrFloor('');
    setAddrArea('');
    setAddrAddressLine1('');
    setAddrAddressLine2('');
    setAddrLandmark('');
    setAddrCity('');
    setAddrState('');
    setAddrType('Home');
    setAddrIsDefault(false);
    setPincodeHint('');
    setAddressFormError('');
  };

  const handleStartEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddressFormError('');
    setAddrFullName(addr.name || addr.fullName || '');
    const cleanPhone = (addr.phone || '').replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(-10);
    setAddrPhone(cleanPhone);
    setAddrPincode(addr.pincode || addr.postalCode || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || 'Delhi');
    setAddrType((addr.type as 'Home' | 'Work' | 'Other') || 'Home');
    setAddrIsDefault(Boolean(addr.isDefault));

    setAddrHouseNumber(addr.houseNumber || '');
    setAddrBuilding(addr.building || '');
    setAddrFloor(addr.floor || '');
    setAddrArea(addr.area || '');
    setAddrAddressLine1(addr.addressLine1 || addr.addressLine || '');
    setAddrAddressLine2(addr.addressLine2 || '');
    setAddrLandmark(addr.landmark || '');

    setPincodeHint(`${addr.city || ''}${addr.state ? `, ${addr.state}` : ''}`);
    setShowAddressForm(true);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleSaveInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError('');

    if (!addrFullName.trim()) {
      setAddressFormError('Please enter full name');
      return;
    }
    const cleanPhone = addrPhone.replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setAddressFormError('Phone must be a valid 10-digit Indian mobile number (e.g. 9876543210)');
      return;
    }
    const cleanPin = addrPincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setAddressFormError('Postal code / Pincode must be exactly 6 digits');
      return;
    }
    if (!addrHouseNumber.trim()) {
      setAddressFormError('House / flat / building number is required');
      return;
    }
    if (!addrArea.trim()) {
      setAddressFormError('Area / locality is required');
      return;
    }
    const finalAddressLine1 = addrAddressLine1.trim() || `${addrHouseNumber.trim()}, ${addrArea.trim()}`;
    if (!finalAddressLine1) {
      setAddressFormError('Address line 1 is required. Include street name, building, or road details.');
      return;
    }
    if (!addrCity.trim()) {
      setAddressFormError('Please enter City / District');
      return;
    }
    if (!addrState.trim()) {
      setAddressFormError('Please enter State');
      return;
    }

    setIsSavingAddress(true);

    const fullStreet = [
      addrHouseNumber.trim(),
      addrBuilding.trim(),
      addrFloor.trim(),
      finalAddressLine1,
      addrAddressLine2.trim(),
      addrArea.trim(),
      addrLandmark.trim() ? `Near ${addrLandmark.trim()}` : '',
    ].filter(Boolean).join(', ');

    if (editingAddressId) {
      // 1. Updating existing address
      try {
        await storefrontAddressApi.update(editingAddressId, {
          fullName: addrFullName.trim(),
          name: addrFullName.trim(),
          phone: cleanPhone,
          houseNumber: addrHouseNumber.trim(),
          building: addrBuilding.trim(),
          floor: addrFloor.trim(),
          area: addrArea.trim(),
          postalCode: cleanPin,
          pincode: cleanPin,
          addressLine1: finalAddressLine1,
          addressLine2: addrAddressLine2.trim() || addrLandmark.trim(),
          street: fullStreet,
          landmark: addrLandmark.trim(),
          city: addrCity.trim(),
          state: addrState.trim() || 'Delhi',
          type: addrType,
          isDefault: addrIsDefault,
        });
      } catch (apiErr: any) {
        console.warn('Backend update address warning:', apiErr?.message);
      }

      const updatedObj = {
        id: editingAddressId,
        name: addrFullName.trim(),
        phone: cleanPhone,
        type: addrType,
        addressLine: fullStreet,
        city: addrCity.trim(),
        state: addrState.trim() || 'Delhi',
        pincode: cleanPin,
        isDefault: addrIsDefault,
        houseNumber: addrHouseNumber.trim(),
        building: addrBuilding.trim(),
        floor: addrFloor.trim(),
        area: addrArea.trim(),
        addressLine1: finalAddressLine1,
        addressLine2: addrAddressLine2.trim(),
        landmark: addrLandmark.trim(),
      };

      let updatedList = addresses.map((a) => (a.id === editingAddressId ? { ...a, ...updatedObj } : a));
      if (addrIsDefault) {
        updatedList = updatedList.map((a) => ({
          ...a,
          isDefault: a.id === editingAddressId,
        }));
      }

      setAddresses(updatedList);
      try {
        localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updatedList));
      } catch (err) {
        console.warn(err);
      }

      setAddressSuccessMsg('Delivery address updated successfully!');
      resetAddressForm();
      setShowAddressForm(false);
      setTimeout(() => setAddressSuccessMsg(''), 3000);
      setIsSavingAddress(false);
      return;
    }

    const newAddrObj = {
      id: `addr_${Date.now()}`,
      name: addrFullName.trim(),
      phone: cleanPhone.slice(-10),
      type: addrType,
      addressLine: fullStreet,
      city: addrCity.trim(),
      state: addrState.trim() || 'Delhi',
      pincode: cleanPin,
      isDefault: addresses.length === 0 || addrIsDefault,
      houseNumber: addrHouseNumber.trim(),
      building: addrBuilding.trim(),
      floor: addrFloor.trim(),
      area: addrArea.trim(),
      addressLine1: finalAddressLine1,
      addressLine2: addrAddressLine2.trim(),
      landmark: addrLandmark.trim(),
    };

    try {
      const apiRes = await storefrontAddressApi.create({
        fullName: newAddrObj.name,
        name: newAddrObj.name,
        phone: newAddrObj.phone,
        houseNumber: addrHouseNumber.trim(),
        building: addrBuilding.trim(),
        floor: addrFloor.trim(),
        area: addrArea.trim(),
        postalCode: cleanPin,
        pincode: cleanPin,
        addressLine1: finalAddressLine1,
        addressLine2: addrAddressLine2.trim() || addrLandmark.trim(),
        street: fullStreet,
        landmark: addrLandmark.trim(),
        city: newAddrObj.city,
        state: newAddrObj.state,
        type: newAddrObj.type === 'Work' ? 'Work' : 'Home',
        isDefault: newAddrObj.isDefault,
      });

      const finalId = apiRes?.id || apiRes?._id || newAddrObj.id;
      const savedItem = { ...newAddrObj, id: finalId };

      let updatedList = [savedItem, ...addresses];
      if (savedItem.isDefault) {
        updatedList = updatedList.map((a) => ({
          ...a,
          isDefault: a.id === savedItem.id,
        }));
      }

      setAddresses(updatedList);
      try {
        localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updatedList));
      } catch (err) {
        console.warn(err);
      }

      setAddressSuccessMsg('Delivery address saved successfully!');
      resetAddressForm();
      setShowAddressForm(false);
      setTimeout(() => setAddressSuccessMsg(''), 3000);
    } catch (apiErr: any) {
      console.warn('API address sync note:', apiErr);
      const errMsg = apiErr?.response?.data?.message || apiErr?.message || 'Failed to save address on server. Please check required fields.';
      setAddressFormError(errMsg);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    try {
      localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    try {
      await storefrontAddressApi.delete(id);
    } catch {
      // offline
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    try {
      localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Calls POST /auth/logout API endpoint & removes user_access_token
      await storefrontAuthApi.logout();
    } catch (err) {
      console.warn('Logout API notice:', err);
    } finally {
      localStorage.removeItem('user_access_token');
      localStorage.removeItem('abb_user_profile_name');
      localStorage.removeItem('abb_user_profile_email');
      localStorage.removeItem('abb_user_profile_phone');
      setIsLoggingOut(false);
      window.dispatchEvent(new Event('abb_auth_change'));
      if (onBackToHome) {
        onBackToHome();
      } else {
        window.location.href = '/';
      }
    }
  };

  const hasAccessToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem('user_access_token')) : true;
  if (!hasAccessToken) {
    return null;
  }

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 animate-fadeIn">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        


        {/* User Hero Banner */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-navy text-white flex items-center justify-center font-bold text-2xl sm:text-3xl border-4 border-white shadow-md">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-navy">{userName || 'My Account'}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A44101]/10 text-[#A44101] border border-[#A44101]/25">
                  <Award className="w-3 h-3 text-[#A44101]" />
                  <span>Gold Member</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {userEmail || userPhone ? `${userEmail || ''} ${userEmail && userPhone ? '•' : ''} ${userPhone || ''}` : 'Manage your orders, saved addresses and preferences'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Member of Apna Bharat Bazaar
              </p>
            </div>
          </div>

        </div>

        {/* Dashboard Navigation Tabs & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-soft p-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setSelectedOrderIdForInsideView(null);
                if (typeof window !== 'undefined' && window.location.pathname !== '/order') {
                  window.history.pushState(null, '', '/order');
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>My Orders & Tracking</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                {isLoadingOrders ? '...' : orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setSelectedOrderIdForInsideView(null);
                if (typeof window !== 'undefined' && window.location.pathname !== '/profile') {
                  window.history.pushState(null, '', '/profile');
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span>Profile Information</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('addresses');
                setSelectedOrderIdForInsideView(null);
                if (typeof window !== 'undefined' && window.location.pathname !== '/address') {
                  window.history.pushState(null, '', '/address');
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Saved Delivery Addresses</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                {addresses.length}
              </span>
            </button>

         

            {/* Logout button in sidebar */}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100 disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <LogOut className="w-4 h-4" />}
                  <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
                </div>
                <span className="text-[10px] text-red-400 font-mono">auth/logout</span>
              </button>
            </div>
          </div>

          {/* Right Tab Content View */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-soft p-5 sm:p-7 min-h-[460px]">
            
            {/* TAB 1: ORDERS & TRACKING */}
            {activeTab === 'orders' && (
              selectedOrderIdForInsideView ? (
                (() => {
                  const matchedOrder = orders.find(
                    (o) => o.id === selectedOrderIdForInsideView || o.orderId === selectedOrderIdForInsideView || o._id === selectedOrderIdForInsideView
                  );
                  const effectiveId = matchedOrder?.orderId || matchedOrder?.id || selectedOrderIdForInsideView;
                  return (
                    <OrderDetailTrackingView
                      orderId={effectiveId}
                      initialOrder={matchedOrder}
                      onBack={() => {
                        setSelectedOrderIdForInsideView(null);
                        if (typeof window !== 'undefined') {
                          window.history.pushState(null, '', '/order');
                        }
                      }}
                      onGoToCheckout={onGoToCheckout}
                    />
                  );
                })()
              ) : (
                <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-navy">Order History & Shipment Tracking</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Track your packages, download GST invoices, and reorder</p>
                  </div>
                  <span className="text-xs text-navy bg-slate-100 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                    {isLoadingOrders ? 'Checking status...' : orders.length > 0 ? `${orders.length} Order${orders.length === 1 ? '' : 's'}` : '0 Orders'}
                  </span>
                </div>

                {isLoadingOrders ? (
                  <div className="py-20 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#A44101] animate-spin mx-auto" />
                    <p className="text-sm font-bold text-navy">Loading your orders...</p>
                    <p className="text-xs text-slate-400">Fetching live order records from server</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-stone-50/50 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-navy">No Orders Found</h3>
                      <p className="text-xs text-slate-500">
                        {ordersError ? ordersError : "You haven't placed any orders yet. Discover our fresh collection and place your first order today!"}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={onBackToHome}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Start Shopping</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map((order) => {
                      const displayItems = (order.items && order.items.length > 0)
                        ? order.items
                        : [
                            {
                              id: `order-item-${order.id}`,
                              title: `Order #${String(order.id).length > 10 ? String(order.id).slice(-6) : order.id}`,
                              image: '',
                              price: order.total || 0,
                              qty: 1,
                              category: 'Order',
                            }
                          ];

                      return (
                        <div 
                          key={order.id}
                          onClick={() => handleOpenInsideOrder(order.id)}
                          className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200 p-4 sm:p-5 cursor-pointer group"
                        >
                          {/* Row 1: Header (Clean ID, Date, Status Badge, Total Amount) */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-navy group-hover:text-[#A44101] transition-colors flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-[#A44101]" />
                                <span>#{String(order.id).length > 12 ? `${String(order.id).slice(0, 6)}...${String(order.id).slice(-4)}` : order.id}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyText(order.id, `order-${order.id}`);
                                }}
                                className="text-slate-400 hover:text-navy p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Copy full Order ID"
                              >
                                {copiedId === `order-${order.id}` ? (
                                  <span className="text-[10px] font-bold text-emerald-600">Copied!</span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <span className="text-xs text-slate-300">•</span>
                              <span className="text-xs text-slate-500 font-medium">Placed on {order.date}{order.time ? ` at ${order.time}` : ''}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${order.statusColor}`}>
                                {order.status}
                              </span>
                              <span className="text-sm sm:text-base font-black text-navy">
                                ₹{order.total}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Product Thumbnails, Summary & Actions */}
                          <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Product Thumbnails Stack */}
                              <div className="flex items-center -space-x-2 shrink-0">
                                {displayItems.slice(0, 3).map((item: any, idx: number) => (
                                  item.image ? (
                                    <img
                                      key={idx}
                                      src={item.image}
                                      alt={item.title}
                                      className="w-12 h-12 rounded-xl object-cover border-2 border-white bg-slate-50 shadow-2xs"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div
                                      key={idx}
                                      className="w-12 h-12 rounded-xl border-2 border-white bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shadow-2xs shrink-0"
                                      title={item.title}
                                    >
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )
                                ))}
                                {displayItems.length > 3 && (
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-[11px] font-bold text-slate-600 shadow-2xs">
                                    +{displayItems.length - 3}
                                  </div>
                                )}
                              </div>

                              {/* Title, ETA and Item count */}
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-navy truncate">
                                  {displayItems[0]?.title || 'Order Item'}
                                  {displayItems.length > 1 && (
                                    <span className="text-slate-500 font-normal"> +{displayItems.length - 1} more</span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{order.eta}</span>
                                  </span>
                                  <span>•</span>
                                  <span>{displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions on right */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenInsideOrder(order.id);
                                }}
                                className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-98"
                              >
                                <span>View Details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* TAB 2: PROFILE INFORMATION */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-lg font-bold text-navy">Personal Profile Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your identity details for billing and shipping</p>
                </div>

                {isSavedNotice && (
                  <div className="p-3 bg-[#A44101]/10 border border-[#A44101]/25 rounded-xl text-[#A44101] text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A44101]" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (India)</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                      required
                    />
                  </div>

               
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: SAVED DELIVERY ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                {showAddressForm || editingAddressId || addresses.length === 0 ? (
                  // DEDICATED EDIT / NEW ADDRESS VIEW (Exact Match to Reference Image 2)
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top Back Button */}
                    {addresses.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddressId(null);
                            setShowAddressForm(false);
                            resetAddressForm();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 group"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                          <span className="uppercase tracking-wider text-[11px]">Back to addresses</span>
                        </button>
                      </div>
                    )}

                    {/* Heading Area */}
                    <div className="space-y-1">
                      <span className="text-xs font-black uppercase tracking-widest text-[#E11D48]">
                        {editingAddressId ? 'Edit Address' : 'New Address'}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-serif sm:font-medium text-slate-900 leading-tight">
                        {editingAddressId ? 'Update your address' : 'Add delivery address'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {editingAddressId 
                          ? 'Make changes to your delivery address details.' 
                          : 'Enter your doorstep delivery address details below.'}
                      </p>
                    </div>

                    {addressFormError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        {addressFormError}
                      </div>
                    )}

                    <form onSubmit={handleSaveInlineAddress} className="space-y-6">
                      {/* Card 1: Contact Details */}
                      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">Contact</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Who should we deliver to?</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Full name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addrFullName}
                              onChange={(e) => setAddrFullName(e.target.value)}
                              placeholder="Full name"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Phone <span className="text-red-500">*</span>
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">+91</span>
                              <input
                                type="tel"
                                value={addrPhone}
                                onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="Phone number"
                                maxLength={10}
                                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy font-mono"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Delivery Location Details */}
                      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">Delivery location</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Exact doorstep details for the courier</p>
                        </div>

                        <div className="space-y-4 pt-1">
                          {/* Row 1: House / flat no. * | Building (optional) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                House / flat no. <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={addrHouseNumber}
                                onChange={(e) => setAddrHouseNumber(e.target.value)}
                                placeholder="e.g. 12 / Flat 302"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Building (optional)
                              </label>
                              <input
                                type="text"
                                value={addrBuilding}
                                onChange={(e) => setAddrBuilding(e.target.value)}
                                placeholder="e.g. Marcc Apartment / Tower A"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                              />
                            </div>
                          </div>

                          {/* Row 2: Floor (optional) | Area / locality * */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Floor (optional)
                              </label>
                              <input
                                type="text"
                                value={addrFloor}
                                onChange={(e) => setAddrFloor(e.target.value)}
                                placeholder="e.g. 4th Floor"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                                <span>Area / locality <span className="text-red-500">*</span></span>
                              </label>
                              <div className="relative flex items-center">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 absolute left-3 pointer-events-none" />
                                <input
                                  type="text"
                                  value={addrArea}
                                  onChange={(e) => setAddrArea(e.target.value)}
                                  placeholder="e.g. Dabri / Sector 15"
                                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Address line 1 * | Address line 2 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Address line 1 <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={addrAddressLine1}
                                onChange={(e) => setAddrAddressLine1(e.target.value)}
                                placeholder="e.g. Main Ring Road / Street details"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Address line 2
                              </label>
                              <input
                                type="text"
                                value={addrAddressLine2}
                                onChange={(e) => setAddrAddressLine2(e.target.value)}
                                placeholder="e.g. Lane / wing / suite"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                              />
                            </div>
                          </div>

                          {/* Row 4: Landmark (optional) | PIN code * */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Landmark (optional)
                              </label>
                              <input
                                type="text"
                                value={addrLandmark}
                                onChange={(e) => setAddrLandmark(e.target.value)}
                                placeholder="e.g. Near Metro Station / Behind Mall"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                                <span>PIN code <span className="text-red-500">*</span></span>
                                {isFetchingPincode && <Loader2 className="w-3 h-3 animate-spin text-[#A44101]" />}
                              </label>
                              <input
                                type="text"
                                value={addrPincode}
                                onChange={(e) => handleInlinePincodeChange(e.target.value)}
                                placeholder="e.g. 110045"
                                maxLength={6}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy font-mono"
                                required
                              />
                              {pincodeHint && (
                                <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                                  ✓ {pincodeHint}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 5: City / District * | State * */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                City / District <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={addrCity}
                                onChange={(e) => setAddrCity(e.target.value)}
                                placeholder="City"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                State <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={addrState}
                                onChange={(e) => setAddrState(e.target.value)}
                                placeholder="State"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                                required
                              />
                            </div>
                          </div>

                          {/* Address Type & Default Checkbox */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                            <div className="space-y-1">
                              <span className="block text-xs font-bold text-slate-700">Address Type</span>
                              <div className="flex items-center gap-2">
                                {(['Home', 'Work', 'Other'] as const).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setAddrType(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                      addrType === t
                                        ? 'bg-navy text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {t === 'Home' && <Home className="w-3.5 h-3.5" />}
                                    {t === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                                    {t === 'Other' && <Building className="w-3.5 h-3.5" />}
                                    <span>{t}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-2 sm:pt-0">
                              <input
                                type="checkbox"
                                checked={addrIsDefault}
                                onChange={(e) => setAddrIsDefault(e.target.checked)}
                                className="w-4 h-4 rounded text-navy focus:ring-navy border-slate-300 cursor-pointer"
                              />
                              <span>Set as default delivery address</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="px-7 py-3 rounded-xl bg-navy hover:bg-navy-light text-white text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 active:scale-98"
                        >
                          {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>{isSavingAddress ? 'Saving...' : (editingAddressId ? 'Update address' : 'Save address')}</span>
                        </button>
                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddressId(null);
                              setShowAddressForm(false);
                              resetAddressForm();
                            }}
                            className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-stone-50 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                ) : (
                  // SAVED ADDRESSES LIST VIEW (Card View)
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-lg font-bold text-navy">Saved Delivery Addresses</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Manage multiple shipping addresses for fast checkout</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetAddressForm();
                          setShowAddressForm(true);
                        }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer bg-[#A44101] hover:bg-[#8C3701] text-white active:scale-98"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Address</span>
                      </button>
                    </div>

                    {/* Success Notice */}
                    {addressSuccessMsg && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{addressSuccessMsg}</span>
                      </div>
                    )}

                    {/* Existing Saved Address Cards */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Your Saved Addresses ({addresses.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr) => {
                          return (
                            <div
                              key={addr.id}
                              className={`p-4 rounded-2xl border transition-all relative ${
                                addr.isDefault 
                                  ? 'border-navy bg-stone-50/70 shadow-xs' 
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200/80 text-navy flex items-center gap-1">
                                    {addr.type === 'Home' && <Home className="w-3 h-3" />}
                                    {addr.type === 'Work' && <Briefcase className="w-3 h-3" />}
                                    {addr.type === 'Other' && <Building className="w-3 h-3" />}
                                    <span>{addr.type}</span>
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded border border-[#A44101]/20">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditAddress(addr)}
                                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-navy hover:text-[#A44101] hover:bg-stone-100 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Edit Address"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-[#A44101]" />
                                    <span>Edit</span>
                                  </button>
                                  {!addr.isDefault && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetDefaultAddress(addr.id)}
                                      className="text-[11px] font-bold text-[#A44101] hover:underline cursor-pointer px-1 py-1"
                                    >
                                      Set Default
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAddress(addr.id)}
                                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                                    title="Delete Address"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h4 className="text-xs font-bold text-navy">{addr.name}</h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {addr.addressLine}, {addr.city}, {addr.state} - <span className="font-bold text-navy">{addr.pincode}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{addr.phone}</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WALLET & BABA COINS */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-navy">OfferWale Baba Coins &amp; Cashback</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Use coins during checkout for instant discounts (1 Coin = ₹1)</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-navy via-navy to-slate-900 border border-slate-800 text-white shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-[#A44101] border border-white/20">
                      <Coins className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Total Available Balance</span>
                      <h3 className="text-3xl font-black">450 <span className="text-lg font-medium text-slate-300">Baba Coins</span></h3>
                      <p className="text-xs text-slate-300 mt-0.5">Worth ₹450 flat discount on your next order</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onGoToCheckout}
                    className="px-5 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Redeem at Checkout
                  </button>
                </div>

                {/* Available Coupon Scratch Cards */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#A44101]" />
                    <span>Active Promo Vouchers For You</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded">BABA100</span>
                        <p className="text-xs font-bold text-slate-800 mt-1">₹100 Flat OFF on Orders Above ₹599</p>
                        <span className="text-[10px] text-slate-500">Expires in 12 days</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Code BABA100 copied!')}
                        className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-navy bg-slate-200 px-2 py-0.5 rounded">FREESHIP</span>
                        <p className="text-xs font-bold text-slate-800 mt-1">Free Pan-India Express Delivery</p>
                        <span className="text-[10px] text-slate-500">No minimum cart value</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Code FREESHIP copied!')}
                        className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS & SECURITY */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-lg font-bold text-navy">Account Preferences &amp; Notifications</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Control communication channels and password security</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">WhatsApp Order Tracking Updates</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Receive dispatch tracking and live delivery OTP via WhatsApp</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-navy rounded cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Flash Deal &amp; Price Drop Alerts</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Get notified when items in your wishlist go on 70%+ clearance</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-navy rounded cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Two-Factor OTP Login</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Verify via SMS OTP on each new device login</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-navy rounded cursor-pointer" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-xs"
                  >
                    {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    <span>{isLoggingOut ? 'Logging out via /auth/logout...' : 'Log Out of Account'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500">Secured with 256-bit SSL</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>




    </div>
  );
};
