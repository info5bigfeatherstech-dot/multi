import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../../store/hooks';
import { addCategory, updateCategory, setCategoriesFromApi, AdminCategory } from '../../../../../store/adminProductsSlice';
import { adminCategoriesApi } from '../../../../../api';

interface QuickCategoryModalProps {
  categoryToEdit?: AdminCategory | null;
  onClose: () => void;
}

export const QuickCategoryModal: React.FC<QuickCategoryModalProps> = ({ categoryToEdit, onClose }) => {
  const dispatch = useAppDispatch();
  
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [status, setStatus] = useState<string>(
    (categoryToEdit?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active')
  );
  const [sortOrder, setSortOrder] = useState<number>(categoryToEdit?.order ?? 0);

  // Files & Previews
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string>(categoryToEdit?.imageUrl || '');
  const cardInputRef = useRef<HTMLInputElement | null>(null);

  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>(categoryToEdit?.bannerImageUrl || '');
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Body Scroll Lock & Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isSubmitting]);

  // Clean up blob object URLs on unmount
  useEffect(() => {
    return () => {
      if (cardPreview && cardPreview.startsWith('blob:')) {
        URL.revokeObjectURL(cardPreview);
      }
      if (bannerPreview && bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [cardPreview, bannerPreview]);

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCardImageFile(file);
      setCardPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImageFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCardImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCardImageFile(null);
    setCardPreview('');
    if (cardInputRef.current) cardInputRef.current.value = '';
  };

  const handleRemoveBannerImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerImageFile(null);
    setBannerPreview('');
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('status', status.toLowerCase());
      formData.append('order', String(sortOrder));

      if (cardImageFile) {
        formData.append('cardImage', cardImageFile);
        if (!bannerImageFile) {
          formData.append('image', cardImageFile);
        }
      }

      if (bannerImageFile) {
        formData.append('bannerImage', bannerImageFile);
        formData.append('image', bannerImageFile);
      }

      if (categoryToEdit) {
        const res = await adminCategoriesApi.update(categoryToEdit.id, formData);
        const updatedCat = res?.category || res?.data || res;

        dispatch(updateCategory({
          id: categoryToEdit.id,
          updates: {
            name: name.trim(),
            description: description.trim(),
            status: status === 'active' ? 'Active' : 'Inactive',
            order: sortOrder,
            imageUrl: updatedCat?.image?.url || cardPreview || categoryToEdit.imageUrl,
            bannerImageUrl: updatedCat?.bannerImage?.url || bannerPreview || categoryToEdit.bannerImageUrl,
          }
        }));
        toast.success(`Category "${name}" updated successfully!`);
      } else {
        const res = await adminCategoriesApi.create(formData);
        const createdCat = res?.category || res?.data || res;
        const newId = createdCat?._id || createdCat?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        dispatch(addCategory({
          id: newId,
          name: name.trim(),
          description: description.trim(),
          status: status === 'active' ? 'Active' : 'Inactive',
          order: sortOrder,
          subcategories: [],
          imageUrl: createdCat?.image?.url || cardPreview || undefined,
          bannerImageUrl: createdCat?.bannerImage?.url || bannerPreview || undefined,
        }));
        toast.success(`Category "${name}" created successfully!`);
      }

      // Background refetch to sync canonical database documents
      adminCategoriesApi.getAll().then((data) => {
        const rawCats = data?.categories || data?.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          const mappedCats: AdminCategory[] = rawCats.map((c: any) => ({
            id: c._id || c.slug || c.id,
            name: c.name,
            description: c.description || '',
            subcategories: Array.isArray(c.children) ? c.children.map((ch: any) => ch.name || ch) : (c.subcategories || []),
            imageUrl: c.image?.url || c.imageUrl,
            bannerImageUrl: c.bannerImage?.url,
            status: c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1)) : 'Active',
            order: c.order ?? 0,
            badge: c.showInMovingFast ? 'Moving Fast' : undefined,
          }));
          dispatch(setCategoriesFromApi(mappedCats));
        }
      }).catch(() => {
        // quiet ignore
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      toast.error(err.message || 'Failed to save category. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 w-full max-w-[500px] overflow-hidden animate-scaleIn transition-all">
        
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {categoryToEdit ? 'Edit Primary Category' : 'Add Primary Category'}
            </h3>
            <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
              POST /categories/admin/categories
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          
          {/* Category Name */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., HVAC & Air Cooling"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Summary of wholesale products in this category..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-y min-h-[84px]"
            />
          </div>

          {/* Status & Sort Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
              />
            </div>
          </div>

          {/* Card Image */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Card Image (<span className="text-[#A44101] font-mono font-medium">cardImage</span> — Category Grid & Homepage)
            </label>
            <input
              type="file"
              ref={cardInputRef}
              accept="image/*"
              onChange={handleCardImageChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => cardInputRef.current?.click()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[#A44101]/40 bg-white hover:bg-[#A44101]/5 text-slate-700 text-sm font-medium transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4 text-[#A44101]" />
                <span>Choose Card Image</span>
              </button>
              
              {cardPreview ? (
                <div className="relative flex items-center gap-2 group">
                  <img
                    src={cardPreview}
                    alt="Card preview"
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCardImage}
                    className="p-1 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 select-none">
                  Card image for shop by category
                </span>
              )}
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Banner Image (<span className="text-[#A44101] font-mono font-medium">image</span> — Category Header & Detail)
            </label>
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              onChange={handleBannerImageChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[#A44101]/40 bg-white hover:bg-[#A44101]/5 text-slate-700 text-sm font-medium transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4 text-[#A44101]" />
                <span>Choose Banner</span>
              </button>
              
              {bannerPreview ? (
                <div className="relative flex items-center gap-2 group">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-16 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveBannerImage}
                    className="p-1 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 select-none">
                  Optional hero banner
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{categoryToEdit ? 'Saving...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};
