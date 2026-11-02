import React, { useState, useEffect } from 'react';
import {
  Search,
  IndianRupee,
  XCircle,
  Package,
  Loader2,
  Save,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setVariantDropshipPrice,
  toggleVariantDropshipListing,
} from '../../../../store/adminDropshipperSlice';
import { adminProductsApi } from '../../../../api';
import { setProductsFromApi } from '../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';

const getCategoryName = (category: any): string => {
  if (!category) return 'General';
  if (typeof category === 'string') return category;
  if (typeof category === 'object') {
    return category.name || category.title || category.slug || 'General';
  }
  return 'General';
};

const getProductName = (p: any): string => {
  if (typeof p.title === 'string' && p.title.trim()) return p.title.trim();
  if (typeof p.name === 'string' && p.name.trim()) return p.name.trim();
  return 'Product';
};

const getNumericPrice = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }
  if (val && typeof val === 'object' && '$numberDecimal' in val) {
    return parseFloat(val.$numberDecimal) || 0;
  }
  return 0;
};

export const AdminDropshipperPricingView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.adminProducts);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const res = await adminProductsApi.getAll({ search: searchQuery || undefined, limit: 50 });
        if (res) {
          dispatch(setProductsFromApi(res.products || res));
        }
      } catch {
        // use redux products if api fails
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [dispatch, searchQuery]);

  const handleStartEdit = (productCode: string, currentPrice: number) => {
    setEditingCode(productCode);
    setPriceInput(currentPrice || 0);
  };

  const handleSavePrice = async (slug: string, productCode: string) => {
    if (priceInput <= 0) {
      toast.error('Dropship base price must be greater than ₹0');
      return;
    }

    setIsUpdating(true);
    try {
      await dispatch(
        setVariantDropshipPrice({
          slug,
          productCode,
          dropshipBase: Number(priceInput),
          enable: true,
        })
      ).unwrap();
      toast.success(`Updated dropship price for ${productCode} to ₹${priceInput}`);
      setEditingCode(null);
      const res = await adminProductsApi.getAll({ search: searchQuery || undefined, limit: 50 });
      if (res) dispatch(setProductsFromApi(res.products || res));
    } catch (err: any) {
      toast.error(err || 'Failed to update dropship base price');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleListing = async (
    slug: string,
    productCode: string,
    currentlyActive: boolean
  ) => {
    try {
      await dispatch(
        toggleVariantDropshipListing({
          slug,
          productCode,
          enable: !currentlyActive,
        })
      ).unwrap();
      toast.success(
        `Variant ${productCode} dropship listing ${currentlyActive ? 'disabled' : 'enabled'}`
      );
      const res = await adminProductsApi.getAll({ search: searchQuery || undefined, limit: 50 });
      if (res) dispatch(setProductsFromApi(res.products || res));
    } catch (err: any) {
      toast.error(err || 'Failed to update dropship visibility');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-navy">Dropship Catalog Pricing &amp; Visibility</h2>
        <p className="text-xs text-slate-500 capitalize">
          Configure which products &amp; variants appear in the wholesale portal and set their base dropship price.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog products by name, title, or SKU..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Pricing Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
            <span className="text-xs font-bold">Loading catalog items...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-navy">No products found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Variant / SKU</th>
                  <th className="py-3 px-4">Retail MSRP</th>
                  <th className="py-3 px-4">Wholesale Dropship Base</th>
                  <th className="py-3 px-4">Channel Listing</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p: any) => {
                  const variants = p.variants && p.variants.length > 0 ? p.variants : [p];
                  const categoryName = getCategoryName(p.category);
                  const productName = getProductName(p);

                  return variants.map((v: any, idx: number) => {
                    const code = String(v.productCode || v.sku || `${p.slug || p.id || p._id || 'item'}-${idx}`);
                    const isEditing = editingCode === code;
                    const dropshipPrice = getNumericPrice(v.dropshipBase ?? p.dropshipBase);
                    const retailPrice = getNumericPrice(v.price ?? p.price);
                    const isListingActive =
                      v.channelVisibility?.dropship === 'active' || p.channelVisibility?.dropship === 'active';

                    return (
                      <tr key={code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy line-clamp-1">{productName}</div>
                          <div className="text-[10px] text-slate-400">{categoryName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-600">
                          ₹{retailPrice}
                        </td>
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative w-28">
                                <input
                                  type="number"
                                  min="1"
                                  value={priceInput}
                                  onChange={(e) => setPriceInput(Number(e.target.value))}
                                  className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-[#A44101] focus:outline-none font-bold text-navy"
                                />
                                <IndianRupee className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSavePrice(p.slug || p.id, code)}
                                disabled={isUpdating}
                                className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                title="Save Price"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCode(null)}
                                className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                title="Cancel"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(code, dropshipPrice)}
                              className="font-black text-[#A44101] flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>{dropshipPrice > 0 ? dropshipPrice : 'Set Price'}</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isListingActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isListingActive ? 'Listed on Dropship' : 'Hidden'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleListing(p.slug || p.id, code, isListingActive)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isListingActive
                                ? 'border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isListingActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
