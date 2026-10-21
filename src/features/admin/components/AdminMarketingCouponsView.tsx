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
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { adminCouponsApi } from '../../../api';
import toast from 'react-hot-toast';
import { DatePicker } from '../../../components/ui/calendar';

export interface AdminCouponItem {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue: number;
  usageCount: number;
  maxUsage: number;
  perUserLimit?: number;
  expiresAt: string;
  status: 'Active' | 'Expired';
  isActive?: boolean;
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

  // Edit Coupon Modal (matching screenshot)
  const [editingCoupon, setEditingCoupon] = useState<AdminCouponItem | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDiscountType, setEditDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [editDiscountValue, setEditDiscountValue] = useState<number>(10);
  const [editMaxDiscount, setEditMaxDiscount] = useState<number | string>('');
  const [editMinOrder, setEditMinOrder] = useState<number>(0);
  const [editUsageLimit, setEditUsageLimit] = useState<number | string>(100);
  const [editPerUserLimit, setEditPerUserLimit] = useState<number>(1);
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Toggling & Deleting State
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<AdminCouponItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await adminCouponsApi.getAll();
      const rawCoupons = Array.isArray(res) ? res : (res?.coupons || res?.data || []);
      if (Array.isArray(rawCoupons)) {
        const mapped: AdminCouponItem[] = rawCoupons.map((cp: any) => ({
          id: cp._id || cp.id || String(Math.random()),
          code: cp.code || 'COUPON',
          name: cp.name || cp.code || '',
          description: cp.description || '',
          discountType: cp.discountType === 'fixed' ? 'fixed' : 'percentage',
          discountValue: cp.discountValue || 10,
          maxDiscountAmount: cp.maxDiscountAmount ?? null,
          minOrderValue: cp.minOrderValue || 0,
          usageCount: cp.usedCount || cp.usageCount || 0,
          maxUsage: cp.usageLimit || cp.perUserLimit || 100,
          perUserLimit: cp.perUserLimit || 1,
          expiresAt: cp.expiryDate || cp.expiresAt || new Date(Date.now() + 86400000 * 30).toISOString(),
          status: cp.isActive !== false ? 'Active' : 'Expired',
          isActive: cp.isActive !== false,
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

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      setIsDeleting(true);
      await adminCouponsApi.delete(couponToDelete.id);
      setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id));
      toast.success(`Coupon "${couponToDelete.code}" deleted successfully`);
      setCouponToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete coupon');
    } finally {
      setIsDeleting(false);
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

  const handleOpenEdit = (c: AdminCouponItem) => {
    setEditingCoupon(c);
    setEditCode(c.code || '');
    setEditName(c.name || c.code || '');
    setEditDescription(c.description || '');
    setEditDiscountType(c.discountType === 'fixed' ? 'fixed' : 'percentage');
    setEditDiscountValue(c.discountValue || 0);
    setEditMaxDiscount(c.maxDiscountAmount != null ? c.maxDiscountAmount : '');
    setEditMinOrder(c.minOrderValue || 0);
    setEditUsageLimit(c.maxUsage != null ? c.maxUsage : 100);
    setEditPerUserLimit(c.perUserLimit || 1);

    // Format expiry date as YYYY-MM-DD for standard date input
    let formattedDate = '';
    if (c.expiresAt) {
      try {
        formattedDate = new Date(c.expiresAt).toISOString().split('T')[0];
      } catch {
        formattedDate = c.expiresAt.split('T')[0] || '';
      }
    }
    setEditExpiryDate(formattedDate);
    setEditIsActive(c.isActive !== false);
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    if (!editCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (!editExpiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      const payload: any = {
        code: editCode.trim().toUpperCase(),
        name: editName.trim() || editCode.trim().toUpperCase(),
        description: editDescription.trim(),
        discountType: editDiscountType,
        discountValue: Number(editDiscountValue),
        maxDiscountAmount: editMaxDiscount !== '' ? Number(editMaxDiscount) : null,
        minOrderValue: Number(editMinOrder) || 0,
        usageLimit: editUsageLimit !== '' ? Number(editUsageLimit) : null,
        perUserLimit: Number(editPerUserLimit) || 1,
        expiryDate: new Date(editExpiryDate).toISOString(),
        isActive: editIsActive,
      };

      await adminCouponsApi.update(editingCoupon.id, payload);

      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                code: payload.code,
                name: payload.name,
                description: payload.description,
                discountType: payload.discountType,
                discountValue: payload.discountValue,
                maxDiscountAmount: payload.maxDiscountAmount,
                minOrderValue: payload.minOrderValue,
                maxUsage: payload.usageLimit || 100,
                perUserLimit: payload.perUserLimit,
                expiresAt: payload.expiryDate,
                isActive: payload.isActive,
                status: payload.isActive ? 'Active' : 'Expired',
              }
            : c
        )
      );

      toast.success(`Coupon ${payload.code} updated successfully! ✓`);
      setEditingCoupon(null);
      // Re-fetch all coupons from API
      await fetchCoupons();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update coupon');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (coupon: AdminCouponItem) => {
    const newActive = !coupon.isActive;
    setTogglingId(coupon.id);

    // Optimistic UI toggle for immediate responsiveness
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === coupon.id
          ? {
              ...c,
              isActive: newActive,
              status: newActive ? 'Active' : 'Expired',
            }
          : c
      )
    );

    try {
      // 1. Send update/toggle request to API
      await adminCouponsApi.toggleStatus(coupon.id, newActive);
      toast.success(`Coupon ${coupon.code} is now ${newActive ? 'Active' : 'Inactive'} ✓`);

      // 2. Hit http://localhost:5173/api/admin/coupons right after toggling off/on
      await fetchCoupons();
    } catch (err: any) {
      // Revert if API fails
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id
            ? {
                ...c,
                isActive: !newActive,
                status: !newActive ? 'Active' : 'Expired',
              }
            : c
        )
      );
      toast.error(err?.message || 'Failed to toggle coupon status');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (statusFilter === 'Active' && (!c.isActive || c.status !== 'Active')) return false;
      if (statusFilter === 'Expired' && (c.isActive && c.status === 'Active')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return c.code.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q));
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

                      {/* Status & Active/Inactive Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={c.isActive}
                            disabled={togglingId === c.id}
                            onClick={() => handleToggleStatus(c)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              c.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                            } ${togglingId === c.id ? 'opacity-60 cursor-wait' : ''}`}
                            title={`Click to ${c.isActive ? 'deactivate' : 'activate'} coupon`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                c.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <span 
                            onClick={() => handleToggleStatus(c)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer select-none transition-colors ${
                              c.isActive && !isDepleted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200/80'
                                : 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200/80'
                            }`}
                            title="Toggle Status"
                          >
                            {isDepleted ? 'Exhausted' : c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCouponToDelete(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* 6. EDIT COUPON MODAL (Matching exact visual design from screenshot) */}
      {editingCoupon && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto"
          onClick={() => setEditingCoupon(null)}
        >
          <div 
            className="bg-[#FAF8F5] text-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200/90 shadow-2xl p-6 sm:p-8 space-y-6 animate-scaleUp my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
                Edit coupon
              </h2>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="space-y-4 text-xs">
              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Coupon code *</label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g. B2BSAVE15"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Coupon name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="e.g. B2B Wholesale Saver"
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Wholesale 15% discount for bulk shoppers"
                />
              </div>

              {/* Row 3: Discount type & value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount type</label>
                  <select
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Row 4: Max discount & Min order value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder=""
                    value={editMaxDiscount}
                    onChange={(e) => setEditMaxDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min order value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editMinOrder}
                    onChange={(e) => setEditMinOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Row 5: Usage limit, Per user limit, Expiry date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Usage limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editUsageLimit}
                    onChange={(e) => setEditUsageLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Per user limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editPerUserLimit}
                    onChange={(e) => setEditPerUserLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expiry date *</label>
                  <DatePicker
                    value={editExpiryDate}
                    onChange={(val) => setEditExpiryDate(val)}
                    required
                  />
                </div>
              </div>

              {/* Loyalty Badge Targeting */}
              <div className="pt-2 space-y-1">
                <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-900">
                  LOYALTY BADGE TARGETING
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Leave all unchecked = every customer. Check badges to limit (e.g. Diwali Gold-only offer).
                </p>
                <p className="text-[11px] text-slate-400">
                  No active loyalty badges yet. Create them under Marketing → Loyalty badges.
                </p>
              </div>

              {/* Active Checkbox */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-black border-slate-300 focus:ring-black accent-black cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">Active</span>
                </label>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-[#141414] hover:bg-black text-white rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>UPDATE COUPON</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {couponToDelete && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !isDeleting && setCouponToDelete(null)}
        >
          <div 
            className="bg-white text-slate-900 rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Delete Coupon</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setCouponToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description & Coupon Summary */}
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Are you sure you want to delete coupon <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{couponToDelete.code}</span>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Discount: <strong className="text-slate-800">{couponToDelete.discountType === 'percentage' ? `${couponToDelete.discountValue}% OFF` : `₹${couponToDelete.discountValue} FLAT OFF`}</strong></span>
                <span>Expires: <strong className="text-slate-800">{couponToDelete.expiresAt ? couponToDelete.expiresAt.split('T')[0] : 'Never'}</strong></span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Coupon'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminMarketingCouponsView;
