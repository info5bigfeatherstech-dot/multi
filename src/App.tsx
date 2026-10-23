import React, { useState, useEffect } from 'react';
import { isAuthenticated } from './utils/authGuard';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoriesSection } from './components/CategoriesSection';
import { NewArrivalsSection } from './components/NewArrivalsSection';
import { CategoryShowcaseSections } from './components/CategoryShowcaseSections';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CategoryPage } from './components/CategoryPage';
import { WishlistPage } from './components/WishlistPage';
import { ProfilePage } from './components/ProfilePage';
import { CheckoutPage } from './components/CheckoutPage';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { ProductItem } from './data/storeData';
import { AdminApp } from './features/admin/AdminApp';
import { ContactPage } from './components/ContactPage';
import { BulkOrdersPage } from './components/BulkOrdersPage';
import { LoginPage } from './components/LoginPage';
import { PhonePromptModal } from './components/PhonePromptModal';
import { DealsPage } from './components/DealsPage';
import { Loader2, PackageX } from 'lucide-react';
import { cacheProduct, getCachedProduct, fetchProductByIdentifier, getProductSlug, isProductActive } from './utils/productUtils';
import { getPersistedUserPhone } from './utils/authGuard';

type ViewType = 'home' | 'product' | 'category' | 'wishlist' | 'profile' | 'checkout' | 'admin' | 'contact' | 'bulk-orders' | 'deals' | 'login';

export const App: React.FC = () => {
  const [postAuthRedirect, setPostAuthRedirect] = useState<ViewType | null>(null);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);

  // Phone Gate Lock State: triggers only if user is logged in but has NEVER provided a phone number
  const [isPhonePromptOpen, setIsPhonePromptOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('user_access_token');
    const email = localStorage.getItem('abb_user_profile_email');
    const phone = getPersistedUserPhone(email || '');
    return Boolean((token || email) && (!phone || phone.trim() === ''));
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#admin')) {
      return 'admin';
    }
    if (path === '/login' || path === '/signin' || path === '/auth' || hash === '#login' || hash === '#signin') {
      return 'login';
    }
    if (path.startsWith('/bulk-orders') || path.startsWith('/wholesale') || path.startsWith('/bulk') || hash === '#bulk-orders' || hash === '#wholesale') {
      return 'bulk-orders';
    }
    if (path.startsWith('/today-deals') || path.startsWith('/todays-deal') || path.startsWith('/today-arrival') || path.startsWith('/on-sale') || path.startsWith('/sale') || path.toLowerCase().startsWith('/tagproducts/')) {
      return 'deals';
    }
    if (path.startsWith('/contact') || path.startsWith('/support') || hash === '#contact') return 'contact';
    if (path.startsWith('/wishlist') || hash === '#wishlist') return 'wishlist';
    if (
      path.startsWith('/profile') ||
      path.startsWith('/orders') ||
      path.startsWith('/order') ||
      path.startsWith('/addresses') ||
      path.startsWith('/address') ||
      path === '/account' ||
      hash === '#profile' ||
      hash === '#orders' ||
      hash === '#order' ||
      hash === '#address' ||
      hash === '#addresses'
    ) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;
      if (!token) return 'login';
      return 'profile';
    }
    if (path.startsWith('/checkout') || hash === '#checkout') return 'checkout';
    if (path.startsWith('/product') || hash.startsWith('#product-')) return 'product';
    if (path.startsWith('/category') || hash.startsWith('#category-')) return 'category';
    return 'home';
  });

  const [dealsType, setDealsType] = useState<string>(() => {
    if (typeof window === 'undefined') return 'today-deals';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('sale')) return 'on-sale';
    if (path.includes('today') || path.includes('arrival')) return 'today-deals';
    if (path.startsWith('/tagproducts/')) return window.location.pathname.replace(/^\/tagproducts\//i, '');
    return 'today-deals';
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const hash = window.location.hash;
    let target = '';
    if (path.startsWith('/product/')) {
      target = decodeURIComponent(path.replace('/product/', '')).replace(/^\/+|\/+$/g, '');
    } else if (hash.startsWith('#product-')) {
      target = decodeURIComponent(hash.replace('#product-', '')).replace(/^\/+|\/+$/g, '');
    }
    if (!target) return null;
    const prod = getCachedProduct(target);
    return prod && isProductActive(prod) ? prod : null;
  });

  const [isProductLoading, setIsProductLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/product/') || hash.startsWith('#product-')) {
      const target = decodeURIComponent(
        path.startsWith('/product/') ? path.replace('/product/', '') : hash.replace('#product-', '')
      ).replace(/^\/+|\/+$/g, '');
      if (!target) return false;
      const prod = getCachedProduct(target);
      return !prod || !isProductActive(prod);
    }
    return false;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home-kitchen';
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/category/')) {
      return path.replace('/category/', '');
    }
    if (hash.startsWith('#category-')) {
      return hash.replace('#category-', '');
    }
    return 'home-kitchen';
  });

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sub') || undefined;
  });

  // Sync with URL pathname for browser history, direct links & clean class/path SPA routing
  useEffect(() => {
    const handleRouting = () => {
      let path = window.location.pathname.toLowerCase();
      const rawHash = window.location.hash;

      // Cleanse any legacy hash/ID fragments into clean path routing
      if (rawHash) {
        if (rawHash.startsWith('#category-')) {
          const cat = rawHash.replace('#category-', '');
          path = `/category/${cat}`.toLowerCase();
          window.history.replaceState(null, '', `/category/${cat}`);
        } else if (rawHash.startsWith('#product-')) {
          const pId = rawHash.replace('#product-', '');
          path = `/product/${pId}`.toLowerCase();
          window.history.replaceState(null, '', `/product/${pId}`);
        } else if (rawHash === '#checkout' || rawHash === '#cart') {
          path = '/checkout';
          window.history.replaceState(null, '', '/checkout');
        } else if (rawHash === '#wishlist') {
          path = '/wishlist';
          window.history.replaceState(null, '', '/wishlist');
        } else if (rawHash === '#profile') {
          path = '/profile';
          window.history.replaceState(null, '', '/profile');
        } else if (rawHash === '#orders' || rawHash === '#order') {
          path = '/order';
          window.history.replaceState(null, '', '/order');
        } else if (rawHash === '#address' || rawHash === '#addresses') {
          path = '/address';
          window.history.replaceState(null, '', '/address');
        } else if (rawHash === '#admin' || rawHash.startsWith('#admin')) {
          path = '/admin/dashboard';
          window.history.replaceState(null, '', '/admin/dashboard');
        } else if (rawHash === '#bulk-orders' || rawHash === '#wholesale' || rawHash === '#bulk') {
          path = '/bulk-orders';
          window.history.replaceState(null, '', '/bulk-orders');
        } else if (rawHash === '#contact' || rawHash === '#support') {
          path = '/contact';
          window.history.replaceState(null, '', '/contact');
        } else {
          window.history.replaceState(null, '', window.location.pathname || '/');
        }
      }

      if (path === '/admin' || path.startsWith('/admin')) {
        setCurrentView('admin');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (path === '/bulk-orders' || path === '/wholesale' || path === '/bulk') {
        setCurrentView('bulk-orders');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (
        path === '/today-deals' ||
        path === '/todays-deal' ||
        path === '/today-arrival' ||
        path === '/todays-deals' ||
        path === '/on-sale' ||
        path === '/sale' ||
        path.startsWith('/tagproducts/') ||
        path.startsWith('/tagProducts/')
      ) {
        let type = 'today-deals';
        if (path.includes('sale')) type = 'on-sale';
        else if (path.includes('today') || path.includes('arrival')) type = 'today-deals';
        else if (path.toLowerCase().startsWith('/tagproducts/')) {
          type = window.location.pathname.replace(/^\/tagproducts\//i, '');
        }
        setDealsType(type);
        setCurrentView('deals');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (path.startsWith('/product/')) {
        const prodId = decodeURIComponent(window.location.pathname.replace('/product/', '')).replace(/^\/+|\/+$/g, '');
        setCurrentView('product');
        const cached = getCachedProduct(prodId);
        if (cached && isProductActive(cached)) {
          setSelectedProduct(cached);
          setIsProductLoading(false);
          const canonicalSlug = getProductSlug(cached);
          if (prodId !== canonicalSlug && !window.location.hash) {
            window.history.replaceState(null, '', `/product/${canonicalSlug}`);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setIsProductLoading(true);
          fetchProductByIdentifier(prodId)
            .then((prod) => {
              if (prod && isProductActive(prod)) {
                setSelectedProduct(prod);
                cacheProduct(prod);
                const canonicalSlug = getProductSlug(prod);
                if (prodId !== canonicalSlug && !window.location.hash) {
                  window.history.replaceState(null, '', `/product/${canonicalSlug}`);
                }
              } else {
                setSelectedProduct(null);
              }
            })
            .catch(() => {
              setSelectedProduct(null);
            })
            .finally(() => {
              setIsProductLoading(false);
            });
        }
      } else if (path.startsWith('/category/')) {
        const catId = window.location.pathname.replace('/category/', '');
        const urlParams = new URLSearchParams(window.location.search);
        setSelectedCategory(catId);
        setSelectedSubcategory(urlParams.get('sub') || undefined);
        setCurrentView('category');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (path === '/wishlist') {
        setCurrentView('wishlist');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (path === '/login' || path === '/signin' || path === '/auth') {
        setCurrentView('login');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (
        path === '/profile' ||
        path === '/orders' ||
        path === '/order' ||
        path === '/addresses' ||
        path === '/address' ||
        path === '/account'
      ) {
        const token = localStorage.getItem('user_access_token');
        if (!token) {
          setCurrentView('login');
          setSelectedProduct(null);
          setPostAuthRedirect('profile');
          setAuthModalMessage('Please log in or register to access your account');
          window.history.replaceState(null, '', '/login');
        } else {
          setCurrentView('profile');
          setSelectedProduct(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (path === '/checkout' || path === '/cart') {
        const token = localStorage.getItem('user_access_token');
        if (!token) {
          setCurrentView('login');
          setSelectedProduct(null);
          setPostAuthRedirect('checkout');
          setAuthModalMessage('Please log in or register to proceed to checkout');
          window.history.replaceState(null, '', '/login');
        } else {
          setCurrentView('checkout');
          setSelectedProduct(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (path === '/contact' || path === '/contact-us' || path === '/support') {
        setCurrentView('contact');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setCurrentView('home');
        setSelectedProduct(null);
      }
    };

    handleRouting();
    window.addEventListener('popstate', handleRouting);
    return () => {
      window.removeEventListener('popstate', handleRouting);
    };
  }, []);

  const handleSelectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsProductLoading(false);
    cacheProduct(product);
    setCurrentView('product');
    const slug = getProductSlug(product);
    window.history.pushState(null, '', `/product/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryId: string, subcategory?: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategory);
    setCurrentView('category');
    setSelectedProduct(null);
    const subQuery = subcategory ? `?sub=${encodeURIComponent(subcategory)}` : '';
    window.history.pushState(null, '', `/category/${categoryId}${subQuery}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    setSelectedProduct(null);
    setCurrentView('home');
    window.history.pushState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToWishlist = () => {
    setCurrentView('wishlist');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/wishlist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToLogin = (message?: string, redirectTo?: ViewType) => {
    setSelectedProduct(null);
    setPostAuthRedirect(redirectTo || null);
    setAuthModalMessage(message);
    setCurrentView('login');
    window.history.pushState(null, '', '/login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToProfile = () => {
    const token = localStorage.getItem('user_access_token');
    if (!token) {
      handleGoToLogin('Please log in or register to access your profile and orders', 'profile');
      return;
    }
    setCurrentView('profile');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToOrders = (orderId?: string) => {
    const token = localStorage.getItem('user_access_token');
    if (!token) {
      handleGoToLogin('Please log in or register to access your profile and orders', 'profile');
      return;
    }
    setCurrentView('profile');
    setSelectedProduct(null);
    const targetUrl = orderId ? `/order?order=${encodeURIComponent(orderId)}` : '/orders';
    window.history.pushState(null, '', targetUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen for global require-auth and auth-change events
  useEffect(() => {
    const handleRequireAuth = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string; redirectTo?: string }>).detail;
      handleGoToLogin(detail?.message, detail?.redirectTo as ViewType);
    };

    // Gate Lock verification: If user is authenticated but missing a phone number, gate locks immediately
    const checkPhoneGate = () => {
      const token = localStorage.getItem('user_access_token');
      const email = localStorage.getItem('abb_user_profile_email');
      const phone = getPersistedUserPhone(email || '');
      if ((token || email) && (!phone || phone.trim() === '')) {
        setIsPhonePromptOpen(true);
      } else {
        setIsPhonePromptOpen(false);
      }
    };

    window.addEventListener('abb_require_auth', handleRequireAuth);
    window.addEventListener('abb_auth_change', checkPhoneGate);
    return () => {
      window.removeEventListener('abb_require_auth', handleRequireAuth);
      window.removeEventListener('abb_auth_change', checkPhoneGate);
    };
  }, []);

  const handleAuthSuccess = () => {
    if (postAuthRedirect === 'profile') {
      setPostAuthRedirect(null);
      setCurrentView('profile');
      window.history.pushState(null, '', '/profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (postAuthRedirect === 'checkout') {
      setPostAuthRedirect(null);
      setCurrentView('checkout');
      window.history.pushState(null, '', '/checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (postAuthRedirect === 'wishlist') {
      setPostAuthRedirect(null);
      setCurrentView('wishlist');
      window.history.pushState(null, '', '/wishlist');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentView === 'login') {
      setPostAuthRedirect(null);
      setCurrentView('home');
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToCheckout = () => {
    if (!isAuthenticated()) {
      handleGoToLogin('Please log in or register to proceed to checkout', 'checkout');
      return;
    }
    setCurrentView('checkout');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToContact = () => {
    setCurrentView('contact');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToBulkOrders = () => {
    setCurrentView('bulk-orders');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/bulk-orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAdmin = () => {
    setCurrentView('admin');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/admin/dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full-screen dedicated Admin App view
  if (currentView === 'admin') {
    return <AdminApp onBackToStore={handleBackToStore} />;
  }

  // Full-screen dedicated Login Page view
  if (currentView === 'login') {
    return (
      <LoginPage
        onBackToStore={handleBackToStore}
        onAuthSuccess={handleAuthSuccess}
        onSuccess={handleAuthSuccess}
        message={authModalMessage}
        onGoToContact={handleGoToContact}
      />
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white text-charcoal flex flex-col font-roboto antialiased selection:bg-[#A44101] selection:text-white">
        {/* 1. Announcement Bar (Top) */}
        <AnnouncementBar />

        {/* 2. Sticky Header & Navigation */}
        <Header
          onGoToWishlist={handleGoToWishlist}
          onGoToProfile={handleGoToProfile}
          onGoToCheckout={handleGoToCheckout}
          onGoToHome={handleBackToStore}
          onSelectCategory={handleSelectCategory}
          onSelectProduct={handleSelectProduct}
          onGoToAdmin={handleGoToAdmin}
          onGoToContact={handleGoToContact}
          onGoToBulkOrders={handleGoToBulkOrders}
          onOpenAuthModal={() => {
            handleGoToLogin();
          }}
        />

        {/* Main Content Area (White background under the header) */}
        <main className="main-content flex-1 bg-white relative">
          {currentView === 'bulk-orders' ? (
            /* Dedicated Bulk Orders & Wholesale Enquiries Page */
            <BulkOrdersPage
              onBackToHome={handleBackToStore}
              onGoToCategory={handleSelectCategory}
            />
          ) : currentView === 'contact' ? (
            /* Dedicated Customer Support & Contact Us Page */
            <ContactPage onBackToHome={handleBackToStore} />
          ) : currentView === 'wishlist' ? (
            /* Dedicated Wishlist Page */
            <WishlistPage
              onSelectProduct={handleSelectProduct}
              onBackToHome={handleBackToStore}
              onGoToCheckout={handleGoToCheckout}
            />
          ) : currentView === 'profile' ? (
            /* Dedicated Profile & Orders Page */
            <ProfilePage
              onBackToHome={handleBackToStore}
              onGoToWishlist={handleGoToWishlist}
              onGoToCheckout={handleGoToCheckout}
              onRequireAuth={() => {
                handleGoToLogin('Please log in or register to access your account', 'profile');
              }}
            />
          ) : currentView === 'checkout' ? (
            /* Dedicated Checkout Page */
            <CheckoutPage
              onBackToHome={handleBackToStore}
              onGoToWishlist={handleGoToWishlist}
              onViewOrders={handleGoToOrders}
            />
          ) : currentView === 'product' ? (
            /* Dedicated Product Detail Page */
            isProductLoading ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 border border-amber-100 shadow-xs">
                  <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Loading product details...</h3>
                <p className="text-xs text-slate-500">Retrieving full specifications and live prices</p>
              </div>
            ) : selectedProduct ? (
              <ProductDetailPage
                key={selectedProduct.id || selectedProduct.slug || selectedProduct.title}
                product={selectedProduct}
                onBack={handleBackToStore}
                onSelectProduct={handleSelectProduct}
                onGoToCheckout={handleGoToCheckout}
              />
            ) : (
              <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4 border border-slate-200">
                  <PackageX className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-bold text-navy mb-2">Product Not Available</h2>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                  The product you requested is currently inactive or not available in the store catalog.
                </p>
                <button
                  type="button"
                  onClick={handleBackToStore}
                  className="px-6 py-2.5 bg-[#A44101] hover:bg-[#8A3701] text-white font-bold rounded-lg shadow-sm transition-colors text-sm cursor-pointer"
                >
                  Return to Home Store
                </button>
              </div>
            )
          ) : currentView === 'deals' ? (
            /* Dedicated Deals & On Sale Page */
            <DealsPage
              dealType={dealsType}
              onSelectProduct={handleSelectProduct}
              onBackToHome={handleBackToStore}
              onGoToCheckout={handleGoToCheckout}
            />
          ) : currentView === 'category' ? (
            /* Dedicated Category Page */
            <CategoryPage
              categoryId={selectedCategory}
              initialSubcategory={selectedSubcategory}
              onSelectProduct={handleSelectProduct}
              onSelectCategory={handleSelectCategory}
              onBackToHome={handleBackToStore}
              onGoToCheckout={handleGoToCheckout}
            />
          ) : (
            /* Home Page View */
            <>
              {/* 3. Hero Section (Featuring the Deal Banners) */}
              <Hero onSelectCategory={handleSelectCategory} />

              {/* 4. Top Categories Section */}
              <CategoriesSection onSelectCategory={handleSelectCategory} />

              {/* 4.1. New Arrivals Section (5 Fresh Products) */}
              <NewArrivalsSection
                onProductClick={handleSelectProduct}
                onExploreAll={() => handleSelectCategory('explore-all')}
              />

              {/* 5. Dedicated Section per Category showing the 11 categories */}
              <CategoryShowcaseSections
                onProductClick={handleSelectProduct}
                onCategoryClick={handleSelectCategory}
              />
            </>
          )}
        </main>

        {/* Store Footer */}
        <Footer
          onSelectCategory={handleSelectCategory}
          onGoToAdmin={handleGoToAdmin}
          onGoToContact={handleGoToContact}
          onGoToBulkOrders={handleGoToBulkOrders}
        />

        {/* Slide-in Cart Drawer */}
        <CartDrawer onGoToCheckout={handleGoToCheckout} />

        {/* Mandatory Phone Number Collection Gate Lock Modal */}
        <PhonePromptModal
          isOpen={isPhonePromptOpen}
          onSuccess={(_phone) => {
            setIsPhonePromptOpen(false);
            handleAuthSuccess();
          }}
          onUseAnotherAccount={() => {
            setIsPhonePromptOpen(false);
            handleGoToLogin('Please sign in with another account');
          }}
        />
      </div>
    </CartProvider>
  );
};

export default App;

