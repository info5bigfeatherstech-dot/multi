import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Ticket, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Store, 
  ChevronRight, 
  ArrowLeft,
  ExternalLink,
  Sliders,
  Database,
  ChevronDown,
  Box,
  PlusCircle,
  FolderTree,
  Tag,
  Boxes,
  Truck
} from 'lucide-react';
import { AdminUser, mockAdminStore } from '../mockAdminStore';
import { adminOrdersApi, adminProductsApi, adminAnalyticsApi } from '../../../api';

export type AdminTab = 
  | 'dashboard' 
  | 'orders' 
  | 'returns' 
  | 'rto' 
  | 'products' 
  | 'products-all'
  | 'products-add'
  | 'products-categories'
  | 'products-labels'
  | 'products-inventory'
  | 'products-bulkupload'
  | 'analytics' 
  | 'outofstock' 
  | 'leads' 
  | 'abandoned' 
  | 'marketing' 
  | 'settings' 
  | 'settings-general' 
  | 'settings-shipping' 
  | 'settings-backup';

interface AdminShellProps {
  currentUser: AdminUser;
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onSignOut: () => void;
  onVisitStore?: () => void;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  onSignOut,
  onVisitStore,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isSettingsMode, setIsSettingsMode] = useState(
    currentTab.startsWith('settings')
  );

  const [counts, setCounts] = useState({
    orders: mockAdminStore.getOrders().length,
    products: mockAdminStore.getProducts().length,
    abandoned: mockAdminStore.getAbandonedCarts().length,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [ordRes, prodRes, anaRes] = await Promise.allSettled([
          adminOrdersApi.getSummary(),
          adminProductsApi.getAll({ limit: 1 }),
          adminAnalyticsApi.getSummary('30d'),
        ]);

        let ordersCount = counts.orders;
        if (ordRes.status === 'fulfilled' && ordRes.value?.totals?.totalOrders !== undefined) {
          ordersCount = ordRes.value.totals.totalOrders;
        }

        let productsCount = counts.products;
        if (prodRes.status === 'fulfilled' && prodRes.value) {
          const pVal = prodRes.value;
          if (pVal.totalProducts !== undefined) productsCount = pVal.totalProducts;
          else if (pVal.counts?.total !== undefined) productsCount = pVal.counts.total;
        }

        let abandonedCount = counts.abandoned;
        if (anaRes.status === 'fulfilled') {
          const c = anaRes.value?.carts;
          if (c?.abandoned24h !== undefined) abandonedCount = c.abandoned24h;
          else if (c?.total !== undefined) abandonedCount = c.total;
        }

        setCounts({
          orders: ordersCount,
          products: productsCount,
          abandoned: abandonedCount,
        });
      } catch {
        // defaults
      }
    };

    fetchCounts();
  }, [currentTab]);

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleEnterSettingsMode = () => {
    setIsSettingsMode(true);
    onSelectTab('settings');
    setIsMobileMenuOpen(false);
  };

  const handleExitSettingsMode = () => {
    setIsSettingsMode(false);
    onSelectTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col font-roboto text-slate-800 antialiased selection:bg-[#A44101] selection:text-white">
      {/* =========================================================================
          TOP ADMIN HEADER BAR
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs h-16 flex items-center px-4 sm:px-6 justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-navy hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Brand Title */}
          <div className="flex items-center gap-2.5">
            <img
              src="/images/logo.jpeg"
              alt="Apna Bharat Bazaar"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#A44101]/20 shadow-2xs"
            />
            <div className="hidden sm:block">
              <span className="font-black text-sm text-navy tracking-tight block leading-tight">
                Apna Bharat Bazaar
              </span>
              <span className="text-[10px] font-bold text-[#A44101] uppercase tracking-wider block">
                Admin Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Customer Store Link */}
          {onVisitStore && (
            <button
              type="button"
              onClick={onVisitStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-navy bg-white hover:bg-slate-50 text-xs font-bold text-navy transition-all shadow-2xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#A44101]" />
              <span className="hidden md:inline">View Customer Store</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shadow-2xs"
            />
            <div className="hidden xl:block text-left">
              <span className="text-xs font-black text-navy block leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN CONTAINER: SIDEBAR + CONTENT VIEW
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (Desktop & Mobile Drawer with Light Gray Background) */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 w-64 bg-slate-100/95 border-r border-slate-200/90 text-slate-700 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          {/* 1. Sidebar Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isSettingsMode ? (
              /* Dedicated Settings Mode Navigation */
              <div className="space-y-4 animate-fadeIn">
                <button
                  type="button"
                  onClick={handleExitSettingsMode}
                  className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-200 text-navy text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-[#A44101]" />
                  <span>← Back to admin</span>
                </button>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-3 mb-2">
                    System Settings
                  </span>
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTabClick('settings')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'settings'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                      <span>General Configuration</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('settings-shipping')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'settings-shipping'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Delivery &amp; Courier Hubs</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('settings-backup')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'settings-backup'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      <span>Mock Storage &amp; Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Admin Categories Navigation */
              <div className="space-y-5 animate-fadeIn">
                {/* CATEGORY 1: Overview */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-3 mb-1.5">
                    Overview
                  </span>
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTabClick('dashboard')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'dashboard'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                  </div>
                </div>

                {/* CATEGORY 2: Operations */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-3 mb-1.5">
                    Operations
                  </span>
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTabClick('orders')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'orders'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Orders</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        currentTab === 'orders' ? 'bg-white/25 text-white' : 'bg-slate-200/90 text-slate-600'
                      }`}>
                        {counts.orders}
                      </span>
                    </button>
                  </div>
                </div>

                {/* CATEGORY 3: Products (Collapsible Hierarchy) */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsProductsExpanded(!isProductsExpanded)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-200/70 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        <Package className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">Products</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProductsExpanded ? '' : '-rotate-90'}`} />
                  </button>

                  {isProductsExpanded && (
                    <div className="border-l-2 border-slate-200/90 ml-5 pl-3.5 space-y-1 pt-1 text-xs">
                      {/* All Products */}
                      <button
                        type="button"
                        onClick={() => handleTabClick('products-all')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                          currentTab === 'products' || currentTab === 'products-all'
                            ? 'bg-[#A44101] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/80 hover:text-navy'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Box className="w-4 h-4" />
                          <span>All Products</span>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          currentTab === 'products' || currentTab === 'products-all'
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-200/90 text-slate-700'
                        }`}>
                          {counts.products}
                        </span>
                      </button>

                      {/* Add Product */}
                      <button
                        type="button"
                        onClick={() => handleTabClick('products-add')}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                          currentTab === 'products-add'
                            ? 'bg-[#A44101] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/80 hover:text-navy'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>

                      {/* Categories */}
                      <button
                        type="button"
                        onClick={() => handleTabClick('products-categories')}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                          currentTab === 'products-categories'
                            ? 'bg-[#A44101] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/80 hover:text-navy'
                        }`}
                      >
                        <FolderTree className="w-4 h-4" />
                        <span>Categories</span>
                      </button>

                      {/* Labels */}
                      <button
                        type="button"
                        onClick={() => handleTabClick('products-labels')}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                          currentTab === 'products-labels'
                            ? 'bg-[#A44101] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/80 hover:text-navy'
                        }`}
                      >
                        <Tag className="w-4 h-4" />
                        <span>Labels</span>
                      </button>

                      {/* Inventory */}
                      <button
                        type="button"
                        onClick={() => handleTabClick('products-inventory')}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                          currentTab === 'products-inventory' || currentTab === 'outofstock'
                            ? 'bg-[#A44101] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-200/80 hover:text-navy'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Boxes className="w-4 h-4" />
                          <span>Inventory</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          currentTab === 'products-inventory' || currentTab === 'outofstock'
                            ? 'bg-white/25 text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                        }`}>
                          2 Low
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Store Analytics right below Products menu */}
                  <div className="pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTabClick('analytics')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'analytics'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Store Analytics</span>
                    </button>
                  </div>
                </div>

                {/* CATEGORY 4: Growth */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-3 mb-1.5">
                    Growth
                  </span>
                  <div className="space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleTabClick('leads')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'leads'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Customer Leads</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('abandoned')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'abandoned'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingCart className="w-4 h-4" />
                        <span>Abandoned Carts</span>
                      </div>
                      <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow-2xs">
                        {counts.abandoned}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('marketing')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                        currentTab === 'marketing'
                          ? 'bg-[#A44101] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200/80 hover:text-navy'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Marketing &amp; Coupons</span>
                    </button>
                  </div>
                </div>

                {/* Settings Trigger */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleEnterSettingsMode}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold text-xs text-slate-700 hover:bg-slate-200/80 hover:text-navy transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Store Settings</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Sidebar Footer: Profile Info & Sign Out */}
          <div className="p-4 border-t border-slate-200 bg-slate-200/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-300"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-navy block truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop Overlay */}
        {isMobileMenuOpen && (
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* MAIN VIEWPORT CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
