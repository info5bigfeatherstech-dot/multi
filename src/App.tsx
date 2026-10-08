import React, { useState, useEffect } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoriesSection } from './components/CategoriesSection';
import { EverydayEssentialsSection } from './components/EverydayEssentialsSection';
import { CategoryShowcaseSections } from './components/CategoryShowcaseSections';
import { ProductDetailPage } from './components/ProductDetailPage';
import { WishlistPage } from './components/WishlistPage';
import { ProfilePage } from './components/ProfilePage';
import { CheckoutPage } from './components/CheckoutPage';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { ProductItem, getProductById } from './data/storeData';

type ViewType = 'home' | 'product' | 'wishlist' | 'profile' | 'checkout';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Sync with URL hash for browser history & direct links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product-')) {
        const prodId = hash.replace('#product-', '');
        const prod = getProductById(prodId);
        if (prod) {
          setSelectedProduct(prod);
          setCurrentView('product');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (hash === '#wishlist') {
        setCurrentView('wishlist');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#profile' || hash === '#account' || hash === '#orders') {
        setCurrentView('profile');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#checkout' || hash === '#cart') {
        setCurrentView('checkout');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '' || hash === '#home') {
        setCurrentView('home');
        setSelectedProduct(null);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectProduct = (product: ProductItem) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.location.hash = `#product-${product.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    setSelectedProduct(null);
    setCurrentView('home');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToWishlist = () => {
    setCurrentView('wishlist');
    setSelectedProduct(null);
    window.location.hash = '#wishlist';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToProfile = () => {
    setCurrentView('profile');
    setSelectedProduct(null);
    window.location.hash = '#profile';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToCheckout = () => {
    setCurrentView('checkout');
    setSelectedProduct(null);
    window.location.hash = '#checkout';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        />

        {/* Main Content Area (White background under the header) */}
        <main id="main-content" className="flex-1 bg-white relative isolate">
          {currentView === 'wishlist' ? (
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
          ) : (
            /* Home Page View */
            <>
              {/* 3. Hero Section (Featuring the Deal Banners) */}
              <Hero />

              {/* 4. Top Categories Section */}
              <CategoriesSection />

              {/* 5. Dedicated Section per Category with Everyday Essentials */}
              <CategoryShowcaseSections 
                onProductClick={handleSelectProduct} 
                insertElement={<EverydayEssentialsSection />}
                insertAfterIndex={2}
              />
            </>
          )}
        </main>

        {/* Store Footer */}
        <Footer />

        {/* Slide-in Cart Drawer */}
        <CartDrawer onGoToCheckout={handleGoToCheckout} />
      </div>
    </CartProvider>
  );
};

export default App;

