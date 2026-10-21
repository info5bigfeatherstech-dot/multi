import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Package, 
  Image as ImageIcon, 
  Plus, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  Tag,
  Layers,
  ArrowLeft,
  ArrowRight,
  Star,
  Truck,
  FileText,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { updateProduct, addProduct, AdminProduct, ProductVariant } from '../../../../../store/adminProductsSlice';
import { adminProductsApi, adminCategoriesApi } from '../../../../../api';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../../../components/ui/select';

interface ProductEditModalProps {
  product?: AdminProduct | null;
  mode?: 'edit' | 'add';
  onClose: () => void;
  onSuccess?: () => void;
}

// Helper functions to safely handle numeric tax rates for backend compliance
const extractTaxRateNumber = (val: any): number => {
  if (typeof val === 'number' && !isNaN(val)) return Math.max(0, val);
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.]/g, ' ').trim().split(/\s+/)[0];
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  return 0;
};

const extractTaxRateString = (val: any): string => {
  const num = extractTaxRateNumber(val);
  return String(num);
};

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ 
  product, 
  mode = product ? 'edit' : 'add', 
  onClose,
  onSuccess
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.adminProducts.categories);
  const isAddMode = mode === 'add' || !product;

  // Form States matching screenshot fields
  const [internalName, setInternalName] = useState(
    isAddMode ? '' : ((product as any)?.name || (product as any)?.internalName || product?.title || '')
  );
  const [title, setTitle] = useState(isAddMode ? '' : (product?.title || ''));
  const [sku, setSku] = useState(isAddMode ? '' : (product?.sku || ''));
  const [brand, setBrand] = useState(isAddMode ? '' : (product?.brand || ''));
  const [category, setCategory] = useState(isAddMode ? '' : (product?.category || ''));
  const [subcategory, setSubcategory] = useState(isAddMode ? '' : (product?.subcategory || ''));
  const [description, setDescription] = useState(isAddMode ? '' : (product?.description || ''));
  const [status, setStatus] = useState<'Draft' | 'Active' | 'Archived'>(
    isAddMode ? 'Draft' : (((product?.status as string) === 'Active' || (product?.status as string) === 'active') ? 'Active' : ((product?.status as string) === 'Archived' || (product?.status as string) === 'archived') ? 'Archived' : 'Draft')
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(
    Boolean((product as any)?.isFeatured ?? (product as any)?.featured ?? false)
  );
  const [tag] = useState(isAddMode ? '' : (product?.tag || ''));

  // Section 2: Pricing & Stock
  const [currentPrice, setCurrentPrice] = useState<number | ''>(isAddMode ? '' : (product?.currentPrice ?? ''));
  const [originalPrice, setOriginalPrice] = useState<number | ''>(isAddMode ? '' : (product?.originalPrice ?? ''));
  const [costPrice] = useState<number | ''>(isAddMode ? '' : (product?.costPrice || ''));
  const [stock, setStock] = useState<number | ''>(isAddMode ? '' : (product?.stock ?? ''));
  const [moq, setMoq] = useState<number | ''>(isAddMode ? '' : ((product as any)?.moq ?? (product as any)?.minimumOrderQuantity ?? ''));
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(isAddMode ? '' : (product?.lowStockThreshold ?? ''));
  const [hsnCode, setHsnCode] = useState(isAddMode ? '' : ((product as any)?.hsnCode || ''));
  const [gstRate, setGstRate] = useState<string>(() => {
    if (isAddMode) return '';
    const raw = (product as any)?.taxRate ?? (product as any)?.gstRate ?? (product as any)?.tax;
    return raw !== undefined && raw !== null ? extractTaxRateString(raw) : '';
  });
  const [trackInventory, setTrackInventory] = useState(true);
  const [binLocation] = useState(isAddMode ? '' : (product?.binLocation || ''));

  // Section 3: Logistics & Dimensions
  const [deadWeight, setDeadWeight] = useState<number | ''>(
    isAddMode ? '' : ((product as any)?.shipping?.weight ?? (product as any)?.weight ?? '')
  );
  const [length, setLength] = useState<number | ''>(
    isAddMode ? '' : ((product as any)?.shipping?.dimensions?.length ?? (product as any)?.dimensions?.length ?? '')
  );
  const [width, setWidth] = useState<number | ''>(
    isAddMode ? '' : ((product as any)?.shipping?.dimensions?.width ?? (product as any)?.dimensions?.width ?? '')
  );
  const [height, setHeight] = useState<number | ''>(
    isAddMode ? '' : ((product as any)?.shipping?.dimensions?.height ?? (product as any)?.dimensions?.height ?? '')
  );
  const [isFragile, setIsFragile] = useState<boolean>(
    Boolean((product as any)?.isFragile ?? false)
  );

  // Quick Category inline toggle
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
      toast.error('Please enter specification name and value');
      return;
    }
    const specName = newSpecName.trim();
    const specValue = newSpecValue.trim();
    setSpecs(prev => [...prev, { name: specName, value: specValue }]);

    // Propagate the new key into existing variants with empty value if not present
    setVariants(prev => prev.map(v => {
      const existingAttrs = v.attributes || [];
      const alreadyHasKey = existingAttrs.some(
        a => a.key?.toLowerCase() === specName.toLowerCase()
      );
      if (alreadyHasKey) return v;
      return {
        ...v,
        attributes: [...existingAttrs, { key: specName, value: '' }]
      };
    }));

    setNewSpecName('');
    setNewSpecValue('');
    toast.success('Specification added');
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
        sku: isAddMode ? '' : (product?.sku || sku || ''),
        titleOverride: isAddMode ? '' : (product?.title || title || ''),
        description: isAddMode ? '' : (product?.description || description || ''),
        price: (isAddMode || product?.currentPrice === undefined) ? ('' as any) : Number(product.currentPrice),
        basePrice: (isAddMode || product?.originalPrice === undefined) ? ('' as any) : Number(product.originalPrice),
        stock: (isAddMode || product?.stock === undefined) ? ('' as any) : Number(product.stock),
        lowStockAlert: (isAddMode || product?.lowStockThreshold === undefined) ? ('' as any) : Number(product.lowStockThreshold),
        moq: isAddMode ? ('' as any) : 1,
        weight: isAddMode ? ('' as any) : 0.5,
        dimensions: isAddMode ? { length: '' as any, width: '' as any, height: '' as any } : { length: 30, width: 20, height: 10 },
        isActive: true,
        ecomVisibility: true,
        trackInventory: true,
        images: product?.image ? [product.image] : [],
        attributes: []
      }
    ];
  };

  const [variants, setVariants] = useState<ProductVariant[]>(parseInitialVariants);

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

  const handleVariantPhotoUpload = (varIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      if (base64Url) {
        setVariants(prev => {
          const copy = [...prev];
          const imgs = copy[varIdx].images ? [...(copy[varIdx].images as any[])] : [];
          if (imgs.length >= 4) {
            toast.error('Maximum 4 photos allowed per variant');
            return prev;
          }
          imgs.push(base64Url);
          copy[varIdx] = { ...copy[varIdx], images: imgs };
          return copy;
        });
        toast.success('Variant photo uploaded');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePrimaryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      if (base64Url) {
        setImage(base64Url);
        toast.success('Primary photo uploaded');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    let loadedCount = 0;
    const newImgs: string[] = [];

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        if (base64Url) {
          newImgs.push(base64Url);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setGallery(prev => [...prev, ...newImgs]);
          toast.success('Photos uploaded successfully');
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveVariantPhoto = (varIdx: number, photoIdx: number) => {
    setVariants(prev => {
      const copy = [...prev];
      const imgs = (copy[varIdx].images as any[] || []).filter((_, i) => i !== photoIdx);
      copy[varIdx] = { ...copy[varIdx], images: imgs };
      return copy;
    });
  };

  // Drag & Drop / Move helpers for Variant Photos
  const [draggedVarPhoto, setDraggedVarPhoto] = useState<{ varIdx: number; photoIdx: number } | null>(null);

  const handleMoveVariantPhoto = (varIdx: number, fromIdx: number, toIdx: number) => {
    setVariants((prev) => {
      const copy = [...prev];
      const imgs = [...(copy[varIdx].images as any[] || [])];
      if (toIdx < 0 || toIdx >= imgs.length) return prev;
      const [moved] = imgs.splice(fromIdx, 1);
      imgs.splice(toIdx, 0, moved);
      copy[varIdx] = { ...copy[varIdx], images: imgs };
      return copy;
    });
  };

  const handleVariantPhotoDragStart = (e: React.DragEvent, varIdx: number, photoIdx: number) => {
    setDraggedVarPhoto({ varIdx, photoIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${varIdx}-${photoIdx}`);
  };

  const handleVariantPhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleVariantPhotoDrop = (e: React.DragEvent, varIdx: number, dropPhotoIdx: number) => {
    e.preventDefault();
    if (!draggedVarPhoto || draggedVarPhoto.varIdx !== varIdx || draggedVarPhoto.photoIdx === dropPhotoIdx) {
      setDraggedVarPhoto(null);
      return;
    }
    handleMoveVariantPhoto(varIdx, draggedVarPhoto.photoIdx, dropPhotoIdx);
    setDraggedVarPhoto(null);
    toast.success('Photo order updated');
  };

  // Drag & Drop / Move helpers for Gallery Photos
  const [draggedGalleryIdx, setDraggedGalleryIdx] = useState<number | null>(null);

  const handleMoveGalleryPhoto = (fromIdx: number, toIdx: number) => {
    setGallery((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  const handleGalleryDragStart = (e: React.DragEvent, index: number) => {
    setDraggedGalleryIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleGalleryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleGalleryDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedGalleryIdx === null || draggedGalleryIdx === dropIndex) {
      setDraggedGalleryIdx(null);
      return;
    }
    handleMoveGalleryPhoto(draggedGalleryIdx, dropIndex);
    setDraggedGalleryIdx(null);
    toast.success('Photo order updated');
  };

  const handleMakeGalleryPhotoPrimary = (idx: number) => {
    const selected = gallery[idx];
    if (!selected) return;
    const oldPrimary = image;
    setImage(selected);
    setGallery((prev) => {
      const copy = prev.filter((_, i) => i !== idx);
      if (oldPrimary) {
        copy.unshift(oldPrimary);
      }
      return copy;
    });
    toast.success('Set as primary photo');
  };

  const handleAddNewVariant = () => {
    const newIdx = variants.length + 1;
    const baseSku = sku.trim();
    const newId = `var-${Date.now()}`;

    // Collect all unique specification and variant attribute keys configured so far
    const inheritedKeys = Array.from(
      new Set([
        ...specs.map(s => s.name?.trim()).filter(Boolean),
        ...variants.flatMap(v => (v.attributes || []).map(a => a.key?.trim()).filter(Boolean))
      ])
    );

    const newVar: ProductVariant = {
      id: newId,
      name: `Variant ${newIdx}`,
      sku: baseSku ? `${baseSku}-${newIdx}` : '',
      titleOverride: '',
      description: '',
      price: currentPrice !== '' ? Number(currentPrice) : ('' as any),
      basePrice: originalPrice !== '' ? Number(originalPrice) : ('' as any),
      stock: stock !== '' ? Number(stock) : ('' as any),
      lowStockAlert: lowStockThreshold !== '' ? Number(lowStockThreshold) : ('' as any),
      moq: moq !== '' ? Number(moq) : ('' as any),
      weight: deadWeight !== '' ? Number(deadWeight) : ('' as any),
      dimensions: { 
        length: length !== '' ? Number(length) : ('' as any), 
        width: width !== '' ? Number(width) : ('' as any), 
        height: height !== '' ? Number(height) : ('' as any) 
      },
      isActive: true,
      ecomVisibility: true,
      trackInventory: trackInventory,
      images: [],
      // Pre-fill only the keys with blank values for the new variant
      attributes: inheritedKeys.map(key => ({ key, value: '' }))
    };
    setVariants(prev => [...prev, newVar]);
    setExpandedVariantIds(prev => ({ ...prev, [newId]: true }));
  };

  const handleAddQuickAttrToVariant = (varIdx: number, attrName: string) => {
    setVariants(prev => {
      const copy = [...prev];
      const attrs = copy[varIdx].attributes ? [...copy[varIdx].attributes!] : [];
      attrs.push({ key: attrName, value: '' });
      copy[varIdx] = { ...copy[varIdx], attributes: attrs };
      return copy;
    });
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      toast.error('Product must have at least one variant');
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
    const finalTitle = title.trim() || internalName.trim();
    const finalName = internalName.trim() || title.trim();

    if (!finalTitle) {
      toast.error('Please enter a product title');
      document.getElementById('sec-general')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const calculatedDiscount = originalPrice > currentPrice
      ? Math.round(((Number(originalPrice) - Number(currentPrice)) / Number(originalPrice)) * 100)
      : 0;

    const finalShipping = {
      weight: Number(deadWeight) || 1,
      dimensions: {
        length: Number(length) || 1,
        width: Number(width) || 1,
        height: Number(height) || 1
      }
    };

    const numericTaxRate = extractTaxRateNumber(gstRate);

    const payloadVariants = variants.map((v: any, idx: number) => {
      const variantImages = (v.images && v.images.length > 0 ? v.images : [image, ...gallery])
        .filter(Boolean)
        .slice(0, 4)
        .map((imgObj: any, orderIdx: number) => ({
          url: typeof imgObj === 'string' ? imgObj : imgObj.url,
          altText: v.titleOverride || finalTitle,
          order: orderIdx
        }));

      return {
        ...v,
        sku: v.sku?.trim() || `${sku.trim()}-${idx + 1}`,
        productCode: v.sku?.trim() || `${sku.trim()}-${idx + 1}`,
        title: v.titleOverride?.trim() || (idx === 0 ? finalTitle : `${finalTitle} - Variant ${idx + 1}`),
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
          ecomm: ((status as string) === 'Inactive' || v.ecomVisibility === false) ? 'draft' : 'active',
          wholesale: 'active'
        },
        minimumOrderQuantity: Number(v.moq) || 1,
        taxRate: numericTaxRate,
        gstRate: numericTaxRate,
        tax: numericTaxRate,
        shipping: {
          weight: Number(v.weight) || finalShipping.weight,
          dimensions: {
            length: Number(v.dimensions?.length) || finalShipping.dimensions.length,
            width: Number(v.dimensions?.width) || finalShipping.dimensions.width,
            height: Number(v.dimensions?.height) || finalShipping.dimensions.height
          }
        },
        isActive: ((status as string) !== 'Inactive' && v.isActive !== false),
        attributes: (v.attributes || []).filter((a: any) => a.key?.trim() && a.value?.trim()),
        images: variantImages
      };
    });

    const attributesPayload = specs.map(s => ({ key: s.name.trim(), value: s.value.trim() }));
    const attributesObj: Record<string, string> = {};
    specs.forEach(s => {
      if (s.name.trim()) attributesObj[s.name.trim()] = s.value.trim();
    });

    const backendStatus = (status as string) === 'Inactive' || status === 'Draft' ? 'draft' : (status === 'Archived' ? 'archived' : 'active');

    // Resolve Category MongoDB ObjectId for backend Mongoose model
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === category.trim().toLowerCase() || c.id === category.trim()
    );

    const rawIdCandidates = [
      matchedCategory?.id,
      (product as any)?.categoryId,
      typeof (product as any)?.category === 'object' ? ((product as any)?.category?._id || (product as any)?.category?.id) : undefined,
      category,
      product?.category,
      categories[0]?.id
    ];

    const backendCategoryId = rawIdCandidates.find(
      (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)
    ) || matchedCategory?.id || categories[0]?.id || category;

    const displayCategoryName = matchedCategory?.name || category || 'General';

    if (isAddMode) {
      const newProdId = `prod-${Date.now()}`;
      (async () => {
        try {
          await adminProductsApi.create({
            title: finalTitle,
            name: finalName,
            description: description.trim(),
            status: backendStatus,
            channelStatus: {
              ecomm: backendStatus,
              wholesale: 'active'
            },
            brand: brand.trim(),
            category: backendCategoryId,
            subcategory,
            image: image.trim(),
            cardImage: { url: image.trim() },
            images: [image.trim(), ...gallery].filter(Boolean).map((u, i) => ({ url: u, order: i })),
            attributes: attributesPayload,
            specifications: specs,
            shipping: finalShipping,
            isFragile,
            isFeatured,
            hsnCode: hsnCode.trim(),
            taxRate: numericTaxRate,
            gstRate: numericTaxRate,
            tax: numericTaxRate,
            trackInventory,
            price: {
              base: Number(originalPrice),
              sale: Number(currentPrice),
              current: Number(currentPrice)
            },
            inventory: {
              quantity: Number(stock),
              lowStockThreshold: Number(lowStockThreshold),
              trackInventory
            },
            variants: payloadVariants
          });
        } catch (apiErr: any) {
          console.warn('Backend create returned error, sync may be local:', apiErr);
          toast.error(apiErr?.message || 'Failed to sync product to server');
        }
      })();

      dispatch(addProduct({
        id: newProdId,
        sku: sku.trim(),
        title: finalTitle,
        brand: brand.trim(),
        category: displayCategoryName,
        categoryId: backendCategoryId,
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
        gstRate: numericTaxRate,
        taxRate: numericTaxRate,
        trackInventory,
        binLocation: binLocation.trim(),
        image: image.trim() || (gallery.length > 0 ? gallery[0] : (variants[0]?.images?.[0] ? (typeof variants[0].images[0] === 'string' ? variants[0].images[0] : (variants[0].images[0] as any).url) : '')) || '/images/products/placeholder.svg',
        gallery,
        variants,
        attributes: attributesObj,
        specifications: specs,
        shipping: finalShipping,
        isFragile,
        isFeatured,
        rating: 4.8,
        reviews: 0,
        dateAdded: new Date().toISOString()
      }));

      toast.success('Product created successfully!');
      onSuccess?.();
      onClose();
      return;
    }

    // Edit Mode
    (async () => {
      const primaryTarget = product?.slug || (product as any)?._id || product?.id || product?.sku || sku;
      const fallbackTarget = (product as any)?._id || product?.id;

      const updateData = {
        title: finalTitle,
        name: finalName,
        description: description.trim(),
        status: backendStatus,
        channelStatus: {
          ecomm: backendStatus,
          wholesale: 'active'
        },
        brand: brand.trim(),
        category: backendCategoryId,
        subcategory,
        image: image.trim(),
        cardImage: { url: image.trim() },
        images: [image.trim(), ...gallery].filter(Boolean).map((u, i) => ({ url: u, order: i })),
        attributes: attributesPayload,
        specifications: specs,
        shipping: finalShipping,
        isFragile,
        isFeatured,
        hsnCode: hsnCode.trim(),
        taxRate: numericTaxRate,
        gstRate: numericTaxRate,
        tax: numericTaxRate,
        trackInventory,
        price: {
          base: Number(originalPrice),
          sale: Number(currentPrice),
          current: Number(currentPrice)
        },
        inventory: {
          quantity: Number(stock),
          lowStockThreshold: Number(lowStockThreshold),
          trackInventory
        },
        variants: payloadVariants
      };

      try {
        await adminProductsApi.update(primaryTarget, updateData);
      } catch (apiErr: any) {
        if (fallbackTarget && fallbackTarget !== primaryTarget) {
          try {
            await adminProductsApi.update(fallbackTarget, updateData);
          } catch (retryErr: any) {
            console.warn('Backend update failed:', retryErr);
          }
        } else {
          console.warn('Backend update returned error, sync is local:', apiErr);
        }
      }
    })();

    if (product) {
      dispatch(updateProduct({
        id: product.id,
        updates: {
          title: finalTitle,
          sku: sku.trim(),
          brand: brand.trim(),
          category: displayCategoryName,
          categoryId: backendCategoryId,
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
          gstRate: numericTaxRate,
          taxRate: numericTaxRate,
          trackInventory,
          binLocation: binLocation.trim(),
          image: image.trim(),
          gallery,
          variants,
          attributes: attributesObj,
          specifications: specs,
          shipping: finalShipping,
          isFragile,
          isFeatured
        }
      }));
    }

    toast.success('Product updated successfully!');
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
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-50/90 border-b border-slate-200 text-xs shrink-0 overflow-x-auto no-scrollbar font-medium">
          <button
            type="button"
            onClick={() => document.getElementById('sec-general')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            1. General
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-pricing')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            2. Pricing &amp; Stock
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-logistics')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            3. Logistics
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-specifications')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            4. Specs ({specs.length})
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-images')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            5. Media ({(image ? 1 : 0) + gallery.length})
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => document.getElementById('sec-variants')?.scrollIntoView({ block: 'nearest' })}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-[#A44101] hover:bg-white font-bold transition-colors cursor-pointer"
          >
            6. Variants ({variants.length})
          </button>
        </div>

        {/* Modal Form Content */}
        <form id="product-edit-form" noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 modal-scroll overscroll-contain">
          {/* 1. GENERAL & PRODUCT IDENTITY */}
          <div id="sec-general" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. General &amp; Product Identity
              </h3>
            </div>

            {/* Row 1: Product Name (Internal) * & Storefront Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Product Name (Internal) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={internalName}
                  onChange={(e) => setInternalName(e.target.value)}
                  placeholder="e.g. test"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Storefront Title (Seen by Customers)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. sdhusd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>
            </div>

            {/* Row 2: Category (+ Add), Brand / Maker, SKU / Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-0.5"
                  >
                    + Add
                  </button>
                </div>
                {showAddCategoryInline ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-orange-300 bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const trimmed = newCategoryName.trim();
                        if (trimmed) {
                          try {
                            const res = await adminCategoriesApi.create({ name: trimmed });
                            const createdCat = res?.category || res?.data || res;
                            if (createdCat?._id || createdCat?.id) {
                              setCategory(createdCat.name || trimmed);
                              toast.success('Category added');
                            } else {
                              setCategory(trimmed);
                              toast.success('Category selected');
                            }
                          } catch {
                            setCategory(trimmed);
                            toast.success('Category selected');
                          }
                          setNewCategoryName('');
                          setShowAddCategoryInline(false);
                        }
                      }}
                      className="px-2.5 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 shrink-0 cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <Select
                    value={category || '__none__'}
                    onValueChange={(val) => {
                      setCategory(val === '__none__' ? '' : val);
                      setSubcategory('');
                    }}
                  >
                    <SelectTrigger className="w-full h-10.5 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
                      <SelectValue placeholder="Select Category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select Category...</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Brand / Maker
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Generic"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  SKU / Code
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-398-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>
            </div>

            {/* Row 3: Full Product Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Full Product Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed specs, features and key benefits..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-y"
              />
            </div>

            {/* Row 4: Catalog Lifecycle Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Catalog Lifecycle Status
                </label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as any)}
                >
                  <SelectTrigger className="w-full h-10.5 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft (Internal Staging Only)</SelectItem>
                    <SelectItem value="Active">Active (Live in Storefront)</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-slate-200/90 bg-slate-50/70 rounded-xl p-3 flex items-center gap-2.5 sm:mt-5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  status === 'Active' ? 'bg-emerald-500' : status === 'Archived' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                <span className="text-xs text-slate-600">
                  Product is currently <strong className="text-slate-900">{status}</strong> in catalog.
                </span>
              </div>
            </div>

            {/* Row 5: Featured Product Showcase card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-purple-200/70 bg-gradient-to-r from-purple-50/40 via-white to-purple-50/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      Featured Product Showcase
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                      isFeatured ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isFeatured ? 'ACTIVE ON SHOWCASE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate sm:whitespace-normal">
                    Spotlight this item in the storefront Hero carousel, Top Deals showcase, and featured wholesale cards.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                  isFeatured ? 'bg-purple-600' : 'bg-slate-300'
                }`}
                title="Toggle featured showcase"
              >
                <span
                  className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isFeatured ? 'translate-x-5 text-purple-600' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </span>
              </button>
            </div>
          </div>

          {/* 2. PRODUCT PRICING & STOCK */}
          <div id="sec-pricing" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Product Pricing &amp; Stock
              </h3>
            </div>

            {/* Row 1: Selling Price & MRP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Selling Price (Base ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    placeholder="200"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  MRP (Maximum Retail Price ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    placeholder="300"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Available Stock Quantity, Min. Order Qty, Low Stock Alert Level */}
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
                  value={gstRate || '__none__'}
                  onValueChange={(val) => setGstRate(val === '__none__' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-10.5 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800">
                    <SelectValue placeholder="Select GST Tax Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select GST Tax Rate...</SelectItem>
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
          </div>

          {/* 3. LOGISTICS & PACKAGE DIMENSIONS */}
          <div id="sec-logistics" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Logistics &amp; Package Dimensions
              </h3>
            </div>

            {/* Row 1: Dead Weight (kg) *, Length (cm), Width (cm), Height (cm) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Dead Weight (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={deadWeight}
                  onChange={(e) => setDeadWeight(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Length (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Width (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
                />
              </div>
            </div>

            {/* Row 2: Fragile item checkbox card */}
            <div className="p-3.5 sm:px-4 bg-slate-50/70 border border-slate-200/90 rounded-xl flex items-center gap-3">
              <input
                type="checkbox"
                id="modal-fragile-checkbox"
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label 
                htmlFor="modal-fragile-checkbox"
                className="text-xs font-semibold text-slate-800 cursor-pointer select-none"
              >
                Fragile Item / Handle with special shipping care
              </label>
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

          {/* 5. MEDIA & PRODUCT GALLERY */}
          <div id="sec-images" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  5. Media &amp; Product Gallery
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {((image ? 1 : 0) + gallery.length)} image(s) attached
              </span>
            </div>

            <div className="space-y-4">
              {/* Photo Thumbnails + Upload Box Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Primary Image Thumbnail */}
                {image && (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 shadow-xs">
                    <img
                      src={image}
                      alt="Primary"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#F97316] text-white text-[10px] font-bold shadow-xs">
                      Primary
                    </span>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                      title="Remove primary image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Additional Gallery Images */}
                {gallery.map((url, i) => {
                  const isDragging = draggedGalleryIdx === i;
                  return (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => handleGalleryDragStart(e, i)}
                      onDragOver={handleGalleryDragOver}
                      onDrop={(e) => handleGalleryDrop(e, i)}
                      className={`relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 cursor-grab active:cursor-grabbing transition-all shadow-xs ${
                        isDragging ? 'opacity-40 scale-95 border-orange-500' : 'hover:shadow-md'
                      }`}
                      title="Drag to change sequence order"
                    >
                      <img
                        src={url}
                        alt={`Gallery ${i}`}
                        className="w-full h-full object-cover pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/products/placeholder.svg';
                        }}
                      />
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 text-white text-[9px] font-bold font-mono">
                        #{i + 1}
                      </span>
                      <div className="absolute inset-x-0 top-0 p-1.5 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveGalleryPhoto(i, i - 1); }}
                              className="w-4 h-4 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
                              title="Move earlier"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {i < gallery.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMoveGalleryPhoto(i, i + 1); }}
                              className="w-4 h-4 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
                              title="Move later"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMakeGalleryPhotoPrimary(i); }}
                            className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 cursor-pointer"
                            title="Make Primary Thumbnail"
                          >
                            <Star className="w-2.5 h-2.5 fill-current" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveGalleryImage(i); }}
                          className="w-4 h-4 rounded bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Dashed Upload Box for Local Computer Photos */}
                <label
                  className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-500 text-slate-500 hover:text-orange-600 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 hover:bg-white transition-all shrink-0"
                  title="Upload image from computer"
                >
                  <Upload className="w-5 h-5 stroke-[1.8]" />
                  <span className="text-xs font-semibold">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (!image) {
                        handlePrimaryImageUpload(e);
                      } else {
                        handleGalleryUpload(e);
                      }
                    }}
                  />
                </label>
              </div>

              {/* URL Input Bar */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="https://example.com/cdn/image.jpg"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!image && newGalleryUrl.trim()) {
                        setImage(newGalleryUrl.trim());
                        setNewGalleryUrl('');
                      } else {
                        handleAddGalleryImage();
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!image && newGalleryUrl.trim()) {
                      setImage(newGalleryUrl.trim());
                      setNewGalleryUrl('');
                    } else {
                      handleAddGalleryImage();
                    }
                  }}
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          {/* 6. PRODUCT VARIANTS */}
          <div id="sec-variants" className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  6. Product Variants ({variants.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddNewVariant}
                className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Variant</span>
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => {
                const isExpanded = expandedVariantIds[v.id] ?? (idx === 0);
                const isPrimary = idx === 0;
                const attributesSummary = v.attributes && v.attributes.length > 0
                  ? v.attributes.map(a => `${a.key}: ${a.value}`).join(', ')
                  : 'No custom options';

                return (
                  <div
                    key={v.id}
                    className="border border-purple-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                  >
                    {/* Variant Accordion Header */}
                    <div
                      onClick={() => toggleVariantExpand(v.id)}
                      className="p-3.5 sm:px-5 bg-purple-50/20 hover:bg-purple-50/40 border-b border-purple-100/70 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              Variant {idx + 1}
                            </span>
                            {isPrimary && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold tracking-wide uppercase">
                                PRIMARY
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-600 font-mono text-[10px] font-medium">
                              {v.sku ? v.sku : (sku.trim() ? `${sku.trim()}-${idx + 1}` : `VAR-${idx + 1}`)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {attributesSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 shrink-0">
                        <span>Price: <strong className="text-slate-900 font-bold">₹{v.price}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Stock: <strong className="text-slate-900 font-bold">{v.stock}</strong></span>
                        <span className="text-slate-300">|</span>
                        <label 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={v.isActive !== false}
                            onChange={(e) => updateVariantField(idx, { isActive: e.target.checked })}
                            className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-700">Active</span>
                        </label>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveVariant(v.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="p-1 text-slate-400 hover:text-slate-700">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Variant Body */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 space-y-5 bg-white">
                        {/* Row 1: SKU & Title Override */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                              Variant SKU / Product Code
                            </label>
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => updateVariantField(idx, { sku: e.target.value })}
                              placeholder="398-1"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                              Variant Title Override (Optional)
                            </label>
                            <input
                              type="text"
                              value={v.titleOverride || ''}
                              onChange={(e) => updateVariantField(idx, { titleOverride: e.target.value })}
                              placeholder="e.g. Pack of 2 / 200g Blue"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>

                        {/* Subcard: Variant Attributes & Options */}
                        <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-slate-50/40 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">
                                Variant Attributes &amp; Options
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Edit any attribute key and value (e.g. Color: Gold, Size: Free, Weight: 250g)
                              </p>
                            </div>
                            {/* Preset Chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {['Color', 'Size', 'Weight', 'Material', 'Pack', 'Style'].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => handleAddQuickAttrToVariant(idx, chip)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                  +{chip}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddCustomAttr(idx)}
                                className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              >
                                + Custom
                              </button>
                            </div>
                          </div>

                          {/* Attribute rows */}
                          <div className="space-y-2 pt-1">
                            {(!v.attributes || v.attributes.length === 0) ? (
                              <p className="text-xs text-slate-400 italic py-1">
                                No custom options configured. Click a button above like +Color or +Size to add.
                              </p>
                            ) : (
                              v.attributes.map((attr, attrIdx) => (
                                <div key={attrIdx} className="flex items-center gap-2.5">
                                  <input
                                    type="text"
                                    value={attr.key}
                                    onChange={(e) => handleUpdateAttr(idx, attrIdx, 'key', e.target.value)}
                                    placeholder="Color"
                                    className="w-1/3 sm:w-1/4 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                                  />
                                  <input
                                    type="text"
                                    value={attr.value}
                                    onChange={(e) => handleUpdateAttr(idx, attrIdx, 'value', e.target.value)}
                                    placeholder="Value (e.g. Gold / 250g / Pack of 3)"
                                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttr(idx, attrIdx)}
                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Remove option"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Row 2: Sale Price, Base MRP, Stock Quantity, MOQ Units */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                              Sale Price (₹)
                            </label>
                            <input
                              type="number"
                              value={v.price === 0 ? 0 : (v.price || '')}
                              placeholder="200"
                              onChange={(e) => updateVariantField(idx, { price: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                              Base MRP (₹)
                            </label>
                            <input
                              type="number"
                              value={v.basePrice === 0 ? 0 : (v.basePrice || '')}
                              placeholder="300"
                              onChange={(e) => updateVariantField(idx, { basePrice: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                              Stock Quantity
                            </label>
                            <input
                              type="number"
                              value={v.stock === 0 ? 0 : (v.stock || '')}
                              placeholder="20"
                              onChange={(e) => updateVariantField(idx, { stock: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1.5">
                              MOQ Units
                            </label>
                            <input
                              type="number"
                              value={v.moq === 0 ? 0 : (v.moq || '')}
                              placeholder="10"
                              onChange={(e) => updateVariantField(idx, { moq: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>

                        {/* Subcard: Variant Package Weight & Shipping Dimensions */}
                        <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-slate-50/40 space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">
                              Variant Package Weight &amp; Shipping Dimensions
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Edit weight (kg) and parcel size for this variant. (Default fallback: 1 kg, 1 × 1 × 1 cm)
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                                Weight (kg)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={v.weight === 0 ? 0 : (v.weight || '')}
                                placeholder="1"
                                onChange={(e) => updateVariantField(idx, { weight: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                                Length (cm)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={v.dimensions?.length ?? ''}
                                placeholder="1"
                                onChange={(e) => updateVariantField(idx, {
                                  dimensions: {
                                    ...v.dimensions,
                                    length: e.target.value === '' ? undefined : Number(e.target.value)
                                  }
                                })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                                Width (cm)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={v.dimensions?.width ?? ''}
                                placeholder="1"
                                onChange={(e) => updateVariantField(idx, {
                                  dimensions: {
                                    ...v.dimensions,
                                    width: e.target.value === '' ? undefined : Number(e.target.value)
                                  }
                                })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                                Height (cm)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={v.dimensions?.height ?? ''}
                                placeholder="1"
                                onChange={(e) => updateVariantField(idx, {
                                  dimensions: {
                                    ...v.dimensions,
                                    height: e.target.value === '' ? undefined : Number(e.target.value)
                                  }
                                })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Variant-Specific Photos */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Variant-Specific Photos
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            {Array.isArray(v.images) && v.images.slice(0, 4).map((imgItem, photoIdx) => {
                              const photoUrl = typeof imgItem === 'string' ? imgItem : (imgItem as any).url;
                              if (!photoUrl) return null;
                              const isDragging = draggedVarPhoto?.varIdx === idx && draggedVarPhoto?.photoIdx === photoIdx;
                              const totalPhotos = (v.images as any[]).length;
                              return (
                                <div 
                                  key={photoIdx} 
                                  draggable
                                  onDragStart={(e) => handleVariantPhotoDragStart(e, idx, photoIdx)}
                                  onDragOver={handleVariantPhotoDragOver}
                                  onDrop={(e) => handleVariantPhotoDrop(e, idx, photoIdx)}
                                  className={`relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden group bg-slate-50 cursor-grab active:cursor-grabbing transition-all ${
                                    isDragging ? 'opacity-40 scale-95 border-purple-500' : 'hover:shadow-md'
                                  }`}
                                  title="Drag to change sequence order"
                                >
                                  <img src={photoUrl} alt="Variant" className="w-full h-full object-cover pointer-events-none" />
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 text-white text-[9px] font-bold font-mono">
                                    #{photoIdx + 1}
                                  </span>

                                  <div className="absolute inset-x-0 top-0 p-1 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-0.5">
                                      {photoIdx > 0 && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleMoveVariantPhoto(idx, photoIdx, photoIdx - 1); }}
                                          className="w-4 h-4 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
                                          title="Move earlier"
                                        >
                                          <ArrowLeft className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      {photoIdx < totalPhotos - 1 && (
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleMoveVariantPhoto(idx, photoIdx, photoIdx + 1); }}
                                          className="w-4 h-4 rounded bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
                                          title="Move later"
                                        >
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveVariantPhoto(idx, photoIdx); }}
                                      className="w-4 h-4 rounded bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 cursor-pointer"
                                      title="Remove photo"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {(!v.images || (v.images as any[]).length < 4) && (
                              <label
                                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 text-slate-400 hover:text-purple-600 flex flex-col items-center justify-center transition-colors cursor-pointer bg-white"
                                title="Upload image from computer (up to 4)"
                              >
                                <Upload className="w-5 h-5 stroke-[1.8]" />
                                <span className="text-[10px] mt-1 font-semibold">Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleVariantPhotoUpload(idx, e)}
                                />
                              </label>
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
