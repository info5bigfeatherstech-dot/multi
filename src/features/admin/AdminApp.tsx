import React, { useState, useEffect } from 'react';
import { mockAdminStore, AdminUser } from './mockAdminStore';
import { AdminLogin } from './components/AdminLogin';
import { AdminShell, AdminTab } from './components/AdminShell';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminOrdersView } from './components/AdminOrdersView';
import { AdminProductsView } from './components/AdminProductsView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';
import { AdminStaffView } from './components/AdminStaffView';
import { AdminReviewsView } from './components/reviews/AdminReviewsView';
import { AdminReturnsRefundsView } from './components/AdminReturnsRefundsView';
import { AdminRtoView } from './components/AdminRtoView';
import { AdminOutOfStockInquiriesView } from './components/AdminOutOfStockInquiriesView';
import { AdminCustomerLeadsView } from './components/AdminCustomerLeadsView';
import { AdminAbandonedCartsView } from './components/AdminAbandonedCartsView';
import { AdminMarketingCouponsView } from './components/AdminMarketingCouponsView';

import { refreshAdminAccessToken, clearAdminTokens } from '../../api';

interface AdminAppProps {
  onBackToStore?: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onBackToStore }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    if (typeof window !== 'undefined') {
      const hasToken = localStorage.getItem('admin_access_token');
      const existing = mockAdminStore.getCurrentUser();
      if (hasToken && existing) {
        return existing;
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('orders')) return 'orders';
      if (path.includes('returns')) return 'returns';
      if (path.includes('rto')) return 'rto';
      if (path.includes('outofstock-query') || path.includes('oos-inquiries') || path.includes('stock-query')) return 'outofstock-query';
      if (path.includes('analytics')) return 'analytics';
      if (path.includes('products-add') || path.includes('/add-product')) return 'products-add';
      if (path.includes('products-categories') || path.includes('/categories')) return 'products-categories';
      if (path.includes('products-labels') || path.includes('/labels')) return 'products-labels';
      if (path.includes('products-inventory') || path.includes('/inventory')) return 'products-inventory';
      if (path.includes('products-archived') || path.includes('/archived')) return 'products-archived';
      if (path.includes('products')) return 'products-all';
      if (path.includes('reviews/submissions') || path.includes('reviews-submissions') || path.includes('reviews-customer') || path.includes('/reviews/customer')) return 'reviews-submissions';
      if (path.includes('reviews/generated') || path.includes('reviews-generated')) return 'reviews-generated';
      if (path.includes('reviews-management') || path.includes('/reviews/management')) return 'reviews-management';
      if (path.includes('reviews-reports') || path.includes('/reviews/reports')) return 'reviews-reports';
      if (path.includes('reviews')) return 'reviews-submissions';
      if (path.includes('staff')) return 'staff';
      if (path.includes('leads')) return 'leads';
      if (path.includes('marketing') || path.includes('coupons')) return 'marketing';
      if (path.includes('growth') || path.includes('abandoned')) return 'abandoned';
      if (path.includes('settings-profile')) return 'settings-profile';
      if (path.includes('settings-controls') || path.includes('settings-control')) return 'settings-controls';
      if (path.includes('settings-product-display')) return 'settings-product-display';
      if (path.includes('settings-header-badge')) return 'settings-header-badge';
      if (path.includes('settings-product-code-prefix')) return 'settings-product-code-prefix';
      if (path.includes('settings-delivery') || path.includes('settings-shipping')) return 'settings-delivery';
      if (path.includes('settings-label-settings') || path.includes('settings-label')) return 'settings-label-settings';
      if (path.includes('settings-payments')) return 'settings-payments';
      if (path.includes('settings-orders')) return 'settings-orders';
      if (path.includes('settings-customer')) return 'settings-customer';
      if (path.includes('settings-staff')) return 'settings-staff';
      if (path.includes('settings-policies')) return 'settings-policies';
      if (path.includes('settings-help')) return 'settings-help';
      if (path.includes('settings-suggest')) return 'settings-suggest';
      if (path.includes('settings-other') || path.includes('settings-backup')) return 'settings-other';
      if (path.includes('settings')) return 'settings-controls';
    }
    return 'dashboard';
  });

  const [orderFilter, setOrderFilter] = useState<string>('Pending');

  // Keep state synced with localStorage updates & token verification
  useEffect(() => {
    const unsubscribe = mockAdminStore.subscribe(() => {
      const hasToken = localStorage.getItem('admin_access_token');
      if (hasToken) {
        setCurrentUser(mockAdminStore.getCurrentUser());
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to 403 Forbidden or auth success events across the admin shell
  useEffect(() => {
    const handleAdminForbidden = () => {
      clearAdminTokens();
      mockAdminStore.logout();
      setCurrentUser(null);
    };

    const handleAdminAuthSuccess = () => {
      const existing = mockAdminStore.getCurrentUser();
      if (existing) setCurrentUser(existing);
    };

    window.addEventListener('abb_admin_forbidden', handleAdminForbidden);
    window.addEventListener('abb_admin_auth_success', handleAdminAuthSuccess);

    // If currentUser exists but access token is missing, attempt refresh via refresh token
    if (currentUser && !localStorage.getItem('admin_access_token')) {
      refreshAdminAccessToken().then((token) => {
        if (!token) {
          // If refresh failed, force logout
          clearAdminTokens();
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
    clearAdminTokens();
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
      else if (path.includes('products-archived') || path.includes('/archived')) setCurrentTab('products-archived');
      else if (path.includes('products')) setCurrentTab('products-all');
      else if (path.includes('reviews/submissions') || path.includes('reviews-submissions') || path.includes('reviews-customer')) setCurrentTab('reviews-submissions');
      else if (path.includes('reviews/generated') || path.includes('reviews-generated')) setCurrentTab('reviews-generated');
      else if (path.includes('reviews-management')) setCurrentTab('reviews-management');
      else if (path.includes('reviews-reports')) setCurrentTab('reviews-reports');
      else if (path.includes('reviews')) setCurrentTab('reviews-submissions');
      else if (path.includes('returns')) setCurrentTab('returns');
      else if (path.includes('rto')) setCurrentTab('rto');
      else if (path.includes('outofstock-query') || path.includes('oos-inquiries') || path.includes('stock-query')) setCurrentTab('outofstock-query');
      else if (path.includes('marketing') || path.includes('coupons')) setCurrentTab('marketing');
      else if (path.includes('leads')) setCurrentTab('leads');
      else if (path.includes('abandoned') || path.includes('growth')) setCurrentTab('abandoned');
      else if (path.includes('staff')) setCurrentTab('staff');
      else if (path.includes('settings-profile')) setCurrentTab('settings-profile');
      else if (path.includes('settings-controls') || path.includes('settings-control')) setCurrentTab('settings-controls');
      else if (path.includes('settings-product-display')) setCurrentTab('settings-product-display');
      else if (path.includes('settings-header-badge')) setCurrentTab('settings-header-badge');
      else if (path.includes('settings-product-code-prefix')) setCurrentTab('settings-product-code-prefix');
      else if (path.includes('settings-delivery') || path.includes('settings-shipping')) setCurrentTab('settings-delivery');
      else if (path.includes('settings-label-settings') || path.includes('settings-label')) setCurrentTab('settings-label-settings');
      else if (path.includes('settings-payments')) setCurrentTab('settings-payments');
      else if (path.includes('settings-orders')) setCurrentTab('settings-orders');
      else if (path.includes('settings-customer')) setCurrentTab('settings-customer');
      else if (path.includes('settings-staff')) setCurrentTab('settings-staff');
      else if (path.includes('settings-policies')) setCurrentTab('settings-policies');
      else if (path.includes('settings-help')) setCurrentTab('settings-help');
      else if (path.includes('settings-suggest')) setCurrentTab('settings-suggest');
      else if (path.includes('settings-other') || path.includes('settings-backup')) setCurrentTab('settings-other');
      else if (path.includes('settings')) setCurrentTab('settings-controls');
      else if (path.includes('dashboard') || path === '/admin') setCurrentTab('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToOrders = (statusFilter = 'Pending') => {
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
        <AdminReturnsRefundsView />
      )}

      {currentTab === 'rto' && (
        <AdminRtoView />
      )}

      {(currentTab === 'outofstock-query' || currentTab === 'outofstock') && (
        <AdminOutOfStockInquiriesView />
      )}

      {currentTab === 'analytics' && (
        <AdminAnalyticsView />
      )}

      {(currentTab === 'products' || currentTab.startsWith('products-') || currentTab === 'archived') && currentTab !== 'outofstock-query' && currentTab !== 'outofstock' && (
        <AdminProductsView 
          initialSubTab={
            currentTab === 'products-add' ? 'add' :
            currentTab === 'products-categories' ? 'categories' :
            currentTab === 'products-labels' ? 'labels' :
            currentTab === 'products-inventory' ? 'inventory' :
            currentTab === 'products-bulkupload' ? 'bulk-upload' :
            currentTab === 'products-archived' || currentTab === 'archived' ? 'archived' : 'all'
          }
        />
      )}

      {(currentTab === 'reviews' || currentTab.startsWith('reviews-')) && (
        <AdminReviewsView 
          initialSubTab={
            currentTab === 'reviews-customer' || currentTab === 'reviews-submissions' ? 'customer-reviews' :
            currentTab === 'reviews-generated' ? 'generated' :
            currentTab === 'reviews-management' ? 'review-management' :
            currentTab === 'reviews-reports' ? 'review-reports' :
            'product-reviews'
          }
        />
      )}

      {currentTab === 'leads' && (
        <AdminCustomerLeadsView />
      )}

      {currentTab === 'abandoned' && (
        <AdminAbandonedCartsView />
      )}

      {currentTab === 'marketing' && (
        <AdminMarketingCouponsView />
      )}

      {(currentTab === 'staff' || currentTab === 'settings-staff') && (
        <AdminStaffView />
      )}

      {currentTab.startsWith('settings') && currentTab !== 'settings-staff' && (
        <AdminSettingsView currentTab={currentTab} onSelectTab={setCurrentTab} />
      )}
    </AdminShell>
  );
};

export default AdminApp;
