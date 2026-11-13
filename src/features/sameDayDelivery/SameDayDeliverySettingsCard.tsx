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
};

function parsePincodes(raw: string): string[] {
  return Array.from(
    new Set(
      String(raw || '')
        .split(/[\s,;]+/)
        .map((p) => p.replace(/\D/g, '').slice(0, 6))
        .filter((p) => /^\d{6}$/.test(p))
    )
  ).sort();
}

export const SameDayDeliverySettingsCard: React.FC<SameDayDeliverySettingsCardProps> = ({
  value,
  saving = false,
  onSave,
}) => {
  const initial = value || EMPTY;
  const [enabled, setEnabled] = useState(Boolean(initial.enabled));
  const [pincodesText, setPincodesText] = useState((initial.pincodes || []).join(', '));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = value || EMPTY;
    setEnabled(Boolean(next.enabled));
    setPincodesText((next.pincodes || []).join(', '));
  }, [value]);

  const pinCount = useMemo(() => parsePincodes(pincodesText).length, [pincodesText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pins = parsePincodes(pincodesText);
    try {
      await onSave({
        enabled,
        pincodes: pins,
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
          {enabled ? 'On' : 'Off'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-orange-50 flex items-center justify-center text-[#A44101] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">Offer same day at checkout</p>
            <p className="text-xs text-slate-400 mt-0.5">
              When enabled, eligible pincodes can choose Same Day (online full payment, no
              shipping fee). Standard courier is unchanged.
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
            Eligible pincodes
          </label>
          <textarea
            value={pincodesText}
            onChange={(e) => setPincodesText(e.target.value)}
            rows={4}
            placeholder="110001, 122001, 400001"
            className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#A44101]/20 focus:border-[#A44101]"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {pinCount === 0
              ? 'Add 6-digit pincodes (comma, space, or line separated). Checkout shows Same Day only for these pins.'
              : `${pinCount} pincode(s) will be saved.`}
          </p>
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
