import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  History, 
  Search, 
  SlidersHorizontal, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { AdminProduct } from '../../../../store/adminProductsSlice';

interface InventoryTabProps {
  onQuickAdjust: (product: AdminProduct) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ onQuickAdjust }) => {
  const { products, inventoryLogs } = useAppSelector((state) => state.adminProducts);

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'logs'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'low' | 'out' | 'healthy'>('All');

  // KPI calculations
  const totalUnits = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stock === 0).length, [products]);
  const healthyCount = useMemo(() => products.filter(p => p.stock > (p.lowStockThreshold || 10)).length, [products]);

  // Filtered products for stock table
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.binLocation && p.binLocation.toLowerCase().includes(q))
      );
    }

    if (stockStatusFilter === 'low') {
      list = list.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10));
    } else if (stockStatusFilter === 'out') {
      list = list.filter(p => p.stock === 0);
    } else if (stockStatusFilter === 'healthy') {
      list = list.filter(p => p.stock > (p.lowStockThreshold || 10));
    }

    return list;
  }, [products, searchQuery, stockStatusFilter]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return inventoryLogs;
    const q = searchQuery.toLowerCase().trim();
    return inventoryLogs.filter(log => 
      log.productTitle.toLowerCase().includes(q) ||
      log.productSku.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      (log.notes && log.notes.toLowerCase().includes(q))
    );
  }, [inventoryLogs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <Warehouse className="w-6 h-6 text-indigo-600" />
            Inventory & Warehouse Stock Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time warehouse counts, bin locations, low-stock alerts, and adjustment audit trails
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Stock Levels
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'logs'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Logs ({inventoryLogs.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{products.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            {totalUnits.toLocaleString()} total units on hand
          </div>
        </div>

        {/* Healthy Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Healthy Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{healthyCount}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">
            Above threshold levels
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{lowStockCount}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5 font-medium">
            Requires replenishment (&le; 10)
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{outOfStockCount}</div>
          <div className="text-[11px] text-rose-700/80 mt-0.5 font-medium">
            Zero warehouse inventory
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'overview'
                ? 'Search by SKU, product name, or bin location...'
                : 'Search audit log by title, reason, SKU...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {activeSubTab === 'overview' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none w-full sm:w-auto"
            >
              <option value="All">All Inventory</option>
              <option value="low">Low Stock Only (&le;10)</option>
              <option value="out">Out of Stock (0)</option>
              <option value="healthy">Healthy Stock (&gt;10)</option>
            </select>
          </div>
        )}
      </div>

      {/* Content View: Stock Table vs Logs */}
      {activeSubTab === 'overview' ? (
        /* Stock Overview Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product & SKU</th>
                  <th className="py-3.5 px-4">Bin Location</th>
                  <th className="py-3.5 px-4 text-center">Remaining Stock</th>
                  <th className="py-3.5 px-4 text-center">Threshold</th>
                  <th className="py-3.5 px-4 text-center">Health Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No matching products found in warehouse inventory.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const threshold = p.lowStockThreshold || 10;
                    const isOutOfStock = p.stock === 0;
                    const isLowStock = p.stock > 0 && p.stock <= threshold;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Title and SKU */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                            <div className="min-w-0 max-w-xs md:max-w-md">
                              <div className="font-semibold text-slate-900 truncate">
                                {p.title}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                                SKU: {p.sku}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Bin Location */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.binLocation || 'Warehouse Main'}</span>
                          </div>
                        </td>

                        {/* Remaining Stock */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-sm">
                          {p.stock}
                        </td>

                        {/* Threshold */}
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                          &le; {threshold}
                        </td>

                        {/* Health Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3.5 h-3.5" /> Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sufficient
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onQuickAdjust(p)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            Quick Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Logs Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-4">Adjustment Reason</th>
                  <th className="py-3.5 px-4 text-center">Stock Change</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4">Admin User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No inventory logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isPositive = log.adjustmentQty > 0;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-xs">
                            {log.productTitle}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {log.productSku}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {log.reason}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 font-bold">
                            <span className="text-slate-400 font-normal">{log.previousStock}</span>
                            <span>&rarr;</span>
                            <span className="text-slate-900">{log.newStock}</span>
                            <span className={`inline-flex items-center text-xs ml-1 ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {isPositive ? `+${log.adjustmentQty}` : log.adjustmentQty}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 italic">
                          {log.notes || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {log.user}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
