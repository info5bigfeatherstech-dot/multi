import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  RefreshCw, 
  Phone, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  Send, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { adminAnalyticsApi } from '../../../api';
import toast from 'react-hot-toast';

export interface AdminCartItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  cartValue: number;
  itemCount: number;
  items: Array<{
    title: string;
    price: number;
    qty: number;
    image?: string;
  }>;
  abandonedAt: string;
  recoveryStatus: 'Uncontacted' | 'WhatsApp Sent' | 'Recovered';
}

export const AdminAbandonedCartsView: React.FC = () => {
  const [carts, setCarts] = useState<AdminCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchCarts = async () => {
    setIsLoading(true);
    try {
      const res = await adminAnalyticsApi.getAbandonedCarts();
      const rawCarts = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(rawCarts) && rawCarts.length > 0) {
        const mapped: AdminCartItem[] = rawCarts.map((c: any) => ({
          id: c._id || c.id || String(Math.random()),
          customerName: c.user?.name || c.userName || (c.user?.phone ? `Shopper (${c.user.phone})` : 'Anonymous Shopper'),
          customerPhone: c.user?.phone || c.userPhone || '',
          customerEmail: c.user?.email || c.userEmail || '',
          cartValue: Math.round(c.totalAmount || c.cartValue || 0),
          itemCount: c.itemCount || c.items?.length || 1,
          items: (c.items || []).map((it: any) => ({
            title: it.productTitle || it.title || 'Cart Item',
            price: it.price || 199,
            qty: it.quantity || 1,
            image: it.image || it.imageUrl || '',
          })),
          abandonedAt: c.abandonedSince || c.updatedAt || c.createdAt || new Date().toISOString(),
          recoveryStatus: c.recoveryStatus || 'Uncontacted',
        }));
        setCarts(mapped);
      }
    } catch {
      toast.error('Could not load abandoned carts from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSendRecovery = async (cart: AdminCartItem) => {
    try {
      setSendingId(cart.id);
      await adminAnalyticsApi.sendAbandonedCartReminders([cart.id]);
      setCarts((prev) =>
        prev.map((c) => (c.id === cart.id ? { ...c, recoveryStatus: 'WhatsApp Sent' } : c))
      );
      toast.success(`Recovery reminder dispatched to ${cart.customerName}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch recovery reminder');
    } finally {
      setSendingId(null);
    }
  };

  const filteredCarts = useMemo(() => {
    return carts.filter((c) => {
      if (statusFilter !== 'all' && c.recoveryStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.customerName.toLowerCase().includes(q);
        const matchesPhone = c.customerPhone.includes(q);
        const matchesEmail = c.customerEmail.toLowerCase().includes(q);
        const matchesItem = c.items.some((it) => it.title.toLowerCase().includes(q));
        return matchesName || matchesPhone || matchesEmail || matchesItem;
      }
      return true;
    });
  }, [carts, statusFilter, searchQuery]);

  // Aggregate metrics
  const totalCarts = carts.length;
  const totalRecoverableInflow = carts.reduce((acc, c) => acc + c.cartValue, 0);
  const uncontactedCount = carts.filter((c) => c.recoveryStatus === 'Uncontacted').length;
  const contactedCount = carts.filter((c) => c.recoveryStatus === 'WhatsApp Sent' || c.recoveryStatus === 'Recovered').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Dedicated Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 shadow-2xs">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                Abandoned Carts &amp; Checkout Recovery
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track lost cart conversions, inspect dropped items, and trigger automated WhatsApp checkout recovery.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchCarts}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Abandoned Carts from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A44101] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Carts'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Abandoned Carts</span>
          <span className="text-2xl font-black text-navy mt-1 block">{totalCarts}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Recorded dropoffs</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pipeline Recovery Value</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">₹{totalRecoverableInflow.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Potential lost revenue</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Uncontacted Carts</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{uncontactedCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Ready for WhatsApp prompt</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Reminders Sent</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{contactedCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Outreach triggered</span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, phone, item name..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
            >
              <option value="all">All Recovery Statuses</option>
              <option value="Uncontacted">Uncontacted</option>
              <option value="WhatsApp Sent">WhatsApp Sent</option>
              <option value="Recovered">Recovered</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400">
          Showing {filteredCarts.length} of {carts.length} abandoned carts
        </div>
      </div>

      {/* 4. Abandoned Carts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Cart Value</th>
                <th className="py-3 px-4">Cart Items &amp; Qty</th>
                <th className="py-3 px-4">Abandoned Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Recovery Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCarts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No abandoned carts found matching the current search.
                  </td>
                </tr>
              ) : (
                filteredCarts.map((cart) => {
                  const cleanPhone = cart.customerPhone.replace(/[^0-9]/g, '');
                  const whatsappUrl = cleanPhone 
                    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Hi ${cart.customerName}, you left items worth ₹${cart.cartValue} in your Apna Bharat Bazaar cart! Complete your order today and get express priority dispatch.`)}`
                    : null;

                  return (
                    <tr key={cart.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4 font-bold text-navy">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cart.customerName}</p>
                          {cart.customerPhone ? (
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cart.customerPhone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(cart.customerPhone, 'Phone')}
                                className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedText === cart.customerPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No phone</span>
                          )}
                        </div>
                      </td>

                      {/* Cart Value */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-sm text-[#A44101]">
                          ₹{cart.cartValue.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          {cart.items.slice(0, 2).map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              <span className="truncate">{it.title}</span>
                              <span className="text-slate-400 font-mono shrink-0">×{it.qty}</span>
                            </div>
                          ))}
                          {cart.items.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-bold block pl-3.5">
                              +{cart.items.length - 2} more items
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Abandoned Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{cart.abandonedAt ? new Date(cart.abandonedAt).toLocaleDateString() : 'Recent'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {cart.abandonedAt ? new Date(cart.abandonedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      {/* Recovery Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          cart.recoveryStatus === 'Recovered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cart.recoveryStatus === 'WhatsApp Sent'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-900 border border-amber-200/80'
                        }`}>
                          {cart.recoveryStatus === 'Recovered' && <CheckCircle2 className="w-3 h-3" />}
                          {cart.recoveryStatus === 'WhatsApp Sent' && <Send className="w-3 h-3" />}
                          {cart.recoveryStatus === 'Uncontacted' && <AlertCircle className="w-3 h-3" />}
                          <span>{cart.recoveryStatus}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                setCarts((prev) =>
                                  prev.map((c) => (c.id === cart.id ? { ...c, recoveryStatus: 'WhatsApp Sent' } : c))
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                              title="Chat on WhatsApp Directly"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSendRecovery(cart)}
                            disabled={sendingId === cart.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-[#A44101] text-[#A44101] hover:text-white font-bold text-[11px] border border-orange-200 transition-all cursor-pointer disabled:opacity-50"
                            title="Trigger Automated Push / Notification"
                          >
                            <Send className="w-3 h-3" />
                            <span>Notify</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAbandonedCartsView;
