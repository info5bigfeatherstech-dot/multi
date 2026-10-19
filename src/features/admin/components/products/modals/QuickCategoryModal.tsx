import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Upload, 
  ChevronDown, 
  Loader2, 
  GripVertical, 
  Edit2, 
  Trash2, 
  Search, 
  Layers, 
  PlusCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { 
  addCategory, 
  updateCategory, 
  deleteCategory, 
  setCategoriesFromApi, 
  AdminCategory 
} from '../../../../../store/adminProductsSlice';
import { adminCategoriesApi } from '../../../../../api';

interface QuickCategoryModalProps {
  categoryToEdit?: AdminCategory | null;
  onClose: () => void;
}

export const QuickCategoryModal: React.FC<QuickCategoryModalProps> = ({ categoryToEdit, onClose }) => {
  const dispatch = useAppDispatch();
  const reduxCategories = useAppSelector((state) => state.adminProducts.categories);
  
  // Track currently editing category (initialized from prop, but switchable via the list below)
  const [currentEditingCat, setCurrentEditingCat] = useState<AdminCategory | null>(categoryToEdit || null);

  // Form Fields
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [description, setDescription] = useState(categoryToEdit?.description || '');
  const [status, setStatus] = useState<string>(
    (categoryToEdit?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active')
  );
  const [sortOrder, setSortOrder] = useState<number>(categoryToEdit?.order ?? 0);

  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string>(categoryToEdit?.imageUrl || '');
  const cardInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Local ordered categories state for drag & drop
  const [orderedCategories, setOrderedCategories] = useState<AdminCategory[]>(reduxCategories);

  // References for drag and drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const formTopRef = useRef<HTMLDivElement | null>(null);

  // Keep local ordered list in sync with redux state
  useEffect(() => {
    setOrderedCategories(reduxCategories);
  }, [reduxCategories]);

  // Sync state if categoryToEdit changes from outside
  useEffect(() => {
    if (categoryToEdit) {
      handleSelectCategoryToEdit(categoryToEdit);
    }
  }, [categoryToEdit]);

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
    };
  }, [cardPreview]);

  const handleSelectCategoryToEdit = (cat: AdminCategory) => {
    setCurrentEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setStatus(cat.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active');
    setSortOrder(cat.order ?? 0);
    setCardPreview(cat.imageUrl || '');
    setCardImageFile(null);

    // Scroll form into view
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleResetToAddMode = () => {
    setCurrentEditingCat(null);
    setName('');
    setDescription('');
    setStatus('active');
    setSortOrder(orderedCategories.length);
    setCardPreview('');
    setCardImageFile(null);
  };

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCardImageFile(file);
      setCardPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCardImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCardImageFile(null);
    setCardPreview('');
    if (cardInputRef.current) cardInputRef.current.value = '';
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    setDraggedIndex(position);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (position: number) => {
    dragOverItem.current = position;
    setDropTargetIndex(position);
  };

  const handleDragEnd = async () => {
    const fromIndex = dragItem.current;
    const toIndex = dragOverItem.current;

    setDraggedIndex(null);
    setDropTargetIndex(null);
    dragItem.current = null;
    dragOverItem.current = null;

    if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
      return;
    }

    const copyList = [...orderedCategories];
    const draggedItem = copyList[fromIndex];
    copyList.splice(fromIndex, 1);
    copyList.splice(toIndex, 0, draggedItem);

    // Re-index orders
    const updatedList = copyList.map((c, idx) => ({ ...c, order: idx }));
    setOrderedCategories(updatedList);
    dispatch(setCategoriesFromApi(updatedList));

    try {
      await adminCategoriesApi.reorder(
        updatedList.map((c, idx) => ({ id: c.id, order: idx }))
      );
      toast.success('Categories order updated & saved!');
    } catch (err: any) {
      console.warn('Backend reorder notice:', err?.message);
      toast.success('Category position updated locally');
    }
  };

  // Delete Category handler
  const handleDeleteCategory = async (cat: AdminCategory) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(cat.id);
      await adminCategoriesApi.delete(cat.id);
      dispatch(deleteCategory(cat.id));
      setOrderedCategories((prev) => prev.filter((c) => c.id !== cat.id));
      
      if (currentEditingCat?.id === cat.id) {
        handleResetToAddMode();
      }

      toast.success(`Category "${cat.name}" deleted successfully.`);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      toast.error(err?.message || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
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
        formData.append('image', cardImageFile);
      }

      if (currentEditingCat) {
        const res = await adminCategoriesApi.update(currentEditingCat.id, formData);
        const updatedCat = res?.category || res?.data || res;

        dispatch(updateCategory({
          id: currentEditingCat.id,
          updates: {
            name: name.trim(),
            description: description.trim(),
            status: status === 'active' ? 'Active' : 'Inactive',
            order: sortOrder,
            imageUrl: updatedCat?.image?.url || cardPreview || currentEditingCat.imageUrl,
            bannerImageUrl: updatedCat?.bannerImage?.url || currentEditingCat.bannerImageUrl,
          }
        }));

        setOrderedCategories((prev) =>
          prev.map((c) =>
            c.id === currentEditingCat.id
              ? {
                  ...c,
                  name: name.trim(),
                  description: description.trim(),
                  status: status === 'active' ? 'Active' : 'Inactive',
                  order: sortOrder,
                  imageUrl: updatedCat?.image?.url || cardPreview || currentEditingCat.imageUrl,
                  bannerImageUrl: updatedCat?.bannerImage?.url || currentEditingCat.bannerImageUrl,
                }
              : c
          )
        );

        toast.success(`Category "${name}" updated successfully!`);
        handleResetToAddMode();
      } else {
        const res = await adminCategoriesApi.create(formData);
        const createdCat = res?.category || res?.data || res;
        const newId = createdCat?._id || createdCat?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const newCategoryItem: AdminCategory = {
          id: newId,
          name: name.trim(),
          description: description.trim(),
          status: status === 'active' ? 'Active' : 'Inactive',
          order: sortOrder,
          subcategories: [],
          imageUrl: createdCat?.image?.url || cardPreview || undefined,
          bannerImageUrl: createdCat?.bannerImage?.url || undefined,
        };

        dispatch(addCategory(newCategoryItem));
        setOrderedCategories((prev) => [...prev, newCategoryItem]);
        toast.success(`Category "${name}" created successfully!`);
        handleResetToAddMode();
      }

      // Background refetch to sync canonical database documents
      adminCategoriesApi.getAll().then((data) => {
        const rawCats = data?.categories || data?.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          const parentCats = rawCats.filter((c: any) => !c.parent || c.level === 0);
          const childCats = rawCats.filter((c: any) => c.parent && c.level > 0);
          const roots = parentCats.length > 0 ? parentCats : rawCats;

          const mappedCats: AdminCategory[] = roots.map((c: any) => {
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
              status: c.status ? (c.status.charAt(0).toUpperCase() + c.status.slice(1)) : 'Active',
              order: c.order ?? 0,
              badge: c.showInMovingFast ? 'Moving Fast' : undefined,
            };
          });
          dispatch(setCategoriesFromApi(mappedCats));
        }
      }).catch(() => {
        // quiet ignore
      });

    } catch (err: any) {
      console.error('Failed to save category:', err);
      toast.error(err.message || 'Failed to save category. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered categories for bottom list
  const filteredCategories = orderedCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearchQuery.toLowerCase().trim()) ||
    (c.description && c.description.toLowerCase().includes(categorySearchQuery.toLowerCase().trim()))
  );

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 w-full max-w-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn transform-gpu">
        
        {/* Sticky Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#A44101]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentEditingCat ? 'Edit Primary Category' : 'Category Management'}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {orderedCategories.length} Categories
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Create, reorder by dragging, edit or remove categories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container containing Form AND Categories List */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1 divide-y divide-slate-100">
          
          {/* SECTION 1: ADD / EDIT CATEGORY FORM */}
          <div ref={formTopRef} className="space-y-4">
            
            {/* Form Mode Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {currentEditingCat ? `Editing: ${currentEditingCat.name}` : 'Add New Category'}
              </span>
              {currentEditingCat && (
                <button
                  type="button"
                  onClick={handleResetToAddMode}
                  className="text-xs font-bold text-[#A44101] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Switch to Add Category</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  rows={2}
                  placeholder="Summary of wholesale products in this category..."
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-y min-h-[70px]"
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
                      className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all cursor-pointer font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    min={0}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                  />
                </div>
              </div>

              {/* Card Image Upload (cardImage) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Card Image <span className="font-mono text-slate-400 font-normal">(cardImage — Category Grid & Homepage)</span>
                </label>
                <input
                  type="file"
                  ref={cardInputRef}
                  onChange={handleCardImageChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cardInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-[#A44101]/40 bg-white hover:bg-[#A44101]/5 text-slate-700 text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#A44101]" />
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
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 select-none">
                      Card image for shop by category
                    </span>
                  )}
                </div>
              </div>


              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                {currentEditingCat && (
                  <button
                    type="button"
                    onClick={handleResetToAddMode}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{currentEditingCat ? 'Saving...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{currentEditingCat ? 'Save Changes' : 'Create Category'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: ALL CATEGORIES DOWNSCROLL & DRAG-TO-REORDER */}
          <div className="pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>All Categories</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#A44101]">
                    {orderedCategories.length}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Drag the handles (<GripVertical className="w-3 h-3 inline text-slate-400" />) to reorder position. Click edit or delete to manage.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#A44101]"
                />
              </div>
            </div>

            {/* Drag & Drop Categories List */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredCategories.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  No categories found matching "{categorySearchQuery}"
                </div>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const isBeingEdited = currentEditingCat?.id === cat.id;
                  const isDragging = draggedIndex === idx;
                  const isTarget = dropTargetIndex === idx && draggedIndex !== idx;

                  return (
                    <div
                      key={cat.id || idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all select-none ${
                        isBeingEdited
                          ? 'border-[#A44101] bg-orange-50/60 shadow-xs'
                          : isTarget
                            ? 'border-[#A44101] bg-orange-100/50 scale-[1.01]'
                            : isDragging
                              ? 'opacity-40 border-dashed border-slate-300'
                              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Left side: Grip, Index, Thumbnail, Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Drag Handle */}
                        <div 
                          className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-600 transition-colors p-0.5"
                          title="Drag to reposition category"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Order Index Badge */}
                        <span className="w-5 text-[10px] font-mono font-bold text-slate-400 text-center">
                          #{idx + 1}
                        </span>

                        {/* Thumbnail */}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {cat.imageUrl || cat.bannerImageUrl ? (
                            <img
                              src={cat.imageUrl || cat.bannerImageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        {/* Name & Subcategories details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {cat.name}
                            </span>
                            {cat.status?.toLowerCase() === 'inactive' ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500">
                                Inactive
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {cat.subcategories?.length 
                              ? `${cat.subcategories.length} subcategories (${cat.subcategories.slice(0, 3).join(', ')}${cat.subcategories.length > 3 ? '...' : ''})`
                              : '0 subcategories'}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectCategoryToEdit(cat)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isBeingEdited 
                              ? 'bg-[#A44101] text-white' 
                              : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title="Edit this category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete category"
                        >
                          {deletingId === cat.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Total: <strong className="text-slate-800">{orderedCategories.length}</strong> categories configured
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
