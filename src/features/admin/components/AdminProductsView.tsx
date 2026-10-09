import React, { useState } from 'react';
import { 
  Package, 
  PlusCircle, 
  Layers, 
  Warehouse, 
  Tag, 
  UploadCloud,
  ArrowLeft,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { AdminProduct, AdminCategory } from '../../../store/adminProductsSlice';

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

export const AdminProductsView: React.FC = () => {
  const { products, categories } = useAppSelector((state) => state.adminProducts);

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<ProductSubTab>('all');

  // Modal States
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<AdminProduct | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<AdminCategory | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  // Badge counts
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalStockAlerts = lowStockCount + outOfStockCount;

  // Handlers for Quick Category Modal
  const handleOpenAddCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: AdminCategory) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const tabsConfig = [
    {
      id: 'all' as ProductSubTab,
      label: 'All Products',
      icon: Package,
      badge: products.length.toString(),
    },
    {
      id: 'add' as ProductSubTab,
      label: 'Add Product',
      icon: PlusCircle,
    },
    {
      id: 'categories' as ProductSubTab,
      label: 'Categories',
      icon: Layers,
      badge: categories.length.toString(),
    },
    {
      id: 'inventory' as ProductSubTab,
      label: 'Inventory Control',
      icon: Warehouse,
      badge: totalStockAlerts > 0 ? `${totalStockAlerts} alerts` : undefined,
      badgeColor: totalStockAlerts > 0 ? 'bg-amber-100 text-amber-800' : undefined,
    },
    {
      id: 'labels' as ProductSubTab,
      label: 'Labels & Badges',
      icon: Tag,
    },
    {
      id: 'bulk-upload' as ProductSubTab,
      label: 'Bulk CSV Upload',
      icon: UploadCloud,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

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
            onSelectCategoryFilter={(categoryName) => {
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
