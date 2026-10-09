import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { 
  AdminProduct, 
  AdminCategory, 
  setProductsFromApi, 
  setCategoriesFromApi 
} from '../../../store/adminProductsSlice';
import { adminProductsApi, adminCategoriesApi } from '../../../api';

// Sub-Tab Components
import { AllProductsTab } from './products/AllProductsTab';
import { AddProductTab } from './products/AddProductTab';
import { CategoriesTab } from './products/CategoriesTab';
import { InventoryTab } from './products/InventoryTab';
import { LabelsBadgesTab } from './products/LabelsBadgesTab';
import { BulkUploadTab } from './products/BulkUploadTab';

// Modals
import { ProductEditModal } from './products/modals/ProductEditModal';
import { ArchiveConfirmDialog } from './products/modals/ArchiveConfirmDialog';
import { StockAdjustmentModal } from './products/modals/StockAdjustmentModal';
import { QuickCategoryModal } from './products/modals/QuickCategoryModal';
import { BulkUploadModal } from './products/modals/BulkUploadModal';

export type ProductSubTab = 'all' | 'add' | 'categories' | 'inventory' | 'labels' | 'bulk-upload';

export interface AdminProductsViewProps {
  initialSubTab?: ProductSubTab;
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({ initialSubTab = 'all' }) => {
  const dispatch = useAppDispatch();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ProductSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Modal States
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<AdminProduct | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategory | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          adminProductsApi.getAll({ limit: 100 }),
          adminCategoriesApi.getAll(),
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value) {
          const rawProds = prodRes.value.products || prodRes.value.data || (Array.isArray(prodRes.value) ? prodRes.value : []);
          if (Array.isArray(rawProds) && rawProds.length > 0) {
            const extractImageUrl = (item: any): string => {
              if (!item) return '';
              if (typeof item === 'string') return item;
              if (typeof item === 'object') {
                return item.url || item.secure_url || item.src || item.imageUrl || '';
              }
              return '';
            };

            const mappedProds: AdminProduct[] = rawProds.map((p: any) => {
              const firstVariant = p.variants?.[0] || {};

              // Extract Price
              let currentPrice = 0;
              if (typeof firstVariant.finalPrice === 'number' && !isNaN(firstVariant.finalPrice)) {
                currentPrice = firstVariant.finalPrice;
              } else if (firstVariant.price) {
                if (typeof firstVariant.price === 'number') {
                  currentPrice = firstVariant.price;
                } else if (typeof firstVariant.price === 'object') {
                  currentPrice = Number(firstVariant.price.sale ?? firstVariant.price.base ?? 0);
                }
              }
              if (!currentPrice && typeof p.minPrice === 'number') {
                currentPrice = p.minPrice;
              }
              if (!currentPrice && typeof p.price === 'number') {
                currentPrice = p.price;
              } else if (!currentPrice && typeof p.price === 'object') {
                currentPrice = Number(p.price?.sale ?? p.price?.base ?? 0);
              }

              let originalPrice = currentPrice;
              if (firstVariant.price && typeof firstVariant.price === 'object') {
                originalPrice = Number(firstVariant.price.base ?? firstVariant.mrp ?? p.maxPrice ?? currentPrice);
              } else if (typeof firstVariant.mrp === 'number') {
                originalPrice = firstVariant.mrp;
              } else if (typeof p.maxPrice === 'number' && p.maxPrice > 0) {
                originalPrice = p.maxPrice;
              }
              if (originalPrice < currentPrice) {
                originalPrice = currentPrice;
              }

              let discountPercentage = 0;
              if (originalPrice > currentPrice && originalPrice > 0) {
                discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
              } else if (typeof firstVariant.discountPercentage === 'number') {
                discountPercentage = firstVariant.discountPercentage;
              } else if (typeof p.maxDiscountPercentage === 'number') {
                discountPercentage = p.maxDiscountPercentage;
              }

              // Extract Stock
              const totalStock = Array.isArray(p.variants) && p.variants.length > 0
                ? p.variants.reduce((sum: number, v: any) => {
                    const q = v.inventory?.quantity ?? v.stock ?? v.availability?.ecomm?.quantity ?? 0;
                    return sum + Number(q || 0);
                  }, 0)
                : (typeof p.stock === 'number' ? p.stock : (p.inStock ? 50 : 0));

              const lowStockThreshold = firstVariant.inventory?.lowStockThreshold ?? p.lowStockThreshold ?? 10;

              // Extract Image
              let resolvedImage = '';
              if (Array.isArray(firstVariant.images) && firstVariant.images.length > 0) {
                resolvedImage = extractImageUrl(firstVariant.images[0]);
              }
              if (!resolvedImage && Array.isArray(p.variants)) {
                for (const v of p.variants) {
                  if (Array.isArray(v.images) && v.images.length > 0) {
                    resolvedImage = extractImageUrl(v.images[0]);
                    if (resolvedImage) break;
                  }
                }
              }
              if (!resolvedImage && p.seo?.og_image) {
                resolvedImage = extractImageUrl(p.seo.og_image);
              }
              if (!resolvedImage && p.image) {
                resolvedImage = extractImageUrl(p.image);
              }
              if (!resolvedImage && Array.isArray(p.images) && p.images.length > 0) {
                resolvedImage = extractImageUrl(p.images[0]);
              }
              if (!resolvedImage) {
                resolvedImage = '/images/products/placeholder.png';
              }

              const allVariantImages = Array.isArray(p.variants)
                ? p.variants.flatMap((v: any) => Array.isArray(v.images) ? v.images : [])
                : [];
              const rawGallery = Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : (allVariantImages.length > 0 ? allVariantImages : []);
              const gallery = rawGallery.map((g: any) => extractImageUrl(g)).filter(Boolean);
              if (gallery.length === 0 && resolvedImage && resolvedImage !== '/images/products/placeholder.png') {
                gallery.push(resolvedImage);
              }

              const categoryName = typeof p.category === 'object' && p.category?.name
                ? p.category.name
                : (typeof p.category === 'string' ? p.category : 'General');

              return {
                id: p._id || p.id,
                sku: firstVariant.sku || p.slug || `SKU-${(p._id || '').slice(-6)}`,
                title: p.title || p.name,
                brand: p.brand || 'Generic',
                category: categoryName,
                subcategory: p.subcategory || undefined,
                currentPrice,
                originalPrice,
                discountPercentage,
                stock: totalStock,
                lowStockThreshold,
                binLocation: p.binLocation || 'Warehouse-A',
                image: resolvedImage,
                gallery,
                rating: p.rating?.average || 4.8,
                reviews: p.rating?.count || 120,
                status: p.status === 'active' ? 'Active' : p.status === 'archived' ? 'Archived' : 'Draft',
                tag: p.isFeatured ? 'FEATURED' : undefined,
                badges: p.tags || [],
                description: p.description || '',
                dateAdded: p.createdAt || new Date().toISOString(),
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
              };
            });
            dispatch(setProductsFromApi(mappedProds));
          }
        }

        if (catRes.status === 'fulfilled' && catRes.value) {
          const rawCats = catRes.value.categories || catRes.value.data || (Array.isArray(catRes.value) ? catRes.value : []);
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
                : (c.subcategories || []);
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
        }
      } catch {
        // preserve redux store
      }
    };

    fetchCatalog();
  }, [dispatch]);

  // Handlers for Quick Category Modal
  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: AdminCategory) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Main Tab Content */}
      <main className="animate-fade-in">
        {activeTab === 'all' && (
          <AllProductsTab
            onEditProduct={(p) => setEditingProduct(p)}
            onArchiveProduct={(p) => setProductToDelete(p)}
            onStockAdjust={(p) => setStockAdjustProduct(p)}
            onOpenAddProduct={() => setActiveTab('add')}
            onOpenBulkUpload={() => setIsBulkUploadModalOpen(true)}
            onOpenQuickCategory={handleOpenAddCategory}
          />
        )}

        {activeTab === 'add' && (
          <AddProductTab
            onSuccess={() => setActiveTab('all')}
            onOpenQuickCategory={handleOpenAddCategory}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            onOpenAddCategory={handleOpenAddCategory}
            onEditCategory={handleOpenEditCategory}
            onSelectCategoryFilter={(_categoryName) => {
              setActiveTab('all');
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            onQuickAdjust={(p) => setStockAdjustProduct(p)}
          />
        )}

        {activeTab === 'labels' && (
          <LabelsBadgesTab />
        )}

        {activeTab === 'bulk-upload' && (
          <BulkUploadTab
            onSuccess={() => setActiveTab('all')}
          />
        )}
      </main>

      {/* 1. Product Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* 2. Archive / Delete Confirmation Dialog */}
      {productToDelete && (
        <ArchiveConfirmDialog
          product={productToDelete}
          onClose={() => setProductToDelete(null)}
        />
      )}

      {/* 3. Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <StockAdjustmentModal
          product={stockAdjustProduct}
          onClose={() => setStockAdjustProduct(null)}
        />
      )}

      {/* 4. Quick Category Modal */}
      {isCategoryModalOpen && (
        <QuickCategoryModal
          categoryToEdit={categoryToEdit}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setCategoryToEdit(null);
          }}
        />
      )}

      {/* 5. Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
      />
    </div>
  );
};
