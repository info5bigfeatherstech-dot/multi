import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingBag, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { mockAdminStore, OrderStatus, AdminOrder } from '../mockAdminStore';
import { adminOrdersApi } from '../../../api';
import { AdminOrderDetailView } from './AdminOrderDetailView';

interface AdminOrdersViewProps {
  initialStatusFilter?: string;
}

const ORDER_STATUS_TABS: OrderStatus[] = [
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
  initialStatusFilter = 'Pending',
}) => {
  const [activeTab, setActiveTab] = useState<OrderStatus>(() => {
    if (initialStatusFilter && initialStatusFilter !== 'All') {
      return initialStatusFilter as OrderStatus;
    }
    return 'Pending';
  });
  const [searchQuery, setSearchQuery] = useState('');
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
        status: activeTab.toLowerCase(),
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
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
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

                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
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
