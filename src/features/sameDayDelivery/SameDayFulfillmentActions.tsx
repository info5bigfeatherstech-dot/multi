import React, { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { adminOrdersApi } from '../../api';
import toast from 'react-hot-toast';

interface SameDayFulfillmentActionsProps {
  order: any;
  onChanged: () => Promise<void> | void;
}

function isSameDay(order: any): boolean {
  const speed = String(order?.shippingSpeed || order?.shippingSnapshot?.shippingSpeed || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return speed === 'same_day';
}

export const SameDayFulfillmentActions: React.FC<SameDayFulfillmentActionsProps> = ({
  order,
  onChanged,
}) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [capBlock, setCapBlock] = useState<any>(null);

  if (!isSameDay(order)) return null;

  const awb = order?.shipmentInfo?.awbCode || order?.shipmentInfo?.trackingNumber;
  const status = String(order?.orderStatus || '').toLowerCase();
  const canShip = !awb && (status === 'confirmed' || status === 'processing');
  const heldAt = order?.shippingSnapshot?.sameDayHoldAt;
  const paid = Number(order?.deliveryCharges);
  const paidLabel = Number.isFinite(paid) ? `₹${Math.round(paid)}` : 'paid shipping';

  const run = async (key: string, fn: () => Promise<any>, successMsg: string) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res && res.success === false) {
        if (res.code === 'SAME_DAY_NO_COURIER_WITHIN_CAP') {
          setCapBlock(res);
          toast.error(res.message || 'No Same Day courier within customer-paid shipping.');
          return;
        }
        toast.error(res.message || 'Same Day action failed');
        return;
      }
      setCapBlock(null);
      toast.success(successMsg);
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Same Day action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleShipNow = () =>
    run(
      'ship',
      async () => {
        const cleanId = String(order.orderId || '').replace(/^#/, '');
        const ensured = await adminOrdersApi.ensureShipment(cleanId);
        if (ensured && ensured.success === false && ensured.code !== 'ALREADY_EXISTS') {
          return ensured;
        }
        return adminOrdersApi.assignShip(cleanId, {});
      },
      'Same Day courier assigned. Customer bill unchanged.'
    );

  const handleHold = () =>
    run(
      'hold',
      () =>
        adminOrdersApi.assignShip(String(order.orderId).replace(/^#/, ''), {
          hold: true,
          reason: 'admin_hold',
          liveRateInr: capBlock?.cheapestLiveInr ?? null,
        }),
      'Shipment held. Retry Ship Now later or cancel/refund.'
    );

  const handleBookAnyway = () => {
    if (
      !window.confirm(
        'Book anyway will charge extra freight from the Shiprocket wallet. Customer bill stays the same. Continue?'
      )
    ) {
      return Promise.resolve();
    }
    return run(
      'anyway',
      () =>
        adminOrdersApi.assignShip(String(order.orderId).replace(/^#/, ''), {
          bookAnyway: true,
        }),
      'Booked over cap. Extra freight is merchant-side only.'
    );
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this Same Day order? Use your usual refund flow after cancel if prepaid.')) {
      return;
    }
    setBusy('cancel');
    try {
      await adminOrdersApi.updateFulfillmentStatus(String(order.orderId).replace(/^#/, ''), 'cancelled');
      setCapBlock(null);
      toast.success('Order cancelled');
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Cancel failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-200/80 shadow-xs p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#A44101] flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Same Day fulfillment</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Customer paid {paidLabel}. Rider is assigned at Ship Now. Extra courier cost is never billed to the customer.
          </p>
        </div>
      </div>

      {heldAt && !awb && (
        <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
          Held {new Date(heldAt).toLocaleString('en-IN')}. Retry Ship Now when a rider is available.
        </p>
      )}

      {capBlock && (
        <div className="text-[11px] bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3 space-y-1">
          <p className="font-semibold text-rose-800">{capBlock.message}</p>
          {capBlock.quotedFreightInr != null && (
            <p className="text-rose-700">
              Customer paid ₹{capBlock.quotedFreightInr}
              {capBlock.cheapestLiveInr != null ? ` · live cheapest ₹${capBlock.cheapestLiveInr}` : ''}
              {capBlock.freightGapInr ? ` · wallet extra ₹${capBlock.freightGapInr}` : ''}
            </p>
          )}
        </div>
      )}

      {awb ? (
        <p className="text-xs font-semibold text-emerald-700">AWB {awb} assigned.</p>
      ) : canShip ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={handleShipNow}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#A44101] text-white text-xs font-bold disabled:opacity-60"
          >
            {busy === 'ship' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Ship now
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={handleHold}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-60"
          >
            {busy === 'hold' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Hold
          </button>
          {capBlock && (
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={handleBookAnyway}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 text-amber-800 text-xs font-bold disabled:opacity-60"
            >
              {busy === 'anyway' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Book anyway
            </button>
          )}
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold disabled:opacity-60"
          >
            {busy === 'cancel' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Cancel / refund
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Confirm the order first, then Ship Now. Partial accept stays on the existing Accept flow.
        </p>
      )}
    </div>
  );
};
