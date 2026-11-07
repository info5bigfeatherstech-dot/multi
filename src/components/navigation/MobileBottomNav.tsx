import React, { useState, useEffect } from 'react';
import { Home, LayoutGrid, Flame, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getWishlistCount } from '../../utils/wishlistStorage';

export interface MobileBottomNavProps {
  currentView?: string;
  onGoToHome?: () => void;
  onGoToWishlist?: () => void;
  onOpenCategories?: () => void;
  onGoToDeals?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView = 'home',
  onGoToHome,
  onGoToWishlist,
  onOpenCategories,
  onGoToDeals,
}) => {
  const { openCart, totalCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(() => getWishlistCount());

  useEffect(() => {
    const handleWishlistChange = () => {
      setWishlistCount(getWishlistCount());
    };
    window.addEventListener('abb_wishlist_change', handleWishlistChange);
    return () => window.removeEventListener('abb_wishlist_change', handleWishlistChange);
  }, []);

  const handleHomeClick = () => {
    if (onGoToHome) {
      onGoToHome();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoriesClick = () => {
    if (onOpenCategories) {
      onOpenCategories();
    } else {
      window.history.pushState(null, '', '/category/explore-all');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDealsClick = () => {
    if (onGoToDeals) {
      onGoToDeals();
    } else {
      window.history.pushState(null, '', '/today-deals');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWishlistClick = () => {
    if (onGoToWishlist) {
      onGoToWishlist();
    } else {
      window.history.pushState(null, '', '/wishlist');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isHomeActive = currentView === 'home';
  const isWishlistActive = currentView === 'wishlist';
  const isDealsActive = currentView === 'deals';

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-1 px-2 flex items-center justify-around select-none"
      aria-label="Mobile Bottom Navigation"
      style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={handleHomeClick}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative min-w-[56px] ${
          isHomeActive ? 'text-[#A44101]' : 'text-slate-500 hover:text-navy'
        }`}
        aria-label="Go to Home"
      >
        <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Home</span>
      </button>

      {/* 2. Categories */}
      <button
        type="button"
        onClick={handleCategoriesClick}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-navy transition-all cursor-pointer relative min-w-[56px]"
        aria-label="Explore Categories"
      >
        <LayoutGrid className="w-5 h-5 stroke-2" />
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Categories</span>
      </button>

      {/* 3. Deals */}
      <button
        type="button"
        onClick={handleDealsClick}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative min-w-[56px] ${
          isDealsActive ? 'text-[#A44101]' : 'text-slate-500 hover:text-navy'
        }`}
        aria-label="Today Deals"
      >
        <div className="relative">
          <Flame className={`w-5 h-5 ${isDealsActive ? 'text-[#A44101] fill-[#A44101]' : 'stroke-2'}`} />
          <span className="absolute -top-1 -right-2 bg-gradient-to-r from-red-500 to-[#A44101] text-white text-[7px] font-black px-1 rounded-full uppercase leading-tight shadow-xs">
            HOT
          </span>
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Deals</span>
      </button>

      {/* 4. Wishlist */}
      <button
        type="button"
        onClick={handleWishlistClick}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative min-w-[56px] ${
          isWishlistActive ? 'text-[#A44101]' : 'text-slate-500 hover:text-navy'
        }`}
        aria-label="Wishlist"
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${isWishlistActive ? 'fill-[#A44101] text-[#A44101]' : 'stroke-2'}`} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#A44101] text-white text-[8px] font-black rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none shadow-xs">
              {wishlistCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Wishlist</span>
      </button>

      {/* 5. Cart */}
      <button
        type="button"
        onClick={openCart}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-navy transition-all cursor-pointer relative min-w-[56px]"
        aria-label={`Cart with ${totalCount} items`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 stroke-2" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#A44101] text-white text-[8px] font-black rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none shadow-xs">
              {totalCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5 tracking-tight">Cart</span>
      </button>
    </nav>
  );
};

