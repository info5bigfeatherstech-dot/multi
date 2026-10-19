import React, { useState, useEffect } from 'react';
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
  PackageCheck,
  X,
  Building2,
  Clock,
  Filter
} from 'lucide-react';
import { adminRtoApi, AdminRtoOrder } from '../../../api';
import toast from 'react-hot-toast';

export const AdminRtoView: React.FC = () => {
  const [orders, setOrders] = useState<AdminRtoOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetDays, setPresetDays] = useState<string>('30d');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected for Bulk Action
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Refund Single Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<AdminRtoOrder | null>(null);
  const [shippingOverride, setShippingOverride] = useState<string>('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Reject / Close Modal State
  const [closeModalOrder, setCloseModalOrder] = useState<AdminRtoOrder | null>(null);
  const [closeAction, setCloseAction] = useState<'reject' | 'close'>('close');
  const [closeNote, setCloseNote] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  const fetchRtoData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, analyticsRes] = await Promise.allSettled([
        adminRtoApi.getOrders({
          page: currentPage,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter,
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

  const handleSyncShiprocket = async () => {
    setIsSyncing(true);
    try {
      const res = await adminRtoApi.autoSyncStatuses({ preset: presetDays });
      const summary = res?.summary || res?.data?.summary;
      if (summary) {
        toast.success(`Shiprocket Synced: ${summary.updated || 0} updated, ${summary.scanned || 0} checked`);
      } else {
        toast.success('RTO tracking statuses synced successfully');
      }
      fetchRtoData();
    } catch (err: any) {
      toast.error(err.message || 'Auto-sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

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
        toast.success('RTO Report downloaded');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(orders.map((o) => o.orderId));
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-navy">RTO (Return to Origin)</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage undelivered courier parcels, warehouse arrival verification, and net-deduction refund processing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncShiprocket}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Sync latest delivery & RTO statuses from Shiprocket"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Courier'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchRtoData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#A44101]' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total RTOs</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#A44101]">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-navy">
            {analytics?.totalRto ?? totalCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Undelivered shipments</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Warehouse Action</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center gap-2">
            <span>{analytics?.eligibleForRefund ?? orders.filter((o) => o.warehouseDelivered && o.rtoStatus === 'pending').length}</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              Refund Ready
            </span>
          </div>
          <span className="text-[11px] text-amber-700/80 mt-0.5 block">Parcel back at origin</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">RTO In Transit</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {analytics?.pending ?? orders.filter((o) => !o.warehouseDelivered && o.rtoStatus === 'pending').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Returning via courier</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Refunded (₹)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{(analytics?.totalRefundAmountInr ?? 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {analytics?.refunded ?? 0} orders settled
          </span>
        </div>
      </div>

      {/* 3. Filters, Presets & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All RTO' },
              { id: 'pending', label: 'Pending Action' },
              { id: 'refunded', label: 'Refunded' },
              { id: 'closed', label: 'Closed / Rejected' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setStatusFilter(t.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === t.id
                    ? 'bg-[#A44101] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Preset & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={presetDays}
                onChange={(e) => {
                  setPresetDays(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCurrentPage(1);
                fetchRtoData();
              }}
              className="relative w-full sm:w-64"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order ID, Phone, AWB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
              />
            </form>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when orders checked) */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-orange-50/80 border border-orange-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#A44101]">
                {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'order' : 'orders'} selected
              </span>
            </div>
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

      {/* 4. RTO Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#A44101] mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading RTO shipments...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#A44101] flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy">No RTO Orders Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No RTO orders matching "${searchQuery}".`
                : 'When courier shipments fail delivery and are marked RTO by Shiprocket, they appear here automatically.'}
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
                      checked={selectedOrderIds.length === orders.length && orders.length > 0}
                      className="rounded accent-[#A44101]"
                    />
                  </th>
                  <th className="py-3 px-4">Order & Customer</th>
                  <th className="py-3 px-4">RTO Reason & Carrier</th>
                  <th className="py-3 px-4">Warehouse Status</th>
                  <th className="py-3 px-4">Financials & Net Refund</th>
                  <th className="py-3 px-4">RTO Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const isChecked = selectedOrderIds.includes(ord.orderId);
                  const isWhDelivered = Boolean(ord.warehouseDelivered);
                  const isPending = ord.rtoStatus === 'pending';
                  const calc = ord.refundCalculation;

                  return (
                    <tr
                      key={ord.orderId}
                      className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-orange-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(ord.orderId)}
                          className="rounded accent-[#A44101]"
                        />
                      </td>

                      {/* Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-navy">
                          <span>{ord.orderIdDisplay || ord.orderId}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ord.orderId, `rto-${ord.orderId}`)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Order ID"
                          >
                            {copiedId === `rto-${ord.orderId}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="font-semibold text-slate-800 mt-0.5">{ord.customerName || 'Shopper'}</p>
                        {ord.contactPhone && (
                          <span className="font-mono text-[10px] text-slate-400">{ord.contactPhone}</span>
                        )}
                      </td>

                      {/* Reason & Carrier */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-700 capitalize truncate" title={ord.rtoReason || ord.providerStatus || 'Undelivered'}>
                          {ord.rtoReason || ord.providerStatus || 'Delivery Attempt Failed'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {ord.providerStatus && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {ord.providerStatus}
                            </span>
                          )}
                          {ord.rtoReasonCategory && (
                            <span className="text-[10px] text-slate-400 capitalize">
                              • {ord.rtoReasonCategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Warehouse Status */}
                      <td className="py-3.5 px-4">
                        {isWhDelivered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>At Origin Warehouse</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Truck className="w-3.5 h-3.5" />
                            <span>In Transit Back</span>
                          </span>
                        )}
                      </td>

                      {/* Financials & Net Refund */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-navy">
                            Total: ₹{Math.round(ord.amountInr || ord.totalAmount || 0)}
                          </p>
                          {calc && (
                            <p className="text-[11px] text-slate-500">
                              Net Refund:{' '}
                              <span className="font-bold text-emerald-700">
                                ₹{Math.round(calc.maxRefundableInr || 0)}
                              </span>
                              {calc.deductions ? (
                                <span className="text-[10px] text-rose-500 ml-1">
                                  (-₹{calc.deductions} fees)
                                </span>
                              ) : null}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* RTO Terminal Status */}
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
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200/80 font-extrabold animate-pulse'
                                    : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ord.rtoStatus === 'refunded' && <CheckCircle2 className="w-3 h-3" />}
                          {ord.rtoStatus === 'refund_rejected' && <XCircle className="w-3 h-3" />}
                          {ord.rtoStatus === 'pending' && <Clock className="w-3 h-3" />}
                          <span>{ord.rtoStatus.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
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
                          )}

                          {!isPending && (
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

        {/* 5. Pagination */}
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

      {/* 6. Refund Confirmation Modal */}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
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
                <span>Confirm & Refund</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 7. Close / Reject Modal */}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
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
