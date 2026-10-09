import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Warehouse, X, Plus, Minus, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../../store/hooks';
import { adjustStock, AdminProduct, InventoryLog } from '../../../../../store/adminProductsSlice';
import { adminInventoryApi } from '../../../../../api';

interface StockAdjustmentModalProps {
  product: AdminProduct;
  onClose: () => void;
}

const REASONS: InventoryLog['reason'][] = [
  'Manual Audit',
  'New Batch Received',
  'Damaged / Broken',
  'Customer Return',
  'Inventory Count Correction'
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ product, onClose }) => {
  const dispatch = useAppDispatch();
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [reason, setReason] = useState<InventoryLog['reason']>('Manual Audit');
  const [notes, setNotes] = useState('');

  // Body Scroll Lock & Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const resultingStock = Math.max(0, product.stock + adjustmentQty);

  const handleApplyPreset = (delta: number) => {
    setAdjustmentQty((prev) => prev + delta);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentQty === 0) {
      toast.error('Adjustment quantity must not be zero');
      return;
    }

    (async () => {
      try {
        await adminInventoryApi.adjustStock({
          productId: product.id,
          adjustmentQty,
          reason,
          notes: notes.trim() || undefined,
        });
      } catch {
        // local fallback
      }
    })();

    dispatch(adjustStock({
      id: product.id,
      adjustmentQty,
      reason,
      notes: notes.trim() || undefined,
      user: 'Admin'
    }));

    toast.success(`Inventory adjusted: ${product.stock} → ${resultingStock} units!`);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                Adjust Inventory Stock
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {product.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          
          {/* Stock Flow Visualizer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-around text-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Current
              </span>
              <span className="text-2xl font-black text-slate-700">
                {product.stock}
              </span>
            </div>

            <div className="flex flex-col items-center px-3">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                adjustmentQty >= 0 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {adjustmentQty >= 0 ? `+${adjustmentQty}` : adjustmentQty}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 mt-1" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A44101] block mb-0.5">
                New Stock
              </span>
              <span className="text-2xl font-black text-[#A44101]">
                {resultingStock}
              </span>
            </div>
          </div>

          {/* Adjustment Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Adjustment Quantity (+/-)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentQty((prev) => prev - 1)}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <input
                type="number"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(Number(e.target.value) || 0)}
                className="flex-1 text-center font-bold text-lg px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#A44101]"
              />

              <button
                type="button"
                onClick={() => setAdjustmentQty((prev) => prev + 1)}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {[+5, +10, +25, +50, -1, -5, -10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleApplyPreset(delta)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    delta > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAdjustmentQty(-product.stock)}
                className="px-2 py-0.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer ml-auto"
              >
                Zero Out
              </button>
            </div>
          </div>

          {/* Reason Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Adjustment *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal Notes / Reference (PO #, Batch)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Audit by Warehouse Manager, Invoice #204"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#A44101]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Stock Change</span>
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
