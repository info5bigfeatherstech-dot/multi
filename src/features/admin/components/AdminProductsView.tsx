import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  X, 
  SlidersHorizontal
} from 'lucide-react';
import { mockAdminStore, AdminProduct } from '../mockAdminStore';

export const AdminProductsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form Fields
  const [formSku, setFormSku] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Home & Kitchen');
  const [formPrice, setFormPrice] = useState(199);
  const [formOriginalPrice, setFormOriginalPrice] = useState(499);
  const [formStock, setFormStock] = useState(50);
  const [formImage, setFormImage] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Draft'>('Active');

  const products = useMemo(() => {
    return mockAdminStore.getProducts();
  }, [refreshTrigger]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => 
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormSku(`ABB-${Date.now().toString().slice(-6)}`);
    setFormTitle('');
    setFormCategory('Home & Kitchen');
    setFormPrice(199);
    setFormOriginalPrice(499);
    setFormStock(50);
    setFormImage('https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80');
    setFormTag('NEW DROP');
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setFormSku(prod.sku);
    setFormTitle(prod.title);
    setFormCategory(prod.category);
    setFormPrice(prod.currentPrice);
    setFormOriginalPrice(prod.originalPrice);
    setFormStock(prod.stock);
    setFormImage(prod.image);
    setFormTag(prod.tag || '');
    setFormStatus(prod.status);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Product title is required');
      return;
    }

    const discountPercentage = Math.max(
      0,
      Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100)
    );

    if (editingProduct) {
      mockAdminStore.updateProduct(editingProduct.id, {
        sku: formSku,
        title: formTitle,
        category: formCategory,
        currentPrice: Number(formPrice),
        originalPrice: Number(formOriginalPrice),
        discountPercentage,
        stock: Number(formStock),
        image: formImage,
        tag: formTag.trim() || undefined,
        status: formStatus,
      });
    } else {
      mockAdminStore.addProduct({
        sku: formSku,
        title: formTitle,
        category: formCategory,
        currentPrice: Number(formPrice),
        originalPrice: Number(formOriginalPrice),
        discountPercentage,
        stock: Number(formStock),
        image: formImage,
        rating: 4.8,
        reviews: 1,
        tag: formTag.trim() || undefined,
        status: formStatus,
      });
    }

    setIsModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteProduct = (productId: string, title: string) => {
    if (window.confirm(`Delete product "${title}" permanently from mock catalog?`)) {
      mockAdminStore.deleteProduct(productId);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleToggleStatus = (prod: AdminProduct) => {
    const nextStatus = prod.status === 'Active' ? 'Draft' : 'Active';
    mockAdminStore.updateProduct(prod.id, { status: nextStatus });
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage inventory SKUs, stock levels, pricing, tags, and product status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy hover:bg-[#0c1a2d] text-white text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#A44101]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, SKU, Category, or Tag..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-navy focus:bg-white focus:outline-none focus:border-[#A44101] transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-navy focus:outline-none focus:border-[#A44101] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-navy">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No products match your search or category filter. Try clearing filters or add a new product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock === 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= 20;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product Thumbnail + Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-navy block truncate max-w-xs text-xs sm:text-sm">
                              {prod.title}
                            </span>
                            {prod.tag && (
                              <span className="inline-block text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase mt-0.5">
                                {prod.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        {prod.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {prod.category}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-navy font-roboto">
                        <span className="text-sm font-black">₹{prod.currentPrice}</span>
                        <span className="text-slate-400 line-through text-[11px] ml-1.5">
                          ₹{prod.originalPrice}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          {prod.discountPercentage}% OFF
                        </span>
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black border border-rose-200">
                            Out of Stock (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-black border border-amber-200">
                            Low Stock ({prod.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                            {prod.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                            prod.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {prod.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-navy cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.title)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-5">
              <h3 className="text-base font-black text-navy">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Store'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-navy p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Stainless Steel Thermal Bottle 1000ml"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-navy"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MRP Original (₹)
                  </label>
                  <input
                    type="number"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    placeholder="MEGA DEAL, HOT SELLER"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Draft')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold cursor-pointer"
                  >
                    <option value="Active">Active (Visible)</option>
                    <option value="Draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-navy hover:bg-[#0c1a2d] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsView;
