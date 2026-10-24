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
  SlidersHorizontal,
  Box,
  FolderTree,
  Tag,
  Boxes,
  Truck,
  Archive,
  Star,
  MessageSquare,
  ShieldCheck,
  BarChart2,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  User,
  LayoutGrid,
  FileText,
  ClipboardList,
  UserCheck,
  HelpCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import { AdminUser, mockAdminStore } from '../mockAdminStore';
import {
  adminOrdersApi,
  adminProductsApi,
  adminAnalyticsApi,
  adminReviewsApi,
  adminOosInquiriesApi,
  adminReturnsApi,
  adminRtoApi
} from '../../../api';

export type AdminTab = 
  | 'dashboard' 
  | 'orders' 
  | 'same-day-orders'
  | 'returns' 
  | 'rto' 
  | 'outofstock-query' 
  | 'products' 
  | 'products-all'
  | 'products-add'
  | 'products-categories'
  | 'products-labels'
  | 'products-inventory'
  | 'products-bulkupload'
  | 'products-archived'
  | 'archived'
  | 'reviews'
  | 'reviews-product'
  | 'reviews-customer'
  | 'reviews-submissions'
  | 'reviews-generated'
  | 'reviews-management'
  | 'reviews-reports'
  | 'analytics' 
  | 'outofstock' 
  | 'leads' 
  | 'abandoned' 
  | 'marketing' 
  | 'staff'
  | 'settings'
  | 'settings-profile'
  | 'settings-controls'
  | 'settings-product-display'
  | 'settings-header-badge'
  | 'settings-product-code-prefix'
  | 'settings-delivery'
  | 'settings-label-settings'
  | 'settings-payments'
  | 'settings-orders'
  | 'settings-customer'
  | 'settings-staff'
  | 'settings-policies'
  | 'settings-help'
  | 'settings-suggest'
  | 'settings-other'
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

interface SidebarNavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badge,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all cursor-pointer group ${
      isActive
        ? 'bg-[#A44101] text-white shadow-xs font-bold'
        : 'text-slate-800 hover:bg-slate-200/70 font-bold'
    }`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs ${
          isActive
            ? 'bg-white/20 text-white'
            : 'bg-orange-50 border border-orange-200/80 text-[#A44101]'
        }`}
      >
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>
      <span className={`text-sm truncate ${isActive ? 'text-white' : 'text-slate-800 group-hover:text-navy'}`}>
        {label}
      </span>
    </div>
    {badge && <div className="shrink-0 ml-2">{badge}</div>}
  </button>
);

interface SidebarCollapsibleHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
}

const SidebarCollapsibleHeader: React.FC<SidebarCollapsibleHeaderProps> = ({
  icon: Icon,
  label,
  isExpanded,
  onToggle,
  badge,
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-800 hover:bg-slate-200/70 transition-all cursor-pointer group font-bold"
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>
      <span className="text-sm font-bold text-slate-800 group-hover:text-navy truncate">
        {label}
      </span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0 ml-2">
      {badge}
      <ChevronRight
        className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
          isExpanded ? 'rotate-90' : ''
        }`}
      />
    </div>
  </button>
);

interface SidebarSubItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}

const SidebarSubItem: React.FC<SidebarSubItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  badge,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      isActive
        ? 'bg-[#A44101] text-white shadow-xs'
        : 'text-slate-600 hover:bg-slate-200/80 hover:text-navy'
    }`}
  >
    <div className="flex items-center gap-2 min-w-0">
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span className="truncate">{label}</span>
    </div>
    {badge && <div className="shrink-0 ml-1.5">{badge}</div>}
  </button>
);

interface SettingsSidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const SettingsSidebarItem: React.FC<SettingsSidebarItemProps> = ({
  icon: Icon,
  label,
  isActive = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-left text-sm ${
      isActive
        ? 'bg-[#FFF0F2] text-[#E11D48] font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-normal'
    }`}
  >
    <Icon className={`w-4 h-4 shrink-0 stroke-[1.8] ${isActive ? 'text-[#E11D48]' : 'text-slate-500'}`} />
    <span className="truncate">{label}</span>
  </button>
);

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
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(true);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(true);
  const [isSettingsMode, setIsSettingsMode] = useState(
    currentTab.startsWith('settings')
  );

  useEffect(() => {
    if (currentTab.startsWith('settings')) {
      setIsSettingsMode(true);
    }
  }, [currentTab]);

  const [counts, setCounts] = useState({
    orders: mockAdminStore.getOrders().length,
    returns: 0,
    rto: 0,
    oosInquiries: 0,
    products: mockAdminStore.getProducts().length,
    abandoned: mockAdminStore.getAbandonedCarts().length,
    archived: 0,
    pendingReviews: 3,
    totalReviews: 7,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [ordRes, prodRes, anaRes, archRes, revRes, retRes, rtoRes, oosRes] = await Promise.allSettled([
          adminOrdersApi.getSummary(),
          adminProductsApi.getAll({ limit: 1 }),
          adminAnalyticsApi.getSummary('30d'),
          adminProductsApi.getArchived({ limit: 1 }),
          adminReviewsApi.list({ limit: 100 }),
          adminReturnsApi.listRequests({ status: 'requested', limit: 1 }),
          adminRtoApi.getOrders({ limit: 1 }),
          adminOosInquiriesApi.list({ status: 'pending', limit: 1 }),
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

        let archivedCount = counts.archived;
        if (archRes.status === 'fulfilled' && archRes.value) {
          const aVal = archRes.value;
          if (aVal.total !== undefined) archivedCount = aVal.total;
          else if (aVal.count !== undefined) archivedCount = aVal.count;
          else if (Array.isArray(aVal.products)) archivedCount = aVal.products.length;
        }

        let pendingReviewsCount = counts.pendingReviews;
        let totalReviewsCount = counts.totalReviews;
        if (revRes.status === 'fulfilled' && revRes.value) {
          const rList = revRes.value.reviews || revRes.value.data || (Array.isArray(revRes.value) ? revRes.value : []);
          totalReviewsCount = revRes.value.pagination?.total || rList.length;
          pendingReviewsCount = rList.filter((r: any) => !r.isActive).length;
        }

        let returnsCount = 0;
        if (retRes.status === 'fulfilled' && retRes.value) {
          returnsCount = retRes.value?.pagination?.total ?? (Array.isArray(retRes.value?.data) ? retRes.value.data.length : 0);
        }

        let rtoCount = 0;
        if (rtoRes.status === 'fulfilled' && rtoRes.value) {
          rtoCount = rtoRes.value?.pagination?.total ?? (Array.isArray(rtoRes.value?.orders) ? rtoRes.value.orders.length : 0);
        }

        let oosCount = 0;
        if (oosRes.status === 'fulfilled' && oosRes.value) {
          oosCount = oosRes.value?.pagination?.total ?? (Array.isArray(oosRes.value?.data) ? oosRes.value.data.length : 0);
        }

        setCounts({
          orders: ordersCount,
          returns: returnsCount,
          rto: rtoCount,
          oosInquiries: oosCount,
          products: productsCount,
          abandoned: abandonedCount,
          archived: archivedCount,
          pendingReviews: pendingReviewsCount,
          totalReviews: totalReviewsCount,
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
    onSelectTab('settings-controls');
    setIsMobileMenuOpen(false);
  };

  const handleExitSettingsMode = () => {
    setIsSettingsMode(false);
    onSelectTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100/80 flex flex-col font-roboto text-slate-800 antialiased selection:bg-[#A44101] selection:text-white">
      {/* =========================================================================
          TOP ADMIN HEADER BAR
         ========================================================================= */}
      <header className="shrink-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs h-16 flex items-center px-4 sm:px-6 justify-between">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200/80 hover:border-[#A44101] bg-white hover:bg-orange-50/60 text-xs font-bold text-navy hover:text-[#A44101] transition-all shadow-2xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#A44101]" />
              <span className="hidden md:inline">View Customer Store</span>
              <ExternalLink className="w-3 h-3 text-[#A44101]/60" />
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
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* SIDEBAR (Desktop & Mobile Drawer with Light Gray Background) */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 w-64 bg-slate-100/95 border-r border-slate-200/90 text-slate-700 flex flex-col justify-between transition-transform duration-300 lg:static lg:top-0 lg:h-full lg:max-h-full lg:translate-x-0 shrink-0 overflow-hidden ${
            isMobileMenuOpen ? 'translate-x-0 shadow-2xl h-[calc(100vh-4rem)]' : '-translate-x-full'
          }`}
        >
          {/* 1. Sidebar Navigation Links */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 sidebar-scroll">
            {isSettingsMode ? (
              /* Dedicated Settings Mode Navigation */
              <div className="space-y-4 animate-fadeIn pb-6">
                <button
                  type="button"
                  onClick={handleExitSettingsMode}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all cursor-pointer border border-slate-200/90 shadow-2xs mb-2"
                >
                  <div className="w-5 h-5 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-600 shrink-0">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                  <span>Back to admin</span>
                </button>

                {/* STORE */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-3.5 block mb-1">
                    STORE
                  </span>
                  <div className="space-y-0.5">
                    <SettingsSidebarItem
                      icon={User}
                      label="Profile"
                      isActive={currentTab === 'settings-profile'}
                      onClick={() => handleTabClick('settings-profile')}
                    />
                    <SettingsSidebarItem
                      icon={SlidersHorizontal}
                      label="Controls"
                      isActive={currentTab === 'settings-controls' || currentTab === 'settings'}
                      onClick={() => handleTabClick('settings-controls')}
                    />
                  </div>
                </div>

                {/* WEBSITE */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-3.5 block mb-1">
                    WEBSITE
                  </span>
                  <div className="space-y-0.5">
                    <SettingsSidebarItem
                      icon={LayoutGrid}
                      label="Product display"
                      isActive={currentTab === 'settings-product-display'}
                      onClick={() => handleTabClick('settings-product-display')}
                    />
                    <SettingsSidebarItem
                      icon={Box}
                      label="Header badge"
                      isActive={currentTab === 'settings-header-badge'}
                      onClick={() => handleTabClick('settings-header-badge')}
                    />
                    <SettingsSidebarItem
                      icon={Box}
                      label="Product code prefix"
                      isActive={currentTab === 'settings-product-code-prefix'}
                      onClick={() => handleTabClick('settings-product-code-prefix')}
                    />
                  </div>
                </div>

                {/* E-COMMERCE */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-3.5 block mb-1">
                    E-COMMERCE
                  </span>
                  <div className="space-y-0.5">
                    <SettingsSidebarItem
                      icon={Truck}
                      label="Delivery"
                      isActive={currentTab === 'settings-delivery' || currentTab === 'settings-shipping'}
                      onClick={() => handleTabClick('settings-delivery')}
                    />
                    <SettingsSidebarItem
                      icon={FileText}
                      label="Label settings"
                      isActive={currentTab === 'settings-label-settings'}
                      onClick={() => handleTabClick('settings-label-settings')}
                    />
                    <SettingsSidebarItem
                      icon={SlidersHorizontal}
                      label="Payments"
                      isActive={currentTab === 'settings-payments'}
                      onClick={() => handleTabClick('settings-payments')}
                    />
                    <SettingsSidebarItem
                      icon={ClipboardList}
                      label="Orders"
                      isActive={currentTab === 'settings-orders'}
                      onClick={() => handleTabClick('settings-orders')}
                    />
                  </div>
                </div>

                {/* GENERAL */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-3.5 block mb-1">
                    GENERAL
                  </span>
                  <div className="space-y-0.5">
                    <SettingsSidebarItem
                      icon={Users}
                      label="Customer"
                      isActive={currentTab === 'settings-customer'}
                      onClick={() => handleTabClick('settings-customer')}
                    />
                    <SettingsSidebarItem
                      icon={UserCheck}
                      label="Staff"
                      isActive={currentTab === 'settings-staff'}
                      onClick={() => handleTabClick('settings-staff')}
                    />
                    <SettingsSidebarItem
                      icon={FileText}
                      label="Store policies"
                      isActive={currentTab === 'settings-policies'}
                      onClick={() => handleTabClick('settings-policies')}
                    />
                  </div>
                </div>

                {/* HELP & SUPPORT */}
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-3.5 block mb-1">
                    HELP & SUPPORT
                  </span>
                  <div className="space-y-0.5">
                    <SettingsSidebarItem
                      icon={HelpCircle}
                      label="Help center"
                      isActive={currentTab === 'settings-help'}
                      onClick={() => handleTabClick('settings-help')}
                    />
                    <SettingsSidebarItem
                      icon={Lightbulb}
                      label="Suggest ideas"
                      isActive={currentTab === 'settings-suggest'}
                      onClick={() => handleTabClick('settings-suggest')}
                    />
                    <SettingsSidebarItem
                      icon={Settings}
                      label="Other"
                      isActive={currentTab === 'settings-other' || currentTab === 'settings-backup'}
                      onClick={() => handleTabClick('settings-other')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Admin Categories Navigation */
              <div className="space-y-5 animate-fadeIn">
                {/* CATEGORY 1: Overview */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
                    Overview
                  </span>
                  <div className="space-y-1">
                    <SidebarNavItem
                      icon={LayoutDashboard}
                      label="Dashboard"
                      isActive={currentTab === 'dashboard'}
                      onClick={() => handleTabClick('dashboard')}
                    />
                  </div>
                </div>

                {/* CATEGORY 2: Operations */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
                    Operations
                  </span>
                  <div className="space-y-1">
                    <SidebarNavItem
                      icon={ShoppingBag}
                      label="Orders"
                      isActive={currentTab === 'orders'}
                      onClick={() => handleTabClick('orders')}
                      badge={
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          currentTab === 'orders' ? 'bg-white/25 text-white' : 'bg-orange-100/90 text-[#A44101] border border-orange-200/70'
                        }`}>
                          {counts.orders}
                        </span>
                      }
                    />
                    <SidebarNavItem
                      icon={Zap}
                      label="Same Day"
                      isActive={currentTab === 'same-day-orders'}
                      onClick={() => handleTabClick('same-day-orders')}
                    />

                    {/* Returns & Refunds */}
                    <SidebarNavItem
                      icon={RotateCcw}
                      label="Returns & Refunds"
                      isActive={currentTab === 'returns'}
                      onClick={() => handleTabClick('returns')}
                      badge={
                        counts.returns > 0 ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            currentTab === 'returns' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                          }`}>
                            {counts.returns}
                          </span>
                        ) : undefined
                      }
                    />

                    {/* RTO */}
                    <SidebarNavItem
                      icon={Truck}
                      label="RTO"
                      isActive={currentTab === 'rto'}
                      onClick={() => handleTabClick('rto')}
                      badge={
                        counts.rto > 0 ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            currentTab === 'rto' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800 border border-rose-200/60'
                          }`}>
                            {counts.rto}
                          </span>
                        ) : undefined
                      }
                    />

                    {/* Out of Stock Query */}
                    <SidebarNavItem
                      icon={AlertTriangle}
                      label="Out of Stock Query"
                      isActive={currentTab === 'outofstock-query' || currentTab === 'outofstock'}
                      onClick={() => handleTabClick('outofstock-query')}
                      badge={
                        counts.oosInquiries > 0 ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            currentTab === 'outofstock-query' || currentTab === 'outofstock' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                          }`}>
                            {counts.oosInquiries}
                          </span>
                        ) : undefined
                      }
                    />

                    {/* Products (Collapsible Hierarchy) */}
                    <div className="space-y-1">
                      <SidebarCollapsibleHeader
                        icon={Package}
                        label="Products"
                        isExpanded={isProductsExpanded}
                        onToggle={() => setIsProductsExpanded(!isProductsExpanded)}
                      />

                      {isProductsExpanded && (
                        <div className="border-l-2 border-orange-200/70 ml-6 pl-3 space-y-1 my-1">
                          <SidebarSubItem
                            icon={Box}
                            label="All Products"
                            isActive={currentTab === 'products' || currentTab === 'products-all'}
                            onClick={() => handleTabClick('products-all')}
                            badge={
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                currentTab === 'products' || currentTab === 'products-all' ? 'bg-white/25 text-white' : 'bg-slate-200/90 text-slate-700'
                              }`}>
                                {counts.products}
                              </span>
                            }
                          />

                          <SidebarSubItem
                            icon={FolderTree}
                            label="Categories"
                            isActive={currentTab === 'products-categories'}
                            onClick={() => handleTabClick('products-categories')}
                          />

                          <SidebarSubItem
                            icon={Tag}
                            label="Labels"
                            isActive={currentTab === 'products-labels'}
                            onClick={() => handleTabClick('products-labels')}
                          />

                          <SidebarSubItem
                            icon={Boxes}
                            label="Inventory"
                            isActive={currentTab === 'products-inventory' || currentTab === 'outofstock'}
                            onClick={() => handleTabClick('products-inventory')}
                            badge={
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                currentTab === 'products-inventory' || currentTab === 'outofstock' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                              }`}>
                                2 Low
                              </span>
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Store Analytics */}
                    <SidebarNavItem
                      icon={BarChart3}
                      label="Store Analytics"
                      isActive={currentTab === 'analytics'}
                      onClick={() => handleTabClick('analytics')}
                    />

                    {/* Archived (Collapsible Hierarchy) */}
                    <div className="space-y-1">
                      <SidebarCollapsibleHeader
                        icon={Archive}
                        label="Archived"
                        isExpanded={isArchivedExpanded}
                        onToggle={() => setIsArchivedExpanded(!isArchivedExpanded)}
                      />

                      {isArchivedExpanded && (
                        <div className="border-l-2 border-orange-200/70 ml-6 pl-3 space-y-1 my-1">
                          <SidebarSubItem
                            icon={Box}
                            label="Archived Products"
                            isActive={currentTab === 'products-archived' || currentTab === 'archived'}
                            onClick={() => handleTabClick('products-archived')}
                            badge={
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                currentTab === 'products-archived' || currentTab === 'archived' ? 'bg-white/25 text-white' : 'bg-slate-200/90 text-slate-700'
                              }`}>
                                {counts.archived ?? 0}
                              </span>
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Reviews (Collapsible Hierarchy) */}
                    <div className="space-y-1">
                      <SidebarCollapsibleHeader
                        icon={Star}
                        label="Reviews"
                        isExpanded={isReviewsExpanded}
                        onToggle={() => setIsReviewsExpanded(!isReviewsExpanded)}
                        badge={
                          counts.pendingReviews > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/60">
                              {counts.pendingReviews} Pending
                            </span>
                          ) : undefined
                        }
                      />

                      {isReviewsExpanded && (
                        <div className="border-l-2 border-orange-200/70 ml-6 pl-3 space-y-1 my-1">
                          <SidebarSubItem
                            icon={MessageSquare}
                            label="Customer Submissions"
                            isActive={currentTab === 'reviews-customer' || currentTab === 'reviews-submissions'}
                            onClick={() => handleTabClick('reviews-submissions')}
                            badge={
                              counts.pendingReviews > 0 ? (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  currentTab === 'reviews-customer' || currentTab === 'reviews-submissions' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200/60'
                                }`}>
                                  {counts.pendingReviews}
                                </span>
                              ) : undefined
                            }
                          />

                          <SidebarSubItem
                            icon={Sparkles}
                            label="Generated Reviews"
                            isActive={currentTab === 'reviews-generated'}
                            onClick={() => handleTabClick('reviews-generated')}
                          />

                          <SidebarSubItem
                            icon={Star}
                            label="All Product Reviews"
                            isActive={currentTab === 'reviews' || currentTab === 'reviews-product'}
                            onClick={() => handleTabClick('reviews-product')}
                            badge={
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                currentTab === 'reviews' || currentTab === 'reviews-product' ? 'bg-white/25 text-white' : 'bg-slate-200/90 text-slate-700'
                              }`}>
                                {counts.totalReviews ?? 7}
                              </span>
                            }
                          />

                          <SidebarSubItem
                            icon={ShieldCheck}
                            label="Moderation Queue"
                            isActive={currentTab === 'reviews-management'}
                            onClick={() => handleTabClick('reviews-management')}
                          />

                          <SidebarSubItem
                            icon={BarChart2}
                            label="Star Analytics"
                            isActive={currentTab === 'reviews-reports'}
                            onClick={() => handleTabClick('reviews-reports')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CATEGORY 3: Growth */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
                    Growth
                  </span>
                  <div className="space-y-1">
                    <SidebarNavItem
                      icon={Users}
                      label="Customer Leads"
                      isActive={currentTab === 'leads'}
                      onClick={() => handleTabClick('leads')}
                    />

                    <SidebarNavItem
                      icon={ShoppingCart}
                      label="Abandoned Carts"
                      isActive={currentTab === 'abandoned'}
                      onClick={() => handleTabClick('abandoned')}
                      badge={
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          currentTab === 'abandoned' ? 'bg-white/25 text-white' : 'bg-rose-500 text-white shadow-2xs'
                        }`}>
                          {counts.abandoned}
                        </span>
                      }
                    />

                    <SidebarNavItem
                      icon={Ticket}
                      label="Marketing & Coupons"
                      isActive={currentTab === 'marketing'}
                      onClick={() => handleTabClick('marketing')}
                    />
                  </div>
                </div>

                {/* CATEGORY 4: Team & Access */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2.5 mb-1.5">
                    Team & Access
                  </span>
                  <div className="space-y-1">
                    <SidebarNavItem
                      icon={Users}
                      label="Staff & Permissions"
                      isActive={currentTab === 'staff'}
                      onClick={() => handleTabClick('staff')}
                      badge={
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          currentTab === 'staff' ? 'bg-white/25 text-white' : 'bg-slate-200/90 text-slate-700'
                        }`}>
                          Roles
                        </span>
                      }
                    />
                  </div>
                </div>

                {/* Store Settings Trigger */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleEnterSettingsMode}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-800 hover:bg-slate-200/70 transition-all cursor-pointer group font-bold"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        <Settings className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-navy truncate">
                        Store Settings
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
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
        <main className="flex-1 h-full overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
