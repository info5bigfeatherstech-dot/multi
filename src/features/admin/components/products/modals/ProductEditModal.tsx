import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Save, 
  Package, 
  DollarSign, 
  Layers, 
  Image as ImageIcon, 
  Warehouse, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { updateProduct, AdminProduct, ProductVariant } from '../../../../../store/adminProductsSlice';
import { adminProductsApi } from '../../../../../api';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../../components/ui/select';

interface ProductEditModalProps {
  product: AdminProduct;
  onClose: () => void;
}

type EditTab = 'general' | 'pricing' | 'inventory' | 'variants' | 'images';

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, onClose }) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.adminProducts.categories);
  const [activeTab, setActiveTab] = useState<EditTab>('general');

  // Form States
  const [title, setTitle] = useState(product.title);
  const [sku, setSku] = useState(product.sku);
  const [brand, setBrand] = useState(product.brand || '');
  const [category, setCategory] = useState(product.category);
  const [subcategory, setSubcategory] = useState(product.subcategory || '');
  const [description, setDescription] = useState(product.description || '');
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Archived'>(product.status);
  const [tag, setTag] = useState(product.tag || '');

  // Pricing
  const [currentPrice, setCurrentPrice] = useState(product.currentPrice);
  const [originalPrice, setOriginalPrice] = useState(product.originalPrice);
  const [costPrice, setCostPrice] = useState(product.costPrice || Math.round(product.currentPrice * 0.6));

  // Inventory
  const [stock, setStock] = useState(product.stock);
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold || 10);
  const [binLocation, setBinLocation] = useState(product.binLocation || '');

  // Images
  const [image, setImage] = useState(product.image);
  const [gallery, setGallery] = useState<string[]>(product.gallery || []);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState(product.currentPrice);
  const [newVariantStock, setNewVariantStock] = useState(10);

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

  // Selected Category's subcategories
  const selectedCatObj = categories.find((c) => c.name === category || c.id === category);
  const subcategoryList = selectedCatObj ? selectedCatObj.subcategories : [];

  const handleAddGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setGallery([...gallery, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGallery(gallery.filter((_, i) => i !== idx));
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) {
      toast.error('Variant name is required');
      return;
    }
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      name: newVariantName.trim(),
      sku: newVariantSku.trim() || `${sku}-${variants.length + 1}`,
      price: Number(newVariantPrice) || currentPrice,
      stock: Number(newVariantStock) || 0
    };
    setVariants([...variants, newVariant]);
    setNewVariantName('');
    setNewVariantSku('');
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Product title is required');
      setActiveTab('general');
      return;
    }

    const calculatedDiscount = originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    (async () => {
      try {
        await adminProductsApi.update(product.sku || product.id, {
          title: title.trim(),
          name: title.trim(),
          description: description.trim(),
          status: status.toLowerCase(),
          brand: brand.trim(),
          category,
          subcategory,
          variants: variants.length > 0 ? variants : [{
            price: Number(currentPrice),
            mrp: Number(originalPrice),
            stock: Number(stock),
            sku: sku.trim()
          }]
        });
      } catch {
        // local redux fallback
      }
    })();

    dispatch(updateProduct({
      id: product.id,
      updates: {
        title: title.trim(),
        sku: sku.trim(),
        brand: brand.trim(),
        category,
        subcategory,
        description: description.trim(),
        status,
        tag: tag.trim(),
        currentPrice: Number(currentPrice),
        originalPrice: Number(originalPrice),
        costPrice: Number(costPrice),
        discountPercentage: calculatedDiscount,
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        binLocation: binLocation.trim(),
        image: image.trim(),
        gallery,
        variants
      }
    }));

    toast.success(`Product "${title}" updated successfully!`);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Edit Product: {product.title}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {product.sku} • ID: {product.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close edit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'general', label: 'General Info', icon: Package },
            { id: 'pricing', label: 'Pricing & Taxes', icon: DollarSign },
            { id: 'inventory', label: 'Inventory', icon: Warehouse },
            { id: 'variants', label: `Variants (${variants.length})`, icon: Layers },
            { id: 'images', label: 'Media & Images', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as EditTab)}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#A44101] text-[#A44101] bg-[#A44101]/5'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Prestige, AutoCare"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <Select
                    value={category}
                    onValueChange={(val) => {
                      setCategory(val);
                      setSubcategory('');
                    }}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm bg-white">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sub-Category
                  </label>
                  <Select
                    value={subcategory || '__none__'}
                    onValueChange={(val) => setSubcategory(val === '__none__' ? '' : val)}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm bg-white">
                      <SelectValue placeholder="None / General" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None / General</SelectItem>
                      {subcategoryList.map((sub, idx) => (
                        <SelectItem key={idx} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publication Status
                  </label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as any)}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active (Visible in Store)</SelectItem>
                      <SelectItem value="Draft">Draft (Hidden)</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Highlight Tag / Badge
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. MEGA DEAL, HOT SELLER, Bestseller"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed specs, features and key benefits..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. PRICING & TAXES TAB */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MRP / Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price / Deal (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#A44101] focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>

              {/* Profit Margin Info Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Customer Discount</span>
                  <div className="text-lg font-black text-emerald-600">
                    {originalPrice > currentPrice
                      ? `${Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF`
                      : '0% (At MRP)'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium">Gross Margin per Unit</span>
                  <div className="text-lg font-black text-navy">
                    ₹{Math.max(0, currentPrice - costPrice)}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      ({currentPrice > 0 ? Math.round(((currentPrice - costPrice) / currentPrice) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium">Applicable GST</span>
                  <div className="text-sm font-bold text-slate-700">18% Included (Standard)</div>
                </div>
              </div>
            </div>
          )}

          {/* 3. INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Warehouse Bin / Shelf Location
                  </label>
                  <input
                    type="text"
                    value={binLocation}
                    onChange={(e) => setBinLocation(e.target.value)}
                    placeholder="e.g. Rack A-12, Bin 3"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>

              {stock <= lowStockThreshold && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Current stock ({stock}) is at or below the low stock threshold ({lowStockThreshold}). This item will trigger automated low-stock warnings.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4. VARIANTS TAB */}
          {activeTab === 'variants' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Variant Title (Size, Color, Model)
                  </label>
                  <input
                    type="text"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder="e.g. 5L Large, Red Matte, 64GB"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Variant SKU
                  </label>
                  <input
                    type="text"
                    value={newVariantSku}
                    onChange={(e) => setNewVariantSku(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <div className="w-full sm:w-24">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <div className="w-full sm:w-20">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3.5 py-2 rounded-lg bg-navy hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No separate variants configured. The main product SKU will be used.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {variants.map((v) => (
                    <div key={v.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{v.name}</span>
                        <span className="text-slate-400 font-mono ml-2">({v.sku})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-700">₹{v.price}</span>
                        <span className="text-slate-500">{v.stock} in stock</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. MEDIA & IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Thumbnail URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    required
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                {image && (
                  <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Gallery Images
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Add secondary image URL..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#A44101]"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(i)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              Changes will immediately synchronize to local database
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};
