import React, { useEffect, useState } from 'react';
import { Truck, Save, Loader2, AlertCircle } from 'lucide-react';
import { StandardDeliverySettings } from './types';

interface StandardDeliverySettingsCardProps {
  value: StandardDeliverySettings;
  sameDayReady?: boolean;
  saving?: boolean;
  onSave: (next: StandardDeliverySettings) => Promise<void> | void;
}

export const StandardDeliverySettingsCard: React.FC<StandardDeliverySettingsCardProps> = ({
  value,
  sameDayReady = false,
  saving = false,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(value?.enabled !== false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(value?.enabled !== false);
  }, [value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave({ enabled });
    } catch (err: any) {
      setError(err?.message || 'Failed to save Standard delivery settings.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="px-5 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Standard Delivery
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
          <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A]">
              Regular courier via the store&apos;s active shipping partner
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Default checkout option. Turn this off to run Same Day only — checkout then
              confirms only when the delivery pincode is Same Day serviceable.
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-sm font-semibold text-navy">Enable Standard Delivery</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 accent-[#A44101] cursor-pointer"
          />
        </label>

        {!enabled && !sameDayReady ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Standard is off and Same Day is not ready. Checkout will show &quot;not
              available&quot; until Same Day is enabled with pincodes.
            </span>
          </div>
        ) : null}

        {error ? (
          <p className="text-xs font-semibold text-red-600">{error}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Standard</span>
          </button>
        </div>
      </form>
    </div>
  );
};
