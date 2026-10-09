import React, { useEffect } from 'react';
import { AlertTriangle, X, Archive, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../store/hooks';
import { archiveProduct, deleteProduct, AdminProduct } from '../../../../store/adminProductsSlice';

interface ArchiveConfirmDialogProps {
  product: AdminProduct;
  onClose: () => void;
}

export const ArchiveConfirmDialog: React.FC<ArchiveConfirmDialogProps> = ({ product, onClose }) => {
  const dispatch = useAppDispatch();

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

  const handleArchive = () => {
    dispatch(archiveProduct(product.id));
    toast.success(`Product "${product.title}" archived successfully.`);
    onClose();
  };

  const handleDeletePermanent = () => {
    dispatch(deleteProduct(product.id));
    toast.success(`Product "${product.title}" permanently deleted.`);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Archive Product?
              </h3>
              <p className="text-xs text-slate-500">
                SKU: {product.sku}
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

        {/* Content */}
        <div className="p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Are you sure you want to archive <span className="font-bold text-slate-900">"{product.title}"</span>?
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <p>• <strong>Archive</strong>: Hides the product from customer storefront but retains all order history and sales reports.</p>
            <p>• <strong>Delete</strong>: Permanently clears the product and removes it from the catalog.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleDeletePermanent}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer py-1.5 order-2 sm:order-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Confirm Archive</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
