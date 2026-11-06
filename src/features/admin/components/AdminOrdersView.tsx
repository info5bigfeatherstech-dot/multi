import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, 
  ShoppingBag, 
  RefreshCw,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { mockAdminStore, OrderStatus, AdminOrder } from '../mockAdminStore';
import { adminOrdersApi } from '../../../api';
import { AdminOrderDetailView } from './AdminOrderDetailView';

interface AdminOrdersViewProps {
  initialStatusFilter?: string;
  shippingSpeedScope?: 'standard' | 'same_day' | 'all';
}

const ORDER_STATUS_TABS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Ready to Ship',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'RTO'
];

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  initialStatusFilter = 'Pending',
  shippingSpeedScope = 'standard',
}) => {
  const [activeTab, setActiveTab] = useState<OrderStatus>(() => {
    if (initialStatusFilter && initialStatusFilter !== 'All') {
      return initialStatusFilter as OrderStatus;
    }
    return 'Pending';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>(() => {
    if (shippingSpeedScope === 'same_day') return [];
    return mockAdminStore.getOrders();
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'RTO') {
        const rtoRes = await adminOrdersApi.getRtoOrders();
        const rtoList = rtoRes.orders || rtoRes.data || (Array.isArray(rtoRes) ? rtoRes : []);
        if (Array.isArray(rtoList)) {
          if (rtoList.length === 0) {
            setOrders([]);
            return;
          }
          const mapped: AdminOrder[] = rtoList.map((ord: any) => ({
            id: ord.orderId || ord._id || String(Math.random()),
            orderNumber: ord.orderIdDisplay || ord.orderId || '#RTO-LIVE',
            customerName: ord.shippingAddress?.fullName || ord.customerName || (ord.contactPhone ? `Customer (${ord.contactPhone})` : 'Shopper'),
            customerPhone: ord.contactPhone || ord.shippingAddress?.phone || (ord.shippingAddress && typeof ord.shippingAddress === 'object' ? ord.shippingAddress.phone : '') || '—',
            customerEmail: ord.customerEmail || 'customer@store.com',
            items: (ord.items || []).map((it: any, idx: number) => ({
              id: it.productId || `item-${idx}`,
              productId: it.productId || 'item-1',
              productTitle: it.productTitle || it.title || ord.orderIdDisplay || 'RTO Items',
              sku: it.sku || 'SKU-RTO',
              price: it.price || it.unitPrice || 299,
              quantity: it.quantity || 1,
              image: it.image || '/images/products/placeholder.png',
            })),
            totalAmount: Math.round(ord.amountInr || ord.totalAmount || 0),
            subtotal: Math.round(ord.subtotalInr || ord.amountInr || ord.totalAmount || 0),
            discount: Math.round(ord.discountInr || 0),
            paymentMethod: (ord.paymentMethod === 'online' ? 'UPI' : (ord.paymentMethod === 'cod' ? 'COD' : 'UPI')) as any,
            paymentStatus: ord.paymentStatus === 'paid' ? 'Paid' : 'Pending',
            status: 'RTO',
            isGiftOrder: false,
            shippingAddress: typeof ord.shippingAddress === 'string' ? ord.shippingAddress : (
              ord.shippingAddress?.addressLine1 ? `${ord.shippingAddress.addressLine1}, ${ord.shippingAddress.city || ''}` : 'India'
            ),
            courier: ord.courier || ord.shippingSnapshot?.courierName || ord.shipmentInfo?.courier || null,
            courierOpsLine1: ord.courierOpsLine1 || ord.shipmentOps?.courierOpsLine1 || null,
            courierOpsLine2: ord.courierOpsLine2 || ord.shipmentOps?.courierOpsLine2 || null,
            awbCode: ord.awbCode || ord.shipmentInfo?.awbCode || ord.shipmentInfo?.trackingNumber || ord.tracking?.awb || null,
            shippingProvider: ord.shippingProvider || ord.shippingSnapshot?.provider || null,
            providerStatus: ord.providerStatus || ord.shipmentInfo?.providerStatus || null,
            opsState: ord.opsState || ord.shipmentOps?.opsState || null,
            opsStateLabel: ord.opsStateLabel || ord.shipmentOps?.opsStateLabel || null,
            rawOrder: ord,
            createdAt: ord.createdAt || new Date().toISOString(),
            updatedAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
          }));
          setOrders(mapped);
          return;
        }
      }

      const res = await adminOrdersApi.getAll({
        status: activeTab.toLowerCase(),
        search: searchQuery.trim() || undefined,
        shippingSpeedScope,
      });

      const rawOrders = res.orders || res.data?.orders || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(rawOrders)) {
        if (rawOrders.length === 0) {
          setOrders([]);
        } else {
        const mapped: AdminOrder[] = rawOrders.map((ord: any) => ({
          id: ord.orderId || ord._id || String(Math.random()),
          orderNumber: ord.orderIdDisplay || ord.orderId || '#ORD-LIVE',
          customerName: ord.shippingAddress?.fullName || ord.customerName || (ord.contactPhone ? `Customer (${ord.contactPhone})` : 'Indian Shopper'),
          customerPhone: ord.contactPhone || ord.shippingAddress?.phone || (ord.shippingAddress && typeof ord.shippingAddress === 'object' ? ord.shippingAddress.phone : '') || '—',
          customerEmail: ord.customerEmail || 'customer@store.com',
          items: (ord.items || []).map((it: any, idx: number) => ({
            id: it.productId || `item-${idx}`,
            productId: it.productId || 'item-1',
            productTitle: it.productTitle || it.title || ord.orderIdDisplay || 'Order Item',
            sku: it.sku || 'SKU-LIVE',
            price: it.price || it.unitPrice || 299,
            quantity: it.quantity || 1,
            image: it.image || '/images/products/placeholder.png',
          })),
          totalAmount: Math.round(ord.amountInr || ord.totalAmount || 0),
          subtotal: Math.round(ord.subtotalInr || ord.amountInr || ord.totalAmount || 0),
          discount: Math.round(ord.discountInr || 0),
          paymentMethod: (
            ord.paymentStatus === 'partially_paid' || ord.paymentInfo?.splitMode === 'advance'
              ? 'Advance + COD'
              : ord.paymentMethod === 'cod'
              ? 'COD'
              : 'UPI'
          ) as any,
          paymentStatus: (
            ord.paymentStatus === 'paid'
              ? 'Paid'
              : ord.paymentStatus === 'partially_paid'
              ? 'Advance Paid'
              : ord.paymentStatus === 'failed'
              ? 'Failed'
              : 'Pending'
          ) as any,
          status: (
            ord.orderStatus === 'confirmed' ? 'Confirmed' :
            ord.orderStatus === 'ready_to_ship' ? 'Ready to Ship' :
            ord.orderStatus === 'processing' ? 'Processing' :
            ord.orderStatus === 'shipped' ? 'Shipped' :
            ord.orderStatus === 'delivered' ? 'Delivered' :
            ord.orderStatus === 'cancelled' ? 'Cancelled' :
            ord.orderStatus === 'rto' ? 'RTO' :
            ord.orderStatus === 'returned' ? 'Returned' : 'Pending'
          ),
          isGiftOrder: Boolean(ord.isGiftOrder || (ord.orderIntentType && ord.orderIntentType.includes('gift'))),
          giftIntent: ord.isGiftOrder ? {
            isGift: true,
            recipientName: 'Gift Recipient',
            senderName: ord.shippingAddress?.fullName || ord.customerName || 'Customer',
            recipientPhone: ord.contactPhone || '',
            deliveryAddress: 'Pan India',
            giftMessage: 'Best wishes!',
            occasion: (ord.orderIntentType || 'Festival').replace('gift_', '').toUpperCase(),
            includeCard: true,
            packagingTheme: 'Classic Saffron Gold'
          } : undefined,
          shippingAddress: typeof ord.shippingAddress === 'string' ? ord.shippingAddress : (
            ord.shippingAddress?.addressLine1 ? `${ord.shippingAddress.addressLine1}, ${ord.shippingAddress.city || ''} ${ord.shippingAddress.postalCode || ''}` : 'India'
          ),
          courier: ord.courier || ord.shippingSnapshot?.courierName || ord.shipmentInfo?.courier || null,
          courierOpsLine1: ord.courierOpsLine1 || ord.shipmentOps?.courierOpsLine1 || null,
          courierOpsLine2: ord.courierOpsLine2 || ord.shipmentOps?.courierOpsLine2 || null,
          awbCode: ord.awbCode || ord.shipmentInfo?.awbCode || ord.shipmentInfo?.trackingNumber || ord.tracking?.awb || null,
          shippingProvider: ord.shippingProvider || ord.shippingSnapshot?.provider || null,
          providerStatus: ord.providerStatus || ord.shipmentInfo?.providerStatus || null,
          opsState: ord.opsState || ord.shipmentOps?.opsState || null,
          opsStateLabel: ord.opsStateLabel || ord.shipmentOps?.opsStateLabel || null,
          rawOrder: ord,
          createdAt: ord.createdAt || new Date().toISOString(),
          updatedAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
        }));
        setOrders(mapped);
        }
      }
    } catch {
      // Fallback stays in state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, [activeTab, shippingSpeedScope]);

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => o.status === activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.giftIntent && o.giftIntent.recipientName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [orders, activeTab, searchQuery]);



  if (selectedOrderId) {
    return (
      <AdminOrderDetailView
        orderId={selectedOrderId}
        onBack={() => {
          setSelectedOrderId(null);
          fetchLiveOrders();
        }}
      />
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
            {shippingSpeedScope === 'same_day' ? 'Same Day Orders' : 'Orders Gift Intent Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">
            Monitor orders, update fulfillment statuses in real time, and customize gift cards &amp; recipient packaging.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchLiveOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Live Orders from Backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A44101] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Live Sync'}</span>
          </button>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
            {filteredOrders.length} Orders Listed
          </span>
        </div>
      </div>

      {/* 2. Controls & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer Name, Phone, or Recipient..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-navy focus:bg-white focus:outline-none focus:border-[#A44101] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-navy cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs (Scrollable on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          {ORDER_STATUS_TABS.map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            const isActive = activeTab === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Orders List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-navy">No orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no orders matching your selected status filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Number</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Courier &amp; Ops</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrderId(order.orderNumber || order.id)}
                    className="hover:bg-amber-50/30 cursor-pointer transition-colors group"
                    title="Click to view order details"
                  >
                    {/* Order Number & Timestamp */}
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">
                      <span className="text-[#A44101] group-hover:underline font-bold text-left block">
                        {order.orderNumber}
                      </span>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-navy text-xs">
                      {order.customerPhone || order.rawOrder?.contactPhone || order.rawOrder?.shippingAddress?.phone || '—'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-black text-navy font-roboto text-sm">
                      ₹{order.totalAmount}
                    </td>

                    {/* Payment Method & Status */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700">{order.paymentMethod}</div>
                      <span className={`text-[10px] font-bold ${
                        order.paymentStatus === 'Paid' ? 'text-emerald-600' : order.paymentStatus === 'Advance Paid' ? 'text-sky-700' : order.paymentStatus === 'Failed' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border shadow-2xs ${
                          order.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          order.status === 'Confirmed' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          order.status === 'Processing' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                          order.status === 'Shipped' ? 'bg-indigo-50 text-indigo-800 border-indigo-300' :
                          order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          order.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                          order.status === 'Returned' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                          'bg-amber-100 text-amber-900 border-amber-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Courier & Ops */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const courier =
                          order.courier ||
                          order.rawOrder?.courier ||
                          order.rawOrder?.shipmentInfo?.courier ||
                          order.rawOrder?.shippingSnapshot?.courierName ||
                          null;
                        const awb =
                          order.awbCode ||
                          order.rawOrder?.awbCode ||
                          order.rawOrder?.shipmentInfo?.awbCode ||
                          order.rawOrder?.shipmentInfo?.trackingNumber ||
                          null;
                        const providerStatus =
                          order.providerStatus ||
                          order.rawOrder?.providerStatus ||
                          order.rawOrder?.shipmentInfo?.providerStatus ||
                          null;
                        const opsLine1 =
                          order.courierOpsLine1 ||
                          order.rawOrder?.courierOpsLine1 ||
                          order.rawOrder?.shipmentOps?.courierOpsLine1 ||
                          null;
                        const opsLine2 =
                          order.courierOpsLine2 ||
                          order.rawOrder?.courierOpsLine2 ||
                          order.rawOrder?.shipmentOps?.courierOpsLine2 ||
                          null;

                        // Case 1: Cancelled Order
                        if (order.status === 'Cancelled') {
                          return <span className="text-[11px] text-slate-400 font-medium">Order Cancelled</span>;
                        }

                        // Case 2: Live AWB assigned by API
                        if (awb) {
                          return (
                            <div>
                              <div className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                <Truck className="w-3 h-3 shrink-0" />
                                <span>{awb}</span>
                              </div>
                              {(courier || providerStatus) && (
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                  {courier && <span>{courier}</span>}
                                  {courier && providerStatus && <span>·</span>}
                                  {providerStatus && <span className="text-slate-400">{providerStatus}</span>}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Case 3: Courier assigned by API (without AWB yet)
                        if (courier) {
                          return (
                            <div>
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800">
                                <Truck className="w-3.5 h-3.5 text-[#A44101] shrink-0" />
                                <span>{courier}</span>
                              </div>
                              {(providerStatus || opsLine1) && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {providerStatus || opsLine1}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Case 4: Real Provider Status or Ops Status from API
                        if (providerStatus || (opsLine1 && opsLine1 !== '—')) {
                          const displayStatus = providerStatus || opsLine1;
                          const isDelivered = /delivered/i.test(displayStatus);
                          const isInTransit = /transit|shipped|dispatched|out for/i.test(displayStatus);
                          const isPickup = /pickup|scheduled/i.test(displayStatus);
                          const isRtoOrIssue = /rto|exception|failed|issue/i.test(displayStatus);

                          return (
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  isDelivered
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : isInTransit
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : isPickup
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : isRtoOrIssue
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {isDelivered ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-slate-500" />
                                )}
                                <span>{displayStatus}</span>
                              </span>
                              {opsLine2 && (
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                                  {opsLine2}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Case 5: Delivered status according to order
                        if (order.status === 'Delivered') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Delivered</span>
                            </span>
                          );
                        }

                        // Case 6: No courier or ops assigned from API
                        return (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Unassigned
                          </span>
                        );
                      })()}
                    </td>

                    {/* Details Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-[#A44101] group-hover:text-white text-slate-700 font-bold transition-all text-xs shadow-2xs"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersView;
