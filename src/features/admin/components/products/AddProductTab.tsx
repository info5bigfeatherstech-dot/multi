import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Layers, 
  DollarSign, 
  Boxes, 
  Image as ImageIcon, 
  Sparkles, 
  HelpCircle,
  FolderPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addProduct, ProductVariant, TierPrice } from '../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';

interface AddProductTabProps {
  onSuccess: () => void;
  onOpenQuickCategory: () => void;
}

export const AddProductTab: React.FC<AddProductTabProps> = ({ 
  onSuccess,
  onOpenQuickCategory
}) => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.adminProducts);

  // Accordion active sections
  const [openSections, setOpenSections] = useState({
    general: true,
    pricing: true,
    inventory: true,
    variants: false,
    attributes: false,
    media: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // 1. General Info
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState(`ABB-${Math.floor(100000 + Math.random() * 900000)}`);
  const [brand, setBrand] = useState('Generic');
  const [category, setCategory] = useState(categories[0]?.name || 'Home & Kitchen');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Draft'>('Active');
  const [tag, setTag] = useState('NEW DROP');

  // 2. Pricing
  const [currentPrice, setCurrentPrice] = useState(299);
  const [originalPrice, setOriginalPrice] = useState(599);
  const [costPrice, setCostPrice] = useState(150);
  const [tierPricing, setTierPricing] = useState<TierPrice[]>([
    { minQty: 5, price: 279 },
    { minQty: 10, price: 249 }
  ]);

  // 3. Inventory
  const [stock, setStock] = useState(50);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [binLocation, setBinLocation] = useState('Warehouse Bay A-12');

  // 4. Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // 5. Attributes
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string }>>([
    { key: 'Material', value: 'BPA-free Plastic' },
    { key: 'Warranty', value: '1 Year Brand' }
  ]);

  // 6. Media
  const [mainImage, setMainImage] = useState(
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80'
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
  ]);
  const [newGalleryInput, setNewGalleryInput] = useState('');

  // Selected Category's subcategories
  const currentCategoryObj = categories.find(c => c.name === category);
  const subcategoryList = currentCategoryObj ? currentCategoryObj.subcategories : [];

  // Variant Helpers
  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      name: `Variant ${variants.length + 1}`,
      sku: `${sku}-V${variants.length + 1}`,
      price: currentPrice,
      stock: 25,
      color: 'Default',
      size: 'Standard'
    };
    setVariants([...variants, newVar]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Tier Pricing Helpers
  const handleAddTier = () => {
    setTierPricing([...tierPricing, { minQty: (tierPricing[tierPricing.length - 1]?.minQty || 5) + 5, price: Math.max(1, currentPrice - 50) }]);
  };

  const handleRemoveTier = (index: number) => {
    setTierPricing(tierPricing.filter((_, i) => i !== index));
  };

  // Attribute Helpers
  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  // Gallery URL Helpers
  const handleAddGalleryUrl = () => {
    if (!newGalleryInput.trim()) return;
    setGalleryUrls([...galleryUrls, newGalleryInput.trim()]);
    setNewGalleryInput('');
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Product title is required');
      return;
    }

    if (!sku.trim()) {
      toast.error('SKU is required');
      return;
    }

    if (currentPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    // Convert attributes array to object
    const attributesMap: Record<string, string> = {};
    attributes.forEach(attr => {
      if (attr.key.trim()) {
        attributesMap[attr.key.trim()] = attr.value.trim();
      }
    });

    const discountPercentage = Math.max(
      0,
      Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    );

    const payload = {
      sku: sku.trim(),
      title: title.trim(),
      brand: brand.trim() || 'Generic',
      category,
      subcategory: subcategory || undefined,
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      costPrice: Number(costPrice),
      discountPercentage,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      binLocation: binLocation.trim(),
      image: mainImage.trim(),
      gallery: galleryUrls,
      rating: 4.8,
      reviews: 0,
      status,
      tag: tag.trim() || undefined,
      badges: tag.trim() ? [tag.trim()] : [],
      variants: variants.length > 0 ? variants : undefined,
      tierPricing: tierPricing.length > 0 ? tierPricing : undefined,
      attributes: Object.keys(attributesMap).length > 0 ? attributesMap : undefined,
      description: description.trim()
    };

    dispatch(addProduct(payload));
    toast.success(`Product "${title}" created successfully!`);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top action header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-2 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to All Products"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Create New Catalog Product</h1>
            <p className="text-xs text-slate-500">All data persists locally in Redux Toolkit and LocalStorage</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Publish Product
          </button>
        </div>
      </div>

      {/* 1. General Info Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('general')}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 text-left border-b border-slate-100 font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</div>
            <span>General Information</span>
          </div>
          {openSections.general ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.general && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1000W Smart Multifunctional Blender"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                SKU / Item Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Brand</label>
              <input
                type="text"
                placeholder="e.g. Philips / BoAt / Generic"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">Category</label>
                <button
                  type="button"
                  onClick={onOpenQuickCategory}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] flex items-center gap-1"
                >
                  <FolderPlus className="w-3 h-3" /> Quick Add
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">None / General</option>
                {subcategoryList.map((sc, i) => (
                  <option key={i} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Publish Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Active">Active (Visible in Store)</option>
                <option value="Draft">Draft (Internal Only)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Marketing Badge / Tag</label>
              <input
                type="text"
                placeholder="e.g. HOT DEAL, TRENDING, NEW DROP"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">Description & Highlights</label>
              <textarea
                rows={3}
                placeholder="Key features, specifications, and box contents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Pricing & Tier Pricing Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('pricing')}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 text-left border-b border-slate-100 font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">2</div>
            <span>Pricing, Cost & B2B Tier Pricing</span>
          </div>
          {openSections.pricing ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.pricing && (
          <div className="p-6 space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">MRP / Original Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Internal Cost Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Calculated margin badge */}
            <div className="bg-emerald-50 border border-emerald-200/60 p-3.5 rounded-xl flex items-center justify-between text-emerald-800">
              <span className="font-semibold">Calculated Discount:</span>
              <span className="font-bold">
                {Math.max(0, Math.round(((originalPrice - currentPrice) / originalPrice) * 100))}% OFF
              </span>
            </div>

            {/* Wholesale / Tier Pricing */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-slate-800">Tier Pricing (Quantity Discounts)</h4>
                  <p className="text-[11px] text-slate-500">Provide discounted rates for bulk B2B purchases</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Tier
                </button>
              </div>

              {tierPricing.length === 0 ? (
                <div className="text-slate-400 italic text-center py-2">No tier pricing configured.</div>
              ) : (
                <div className="space-y-2">
                  {tierPricing.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-medium">Min Qty:</span>
                      <input
                        type="number"
                        min="2"
                        value={tier.minQty}
                        onChange={(e) => {
                          const updated = [...tierPricing];
                          updated[idx].minQty = Number(e.target.value);
                          setTierPricing(updated);
                        }}
                        className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                      <span className="text-slate-500 font-medium">Price per unit (₹):</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = [...tierPricing];
                          updated[idx].price = Number(e.target.value);
                          setTierPricing(updated);
                        }}
                        className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-emerald-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Inventory & Warehouse Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('inventory')}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 text-left border-b border-slate-100 font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</div>
            <span>Inventory, Thresholds & Bin Location</span>
          </div>
          {openSections.inventory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.inventory && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Current Initial Stock Qty <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Low-Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Triggers low stock badge if remaining qty &le; threshold</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Warehouse Bin / Shelf Location</label>
              <input
                type="text"
                placeholder="e.g. WH-1 Rack B-04"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Product Variants Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('variants')}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 text-left border-b border-slate-100 font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</div>
            <span>Variants (Sizes, Colors, Sub-SKUs)</span>
          </div>
          {openSections.variants ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.variants && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-slate-500">Configure distinct sizes, colors, and SKU variations</p>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                No variants configured. Product will be sold as a single standard unit.
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, idx) => (
                  <div key={variant.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Variant Name</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Sub-SKU</label>
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Price (₹)</label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleUpdateVariant(idx, 'price', Number(e.target.value))}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Stock</label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg mt-3"
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
      </div>

      {/* 5. Custom Attributes Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('attributes')}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 text-left border-b border-slate-100 font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">5</div>
            <span>Custom Specifications & Attributes</span>
          </div>
          {openSections.attributes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.attributes && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-slate-500">Key specs like Material, Dimensions, Weight, Battery Life, etc.</p>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Spec
              </button>
            </div>

            <div className="space-y-2.5">
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Attribute Name (e.g. Battery Capacity)"
                    value={attr.key}
                    onChange={(e) => {
                      const updated = [...attributes];
                      updated[idx].key = e.target.value;
                      setAttributes(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 5000 mAh)"
                    value={attr.value}
                    onChange={(e) => {
                      const updated = [...attributes];
                      updated[idx].value = e.target.value;
                      setAttributes(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Media & URLs Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('media')}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 text-left border-b border-slate-100 font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold">6</div>
            <span>Media URLs & Gallery</span>
          </div>
          {openSections.media ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {openSections.media && (
          <div className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Main Image URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  required
                  value={mainImage}
                  onChange={(e) => setMainImage(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <img
                  src={mainImage}
                  alt="Preview"
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80';
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1.5">Additional Gallery Images</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  placeholder="Paste image URL here..."
                  value={newGalleryInput}
                  onChange={(e) => setNewGalleryInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {galleryUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    <img 
                      src={url} 
                      alt={`Gallery ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryUrl(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Submit Bar */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onSuccess}
          className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Create & Publish Product
        </button>
      </div>
    </form>
  );
};
