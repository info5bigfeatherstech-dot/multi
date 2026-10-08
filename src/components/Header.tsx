import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  ChevronDown,
  ChevronRight,
  Flame,
  LayoutGrid,
  ShieldCheck,
  ChefHat, 
  Smartphone, 
  Baby, 
  BookOpen, 
  Sparkle, 
  Dumbbell, 
  Plane, 
  Shirt, 
  Gift, 
  Sparkles, 
  Wrench, 
  Car, 
  PackageCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

export interface NavCategoryMenuItem {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  imageUrl: string;
  description: string;
}

// Complete rich categories matching STORE_CATEGORIES
export const ALL_CATEGORIES_MENU: NavCategoryMenuItem[] = [
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    badge: "Bestseller",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: ChefHat,
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80",
    description: "Cookware, containers & tools"
  },
  {
    id: "smart-life-gadget",
    name: "Smart Life Gadgets",
    badge: "Trending",
    badgeColor: "bg-slate-100 text-navy",
    icon: Smartphone,
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80",
    description: "Electronic utilities & novelties"
  },
  {
    id: "baby-items",
    name: "Baby Items",
    badge: "Popular",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Baby,
    imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=200&q=80",
    description: "Care, feeding & accessories"
  },
  {
    id: "stationary",
    name: "Stationary",
    badge: "Lowest ₹",
    badgeColor: "bg-slate-100 text-navy",
    icon: BookOpen,
    imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=200&q=80",
    description: "School & office supplies"
  },
  {
    id: "cleaning-housekeeping",
    name: "Cleaning & Housekeeping",
    badge: "Best Value",
    badgeColor: "bg-slate-100 text-navy",
    icon: Sparkle,
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80",
    description: "Mops, wipers & brushes"
  },
  {
    id: "sports-fitness",
    name: "Sports & Fitness",
    badge: "New",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Dumbbell,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80",
    description: "Gym gear, shakers & bands"
  },
  {
    id: "tours-travels",
    name: "Tours & Travels",
    badge: "Hot",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Plane,
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80",
    description: "Organizers & luggage tags"
  },
  {
    id: "fashion-world",
    name: "Fashion World",
    badge: "Flat 70% Off",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Shirt,
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=200&q=80",
    description: "Apparel & daily fashion"
  },
  {
    id: "gifts",
    name: "Gifts & Novelties",
    badge: "Festive",
    badgeColor: "bg-slate-100 text-navy",
    icon: Gift,
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&q=80",
    description: "Hampers, decor & toys"
  },
  {
    id: "beauty-personal-care",
    name: "Beauty & Personal Care",
    badge: "Care",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Sparkles,
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80",
    description: "Grooming & skincare kits"
  },
  {
    id: "home-improvement",
    name: "Home Improvement",
    badge: "Hardware",
    badgeColor: "bg-slate-100 text-slate-800",
    icon: Wrench,
    imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=200&q=80",
    description: "Fixtures, tools & hooks"
  },
  {
    id: "car-accessories",
    name: "Car Accessories",
    badge: "Auto",
    badgeColor: "bg-slate-100 text-slate-800",
    icon: Car,
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80",
    description: "Holders, cleaners & mats"
  },
  {
    id: "mix-item",
    name: "Mix Item Deals",
    badge: "Clearance",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: PackageCheck,
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80",
    description: "Combo packs & overstock"
  },
];

export interface HeaderProps {
  onGoToWishlist?: () => void;
  onGoToProfile?: () => void;
  onGoToCheckout?: () => void;
  onGoToHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoToWishlist,
  onGoToProfile,
  onGoToHome,
}) => {
  const { openCart, totalCount, subtotal } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");

  // Hover dropdown state for Nav Bar "All Categories"
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const navDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track scroll position to add clean soft shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer and dropdowns on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsNavDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (navDropdownTimeoutRef.current) clearTimeout(navDropdownTimeoutRef.current);
    };
  }, []);

  // Handlers for Nav Dropdown hover
  const handleNavDropdownEnter = () => {
    if (navDropdownTimeoutRef.current) clearTimeout(navDropdownTimeoutRef.current);
    setIsNavDropdownOpen(true);
  };

  const handleNavDropdownLeave = () => {
    navDropdownTimeoutRef.current = setTimeout(() => {
      setIsNavDropdownOpen(false);
    }, 220);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    console.log(`Searching for "${searchQuery}"`);
  };

  const handleCategorySelect = (catId: string) => {
    setActiveCategoryTab(catId);
    setIsMobileMenuOpen(false);
    setIsNavDropdownOpen(false);

    // Notify any listening components (e.g. CategoriesSection to expand)
    window.dispatchEvent(new CustomEvent('select-category', { detail: catId }));

    if (catId === 'under-99') {
      const el = document.getElementById('under-99-store');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId === 'todays-deals') {
      const el = document.getElementById('section-home-kitchen') || document.getElementById('top-categories');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId === 'all') {
      const el = document.getElementById('top-categories') || document.getElementById('every-product-catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const dedicatedEl = document.getElementById(`section-${catId}`);
      if (dedicatedEl) {
        dedicatedEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        const cardEl = document.getElementById(`category-card-${catId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.classList.add('ring-4', 'ring-[#A44101]', 'ring-offset-2');
          setTimeout(() => {
            cardEl.classList.remove('ring-4', 'ring-[#A44101]', 'ring-offset-2');
          }, 1800);
        } else {
          const fallbackEl = document.getElementById('top-categories') || document.getElementById('every-product-catalog');
          if (fallbackEl) fallbackEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white border-b-2 border-[#A44101] transition-shadow duration-200 ${
          isScrolled ? 'shadow-md' : 'shadow-xs'
        }`}
      >
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-28 sm:h-32 md:h-36 gap-3 md:gap-8 py-2">
            
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Mobile Hamburger toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-navy hover:text-[#A44101] md:hidden rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>

              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToHome) onGoToHome();
                  else {
                    window.location.hash = '';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex items-center group cursor-pointer focus:outline-none"
                aria-label="Apna Bharat Bazaar Home"
              >
                <img
                  src="/images/logo.jpeg"
                  alt="Apna Bharat Bazaar"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover shadow-md ring-3 ring-[#A44101] group-hover:scale-105 transition-transform duration-200 bg-white"
                />
              </a>
            </div>

            {/* Desktop Center: Large Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex w-full items-center rounded-theme border-2 border-slate-200 bg-white hover:border-[#A44101]/70 focus-within:border-[#A44101] focus-within:ring-2 focus-within:ring-[#A44101]/20 transition-all shadow-xs overflow-hidden"
                role="search"
              >
                <div className="pl-4 pr-1 text-slate-400 flex items-center justify-center pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>

                {/* Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 10,000+ lowest price deals (e.g. pressure cooker, tiffin, toys)..."
                  className="w-full px-3 py-2.5 text-sm text-charcoal placeholder-slate-400 focus:outline-none"
                  aria-label="Search products"
                />

                {/* Search Button (Theme CTA) */}
                <button
                  type="submit"
                  className="bg-[#A44101] hover:bg-[#8C3701] text-white px-6 py-2.5 flex items-center justify-center font-extrabold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-xs active:scale-98"
                  aria-label="Execute search"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {/* Wishlist */}
              <button
                type="button"
                onClick={() => {
                  if (onGoToWishlist) onGoToWishlist();
                  else window.location.hash = '#wishlist';
                }}
                className="relative p-2 text-navy hover:text-[#A44101] transition-colors group cursor-pointer"
                aria-label="Wishlist (4 saved items)"
              >
                <Heart className="w-5 h-5 text-navy group-hover:text-[#A44101] group-hover:scale-110 transition-all" />
                <span className="absolute -top-1 -right-1 bg-[#A44101] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-sm">
                  4
                </span>
              </button>

              {/* Cart */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-navy hover:text-[#A44101] transition-colors group flex items-center gap-2 cursor-pointer"
                aria-label={`Shopping Cart (${totalCount} items)`}
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-navy group-hover:text-[#A44101] group-hover:scale-110 transition-all" />
                  <span className="absolute -top-1 -right-1.5 bg-[#A44101] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none shadow-sm">
                    {totalCount}
                  </span>
                </div>
                <div className="hidden lg:flex flex-col text-left leading-none">
                  <span className="text-[10px] text-mutedGray font-medium">Cart</span>
                  <span className="text-xs font-black text-[#A44101] mt-0.5 transition-colors">₹{subtotal}</span>
                </div>
              </button>

              {/* Account */}
              <button
                type="button"
                onClick={() => {
                  if (onGoToProfile) onGoToProfile();
                  else window.location.hash = '#profile';
                }}
                className="flex items-center gap-2 p-2 sm:px-3 text-navy hover:text-[#A44101] transition-colors cursor-pointer group"
                aria-label="User Account"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#A44101]/10 flex items-center justify-center text-navy group-hover:text-[#A44101] border border-slate-200 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-mutedGray font-medium">Namaste</span>
                  <span className="text-xs font-bold text-navy group-hover:text-[#A44101] transition-colors">My Account</span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Row (Under logo on mobile) */}
          <div className="pb-3 md:hidden">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full items-center rounded-theme border border-slate-200 bg-slate-50/70 overflow-hidden focus-within:border-[#A44101] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#A44101]/20 transition-all"
              role="search"
            >
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deals, pressure cookers, toys..."
                className="w-full px-3 py-2 text-sm text-charcoal bg-transparent placeholder-slate-400 focus:outline-none"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="bg-[#A44101] text-white px-4 py-2 text-xs font-extrabold shrink-0 hover:bg-[#8C3701] transition-colors"
              >
                Find
              </button>
            </form>
          </div>

          {/* Desktop Category Nav Bar - Redesigned, Clean, High-Conversion Navigation */}
          <nav
            className="hidden md:flex items-center justify-between border-t border-stone-300/70 py-2.5 text-xs font-semibold gap-3 relative"
            aria-label="Main Categories Navigation"
          >
            {/* 1. "All Categories" Dropdown Container (Opens on hover and click) */}
            <div 
              className="relative shrink-0"
              onMouseEnter={handleNavDropdownEnter}
              onMouseLeave={handleNavDropdownLeave}
            >
              <button
                type="button"
                onClick={() => {
                  setIsNavDropdownOpen((prev) => !prev);
                  handleCategorySelect('all');
                }}
                className={`h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer shadow-xs ${
                  isNavDropdownOpen
                    ? 'bg-navy text-white ring-2 ring-[#A44101]/50 shadow-md'
                    : 'bg-navy hover:bg-[#1a2e45] text-white'
                }`}
                aria-expanded={isNavDropdownOpen}
                aria-haspopup="true"
              >
                <LayoutGrid className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>All Categories</span>
                <ChevronDown 
                  className={`w-3.5 h-3.5 text-[#A44101] transition-transform duration-200 shrink-0 ${
                    isNavDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Clean, Premium Dropdown on Hover */}
              <AnimatePresence>
                {isNavDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.99 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-0 mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
                    onMouseEnter={handleNavDropdownEnter}
                    onMouseLeave={handleNavDropdownLeave}
                  >
                    {/* Single Column Category List without icons or scrolling */}
                    <div className="py-2 px-1.5 space-y-0.5">
                      {ALL_CATEGORIES_MENU.map((cat) => {
                        const isCatActive = activeCategoryTab === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`group flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                              isCatActive
                                ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                                : 'text-slate-700 hover:text-navy hover:bg-stone-100 font-medium'
                            }`}
                          >
                            <span className="truncate group-hover:text-[#A44101] transition-colors">
                              {cat.name}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Store Navigation Links with clean modern pill styles */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 flex-1 min-w-0 pl-1">
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-navy hover:bg-stone-200/70 transition-colors"
              >
                Home
              </a>
              <a
                href="#top-categories"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('top-categories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal hover:text-navy hover:bg-stone-200/70 transition-colors"
              >
                Featured Categories
              </a>
              <a
                href="#section-home-kitchen"
                onClick={(e) => {
                  e.preventDefault();
                  (document.getElementById('section-home-kitchen') || document.getElementById('top-categories'))?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#A44101] hover:text-[#8C3701] hover:bg-[#A44101]/10 transition-colors flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-[#A44101] animate-pulse" />
                <span>Top Deals</span>
              </a>
              <a
                href="#footer"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal hover:text-navy hover:bg-stone-200/70 transition-colors"
              >
                Customer Support
              </a>
              <a
                href="https://wa.me/919320001717"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal hover:text-navy hover:bg-stone-200/70 transition-colors"
              >
                Bulk Orders
              </a>
            </div>

            {/* Right Mini Guarantee & Delivery Badges */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-navy bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-bold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-navy" />
                <span>Lowest Price Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#A44101] bg-[#A44101]/10 border border-[#A44101]/20 px-3 py-1 rounded-full font-bold shadow-2xs">
                <PackageCheck className="w-3.5 h-3.5 text-[#A44101]" />
                <span>Pan-India Delivery</span>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-navy z-50 md:hidden backdrop-blur-none"
              aria-hidden="true"
            />

            {/* Slide-in Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl flex flex-col md:hidden border-r border-slate-200"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation drawer"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-navy-light/40 flex items-center justify-between bg-navy text-white">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/logo.jpeg"
                    alt="Apna Bharat Bazaar"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#A44101] bg-white shadow-xs"
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="font-black text-base text-white">Apna Bharat <span className="text-[#A44101]">Bazaar</span></span>
                    <span className="text-[9px] uppercase font-bold text-[#A44101]">Think Shopping, Think Us</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-mutedGray">
                      Browse All Categories ({ALL_CATEGORIES_MENU.length})
                    </h3>
                  </div>

                  {/* Complete Category List */}
                  <div className="space-y-1">
                    {ALL_CATEGORIES_MENU.map((cat) => {
                      const IconComp = cat.icon;
                      const isCatActive = activeCategoryTab === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-theme text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                            isCatActive
                              ? 'bg-navy text-white'
                              : 'hover:bg-stone-200/60 text-navy'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <IconComp className={`w-4 h-4 ${isCatActive ? 'text-[#A44101]' : 'text-slate-600'}`} />
                            <span>{cat.name}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-stone-300/80 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-mutedGray mb-2.5 px-2">
                    Quick Links
                  </h3>
                  <div className="space-y-1 text-sm font-medium text-navy">
                    <a
                      href="#profile"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (onGoToProfile) onGoToProfile();
                        else window.location.hash = '#profile';
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-theme hover:bg-stone-200/60 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      <span>My Orders & Profile</span>
                    </a>
                    <a
                      href="#wishlist"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (onGoToWishlist) onGoToWishlist();
                        else window.location.hash = '#wishlist';
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-theme hover:bg-stone-200/60 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-slate-500" />
                      <span>Wishlist (4 items)</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openCart();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-theme hover:bg-stone-200/60 cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-slate-500" />
                        <span>Shopping Cart Drawer</span>
                      </div>
                      <span className="bg-[#A44101] text-white font-black text-[11px] px-2 py-0.5 rounded-full">
                        {totalCount} • ₹{subtotal}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Contact */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-charcoal">
                <p className="font-bold text-navy mb-1">Direct WhatsApp / Call:</p>
                <p className="text-[#A44101] font-black">+91 93200 01717</p>
                <p className="text-slate-600 mt-1">support.apnabharatbazaar@gmail.com</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
