import React, { useState, useEffect } from 'react';
import { Layers, X, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../../store/hooks';
import { addCategory, updateCategory, AdminCategory } from '../../../../store/adminProductsSlice';

interface QuickCategoryModalProps {
  categoryToEdit?: AdminCategory | null;
  onClose: () => void;
}

export const QuickCategoryModal: React.FC<QuickCategoryModalProps> = ({ categoryToEdit, onClose }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [badge, setBadge] = useState(categoryToEdit?.badge || '');
  const [imageUrl, setImageUrl] = useState(categoryToEdit?.imageUrl || '');
  const [subcategories, setSubcategories] = useState<string[]>(categoryToEdit?.subcategories || []);
  const [newSubInput, setNewSubInput] = useState('');

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

  const handleAddSubcategory = () => {
    const val = newSubInput.trim();
    if (val && !subcategories.includes(val)) {
      setSubcategories([...subcategories, val]);
      setNewSubInput('');
    }
  };

  const handleRemoveSubcategory = (sub: string) => {
    setSubcategories(subcategories.filter((s) => s !== sub));
  };

  const handleKeyDownSub = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubcategory();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (categoryToEdit) {
      dispatch(updateCategory({
        id: categoryToEdit.id,
        updates: {
          name: name.trim(),
          badge: badge.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          subcategories
        }
      }));
      toast.success(`Category "${name}" updated!`);
    } else {
      const generatedId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      dispatch(addCategory({
        id: generatedId,
        name: name.trim(),
        badge: badge.trim() || undefined,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
        subcategories
      }));
      toast.success(`Category "${name}" created with ${subcategories.length} subcategories!`);
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {categoryToEdit ? 'Edit Category' : 'Create New Category'}
              </h3>
              <p className="text-xs text-slate-500">
                Manage department name &amp; nested sub-categories
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Home & Kitchen, Pet Supplies"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badge / Ribbon Tag
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Trending, Bestseller"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#A44101]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Banner Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#A44101]"
              />
            </div>
          </div>

          {/* Subcategories Management */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nested Sub-Categories ({subcategories.length})
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                value={newSubInput}
                onChange={(e) => setNewSubInput(e.target.value)}
                onKeyDown={handleKeyDownSub}
                placeholder="Type sub-category and press Enter..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#A44101]"
              />
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sub</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 min-h-[64px] flex flex-wrap gap-1.5 items-center">
              {subcategories.length === 0 ? (
                <span className="text-xs text-slate-400">
                  No subcategories added yet. Type above to add sub-items.
                </span>
              ) : (
                subcategories.map((sub, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(sub)}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
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
              <span>{categoryToEdit ? 'Save Category' : 'Create Category'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
