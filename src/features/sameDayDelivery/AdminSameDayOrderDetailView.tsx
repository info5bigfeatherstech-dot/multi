import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminSameDayDeliveryApi } from '../../api/adminApi';

interface AdminSameDayOrderDetailViewProps {
  orderId: string;
  initialOrder?: any;
  onBack: () => void;
  onRefresh?: () => Promise<void> | void;
}

function formatInr(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDateHeader(iso: unknown) {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

function lineIds(line: any) {
  const productId = String(line?.productId?._id || line?.productId || '').trim();
  const variantId = String(line?.variantId?._id || line?.variantId || '').trim();
  return { productId, variantId };
}

function lineImage(line: any) {
  return (
    line?.thumbnailUrl ||
    line?.image ||
    line?.productId?.images?.[0]?.url ||
    line?.productId?.images?.[0] ||
    null
  );
}

function sddStatusLabel(orderStatus: unknown) {
  const s = String(orderStatus || '').toLowerCase();
  if (s === 'confirmed') return 'Pending';
  if (s === 'shipped') return 'Shipped';
  if (s === 'cancelled') return 'Cancelled';
  return s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
}

function statusBadgeClass(orderStatus: unknown) {
  const s = String(orderStatus || '').toLowerCase();
  if (s === 'shipped') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'confirmed') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (s === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatDeliveryAddress(addr: any) {
  if (!addr || typeof addr !== 'object') return '';
  return [
    addr.houseNumber,
    addr.building,
    addr.floor,
    addr.addressLine1,
    addr.addressLine2,
    addr.area,
    addr.landmark,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function SameDayItemEditPanel({
  order,
  orderId,
  disabled,
  onApplied,
}: {
  order: any;
  orderId: string;
  disabled?: boolean;
  onApplied: () => Promise<void> | void;
}) {
  const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order?.items]);
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<any>(null);
  const [localMsg, setLocalMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyPreview, setBusyPreview] = useState(false);
  const [busyApply, setBusyApply] = useState(false);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const line of items) {
      const { productId, variantId } = lineIds(line);
      if (!productId || !variantId) continue;
      next[`${productId}:${variantId}`] = Number(line.quantity) || 0;
    }
    setDraftQty(next);
    setPreview(null);
    setLocalMsg(null);
  }, [orderId, items]);

  const itemUpdates = useMemo(
    () =>
      items
        .map((line: any) => {
          const { productId, variantId } = lineIds(line);
          if (!productId || !variantId) return null;
          const quantity = Number(draftQty[`${productId}:${variantId}`]);
          if (!Number.isFinite(quantity) || quantity < 0) return null;
          return { productId, variantId, quantity: Math.floor(quantity) };
        })
        .filter(Boolean) as Array<{ productId: string; variantId: string; quantity: number }>,
    [items, draftQty]
  );

  const hasChanges = useMemo(
    () =>
      items.some((line: any) => {
        const { productId, variantId } = lineIds(line);
        return Number(draftQty[`${productId}:${variantId}`]) !== Number(line.quantity);
      }),
    [items, draftQty]
  );

  const busy = busyPreview || busyApply || disabled;
  const setQty = (key: string, next: number | string, maxQty: number) => {
    const v = Math.max(0, Math.min(maxQty, Math.floor(Number(next) || 0)));
    setDraftQty((prev) => ({ ...prev, [key]: v }));
    setPreview(null);
  };

  const runPreview = async () => {
    setLocalMsg(null);
    setPreview(null);
    setBusyPreview(true);
    try {
      const data = await adminSameDayDeliveryApi.previewEdit(orderId, itemUpdates);
      setPreview(data);
    } catch (e: any) {
      setLocalMsg({ type: 'err', text: e?.message || 'Preview failed.' });
    } finally {
      setBusyPreview(false);
    }
  };

  const runApply = async () => {
    const refund = Number(preview?.after?.refundInr || preview?.refundInr) || 0;
    if (
      !window.confirm(
        refund > 0.005
          ? `Apply these item changes and refund ${formatInr(refund)} for removed / reduced items?`
          : 'Apply these item quantity changes?'
      )
    ) {
      return;
    }
    setLocalMsg(null);
    setBusyApply(true);
    try {
      const res = await adminSameDayDeliveryApi.applyEdit(orderId, itemUpdates);
      const data = res?.data || {};
      const refundInr = Number(data.refundInr || data.preview?.after?.refundInr) || 0;
      if (res?.refundWarning || data.preview?.refundWarning) {
        toast.error(res?.refundWarning || data.preview?.refundWarning);
      }
      setPreview(null);
      setLocalMsg({
        type: 'ok',
        text:
          res?.message ||
          (data.cancelledEmpty
            ? 'Order cancelled — no items left.'
            : refundInr > 0
              ? `Order updated. Refund ${formatInr(refundInr)} initiated where applicable.`
              : 'Order updated successfully.'),
      });
      toast.success(res?.message || 'Order updated');
      await onApplied();
    } catch (e: any) {
      setLocalMsg({ type: 'err', text: e?.message || 'Update failed.' });
    } finally {
      setBusyApply(false);
    }
  };

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Edit items before ship</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Change quantity or remove a product, then Preview and Apply.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((line: any, idx: number) => {
          const { productId, variantId } = lineIds(line);
          const key = `${productId}:${variantId}`;
          const name = line?.productId?.name || line?.productName || line?.productTitle || 'Product';
          const maxQty = Number(line.quantity) || 0;
          const qty = draftQty[key] ?? maxQty;
          const img = lineImage(line);
          const lineTotal = Number(line?.lineTotal ?? line?.priceSnapshot?.total) || 0;
          const removed = qty === 0;
          return (
            <div
              key={key || idx}
              className={`px-5 py-3 flex flex-wrap items-center gap-3 ${removed ? 'opacity-50 bg-slate-50/80' : ''}`}
            >
              <div className="w-16 h-16 shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{name}</p>
                {removed && (
                  <p className="text-[11px] font-semibold text-red-600 mt-0.5">Will be removed</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    disabled={busy || qty <= 0}
                    onClick={() => setQty(key, qty - 1, maxQty)}
                    className="h-8 w-8 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={maxQty}
                    disabled={busy}
                    value={qty}
                    onChange={(e) => setQty(key, e.target.value, maxQty)}
                    className="w-10 h-8 border-x border-slate-200 text-center text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy || qty >= maxQty}
                    onClick={() => setQty(key, qty + 1, maxQty)}
                    className="h-8 w-8 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="w-[4.5rem] text-right text-sm font-bold text-slate-900">
                  {formatInr(lineTotal)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !hasChanges}
          onClick={runPreview}
          className="px-4 py-2 text-xs font-bold border border-slate-300 text-slate-800 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50"
        >
          {busyPreview ? 'Calculating…' : 'Preview totals'}
        </button>
        <button
          type="button"
          disabled={busy || !hasChanges}
          onClick={runApply}
          className="px-4 py-2 text-xs font-bold bg-navy text-white rounded-xl hover:bg-navy-light disabled:opacity-50"
        >
          {busyApply ? 'Applying…' : 'Apply changes'}
        </button>
      </div>

      {localMsg && (
        <p
          className={`px-5 pb-3 text-xs font-medium ${
            localMsg.type === 'err' ? 'text-red-700' : 'text-emerald-800'
          }`}
        >
          {localMsg.text}
        </p>
      )}

      {preview && (
        <div className="mx-5 mb-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-2 text-xs text-slate-800">
          <p className="font-bold text-blue-900 text-[10px] uppercase tracking-wider">Preview</p>
          {preview.cancelledEmpty ? (
            <p className="font-semibold text-red-800">
              All items removed → order will be cancelled. Refund:{' '}
              {formatInr(preview.after?.refundInr ?? preview.refundInr)}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <p className="text-slate-500">New subtotal</p>
                <p className="font-semibold">{formatInr(preview.after?.subtotal)}</p>
              </div>
              <div>
                <p className="text-slate-500">New total</p>
                <p className="font-semibold">{formatInr(preview.after?.totalAmount)}</p>
              </div>
              <div>
                <p className="text-slate-500">Refund</p>
                <p className="font-semibold">
                  {formatInr(preview.after?.refundInr ?? preview.refundInr)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const AdminSameDayOrderDetailView: React.FC<AdminSameDayOrderDetailViewProps> = ({
  orderId,
  initialOrder,
  onBack,
  onRefresh,
}) => {
  const [order, setOrder] = useState<any>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [actionBusy, setActionBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminSameDayDeliveryApi.getOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      toast.error(err?.message || 'Could not load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const refreshAll = async () => {
    await load();
    if (onRefresh) await onRefresh();
  };

  const isPendingShip = String(order?.orderStatus || '').toLowerCase() === 'confirmed';

  const runShip = async () => {
    if (!window.confirm('Mark this same-day order as shipped?')) return;
    setActionBusy(true);
    try {
      const res = await adminSameDayDeliveryApi.shipOrder(orderId);
      toast.success(res?.message || 'Order marked shipped');
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || 'Ship failed');
    } finally {
      setActionBusy(false);
    }
  };

  const runCancel = async () => {
    if (!window.confirm('Cancel this same-day order and refund the customer?')) return;
    setActionBusy(true);
    try {
      const res = await adminSameDayDeliveryApi.cancelOrder(orderId);
      toast.success(res?.message || 'Order cancelled');
      if (res?.refundWarning) toast.error(res.refundWarning);
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || 'Cancel failed');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading order…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#A44101]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to same day orders
        </button>
        <p className="text-sm text-red-600">Order not found.</p>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const addr = order.addressSnapshot || {};
  const paymentMethodRaw = String(
    order.paymentInfo?.method || order.paymentMethod || 'online'
  ).toLowerCase();
  const paymentMethodLabel =
    paymentMethodRaw === 'cod'
      ? 'Cash on Delivery'
      : paymentMethodRaw.includes('razorpay') || paymentMethodRaw === 'online' || paymentMethodRaw === 'prepaid'
        ? 'Online (Razorpay)'
        : paymentMethodRaw.replace(/_/g, ' ');
  const billTotal = Number(order.totalAmount) || 0;
  const amountPaid = Number(order.amountPaidInr) || 0;
  const balanceDue = Number(
    order.balanceDueInr != null ? order.balanceDueInr : Math.max(0, billTotal - amountPaid)
  );
  const paidAtRaw =
    order.paymentInfo?.paidAt ||
    order.paymentInfo?.sessions?.[0]?.paidAt ||
    null;
  const paidAtLabel = paidAtRaw
    ? formatDateHeader(paidAtRaw)
    : String(order.paymentStatus || '').toLowerCase() === 'paid'
      ? '—'
      : 'Not paid yet';
  const razorpayOrderId =
    order.paymentInfo?.razorpayOrderId ||
    order.paymentInfo?.sessions?.[0]?.razorpayOrderId ||
    '—';
  const razorpayPaymentId =
    order.paymentInfo?.razorpayPaymentId ||
    order.paymentInfo?.sessions?.[0]?.razorpayPaymentId ||
    '—';
  const gatewaySessionStatus = String(
    order.paymentInfo?.status || order.paymentInfo?.sessions?.[0]?.status || order.paymentStatus || '—'
  ).replace(/_/g, ' ');
  const refundStatus = order.returnInfo?.status || null;
  const paymentStatusLower = String(order.paymentStatus || '').toLowerCase();
  const paymentBadgeClass =
    paymentStatusLower === 'paid'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : paymentStatusLower === 'partially_refunded'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : paymentStatusLower === 'refunded'
          ? 'bg-slate-100 text-slate-700 border-slate-200'
          : paymentStatusLower === 'failed'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="space-y-5 animate-fadeIn">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-navy"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to same day orders
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order</p>
          <h2 className="text-xl font-black text-navy tracking-tight">
            #{String(order.orderId || '').replace(/^#/, '')}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-amber-50 text-amber-800 border-amber-200">
              Same Day
            </span>
            <span className="text-xs text-slate-500">{formatDateHeader(order.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center lg:justify-end">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${statusBadgeClass(order.orderStatus)}`}
          >
            {sddStatusLabel(order.orderStatus)}
          </span>
          <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 capitalize">
            {String(order.paymentStatus || '—').replace(/_/g, ' ')}
          </span>
          {isPendingShip && (
            <>
              <button
                type="button"
                disabled={actionBusy}
                onClick={runShip}
                className="px-4 py-2 text-xs font-bold bg-[#A44101] text-white rounded-xl hover:bg-[#8C3701] disabled:opacity-50"
              >
                {actionBusy ? 'Working…' : 'Ship'}
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={runCancel}
                className="px-4 py-2 text-xs font-bold border border-red-300 text-red-800 rounded-xl bg-white hover:bg-red-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5">
          {isPendingShip ? (
            <SameDayItemEditPanel
              order={order}
              orderId={orderId}
              disabled={actionBusy}
              onApplied={refreshAll}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-sm font-bold text-slate-900">Items in this order</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((line: any, idx: number) => {
                  const name =
                    line?.productId?.name || line?.productName || line?.productTitle || 'Product';
                  const img = lineImage(line);
                  const qty = line?.quantity ?? 0;
                  const lineTotal = Number(line?.lineTotal ?? line?.priceSnapshot?.total) || 0;
                  return (
                    <div key={idx} className="px-5 py-3.5 flex gap-4">
                      <div className="w-16 h-16 shrink-0 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Qty {qty}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{formatInr(lineTotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatInr(order.subtotal)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>−{formatInr(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatInr(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Customer & address</h3>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Name</p>
                <p className="font-medium text-slate-900">
                  {addr.fullName || addr.name || order.customer?.name || order.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Phone</p>
                <p className="font-medium text-slate-900">
                  {addr.phone || order.customer?.phone || order.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Email</p>
                <p className="font-medium text-slate-900 break-all">
                  {order.customer?.email || 'No email provided'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Pincode</p>
                <p className="font-medium text-slate-900 font-mono">
                  {order.pincode || addr.postalCode || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-semibold">Delivery address</p>
                <p className="text-slate-700 leading-relaxed text-[13px]">
                  {formatDeliveryAddress(addr) || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <CreditCard className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Payment details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Money paid vs still due</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold border capitalize ${paymentBadgeClass}`}
                >
                  {String(order.paymentStatus || '—').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm py-3.5">
                <span className="text-slate-500">Method</span>
                <span className="font-bold text-slate-900">{paymentMethodLabel}</span>
              </div>

              <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-4 space-y-2.5 my-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Bill total</span>
                  <span className="font-bold text-slate-900">{formatInr(billTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Already paid</span>
                  <span className="font-bold text-blue-600">{formatInr(amountPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">
                    {balanceDue <= 0.01 ? 'All clear' : 'Balance due'}
                  </span>
                  <span className={`font-bold ${balanceDue <= 0.01 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {balanceDue <= 0.01 ? 'Nothing left to collect' : `${formatInr(balanceDue)} to collect`}
                  </span>
                </div>
                {Number(order.tax) > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/80">
                    <span>Tax</span>
                    <span>{formatInr(order.tax)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Delivery</span>
                  <span className="font-semibold text-emerald-700">FREE (Same Day)</span>
                </div>
              </div>

              <div className="space-y-2.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Grand total</span>
                  <span className="text-xl font-bold text-blue-600">{formatInr(billTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Paid at</span>
                  <span className="font-medium text-slate-800">{paidAtLabel}</span>
                </div>
                {refundStatus && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Refund status</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {String(refundStatus).replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Gateway references
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Razorpay order
                </div>
                <div className="font-mono text-xs text-slate-800 break-all select-all mt-0.5">
                  {razorpayOrderId}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Razorpay payment
                </div>
                <div className="font-mono text-xs text-slate-800 break-all select-all mt-0.5">
                  {razorpayPaymentId}
                </div>
              </div>
              <div className="text-xs text-slate-600 pt-0.5">
                Gateway session:{' '}
                <span className="font-semibold text-blue-600 capitalize">{gatewaySessionStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
