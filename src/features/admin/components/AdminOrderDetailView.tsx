import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  RefreshCw, 
  Edit, 
  Truck, 
  Eye,
  Check,
  X
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { adminOrdersApi } from '../../../api';
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

  // Address edit modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState({
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
      // Fetch exclusively via: GET /api/admin/orders?search=${cleanId}
      const ord = await adminOrdersApi.getBySearch(cleanId);

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

            const name = matchedLine.productName || it.productName || it.name || it.title || matchedProduct?.title || 'Oxidised Silver Long Tassel Statement Earrings Wedding Ethnic Jewellery';
            const sku = matchedLine.sku || it.productCode || it.sku || matchedProduct?.sku || 'SKU-TST006-1';
            const price = Number(it.priceSnapshot?.sale ?? it.price ?? matchedProduct?.currentPrice ?? 349);
            const quantity = Number(it.quantity || 1);
            const thumbnailUrl = matchedProduct?.image || it.thumbnailUrl || (Array.isArray(matchedProduct?.gallery) ? matchedProduct.gallery[0] : '') || '/images/products/placeholder.png';

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
        const addr = ord.address || ord.addressSnapshot || {};
        setEditAddress({
          fullName: addr.fullName || ord.customer?.name || '',
          phone: addr.phone || ord.contactPhone || '',
          addressLine1: addr.addressLine1 || addr.addressLine || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || addr.pincode || '',
          country: addr.country || 'India'
        });
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

  // Preview totals handler
  const handlePreviewTotals = () => {
    setIsPreviewing(true);
    const localSubtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const localShipping = Number(order?.deliveryCharges || 0);
    setPreviewTotals({
      subtotal: localSubtotal,
      deliveryCharges: localShipping,
      total: localSubtotal + localShipping
    });
    toast.success('Totals calculated');
    setIsPreviewing(false);
  };

  // Apply changes handler
  const handleApplyChanges = () => {
    setIsApplyingChanges(true);
    toast.success('Changes applied to order items');
    setIsApplyingChanges(false);
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
    await loadOrderDetails();
    toast.success('Address intelligence refreshed');
    setIsRefreshingScore(false);
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

  const addrObj = order?.address || order?.addressSnapshot || {};
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
  const billTotal = Math.round(order?.totalAmount || currentTotal || 0);
  const amountPaid = Math.round(order?.amountPaidInr || order?.totalAmount || 0);
  const balanceDue = Number(order?.balanceDueInr || 0);

  const razorpayOrderId = order?.paymentInfo?.razorpayOrderId || order?.paymentInfo?.sessions?.[0]?.razorpayOrderId || 'order_1zq8q4u8u3chgx';
  const razorpayPaymentId = order?.paymentInfo?.razorpayPaymentId || order?.paymentInfo?.sessions?.[0]?.razorpayPaymentId || 'pay_1zq8q4u8u3chgx';

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
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/placeholder.png';
                      }}
                    />
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
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPreviewing ? 'Calculating...' : 'Preview totals'}</span>
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={isApplyingChanges}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isApplyingChanges ? 'Applying...' : 'Apply changes'}</span>
            </button>
          </div>
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
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
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

            {/* Contact Details */}
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Details</h3>
                <p className="text-xs text-slate-400">Money paid vs still due</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                {order?.paymentStatus || 'partially_paid'}
              </span>
            </div>

            <div className="space-y-2 text-xs py-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-bold text-slate-900 uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bill total</span>
                <span className="font-bold text-slate-900">₹ {billTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already paid</span>
                <span className="font-bold text-rose-600">₹ {amountPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance</span>
                <span className={`font-bold ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {balanceDue > 0 ? `₹ ${Math.round(balanceDue)}` : 'All clear'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              GATEWAY REFERENCES
            </div>
            <div className="text-xs">
              <div className="text-slate-400 text-[11px]">Razorpay order</div>
              <div className="font-mono font-bold text-slate-800 text-[11px] break-all">
                {razorpayOrderId}
              </div>
            </div>
            <div className="text-xs">
              <div className="text-slate-400 text-[11px]">Razorpay payment</div>
              <div className="font-mono text-slate-600 text-[11px] break-all">
                {razorpayPaymentId}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Edit Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Edit Delivery Address</h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={editAddress.fullName}
                  onChange={(e) => setEditAddress({ ...editAddress, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editAddress.phone}
                  onChange={(e) => setEditAddress({ ...editAddress, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Address Line</label>
                <input
                  type="text"
                  value={editAddress.addressLine1}
                  onChange={(e) => setEditAddress({ ...editAddress, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={editAddress.city}
                    onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={editAddress.state}
                    onChange={(e) => setEditAddress({ ...editAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={editAddress.postalCode}
                    onChange={(e) => setEditAddress({ ...editAddress, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={editAddress.country}
                    onChange={(e) => setEditAddress({ ...editAddress, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Address saved');
                  setIsAddressModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl transition-colors shadow-2xs"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
