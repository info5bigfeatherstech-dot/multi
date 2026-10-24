import React from 'react';
import { Truck, Zap, AlertCircle } from 'lucide-react';
import {
  SameDayOption,
  ShippingSpeed,
  formatHourLabel,
} from './types';

interface CheckoutShippingSpeedCardsProps {
  selected: ShippingSpeed;
  standardCharges: number | null | undefined;
  sameDayOption: SameDayOption;
  standardEnabled?: boolean;
  unavailableMessage?: string | null;
  disabled?: boolean;
  onSelect: (speed: ShippingSpeed) => void;
}

export const CheckoutShippingSpeedCards: React.FC<CheckoutShippingSpeedCardsProps> = ({
  selected,
  standardCharges,
  sameDayOption,
  standardEnabled = true,
  unavailableMessage = null,
  disabled = false,
  onSelect,
}) => {
  const stdOn = standardEnabled !== false;
  const sameDayAvailable = sameDayOption?.available === true;

  if (!stdOn && !sameDayAvailable) {
    return (
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
        <div>
          <p>Not available</p>
          <p className="font-medium text-red-800 mt-1">
            {unavailableMessage ||
              'Same day delivery is not available for this address. Standard delivery is turned off.'}
          </p>
        </div>
      </div>
    );
  }

  if (stdOn && !sameDayAvailable) return null;

  const standardLabel =
    standardCharges != null && Number.isFinite(Number(standardCharges))
      ? `₹${Math.round(Number(standardCharges))}`
      : 'Standard rate';
  const sameDayLabel =
    sameDayOption.deliveryCharges != null
      ? `₹${Math.round(Number(sameDayOption.deliveryCharges))}`
      : 'Quoted at checkout';

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Delivery speed
      </p>
      <div className={`grid grid-cols-1 ${stdOn ? 'sm:grid-cols-2' : ''} gap-3`}>
        {stdOn ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect('standard')}
            className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              selected === 'standard'
                ? 'border-[#A44101] bg-orange-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-navy">Standard</span>
              </div>
              <span className="text-xs font-extrabold text-navy">{standardLabel}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Regular courier via your store&apos;s active shipping partner.
            </p>
          </button>
        ) : null}

        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect('same_day')}
          className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
            selected === 'same_day'
              ? 'border-[#A44101] bg-orange-50/40 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#A44101]" />
              <span className="text-xs font-bold text-navy">Same Day</span>
            </div>
            <span className="text-xs font-extrabold text-[#A44101]">{sameDayLabel}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {sameDayOption.etaLabel || 'Same day'}. Available{' '}
            {formatHourLabel(sameDayOption.openHour, 9)}–
            {formatHourLabel(sameDayOption.cutoffHour, 14)}. Rider is confirmed when we
            ship.
          </p>
        </button>
      </div>
    </div>
  );
};
