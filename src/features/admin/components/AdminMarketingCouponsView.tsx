import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Ticket, 
  Search, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  X, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { adminCouponsApi } from '../../../api';
import toast from 'react-hot-toast';

export interface AdminCouponItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  usageCount: number;
  maxUsage: number;
  expiresAt: string;
  status: 'Active' | 'Expired';
}

export const AdminMarketingCouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Coupon Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(10);
  const [newMinOrder, setNewMinOrder] = useState<number>(0);
  const [newUsageLimit, setNewUsageLimit] = useState<number>(100);
  const [newExpiryDays, setNewExpiryDays] = useState<number>(30);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await adminCouponsApi.getAll();
      const rawCoupons = Array.isArray(res) ? res : (res?.coupons || res?.data || []);
      if (Array.isArray(rawCoupons)) {
        const mapped: AdminCouponItem[] = rawCoupons.map((cp: any) => ({
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
        setCoupons(mapped);
      }
    } catch {
      toast.error('Could not load coupons from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied coupon code ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      setDeletingId(id);
      await adminCouponsApi.delete(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Coupon ${code} deleted successfully`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + newExpiryDays);

    try {
      setIsSubmittingCreate(true);
      await adminCouponsApi.create({
        code: newCode.trim().toUpperCase(),
        discountType: newDiscountType,
        discountValue: Number(newDiscountValue),
        minOrderValue: Number(newMinOrder),
        usageLimit: Number(newUsageLimit),
        expiryDate: expiryDate.toISOString(),
        isActive: true,
      });

      toast.success(`Coupon ${newCode.toUpperCase()} created successfully!`);
      setIsCreateModalOpen(false);
      setNewCode('');
      setNewDiscountValue(10);
      setNewMinOrder(0);
      setNewUsageLimit(100);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create coupon');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return c.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [coupons, statusFilter, searchQuery]);

  // Aggregate metrics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === 'Active').length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + c.usageCount, 0);
  const expiredCoupons = coupons.filter((c) => c.status === 'Expired').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Dedicated Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-2xs">
              <Ticket className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                Marketing Coupons &amp; Promotions
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage promotional discount vouchers, redemption limits, percentage &amp; flat discounts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchCoupons}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Coupons from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A44101] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Coupons'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#A44101] hover:bg-[#8C3701] px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Coupons</span>
          <span className="text-2xl font-black text-navy mt-1 block">{totalCoupons}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Configured discounts</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Vouchers</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeCoupons}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Redeemable at checkout</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Redemptions</span>
          <span className="text-2xl font-black text-[#A44101] mt-1 block">{totalRedemptions}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Applied on orders</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expired / Depleted</span>
          <span className="text-2xl font-black text-slate-400 mt-1 block">{expiredCoupons}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Past validity or max</span>
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
              placeholder="Search coupon code..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs uppercase focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400">
          Showing {filteredCoupons.length} of {coupons.length} coupons
        </div>
      </div>

      {/* 4. Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
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
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No marketing coupons found. Click "+ Create Coupon" above to add one.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const usagePct = c.maxUsage > 0 ? Math.min(100, (c.usageCount / c.maxUsage) * 100) : 0;
                  const isDepleted = c.usageCount >= c.maxUsage && c.maxUsage > 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-navy px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 tracking-wider">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.code)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 font-bold text-emerald-600 text-xs">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                      </td>

                      {/* Min Order */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        ₹{c.minOrderValue}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${isDepleted ? 'text-rose-600' : 'text-slate-900'}`}>
                            {c.usageCount} / {c.maxUsage}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${isDepleted ? 'bg-rose-500' : 'bg-[#A44101]'}`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expires */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {c.expiresAt ? c.expiresAt.split('T')[0] : 'No expiry'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.status === 'Active' && !isDepleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {isDepleted ? 'Exhausted' : c.status}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Coupon"
                        >
                          {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CREATE COUPON MODAL (Mounted via Portal with deep blur) */}
      {isCreateModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#A44101] flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Create Marketing Coupon</h3>
                  <p className="text-[11px] text-slate-500">Add a new discount voucher for store customers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-5 space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE20, DIWALI100"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-navy uppercase focus:outline-none focus:border-[#A44101]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {newDiscountType === 'percentage' ? 'Percentage Off (%)' : 'Flat Off (₹)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newDiscountType === 'percentage' ? '100' : '100000'}
                    required
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-navy focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>

              {/* Min Order & Max Usage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(Number(e.target.value))}
                    placeholder="0 for no minimum"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-navy focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={newUsageLimit}
                    onChange={(e) => setNewUsageLimit(Number(e.target.value))}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-navy focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>

              {/* Expiry Days */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Valid For (Days from today)</label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={newExpiryDays}
                  onChange={(e) => setNewExpiryDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-navy focus:outline-none focus:border-[#A44101]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCreate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Create Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminMarketingCouponsView;
