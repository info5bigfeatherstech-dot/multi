import React from 'react';
import { Zap } from 'lucide-react';
import { isSameDayOrderRecord } from './types';

interface SameDayFulfillmentActionsProps {
  order: any;
  onChanged?: () => Promise<void> | void;
}

/**
 * Quick courier Ship/Hold UI removed. Simple SDD uses the dedicated Same Day Orders panel.
 */
export const SameDayFulfillmentActions: React.FC<SameDayFulfillmentActionsProps> = ({ order }) => {
  if (!isSameDayOrderRecord(order)) return null;

  return (
    <div className="bg-white rounded-2xl border border-orange-200/80 shadow-xs p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#A44101] flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Same Day order</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Ship, cancel, and edit items from the <strong>Same Day Orders</strong> admin panel —
            not from this courier fulfillment card.
          </p>
        </div>
      </div>
    </div>
  );
};
