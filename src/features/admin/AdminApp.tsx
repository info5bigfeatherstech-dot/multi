import React, { useState, useEffect } from 'react';
import { mockAdminStore, AdminUser } from './mockAdminStore';
import { AdminLogin } from './components/AdminLogin';
import { AdminShell, AdminTab } from './components/AdminShell';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminOrdersView } from './components/AdminOrdersView';
import { AdminProductsView } from './components/AdminProductsView';
import { AdminGrowthView } from './components/AdminGrowthView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';

import { ensureAdminToken } from '../../api';

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
      if (path.includes('analytics')) return 'analytics';
      if (path.includes('products-add') || path.includes('/add-product')) return 'products-add';
      if (path.includes('products-categories') || path.includes('/categories')) return 'products-categories';
      if (path.includes('products-labels') || path.includes('/labels')) return 'products-labels';
      if (path.includes('products-inventory') || path.includes('/inventory')) return 'products-inventory';
      if (path.includes('products')) return 'products-all';
      if (path.includes('growth') || path.includes('leads') || path.includes('abandoned')) return 'abandoned';
      if (path.includes('settings')) return 'settings';
    }
    return 'dashboard';
  });

  const [orderFilter, setOrderFilter] = useState<string>('All');

  // Keep state synced with localStorage updates & token verification
  useEffect(() => {
    const unsubscribe = mockAdminStore.subscribe(() => {
      setCurrentUser(mockAdminStore.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Listen to 403 Forbidden or auth success events across the admin shell
  useEffect(() => {
    const handleAdminForbidden = () => {
      mockAdminStore.logout();
      setCurrentUser(null);
    };

    const handleAdminAuthSuccess = () => {
      const existing = mockAdminStore.getCurrentUser();
      if (existing) setCurrentUser(existing);
    };

    window.addEventListener('abb_admin_forbidden', handleAdminForbidden);
    window.addEventListener('abb_admin_auth_success', handleAdminAuthSuccess);

    // If currentUser exists or user opened admin, proactively guarantee admin token
    if (currentUser && !localStorage.getItem('admin_access_token')) {
      ensureAdminToken().then((token) => {
        if (!token) {
          // If auto acquisition failed, prompt login
          mockAdminStore.logout();
          setCurrentUser(null);
        }
      });
    }

    return () => {
      window.removeEventListener('abb_admin_forbidden', handleAdminForbidden);
      window.removeEventListener('abb_admin_auth_success', handleAdminAuthSuccess);
    };
  }, [currentUser]);

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
      else if (path.includes('analytics')) setCurrentTab('analytics');
      else if (path.includes('products-add') || path.includes('/add-product')) setCurrentTab('products-add');
      else if (path.includes('products-categories') || path.includes('/categories')) setCurrentTab('products-categories');
      else if (path.includes('products-labels') || path.includes('/labels')) setCurrentTab('products-labels');
      else if (path.includes('products-inventory') || path.includes('/inventory')) setCurrentTab('products-inventory');
      else if (path.includes('products')) setCurrentTab('products-all');
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

      {currentTab === 'analytics' && (
        <AdminAnalyticsView />
      )}

      {(currentTab === 'products' || currentTab.startsWith('products-') || currentTab === 'outofstock') && (
        <AdminProductsView 
          initialSubTab={
            currentTab === 'products-add' ? 'add' :
            currentTab === 'products-categories' ? 'categories' :
            currentTab === 'products-labels' ? 'labels' :
            currentTab === 'products-inventory' || currentTab === 'outofstock' ? 'inventory' :
            currentTab === 'products-bulkupload' ? 'bulk-upload' : 'all'
          }
        />
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
