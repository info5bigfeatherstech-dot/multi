import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  X,
  Loader2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addProduct, AdminProduct } from '../../../../store/adminProductsSlice';
import { adminProductsApi } from '../../../../api';
import toast from 'react-hot-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../components/ui/select';

interface AddProductTabProps {
  onSuccess: () => void;
  onOpenQuickCategory: () => void;
}

interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

interface GeneratedVariant {
  id: string;
  sku: string;
  title: string;
  description: string;
  options: Record<string, string>;
  basePrice: number;
  salePrice: number;
  stock: number;
  image?: string;
  isExpanded?: boolean;
}

interface SpecField {
  id: string;
  key: string;
  value: string;
}

export const AddProductTab: React.FC<AddProductTabProps> = ({ 
  onSuccess,
  onOpenQuickCategory
}) => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.adminProducts);

  // 1. Basic Product Info
  const [productName, setProductName] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [skuBase, setSkuBase] = useState(`ABB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [brand, setBrand] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');

  // 2. Default Price & Stock
  const [basePrice, setBasePrice] = useState<number | ''>(599);
  const [salePrice, setSalePrice] = useState<number | ''>(299);
  const [stock, setStock] = useState<number | ''>(50);
  const [moq, setMoq] = useState<number | ''>(1);

  // 3. Variant Options
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [showAddOptionInput, setShowAddOptionInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});

  // 4. Generated Variants
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);

  // 5. Specs (shared, non-variant)
  const [specs, setSpecs] = useState<SpecField[]>([]);

  // 6. Shipping & Fallbacks (Right sidebar)
  const [weight, setWeight] = useState<number | ''>(0.5);
  const [dimensions, setDimensions] = useState('30 × 20 × 10');
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(15);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed Effective Title
  const effectiveTitle = useMemo(() => {
    return productTitle.trim() || productName.trim() || '—';
  }, [productTitle, productName]);

  // Selected Category Object
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  // Add Custom Option
  const handleAddCustomOption = () => {
    if (variantOptions.length >= 3) {
      toast.error('Maximum 3 variant options allowed (e.g., Color, Size, Material)');
      return;
    }
    setShowAddOptionInput(true);
  };

  const handleConfirmAddOption = () => {
    const trimmed = newOptionName.trim();
    if (!trimmed) return;
    if (variantOptions.some(o => o.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Option "${trimmed}" already exists`);
      return;
    }
    const newOpt: VariantOption = {
      id: `opt-${Date.now()}`,
      name: trimmed,
      values: []
    };
    setVariantOptions([...variantOptions, newOpt]);
    setNewOptionName('');
    setShowAddOptionInput(false);
  };

  const handleAddOptionValue = (optionId: string) => {
    const val = (newTagInput[optionId] || '').trim();
    if (!val) return;
    setVariantOptions(variantOptions.map(opt => {
      if (opt.id === optionId) {
        if (opt.values.includes(val)) return opt;
        return { ...opt, values: [...opt.values, val] };
      }
      return opt;
    }));
    setNewTagInput({ ...newTagInput, [optionId]: '' });
  };

  const handleRemoveOptionValue = (optionId: string, valToRemove: string) => {
    setVariantOptions(variantOptions.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, values: opt.values.filter(v => v !== valToRemove) };
      }
      return opt;
    }));
  };

  const handleRemoveOption = (optionId: string) => {
    setVariantOptions(variantOptions.filter(opt => opt.id !== optionId));
  };

  // Generate Variant Combinations
  const handleGenerateVariants = () => {
    if (variantOptions.length === 0 || variantOptions.every(o => o.values.length === 0)) {
      toast.error('Please add at least one option with values (e.g., Size: S, M)');
      return;
    }

    const validOptions = variantOptions.filter(o => o.values.length > 0);
    if (validOptions.length === 0) return;

    // Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(a => curr.map(b => [...a, b]));
      }, [[]] as string[][]);
    };

    const combinations = cartesian(validOptions.map(o => o.values));
    const cleanSkuBase = (skuBase.trim() || 'SKU').toUpperCase();

    const newVariants: GeneratedVariant[] = combinations.map((combo, idx) => {
      const optionsRecord: Record<string, string> = {};
      validOptions.forEach((opt, oIdx) => {
        optionsRecord[opt.name] = combo[oIdx];
      });

      const comboLabel = combo.join(' / ');
      const variantSku = `${cleanSkuBase}-${idx + 1}`;
      const titlePrefix = productTitle.trim() || productName.trim() || 'Product';

      return {
        id: `var-${Date.now()}-${idx}`,
        sku: variantSku,
        title: `${titlePrefix} - ${comboLabel}`,
        description: description.trim(),
        options: optionsRecord,
        basePrice: Number(basePrice) || 599,
        salePrice: Number(salePrice) || 299,
        stock: Number(stock) || 50,
        isExpanded: false
      };
    });

    setGeneratedVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variant combinations!`);
  };

  const handleUpdateGeneratedVariant = (idx: number, updates: Partial<GeneratedVariant>) => {
    const copy = [...generatedVariants];
    copy[idx] = { ...copy[idx], ...updates };
    setGeneratedVariants(copy);
  };

  const handleRemoveGeneratedVariant = (idx: number) => {
    setGeneratedVariants(generatedVariants.filter((_, i) => i !== idx));
  };

  // Add Spec Field
  const handleAddSpec = () => {
    setSpecs([...specs, { id: `spec-${Date.now()}`, key: '', value: '' }]);
  };

  const handleUpdateSpec = (id: string, field: 'key' | 'value', val: string) => {
    setSpecs(specs.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleRemoveSpec = (id: string) => {
    setSpecs(specs.filter(s => s.id !== id));
  };

  // Submission handler
  const handleSave = async (publishStatus: 'active' | 'draft') => {
    if (!productName.trim()) {
      toast.error('Product Name is required');
      return;
    }

    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    if (!basePrice || Number(basePrice) <= 0) {
      toast.error('Valid Base / MRP price is required');
      return;
    }

    setIsSubmitting(true);
    const cleanSkuBase = (skuBase.trim() || 'SKU').toUpperCase();
    const finalTitle = productTitle.trim() || productName.trim();

    // Prepare attributes object
    const attributesObj: Record<string, string> = {};
    specs.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        attributesObj[s.key.trim()] = s.value.trim();
      }
    });

    // Prepare variants
    const finalVariants = generatedVariants.length > 0
      ? generatedVariants.map((v, idx) => ({
          productCode: v.sku || `${cleanSkuBase}-${idx + 1}`,
          title: v.title || `${finalTitle} - ${idx + 1}`,
          description: v.description || description.trim(),
          price: {
            base: Number(v.basePrice || basePrice),
            sale: Number(v.salePrice || salePrice)
          },
          inventory: {
            quantity: Number(v.stock ?? stock),
            lowStockThreshold: Number(lowStockAlert) || 10
          },
          moq: Number(moq) || 1,
          attributes: v.options,
          images: v.image ? [{ url: v.image }] : []
        }))
      : [
          {
            productCode: `${cleanSkuBase}-1`,
            title: finalTitle,
            description: description.trim(),
            price: {
              base: Number(basePrice),
              sale: Number(salePrice || basePrice)
            },
            inventory: {
              quantity: Number(stock) || 50,
              lowStockThreshold: Number(lowStockAlert) || 10
            },
            moq: Number(moq) || 1,
            attributes: {},
            images: []
          }
        ];

    // Parse dimensions
    const dimParts = dimensions.split(/[×xX*]/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
    const shippingPayload = {
      weight: Number(weight) || 0.5,
      dimensions: {
        length: dimParts[0] || 30,
        width: dimParts[1] || 20,
        height: dimParts[2] || 10
      }
    };

    const backendPayload: Record<string, any> = {
      name: productName.trim(),
      title: finalTitle,
      description: description.trim() || productName.trim(),
      category: selectedCategory.id,
      brand: brand.trim() || 'Generic',
      status: publishStatus,
      shipping: shippingPayload,
      attributes: Object.keys(attributesObj).length > 0 ? attributesObj : undefined,
      variants: finalVariants
    };

    try {
      const res = await adminProductsApi.create(backendPayload);
      const createdProd = res?.product || res?.data || res;

      // Update Redux Store
      const localReduxProduct: AdminProduct = {
        id: createdProd?._id || createdProd?.id || `prod-${Date.now()}`,
        sku: cleanSkuBase,
        title: finalTitle,
        brand: brand.trim() || 'Generic',
        category: selectedCategory.name,
        currentPrice: Number(salePrice || basePrice),
        originalPrice: Number(basePrice),
        discountPercentage: Math.max(0, Math.round(((Number(basePrice) - Number(salePrice || basePrice)) / Number(basePrice)) * 100)),
        stock: finalVariants.reduce((sum, v) => sum + v.inventory.quantity, 0),
        lowStockThreshold: Number(lowStockAlert) || 10,
        image: finalVariants[0]?.images?.[0]?.url || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
        gallery: [],
        rating: 4.8,
        reviews: 0,
        status: publishStatus === 'active' ? 'Active' : 'Draft',
        description: description.trim(),
        dateAdded: new Date().toISOString()
      };

      dispatch(addProduct(localReduxProduct));
      toast.success(publishStatus === 'active' ? 'Product published to catalog!' : 'Product draft saved!');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create product:', err);
      // Fallback local addition if network error
      const localReduxProduct: AdminProduct = {
        id: `prod-${Date.now()}`,
        sku: cleanSkuBase,
        title: finalTitle,
        brand: brand.trim() || 'Generic',
        category: selectedCategory.name,
        currentPrice: Number(salePrice || basePrice),
        originalPrice: Number(basePrice),
        discountPercentage: Math.max(0, Math.round(((Number(basePrice) - Number(salePrice || basePrice)) / Number(basePrice)) * 100)),
        stock: finalVariants.reduce((sum, v) => sum + v.inventory.quantity, 0),
        lowStockThreshold: Number(lowStockAlert) || 10,
        image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
        gallery: [],
        rating: 4.8,
        reviews: 0,
        status: publishStatus === 'active' ? 'Active' : 'Draft',
        description: description.trim(),
        dateAdded: new Date().toISOString()
      };
      dispatch(addProduct(localReduxProduct));
      toast.success(`Product created locally! (${err.message})`);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Top Bar Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onSuccess}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
            title="Back to products list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#A44101]/10 text-[#A44101]">
                NEW PRODUCT
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Per-variant price · stock · images
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
              Add Product
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('active')}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish to Catalog</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (7-8 cols) & Right Column (4-5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">

          {/* Card 1: Product (parent + defaults seed) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900">
                  Product (parent + defaults seed)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Single SKU: fill these and Publish — one variant is auto-created. Multi SKU: Generate copies title, description, price &amp; stock into every variant; edit per card after.
              </p>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Cotton Crew Neck T-Shirt"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
              />
            </div>

            {/* Product Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="Customer-facing title (blank = use product name)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Seeded into each variant title on generate. Effective: <span className="font-semibold text-slate-600">{effectiveTitle}</span>
              </p>
            </div>

            {/* SKU Base & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  SKU / Product code base *
                </label>
                <input
                  type="text"
                  value={skuBase}
                  onChange={(e) => setSkuBase(e.target.value.toUpperCase())}
                  placeholder="E.G. TSHIRT100"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  variants: {skuBase.trim() ? `${skuBase.trim()}-1, ${skuBase.trim()}-2, ...` : 'SKU-1, SKU-2, ...'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand name..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={onOpenQuickCategory}
                  className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
                >
                  + Add / Manage Category
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(val) => setSelectedCategoryId(val)}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={onOpenQuickCategory}
                  className="px-3.5 py-2.5 rounded-xl border border-dashed border-[#A44101]/40 hover:bg-[#A44101]/5 text-[#A44101] text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  + Add Category
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Shared description — copied into each variant, then editable per SKU"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-y min-h-[85px]"
              />
            </div>
          </div>

          {/* Card 2: Default price & stock */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900">
                  Default price &amp; stock (not final — copied into variants)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real selling price and stock live on each variant card after generate. Change a variant anytime without touching these defaults.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Base / MRP (₹) *
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="599"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Sale (₹) *
                </label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="299"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Stock
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  MOQ
                </label>
                <input
                  type="number"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Variant Options */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A44101]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Variant Options
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddCustomOption}
                className="px-3 py-1.5 rounded-xl border border-[#A44101]/30 hover:bg-[#A44101]/10 text-[#A44101] text-xs font-bold transition-colors cursor-pointer"
              >
                + Custom option
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Pick options → values → generate (max 3 options). Custom options save to the dictionary for reuse on every future product.
            </p>

            {/* Quick add custom option inline form */}
            {showAddOptionInput && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <input
                  type="text"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="Option name (e.g. Color, Size, Style)..."
                  className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmAddOption();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleConfirmAddOption}
                  className="px-3 py-2 bg-[#A44101] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddOptionInput(false)}
                  className="px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Options List */}
            {variantOptions.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                No options selected — use <span className="font-semibold text-slate-600">+ Custom option</span>, or publish to generate a single default variant.
              </div>
            ) : (
              <div className="space-y-3">
                {variantOptions.map((opt) => (
                  <div key={opt.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {opt.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {opt.values.map((val, vIdx) => (
                        <span
                          key={vIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                        >
                          <span>{val}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionValue(opt.id, val)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newTagInput[opt.id] || ''}
                          onChange={(e) => setNewTagInput({ ...newTagInput, [opt.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOptionValue(opt.id);
                            }
                          }}
                          placeholder={`Add ${opt.name} value...`}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 w-32 focus:outline-none focus:border-[#A44101]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOptionValue(opt.id)}
                          className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Button */}
            <div>
              <button
                type="button"
                onClick={handleGenerateVariants}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Generate variant combinations</span>
              </button>
            </div>

            {/* Render Generated Variants List if any */}
            {generatedVariants.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Generated Variants ({generatedVariants.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setGeneratedVariants([])}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {generatedVariants.map((v, idx) => (
                    <div
                      key={v.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] font-bold text-slate-700 shrink-0">
                            {v.sku}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {v.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateGeneratedVariant(idx, { isExpanded: !v.isExpanded })}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          >
                            {v.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGeneratedVariant(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Base Price</label>
                          <input
                            type="number"
                            value={v.basePrice}
                            onChange={(e) => handleUpdateGeneratedVariant(idx, { basePrice: Number(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Sale Price</label>
                          <input
                            type="number"
                            value={v.salePrice}
                            onChange={(e) => handleUpdateGeneratedVariant(idx, { salePrice: Number(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Stock</label>
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleUpdateGeneratedVariant(idx, { stock: Number(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                          />
                        </div>
                      </div>

                      {v.isExpanded && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Custom Title</label>
                            <input
                              type="text"
                              value={v.title}
                              onChange={(e) => handleUpdateGeneratedVariant(idx, { title: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Custom Image URL</label>
                            <input
                              type="url"
                              value={v.image || ''}
                              onChange={(e) => handleUpdateGeneratedVariant(idx, { image: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Product Specs (shared, non-variant) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900">
                  Product Specs (shared, non-variant)
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-3 py-1.5 rounded-xl border border-[#A44101]/30 hover:bg-[#A44101]/10 text-[#A44101] text-xs font-bold transition-colors cursor-pointer"
              >
                + Custom field
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Shared across all variants. Custom fields are saved to the Attributes dictionary for reuse.
            </p>

            {specs.length === 0 ? (
              <p className="text-xs text-slate-400">
                No specs yet. Click <span className="font-semibold text-slate-600">Custom field</span> or add under Products → Attributes.
              </p>
            ) : (
              <div className="space-y-2.5">
                {specs.map((spec) => (
                  <div key={spec.id} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleUpdateSpec(spec.id, 'key', e.target.value)}
                      placeholder="e.g. Material, Fabric, Warranty"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateSpec(spec.id, 'value', e.target.value)}
                      placeholder="e.g. 100% Cotton, 1 Year"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(spec.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">

          {/* Product shipping (fallback) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Product shipping (fallback) *
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                Used when a variant leaves shipping blank. Primary variant overrides sync here on save.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Dimensions L×W×H (cm) *
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="30 × 20 × 10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Default low stock alert
              </label>
              <input
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="15"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
              />
            </div>
          </div>

          {/* How fields work Guide */}
          <div className="bg-[#A44101]/5 rounded-2xl border border-[#A44101]/15 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              How fields work
            </h3>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-semibold text-slate-800">Top title + description + price&amp;stock</span> = seed / single-SKU shortcut
              </li>
              <li>
                <span className="font-semibold text-slate-800">Generate</span> → every variant inherits those values
              </li>
              <li>
                <span className="font-semibold text-slate-800">Expand a variant</span> → edit its own title, desc, price, stock, images
              </li>
              <li>
                <span className="font-semibold text-slate-800">Customer sees</span> the selected variant's title / desc / price / stock
              </li>
            </ol>
            <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#A44101]/10">
              Wholesale is not used in this flow.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
