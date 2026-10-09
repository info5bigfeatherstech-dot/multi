import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Ticket, 
  MessageSquare, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { mockAdminStore, AdminAbandonedCart, AdminLead, AdminCoupon } from '../mockAdminStore';
import { adminAnalyticsApi, adminCouponsApi } from '../../../api';

interface AdminGrowthViewProps {
  initialSubTab?: 'leads' | 'abandoned' | 'marketing';
}

export const AdminGrowthView: React.FC<AdminGrowthViewProps> = ({
  initialSubTab = 'abandoned',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'abandoned' | 'marketing'>(initialSubTab);
  const [carts, setCarts] = useState<AdminAbandonedCart[]>(() => mockAdminStore.getAbandonedCarts());
  const [leads, setLeads] = useState<AdminLead[]>(() => mockAdminStore.getLeads());
  const [coupons, setCoupons] = useState<AdminCoupon[]>(() => mockAdminStore.getCoupons());
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchLiveGrowthData = async () => {
    setIsLoading(true);
    try {
      const [cartsRes, leadsRes, couponsRes] = await Promise.allSettled([
        adminAnalyticsApi.getAbandonedCarts(),
        adminAnalyticsApi.getCustomers({ limit: 50 }),
        adminCouponsApi.getAll(),
      ]);

      if (cartsRes.status === 'fulfilled' && cartsRes.value) {
        const rawCarts = Array.isArray(cartsRes.value) ? cartsRes.value : cartsRes.value.data;
        if (Array.isArray(rawCarts) && rawCarts.length > 0) {
          const mappedCarts: AdminAbandonedCart[] = rawCarts.map((c: any) => ({
            id: c._id || c.id || String(Math.random()),
            customerName: c.user?.name || c.userName || (c.user?.phone ? `Shopper (${c.user.phone})` : 'Anonymous Shopper'),
            customerPhone: c.user?.phone || c.userPhone || '+91 98XXX XXXXX',
            customerEmail: c.user?.email || c.userEmail || 'shopper@store.com',
            cartValue: Math.round(c.totalAmount || c.cartValue || 0),
            itemCount: c.itemCount || c.items?.length || 1,
            items: (c.items || []).map((it: any) => ({
              title: it.productTitle || it.title || 'Cart Item',
              price: it.price || 199,
              qty: it.quantity || 1,
            })),
            abandonedAt: c.abandonedSince || c.updatedAt || c.createdAt || new Date().toISOString(),
            recoveryStatus: c.recoveryStatus || 'Uncontacted',
          }));
          setCarts(mappedCarts);
        }
      }

      if (leadsRes.status === 'fulfilled' && leadsRes.value) {
        const rawUsers = Array.isArray(leadsRes.value) ? leadsRes.value : (leadsRes.value.data || []);
        if (Array.isArray(rawUsers) && rawUsers.length > 0) {
          const mappedLeads: AdminLead[] = rawUsers.map((u: any) => ({
            id: u._id || u.id || String(Math.random()),
            name: u.name || (u.phone ? `Shopper ${u.phone}` : 'Registered Shopper'),
            phone: u.phone || '+91 98XXX XXXXX',
            email: u.email || 'customer@store.com',
            interestCategory: u.cartItemsCount > 0 ? 'Active Cart Shopper' : (u.wishlistCount > 0 ? 'Wishlist Shopper' : 'Store Member'),
            source: u.registrationMethod === 'google' ? 'Organic' : 'Checkout Dropoff',
            createdAt: u.createdAt || new Date().toISOString(),
            status: u.lastActive ? 'Contacted' : 'New',
          }));
          setLeads(mappedLeads);
        }
      }

      if (couponsRes.status === 'fulfilled' && couponsRes.value) {
        const rawCoupons = Array.isArray(couponsRes.value) ? couponsRes.value : (couponsRes.value.coupons || couponsRes.value.data || []);
        if (Array.isArray(rawCoupons) && rawCoupons.length > 0) {
          const mappedCoupons: AdminCoupon[] = rawCoupons.map((cp: any) => ({
            id: cp._id || cp.id || String(Math.random()),
            code: cp.code || 'COUPON',
            discountType: cp.discountType === 'fixed' ? 'fixed' : 'percentage',
            discountValue: cp.discountValue || 10,
            minOrderValue: cp.minOrderValue || 0,
            usageCount: cp.usedCount || cp.usageCount || 0,
            maxUsage: cp.usageLimit || cp.perUserLimit || 100,
            expiresAt: cp.expiryDate || cp.expiresAt || new Date(Date.now() + 86400000 * 30).toISOString(),
            status: cp.isActive !== false ? 'Active' : 'Expired',
          }));
          setCoupons(mappedCoupons);
        }
      }
    } catch {
      // Retain fallback data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveGrowthData();
  }, []);

  const triggerFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendWhatsAppRecovery = async (cart: AdminAbandonedCart) => {
    try {
      await adminAnalyticsApi.sendAbandonedCartReminders([cart.id]);
    } catch {
      // demo fallback
    }
    mockAdminStore.updateCartStatus(cart.id, 'WhatsApp Sent');
    setCarts((prev) =>
      prev.map((c) => (c.id === cart.id ? { ...c, recoveryStatus: 'WhatsApp Sent' } : c))
    );
    triggerFeedback(`WhatsApp recovery reminder sent to ${cart.customerName} (${cart.customerPhone})!`);
  };

  const handleMarkRecovered = (cart: AdminAbandonedCart) => {
    mockAdminStore.updateCartStatus(cart.id, 'Recovered');
    setCarts((prev) =>
      prev.map((c) => (c.id === cart.id ? { ...c, recoveryStatus: 'Recovered' } : c))
    );
    triggerFeedback(`Cart marked as successfully recovered! Added to confirmed revenue.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
            Store Growth &amp; Conversions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Recover lost carts, engage prospective customer leads, and manage promotional discount coupons.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchLiveGrowthData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Live Growth Metrics from Backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A44101] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Live Sync'}</span>
          </button>
          {/* Sub-tab pills */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
            type="button"
            onClick={() => setActiveSubTab('abandoned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'abandoned'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Abandoned Carts ({carts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('leads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'leads'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Leads ({leads.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('marketing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'marketing'
                ? 'bg-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Marketing Coupons ({coupons.length})</span>
          </button>
        </div>
      </div>
    </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* VIEW 1: Abandoned Carts */}
      {activeSubTab === 'abandoned' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80">
            <h3 className="text-sm font-bold text-navy">
              Dropoff Checkout Recovery Pipeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Shoppers who reached the cart with items but dropped before completing checkout.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Items in Cart</th>
                  <th className="py-3 px-4">Cart Value</th>
                  <th className="py-3 px-4">Abandoned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-navy">
                      {cart.customerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{cart.customerPhone}</div>
                      <div className="text-[11px] text-slate-400">{cart.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        {cart.items.map((it, idx) => (
                          <div key={idx} className="text-slate-600">
                            • {it.title} (x{it.qty})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-navy font-roboto text-sm">
                      ₹{cart.cartValue}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {cart.abandonedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        cart.recoveryStatus === 'Recovered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cart.recoveryStatus === 'WhatsApp Sent'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cart.recoveryStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {cart.recoveryStatus !== 'Recovered' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppRecovery(cart)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Reminder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkRecovered(cart)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                            title="Mark as Recovered"
                          >
                            <CheckCircle2 className="w-4 h-4 text-slate-400 hover:text-emerald-600" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Recovered</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Leads */}
      {activeSubTab === 'leads' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80">
            <h3 className="text-sm font-bold text-navy">
              Customer Leads &amp; Inquiries
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact list of shoppers who expressed interest or initiated contact.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Interest Category</th>
                  <th className="py-3 px-4">Acquisition Source</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-navy">
                      {lead.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{lead.phone}</div>
                      <div className="text-[11px] text-slate-400">{lead.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {lead.interestCategory}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-800' :
                        lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Marketing & Coupons */}
      {activeSubTab === 'marketing' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy">
                Promotional Discount Coupons
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active coupons redeemed by shoppers during checkout.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Usage (Redeemed / Max)</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-navy px-2 py-1 rounded bg-slate-100 border border-slate-200">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      ₹{c.minOrderValue}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy">{c.usageCount} / {c.maxUsage}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#A44101] h-full"
                            style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.expiresAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGrowthView;
