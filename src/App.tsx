import React, { useState, useEffect } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoriesSection } from './components/CategoriesSection';
import { NewArrivalsSection } from './components/NewArrivalsSection';
import { EverydayEssentialsSection } from './components/EverydayEssentialsSection';
import { CategoryShowcaseSections } from './components/CategoryShowcaseSections';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CategoryPage } from './components/CategoryPage';
import { WishlistPage } from './components/WishlistPage';
import { ProfilePage } from './components/ProfilePage';
import { CheckoutPage } from './components/CheckoutPage';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { ProductItem, getProductById } from './data/storeData';
import { AdminApp } from './features/admin/AdminApp';
import { ContactPage } from './components/ContactPage';
import { ApiStatusInspector } from './components/ApiStatusInspector';
import { AuthModal } from './components/AuthModal';

type ViewType = 'home' | 'product' | 'category' | 'wishlist' | 'profile' | 'checkout' | 'admin' | 'contact';

export const App: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [postAuthRedirect, setPostAuthRedirect] = useState<ViewType | null>(null);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || path.startsWith('/admin') || hash === '#admin' || hash.startsWith('#admin')) {
      return 'admin';
    }
    if (path.startsWith('/contact') || path.startsWith('/support') || hash === '#contact') return 'contact';
    if (path.startsWith('/wishlist') || hash === '#wishlist') return 'wishlist';
    if (path.startsWith('/profile') || path.startsWith('/orders') || hash === '#profile' || hash === '#orders') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;
      if (!token) return 'home';
      return 'profile';
    }
    if (path.startsWith('/checkout') || hash === '#checkout') return 'checkout';
    if (path.startsWith('/product') || hash.startsWith('#product-')) return 'product';
    if (path.startsWith('/category') || hash.startsWith('#category-')) return 'category';
    return 'home';
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/product/')) {
      return getProductById(path.replace('/product/', '')) || null;
    }
    if (hash.startsWith('#product-')) {
      return getProductById(hash.replace('#product-', '')) || null;
    }
    return null;
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
        } else if (rawHash === '#profile' || rawHash === '#orders' || rawHash === '#account') {
          path = '/profile';
          window.history.replaceState(null, '', '/profile');
        } else if (rawHash === '#admin' || rawHash.startsWith('#admin')) {
          path = '/admin/dashboard';
          window.history.replaceState(null, '', '/admin/dashboard');
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
      } else if (path.startsWith('/product/')) {
        const prodId = window.location.pathname.replace('/product/', '');
        const prod = getProductById(prodId);
        if (prod) {
          setSelectedProduct(prod);
          setCurrentView('product');
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
      } else if (path === '/profile' || path === '/orders' || path === '/account') {
        const token = localStorage.getItem('user_access_token');
        if (!token) {
          setCurrentView('home');
          setSelectedProduct(null);
          window.history.replaceState(null, '', '/');
          setPostAuthRedirect('profile');
          setAuthModalMessage('Please log in or register to access your profile and order history');
          setIsAuthModalOpen(true);
        } else {
          setCurrentView('profile');
          setSelectedProduct(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (path === '/checkout' || path === '/cart') {
        setCurrentView('checkout');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setCurrentView('product');
    window.history.pushState(null, '', `/product/${product.id}`);
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

  const handleGoToProfile = () => {
    const token = localStorage.getItem('user_access_token');
    if (!token) {
      setPostAuthRedirect('profile');
      setAuthModalMessage('Please log in or register to access your profile and orders');
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView('profile');
    setSelectedProduct(null);
    window.history.pushState(null, '', '/profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    if (postAuthRedirect === 'profile') {
      setPostAuthRedirect(null);
      setCurrentView('profile');
      window.history.pushState(null, '', '/profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToCheckout = () => {
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
          onGoToAdmin={handleGoToAdmin}
          onGoToContact={handleGoToContact}
          onOpenAuthModal={() => {
            setPostAuthRedirect(null);
            setAuthModalMessage(undefined);
            setIsAuthModalOpen(true);
          }}
        />

        {/* Main Content Area (White background under the header) */}
        <main className="main-content flex-1 bg-white relative">
          {currentView === 'contact' ? (
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
                setCurrentView('home');
                setPostAuthRedirect('profile');
                setAuthModalMessage('Please log in or register to access your account');
                setIsAuthModalOpen(true);
              }}
            />
          ) : currentView === 'checkout' ? (
            /* Dedicated Checkout Page */
            <CheckoutPage
              onBackToHome={handleBackToStore}
              onGoToWishlist={handleGoToWishlist}
            />
          ) : currentView === 'product' && selectedProduct ? (
            /* Dedicated Product Detail Page */
            <ProductDetailPage
              product={selectedProduct}
              onBack={handleBackToStore}
              onSelectProduct={handleSelectProduct}
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
              <Hero />

              {/* 4. Top Categories Section */}
              <CategoriesSection onSelectCategory={handleSelectCategory} />

              {/* 4.1. New Arrivals Section (5 Fresh Products) */}
              <NewArrivalsSection
                onProductClick={handleSelectProduct}
                onExploreAll={() => handleSelectCategory('explore-all')}
              />

              {/* 5. Dedicated Section per Category with Everyday Essentials */}
              <CategoryShowcaseSections
                onProductClick={handleSelectProduct}
                onCategoryClick={handleSelectCategory}
                insertElement={<EverydayEssentialsSection />}
                insertAfterIndex={2}
              />
            </>
          )}
        </main>

        {/* Store Footer */}
        <Footer
          onSelectCategory={handleSelectCategory}
          onGoToAdmin={handleGoToAdmin}
          onGoToContact={handleGoToContact}
        />

        {/* Slide-in Cart Drawer */}
        <CartDrawer onGoToCheckout={handleGoToCheckout} />

        {/* Floating API & Razorpay Inspector */}
        <ApiStatusInspector />

        {/* Customer Login & Registration Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          onAuthSuccess={handleAuthSuccess}
          message={authModalMessage}
        />
      </div>
    </CartProvider>
  );
};

export default App;

