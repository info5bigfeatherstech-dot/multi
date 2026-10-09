import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../../store/hooks';
import { updateCategory, setCategoriesFromApi, AdminCategory } from '../../../../../store/adminProductsSlice';
import { adminCategoriesApi } from '../../../../../api';

interface AddSubCategoryModalProps {
  parentCategory: AdminCategory;
  onClose: () => void;
}

const slugifyText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const AddSubCategoryModal: React.FC<AddSubCategoryModalProps> = ({
  parentCategory,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Clean up blob preview
  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    // Automatically generate slug from sub-category name
    if (!isSlugManual) {
      setSlug(slugifyText(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      // If user clears the slug, re-enable auto slugification
      setIsSlugManual(false);
      setSlug(slugifyText(name));
    } else {
      setIsSlugManual(true);
      setSlug(val.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveThumbnail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setThumbnailFile(null);
    setThumbnailPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Sub-category Name is required');
      return;
    }

    const finalSlug = (slug.trim() || slugifyText(name.trim())) || 'sub-category';

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('slug', finalSlug);
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('parent', parentCategory.id);
      formData.append('status', 'active');
      formData.append('order', '0');

      if (thumbnailFile) {
        formData.append('cardImage', thumbnailFile);
        formData.append('thumbnail', thumbnailFile);
        formData.append('image', thumbnailFile);
      }

      await adminCategoriesApi.create(formData);

      // Immediately update local Redux store
      const updatedSubs = Array.from(new Set([...parentCategory.subcategories, name.trim()]));
      dispatch(
        updateCategory({
          id: parentCategory.id,
          updates: { subcategories: updatedSubs },
        })
      );

      toast.success(`Sub-category "${name}" added to "${parentCategory.name}"!`);

      // Refetch full catalog to sync hierarchy
      adminCategoriesApi.getAll().then((data) => {
        const rawCats = data?.categories || data?.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          const parentCats = rawCats.filter((c: any) => !c.parent || c.level === 0);
          const childCats = rawCats.filter((c: any) => c.parent && c.level > 0);

          const mappedCats: AdminCategory[] = parentCats.map((c: any) => {
            const childrenOfCat = childCats.filter(
              (ch: any) => String(ch.parent?._id || ch.parent) === String(c._id || c.id)
            );
            const embeddedSubs = Array.isArray(c.children)
              ? c.children.map((ch: any) => ch.name || ch)
              : c.subcategories || [];
            const directSubNames = childrenOfCat.map((ch: any) => ch.name);
            const allSubs = Array.from(new Set([...embeddedSubs, ...directSubNames]));

            return {
              id: c._id || c.slug || c.id,
              name: c.name,
              description: c.description || '',
              subcategories: allSubs,
              imageUrl: c.image?.url || c.imageUrl,
              bannerImageUrl: c.bannerImage?.url,
              status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Active',
              order: c.order ?? 0,
              badge: c.showInMovingFast ? 'Moving Fast' : undefined,
            };
          });
          dispatch(setCategoriesFromApi(mappedCats));
        }
      }).catch(() => {
        // quiet ignore
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to create sub-category:', err);
      toast.error(err.message || 'Failed to create sub-category');
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
              Add Sub-category
            </h3>
            <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
              Parent ID: <span className="text-slate-600 font-semibold">{parentCategory.id}</span>
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
          {/* Sub-category Name */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Sub-category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="e.g., Variable Refrigerant Flow (VRF)"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
            />
          </div>

          {/* Sub-category Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-slate-800">
                Sub-category Slug
              </label>
              {!isSlugManual && name.trim() && (
                <span className="text-[11px] font-medium text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded-md">
                  Auto-generated
                </span>
              )}
            </div>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="auto-generated-if-empty"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 font-mono focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
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
              placeholder="Commercial and industrial grade VRF systems..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-y min-h-[84px]"
            />
          </div>

          {/* Sub-category Thumbnail */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Sub-category Thumbnail
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[#A44101]/40 bg-white hover:bg-[#A44101]/5 text-slate-700 text-sm font-medium transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4 text-[#A44101]" />
                <span>Upload Image</span>
              </button>

              {thumbnailPreview && (
                <div className="relative flex items-center gap-2 group">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="p-1 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Sub-category</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
