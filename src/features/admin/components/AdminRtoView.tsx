import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck,
  Search,
  RefreshCw,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Clock,
  RotateCcw,
  AlertTriangle,
  User,
  Package,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { adminRtoApi, AdminRtoOrder } from '../../../api';
import toast from 'react-hot-toast';

type RtoSubTab = 
  | 'management'
  | 'customer'
  | 'courier'
  | 'partial_paid'
  | 'refund_pending'
  | 'refund_processed'
  | 'refund_rejected'
  | 'closed'
  | 'analytics'
  | 'export';

export const AdminRtoView: React.FC = () => {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<RtoSubTab>('management');

  // Data & Loading
  const [orders, setOrders] = useState<AdminRtoOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [sortFilter, setSortFilter] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetDays, setPresetDays] = useState<string>('30d');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Modals
  const [refundModalOrder, setRefundModalOrder] = useState<AdminRtoOrder | null>(null);
  const [shippingOverride, setShippingOverride] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const [closeModalOrder, setCloseModalOrder] = useState<AdminRtoOrder | null>(null);
  const [closeAction, setCloseAction] = useState<'reject' | 'close'>('close');
  const [closeNote, setCloseNote] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Fetch Data
  const fetchRtoData = async () => {
    setIsLoading(true);
    try {
      let apiStatus: string | undefined = undefined;
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') apiStatus = 'pending';
        else if (statusFilter === 'refunded') apiStatus = 'refunded';
        else if (statusFilter === 'closed') apiStatus = 'closed';
        else if (statusFilter === 'failed') apiStatus = 'refund_failed';
        else if (statusFilter === 'rejected') apiStatus = 'refund_rejected';
      }

      const [ordersRes, analyticsRes] = await Promise.allSettled([
        adminRtoApi.getOrders({
          page: currentPage,
          limit: 30,
          status: apiStatus,
          search: searchQuery.trim() || undefined,
          preset: presetDays,
        }),
        adminRtoApi.getAnalytics({ preset: presetDays }),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const val = ordersRes.value;
        const list = val?.orders || val?.data?.orders || (Array.isArray(val) ? val : []);
        setOrders(Array.isArray(list) ? list : []);
        if (val?.pagination) {
          setTotalPages(val.pagination.totalPages || 1);
          setTotalCount(val.pagination.total || 0);
        } else {
          setTotalCount(list.length);
          setTotalPages(1);
        }
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value?.kpis || analyticsRes.value?.data?.kpis || null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load RTO data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRtoData();
  }, [statusFilter, presetDays, currentPage]);

  // Sync Shiprocket / Courier
  const handleSyncCourier = async () => {
    setIsSyncing(true);
    try {
      const res = await adminRtoApi.autoSyncStatuses({ preset: presetDays });
      const summary = res?.summary || res?.data?.summary;
      if (summary) {
        toast.success(`Courier Synced: ${summary.updated || 0} updated, ${summary.scanned || 0} scanned`);
      } else {
        toast.success('RTO courier tracking statuses synchronized successfully');
      }
      fetchRtoData();
    } catch (err: any) {
      toast.error(err.message || 'Auto-sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await adminRtoApi.exportReport({
        preset: presetDays,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (blob) {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `rto-report-${presetDays}-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('RTO Report downloaded successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.orderId));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleSelect = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkAction = async (action: 'refund' | 'close') => {
    if (selectedOrderIds.length === 0) return;
    setIsSubmittingBulk(true);
    try {
      const res = await adminRtoApi.bulkAction({
        action,
        orderIds: selectedOrderIds,
      });
      toast.success(res?.message || `Bulk ${action} executed`);
      setSelectedOrderIds([]);
      fetchRtoData();
    } catch (err: any) {
      toast.error(err.message || `Bulk ${action} failed`);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Single Refund
  const handleConfirmSingleRefund = async () => {
    if (!refundModalOrder) return;
    setIsSubmittingRefund(true);
    try {
      const overrideNum = shippingOverride ? Number(shippingOverride) : undefined;
      await adminRtoApi.processRefund({
        orderId: refundModalOrder.orderId,
        rtoShippingOverride: overrideNum,
      });
      toast.success(`RTO Refund processed for ${refundModalOrder.orderId}`);
      setRefundModalOrder(null);
      fetchRtoData();
    } catch (err: any) {
      toast.error(err.message || 'Refund failed');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // Close / Reject
  const handleConfirmClose = async () => {
    if (!closeModalOrder) return;
    setIsSubmittingClose(true);
    try {
      await adminRtoApi.rejectRefund({
        orderId: closeModalOrder.orderId,
        action: closeAction,
        note: closeNote.trim() || undefined,
      });
      toast.success(`Order ${closeModalOrder.orderId} marked as ${closeAction === 'close' ? 'closed' : 'rejected'}`);
      setCloseModalOrder(null);
      fetchRtoData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalRto = analytics?.totalRto ?? totalCount;
    const pendingInspection = orders.filter((o) => o.rtoStatus === 'pending' || !o.rtoStatus).length;
    const refunded = orders.filter((o) => o.rtoStatus === 'refunded').length;
    const closed = orders.filter((o) => o.rtoStatus === 'closed').length;
    const failed = orders.filter((o) => o.rtoStatus === 'refund_failed').length;
    const rejected = orders.filter((o) => o.rtoStatus === 'refund_rejected').length;

    const customerRelated = orders.filter((o) => {
      const r = (o.rtoReason || '').toLowerCase();
      return r.includes('customer') || r.includes('refuse') || r.includes('unavailable') || r.includes('cancel');
    }).length;

    const courierRelated = orders.filter((o) => {
      const r = (o.rtoReason || '').toLowerCase();
      return r.includes('address') || r.includes('courier') || r.includes('logistics') || r.includes('area') || r.includes('pincode');
    }).length;

    const eligibleForRefund = orders.filter((o) => o.warehouseDelivered && o.rtoStatus === 'pending').length;
    const totalRefundAmount = analytics?.totalRefundAmountInr ?? orders.filter((o) => o.rtoStatus === 'refunded').reduce((acc, o) => acc + (o.refundCalculation?.maxRefundableInr || o.amountInr || 0), 0);

    return {
      totalRto,
      pendingInspection,
      refunded,
      closed,
      failed,
      rejected,
      customerRelated,
      courierRelated,
      eligibleForRefund,
      totalRefundAmount,
    };
  }, [orders, analytics, totalCount]);

  // Filtered & Sorted orders for table display
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Sub-tab specific filters
    if (activeSubTab === 'customer') {
      list = list.filter((o) => {
        const r = (o.rtoReason || '').toLowerCase();
        return r.includes('customer') || r.includes('refuse') || r.includes('unavailable') || r.includes('cancel');
      });
    } else if (activeSubTab === 'courier') {
      list = list.filter((o) => {
        const r = (o.rtoReason || '').toLowerCase();
        return r.includes('address') || r.includes('courier') || r.includes('logistics') || r.includes('area') || r.includes('pincode');
      });
    } else if (activeSubTab === 'partial_paid') {
      list = list.filter((o) => (o as any).isPartialPayment || (o as any).advanceAmountPaid);
    } else if (activeSubTab === 'refund_pending') {
      list = list.filter((o) => o.rtoStatus === 'pending');
    } else if (activeSubTab === 'refund_processed') {
      list = list.filter((o) => o.rtoStatus === 'refunded');
    } else if (activeSubTab === 'refund_rejected') {
      list = list.filter((o) => o.rtoStatus === 'refund_rejected');
    } else if (activeSubTab === 'closed') {
      list = list.filter((o) => o.rtoStatus === 'closed');
    }

    // Section dropdown filter
    if (sectionFilter === 'customer') {
      list = list.filter((o) => (o.rtoReason || '').toLowerCase().includes('customer') || (o.rtoReason || '').toLowerCase().includes('refuse'));
    } else if (sectionFilter === 'courier') {
      list = list.filter((o) => (o.rtoReason || '').toLowerCase().includes('address') || (o.rtoReason || '').toLowerCase().includes('courier'));
    } else if (sectionFilter === 'verified') {
      list = list.filter((o) => o.warehouseDelivered);
    }

    // Sort
    if (sortFilter === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortFilter === 'amount_desc') {
      list.sort((a, b) => (b.amountInr || b.totalAmount || 0) - (a.amountInr || a.totalAmount || 0));
    } else {
      // newest
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [orders, activeSubTab, sectionFilter, sortFilter]);

  // Sub-sidebar tabs list
  const subTabs = [
    { id: 'management', label: 'RTO Management' },
    { id: 'customer', label: 'Customer Related RTO' },
    { id: 'courier', label: 'Courier Related RTO' },
    { id: 'partial_paid', label: 'Partial Paid RTO' },
    { id: 'refund_pending', label: 'Refund Pending' },
    { id: 'refund_processed', label: 'Refund Processed' },
    { id: 'refund_rejected', label: 'Refund Rejected' },
    { id: 'closed', label: 'Closed RTOs' },
    { id: 'analytics', label: 'Analytics Insights' },
    { id: 'export', label: 'Export Reports' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] font-roboto text-slate-800 animate-fadeIn">
      {/* =========================================================================
          LEFT SUB-SIDEBAR: RTO MODULE
         ========================================================================= */}
      <aside className="w-full lg:w-60 shrink-0 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs">
              <Truck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-navy leading-tight">RTO Module</h2>
              <p className="text-[11px] text-slate-400 font-medium">Returns to Origin</p>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="space-y-0.5">
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSubTab(tab.id as RtoSubTab);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#A44101]/10 text-[#A44101] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN PANEL
         ========================================================================= */}
      <main className="flex-1 min-w-0 space-y-5">
        {/* 1. Header with Title & Top Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              {subTabs.find((t) => t.id === activeSubTab)?.label || 'RTO Management'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Inspect, track, synchronize statuses, and disburse refunds for delivery failure orders
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchRtoData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#A44101]' : 'text-slate-600'}`} />
              <span>REFRESH</span>
            </button>

            <button
              type="button"
              onClick={handleSyncCourier}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>AUTO-SYNC</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Cards Grid: Row 1 (5 cards) & Row 2 (4 cards) */}
        <div className="space-y-3">
          {/* Row 1: 5 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* TOTAL RTO */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  TOTAL RTO
                </span>
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.totalRto}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                All returned orders
              </div>
            </div>

            {/* PENDING INSPECTION */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  PENDING INSPECTION
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.pendingInspection}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Awaiting action
              </div>
            </div>

            {/* REFUNDED */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  REFUNDED
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.refunded}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Completed refunds
              </div>
            </div>

            {/* CLOSED */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  CLOSED
                </span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-2xs">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.closed}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Resolved cases
              </div>
            </div>

            {/* REFUND FAILED */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  REFUND FAILED
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.failed}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Gateway / bank issues
              </div>
            </div>
          </div>

          {/* Row 2: 4 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* CUSTOMER RELATED */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  CUSTOMER RELATED
                </span>
                <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.customerRelated}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Refused / unavailable
              </div>
            </div>

            {/* COURIER RELATED */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  COURIER RELATED
                </span>
                <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.courierRelated}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Bad address / logistics
              </div>
            </div>

            {/* ELIGIBLE FOR REFUND */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  ELIGIBLE FOR REFUND
                </span>
                <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-2xs">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                {metrics.eligibleForRefund}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Meets refund criteria
              </div>
            </div>

            {/* TOTAL REFUND AMOUNT */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  TOTAL REFUND AMOUNT
                </span>
                <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#A44101] flex items-center justify-center shadow-2xs">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-navy mt-1">
                ₹{Math.round(metrics.totalRefundAmount).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Cumulative value
              </div>
            </div>
          </div>
        </div>

        {/* 3. Filter Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All', count: metrics.totalRto },
            { id: 'pending', label: 'Pending', count: metrics.pendingInspection },
            { id: 'refunded', label: 'Refunded', count: metrics.refunded },
            { id: 'closed', label: 'Closed', count: metrics.closed },
            { id: 'failed', label: 'Failed', count: metrics.failed },
            { id: 'rejected', label: 'Rejected', count: metrics.rejected },
          ].map((pill) => {
            const isSelected = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setStatusFilter(pill.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Search and Action Filter Bar Card */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Search Input and Search Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCurrentPage(1);
                fetchRtoData();
              }}
              className="flex items-center gap-2 flex-1 max-w-md"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Order ID / Customer / Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A44101] focus:bg-white transition-all text-navy"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
              >
                SEARCH
              </button>
            </form>

            {/* Filter Dropdown, Sort, and Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* All Sections dropdown */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:border-[#A44101] cursor-pointer"
              >
                <option value="all">All Sections</option>
                <option value="customer">Customer Related (Refused/Cancelled)</option>
                <option value="courier">Courier Related (Bad Address/Logistics)</option>
                <option value="verified">Warehouse Arrival Verified</option>
              </select>

              {/* Sort dropdown */}
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:border-[#A44101] cursor-pointer"
              >
                <option value="newest">Creation Date (High/Newest first)</option>
                <option value="oldest">Creation Date (Oldest first)</option>
                <option value="amount_desc">Refund Amount (High to Low)</option>
              </select>

              {/* AUTO-SYNC STATUSES inline */}
              <button
                type="button"
                onClick={handleSyncCourier}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-navy cursor-pointer transition-colors"
                title="Synchronize tracking with carrier"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#A44101]' : 'text-slate-500'}`} />
                <span className="uppercase text-[11px] tracking-wide">AUTO-SYNC STATUSES</span>
              </button>

              {/* EXPORT REPORT button */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wide"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>EXPORT REPORT</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar (Visible when orders checked) */}
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center justify-between p-2.5 mt-3 bg-orange-50/90 border border-orange-200 rounded-xl text-xs animate-fadeIn">
              <span className="font-bold text-[#A44101]">
                {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'shipment' : 'shipments'} selected for batch processing
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkAction('refund')}
                  disabled={isSubmittingBulk}
                  className="px-3 py-1 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white font-bold cursor-pointer transition-all shadow-2xs disabled:opacity-50"
                >
                  {isSubmittingBulk ? 'Processing...' : 'Bulk Refund'}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('close')}
                  disabled={isSubmittingBulk}
                  className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer transition-all disabled:opacity-50"
                >
                  Bulk Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. Main Content: Analytics Tab, Export Tab, OR Orders Table / Empty State */}
        {activeSubTab === 'analytics' ? (
          /* Dedicated Analytics Insights View */
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart2 className="w-5 h-5 text-[#A44101]" />
              <h2 className="text-base font-bold text-navy">RTO Root Cause &amp; Performance Analytics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Customer Refusal Ratio</div>
                <div className="text-2xl font-black text-navy">
                  {metrics.totalRto > 0 ? Math.round((metrics.customerRelated / metrics.totalRto) * 100) : 0}%
                </div>
                <p className="text-[11px] text-slate-400">Buyers unavailable or refused delivery at doorstep</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Courier Logistics Failure</div>
                <div className="text-2xl font-black text-navy">
                  {metrics.totalRto > 0 ? Math.round((metrics.courierRelated / metrics.totalRto) * 100) : 0}%
                </div>
                <p className="text-[11px] text-slate-400">Incorrect pincode or carrier delivery attempt failed</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase">Refund Recovery Rate</div>
                <div className="text-2xl font-black text-navy">
                  {metrics.totalRto > 0 ? Math.round((metrics.refunded / metrics.totalRto) * 100) : 0}%
                </div>
                <p className="text-[11px] text-slate-400">Legitimate RTO parcels inspected and disbursed</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 flex items-start gap-2.5">
              <TrendingUp className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Recommendation to Reduce RTO:</strong> Activate Partial Advance Payment in{' '}
                <span className="font-bold underline">Settings &gt; Controls</span> to enforce a 20% commitment advance on high-value COD orders.
              </div>
            </div>
          </div>
        ) : activeSubTab === 'export' ? (
          /* Dedicated Export Reports View */
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6 max-w-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Download className="w-5 h-5 text-[#A44101]" />
              <h2 className="text-base font-bold text-navy">Export Return to Origin (RTO) Reports</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Period Preset</label>
                <div className="grid grid-cols-4 gap-2">
                  {['7d', '30d', '90d', 'all'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPresetDays(preset)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        presetDays === preset
                          ? 'border-[#A44101] bg-orange-50 text-[#A44101]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {preset === 'all' ? 'All Time' : `Last ${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="all">All Statuses (Pending, Refunded, Closed, Failed)</option>
                  <option value="pending">Only Pending Inspection</option>
                  <option value="refunded">Only Refunded</option>
                  <option value="closed">Only Closed</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download CSV Spreadsheet</span>
              </button>
            </div>
          </div>
        ) : (
          /* Standard RTO Orders Table / Empty State */
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#A44101] mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading RTO shipments...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              /* Exact Empty State matching user screenshot */
              <div className="p-8 sm:p-12 text-left">
                <div className="text-2xl mb-2">📦</div>
                <h3 className="text-sm font-bold text-navy">No RTO Orders Found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  No returned-to-origin orders match your current filters or search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={
                            filteredOrders.length > 0 &&
                            selectedOrderIds.length === filteredOrders.length
                          }
                          className="rounded accent-[#A44101] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4 font-bold">Order ID &amp; AWB</th>
                      <th className="py-3 px-4 font-bold">Customer Details</th>
                      <th className="py-3 px-4 font-bold">RTO Reason &amp; Category</th>
                      <th className="py-3 px-4 font-bold">Warehouse Status</th>
                      <th className="py-3 px-4 font-bold">Financials</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((ord) => {
                      const isSelected = selectedOrderIds.includes(ord.orderId);
                      const isPending = ord.rtoStatus === 'pending' || !ord.rtoStatus;
                      const isWhDelivered = ord.warehouseDelivered;
                      const calc = ord.refundCalculation;

                      return (
                        <tr
                          key={ord.orderId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-orange-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(ord.orderId)}
                              className="rounded accent-[#A44101] cursor-pointer"
                            />
                          </td>

                          {/* Order ID & AWB */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-navy font-mono">
                                <span>{ord.orderId}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(ord.orderId, ord.orderId)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                  title="Copy Order ID"
                                >
                                  {copiedId === ord.orderId ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {((ord as any).awb || ord.shipmentInfo?.awb) && (
                                <div className="text-[11px] font-mono text-slate-500">
                                  AWB: {(ord as any).awb || ord.shipmentInfo?.awb} ({(ord as any).courier || ord.shipmentInfo?.courier || 'Courier'})
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Customer Details */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-bold text-navy">
                                {ord.customerName || 'Customer'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {ord.contactPhone || (ord as any).customerPhone || '—'}
                              </div>
                              {((ord as any).shippingCity || ord.shipmentInfo?.city) && (
                                <div className="text-[10px] text-slate-400">
                                  {(ord as any).shippingCity || ord.shipmentInfo?.city}, {(ord as any).shippingState || ord.shipmentInfo?.state || ''}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-700 truncate">
                                {ord.rtoReason || 'Customer Unavailable / Refused'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {ord.rtoReasonCategory || (ord as any).failureType || 'Delivery Attempt Exhausted'}
                              </div>
                            </div>
                          </td>

                          {/* Warehouse Status */}
                          <td className="py-3.5 px-4">
                            {isWhDelivered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Warehouse Received</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                <span>In Transit to Hub</span>
                              </span>
                            )}
                          </td>

                          {/* Financials */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <div className="font-bold text-navy">
                                ₹{Math.round(ord.amountInr || ord.totalAmount || 0)}
                              </div>
                              {calc && (
                                <div className="text-[11px] text-slate-500">
                                  Net Refund:{' '}
                                  <span className="font-bold text-emerald-700">
                                    ₹{Math.round(calc.maxRefundableInr || 0)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                                ord.rtoStatus === 'refunded'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                                  : ord.rtoStatus === 'refund_rejected' || ord.rtoStatus === 'closed'
                                    ? 'bg-slate-200 text-slate-700'
                                    : ord.rtoStatus === 'refund_failed'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200/80'
                                      : isWhDelivered
                                        ? 'bg-amber-100 text-amber-900 border border-amber-200/80 font-extrabold'
                                        : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ord.rtoStatus === 'refunded' && <CheckCircle2 className="w-3 h-3" />}
                              {ord.rtoStatus === 'refund_rejected' && <XCircle className="w-3 h-3" />}
                              {ord.rtoStatus === 'pending' && <Clock className="w-3 h-3" />}
                              <span>{(ord.rtoStatus || 'pending').replace('_', ' ')}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setRefundModalOrder(ord)}
                                    className="px-2.5 py-1 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                                  >
                                    Process Refund
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCloseModalOrder(ord);
                                      setCloseAction('close');
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    Close
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-semibold italic">Settled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                <span>
                  Page {currentPage} of {totalPages} ({totalCount} total shipments)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          REFUND CONFIRMATION MODAL (Full background blur portal)
         ========================================================================= */}
      {refundModalOrder && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setRefundModalOrder(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#A44101] flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Process RTO Refund</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{refundModalOrder.orderId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cart Total:</span>
                  <span className="font-bold text-navy">₹{Math.round(refundModalOrder.amountInr || refundModalOrder.totalAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>RTO / Freight Deductions:</span>
                  <span className="font-semibold">
                    -₹{refundModalOrder.refundCalculation?.deductions || 0}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                  <span className="font-extrabold text-slate-800">Net Refund Amount:</span>
                  <span className="font-extrabold text-[#A44101]">
                    ₹{Math.round(refundModalOrder.refundCalculation?.maxRefundableInr || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Override Shipping Deduction (Optional)
                </label>
                <input
                  type="number"
                  placeholder="Leave blank to use default calculated fees"
                  value={shippingOverride}
                  onChange={(e) => setShippingOverride(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                This triggers a direct refund via Razorpay to the customer's original online payment instrument, or marks the COD ledger as reconciled.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleRefund}
                disabled={isSubmittingRefund}
                className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRefund ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IndianRupee className="w-3.5 h-3.5" />}
                <span>Confirm &amp; Refund</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          CLOSE / REJECT RESOLUTION MODAL (Full background blur portal)
         ========================================================================= */}
      {closeModalOrder && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setCloseModalOrder(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Resolve / Reject RTO</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{closeModalOrder.orderId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCloseModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Resolution Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCloseAction('close')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      closeAction === 'close'
                        ? 'border-[#A44101] bg-orange-50 text-[#A44101]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Close / Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloseAction('reject')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      closeAction === 'reject'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Reject Refund
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Internal Note</label>
                <textarea
                  rows={3}
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="e.g. COD order cancelled, items restocked in bin A-12."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isSubmittingClose}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingClose ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Resolution</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminRtoView;

