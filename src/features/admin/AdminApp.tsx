import React, { useState, useEffect } from 'react';
import { mockAdminStore, AdminUser } from './mockAdminStore';
import { AdminLogin } from './components/AdminLogin';
import { AdminShell, AdminTab } from './components/AdminShell';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminOrdersView } from './components/AdminOrdersView';
import { AdminProductsView } from './components/AdminProductsView';
import { AdminGrowthView } from './components/AdminGrowthView';
import { AdminSettingsView } from './components/AdminSettingsView';

interface AdminAppProps {
  onBackToStore?: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onBackToStore }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const existing = mockAdminStore.getCurrentUser();
    if (existing) return existing;

    // Direct dashboard navigation auto-seeds demo admin session
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('dashboard') || (path === '/admin' && !path.includes('login'))) {
        return mockAdminStore.login('admin@store.com', 'admin123');
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('orders')) return 'orders';
      if (path.includes('products')) return 'products';
      if (path.includes('growth') || path.includes('leads') || path.includes('abandoned')) return 'abandoned';
      if (path.includes('settings')) return 'settings';
    }
    return 'dashboard';
  });

  const [orderFilter, setOrderFilter] = useState<string>('All');

  // Keep state synced with localStorage updates
  useEffect(() => {
    const unsubscribe = mockAdminStore.subscribe(() => {
      setCurrentUser(mockAdminStore.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin/dashboard');
    }
  };

  const handleSignOut = () => {
    mockAdminStore.logout();
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin/login');
    }
  };

  // Sync popstate for browser back/forward buttons inside admin
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('orders')) setCurrentTab('orders');
      else if (path.includes('products')) setCurrentTab('products');
      else if (path.includes('returns')) setCurrentTab('returns');
      else if (path.includes('rto')) setCurrentTab('rto');
      else if (path.includes('abandoned') || path.includes('growth')) setCurrentTab('abandoned');
      else if (path.includes('leads')) setCurrentTab('leads');
      else if (path.includes('settings')) setCurrentTab('settings');
      else if (path.includes('dashboard') || path === '/admin') setCurrentTab('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToOrders = (statusFilter = 'All') => {
    setOrderFilter(statusFilter);
    setCurrentTab('orders');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin/orders');
    }
  };

  const handleNavigateToProducts = () => {
    setCurrentTab('products');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin/products');
    }
  };

  const handleNavigateToAbandoned = () => {
    setCurrentTab('abandoned');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin/abandoned');
    }
  };

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/admin/${tab}`);
    }
  };

  // Route Guard: if not authenticated, render Login view
  if (!currentUser) {
    return (
      <AdminLogin 
        onLoginSuccess={handleLoginSuccess} 
        onBackToStore={onBackToStore} 
      />
    );
  }

  return (
    <AdminShell
      currentUser={currentUser}
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onSignOut={handleSignOut}
      onVisitStore={onBackToStore}
    >
      {currentTab === 'dashboard' && (
        <AdminDashboardView
          onNavigateToOrders={handleNavigateToOrders}
          onNavigateToProducts={handleNavigateToProducts}
          onNavigateToAbandoned={handleNavigateToAbandoned}
        />
      )}

      {currentTab === 'orders' && (
        <AdminOrdersView initialStatusFilter={orderFilter} />
      )}

      {currentTab === 'returns' && (
        <AdminOrdersView initialStatusFilter="Returned" />
      )}

      {currentTab === 'rto' && (
        <AdminOrdersView initialStatusFilter="RTO" />
      )}

      {(currentTab === 'products' || currentTab === 'outofstock' || currentTab === 'analytics') && (
        <AdminProductsView />
      )}

      {(currentTab === 'abandoned' || currentTab === 'leads' || currentTab === 'marketing') && (
        <AdminGrowthView initialSubTab={currentTab as 'abandoned' | 'leads' | 'marketing'} />
      )}

      {currentTab.startsWith('settings') && (
        <AdminSettingsView />
      )}
    </AdminShell>
  );
};

export default AdminApp;
