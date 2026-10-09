import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Gift, 
  ChevronDown, 
  ChevronUp, 
  User, 
  MapPin, 
  Package,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { mockAdminStore, OrderStatus, AdminOrder } from '../mockAdminStore';
import { adminOrdersApi } from '../../../api';
import { AdminGiftIntentPanel } from './AdminGiftIntentPanel';
import { AdminOrderDetailView } from './AdminOrderDetailView';
import toast from 'react-hot-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select';

interface AdminOrdersViewProps {
  initialStatusFilter?: string;
}

const ORDER_STATUS_TABS: (OrderStatus | 'All')[] = [
  'All',
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
  'RTO'
];

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  initialStatusFilter = 'All',
}) => {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>(
    (initialStatusFilter as OrderStatus | 'All') || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>(() => mockAdminStore.getOrders());
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'RTO') {
        const rtoRes = await adminOrdersApi.getRtoOrders();
        const rtoList = rtoRes.orders || rtoRes.data || (Array.isArray(rtoRes) ? rtoRes : []);
        if (Array.isArray(rtoList) && rtoList.length > 0) {
          const mapped: AdminOrder[] = rtoList.map((ord: any) => ({
            id: ord.orderId || ord._id || String(Math.random()),
            orderNumber: ord.orderIdDisplay || ord.orderId || '#RTO-LIVE',
            customerName: ord.shippingAddress?.fullName || ord.customerName || (ord.contactPhone ? `Customer (${ord.contactPhone})` : 'Shopper'),
            customerPhone: ord.contactPhone || ord.shippingAddress?.phone || '+91 98XXX XXXXX',
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
            createdAt: ord.createdAt || new Date().toISOString(),
            updatedAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
          }));
          setOrders(mapped);
          return;
        }
      }

      const res = await adminOrdersApi.getAll({
        status: activeTab !== 'All' ? activeTab.toLowerCase() : undefined,
        search: searchQuery.trim() || undefined,
      });

      const rawOrders = res.orders || res.data?.orders || res.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(rawOrders) && rawOrders.length > 0) {
        const mapped: AdminOrder[] = rawOrders.map((ord: any) => ({
          id: ord.orderId || ord._id || String(Math.random()),
          orderNumber: ord.orderIdDisplay || ord.orderId || '#ORD-LIVE',
          customerName: ord.shippingAddress?.fullName || ord.customerName || (ord.contactPhone ? `Customer (${ord.contactPhone})` : 'Indian Shopper'),
          customerPhone: ord.contactPhone || ord.shippingAddress?.phone || '+91 98XXX XXXXX',
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
          paymentMethod: (ord.paymentMethod === 'online' ? 'UPI' : (ord.paymentMethod === 'cod' ? 'COD' : 'UPI')) as any,
          paymentStatus: ord.paymentStatus === 'paid' ? 'Paid' : 'Pending',
          status: (
            ord.orderStatus === 'confirmed' ? 'Confirmed' :
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
          createdAt: ord.createdAt || new Date().toISOString(),
          updatedAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
        }));
        setOrders(mapped);
      }
    } catch {
      // Fallback stays in state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
  }, [activeTab]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (activeTab !== 'All') {
      list = list.filter((o) => o.status === activeTab);
    }

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

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await adminOrdersApi.updateFulfillmentStatus(orderId, newStatus.toLowerCase());
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      // Offline fallback
      mockAdminStore.updateOrderStatus(orderId, newStatus);
    }
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  const handleRefresh = () => {
    fetchLiveOrders();
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

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
            Orders &amp; Gift Intent Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
            const count = status === 'All' 
              ? orders.length 
              : orders.filter((o) => o.status === status).length;
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
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Gift Intent</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const isGift = order.isGiftOrder;

                  return (
                    <React.Fragment key={order.id}>
                      {/* Primary Row */}
                      <tr className={`hover:bg-slate-50/70 transition-colors ${isExpanded ? 'bg-amber-50/20' : ''}`}>
                        {/* Order Number & Timestamp */}
                        <td className="py-3.5 px-4 font-mono font-bold text-navy">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(order.orderNumber || order.id)}
                            className="text-[#A44101] hover:underline font-bold text-left cursor-pointer"
                            title="Open order details"
                          >
                            {order.orderNumber}
                          </button>
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

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">{order.customerName}</div>
                          <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                        </td>

                        {/* Gift Intent Pill */}
                        <td className="py-3.5 px-4">
                          {isGift ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[#A44101] font-black text-xs border border-amber-200 shadow-2xs">
                              <Gift className="w-3.5 h-3.5 text-[#A44101]" />
                              <span>{order.giftIntent?.occasion || 'Gift Order'}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              For Myself
                            </span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 font-black text-navy font-roboto text-sm">
                          ₹{order.totalAmount}
                        </td>

                        {/* Payment Method & Status */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-700">{order.paymentMethod}</div>
                          <span className={`text-[10px] font-bold ${
                            order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>

                        {/* Live Status Selector with Shadcn Select */}
                        <td className="py-3.5 px-4">
                          <Select
                            value={order.status}
                            onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                          >
                            <SelectTrigger
                              className={`h-7 px-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider border shadow-2xs w-[130px] ${
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
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end" className="w-[145px]">
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="Processing">Processing</SelectItem>
                              <SelectItem value="Shipped">Shipped</SelectItem>
                              <SelectItem value="Delivered">Delivered</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                              <SelectItem value="Returned">Returned</SelectItem>
                              <SelectItem value="RTO">RTO</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Expand / Details Action */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderId(order.orderNumber || order.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer text-xs"
                              title="Open order page"
                            >
                              <span>Details</span>
                              <ExternalLink className="w-3 h-3 text-slate-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpand(order.id)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                              title={isExpanded ? "Collapse inline preview" : "Expand inline preview"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Order Detail Drawer Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="p-4 sm:p-6 border-b border-slate-200">
                            <div className="space-y-6">
                              {/* 1. Integrated AdminGiftIntentPanel */}
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                                  <Gift className="w-3.5 h-3.5 text-[#A44101]" />
                                  <span>Gift Intent &amp; Packaging Specs</span>
                                </h4>
                                <AdminGiftIntentPanel
                                  order={order}
                                  onUpdate={handleRefresh}
                                />
                              </div>

                              {/* 2. Customer & Shipping Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                                  <h4 className="text-xs font-bold text-navy uppercase mb-2 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#A44101]" />
                                    <span>Customer Contact Info</span>
                                  </h4>
                                  <div className="space-y-1 text-xs text-slate-600">
                                    <p><strong>Name:</strong> {order.customerName}</p>
                                    <p><strong>Phone:</strong> {order.customerPhone}</p>
                                    <p><strong>Email:</strong> {order.customerEmail}</p>
                                    <p><strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})</p>
                                  </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                                  <h4 className="text-xs font-bold text-navy uppercase mb-2 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#A44101]" />
                                    <span>Delivery Destination Address</span>
                                  </h4>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {order.shippingAddress}
                                  </p>
                                </div>
                              </div>

                              {/* 3. Purchased Items List */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                                <h4 className="text-xs font-bold text-navy uppercase mb-3 flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-[#A44101]" />
                                  <span>Order Items ({order.items.length})</span>
                                </h4>
                                <div className="divide-y divide-slate-100">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                        />
                                        <div>
                                          <h5 className="font-bold text-navy text-xs sm:text-sm">
                                            {item.title}
                                          </h5>
                                          <span className="text-[11px] text-slate-400 font-mono">
                                            SKU: {item.sku} • Qty: {item.quantity}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-black text-navy text-xs sm:text-sm font-roboto">
                                          ₹{item.price * item.quantity}
                                        </div>
                                        <span className="text-[10px] text-slate-400">
                                          ₹{item.price} each
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersView;
