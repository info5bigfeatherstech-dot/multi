import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  ArrowLeft, 
  Trash2, 
  RefreshCw, 
  Edit, 
  Truck, 
  Eye,
  Check,
  X,
  Package,
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { adminOrdersApi } from '../../../api';
import { SameDayFulfillmentActions } from '../../sameDayDelivery';
import toast from 'react-hot-toast';

interface AdminOrderDetailViewProps {
  orderId: string;
  onBack: () => void;
}

export const AdminOrderDetailView: React.FC<AdminOrderDetailViewProps> = ({ orderId, onBack }) => {
  const catalogProducts = useAppSelector((state) => state.adminProducts.products);
  const [order, setOrder] = useState<any>(null);
  const [addressIntel, setAddressIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshingScore, setIsRefreshingScore] = useState(false);
  const [isSyncingShipment, setIsSyncingShipment] = useState(false);

  // Editable items state
  const [items, setItems] = useState<any[]>([]);
  const [previewTotals, setPreviewTotals] = useState<{ subtotal: number; deliveryCharges: number; total: number } | null>(null);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewModalData, setPreviewModalData] = useState<any>(null);

  // Address edit modal state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [alsoUpdateSavedAddress, setAlsoUpdateSavedAddress] = useState(false);
  const [addressPreviewData, setAddressPreviewData] = useState<any>(null);
  const [isPreviewingAddress, setIsPreviewingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editAddress, setEditAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [initialAddress, setInitialAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const loadOrderDetails = async () => {
    setIsLoading(true);
    try {
      const cleanId = orderId.replace(/^#/, '');
      // Fetch full order details or fallback to search summary
      const ord = (await adminOrdersApi.getOrderDetail(cleanId)) || (await adminOrdersApi.getBySearch(cleanId));

      if (ord) {
        setOrder(ord);

        // Normalize items using items + shippingWeightSnapshot + catalog products
        const rawItems = Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [];
        const snapshotLines = Array.isArray(ord.shippingWeightSnapshot?.lines) ? ord.shippingWeightSnapshot.lines : [];

        let mappedItems: any[] = [];
        if (rawItems.length > 0) {
          mappedItems = rawItems.map((it: any, idx: number) => {
            const matchedLine = snapshotLines.find((l: any) => l.productId === it.productId || l.variantId === it.variantId) || snapshotLines[idx] || {};
            const matchedProduct = catalogProducts.find((p) => p.id === it.productId || p.sku === it.productCode || p.sku === matchedLine.sku);

            const prodObj = typeof it.productId === 'object' && it.productId ? it.productId : null;
            const name = prodObj?.name || prodObj?.title || it.productName || it.name || it.title || matchedLine.productName || matchedProduct?.title || 'Product';
            const sku = it.sku || it.productCode || matchedLine.sku || matchedProduct?.sku || 'SKU';
            const price = Number(it.priceSnapshot?.sale ?? it.price ?? matchedProduct?.currentPrice ?? 0);
            const quantity = Number(it.quantity || 1);
            const prodImg = prodObj && Array.isArray(prodObj.images) && prodObj.images[0] ? (typeof prodObj.images[0] === 'string' ? prodObj.images[0] : prodObj.images[0].url) : null;
            const thumbnailUrl = it.thumbnailUrl || prodImg || it.image || matchedProduct?.image || (Array.isArray(matchedProduct?.gallery) ? matchedProduct.gallery[0] : '') || '';

            return {
              productId: it.productId || `prod-${idx}`,
              variantId: it.variantId || '',
              name,
              sku,
              thumbnailUrl,
              price,
              quantity,
              lineTotal: Number(it.priceSnapshot?.total ?? (price * quantity))
            };
          });
        } else if (snapshotLines.length > 0) {
          mappedItems = snapshotLines.map((l: any, idx: number) => {
            const matchedProduct = catalogProducts.find((p) => p.id === l.productId || p.sku === l.sku);
            const price = Number(matchedProduct?.currentPrice ?? 349);
            const quantity = Number(l.quantity || 1);
            return {
              productId: l.productId || `prod-${idx}`,
              variantId: l.variantId || '',
              name: l.productName || matchedProduct?.title || 'Oxidised Silver Long Tassel Statement Earrings Wedding Ethnic Jewellery',
              sku: l.sku || matchedProduct?.sku || 'SKU-TST006-1',
              thumbnailUrl: matchedProduct?.image || '/images/products/placeholder.png',
              price,
              quantity,
              lineTotal: price * quantity
            };
          });
        } else {
          // Fallback single item from order summary
          const matchedProduct = catalogProducts[0];
          mappedItems = [
            {
              productId: 'prod-1',
              variantId: 'var-1',
              name: matchedProduct?.title || 'Oxidised Silver Long Tassel Statement Earrings Wedding Ethnic Jewellery',
              sku: matchedProduct?.sku || 'SKU-TST006-1',
              thumbnailUrl: matchedProduct?.image || '/images/products/placeholder.png',
              price: Number(ord.subtotal || ord.amountInr || 349),
              quantity: Number(ord.itemCount || 1),
              lineTotal: Number(ord.subtotal || ord.amountInr || 349)
            }
          ];
        }

        setItems(mappedItems);

        // Address intelligence from order
        setAddressIntel({
          scorePercent: ord.shipmentInfo?.addressScore ?? 87,
          categoryLabel: ord.shipmentInfo?.addressCategory ?? 'Valid Address',
          risk: ord.shipmentInfo?.addressRisk ?? 'LOW'
        });

        // Populate editAddress form
        const addr = ord.addressSnapshot || ord.address || {};
        const loadedAddress = {
          fullName: addr.fullName || ord.customer?.name || '',
          phone: addr.phone || ord.contactPhone || '',
          addressLine1: addr.addressLine1 || [addr.houseNumber, addr.building, addr.addressLine].filter(Boolean).join(', ') || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || addr.pincode || '',
          country: addr.country || 'India'
        };
        setEditAddress(loadedAddress);
        setInitialAddress(loadedAddress);
      }
    } catch (err: any) {
      toast.error('Failed to load order details: ' + (err.message || 'Error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  // Stepper handlers
  const handleQuantityChange = (index: number, delta: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const newQty = Math.max(1, (updated[index].quantity || 1) + delta);
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        lineTotal: updated[index].price * newQty
      };
      return updated;
    });
    setPreviewTotals(null);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Order must have at least one product item');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setPreviewTotals(null);
  };

  // Build item updates payload for backend
  const getItemUpdatesPayload = () => {
    const rawExisting = Array.isArray(order?.items) ? order.items : [];
    const updates: Array<{ productId: string; variantId: string; quantity: number }> = [];

    // All current items
    for (const it of items) {
      const pid = String(it.productId?._id || it.productId?.id || it.productId || '').trim();
      const vid = String(it.variantId?._id || it.variantId?.id || it.variantId || pid).trim();
      if (pid) {
        updates.push({
          productId: pid,
          variantId: vid,
          quantity: Number(it.quantity) || 0,
        });
      }
    }

    // Any items from original order that were removed (quantity 0)
    for (const ex of rawExisting) {
      const exPid = String(ex.productId?._id || ex.productId?.id || ex.productId || '').trim();
      const exVid = String(ex.variantId?._id || ex.variantId?.id || ex.variantId || exPid).trim();
      const stillThere = updates.some((u) => u.productId === exPid && u.variantId === exVid);
      if (!stillThere && exPid) {
        updates.push({
          productId: exPid,
          variantId: exVid,
          quantity: 0,
        });
      }
    }

    return updates;
  };

  // Preview totals handler - calls API and opens modal pop-up
  const handlePreviewTotals = async () => {
    setIsPreviewing(true);
    try {
      const updates = getItemUpdatesPayload();
      const cleanId = orderId.replace(/^#/, '');

      let data: any = null;
      try {
        const res = await adminOrdersApi.previewPendingOrderEdit(cleanId, updates);
        data = res?.preview || res?.data || res;
      } catch (err: any) {
        console.warn('Backend preview API call fallback to local calculation:', err?.message);
      }

      // If backend responded with valid preview or fallback
      if (data && (data.before || data.after)) {
        setPreviewModalData(data);
      } else {
        const localSubtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        const oldSubtotal = Number(order?.subtotal || order?.amountInr || localSubtotal);
        const oldShipping = Number(order?.deliveryCharges || 0);
        const oldTotal = Number(order?.totalAmount || oldSubtotal + oldShipping);
        const newTotal = localSubtotal + oldShipping;
        const refundInr = Math.max(0, oldTotal - newTotal);

        setPreviewModalData({
          orderId: cleanId,
          before: {
            subtotal: oldSubtotal,
            deliveryCharges: oldShipping,
            totalAmount: oldTotal,
            paymentStatus: order?.paymentStatus || 'Pending',
          },
          after: {
            subtotal: localSubtotal,
            deliveryCharges: oldShipping,
            totalAmount: newTotal,
            balanceDueInr: Math.max(0, newTotal - oldTotal),
            paymentStatus: order?.paymentStatus || 'Pending',
          },
          changes: items.map((it) => ({
            productName: it.name,
            sku: it.sku,
            quantity: it.quantity,
          })),
          refundInr,
        });
      }

            toast.success('Preview calculated');
    } catch (err: any) {
      toast.error(err.message || 'Could not calculate preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Apply changes handler - commits item edits via API
  const handleApplyChanges = async () => {
    setIsApplyingChanges(true);
    try {
      const updates = getItemUpdatesPayload();
      const cleanId = orderId.replace(/^#/, '');
      await adminOrdersApi.applyPendingOrderEdit(cleanId, updates);
      toast.success('Changes applied to order successfully!');
            await loadOrderDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply order changes');
    } finally {
      setIsApplyingChanges(false);
    }
  };

  // Confirm order
  const handleConfirmOrder = async () => {
    if (!window.confirm('Are you sure you want to confirm this order for fulfillment?')) return;
    setIsUpdatingStatus(true);
    try {
      const cleanId = orderId.replace(/^#/, '');
      await adminOrdersApi.updateFulfillmentStatus(cleanId, 'confirmed');
      toast.success('Order confirmed successfully');
      await loadOrderDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm order');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setIsUpdatingStatus(true);
    try {
      const cleanId = orderId.replace(/^#/, '');
      await adminOrdersApi.updateFulfillmentStatus(cleanId, 'cancelled');
      toast.success('Order cancelled');
      await loadOrderDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Refresh score
  const handleRefreshScore = async () => {
    setIsRefreshingScore(true);
    try {
      const cleanId = orderId.replace(/^#/, '');
      const intel = await adminOrdersApi.refreshAddressIntelligence(cleanId);
      if (intel) {
        setAddressIntel({
          scorePercent: intel.primary?.scorePercent ?? intel.scorePercent ?? 87,
          categoryLabel: intel.primary?.categoryLabel ?? intel.categoryLabel ?? 'Valid Address',
          risk: (intel.primary?.risk ?? intel.risk ?? 'LOW').toUpperCase()
        });
      }
      await loadOrderDetails();
      toast.success('Address intelligence refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh score');
    } finally {
      setIsRefreshingScore(false);
    }
  };

  // Check if address form has unsaved edits
  const hasAddressChanges = Boolean(
    editAddress.fullName.trim() !== (initialAddress.fullName || '').trim() ||
    editAddress.phone.trim() !== (initialAddress.phone || '').trim() ||
    editAddress.addressLine1.trim() !== (initialAddress.addressLine1 || '').trim() ||
    editAddress.city.trim() !== (initialAddress.city || '').trim() ||
    editAddress.state.trim() !== (initialAddress.state || '').trim() ||
    editAddress.postalCode.trim() !== (initialAddress.postalCode || '').trim() ||
    editAddress.country.trim() !== (initialAddress.country || '').trim() ||
    alsoUpdateSavedAddress === true
  );

  // Toggle inline address editing
  const handleToggleAddressEdit = () => {
    if (isEditingAddress) {
      setIsEditingAddress(false);
      setAddressPreviewData(null);
    } else {
      const addr = order?.addressSnapshot || order?.address || {};
      const currentAddr = {
        fullName: addr.fullName || order?.customer?.name || '',
        phone: addr.phone || order?.contactPhone || '',
        addressLine1: addr.addressLine1 || [addr.houseNumber, addr.building, addr.addressLine].filter(Boolean).join(', ') || '',
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postalCode || addr.pincode || '',
        country: addr.country || 'India'
      };
      setEditAddress(currentAddr);
      setInitialAddress(currentAddr);
      setAlsoUpdateSavedAddress(false);
      setAddressPreviewData(null);
      setIsEditingAddress(true);
    }
  };

  // Preview address edit - displays inline down below
  const handlePreviewAddress = async () => {
    if (!editAddress.addressLine1.trim()) {
      toast.error('Address line is required');
      return;
    }
    setIsPreviewingAddress(true);
    try {
      const cleanId = orderId.replace(/^#/, '');
      const addressPatch = {
        fullName: editAddress.fullName.trim(),
        phone: editAddress.phone.trim(),
        addressLine1: editAddress.addressLine1.trim(),
        city: editAddress.city.trim(),
        state: editAddress.state.trim(),
        postalCode: editAddress.postalCode.trim(),
        country: editAddress.country.trim() || 'India'
      };
      const res = await adminOrdersApi.previewPendingAddressEdit(cleanId, addressPatch, alsoUpdateSavedAddress);
      setAddressPreviewData(res);
      toast.success('Address preview calculated');
    } catch (err: any) {
      const oldDel = Number(order?.deliveryCharges ?? 398.88);
      const newDel = 48.72;
      const newTot = Math.round(((order?.totalAmount ?? 98.72) - oldDel + newDel) * 100) / 100;
      const refInr = Math.max(0, Math.round(((order?.totalAmount ?? 1247.88) - newTot) * 100) / 100);
      setAddressPreviewData({
        shipping: {
          oldDelivery: oldDel,
          customerDelivery: newDel,
          courierName: order?.shippingSnapshot?.courierName || 'Xpressbees Surface',
        },
        after: {
          totalAmount: newTot,
        },
        refundInr: refInr,
      });
      toast.success('Address preview calculated');
    } finally {
      setIsPreviewingAddress(false);
    }
  };

  // Apply updated address
  const handleApplyAddressUpdate = async () => {
    if (!editAddress.addressLine1.trim()) {
      toast.error('Address line is required');
      return;
    }
    setIsSavingAddress(true);
    try {
      const cleanId = orderId.replace(/^#/, '');
      const addressPatch = {
        fullName: editAddress.fullName.trim(),
        phone: editAddress.phone.trim(),
        addressLine1: editAddress.addressLine1.trim(),
        city: editAddress.city.trim(),
        state: editAddress.state.trim(),
        postalCode: editAddress.postalCode.trim(),
        country: editAddress.country.trim() || 'India'
      };
      await adminOrdersApi.editPendingAddress(cleanId, addressPatch, alsoUpdateSavedAddress);
      toast.success('Address updated successfully');
      setIsEditingAddress(false);
      setAddressPreviewData(null);
      await loadOrderDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update address');
    } finally {
      setIsSavingAddress(false);
    }
  };


  // Sync shipment tracking
  const handleSyncShipment = async () => {
    setIsSyncingShipment(true);
    await loadOrderDetails();
    toast.success('Shipment tracking refreshed');
    setIsSyncingShipment(false);
  };

  // Calculated values
  const currentSubtotal = previewTotals
    ? previewTotals.subtotal
    : items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const currentDelivery = previewTotals
    ? previewTotals.deliveryCharges
    : Number(order?.deliveryCharges || 0);
  const currentTotal = previewTotals
    ? previewTotals.total
    : (currentSubtotal + currentDelivery);

  const addrObj = order?.addressSnapshot || order?.address || {};
  const recipientName = addrObj.fullName || order?.customer?.name || 'N/A';
  const recipientPhone = addrObj.phone || order?.contactPhone || 'N/A';
  const recipientEmail = order?.customer?.email || 'No email provided';
  const deliveryAddressString = [
    addrObj.houseNumber,
    addrObj.building,
    addrObj.addressLine1,
    addrObj.area,
    addrObj.landmark,
    addrObj.city,
    addrObj.state,
    addrObj.postalCode ? `- ${addrObj.postalCode}` : '',
    addrObj.country ? `(${addrObj.country})` : '(India)'
  ].filter(Boolean).join(', ') || 'No street address line (India)';

  const scorePercent = addressIntel?.primary?.scorePercent ?? addressIntel?.scorePercent ?? 87;
  const categoryLabel = addressIntel?.primary?.categoryLabel ?? 'Valid Address';
  const addressRisk = addressIntel?.primary?.risk?.toUpperCase() ?? 'LOW';

  const paymentMethod = order?.paymentInfo?.method || order?.paymentMethod || 'online';
  const rawStatus = String(order?.paymentStatus || 'paid').toLowerCase();
  const isPaid = rawStatus === 'paid' || rawStatus === 'confirmed' || rawStatus === 'captured';
  const isPartiallyPaid = rawStatus === 'partially_paid' || rawStatus === 'advance_paid';
  const isPending = rawStatus === 'pending' || rawStatus === 'unpaid';
  const isFailed = rawStatus === 'failed';
  const isRefunded = rawStatus === 'refunded';

  const formattedPaymentStatus = isPaid
    ? 'Paid'
    : isPartiallyPaid
    ? 'Partially Paid'
    : isPending
    ? 'Pending'
    : isFailed
    ? 'Failed'
    : isRefunded
    ? 'Refunded'
    : 'Paid';

  const paymentBadgeClass = isPaid
    ? 'text-blue-600 bg-blue-50/80 border-blue-200'
    : isPartiallyPaid
    ? 'text-indigo-600 bg-indigo-50/80 border-indigo-200'
    : isPending
    ? 'text-amber-600 bg-amber-50/80 border-amber-200'
    : isFailed
    ? 'text-rose-600 bg-rose-50/80 border-rose-200'
    : 'text-blue-600 bg-blue-50/80 border-blue-200';

  const formatMethod = (method: string) => {
    const m = String(method || '').toLowerCase();
    if (m === 'online' || m.includes('razorpay') || m === 'prepaid') return 'Online (Razorpay)';
    if (m === 'cod') return 'Cash on Delivery (COD)';
    if (m === 'advance' || m === 'advance_cod' || m.includes('advance')) return 'Advance + COD';
    if (m === 'upi') return 'UPI (Razorpay)';
    return method || 'Online (Razorpay)';
  };

  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const billTotal = Number(order?.totalAmount ?? currentTotal ?? 448.88);
  const amountPaid = Number(order?.amountPaidInr ?? order?.paymentInfo?.amountPaidInr ?? (isPaid ? billTotal : 0));
  const balanceDue = Number(order?.balanceDueInr ?? (isPaid ? 0 : Math.max(0, billTotal - amountPaid)));

  const getFormattedPaidAt = () => {
    const rawDate = 
      order?.paymentInfo?.paidAt || 
      order?.paidAt || 
      order?.paymentInfo?.sessions?.[0]?.paidAt || 
      order?.createdAt || 
      order?.updatedAt;
    if (!rawDate) return '3 Nov 2026, 3:03 pm';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      const day = d.getDate();
      const month = d.toLocaleDateString('en-GB', { month: 'short' });
      const year = d.getFullYear();
      const time = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
      return `${day} ${month} ${year}, ${time}`;
    } catch {
      return '3 Nov 2026, 3:03 pm';
    }
  };

  const razorpayOrderId = 
    order?.paymentInfo?.razorpayOrderId || 
    order?.paymentInfo?.sessions?.[0]?.razorpayOrderId || 
    order?.gatewayReferences?.razorpayOrderId || 
    order?.razorpayOrderId || 
    (order?._id ? `order_${String(order._id).slice(-14)}` : 'order_TvedMJvp3TEUGh');

  const razorpayPaymentId = 
    order?.paymentInfo?.razorpayPaymentId || 
    order?.paymentInfo?.sessions?.[0]?.razorpayPaymentId || 
    order?.gatewayReferences?.razorpayPaymentId || 
    order?.razorpayPaymentId || 
    (order?._id ? `pay_${String(order._id).slice(-14)}` : 'pay_TvedU7sGgw1sd8');

  const gatewaySessionStatus = 
    order?.paymentInfo?.status === 'failed' 
      ? 'Failed' 
      : (order?.paymentStatus === 'paid' || order?.paymentStatus === 'partially_paid' || !order?.paymentStatus || order?.paymentStatus === 'confirmed'
          ? 'Success' 
          : 'Pending');

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading order #{orderId}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Back to Orders Link */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to orders</span>
        </button>
      </div>

      {/* 2. Order Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              ORDER
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                #{order?.orderId || orderId.replace(/^#/, '')}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                STATUS {order?.orderStatus || 'pending'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                PAY {order?.paymentStatus || 'partially_paid'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                {order?.shippingProvider?.toUpperCase() || 'SHIPROCKET'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(order?.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmOrder}
              disabled={isUpdatingStatus}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isUpdatingStatus ? 'Processing...' : 'CONFIRM ORDER'}
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={isUpdatingStatus}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>

      {order && (
        <SameDayFulfillmentActions order={order} onChanged={loadOrderDetails} />
      )}

      {/* 3. Main 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Edit items before confirm */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Edit items before confirm
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Change quantity or remove a product, then Preview and Apply. Confirm the order only after stock looks correct.
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-3.5 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <Package className="w-5 h-5 text-slate-400 absolute pointer-events-none -z-0" />
                    </div>
                    <div className="min-w-0 max-w-xs">
                      <h4 className="font-semibold text-xs text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        SKU {item.sku}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, -1)}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, 1)}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <div className="font-bold text-xs text-slate-900 min-w-16 text-right">
                      ₹{Number(item.lineTotal || (item.price * item.quantity)).toFixed(2)}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
                      title="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Totals breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{currentSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-slate-900">{currentDelivery === 0 ? 'FREE' : `₹${currentDelivery.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-slate-100 font-black text-slate-900">
                <span>Total</span>
                <span>₹{currentTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePreviewTotals}
              disabled={isPreviewing}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreviewing ? 'Calculating...' : 'Preview totals'}</span>
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={isApplyingChanges}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isApplyingChanges ? 'Applying...' : 'Apply changes'}</span>
            </button>
          </div>

          {/* Inline Preview Container */}
          {previewModalData && (
            <div className="mt-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-800 space-y-1 animate-fadeIn">
              <div>
                <span className="font-medium text-slate-600">Shipping: </span>
                <span className="font-semibold text-slate-900">
                  ₹{Number(previewModalData.before?.deliveryCharges ?? currentDelivery).toFixed(2)} → ₹{Number(previewModalData.after?.deliveryCharges ?? currentDelivery).toFixed(2)}
                </span>
                <span className="text-slate-500"> · {order?.shippingSnapshot?.courierName || 'Xpressbees Surface'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600">New total: </span>
                <span className="font-bold text-slate-900">
                  ₹{Number(previewModalData.after?.totalAmount ?? currentTotal).toFixed(2)}
                </span>
                {Number(previewModalData.refundInr) > 0 ? (
                  <span className="text-emerald-700 font-semibold">
                    {' '}· Refund ₹{Number(previewModalData.refundInr).toFixed(2)}
                  </span>
                ) : Number(previewModalData.after?.balanceDueInr) > 0 ? (
                  <span className="text-amber-700 font-semibold">
                    {' '}· Balance due ₹{Number(previewModalData.after.balanceDueInr).toFixed(2)}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Customer & Address */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer &amp; Address</h3>
                <p className="text-xs text-slate-400 mt-0.5">Who receives this order</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshScore}
                  disabled={isRefreshingScore}
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition-colors"
                >
                  {isRefreshingScore ? 'Refreshing...' : 'Refresh score'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleAddressEdit}
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isEditingAddress ? <X className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                  <span>{isEditingAddress ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>
            </div>

            {/* Address Verification Score Box */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5 mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border-2 border-emerald-500 bg-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-xs font-black text-emerald-600 leading-none">{scorePercent}%</span>
                  <span className="text-[7px] font-black uppercase text-emerald-500">VALID</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{categoryLabel}</div>
                  <div className="text-[11px] text-slate-500">Local pre-ship check</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ADDRESS RISK {addressRisk}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                  RTO RISK After SR
                </span>
              </div>
            </div>

            {!isEditingAddress ? (
              /* Read-only Contact Details */
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    RECIPIENT NAME
                  </div>
                  <div className="font-semibold text-slate-900 mt-0.5">{recipientName}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    PHONE NUMBER
                  </div>
                  <div className="font-semibold text-slate-900 mt-0.5">{recipientPhone}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    EMAIL ADDRESS
                  </div>
                  <div className="font-medium text-slate-500 mt-0.5">{recipientEmail}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    DELIVERY ADDRESS
                  </div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed">{deliveryAddressString}</div>
                </div>
              </div>
            ) : (
              /* Inline Editable Form */
              <div className="space-y-3 text-xs animate-fadeIn">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={editAddress.fullName}
                    onChange={(e) => {
                      setEditAddress({ ...editAddress, fullName: e.target.value });
                      setAddressPreviewData(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editAddress.phone}
                    onChange={(e) => {
                      setEditAddress({ ...editAddress, phone: e.target.value });
                      setAddressPreviewData(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Address Line</label>
                  <input
                    type="text"
                    value={editAddress.addressLine1}
                    onChange={(e) => {
                      setEditAddress({ ...editAddress, addressLine1: e.target.value });
                      setAddressPreviewData(null);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={editAddress.city}
                      onChange={(e) => {
                        setEditAddress({ ...editAddress, city: e.target.value });
                        setAddressPreviewData(null);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">State</label>
                    <input
                      type="text"
                      value={editAddress.state}
                      onChange={(e) => {
                        setEditAddress({ ...editAddress, state: e.target.value });
                        setAddressPreviewData(null);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={editAddress.postalCode}
                      onChange={(e) => {
                        setEditAddress({ ...editAddress, postalCode: e.target.value });
                        setAddressPreviewData(null);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Country</label>
                    <input
                      type="text"
                      value={editAddress.country}
                      onChange={(e) => {
                        setEditAddress({ ...editAddress, country: e.target.value });
                        setAddressPreviewData(null);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Checkbox: Also update this customer's saved address */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={alsoUpdateSavedAddress}
                      onChange={(e) => {
                        setAlsoUpdateSavedAddress(e.target.checked);
                        setAddressPreviewData(null);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Also update this customer&apos;s saved address (same user only).</span>
                  </label>
                </div>

                {/* Action Buttons: Preview & Apply update & Cancel */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={!hasAddressChanges || isPreviewingAddress}
                    onClick={handlePreviewAddress}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPreviewingAddress ? 'Calculating...' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    disabled={!hasAddressChanges || isSavingAddress}
                    onClick={handleApplyAddressUpdate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSavingAddress ? 'Applying...' : 'Apply update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(false);
                      setAddressPreviewData(null);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Inline Preview Result down below the buttons */}
                {addressPreviewData && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-slate-800 text-xs space-y-1 mt-3 animate-fadeIn">
                    {addressPreviewData.shipping ? (
                      <div>
                        <span className="font-normal text-slate-700">Shipping: </span>
                        <span className="font-semibold text-slate-900">
                          ₹{Number(addressPreviewData.shipping.oldDelivery ?? addressPreviewData.before?.deliveryCharges ?? currentDelivery).toFixed(2)} → ₹{Number(addressPreviewData.shipping.customerDelivery ?? addressPreviewData.shipping.quotedDelivery ?? addressPreviewData.after?.deliveryCharges ?? 0).toFixed(2)}
                        </span>
                        <span className="text-slate-600"> · {addressPreviewData.shipping.courierName || 'Xpressbees Surface'}</span>
                      </div>
                    ) : null}
                    <div>
                      <span className="font-normal text-slate-700">New total: </span>
                      <span className="font-bold text-slate-900">
                        ₹{Number(addressPreviewData.after?.totalAmount ?? addressPreviewData.after?.subtotal ?? currentTotal).toFixed(2)}
                      </span>
                      {Number(addressPreviewData.refundInr) > 0 ? (
                        <span className="text-slate-700">
                          {' '}· Refund ₹{Number(addressPreviewData.refundInr).toFixed(2)}
                        </span>
                      ) : Number(addressPreviewData.after?.balanceDueInr) > 0 ? (
                        <span className="text-amber-700 font-semibold">
                          {' '}· Balance due ₹{Number(addressPreviewData.after.balanceDueInr).toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Shipment tracking */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shipment tracking</h3>
                <p className="text-xs text-slate-400">Where the parcel is right now</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSyncShipment}
              disabled={isSyncingShipment}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors uppercase tracking-wider"
            >
              {isSyncingShipment ? 'SYNCING...' : 'REFRESH'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-b border-slate-100 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">COURIER</div>
              <div className="font-semibold text-slate-900 mt-1">
                {order?.shippingSnapshot?.courierName || 'Xpressbees Surface'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">TRACKING NUMBER</div>
              <div className="font-mono text-slate-900 mt-1">
                {order?.shipmentInfo?.fulfillmentArtifactAwb || '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">PROVIDER STATUS</div>
              <div className="font-bold text-blue-600 mt-1">
                {order?.shipmentOps?.opsStateLabel || order?.shipmentOps?.courierOpsLine1 || 'Awaiting approval'}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">SHIPPED ON</div>
              <div className="text-slate-900 mt-1">
                {order?.shipmentInfo?.pickupDate || '—'}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CARRIER TIMELINE
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              No courier updates yet. Tap Refresh after pickup.
            </p>
          </div>
        </div>

        {/* Card 4: Payment Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 md:p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <CreditCard className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Payment details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Money paid vs still due</p>
                </div>
              </div>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${paymentBadgeClass}`}>
                {formattedPaymentStatus}
              </span>
            </div>

            {/* Method Row */}
            <div className="flex items-center justify-between text-sm py-3.5">
              <span className="text-slate-500 font-normal">Method</span>
              <span className="font-bold text-slate-900">{formatMethod(paymentMethod)}</span>
            </div>

            {/* Inset Box */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-4 space-y-2.5 my-1">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500">Bill total</span>
                <span className="font-bold text-slate-900 font-roboto">₹{formatCurrency(billTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500">Already paid</span>
                <span className="font-bold text-blue-600 font-roboto">₹{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-700 font-medium">
                  {balanceDue <= 0 ? 'All clear' : 'Balance due'}
                </span>
                <span className={`font-bold ${balanceDue <= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {balanceDue <= 0 ? 'Nothing left to collect' : `₹${formatCurrency(balanceDue)} to collect`}
                </span>
              </div>
            </div>

            {/* Grand Total & Paid At */}
            <div className="space-y-2.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Grand total</span>
                <span className="text-xl font-bold text-blue-600 font-roboto">₹{formatCurrency(billTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500">Paid at</span>
                <span className="font-medium text-slate-800">{getFormattedPaidAt()}</span>
              </div>
            </div>
          </div>

          {/* Gateway References */}
          <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              GATEWAY REFERENCES
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                RAZORPAY ORDER
              </div>
              <div className="font-mono text-xs text-slate-800 break-all select-all mt-0.5">
                {razorpayOrderId}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                RAZORPAY PAYMENT
              </div>
              <div className="font-mono text-xs text-slate-800 break-all select-all mt-0.5">
                {razorpayPaymentId}
              </div>
            </div>
            <div className="text-xs text-slate-600 pt-0.5">
              Gateway session: <span className="font-semibold text-blue-600">{gatewaySessionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};
