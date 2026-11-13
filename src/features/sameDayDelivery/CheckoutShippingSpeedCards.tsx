import React from 'react';
import { Truck, Zap } from 'lucide-react';
import { DeliveryMode, SameDayOption } from './types';

interface CheckoutShippingSpeedCardsProps {
  selected?: DeliveryMode;
  standardCharges?: number | null;
  sameDayOption?: SameDayOption;
  standardEnabled?: boolean;
  unavailableMessage?: string | null;
  disabled?: boolean;
  onSelect?: (mode: DeliveryMode) => void;
}

export const CheckoutShippingSpeedCards: React.FC<CheckoutShippingSpeedCardsProps> = ({
  selected = 'standard',
  standardCharges = null,
  sameDayOption,
  standardEnabled = true,
  unavailableMessage = null,
  disabled = false,
  onSelect,
}) => {
  const sameDayAvailable = Boolean(sameDayOption?.available);
  if (!sameDayAvailable && !unavailableMessage) {
    return null;
  }

  const standardLabel =
    standardCharges == null
      ? 'Calculated after quote'
      : standardCharges === 0
        ? 'FREE'
        : `₹${Number(standardCharges).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivery option</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {standardEnabled !== false && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.('standard')}
            className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-60 ${
              selected === 'standard'
                ? 'border-[#A44101] bg-orange-50/30 ring-1 ring-[#A44101]/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy">Standard</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Regular courier delivery</p>
                <p className="text-xs font-semibold text-navy mt-1.5">{standardLabel}</p>
              </div>
            </div>
          </button>
        )}

        {sameDayAvailable && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.('same_day')}
            className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer disabled:opacity-60 ${
              selected === 'same_day'
                ? 'border-[#A44101] bg-orange-50/30 ring-1 ring-[#A44101]/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#A44101] shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy">Same Day</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {sameDayOption?.etaLabel || 'Delivered today'}
                </p>
                <p className="text-xs font-semibold text-emerald-700 mt-1.5">
                  FREE · Online payment only
                </p>
              </div>
            </div>
          </button>
        )}
      </div>
      {unavailableMessage && !sameDayAvailable && (
        <p className="text-[11px] text-slate-500">{unavailableMessage}</p>
      )}
    </div>
  );
};
