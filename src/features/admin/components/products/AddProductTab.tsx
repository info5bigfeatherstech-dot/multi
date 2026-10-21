import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  X,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  RefreshCw,
  Package,
  Info
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

// Global Catalog Dictionary Interface
export interface CatalogAttributeItem {
  id: string;
  name: string;
  type: 'variant' | 'spec';
  suggestedValues: string[];
}

// Active Variant Axis on Product
export interface ActiveVariantAxis {
  id: string;
  name: string;
  selectedValues: string[];
}

// Attribute Pair for Variant or Spec
export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

// Image item for variant
export interface VariantPhotoItem {
  id: string;
  url: string;
  file?: File;
}

// Form Variant Item
export interface FormVariantItem {
  id: string;
  sku: string;
  titleOverride: string;
  description: string;
  attributes: KeyValuePair[];
  basePrice: number | '';
  salePrice: number | '';
  stock: number | '';
  moq: number | '';
  isActive: boolean;
  lowStockAlert: number | '';
  weight: number | '';
  length: number | '';
  width: number | '';
  height: number | '';
  images: VariantPhotoItem[];
  isExpanded: boolean;
}

const STORAGE_CATALOG_KEY = 'abb_catalog_attributes_dict';

// Default Catalog Dictionary Seeds
const DEFAULT_CATALOG_ATTRIBUTES: CatalogAttributeItem[] = [
  // Variant axes
  {
    id: 'attr-color',
    name: 'Color',
    type: 'variant',
    suggestedValues: ['Red', 'Blue', 'Black', 'White', 'Navy', 'Green', 'Grey', 'Beige', 'Yellow', 'Pink']
  },
  {
    id: 'attr-size',
    name: 'Size',
    type: 'variant',
    suggestedValues: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size']
  },
  {
    id: 'attr-material',
    name: 'Material',
    type: 'variant',
    suggestedValues: ['Cotton', 'Polyester', 'Silk', 'Linen', 'Denim', 'Wool', 'Leather']
  },
  {
    id: 'attr-pack',
    name: 'Pack',
    type: 'variant',
    suggestedValues: ['Pack of 1', 'Pack of 2', 'Pack of 3', 'Pack of 4', 'Pack of 5', 'Pack of 10']
  },
  {
    id: 'attr-style',
    name: 'Style',
    type: 'variant',
    suggestedValues: ['Regular Fit', 'Slim Fit', 'Oversized', 'Relaxed', 'Printed']
  },
  // Specifications
  {
    id: 'spec-fit',
    name: 'Fit',
    type: 'spec',
    suggestedValues: ['Regular', 'Slim', 'Relaxed', 'Loose', 'Skinny']
  },
  {
    id: 'spec-care',
    name: 'Care Instructions',
    type: 'spec',
    suggestedValues: ['Machine Wash', 'Hand Wash Only', 'Dry Clean Only', 'Do Not Bleach']
  },
  {
    id: 'spec-country',
    name: 'Country of Origin',
    type: 'spec',
    suggestedValues: ['India', 'USA', 'Germany', 'Japan', 'Vietnam', 'China']
  },
  {
    id: 'spec-fabric',
    name: 'Fabric',
    type: 'spec',
    suggestedValues: ['100% Cotton', 'Cotton Blend', 'Pure Silk', 'Linen', 'Modal', 'Rayon']
  },
  {
    id: 'spec-pattern',
    name: 'Pattern',
    type: 'spec',
    suggestedValues: ['Solid', 'Striped', 'Printed', 'Checked', 'Graphic', 'Textured']
  },
  {
    id: 'spec-occasion',
    name: 'Occasion',
    type: 'spec',
    suggestedValues: ['Casual', 'Formal', 'Party', 'Sports', 'Ethnic', 'Workwear']
  },
  {
    id: 'spec-gender',
    name: 'Gender',
    type: 'spec',
    suggestedValues: ['Men', 'Women', 'Unisex', 'Kids', 'Boys', 'Girls']
  },
  {
    id: 'spec-warranty',
    name: 'Warranty',
    type: 'spec',
    suggestedValues: ['No Warranty', '6 Months', '1 Year', '2 Years', 'Lifetime Limited']
  }
];

export const AddProductTab: React.FC<AddProductTabProps> = ({ 
  onSuccess,
  onOpenQuickCategory
}) => {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.adminProducts);

  // File Input References for Variant Photos
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // 1. Basic Parent Fields
  const [productName, setProductName] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [skuBase, setSkuBase] = useState(`ABB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [brand, setBrand] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');

  // 2. Default Price & Stock Seeds
  const [basePrice, setBasePrice] = useState<number | ''>(300);
  const [salePrice, setSalePrice] = useState<number | ''>(200);
  const [stock, setStock] = useState<number | ''>(20);
  const [moq, setMoq] = useState<number | ''>(10);
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(5);
  const [hsnCode, setHsnCode] = useState('1324');
  const [gstRate, setGstRate] = useState('3');
  const [trackInventory, setTrackInventory] = useState(true);

  // 3. Default Shipping
  const [weight, setWeight] = useState<number | ''>(0.5);
  const [length, setLength] = useState<number | ''>(30);
  const [width, setWidth] = useState<number | ''>(20);
  const [height, setHeight] = useState<number | ''>(10);

  // 4. Catalog Attribute Dictionary (variant axes & specs)
  const [catalogDict, setCatalogDict] = useState<CatalogAttributeItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CATALOG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load catalog dictionary from localStorage:', e);
    }
    return DEFAULT_CATALOG_ATTRIBUTES;
  });

  // Save dictionary to localStorage
  const saveCatalogDict = (updated: CatalogAttributeItem[]) => {
    setCatalogDict(updated);
    try {
      localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist catalog dictionary:', e);
    }
  };

  // 5. Active Variant Option Axes for this product (Max 3)
  const [activeAxes, setActiveAxes] = useState<ActiveVariantAxis[]>([]);
  const [newAxisCustomName, setNewAxisCustomName] = useState('');
  const [newAxisValues, setNewAxisValues] = useState('');
  const [showAddAxisModal, setShowAddAxisModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});

  // 6. Variants List
  const [variants, setVariants] = useState<FormVariantItem[]>([]);

  // 7. Product-level Specs (non-variant, shared)
  const [specs, setSpecs] = useState<KeyValuePair[]>([]);
  const [customSpecKey, setCustomSpecKey] = useState('');
  const [showAddSpecInput, setShowAddSpecInput] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed Effective Customer-facing Title
  const effectiveTitle = useMemo(() => {
    return productTitle.trim() || productName.trim() || '—';
  }, [productTitle, productName]);

  // Selected Category Object
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  // Available variant axes from catalog dictionary
  const availableVariantAxes = useMemo(() => {
    return catalogDict.filter(item => item.type === 'variant');
  }, [catalogDict]);

  // Available spec types from catalog dictionary
  const availableSpecItems = useMemo(() => {
    return catalogDict.filter(item => item.type === 'spec');
  }, [catalogDict]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      variants.forEach(v => {
        v.images.forEach(img => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
      });
    };
  }, [variants]);

  // --- CATALOG AXIS MANAGEMENT ---

  // Add an existing catalog axis to active axes
  const handleToggleAddAxis = (axisName: string) => {
    if (activeAxes.some(a => a.name.toLowerCase() === axisName.toLowerCase())) {
      // Remove
      setActiveAxes(activeAxes.filter(a => a.name.toLowerCase() !== axisName.toLowerCase()));
      return;
    }
    if (activeAxes.length >= 3) {
      toast.error('Maximum 3 active variant option axes allowed (e.g. Color, Size, Material)');
      return;
    }
    const catItem = catalogDict.find(c => c.name.toLowerCase() === axisName.toLowerCase() && c.type === 'variant');
    const newActive: ActiveVariantAxis = {
      id: `axis-${Date.now()}`,
      name: catItem?.name || axisName,
      selectedValues: []
    };
    setActiveAxes([...activeAxes, newActive]);
  };

  // Add custom new axis on-the-fly and persist to dictionary
  const handleCreateCustomAxis = () => {
    const trimmed = newAxisCustomName.trim();
    if (!trimmed) {
      toast.error('Option name is required');
      return;
    }
    const parsedValues = newAxisValues
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    if (parsedValues.length === 0) {
      toast.error('At least one value is required (comma-separated)');
      return;
    }

    if (activeAxes.length >= 3 && !activeAxes.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Maximum 3 variant options allowed');
      return;
    }

    // Check if exists in catalog
    const existing = catalogDict.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === 'variant');
    if (!existing) {
      const newCatItem: CatalogAttributeItem = {
        id: `attr-${Date.now()}`,
        name: trimmed,
        type: 'variant',
        suggestedValues: parsedValues
      };
      saveCatalogDict([...catalogDict, newCatItem]);
    } else {
      const merged = Array.from(new Set([...existing.suggestedValues, ...parsedValues]));
      const updatedDict = catalogDict.map(item => 
        item.name.toLowerCase() === trimmed.toLowerCase() && item.type === 'variant'
          ? { ...item, suggestedValues: merged }
          : item
      );
      saveCatalogDict(updatedDict);
    }

    if (!activeAxes.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
      setActiveAxes([...activeAxes, {
        id: `axis-${Date.now()}`,
        name: trimmed,
        selectedValues: parsedValues
      }]);
    } else {
      setActiveAxes(activeAxes.map(a => 
        a.name.toLowerCase() === trimmed.toLowerCase()
          ? { ...a, selectedValues: Array.from(new Set([...a.selectedValues, ...parsedValues])) }
          : a
      ));
    }
    setNewAxisCustomName('');
    setNewAxisValues('');
    setShowAddAxisModal(false);
    toast.success(`Option "${trimmed}" added with ${parsedValues.length} value(s)!`);
  };

  // Toggle value pill selection for an axis
  const handleToggleAxisValue = (axisId: string, val: string) => {
    setActiveAxes(prev => prev.map(axis => {
      if (axis.id === axisId) {
        const isSelected = axis.selectedValues.includes(val);
        const updatedValues = isSelected 
          ? axis.selectedValues.filter(v => v !== val)
          : [...axis.selectedValues, val];
        return { ...axis, selectedValues: updatedValues };
      }
      return axis;
    }));
  };

  // Add new value to an axis (persists to catalog dictionary suggested values too)
  const handleAddValueToAxis = (axisId: string) => {
    const rawVal = (newTagInput[axisId] || '').trim();
    if (!rawVal) return;

    const targetAxis = activeAxes.find(a => a.id === axisId);
    if (!targetAxis) return;

    // Update active axis selected values
    setActiveAxes(prev => prev.map(axis => {
      if (axis.id === axisId) {
        if (!axis.selectedValues.includes(rawVal)) {
          return { ...axis, selectedValues: [...axis.selectedValues, rawVal] };
        }
      }
      return axis;
    }));

    // Persist suggested value into catalog dictionary if not already there
    const updatedDict = catalogDict.map(item => {
      if (item.name.toLowerCase() === targetAxis.name.toLowerCase() && item.type === 'variant') {
        if (!item.suggestedValues.includes(rawVal)) {
          return { ...item, suggestedValues: [...item.suggestedValues, rawVal] };
        }
      }
      return item;
    });
    saveCatalogDict(updatedDict);

    setNewTagInput({ ...newTagInput, [axisId]: '' });
  };

  const handleRemoveActiveAxis = (axisId: string) => {
    setActiveAxes(activeAxes.filter(a => a.id !== axisId));
  };

  // --- CARTESIAN VARIANT GENERATION ---
  const handleGenerateVariants = () => {
    // Validate top defaults
    const topBasePrice = Number(basePrice);
    const topSalePrice = Number(salePrice);

    if (isNaN(topBasePrice) || topBasePrice <= 0) {
      toast.error('Default Base / MRP price must be greater than 0');
      return;
    }
    if (isNaN(topSalePrice) || topSalePrice <= 0) {
      toast.error('Default Sale Price must be greater than 0');
      return;
    }
    if (topSalePrice >= topBasePrice) {
      toast.error('Default Sale Price must be strictly less than Default MRP');
      return;
    }
    if (!weight || Number(weight) <= 0) {
      toast.error('Default Weight (kg) must be greater than 0');
      return;
    }
    if (!length || !width || !height || Number(length) <= 0 || Number(width) <= 0 || Number(height) <= 0) {
      toast.error('Default Length, Width, and Height (cm) must be greater than 0');
      return;
    }

    const cleanSkuBase = (skuBase.trim() || 'PROD').toUpperCase();
    const finalTitle = productTitle.trim() || productName.trim() || 'Product';

    const validAxes = activeAxes.filter(a => a.selectedValues.length > 0);

    // Single-SKU Shortcut: If no axes configured or none have values
    if (validAxes.length === 0) {
      const singleVariant: FormVariantItem = {
        id: `var-${Date.now()}-0`,
        sku: `${cleanSkuBase}-1`,
        titleOverride: '',
        description: description.trim(),
        attributes: [],
        basePrice: topBasePrice,
        salePrice: topSalePrice,
        stock: Number(stock) || 50,
        moq: Number(moq) || 1,
        isActive: true,
        lowStockAlert: Number(lowStockAlert) || 15,
        weight: Number(weight) || 0.5,
        length: Number(length) || 30,
        width: Number(width) || 20,
        height: Number(height) || 10,
        images: [],
        isExpanded: true
      };
      setVariants([singleVariant]);
      toast.success('Single SKU variant created with top defaults!');
      return;
    }

    // Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(a => curr.map(b => [...a, b]));
      }, [[]] as string[][]);
    };

    const combinations = cartesian(validAxes.map(a => a.selectedValues));

    if (combinations.length > 100) {
      toast.error(`Cannot generate ${combinations.length} variants! Maximum allowed is 100.`);
      return;
    }

    const newVariants: FormVariantItem[] = combinations.map((combo, idx) => {
      const attrPairs: KeyValuePair[] = validAxes.map((axis, aIdx) => ({
        id: `attr-${Date.now()}-${idx}-${aIdx}`,
        key: axis.name,
        value: combo[aIdx]
      }));

      const comboLabel = combo.join(' / ');
      const variantSku = `${cleanSkuBase}-${idx + 1}`;

      return {
        id: `var-${Date.now()}-${idx}`,
        sku: variantSku,
        titleOverride: `${finalTitle} - ${comboLabel}`,
        description: description.trim(),
        attributes: attrPairs,
        basePrice: topBasePrice,
        salePrice: topSalePrice,
        stock: Number(stock) || 50,
        moq: Number(moq) || 1,
        isActive: true,
        lowStockAlert: Number(lowStockAlert) || 15,
        weight: Number(weight) || 0.5,
        length: Number(length) || 30,
        width: Number(width) || 20,
        height: Number(height) || 10,
        images: [],
        isExpanded: idx === 0 // expand first variant by default
      };
    });

    setVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variant combinations!`);
  };

  // Apply Top Defaults to All Variants without losing unique attributes or images
  const handleApplyTopDefaultsToAll = () => {
    if (variants.length === 0) {
      toast.error('No variants exist yet. Click Generate Variants first.');
      return;
    }

    const topBasePrice = Number(basePrice) || 599;
    const topSalePrice = Number(salePrice) || 299;
    const topStock = Number(stock) || 50;
    const topMoq = Number(moq) || 1;
    const topLowStock = Number(lowStockAlert) || 15;
    const topWeight = Number(weight) || 0.5;
    const topLength = Number(length) || 30;
    const topWidth = Number(width) || 20;
    const topHeight = Number(height) || 10;
    const topDesc = description.trim();

    setVariants(prev => prev.map(v => ({
      ...v,
      basePrice: topBasePrice,
      salePrice: topSalePrice,
      stock: topStock,
      moq: topMoq,
      lowStockAlert: topLowStock,
      description: topDesc || v.description,
      weight: topWeight,
      length: topLength,
      width: topWidth,
      height: topHeight
    })));

    toast.success(`Pushed top defaults to all ${variants.length} variants!`);
  };

  // Add an individual variant card manually
  const handleAddManualVariant = () => {
    const cleanSkuBase = (skuBase.trim() || 'PROD').toUpperCase();
    const nextIndex = variants.length + 1;
    const finalTitle = productTitle.trim() || productName.trim() || 'Product';

    const newVar: FormVariantItem = {
      id: `var-${Date.now()}-${nextIndex}`,
      sku: `${cleanSkuBase}-${nextIndex}`,
      titleOverride: `${finalTitle} - ${nextIndex}`,
      description: description.trim(),
      attributes: [],
      basePrice: Number(basePrice) || 599,
      salePrice: Number(salePrice) || 299,
      stock: Number(stock) || 50,
      moq: Number(moq) || 1,
      isActive: true,
      lowStockAlert: Number(lowStockAlert) || 15,
      weight: Number(weight) || 0.5,
      length: Number(length) || 30,
      width: Number(width) || 20,
      height: Number(height) || 10,
      images: [],
      isExpanded: true
    };
    setVariants([...variants, newVar]);
    toast.success(`Added Variant ${nextIndex}`);
  };

  // Update variant field
  const updateVariant = (idx: number, updates: Partial<FormVariantItem>) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  // Remove variant
  const handleRemoveVariant = (idx: number) => {
    if (idx === 0) {
      toast.error('Primary variant (Variant 1) cannot be deleted');
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  // Add attribute pair to a variant
  const handleAddVariantAttr = (varIdx: number, defaultKey = '') => {
    const currentAttrs = variants[varIdx].attributes;
    if (currentAttrs.length >= 8) {
      toast.error('Maximum 8 attribute pairs per variant');
      return;
    }
    const updated = [...currentAttrs, { id: `attr-${Date.now()}-${Math.random()}`, key: defaultKey, value: '' }];
    updateVariant(varIdx, { attributes: updated });
  };

  const handleUpdateVariantAttr = (varIdx: number, attrIdx: number, field: 'key' | 'value', val: string) => {
    const currentAttrs = [...variants[varIdx].attributes];
    currentAttrs[attrIdx] = { ...currentAttrs[attrIdx], [field]: val };
    updateVariant(varIdx, { attributes: currentAttrs });
  };

  const handleRemoveVariantAttr = (varIdx: number, attrIdx: number) => {
    const currentAttrs = variants[varIdx].attributes.filter((_, i) => i !== attrIdx);
    updateVariant(varIdx, { attributes: currentAttrs });
  };

  // Image Upload handler for a variant
  const handleVariantPhotoUpload = (varIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentPhotos = [...variants[varIdx].images];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxFileSize = 8 * 1024 * 1024; // 8MB

    const newPhotos: VariantPhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      if (currentPhotos.length + newPhotos.length >= 4) {
        toast.error('Maximum 4 photos allowed per variant');
        break;
      }
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid format for ${file.name}. Only JPG, PNG, WEBP, GIF allowed.`);
        continue;
      }
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is larger than 8MB`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        id: `img-${Date.now()}-${i}`,
        url: previewUrl,
        file: file
      });
    }

    if (newPhotos.length > 0) {
      updateVariant(varIdx, { images: [...currentPhotos, ...newPhotos] });
      toast.success(`Added ${newPhotos.length} photo(s)`);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveVariantPhoto = (varIdx: number, photoIdx: number) => {
    const currentPhotos = [...variants[varIdx].images];
    const target = currentPhotos[photoIdx];
    if (target?.url && target.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url);
    }
    const updated = currentPhotos.filter((_, i) => i !== photoIdx);
    updateVariant(varIdx, { images: updated });
  };

  // --- SPECIFICATIONS MANAGEMENT (Shared Specs) ---
  const handleAddSpecFromCatalog = (specName: string) => {
    if (specs.some(s => s.key.toLowerCase() === specName.toLowerCase())) {
      toast.error(`Specification "${specName}" is already added`);
      return;
    }
    setSpecs([...specs, { id: `spec-${Date.now()}`, key: specName, value: '' }]);
  };

  const handleAddCustomSpec = () => {
    const trimmed = customSpecKey.trim();
    if (!trimmed) return;
    if (specs.some(s => s.key.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Specification "${trimmed}" is already added`);
      return;
    }

    // Save to catalog dictionary if not exists
    if (!catalogDict.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === 'spec')) {
      const newSpecItem: CatalogAttributeItem = {
        id: `spec-${Date.now()}`,
        name: trimmed,
        type: 'spec',
        suggestedValues: []
      };
      saveCatalogDict([...catalogDict, newSpecItem]);
    }

    setSpecs([...specs, { id: `spec-${Date.now()}`, key: trimmed, value: '' }]);
    setCustomSpecKey('');
    setShowAddSpecInput(false);
  };

  const handleUpdateSpec = (id: string, field: 'key' | 'value', val: string) => {
    setSpecs(specs.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleRemoveSpec = (id: string) => {
    setSpecs(specs.filter(s => s.id !== id));
  };

  // --- VALIDATION & SUBMISSION ---
  const handleSave = async (publishStatus: 'active' | 'draft') => {
    // 1. Validate Parent Fields
    if (!productName.trim()) {
      toast.error('Product Name is required');
      return;
    }
    if (!description.trim()) {
      toast.error('Product Description is required');
      return;
    }
    if (!selectedCategory) {
      toast.error('Please select a Category');
      return;
    }
    const cleanSkuBase = (skuBase.trim() || 'PROD').toUpperCase();

    const topBasePriceNum = Number(basePrice);
    const topSalePriceNum = Number(salePrice);
    if (!topBasePriceNum || topBasePriceNum <= 0) {
      toast.error('Valid Default Base / MRP price is required');
      return;
    }
    if (!topSalePriceNum || topSalePriceNum <= 0) {
      toast.error('Valid Default Sale price is required');
      return;
    }
    if (topSalePriceNum >= topBasePriceNum) {
      toast.error('Default Sale Price must be strictly less than Default MRP');
      return;
    }

    const topWeightNum = Number(weight);
    const topLengthNum = Number(length);
    const topWidthNum = Number(width);
    const topHeightNum = Number(height);
    if (!topWeightNum || topWeightNum <= 0) {
      toast.error('Default Weight (kg) must be greater than 0');
      return;
    }
    if (!topLengthNum || !topWidthNum || !topHeightNum || topLengthNum <= 0 || topWidthNum <= 0 || topHeightNum <= 0) {
      toast.error('Default Dimensions (Length, Width, Height) must all be greater than 0');
      return;
    }

    // 2. Resolve Variants (Single-SKU shortcut if none created)
    let finalVariantsList: FormVariantItem[] = variants;
    if (finalVariantsList.length === 0) {
      finalVariantsList = [{
        id: `var-${Date.now()}-0`,
        sku: `${cleanSkuBase}-1`,
        titleOverride: '',
        description: description.trim(),
        attributes: [],
        basePrice: topBasePriceNum,
        salePrice: topSalePriceNum,
        stock: Number(stock) || 50,
        moq: Number(moq) || 1,
        isActive: true,
        lowStockAlert: Number(lowStockAlert) || 15,
        weight: topWeightNum,
        length: topLengthNum,
        width: topWidthNum,
        height: topHeightNum,
        images: [],
        isExpanded: true
      }];
    }

    // 3. Validate Each Variant
    for (let i = 0; i < finalVariantsList.length; i++) {
      const v = finalVariantsList[i];
      const vLabel = `Variant ${i + 1} (${v.sku})`;

      const vBase = Number(v.basePrice);
      const vSale = Number(v.salePrice);

      if (isNaN(vBase) || vBase <= 0) {
        toast.error(`${vLabel}: Base MRP must be greater than 0`);
        return;
      }
      if (isNaN(vSale) || vSale <= 0) {
        toast.error(`${vLabel}: Sale Price must be greater than 0`);
        return;
      }
      if (vSale >= vBase) {
        toast.error(`${vLabel}: Sale Price (₹${vSale}) must be strictly less than Base MRP (₹${vBase})`);
        return;
      }

      // Check attribute pairs (no half-filled pairs)
      for (let a = 0; a < v.attributes.length; a++) {
        const pair = v.attributes[a];
        const hasKey = pair.key.trim().length > 0;
        const hasVal = pair.value.trim().length > 0;
        if ((hasKey && !hasVal) || (!hasKey && hasVal)) {
          toast.error(`${vLabel}: Attribute pair #${a + 1} is partially filled. Both Name and Value are required.`);
          return;
        }
      }

      // Validate Variant Shipping (all 4 filled or all 4 empty)
      const hasAnyShipping = v.weight !== '' || v.length !== '' || v.width !== '' || v.height !== '';
      const hasAllShipping = v.weight !== '' && v.length !== '' && v.width !== '' && v.height !== '' &&
                             Number(v.weight) > 0 && Number(v.length) > 0 && Number(v.width) > 0 && Number(v.height) > 0;
      if (hasAnyShipping && !hasAllShipping) {
        toast.error(`${vLabel}: All 4 shipping values (Weight, Length, Width, Height) must be filled to override, or leave all 4 empty to use defaults.`);
        return;
      }
    }

    // 4. Duplicate Attribute Combinations Check across variants
    const seenSignatures = new Map<string, number>();
    for (let i = 0; i < finalVariantsList.length; i++) {
      const v = finalVariantsList[i];
      const validPairs = v.attributes.filter(a => a.key.trim() && a.value.trim());
      if (validPairs.length > 0) {
        const sig = validPairs
          .map(a => `${a.key.trim().toLowerCase()}=${a.value.trim().toLowerCase()}`)
          .sort()
          .join('|');
        if (seenSignatures.has(sig)) {
          const prevIdx = seenSignatures.get(sig)!;
          toast.error(`Variant ${i + 1} and Variant ${prevIdx + 1} have duplicate attribute combinations (${sig})`);
          return;
        }
        seenSignatures.set(sig, i);
      }
    }

    setIsSubmitting(true);

    try {
      const primaryVariant = finalVariantsList[0];
      const finalTitle = primaryVariant?.titleOverride?.trim() || productTitle.trim() || productName.trim();
      const finalDescription = primaryVariant?.description?.trim() || description.trim();

      // Root shipping payload (synced with primary variant if primary overrides)
      const primaryHasAllShipping = primaryVariant.weight !== '' && primaryVariant.length !== '' && 
                                    primaryVariant.width !== '' && primaryVariant.height !== '' &&
                                    Number(primaryVariant.weight) > 0;
      
      const rootShipping = {
        weight: primaryHasAllShipping ? Number(primaryVariant.weight) : topWeightNum,
        dimensions: {
          length: primaryHasAllShipping ? Number(primaryVariant.length) : topLengthNum,
          width: primaryHasAllShipping ? Number(primaryVariant.width) : topWidthNum,
          height: primaryHasAllShipping ? Number(primaryVariant.height) : topHeightNum
        }
      };

      // Attributes dictionary object from specs
      const attributesObj: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) {
          attributesObj[s.key.trim()] = s.value.trim();
        }
      });

      // Serialized variants payload
      const serializedVariants = finalVariantsList.map((v, idx) => {
        const attrRecord: Record<string, string> = {};
        v.attributes.forEach(a => {
          if (a.key.trim() && a.value.trim()) {
            attrRecord[a.key.trim()] = a.value.trim();
          }
        });

        const vHasAllShipping = v.weight !== '' && v.length !== '' && v.width !== '' && v.height !== '' && Number(v.weight) > 0;

        return {
          productCode: v.sku || `${cleanSkuBase}-${idx + 1}`,
          title: v.titleOverride.trim() || (idx === 0 ? finalTitle : `${finalTitle} - ${idx + 1}`),
          description: v.description.trim() || finalDescription,
          price: {
            base: Number(v.basePrice),
            sale: Number(v.salePrice)
          },
          inventory: {
            quantity: Number(v.stock) || 0,
            lowStockThreshold: Number(v.lowStockAlert) || Number(lowStockAlert) || 15,
            trackInventory: true
          },
          moq: Number(v.moq) || 1,
          attributes: attrRecord,
          isActive: v.isActive,
          channelVisibility: {
            ecomm: v.isActive,
            b2b: true,
            pos: true
          },
          shipping: vHasAllShipping ? {
            weight: Number(v.weight),
            dimensions: {
              length: Number(v.length),
              width: Number(v.width),
              height: Number(v.height)
            }
          } : undefined,
          images: v.images.map(img => ({ url: img.url }))
        };
      });

      // Construct multipart/form-data payload
      const formData = new FormData();
      formData.append('name', productName.trim());
      formData.append('title', finalTitle);
      formData.append('description', finalDescription);
      formData.append('category', selectedCategory.id);
      formData.append('brand', brand.trim() || 'Generic');
      formData.append('status', publishStatus);
      formData.append('shipping', JSON.stringify(rootShipping));
      formData.append('attributes', JSON.stringify(attributesObj));
      formData.append('variants', JSON.stringify(serializedVariants));
      const numericTaxRate = (() => {
        const match = String(gstRate).match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
      })();
      formData.append('hsnCode', hsnCode.trim());
      formData.append('taxRate', String(numericTaxRate));
      formData.append('gstRate', String(numericTaxRate));
      formData.append('tax', String(numericTaxRate));
      formData.append('trackInventory', String(trackInventory));

      // Append image files to indexed buckets: variantImages_0, variantImages_1, etc.
      finalVariantsList.forEach((v, vIdx) => {
        v.images.forEach(img => {
          if (img.file) {
            formData.append(`variantImages_${vIdx}`, img.file);
          }
        });
      });

      // Submit via API
      let createdProd: any = null;
      try {
        const res = await adminProductsApi.create(formData);
        createdProd = res?.product || res?.data || res;
      } catch (apiErr: any) {
        console.warn('Backend API upload returned error, proceeding with local catalog sync:', apiErr);
      }

      const primaryPhotoUrl = finalVariantsList[0]?.images?.[0]?.url || '/images/products/placeholder.svg';

      const localReduxProduct: AdminProduct = {
        id: createdProd?._id || createdProd?.id || `prod-${Date.now()}`,
        sku: cleanSkuBase,
        title: finalTitle,
        brand: brand.trim() || 'Generic',
        category: selectedCategory.name,
        currentPrice: Number(primaryVariant.salePrice),
        originalPrice: Number(primaryVariant.basePrice),
        discountPercentage: Math.max(0, Math.round(((Number(primaryVariant.basePrice) - Number(primaryVariant.salePrice)) / Number(primaryVariant.basePrice)) * 100)),
        stock: finalVariantsList.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
        lowStockThreshold: Number(lowStockAlert) || 5,
        hsnCode: hsnCode.trim(),
        gstRate,
        trackInventory,
        image: primaryPhotoUrl,
        gallery: finalVariantsList.flatMap(v => v.images.map(img => img.url)).slice(0, 8),
        rating: 4.8,
        reviews: 0,
        status: publishStatus === 'active' ? 'Active' : 'Inactive',
        description: finalDescription,
        dateAdded: new Date().toISOString()
      };

      dispatch(addProduct(localReduxProduct));
      toast.success(publishStatus === 'active' ? 'Product published to catalog!' : 'Product saved as inactive!');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create product:', err);
      toast.error(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      
      {/* TOP BAR HEADER */}
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
                Per-variant price · stock · shipping · images
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
            Save as Inactive
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

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">

          {/* CARD 1: PRODUCT (Parent + Defaults Seed) */}
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

            {/* Customer-facing Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Customer-Facing Title
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="Customer-facing title (blank = use product name)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Seeded into each variant title on generate. Effective: <span className="font-semibold text-slate-700">{effectiveTitle}</span>
              </p>
            </div>

            {/* Base SKU & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  SKU / Product code base *
                </label>
                <input
                  type="text"
                  value={skuBase}
                  onChange={(e) => setSkuBase(e.target.value.toUpperCase())}
                  placeholder="E.G. ABB-3426"
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
                  placeholder="e.g. Nike, Puma, Generic..."
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

          {/* CARD 2: PRODUCT PRICING & STOCK */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                $
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                2. Product Pricing &amp; Stock
              </h2>
            </div>

            {/* Row 1: Selling Price & MRP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Selling Price (Base ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="200"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  MRP (Maximum Retail Price ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="300"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Available Stock, MOQ, Low Stock Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Available Stock Quantity
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Min. Order Qty (MOQ Units)
                </label>
                <input
                  type="number"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Low Stock Alert Level
                </label>
                <input
                  type="number"
                  value={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>
            </div>

            {/* Row 3: HSN Code & GST Tax Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  placeholder="1324"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  GST Tax Rate (%)
                </label>
                <Select
                  value={gstRate}
                  onValueChange={(val) => setGstRate(val)}
                >
                  <SelectTrigger className="w-full h-10.5 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
                    <SelectValue placeholder="Select GST Tax Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exempt)</SelectItem>
                    <SelectItem value="3">3% (Precious Items)</SelectItem>
                    <SelectItem value="5">5% (Essential Goods)</SelectItem>
                    <SelectItem value="12">12% (Standard Low)</SelectItem>
                    <SelectItem value="18">18% (Standard High)</SelectItem>
                    <SelectItem value="28">28% (Luxury / Sin Goods)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Track Inventory Box */}
            <div className="p-3.5 sm:px-4 bg-slate-50/70 border border-slate-200/90 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="track-inventory-checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label 
                htmlFor="track-inventory-checkbox"
                className="text-xs font-semibold text-slate-800 cursor-pointer select-none"
              >
                Track inventory stock automatically during customer checkout
              </label>
            </div>
          </div>

          {/* CARD 3: CATALOG ATTRIBUTES & AXES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A44101]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Variant Options
                </h2>
              </div>
              {showAddAxisModal ? (
                <button
                  type="button"
                  onClick={() => setShowAddAxisModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddAxisModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#A44101]/30 hover:bg-[#A44101]/10 text-[#A44101] text-xs font-bold transition-colors cursor-pointer"
                >
                  + Custom option
                </button>
              )}
            </div>
            
            <p className="text-xs text-slate-500">
              Pick options → values → generate (max 3 options). Custom options save to the dictionary for reuse on every future product.
            </p>

            {/* Quick-Pick Available Axes from Catalog */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Catalog Axes:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {availableVariantAxes.map(item => {
                  const isActive = activeAxes.some(a => a.name.toLowerCase() === item.name.toLowerCase());
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleAddAxis(item.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#A44101] text-white shadow-xs ring-2 ring-[#A44101]/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isActive ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Option Card - EXACT MATCH TO USER SCREENSHOT */}
            {showAddAxisModal && (
              <div className="p-5 sm:p-6 bg-[#FFFDFB] border border-orange-200/90 rounded-2xl space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900">
                  Add custom option → saves to dictionary + adds on this product
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Option name *
                    </label>
                    <input
                      type="text"
                      value={newAxisCustomName}
                      onChange={(e) => setNewAxisCustomName(e.target.value)}
                      placeholder="color"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-orange-500 ring-1 ring-orange-500/20 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomAxis();
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Values * (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newAxisValues}
                      onChange={(e) => setNewAxisValues(e.target.value)}
                      placeholder="e.g. 64GB, 128GB, 256GB"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#A44101]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomAxis();
                        }
                      }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  At least one value required. Values are pre-selected; tweak chips then Generate. Max 3 options per product.
                </p>

                <div>
                  <button
                    type="button"
                    onClick={handleCreateCustomAxis}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save &amp; add option</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Axes with Value Pills */}
            {activeAxes.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                No options selected — use <span className="font-semibold text-slate-600">+ Add option</span> or <span className="font-semibold text-slate-600">+ Custom option</span>, or generate a single default variant.
              </div>
            ) : (
              <div className="space-y-4">
                {activeAxes.map((axis) => {
                  const catItem = catalogDict.find(c => c.name.toLowerCase() === axis.name.toLowerCase() && c.type === 'variant');
                  const suggested = catItem?.suggestedValues || [];
                  const allValues = Array.from(new Set([...suggested, ...axis.selectedValues]));

                  return (
                    <div key={axis.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                            {axis.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({axis.selectedValues.length} selected)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveActiveAxis(axis.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                          title="Remove axis"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Value Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {allValues.map((val) => {
                          const isSelected = axis.selectedValues.includes(val);
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleToggleAxisValue(axis.id, val)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#A44101] text-white shadow-2xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span>{val}</span>
                              {isSelected && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}

                        {/* Inline input to add value */}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={newTagInput[axis.id] || ''}
                            onChange={(e) => setNewTagInput({ ...newTagInput, [axis.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddValueToAxis(axis.id);
                              }
                            }}
                            placeholder={`+ New ${axis.name}...`}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 w-28 focus:outline-none focus:border-[#A44101]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddValueToAxis(axis.id)}
                            className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs cursor-pointer"
                            title="Add value"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons for Variants Generation */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateVariants}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generate Variants</span>
              </button>

              {variants.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyTopDefaultsToAll}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#A44101]" />
                  <span>Apply Top Defaults to All Variants</span>
                </button>
              )}
            </div>
          </div>

          {/* CARD 4: PER-VARIANT CARDS LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Variants ({variants.length}) — expand to edit each SKU
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real selling price, inventory, shipping overrides, and up to 4 photos per SKU.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {variants.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyTopDefaultsToAll}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Re-apply top defaults to all
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddManualVariant}
                  className="px-3 py-1.5 rounded-xl bg-[#A44101]/10 hover:bg-[#A44101]/20 text-[#A44101] text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add variant (inherits top)
                </button>
              </div>
            </div>

            {/* List of Variants */}
            {variants.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  No variant cards generated yet
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click <span className="font-semibold text-slate-600">Generate Variants</span> above to create combinations, or <span className="font-semibold text-slate-600">+ Add variant</span> to add manually.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((v, idx) => {
                  const isPrimary = idx === 0;
                  const attrSummary = v.attributes.length > 0
                    ? v.attributes.map(a => `${a.key}: ${a.value || '?'}`).join(' · ')
                    : 'No custom options';

                  // Partial shipping check
                  const hasAnyShipping = v.weight !== '' || v.length !== '' || v.width !== '' || v.height !== '';
                  const hasAllShipping = v.weight !== '' && v.length !== '' && v.width !== '' && v.height !== '';
                  const hasPartialShipping = hasAnyShipping && !hasAllShipping;

                  return (
                    <div
                      key={v.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white transition-all hover:border-slate-300"
                    >
                      {/* CARD HEADER */}
                      <div className="p-4 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          {/* Circle badge with variant number */}
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                Variant {idx + 1}
                              </span>
                              {isPrimary && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wider">
                                  PRIMARY
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                                {v.sku}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {attrSummary} · ₹{v.salePrice || 0} · Qty {v.stock || 0}
                            </p>
                          </div>
                        </div>

                        {/* Right side summary & controls */}
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block text-right">
                            <span className="text-xs font-bold text-slate-800">
                              ₹{v.salePrice || 0}
                            </span>
                            <span className="text-slate-400 mx-1">|</span>
                            <span className="text-xs text-slate-600">
                              Stock: {v.stock || 0}
                            </span>
                          </div>

                          {/* Active Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => updateVariant(idx, { isActive: !v.isActive })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              v.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                            title="Toggle variant active status"
                          >
                            <span className={`w-2 h-2 rounded-full ${v.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span>{v.isActive ? 'Active' : 'Hidden'}</span>
                          </button>

                          {/* Expand/Collapse Chevron */}
                          <button
                            type="button"
                            onClick={() => updateVariant(idx, { isExpanded: !v.isExpanded })}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title={v.isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {v.isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          {/* Delete Button (disabled on Variant 1) */}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            disabled={isPrimary}
                            className={`p-1.5 rounded-lg border border-slate-200 text-slate-400 transition-colors ${
                              isPrimary 
                                ? 'opacity-40 cursor-not-allowed' 
                                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer'
                            }`}
                            title={isPrimary ? 'Primary variant cannot be deleted' : 'Delete variant'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* CARD BODY (EXPANDED) */}
                      {v.isExpanded && (
                        <div className="p-5 space-y-5">
                          
                          {/* ROW 1: Variant SKU & Title Override */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Variant Product Code *
                              </label>
                              <input
                                type="text"
                                value={v.sku}
                                readOnly
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono text-slate-700 cursor-not-allowed"
                              />
                              <p className="text-[10px] text-slate-400 mt-1">
                                Auto-generated continuous series (BASE-1, BASE-2...).
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Variant Title Override (Optional)
                              </label>
                              <input
                                type="text"
                                value={v.titleOverride}
                                onChange={(e) => updateVariant(idx, { titleOverride: e.target.value })}
                                placeholder="Customer-facing override title..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101]"
                              />
                              <p className="text-[10px] text-slate-400 mt-1">
                                Pre-filled from top product title. Edits here override on storefront.
                              </p>
                            </div>
                          </div>

                          {/* ROW 2: Attributes & Options Box */}
                          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <label className="text-xs font-bold text-slate-800 block">
                                  Attributes (optional, max 8)
                                </label>
                                <p className="text-[11px] text-slate-400">
                                  Key-Value pairs (e.g. Color: Blue, Size: XL).
                                </p>
                              </div>

                              {/* Quick add pill buttons */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {['Color', 'Size', 'Weight', 'Material', 'Pack', 'Style'].map((pill) => (
                                  <button
                                    key={pill}
                                    type="button"
                                    onClick={() => handleAddVariantAttr(idx, pill)}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                                  >
                                    +{pill}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddVariantAttr(idx, '')}
                                  className="px-2.5 py-1 rounded-lg bg-[#A44101]/10 text-[#A44101] hover:bg-[#A44101]/20 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  + Custom
                                </button>
                              </div>
                            </div>

                            {/* Key-Value Inputs List */}
                            {v.attributes.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">
                                No attributes set. Click a quick pill above or leave blank for single SKU.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {v.attributes.map((attr, aIdx) => (
                                  <div key={attr.id} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={attr.key}
                                      onChange={(e) => handleUpdateVariantAttr(idx, aIdx, 'key', e.target.value)}
                                      placeholder="Attribute Name (e.g. Color)"
                                      className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                                    />
                                    <input
                                      type="text"
                                      value={attr.value}
                                      onChange={(e) => handleUpdateVariantAttr(idx, aIdx, 'value', e.target.value)}
                                      placeholder="Value (e.g. Blue)"
                                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariantAttr(idx, aIdx)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                                      title="Remove attribute"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ROW 3: Pricing & Inventory Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Sale Price (₹) *
                              </label>
                              <input
                                type="number"
                                value={v.salePrice}
                                onChange={(e) => updateVariant(idx, { salePrice: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#A44101]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Base MRP (₹) *
                              </label>
                              <input
                                type="number"
                                value={v.basePrice}
                                onChange={(e) => updateVariant(idx, { basePrice: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                              />
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Must be &gt; Sale Price
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                Stock Quantity
                              </label>
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => updateVariant(idx, { stock: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                MOQ Units
                              </label>
                              <input
                                type="number"
                                value={v.moq}
                                onChange={(e) => updateVariant(idx, { moq: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                              />
                            </div>
                          </div>

                          {/* ROW 4: Package Weight & Shipping Box */}
                          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                            <div>
                              <label className="text-xs font-bold text-slate-800 block">
                                Weight (kg) &amp; Dimensions (cm)
                              </label>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Edit weight (kg) and parcel size for this variant. (Default fallback: {weight || 0.5} kg, {length || 30} × {width || 20} × {height || 10} cm).
                              </p>
                            </div>

                            {hasPartialShipping && (
                              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                <span>Partial shipping: All 4 fields must be filled to override, or leave all 4 blank to use defaults.</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                                  Weight (kg)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.weight}
                                  onChange={(e) => updateVariant(idx, { weight: e.target.value === '' ? '' : Number(e.target.value) })}
                                  placeholder={String(weight || 0.5)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                                  Length (cm)
                                </label>
                                <input
                                  type="number"
                                  value={v.length}
                                  onChange={(e) => updateVariant(idx, { length: e.target.value === '' ? '' : Number(e.target.value) })}
                                  placeholder={String(length || 30)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                                  Width (cm)
                                </label>
                                <input
                                  type="number"
                                  value={v.width}
                                  onChange={(e) => updateVariant(idx, { width: e.target.value === '' ? '' : Number(e.target.value) })}
                                  placeholder={String(width || 20)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                                  Height (cm)
                                </label>
                                <input
                                  type="number"
                                  value={v.height}
                                  onChange={(e) => updateVariant(idx, { height: e.target.value === '' ? '' : Number(e.target.value) })}
                                  placeholder={String(height || 10)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* ROW 5: Variant-Specific Photos (up to 4) */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800 block">
                                Variant Photos (up to 4)
                              </label>
                              <span className="text-[11px] text-slate-400">
                                {v.images.length} / 4 uploaded · Max 8MB (JPG, PNG, WEBP, GIF)
                              </span>
                            </div>

                            <input
                              type="file"
                              ref={(el) => { fileInputRefs.current[idx] = el; }}
                              onChange={(e) => handleVariantPhotoUpload(idx, e)}
                              multiple
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                            />

                            <div className="flex flex-wrap items-center gap-3">
                              {v.images.map((photo, pIdx) => (
                                <div key={photo.id} className="relative w-20 h-20 rounded-2xl border border-slate-200 overflow-hidden group bg-slate-50 shadow-2xs">
                                  <img 
                                    src={photo.url} 
                                    alt={`Variant ${idx + 1} photo ${pIdx + 1}`} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantPhoto(idx, pIdx)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black"
                                    title="Remove photo"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {v.images.length < 4 && (
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[idx]?.click()}
                                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#A44101] text-slate-400 hover:text-[#A44101] flex flex-col items-center justify-center transition-colors cursor-pointer bg-slate-50/50 hover:bg-orange-50/30"
                                  title="Upload photo"
                                >
                                  <Upload className="w-5 h-5 stroke-[1.8]" />
                                  <span className="text-[10px] mt-1 font-semibold">Upload</span>
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CARD 5: PRODUCT SPECS (Shared, Non-Variant) */}
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
                onClick={() => setShowAddSpecInput(true)}
                className="px-3 py-1.5 rounded-xl border border-[#A44101]/30 hover:bg-[#A44101]/10 text-[#A44101] text-xs font-bold transition-colors cursor-pointer"
              >
                + Custom Spec
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              Shared specifications across all SKUs (e.g. Care, Fit, Country of Origin). Saved to the Attributes dictionary for reuse.
            </p>

            {/* Catalog quick-picks for specs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {availableSpecItems.map(specItem => (
                <button
                  key={specItem.id}
                  type="button"
                  onClick={() => handleAddSpecFromCatalog(specItem.name)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +{specItem.name}
                </button>
              ))}
            </div>

            {/* Custom spec input modal */}
            {showAddSpecInput && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex items-center gap-2">
                <input
                  type="text"
                  value={customSpecKey}
                  onChange={(e) => setCustomSpecKey(e.target.value)}
                  placeholder="Spec name (e.g. Warranty, Fabric)..."
                  className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSpec();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpec}
                  className="px-3 py-1.5 bg-[#A44101] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSpecInput(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Specs Table */}
            {specs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No specifications added yet. Click one of the quick items above or "+ Custom Spec".
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
                      className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#A44101]"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleUpdateSpec(spec.id, 'value', e.target.value)}
                      placeholder="e.g. 100% Pure Cotton, 1 Year"
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

        {/* RIGHT COLUMN SIDEBAR (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Product Shipping Defaults (Fallback) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#A44101]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Product shipping (fallback) *
                </h2>
              </div>
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
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Parcel Dimensions (cm) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Length (cm)</span>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="30"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Width (cm)</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="20"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Height (cm)</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="10"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>
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
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#A44101]" />
              <span>How Fields Work</span>
            </h3>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-semibold text-slate-800">Top defaults</span> = seed values for single SKU or Cartesian generation.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Generate Variants</span> → computes cross-combinations of up to 3 axes (max 100).
              </li>
              <li>
                <span className="font-semibold text-slate-800">Per-variant cards</span> → customize SKU override title, price, stock, shipping, &amp; up to 4 photos.
              </li>
              <li>
                <span className="font-semibold text-slate-800">Primary SKU (Variant 1)</span> → syncs title, description &amp; shipping to the parent product.
              </li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
};
