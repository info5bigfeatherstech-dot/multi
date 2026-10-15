import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Package, 
  Image as ImageIcon, 
  Warehouse, 
  Plus, 
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  Tag,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { updateProduct, addProduct, AdminProduct, ProductVariant } from '../../../../../store/adminProductsSlice';
import { adminProductsApi } from '../../../../../api';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../../components/ui/select';

export interface CatalogAttributeItem {
  id: string;
  name: string;
  type: 'variant' | 'spec';
  suggestedValues: string[];
}

export interface ActiveVariantAxis {
  id: string;
  name: string;
  selectedValues: string[];
}

const STORAGE_CATALOG_KEY = 'abb_catalog_attributes_dict';

const DEFAULT_CATALOG_ATTRIBUTES: CatalogAttributeItem[] = [
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
  }
];

interface ProductEditModalProps {
  product?: AdminProduct | null;
  mode?: 'edit' | 'add';
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ 
  product, 
  mode = product ? 'edit' : 'add', 
  onClose,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.adminProducts.categories);
  const isAddMode = mode === 'add' || !product;

  // Form States
  const [title, setTitle] = useState(isAddMode ? '' : (product?.title || ''));
  const [sku, setSku] = useState(isAddMode ? `ABB-${Math.floor(1000 + Math.random() * 9000)}` : (product?.sku || ''));
  const [brand, setBrand] = useState(isAddMode ? '' : (product?.brand || ''));
  const [category, setCategory] = useState(isAddMode ? (categories[0]?.name || 'Home & Kitchen') : (product?.category || categories[0]?.name || ''));
  const [subcategory, setSubcategory] = useState(isAddMode ? '' : (product?.subcategory || ''));
  const [description, setDescription] = useState(isAddMode ? '' : (product?.description || ''));
  const [status, setStatus] = useState<'Active' | 'Draft' | 'Archived'>(isAddMode ? 'Active' : (product?.status || 'Active'));
  const [tag, setTag] = useState(isAddMode ? '' : (product?.tag || ''));

  // Pricing
  const [currentPrice, setCurrentPrice] = useState(isAddMode ? 200 : (product?.currentPrice ?? 200));
  const [originalPrice, setOriginalPrice] = useState(isAddMode ? 300 : (product?.originalPrice ?? 300));
  const [costPrice] = useState(isAddMode ? 120 : (product?.costPrice || Math.round(Number(product?.currentPrice || 200) * 0.6)));

  // Inventory & Tax
  const [stock, setStock] = useState(isAddMode ? 20 : (product?.stock ?? 20));
  const [moq, setMoq] = useState(isAddMode ? 10 : ((product as any)?.moq ?? (product as any)?.minimumOrderQuantity ?? 10));
  const [lowStockThreshold, setLowStockThreshold] = useState(isAddMode ? 5 : (product?.lowStockThreshold ?? 5));
  const [hsnCode, setHsnCode] = useState((product as any)?.hsnCode || '1324');
  const [gstRate, setGstRate] = useState((product as any)?.gstRate || '3% (Precious Items)');
  const [trackInventory, setTrackInventory] = useState((product as any)?.trackInventory !== false);
  const [binLocation, setBinLocation] = useState(isAddMode ? 'Warehouse-A' : (product?.binLocation || ''));

  // Images
  const initialImage = (!isAddMode && product?.image && !product.image.includes('placeholder.png'))
    ? product.image
    : (!isAddMode && product?.gallery?.find((g) => g && !g.includes('placeholder.png')) ? product.gallery[0] : '');
  const [image, setImage] = useState(initialImage);
  const [gallery, setGallery] = useState<string[]>(
    isAddMode ? [] : (product?.gallery || []).filter((u) => u && !u.includes('placeholder.png'))
  );
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Specifications / Custom Attributes State
  const parseInitialSpecs = (): Array<{ name: string; value: string }> => {
    const rawAttrs = (product as any)?.attributes;
    if (Array.isArray(rawAttrs)) {
      return rawAttrs
        .filter((a: any) => a.key || a.name)
        .map((a: any) => ({
          name: a.key || a.name || '',
          value: a.value || ''
        }));
    }
    if (rawAttrs && typeof rawAttrs === 'object') {
      return Object.entries(rawAttrs).map(([name, value]) => ({
        name,
        value: String(value)
      }));
    }
    if (Array.isArray((product as any)?.specifications)) {
      return (product as any).specifications.map((s: any) => ({
        name: s.name || s.key || '',
        value: s.value || ''
      }));
    }
    return [];
  };

  const [specs, setSpecs] = useState<Array<{ name: string; value: string }>>(parseInitialSpecs);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const handleAddSpec = () => {
    if (!newSpecName.trim() || !newSpecValue.trim()) {
      toast.error('Both specification name and value are required');
      return;
    }
    setSpecs(prev => [...prev, { name: newSpecName.trim(), value: newSpecValue.trim() }]);
    setNewSpecName('');
    setNewSpecValue('');
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  // Variants
  const parseInitialVariants = (): ProductVariant[] => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants.map((v: any, idx: number) => ({
        id: v.id || v._id || `var-${Date.now()}-${idx}`,
        name: v.name || v.title || `Variant ${idx + 1}`,
        sku: v.sku || v.productCode || (idx === 0 ? (product.sku || '7898966-1') : `${product.sku || '7898966'}-${idx + 1}`),
        titleOverride: v.titleOverride || (v.title && v.title !== product.title ? v.title : (idx === 0 ? (product.title || '') : '')),
        description: v.description || (idx === 0 ? (product.description || '') : ''),
        price: Number(v.price?.sale ?? v.price?.current ?? v.price ?? product.currentPrice ?? 21),
        basePrice: Number(v.price?.base ?? v.basePrice ?? product.originalPrice ?? 122),
        stock: Number(v.inventory?.quantity ?? v.stock ?? product.stock ?? 50),
        lowStockAlert: Number(v.inventory?.lowStockThreshold ?? v.lowStockAlert ?? 15),
        moq: Number(v.minimumOrderQuantity ?? v.moq ?? 1),
        weight: Number(v.shipping?.weight ?? v.weight ?? 0.5),
        dimensions: {
          length: Number(v.shipping?.dimensions?.length ?? v.dimensions?.length ?? 30),
          width: Number(v.shipping?.dimensions?.width ?? v.dimensions?.width ?? 20),
          height: Number(v.shipping?.dimensions?.height ?? v.dimensions?.height ?? 10),
        },
        isActive: v.isActive !== false,
        ecomVisibility: v.channelVisibility?.ecomm === 'active' || v.ecomVisibility !== false,
        trackInventory: v.inventory?.trackInventory !== false && v.trackInventory !== false,
        images: Array.isArray(v.images)
          ? v.images.map((im: any) => typeof im === 'string' ? im : im.url).filter(Boolean).slice(0, 4)
          : (idx === 0 && product.image ? [product.image] : []),
        attributes: Array.isArray(v.attributes)
          ? v.attributes.map((a: any) => ({
              key: a.key || a.name || '',
              value: a.value || ''
            }))
          : []
      }));
    }

    return [
      {
        id: `var-1`,
        name: 'Variant 1',
        sku: product?.sku || (sku || '7898966-1'),
        titleOverride: product?.title || title || '',
        description: product?.description || description || '',
        price: Number(product?.currentPrice ?? currentPrice ?? 21),
        basePrice: Number(product?.originalPrice ?? originalPrice ?? 122),
        stock: Number(product?.stock ?? stock ?? 50),
        lowStockAlert: Number(lowStockThreshold || 15),
        moq: 1,
        weight: 0.5,
        dimensions: { length: 30, width: 20, height: 10 },
        isActive: true,
        ecomVisibility: true,
        trackInventory: true,
        images: product?.image ? [product.image] : [],
        attributes: []
      }
    ];
  };

  const [variants, setVariants] = useState<ProductVariant[]>(parseInitialVariants);

  // Catalog dictionary state
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

  const saveCatalogDict = (updated: CatalogAttributeItem[]) => {
    setCatalogDict(updated);
    try {
      localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist catalog dictionary:', e);
    }
  };

  // Parse initial active axes from existing variants
  const parseInitialActiveAxes = (): ActiveVariantAxis[] => {
    const axesMap = new Map<string, Set<string>>();
    const initialVars = parseInitialVariants();
    initialVars.forEach(v => {
      if (Array.isArray(v.attributes)) {
        v.attributes.forEach(a => {
          if (a.key?.trim() && a.value?.trim()) {
            if (!axesMap.has(a.key.trim())) {
              axesMap.set(a.key.trim(), new Set());
            }
            axesMap.get(a.key.trim())!.add(a.value.trim());
          }
        });
      }
    });

    const result: ActiveVariantAxis[] = [];
    axesMap.forEach((vals, name) => {
      if (result.length < 3) {
        result.push({
          id: `axis-${Date.now()}-${result.length}`,
          name,
          selectedValues: Array.from(vals)
        });
      }
    });
    return result;
  };

  const [activeAxes, setActiveAxes] = useState<ActiveVariantAxis[]>(parseInitialActiveAxes);
  const [showAddAxisModal, setShowAddAxisModal] = useState(false);
  const [newAxisCustomName, setNewAxisCustomName] = useState('');
  const [newAxisValues, setNewAxisValues] = useState('');
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});

  const availableVariantAxes = catalogDict.filter(item => item.type === 'variant');

  const handleToggleAddAxis = (axisName: string) => {
    if (activeAxes.some(a => a.name.toLowerCase() === axisName.toLowerCase())) {
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

  const handleAddValueToAxis = (axisId: string) => {
    const rawVal = (newTagInput[axisId] || '').trim();
    if (!rawVal) return;

    const targetAxis = activeAxes.find(a => a.id === axisId);
    if (!targetAxis) return;

    setActiveAxes(prev => prev.map(axis => {
      if (axis.id === axisId) {
        if (!axis.selectedValues.includes(rawVal)) {
          return { ...axis, selectedValues: [...axis.selectedValues, rawVal] };
        }
      }
      return axis;
    }));

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

  const handleGenerateVariantsFromAxes = () => {
    const validAxes = activeAxes.filter(a => a.selectedValues.length > 0);
    if (validAxes.length === 0) {
      toast.error('Please select at least one value for an active axis');
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(a => curr.map(b => [...a, b]));
      }, [[]] as string[][]);
    };

    const combinations = cartesian(validAxes.map(a => a.selectedValues));
    if (combinations.length > 100) {
      toast.error(`Cannot generate ${combinations.length} combinations! Maximum allowed is 100.`);
      return;
    }

    const cleanSkuBase = (sku.trim() || product?.sku || '7898966').toUpperCase();
    const finalTitle = title.trim() || product?.title || 'Product';

    const newVariants: ProductVariant[] = combinations.map((combo, idx) => {
      const attrPairs = validAxes.map((axis, aIdx) => ({
        key: axis.name,
        value: combo[aIdx]
      }));

      const comboLabel = combo.join(' / ');
      const variantSku = `${cleanSkuBase}-${idx + 1}`;

      return {
        id: `var-${Date.now()}-${idx}`,
        name: `Variant ${idx + 1}`,
        sku: variantSku,
        titleOverride: `${finalTitle} - ${comboLabel}`,
        description: description.trim(),
        price: Number(currentPrice) || 21,
        basePrice: Number(originalPrice) || 122,
        stock: Number(stock) || 50,
        lowStockAlert: Number(lowStockThreshold) || 15,
        moq: 1,
        weight: 0.5,
        dimensions: { length: 30, width: 20, height: 10 },
        isActive: true,
        ecomVisibility: true,
        trackInventory: true,
        images: image ? [image] : [],
        attributes: attrPairs
      };
    });

    setVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variant combinations!`);
  };

  const [expandedVariantIds, setExpandedVariantIds] = useState<{ [id: string]: boolean }>({
    'var-1': true
  });

  const toggleVariantExpand = (id: string) => {
    setExpandedVariantIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateVariantField = (idx: number, updates: Partial<ProductVariant>) => {
    setVariants(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const handleAddCustomAttr = (varIdx: number) => {
    setVariants(prev => {
      const copy = [...prev];
      const attrs = copy[varIdx].attributes ? [...copy[varIdx].attributes!] : [];
      attrs.push({ key: '', value: '' });
      copy[varIdx] = { ...copy[varIdx], attributes: attrs };
      return copy;
    });
  };

  const handleUpdateAttr = (varIdx: number, attrIdx: number, field: 'key' | 'value', val: string) => {
    setVariants(prev => {
      const copy = [...prev];
      const attrs = [...(copy[varIdx].attributes || [])];
      attrs[attrIdx] = { ...attrs[attrIdx], [field]: val };
      copy[varIdx] = { ...copy[varIdx], attributes: attrs };
      return copy;
    });
  };

  const handleRemoveAttr = (varIdx: number, attrIdx: number) => {
    setVariants(prev => {
      const copy = [...prev];
      const attrs = (copy[varIdx].attributes || []).filter((_, i) => i !== attrIdx);
      copy[varIdx] = { ...copy[varIdx], attributes: attrs };
      return copy;
    });
  };

  const handleAddVariantPhoto = (varIdx: number) => {
    const url = window.prompt('Enter image URL for this variant:');
    if (url && url.trim()) {
      setVariants(prev => {
        const copy = [...prev];
        const imgs = copy[varIdx].images ? [...(copy[varIdx].images as any[])] : [];
        imgs.push(url.trim());
        copy[varIdx] = { ...copy[varIdx], images: imgs };
        return copy;
      });
    }
  };

  const handleRemoveVariantPhoto = (varIdx: number, photoIdx: number) => {
    setVariants(prev => {
      const copy = [...prev];
      const imgs = (copy[varIdx].images as any[] || []).filter((_, i) => i !== photoIdx);
      copy[varIdx] = { ...copy[varIdx], images: imgs };
      return copy;
    });
  };

  const handleAddNewVariant = () => {
    const newIdx = variants.length + 1;
    const baseSku = sku.trim() || '7898966';
    const newId = `var-${Date.now()}`;
    const newVar: ProductVariant = {
      id: newId,
      name: `Variant ${newIdx}`,
      sku: `${baseSku}-${newIdx}`,
      titleOverride: title.trim() ? `${title.trim()} - Variant ${newIdx}` : '',
      description: description.trim() || '',
      price: Number(currentPrice) || 21,
      basePrice: Number(originalPrice) || 122,
      stock: Number(stock) || 50,
      lowStockAlert: Number(lowStockThreshold) || 15,
      moq: 1,
      weight: 0.5,
      dimensions: { length: 30, width: 20, height: 10 },
      isActive: true,
      ecomVisibility: true,
      trackInventory: true,
      images: [],
      attributes: []
    };
    setVariants(prev => [...prev, newVar]);
    setExpandedVariantIds(prev => ({ ...prev, [newId]: true }));
  };

  const handleReapplyTopDefaults = () => {
    setVariants(prev => prev.map((v, idx) => ({
      ...v,
      price: Number(currentPrice) || v.price,
      basePrice: Number(originalPrice) || v.basePrice,
      stock: Number(stock) || v.stock,
      lowStockAlert: Number(lowStockThreshold) || v.lowStockAlert || 15,
      ...(idx === 0 ? {
        titleOverride: title.trim() || v.titleOverride,
        description: description.trim() || v.description
      } : {})
    })));
    toast.success('Top product defaults applied to all variants');
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      toast.error('Product must have at least one variant.');
      return;
    }
    setVariants(prev => prev.filter((v) => v.id !== id));
  };

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
  const subcategoryList: string[] = selectedCatObj ? selectedCatObj.subcategories : [];

  const handleAddGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setGallery([...gallery, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setGallery(gallery.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Product title is required');
      document.getElementById('sec-general')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const calculatedDiscount = originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    const payloadVariants = variants.map((v: any, idx: number) => {
      const variantImages = (v.images && v.images.length > 0 ? v.images : [image, ...gallery])
        .filter(Boolean)
        .slice(0, 4)
        .map((imgObj: any, orderIdx: number) => ({
          url: typeof imgObj === 'string' ? imgObj : imgObj.url,
          altText: v.titleOverride || title.trim(),
          order: orderIdx
        }));

      return {
        ...v,
        sku: v.sku?.trim() || `${sku.trim()}-${idx + 1}`,
        productCode: v.sku?.trim() || `${sku.trim()}-${idx + 1}`,
        title: v.titleOverride?.trim() || (idx === 0 ? title.trim() : `${title.trim()} - Variant ${idx + 1}`),
        description: v.description?.trim() || description.trim(),
        price: {
          base: Number(v.basePrice || originalPrice),
          sale: Number(v.price || currentPrice),
          current: Number(v.price || currentPrice)
        },
        inventory: {
          quantity: Number(v.stock ?? stock),
          lowStockThreshold: Number(v.lowStockAlert ?? lowStockThreshold ?? 10),
          trackInventory: v.trackInventory !== false
        },
        channelVisibility: {
          ecomm: v.ecomVisibility !== false ? 'active' : 'inactive',
          wholesale: 'active'
        },
        minimumOrderQuantity: Number(v.moq) || 1,
        shipping: {
          weight: Number(v.weight) || 0.5,
          dimensions: {
            length: Number(v.dimensions?.length) || 30,
            width: Number(v.dimensions?.width) || 20,
            height: Number(v.dimensions?.height) || 10
          }
        },
        isActive: v.isActive !== false,
        attributes: (v.attributes || []).filter((a: any) => a.key?.trim() && a.value?.trim()),
        images: variantImages
      };
    });

    const attributesPayload = specs.map(s => ({ key: s.name.trim(), value: s.value.trim() }));
    const attributesObj: Record<string, string> = {};
    specs.forEach(s => {
      if (s.name.trim()) attributesObj[s.name.trim()] = s.value.trim();
    });

    if (isAddMode) {
      const newProdId = `prod-${Date.now()}`;
      (async () => {
        try {
          await adminProductsApi.create({
            title: title.trim(),
            name: title.trim(),
            description: description.trim(),
            status: status.toLowerCase(),
            brand: brand.trim(),
            category,
            subcategory,
            image: image.trim(),
            cardImage: { url: image.trim() },
            images: [image.trim(), ...gallery].filter(Boolean).map((u, i) => ({ url: u, order: i })),
            attributes: attributesPayload,
            specifications: specs,
            variants: payloadVariants
          });
        } catch {
          // local redux fallback
        }
      })();

      dispatch(addProduct({
        id: newProdId,
        sku: sku.trim(),
        title: title.trim(),
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
        hsnCode: hsnCode.trim(),
        gstRate,
        trackInventory,
        binLocation: binLocation.trim(),
        image: image.trim() || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
        gallery,
        variants,
        attributes: attributesObj,
        specifications: specs,
        rating: 4.8,
        reviews: 0,
        dateAdded: new Date().toISOString()
      }));

      toast.success(`Product "${title}" created successfully!`);
      onSuccess?.();
      onClose();
      return;
    }

    // Edit Mode
    (async () => {
      try {
        await adminProductsApi.update(product?.sku || product?.id || sku, {
          title: title.trim(),
          name: title.trim(),
          description: description.trim(),
          status: status.toLowerCase(),
          brand: brand.trim(),
          category,
          subcategory,
          image: image.trim(),
          cardImage: { url: image.trim() },
          images: [image.trim(), ...gallery].filter(Boolean).map((u, i) => ({ url: u, order: i })),
          attributes: attributesPayload,
          specifications: specs,
          hsnCode: hsnCode.trim(),
          gstRate,
          trackInventory,
          variants: payloadVariants
        });
      } catch {
        // local redux fallback
      }
    })();

    if (product) {
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
          hsnCode: hsnCode.trim(),
          gstRate,
          trackInventory,
          binLocation: binLocation.trim(),
          image: image.trim(),
          gallery,
          variants,
          attributes: attributesObj,
          specifications: specs
        }
      }));
    }

    toast.success(`Product "${title}" updated successfully!`);
    onSuccess?.();
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
              {isAddMode ? <Plus className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {isAddMode ? 'Add New Product' : `Edit Product: ${product?.title}`}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {isAddMode ? 'Configure catalog details, pricing & media' : `SKU: ${product?.sku} • ID: ${product?.id}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Section Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 bg-slate-50/90 border-b border-slate-200 text-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => document.getElementById('sec-general')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            General
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-pricing')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-inventory')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            Inventory
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-specifications')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            Specs ({specs.length})
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-variants')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            Variants ({variants.length})
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-images')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            Media
          </button>
        </div>

        {/* Modal Form Content */}
        <form id="product-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 modal-scroll overscroll-contain">
          {/* 1. GENERAL INFO SECTION */}
          <div id="sec-general" className="modal-section bg-slate-50/60 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
              <Package className="w-4 h-4 text-[#A44101]" />
              <span>General Information</span>
            </div>
            <div className="space-y-4">
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
          </div>

          {/* 2. PRODUCT PRICING & STOCK */}
          <div id="sec-pricing" className="modal-section bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
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
                    min="1"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    required
                    placeholder="200"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
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
                    min="1"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    required
                    placeholder="300"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Available Stock Quantity, Min. Order Qty (MOQ Units), Low Stock Alert Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Available Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? ('' as any) : Number(e.target.value))}
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
                  min="1"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value === '' ? ('' as any) : Number(e.target.value))}
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
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value === '' ? ('' as any) : Number(e.target.value))}
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
                    <SelectItem value="0% (Exempt)">0% (Exempt)</SelectItem>
                    <SelectItem value="3% (Precious Items)">3% (Precious Items)</SelectItem>
                    <SelectItem value="5% (Essential Goods)">5% (Essential Goods)</SelectItem>
                    <SelectItem value="12% (Standard Low)">12% (Standard Low)</SelectItem>
                    <SelectItem value="18% (Standard High)">18% (Standard High)</SelectItem>
                    <SelectItem value="28% (Luxury / Sin Goods)">28% (Luxury / Sin Goods)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Track Inventory Box */}
            <div className="p-3.5 sm:px-4 bg-slate-50/70 border border-slate-200/90 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="modal-track-inventory-checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label 
                htmlFor="modal-track-inventory-checkbox"
                className="text-xs font-semibold text-slate-800 cursor-pointer select-none"
              >
                Track inventory stock automatically during customer checkout
              </label>
            </div>

            {/* Profit Margin Info Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 mt-2">
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
                <div className="text-lg font-black text-slate-900">
                  ₹{Math.max(0, currentPrice - costPrice)}
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    ({currentPrice > 0 ? Math.round(((currentPrice - costPrice) / currentPrice) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Applicable GST</span>
                <div className="text-sm font-bold text-slate-700">{gstRate || '3% Included'}</div>
              </div>
            </div>
          </div>

          {/* 3. INVENTORY & WAREHOUSE SECTION */}
          <div id="sec-inventory" className="modal-section bg-slate-50/60 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
              <Warehouse className="w-4 h-4 text-[#A44101]" />
              <span>Inventory & Warehouse</span>
            </div>
            <div className="space-y-4">
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
          </div>

          {/* 4. SPECIFICATIONS & CUSTOM ATTRIBUTES SECTION - EXACT MATCH TO REFERENCE DESIGN */}
          <div id="sec-specifications" className="modal-section bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  4. Specifications &amp; Custom Attributes
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {specs.length} attribute(s) configured
              </span>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 bg-slate-50/40 space-y-3">
                <h4 className="text-xs font-bold text-slate-800">
                  Add Specification
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newSpecName}
                    onChange={(e) => setNewSpecName(e.target.value)}
                    placeholder="Name (e.g. Plating / Occasion)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpec();
                      }
                    }}
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="Value (e.g. 18K Gold PVD)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpec();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Configured specifications list */}
              {specs.length > 0 && (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {specs.map((s, idx) => (
                    <div key={idx} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <span className="w-1/3 sm:w-1/4 font-bold text-slate-800 truncate" title={s.name}>
                          {s.name}
                        </span>
                        <span className="text-slate-600 truncate flex-1" title={s.value}>
                          {s.value}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove specification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 5. PRODUCT VARIANTS SECTION - EXACT MATCH TO REFERENCE DESIGN */}
          <div id="sec-variants" className="modal-section space-y-4">
            {/* Top Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Variants ({variants.length}) — expand to edit each SKU
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={handleReapplyTopDefaults}
                  className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Re-apply top defaults to all
                </button>
                <button
                  type="button"
                  onClick={handleAddNewVariant}
                  className="text-[#E11D48] hover:text-[#BE123C] font-bold cursor-pointer flex items-center gap-1"
                >
                  + Add variant (inherits top)
                </button>
              </div>
            </div>

            {/* VARIANT OPTION AXES (MAX 3) - EXACT MATCH TO USER SCREENSHOT */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#A44101]" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Variant Options
                  </h4>
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
                    className="px-3.5 py-1.5 rounded-xl border border-[#A44101]/30 hover:bg-[#A44101]/10 text-[#A44101] text-xs font-bold transition-colors cursor-pointer"
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
                <div className="space-y-3.5">
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

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateVariantsFromAxes}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate Variant Combinations</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => {
                const isExpanded = expandedVariantIds[v.id] ?? (idx === 0);
                const attrSummary = (v.attributes && v.attributes.length > 0)
                  ? v.attributes.filter(a => a.key || a.value).map(a => `${a.key || 'Opt'}: ${a.value}`).join(', ')
                  : '';

                return (
                  <div
                    key={v.id}
                    className="border border-slate-200/90 rounded-2xl bg-white shadow-xs overflow-hidden transition-all duration-200"
                  >
                    {/* Variant Accordion Header */}
                    <div
                      onClick={() => toggleVariantExpand(v.id)}
                      className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            Variant {idx + 1}
                          </span>
                          {idx === 0 && (
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                              PRIMARY
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-mono">
                            {v.sku || `SKU-${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-normal mt-0.5 truncate">
                          {attrSummary || 'No options yet'} · ₹{v.price} · Qty {v.stock}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-slate-400 hover:text-slate-600 p-1">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>

                        {variants.length > 1 && (
                          <>
                            <div className="w-[1px] h-5 bg-slate-200 mx-1" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVariant(v.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete this variant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Variant Accordion Body */}
                    {isExpanded && (
                      <div className="p-5 space-y-4 bg-white">
                        {/* 1. Variant Product Code */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Variant Product Code *
                          </label>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => updateVariantField(idx, { sku: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-purple-600"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            Auto-generated continuous series (BASE-1, BASE-2...). Do not rename here.
                          </p>
                        </div>

                        {/* 2. Attributes (optional) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                              Attributes (optional)
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddCustomAttr(idx)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>

                          {(!v.attributes || v.attributes.length === 0) ? (
                            <p className="text-xs text-slate-400">
                              No attributes. Add Color / Size pairs, or leave blank for a single SKU.
                            </p>
                          ) : (
                            <div className="space-y-2 pt-1">
                              {v.attributes.map((attr, attrIdx) => (
                                <div key={attrIdx} className="flex items-center gap-2.5">
                                  <input
                                    type="text"
                                    value={attr.key}
                                    onChange={(e) => handleUpdateAttr(idx, attrIdx, 'key', e.target.value)}
                                    placeholder="Attribute (e.g. Color)"
                                    className="w-1/3 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                                  />
                                  <input
                                    type="text"
                                    value={attr.value}
                                    onChange={(e) => handleUpdateAttr(idx, attrIdx, 'value', e.target.value)}
                                    placeholder="Value (e.g. Blue)"
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-purple-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttr(idx, attrIdx)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. Ecom Visibility */}
                        <div className="border border-emerald-200/80 bg-emerald-50/20 rounded-xl p-3.5 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              Ecom Visibility
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Show on ecommerce storefront
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateVariantField(idx, { ecomVisibility: v.ecomVisibility === false ? true : false })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              v.ecomVisibility !== false ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                v.ecomVisibility !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 4. Pricing (₹) */}
                        <div className="space-y-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                            Pricing (₹)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Base Price *
                              </label>
                              <input
                                type="number"
                                value={v.basePrice ?? originalPrice}
                                onChange={(e) => updateVariantField(idx, { basePrice: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Sale Price *
                              </label>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => updateVariantField(idx, { price: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                              />
                              <p className="text-[11px] text-slate-400 mt-1">
                                Must be strictly less than base price
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 5. Variant display & shipping */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              Variant display &amp; shipping
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Pre-filled from top product title/description. Edits here sync to the product on save (primary SKU).
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Variant title
                            </label>
                            <input
                              type="text"
                              value={v.titleOverride || ''}
                              onChange={(e) => updateVariantField(idx, { titleOverride: e.target.value })}
                              placeholder="Variant title"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Variant description
                            </label>
                            <textarea
                              rows={3}
                              value={v.description || ''}
                              onChange={(e) => updateVariantField(idx, { description: e.target.value })}
                              placeholder="Variant description..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>

                        {/* 6. Weight (kg) & dimensions (cm) */}
                        <div className="space-y-2">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              Weight (kg) &amp; dimensions (cm)
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              All four values required for variant-level shipping; otherwise product shipping is used.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Weight (kg)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={v.weight ?? 0.5}
                                onChange={(e) => updateVariantField(idx, { weight: Number(e.target.value) })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Length
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={v.dimensions?.length ?? 30}
                                onChange={(e) => updateVariantField(idx, {
                                  dimensions: {
                                    length: Number(e.target.value),
                                    width: v.dimensions?.width ?? 20,
                                    height: v.dimensions?.height ?? 10
                                  }
                                })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Width
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={v.dimensions?.width ?? 20}
                                onChange={(e) => updateVariantField(idx, {
                                  dimensions: {
                                    length: v.dimensions?.length ?? 30,
                                    width: Number(e.target.value),
                                    height: v.dimensions?.height ?? 10
                                  }
                                })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Height
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={v.dimensions?.height ?? 10}
                                onChange={(e) => updateVariantField(idx, {
                                  dimensions: {
                                    length: v.dimensions?.length ?? 30,
                                    width: v.dimensions?.width ?? 20,
                                    height: Number(e.target.value)
                                  }
                                })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 7. Track inventory */}
                        <div className="border border-slate-200/80 bg-slate-50/40 rounded-xl p-3.5 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              Track inventory
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              When off, stock is not enforced at checkout
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateVariantField(idx, { trackInventory: v.trackInventory === false ? true : false })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              v.trackInventory !== false ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                v.trackInventory !== false ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 8. Quantity & Low stock alert */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => updateVariantField(idx, { stock: Number(e.target.value) })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Low stock alert
                            </label>
                            <input
                              type="number"
                              value={v.lowStockAlert ?? 15}
                              onChange={(e) => updateVariantField(idx, { lowStockAlert: Number(e.target.value) })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>

                        {/* 9. Images (up to 4) */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Images (up to 4)
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            {Array.isArray(v.images) && v.images.slice(0, 4).map((imgItem, photoIdx) => {
                              const photoUrl = typeof imgItem === 'string' ? imgItem : (imgItem as any).url;
                              if (!photoUrl) return null;
                              return (
                                <div key={photoIdx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden group bg-slate-50">
                                  <img src={photoUrl} alt="Variant" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantPhoto(idx, photoIdx)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}

                            {(!v.images || (v.images as any[]).length < 4) && (
                              <button
                                type="button"
                                onClick={() => handleAddVariantPhoto(idx)}
                                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 text-slate-400 hover:text-purple-600 flex flex-col items-center justify-center transition-colors cursor-pointer"
                                title="Upload image (up to 4)"
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
          </div>

          {/* 6. MEDIA & IMAGES SECTION */}
          <div id="sec-images" className="modal-section bg-slate-50/60 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-sm">
              <ImageIcon className="w-4 h-4 text-[#A44101]" />
              <span>Media & Gallery Images</span>
            </div>
            <div className="space-y-4">
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
                  <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
                      }}
                    />
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
                      <img 
                        src={url} 
                        alt={`Gallery ${i}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
                        }}
                      />
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
          </div>
        </form>

        {/* Pinned Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
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
              form="product-edit-form"
              className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAddMode ? 'Create Product' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>,
    document.body
  );
};
