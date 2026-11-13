import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminSameDayDeliveryApi } from '../../api/adminApi';
import { AdminSameDayOrderDetailView } from './AdminSameDayOrderDetailView';

const SDD_TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type SddTab = (typeof SDD_TABS)[number]['id'];

function formatInr(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDateTime(iso: unknown) {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export const AdminSameDayOrdersPanel: React.FC = () => {
  const [tab, setTab] = useState<SddTab>('pending');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0, limit: 20 });
  const [counts, setCounts] = useState({ pending: 0, shipped: 0, cancelled: 0 });
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await adminSameDayDeliveryApi.getOrdersSummary({ rangePreset: 'all' });
      setSummary(data || null);
      const tabs = data?.countsByTab || {};
      setCounts({
        pending: tabs.pending || 0,
        shipped: tabs.shipped || 0,
        cancelled: tabs.cancelled || 0,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Could not load same-day summary.');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminSameDayDeliveryApi.listOrders({
        tab,
        page,
        limit: 20,
        search: search || undefined,
        rangePreset: 'all',
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
      setPagination(res.pagination || { page: 1, totalPages: 0, total: 0, limit: 20 });
    } catch (err: any) {
      toast.error(err?.message || 'Could not load same-day orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const openOrder = async (orderId: string) => {
    setSelectedId(orderId);
    try {
      const data = await adminSameDayDeliveryApi.getOrder(orderId);
      setSelectedOrder(data);
    } catch (err: any) {
      toast.error(err?.message || 'Could not load order.');
      setSelectedOrder(null);
    }
  };

  const refreshAfterAction = async () => {
    await Promise.all([fetchOrders(), fetchSummary()]);
    if (selectedId) {
      try {
        const data = await adminSameDayDeliveryApi.getOrder(selectedId);
        setSelectedOrder(data);
      } catch {
        /* list refresh is enough */
      }
    }
  };

  const stats = useMemo(() => {
    const t = summary?.totals;
    if (!t) {
      return [
        { label: 'Total orders', value: '—' },
        { label: 'Pending', value: '—' },
        { label: 'Completed', value: '—' },
        { label: 'Revenue', value: '—' },
      ];
    }
    return [
      { label: 'Total orders', value: String(t.totalOrders ?? 0) },
      { label: 'Pending', value: String(t.totalPendingOrders ?? 0) },
      { label: 'Completed', value: String(t.totalCompletedOrders ?? 0) },
      {
        label: 'Revenue',
        value: t.totalRevenueInr != null ? formatInr(t.totalRevenueInr) : '—',
      },
    ];
  }, [summary]);

  if (selectedId) {
    return (
      <AdminSameDayOrderDetailView
        orderId={selectedId}
        initialOrder={selectedOrder}
        onBack={() => {
          setSelectedId(null);
          setSelectedOrder(null);
          fetchOrders();
          fetchSummary();
        }}
        onRefresh={refreshAfterAction}
      />
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#A44101]" />
            Same Day Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pending / shipped / cancelled — ship, cancel, or edit items before ship.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchOrders();
            fetchSummary();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer transition-all disabled:opacity-50 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#A44101] ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Syncing…' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white px-3.5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {stat.label}
            </span>
            <h3 className="text-lg font-black text-navy mt-0.5 leading-tight">
              {summaryLoading && !summary ? '…' : stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex w-full min-w-0 flex-nowrap items-center p-2 border-b border-slate-100 gap-2">
          {SDD_TABS.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => {
                setTab(f.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === f.id
                  ? 'bg-orange-50 text-[#A44101] border border-orange-200'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f.label}
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  tab === f.id ? 'bg-[#A44101] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {counts[f.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search order ID, name, phone, pincode…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput.trim());
                  setPage(1);
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#A44101]"
            />
          </div>
          <button
            type="button"
            className="text-xs font-bold text-[#A44101] px-2 shrink-0"
            onClick={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            Search
          </button>
          <button
            type="button"
            className="text-xs font-medium text-slate-500 px-2 shrink-0"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
          >
            Clear
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No same-day orders in this tab.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[11px] text-slate-500 uppercase tracking-tight">
                  <th className="px-4 py-3 font-bold">Order ID</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                  <th className="px-4 py-3 font-bold text-center">Status</th>
                  <th className="px-4 py-3 font-bold">Pincode</th>
                  <th className="px-4 py-3 font-bold text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((order) => (
                  <tr
                    key={order.orderId}
                    onClick={() => openOrder(order.orderId)}
                    className="hover:bg-orange-50/30 transition-colors text-[13px] text-slate-700 cursor-pointer"
                  >
                    <td className="px-4 py-3.5 text-navy font-semibold">{order.orderId}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{order.name || '—'}</div>
                      <div className="text-xs text-slate-500">{order.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3.5">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold">
                      {formatInr(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center capitalize">
                      {String(order.orderStatus || '').replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">{order.pincode || '—'}</td>
                    <td className="px-4 py-3.5 text-center capitalize">
                      {String(order.paymentStatus || '').replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-600">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="disabled:opacity-40 font-semibold"
            >
              Prev
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
