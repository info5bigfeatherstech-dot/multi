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
  PackageCheck,
  Headphones,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { CATEGORY_SUBCATEGORIES } from '../data/storeData';
import { storefrontProductsApi } from '../api';

export interface NavCategoryMenuItem {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ComponentType<{ className?: string }>;
  imageUrl: string;
  description: string;
  subcategories?: string[];
}

// Complete rich categories matching exact user table and subcategories
export const ALL_CATEGORIES_MENU: NavCategoryMenuItem[] = [
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    badge: "Bestseller",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: ChefHat,
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80",
    description: "Cookware, containers & tools",
    subcategories: CATEGORY_SUBCATEGORIES["home-kitchen"],
  },
  {
    id: "smart-life-gadget",
    name: "Smart Life Gadgets",
    badge: "Trending",
    badgeColor: "bg-slate-100 text-navy",
    icon: Smartphone,
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80",
    description: "Electronic utilities & novelties",
    subcategories: CATEGORY_SUBCATEGORIES["smart-life-gadget"],
  },
  {
    id: "baby-items",
    name: "Baby Items",
    badge: "Popular",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Baby,
    imageUrl: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=200&q=80",
    description: "Care, feeding & accessories",
    subcategories: CATEGORY_SUBCATEGORIES["baby-items"],
  },
  {
    id: "stationary",
    name: "Stationery",
    badge: "Lowest ₹",
    badgeColor: "bg-slate-100 text-navy",
    icon: BookOpen,
    imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=200&q=80",
    description: "School & office supplies",
    subcategories: CATEGORY_SUBCATEGORIES["stationary"],
  },
  {
    id: "cleaning-housekeeping",
    name: "Cleaning & Housekeeping",
    badge: "Best Value",
    badgeColor: "bg-slate-100 text-navy",
    icon: Sparkle,
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=80",
    description: "Mops, wipers & brushes",
    subcategories: CATEGORY_SUBCATEGORIES["cleaning-housekeeping"],
  },
  {
    id: "sports-fitness",
    name: "Sports & Fitness",
    badge: "New",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Dumbbell,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=200&q=80",
    description: "Gym gear, shakers & bands",
    subcategories: CATEGORY_SUBCATEGORIES["sports-fitness"],
  },
  {
    id: "tours-travels",
    name: "Tours & Travels",
    badge: "Hot",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Plane,
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=80",
    description: "Organizers & luggage tags",
    subcategories: CATEGORY_SUBCATEGORIES["tours-travels"],
  },
  {
    id: "fashion-world",
    name: "Fashion World",
    badge: "Flat 70% Off",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Shirt,
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=200&q=80",
    description: "Apparel & daily fashion",
    subcategories: CATEGORY_SUBCATEGORIES["fashion-world"],
  },
  {
    id: "gifts",
    name: "Gifts",
    badge: "Festive",
    badgeColor: "bg-slate-100 text-navy",
    icon: Gift,
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&q=80",
    description: "Hampers, decor & gifts",
    subcategories: CATEGORY_SUBCATEGORIES["gifts"],
  },
  {
    id: "beauty-personal-care",
    name: "Beauty & Personal Care",
    badge: "Care",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Sparkles,
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=200&q=80",
    description: "Grooming & skincare kits",
    subcategories: CATEGORY_SUBCATEGORIES["beauty-personal-care"],
  },
  {
    id: "home-improvement",
    name: "Home Improvement",
    badge: "Hardware",
    badgeColor: "bg-slate-100 text-slate-800",
    icon: Wrench,
    imageUrl: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=200&q=80",
    description: "Fixtures, tools & hooks",
    subcategories: CATEGORY_SUBCATEGORIES["home-improvement"],
  },
  {
    id: "car-accessories",
    name: "Car Accessories",
    badge: "Auto",
    badgeColor: "bg-slate-100 text-slate-800",
    icon: Car,
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80",
    description: "Holders, cleaners & mats",
    subcategories: CATEGORY_SUBCATEGORIES["car-accessories"],
  },
  {
    id: "corporate-gifting",
    name: "Corporate Gifting",
    badge: "B2B",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: Briefcase,
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=200&q=80",
    description: "Employee gifts & sets",
    subcategories: CATEGORY_SUBCATEGORIES["corporate-gifting"],
  },
  {
    id: "mix-item",
    name: "Mix Item Deals",
    badge: "Clearance",
    badgeColor: "bg-[#A44101]/10 text-[#A44101]",
    icon: PackageCheck,
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80",
    description: "Combo packs & overstock",
    subcategories: CATEGORY_SUBCATEGORIES["mix-item"],
  },
];

export interface HeaderProps {
  onGoToWishlist?: () => void;
  onGoToProfile?: () => void;
  onGoToCheckout?: () => void;
  onGoToHome?: () => void;
  onSelectCategory?: (categoryId: string, subcategory?: string) => void;
  onGoToAdmin?: () => void;
  onGoToContact?: () => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoToWishlist,
  onGoToProfile,
  onGoToHome,
  onSelectCategory,
  onGoToAdmin,
  onGoToContact,
  onOpenAuthModal,
}) => {
  const { openCart, totalCount, subtotal } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [navCategories, setNavCategories] = useState<NavCategoryMenuItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('abb_dynamic_categories_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((cat: any, idx: number) => ({
            id: cat.id,
            name: cat.name,
            badge: idx === 0 ? 'Bestseller' : undefined,
            badgeColor: 'bg-[#A44101]/10 text-[#A44101]',
            icon: LayoutGrid,
            imageUrl: '',
            description: `${cat.name} collections, deals & accessories`,
            subcategories: cat.subcategories || ['All Products', 'Trending Deals'],
          }));
        }
      }
    } catch {}
    return [];
  });
  const [hoveredNavCat, setHoveredNavCat] = useState<NavCategoryMenuItem | null>(() => {
    return null;
  });
  const [expandedMobileCats, setExpandedMobileCats] = useState<{ [catId: string]: boolean }>({});

  // Fetch dynamic categories from backend API
  useEffect(() => {
    storefrontProductsApi.getCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const dynamicMenu: NavCategoryMenuItem[] = res.map((cat: any, idx: number) => {
            const catId = cat.slug || cat._id || cat.id;
            const subcats: string[] = Array.isArray(cat.children) && cat.children.length > 0
              ? cat.children.map((c: any) => typeof c === 'string' ? c : c.name || c.title)
              : (CATEGORY_SUBCATEGORIES[cat.slug] || [
                  `All ${cat.name}`,
                  'Bestsellers',
                  'New Arrivals',
                  'Trending Deals'
                ]);

            return {
              id: catId,
              name: cat.name,
              badge: cat.showInMovingFast ? 'Popular' : (idx === 0 ? 'Bestseller' : undefined),
              badgeColor: 'bg-[#A44101]/10 text-[#A44101]',
              icon: LayoutGrid,
              imageUrl: cat.image?.url || cat.image || '',
              description: cat.description || `${cat.name} collections, deals & accessories`,
              subcategories: subcats,
            };
          });

          setNavCategories(dynamicMenu);
          if (dynamicMenu.length > 0) {
            setHoveredNavCat(dynamicMenu[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Dynamic categories fetch error:', err?.message);
      });
  }, []);

  // Real-time Marketing Nav Labels
  const [storefrontNavLabels] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('abb_admin_product_labels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((l: any) => l.showInNav && l.isActive !== false);
        }
      }
    } catch {}
    return [
      { name: "Today's Deal", slug: "today-arrival", badgeText: "HOT", icon: "flame" },
      { name: "On Sale", slug: "on-sale", badgeText: "HOT", icon: "flame" },
    ];
  });

  // Real-time Customer Auth State
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(() => {
    return typeof window !== 'undefined' ? Boolean(localStorage.getItem('user_access_token')) : false;
  });
  const [customerName, setCustomerName] = useState(() => {
    if (typeof window === 'undefined') return '';
    const n = localStorage.getItem('abb_user_profile_name');
    return n && n !== 'Google User' ? n : '';
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setIsCustomerLoggedIn(Boolean(localStorage.getItem('user_access_token')));
      const n = localStorage.getItem('abb_user_profile_name');
      setCustomerName(n && n !== 'Google User' ? n : '');
    };
    window.addEventListener('abb_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('abb_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleAccountClick = () => {
    const token = localStorage.getItem('user_access_token');
    if (token) {
      if (onGoToProfile) onGoToProfile();
      else {
        window.history.pushState(null, '', '/profile');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else if (onGoToProfile) {
        onGoToProfile();
      }
    }
  };

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

  const handleCategorySelect = (catId: string, subcategory?: string) => {
    setActiveCategoryTab(catId);
    setIsMobileMenuOpen(false);
    setIsNavDropdownOpen(false);

    // Notify any listening components
    window.dispatchEvent(new CustomEvent('select-category', { detail: { catId, subcategory } }));

    if (onSelectCategory && catId !== 'all') {
      onSelectCategory(catId, subcategory);
      return;
    }

    if (catId === 'under-99') {
      const el = document.querySelector('.section-under-99-store');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId === 'todays-deals') {
      const el = document.querySelector('.section-home-kitchen') || document.querySelector('.section-top-categories');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (catId === 'all') {
      const el = document.querySelector('.section-top-categories') || document.querySelector('.section-every-product-catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const dedicatedEl = document.querySelector(`.section-${catId}`);
      if (dedicatedEl) {
        dedicatedEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        const cardEl = document.querySelector(`.category-card-${catId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.classList.add('ring-4', 'ring-[#A44101]', 'ring-offset-2');
          setTimeout(() => {
            cardEl.classList.remove('ring-4', 'ring-[#A44101]', 'ring-offset-2');
          }, 1800);
        } else {
          const fallbackEl = document.querySelector('.section-top-categories') || document.querySelector('.section-every-product-catalog');
          if (fallbackEl) fallbackEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white border-b-2 border-[#A44101] transition-shadow duration-200 ${isScrolled ? 'shadow-md' : 'shadow-xs'
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
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToHome) onGoToHome();
                  else {
                    window.history.pushState(null, '', '/');
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
                  else {
                    window.history.pushState(null, '', '/wishlist');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
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
                onClick={handleAccountClick}
                className="flex items-center gap-2 p-2 sm:px-3 text-navy hover:text-[#A44101] transition-colors cursor-pointer group"
                aria-label="User Account"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#A44101]/10 flex items-center justify-center text-navy group-hover:text-[#A44101] border border-slate-200 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-mutedGray font-medium">
                    {isCustomerLoggedIn ? 'Namaste' : 'Welcome'}
                  </span>
                  <span className="text-xs font-bold text-navy group-hover:text-[#A44101] transition-colors">
                    {isCustomerLoggedIn
                      ? (customerName ? customerName.split(' ')[0] : 'My Account')
                      : 'Sign In / Register'}
                  </span>
                </div>
              </button>

              {/* Admin Portal Shortcut */}
              <button
                type="button"
                onClick={() => {
                  if (onGoToAdmin) onGoToAdmin();
                  else {
                    window.history.pushState(null, '', '/admin/dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 transition-all text-xs font-bold cursor-pointer group shadow-xs active:scale-95"
                title="Open Store Admin Panel"
                aria-label="Admin Portal"
              >
                <ShieldCheck className="w-4 h-4 text-[#A44101] group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Admin</span>
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
                className={`h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer shadow-xs ${isNavDropdownOpen
                    ? 'bg-navy text-white ring-2 ring-[#A44101]/50 shadow-md'
                    : 'bg-navy hover:bg-[#1a2e45] text-white'
                  }`}
                aria-expanded={isNavDropdownOpen}
                aria-haspopup="true"
              >
                <LayoutGrid className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>All Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#A44101] transition-transform duration-200 shrink-0 ${isNavDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Clean, Premium Dropdown on Hover with Subcategories Flyout */}
              <AnimatePresence>
                {isNavDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.99 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-0 mt-2 z-50 flex w-[520px] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
                    onMouseEnter={handleNavDropdownEnter}
                    onMouseLeave={handleNavDropdownLeave}
                  >
                    {/* Left Column: Categories List */}
                    <div className="w-[230px] py-2 px-1.5 border-r border-slate-100 max-h-[460px] overflow-y-auto space-y-0.5 shrink-0 bg-white">
                      {navCategories.map((cat) => {
                        const isCatSelected = (hoveredNavCat?.id || navCategories[0]?.id) === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onMouseEnter={() => setHoveredNavCat(cat)}
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`group flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                              isCatSelected
                                ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                                : 'text-slate-700 hover:text-navy hover:bg-stone-100 font-medium'
                            }`}
                          >
                            <span className="truncate group-hover:text-[#A44101] transition-colors">
                              {cat.name}
                            </span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-all shrink-0 ml-1.5 ${
                              isCatSelected ? 'text-[#A44101] translate-x-0.5' : 'text-stone-300'
                            }`} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column: Subcategories Flyout Pane */}
                    <div className="flex-1 p-3.5 bg-slate-50/70 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-navy uppercase tracking-wider truncate">
                            {hoveredNavCat?.name || 'Department'}
                          </h4>
                          {hoveredNavCat?.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${hoveredNavCat.badgeColor || 'bg-slate-200 text-slate-800'}`}>
                              {hoveredNavCat.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">
                          {hoveredNavCat?.description}
                        </p>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Subcategories
                          </span>
                          <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto pr-1">
                            {hoveredNavCat?.subcategories?.map((sub, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleCategorySelect(hoveredNavCat.id, sub)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#A44101] bg-white hover:bg-white border border-slate-200/80 hover:border-[#A44101]/30 transition-all flex items-center justify-between group cursor-pointer shadow-2xs hover:shadow-xs"
                              >
                                <span className="truncate">{sub}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#A44101] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/80 mt-2.5">
                        <button
                          type="button"
                          onClick={() => handleCategorySelect(hoveredNavCat?.id || 'all')}
                          className="w-full text-center text-xs font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer py-1 block"
                        >
                          Explore All in {hoveredNavCat?.name} →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Store Navigation Links with clean modern pill styles */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 flex-1 min-w-0 pl-1">
              <button
                type="button"
                onClick={() => {
                  if (onGoToHome) onGoToHome();
                  else {
                    window.history.pushState(null, '', '/');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-navy hover:bg-stone-200/70 transition-colors cursor-pointer"
              >
                Home
              </button>
              {/* <button
                type="button"
                onClick={() => {
                  document.querySelector('.section-top-categories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal hover:text-navy hover:bg-stone-200/70 transition-colors cursor-pointer"
              >
                Featured Categories
              </button> */}
              {storefrontNavLabels.slice(0, 3).map((lbl) => {
                const isFestive = lbl.badgeText === 'FESTIVE' || lbl.icon === 'sparkles' || (lbl as any).style?.includes('Festive');
                return (
                  <button
                    key={lbl.slug || lbl.name}
                    type="button"
                    onClick={() => {
                      const targetEl = document.querySelector('.section-home-kitchen') || document.querySelector('.section-top-categories');
                      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer hover:scale-102 ${
                      isFestive
                        ? 'bg-black/80 border border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                        : 'bg-[#1c1917] border border-stone-800 hover:border-[#A44101]/60 shadow-2xs'
                    }`}
                  >
                    {isFestive ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 animate-pulse" />
                    ) : (
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    )}
                    <span>{lbl.name}</span>
                    {lbl.badgeText && (
                      <span className={`text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        isFestive
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-2xs'
                          : 'bg-gradient-to-r from-red-600 to-amber-600'
                      }`}>
                        {lbl.badgeText}
                      </span>
                    )}
                  </button>
                );
              })}

              <a
                href="https://wa.me/919320001717"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal hover:text-navy hover:bg-stone-200/70 transition-colors"
              >
                Bulk Orders
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onGoToContact) onGoToContact();
                else {
                  window.history.pushState(null, '', '/contact');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal hover:text-navy hover:bg-stone-200/70 transition-colors cursor-pointer flex items-center gap-1.5"
              title="24/7 Customer Support & Help Desk"
            >
              <Headphones className="w-3.5 h-3.5 text-[#A44101]" />
              <span>Customer Support</span>
            </button>
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
                      Browse All Categories ({navCategories.length})
                    </h3>
                  </div>

                  {/* Complete Category List with Expandable Subcategories */}
                  <div className="space-y-1.5">
                    {navCategories.map((cat) => {
                      const IconComp = cat.icon;
                      const isCatActive = activeCategoryTab === cat.id;
                      const isExpanded = !!expandedMobileCats[cat.id];
                      return (
                        <div key={cat.id} className="rounded-xl overflow-hidden border border-slate-200/80 bg-white">
                          <div className={`w-full px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                            isCatActive ? 'bg-[#A44101]/10 text-[#A44101]' : 'hover:bg-slate-50 text-navy'
                          }`}>
                            <button
                              type="button"
                              onClick={() => handleCategorySelect(cat.id)}
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                            >
                              <IconComp className={`w-4 h-4 shrink-0 ${isCatActive ? 'text-[#A44101]' : 'text-slate-600'}`} />
                              <span className="truncate">{cat.name}</span>
                            </button>
                            {cat.subcategories && cat.subcategories.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedMobileCats((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                                className="p-1 hover:bg-slate-200/50 rounded text-slate-400 hover:text-navy cursor-pointer ml-1"
                                aria-label={`Toggle ${cat.name} subcategories`}
                              >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#A44101]' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* Expanded subcategories list */}
                          {isExpanded && cat.subcategories && (
                            <div className="px-3 pb-2 pt-1 bg-slate-50/70 border-t border-slate-100 space-y-1">
                              {cat.subcategories.map((sub, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleCategorySelect(cat.id, sub)}
                                  className="w-full text-left px-2 py-1 rounded text-[11px] font-medium text-slate-600 hover:text-[#A44101] hover:bg-white flex items-center justify-between cursor-pointer"
                                >
                                  <span>{sub}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-300" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                      href="/profile"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        handleAccountClick();
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-theme hover:bg-stone-200/60 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-500" />
                      <span>{isCustomerLoggedIn ? 'My Orders & Profile' : 'Sign In / Register'}</span>
                    </a>
                    <a
                      href="/wishlist"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (onGoToWishlist) onGoToWishlist();
                        else {
                          window.history.pushState(null, '', '/wishlist');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }
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
                    <a
                      href="/contact"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (onGoToContact) onGoToContact();
                        else {
                          window.history.pushState(null, '', '/contact');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-theme hover:bg-stone-200/60 text-navy font-semibold cursor-pointer"
                    >
                      <Headphones className="w-4 h-4 text-[#A44101]" />
                      <span>Customer Support &amp; Help Desk</span>
                    </a>
                    <a
                      href="/admin/dashboard"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsMobileMenuOpen(false);
                        if (onGoToAdmin) onGoToAdmin();
                        else {
                          window.history.pushState(null, '', '/admin/dashboard');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-theme hover:bg-amber-100/60 text-amber-900 font-bold cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#A44101]" />
                      <span>Admin Management Portal</span>
                    </a>
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
