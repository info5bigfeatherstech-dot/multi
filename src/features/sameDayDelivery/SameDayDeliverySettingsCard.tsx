import React, { useEffect, useMemo, useState } from 'react';
import { Zap, Save, Loader2 } from 'lucide-react';
import { SameDaySettings } from './types';

interface SameDayDeliverySettingsCardProps {
  value: SameDaySettings;
  saving?: boolean;
  onSave: (next: SameDaySettings) => Promise<void> | void;
}

const EMPTY: SameDaySettings = {
  enabled: false,
  pincodes: [],
  openHour: 9,
  cutoffHour: 14,
  floorFeeInr: 0,
  feeBuffer: 1.2,
  warehouseLat: null,
  warehouseLng: null,
};

export const SameDayDeliverySettingsCard: React.FC<SameDayDeliverySettingsCardProps> = ({
  value,
  saving = false,
  onSave,
}) => {
  const initial = value || EMPTY;
  const [enabled, setEnabled] = useState(Boolean(initial.enabled));
  const [pincodesText, setPincodesText] = useState((initial.pincodes || []).join(', '));
  const [openHour, setOpenHour] = useState(Number(initial.openHour) || 9);
  const [cutoffHour, setCutoffHour] = useState(Number(initial.cutoffHour) || 14);
  const [floorFeeInr, setFloorFeeInr] = useState(
    initial.floorFeeInr != null ? String(initial.floorFeeInr) : '0'
  );
  const [feeBuffer, setFeeBuffer] = useState(
    initial.feeBuffer != null ? String(initial.feeBuffer) : '1.2'
  );
  const [warehouseLat, setWarehouseLat] = useState(
    initial.warehouseLat != null ? String(initial.warehouseLat) : ''
  );
  const [warehouseLng, setWarehouseLng] = useState(
    initial.warehouseLng != null ? String(initial.warehouseLng) : ''
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = value || EMPTY;
    setEnabled(Boolean(next.enabled));
    setPincodesText((next.pincodes || []).join(', '));
    setOpenHour(Number(next.openHour) || 9);
    setCutoffHour(Number(next.cutoffHour) || 14);
    setFloorFeeInr(next.floorFeeInr != null ? String(next.floorFeeInr) : '0');
    setFeeBuffer(next.feeBuffer != null ? String(next.feeBuffer) : '1.2');
    setWarehouseLat(next.warehouseLat != null ? String(next.warehouseLat) : '');
    setWarehouseLng(next.warehouseLng != null ? String(next.warehouseLng) : '');
  }, [value]);

  const pinCount = useMemo(
    () =>
      pincodesText
        .split(/[,;\s]+/)
        .map((p) => p.replace(/\D/g, '').slice(0, 6))
        .filter((p) => p.length === 6).length,
    [pincodesText]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pins = pincodesText
      .split(/[,;\s]+/)
      .map((p) => p.replace(/\D/g, '').slice(0, 6))
      .filter((p) => p.length === 6);
    const open = Number(openHour);
    const cutoff = Number(cutoffHour);
    if (!Number.isFinite(open) || open < 0 || open > 23) {
      setError('Open hour must be between 0 and 23.');
      return;
    }
    if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 23) {
      setError('Cutoff hour must be between 0 and 23.');
      return;
    }
    if (Math.trunc(open) === Math.trunc(cutoff)) {
      setError('Open hour and cutoff hour cannot be the same.');
      return;
    }
    const floor = floorFeeInr.trim() === '' ? 0 : Number(floorFeeInr);
    if (!Number.isFinite(floor) || floor < 0 || floor > 9999) {
      setError('Minimum fee must be between 0 and 9999.');
      return;
    }
    const buf = feeBuffer.trim() === '' ? 1.2 : Number(feeBuffer);
    if (!Number.isFinite(buf) || buf < 1 || buf > 2) {
      setError('Fee buffer must be between 1.0 and 2.0 (1.2 = +20%).');
      return;
    }
    const lat = warehouseLat.trim() === '' ? null : Number(warehouseLat);
    const lng = warehouseLng.trim() === '' ? null : Number(warehouseLng);
    if (lat != null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
      setError('Warehouse latitude must be between -90 and 90.');
      return;
    }
    if (lng != null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
      setError('Warehouse longitude must be between -180 and 180.');
      return;
    }
    try {
      await onSave({
        enabled,
        pincodes: pins,
        openHour: Math.trunc(open),
        cutoffHour: Math.trunc(cutoff),
        floorFeeInr: Math.round((floor + Number.EPSILON) * 100) / 100,
        feeBuffer: Math.round((buf + Number.EPSILON) * 100) / 100,
        warehouseLat: lat,
        warehouseLng: lng,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save Same Day settings.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Same Day Delivery
        </h2>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {enabled ? 'Ready' : 'Off'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-orange-50 flex items-center justify-center text-[#A44101] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">
              Offer Shiprocket Quick at checkout
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Shiprocket checks live Quick serviceability from warehouse + customer
              address. Shop window still applies. If Standard is off, this is the only
              checkout option. Rider is locked at Ship Now, not checkout.
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-sm font-semibold text-navy">Enable Same Day</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#A44101] cursor-pointer"
          />
        </label>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Optional pincode restrict list
          </label>
          <textarea
            value={pincodesText}
            onChange={(e) => setPincodesText(e.target.value)}
            rows={3}
            placeholder="Leave empty — Shiprocket decides. Or 110001, 122001"
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {pinCount === 0
              ? 'No pin filter. Same Day is offered wherever Shiprocket Quick is serviceable.'
              : `Restricted to ${pinCount} pincode(s). Clear the box to use Shiprocket serviceability only.`}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Open hour (IST)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={openHour}
              onChange={(e) => setOpenHour(Number(e.target.value))}
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Cutoff hour (IST)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={cutoffHour}
              onChange={(e) => setCutoffHour(Number(e.target.value))}
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Minimum fee (₹)
            </label>
            <input
              type="number"
              min={0}
              max={9999}
              step="1"
              value={floorFeeInr}
              onChange={(e) => setFloorFeeInr(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Fee buffer (1.2 = +20%)
            </label>
            <input
              type="number"
              min={1}
              max={2}
              step="0.05"
              value={feeBuffer}
              onChange={(e) => setFeeBuffer(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Warehouse lat
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={warehouseLat}
              onChange={(e) => setWarehouseLat(e.target.value)}
              placeholder="19.22"
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Warehouse lng
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={warehouseLng}
              onChange={(e) => setWarehouseLng(e.target.value)}
              placeholder="73.16"
              className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Same Day settings
        </button>
      </form>
    </div>
  );
};
