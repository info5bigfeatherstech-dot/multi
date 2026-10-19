import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ArrowRight, 
  Star, 
  ShoppingCart, 
  Check, 
  Zap, 
  Smartphone, 
  Gift, 
  Home, 
  Palette, 
  Sparkles, 
  ChefHat, 
  BookOpen, 
  Plane, 
  Dumbbell, 
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProductItem, getAllProducts } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { apiClient } from '../api';
import { isProductActive } from '../utils/productUtils';

export interface CategorySectionDefinition {
  id: string;
  name: string;
  headline: string;
  tagline: string;
  badge: string;
  bannerDiscount: string;
  defaultImage: string;
  slugs: string[];
  keywords: string[];
}

export const CANONICAL_11_CATEGORIES: CategorySectionDefinition[] = [
  {
    id: 'electronics-and-gadgets',
    name: 'Electronics & Gadgets',
    headline: 'Smart Life Gadgets, Audio & Fast Charging',
    tagline: 'Bluetooth speakers, tower audio, smart gadgets & fast charging accessories',
    badge: 'BESTSELLER TECH',
    bannerDiscount: 'UP TO 65% OFF',
    defaultImage: 'https://res.cloudinary.com/wo5f58fu/image/upload/v1790061569/categories/cards/electronics-and-gadgets-card-6ab20435a4ded8a3ec745887-1790061565303.webp',
    slugs: ['electronics-and-gadgets', 'smart-life-gadgets'],
    keywords: ['speaker', 'bluetooth', 'cable', 'charger', 'usb', 'smart', 'watch', 'earphone', 'headphone', 'audio', 'torch', 'light', 'led'],
  },
  {
    id: 'gifts-and-lifestyle',
    name: 'Gifts & Lifestyle',
    headline: 'Curated Gifts & Lifestyle Accessories',
    tagline: 'Novelty gifts, keychains, party accessories & lifestyle essentials',
    badge: 'POPULAR GIFTS',
    bannerDiscount: 'UP TO 60% OFF',
    defaultImage: 'https://pub-b2f1be61e9c24db698b3c80da875965b.r2.dev/products/2026/07/love-pearl-chain-necklace-v-2633-1-img-0-1784529134136.webp',
    slugs: ['gifts-and-lifestyle', 'gifts'],
    keywords: ['gift', 'lifestyle', 'props', 'wallet', 'keychain', 'party', 'birthday'],
  },
  {
    id: 'home-and-living',
    name: 'Home & Living',
    headline: 'Home Essentials, Cleaning & Storage',
    tagline: 'Organizers, cleaning brushes, mops & daily household utilities',
    badge: 'DAILY ESSENTIALS',
    bannerDiscount: 'UP TO 70% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873051/products/zip-color-naphthalene-balls-2929-1-i0-1788873050768.webp',
    slugs: ['home-and-living', 'cleaning-and-housekeeping-supplies', 'home-improvement'],
    keywords: ['cleaning', 'brush', 'mop', 'storage', 'bathroom', 'wardrobe', 'cloth', 'dust', 'rack', 'hanger', 'tape', 'glue'],
  },
  {
    id: 'home-decor',
    name: 'Home Decor',
    headline: 'Interior Decor, Lighting & Accents',
    tagline: 'Ambient lights, wireless stick lamps, showpieces & decorative accents',
    badge: 'TRENDING DECOR',
    bannerDiscount: 'FLAT 50% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873051/products/zip-color-naphthalene-balls-2929-1-i0-1788873050768.webp',
    slugs: ['home-decor'],
    keywords: ['decor', 'light', 'lamp', 'motion', 'sensor', 'led', 'wall', 'frame', 'clock', 'showpiece', 'flower', 'vase'],
  },
  {
    id: 'jewellery-and-accessories',
    name: 'Jewellery & Accessories',
    headline: 'Fashion Accessories & Jewellery',
    tagline: 'Earrings, bracelets, trendy jewellery & style accessories',
    badge: 'FASHION PICKS',
    bannerDiscount: 'UP TO 75% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873024/products/zip-reusable-car-cleaning-gloves-2920-1-i0-1788873024777.webp',
    slugs: ['jewellery-and-accessories', 'fashion-world'],
    keywords: ['jewel', 'earring', 'ring', 'necklace', 'bracelet', 'bangle', 'hair', 'clip', 'fashion', 'accessory', 'silver'],
  },
  {
    id: 'kitchen-and-dining',
    name: 'Kitchen & Dining',
    headline: 'Cookware, Choppers & Food Storage',
    tagline: 'Choppers, tiffin boxes, containers, slicers & kitchen tools',
    badge: 'KITCHEN DHAMAKA',
    bannerDiscount: 'UP TO 70% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873047/products/zip-toothbrush-protector-cap-cover-2928-1-i0-1788873047623.webp',
    slugs: ['kitchen-and-dining', 'home-and-kitchen'],
    keywords: ['kitchen', 'chopper', 'cutter', 'cooker', 'tiffin', 'lunch', 'box', 'bottle', 'flask', 'pan', 'knife', 'spoon', 'cup', 'mug', 'peeler', 'masher', 'whisk'],
  },
  {
    id: 'stationery-office-and-school',
    name: 'Stationery, Office & School',
    headline: 'Office Supplies, Writing & School Tools',
    tagline: 'Diaries, pens, markers, desk organizers & school stationery',
    badge: 'STUDY & WORK',
    bannerDiscount: 'UP TO 55% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873009/products/zip-touch-soap-dispenser-for-kitchen-2915-1-i0-1788873009205.webp',
    slugs: ['stationery-office-and-school', 'stationary'],
    keywords: ['station', 'diary', 'notebook', 'pen', 'marker', 'pencil', 'pouch', 'desk', 'calculator', 'office', 'school'],
  },
  {
    id: 'travel-and-outdoor',
    name: 'Travel & Outdoor',
    headline: 'Travel Organizers & Car Accessories',
    tagline: 'Luggage organizers, car gadgets, travel pouches & outdoor utilities',
    badge: 'ON THE MOVE',
    bannerDiscount: 'UP TO 60% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873033/products/zip-toothbrush-case-pack-of-5-2923-1-i0-1788873033558.webp',
    slugs: ['travel-and-outdoor', 'tours-and-travels', 'car-accessories'],
    keywords: ['travel', 'tour', 'car', 'luggage', 'organizer', 'pouch', 'pillow', 'camping', 'cushion', 'trip'],
  },
  {
    id: 'sports-and-fitness',
    name: 'Sports & Fitness',
    headline: 'Fitness Gear & Workout Essentials',
    tagline: 'Resistance bands, knee supports, gym shakers & workout accessories',
    badge: 'FITNESS ESSENTIALS',
    bannerDiscount: 'UP TO 65% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1778499343/categories/sports-and-fitness-69b7990226573d44aced3a4a-1778499341777.webp',
    slugs: ['sports-and-fitness'],
    keywords: ['sport', 'fitness', 'gym', 'yoga', 'band', 'resistance', 'shaker', 'knee', 'wrist', 'exercise', 'workout'],
  },
  {
    id: 'beauty-and-personal-care',
    name: 'Beauty & Personal Care',
    headline: 'Personal Care, Grooming & Beauty',
    tagline: 'Trimmers, skincare tools, grooming kits & daily hygiene',
    badge: 'TOP GLOW',
    bannerDiscount: 'UP TO 70% OFF',
    defaultImage: 'https://pub-b2f1be61e9c24db698b3c80da875965b.r2.dev/categories/2026/06/beauty-and-personal-care-6a196ffad1c7c35896eaca75-1780309850852.webp',
    slugs: ['beauty-and-personal-care'],
    keywords: ['beauty', 'personal', 'care', 'skin', 'trimmer', 'shaver', 'hair', 'face', 'massager', 'hygiene', 'makeup'],
  },
  {
    id: 'mix-items',
    name: 'Mix Items',
    headline: 'Super Saver Bundles & Mix Lot Offers',
    tagline: 'Clearance bargains, multi-item packs & wholesale mixed assortment',
    badge: 'VALUE COMBOS',
    bannerDiscount: 'UP TO 80% OFF',
    defaultImage: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1778502352/categories/mix-items-1778502351223.webp',
    slugs: ['mix-items', 'baby-items'],
    keywords: ['mix', 'combo', 'pack', 'set', 'baby', 'assorted', 'bundle', 'wholesale', 'clearance'],
  },
];

interface CategoryShowcaseSectionsProps {
  onProductClick?: (product: ProductItem) => void;
  onCategoryClick?: (categoryId: string, subcategory?: string) => void;
  insertElement?: React.ReactNode;
  insertAfterIndex?: number;
}

export const CategoryShowcaseSections: React.FC<CategoryShowcaseSectionsProps> = ({ 
  onProductClick,
  onCategoryClick,
}) => {
  const { addToCart } = useCart();
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const shouldReduceMotion = useReducedMotion();
  const [apiProducts, setApiProducts] = useState<ProductItem[]>(() => getAllProducts());
  const [categoryImageMap, setCategoryImageMap] = useState<Record<string, string>>({});

  const handleAddToCart = (product: ProductItem) => {
    addToCart(product);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Fetch real backend products & categories on mount
  useEffect(() => {
    let isMounted = true;

    // Fetch categories to get official uploaded card/banner images
    apiClient.get('/categories')
      .then((res: any) => {
        if (!isMounted) return;
        const list = res.data?.categories || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(list)) {
          const map: Record<string, string> = {};
          list.forEach((c: any) => {
            const img = c.cardImage?.url || c.image?.url;
            if (img && c.slug) {
              map[c.slug] = img;
            }
          });
          setCategoryImageMap(map);
        }
      })
      .catch(() => {
        /* ignore error */
      });

    // Fetch products catalog with high limit to populate all categories
    apiClient.get('/products/all?limit=250')
      .then((res: any) => {
        if (!isMounted) return;
        const rawList = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(rawList)) {
          const mapped: ProductItem[] = [];

          rawList.forEach((p: any) => {
            if (!isProductActive(p)) return;
            // Find real product image - reject empty/dummy items
            const img = 
              p.variants?.[0]?.images?.[0]?.url ||
              (typeof p.variants?.[0]?.images?.[0] === 'string' ? p.variants?.[0]?.images?.[0] : null) ||
              p.cardImage?.url ||
              (Array.isArray(p.images) && p.images[0]?.url) ||
              (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http') ? p.thumbnail : null);

            // STRICT FILTER: Only show products with verified real images
            if (!img) return;

            const currentPrice = Number(
              p.minPrice || 
              p.variants?.[0]?.finalPrice || 
              p.variants?.[0]?.price?.current || 
              p.variants?.[0]?.price?.sale || 
              p.price || 
              99
            );
            const originalPrice = Number(
              p.variants?.[0]?.price?.base || 
              p.originalPrice || 
              Math.round(currentPrice * 1.6)
            );
            const discountPercentage = Number(
              p.maxDiscountPercentage || 
              p.variants?.[0]?.discountPercentage || 
              Math.max(10, Math.round(((originalPrice - currentPrice) / (originalPrice || 1)) * 100))
            );

            const catName = p.category ? (typeof p.category === 'string' ? p.category : p.category.name || p.category.slug || '') : '';

            mapped.push({
              id: p._id || p.id,
              slug: p.slug,
              title: p.title || p.name || 'Product',
              category: catName || 'General',
              currentPrice,
              originalPrice,
              discountPercentage,
              image: img,
              rating: 4.8,
              reviews: 120 + ((p.title?.length || 0) * 7) % 350,
              inStock: true,
              tag: discountPercentage >= 50 ? 'MEGA DEAL' : undefined,
              isTopDeal: discountPercentage >= 50,
            });
          });

          setApiProducts(mapped);
        }
      })
      .catch((err) => {
        console.warn('Failed to load real products for category sections:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Organize products into the 11 categories
  const sectionsData = useMemo(() => {
    return CANONICAL_11_CATEGORIES.map((def) => {
      // Find matching products
      const matched = apiProducts.filter((p) => {
        const catLower = (p.category || '').toLowerCase();
        const titleLower = (p.title || '').toLowerCase();

        // 1. Check slug matches
        const matchesSlug = def.slugs.some((s) => catLower.includes(s.replace(/-/g, ' ')) || catLower === s);
        if (matchesSlug) return true;

        // 2. Check title keyword matches
        const matchesKeyword = def.keywords.some((kw) => titleLower.includes(kw));
        return matchesKeyword;
      });

      // Use verified category card image or first product's real image
      const categoryCardImage = categoryImageMap[def.id] || (matched.length > 0 ? matched[0].image : def.defaultImage);

      return {
        ...def,
        image: categoryCardImage,
        products: matched,
      };
    }).filter((s) => s.products.length > 0);
  }, [apiProducts, categoryImageMap]);

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'electronics-and-gadgets':
        return <Smartphone className="w-5 h-5 text-[#A44101]" />;
      case 'gifts-and-lifestyle':
        return <Gift className="w-5 h-5 text-[#A44101]" />;
      case 'home-and-living':
        return <Home className="w-5 h-5 text-[#A44101]" />;
      case 'home-decor':
        return <Palette className="w-5 h-5 text-[#A44101]" />;
      case 'jewellery-and-accessories':
        return <Sparkles className="w-5 h-5 text-[#A44101]" />;
      case 'kitchen-and-dining':
        return <ChefHat className="w-5 h-5 text-[#A44101]" />;
      case 'stationery-office-and-school':
        return <BookOpen className="w-5 h-5 text-[#A44101]" />;
      case 'travel-and-outdoor':
        return <Plane className="w-5 h-5 text-[#A44101]" />;
      case 'sports-and-fitness':
        return <Dumbbell className="w-5 h-5 text-[#A44101]" />;
      case 'beauty-and-personal-care':
        return <Sparkles className="w-5 h-5 text-[#A44101]" />;
      case 'mix-items':
        return <Package className="w-5 h-5 text-[#A44101]" />;
      default:
        return <Package className="w-5 h-5 text-[#A44101]" />;
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-6">
      {sectionsData.map((section) => (
        <CategoryShowcaseRow
          key={section.id}
          section={section}
          onProductClick={onProductClick}
          onCategoryClick={onCategoryClick}
          addedItemIds={addedItemIds}
          onAddToCart={handleAddToCart}
          getCategoryIcon={getCategoryIcon}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}
    </div>
  );
};

interface CategoryShowcaseRowProps {
  section: {
    id: string;
    name: string;
    headline: string;
    tagline: string;
    badge: string;
    bannerDiscount: string;
    image: string;
    products: ProductItem[];
  };
  onProductClick?: (product: ProductItem) => void;
  onCategoryClick?: (categoryId: string, subcategory?: string) => void;
  addedItemIds: { [key: string]: boolean };
  onAddToCart: (product: ProductItem) => void;
  getCategoryIcon: (id: string) => React.ReactNode;
  shouldReduceMotion: boolean | null;
}

const CategoryShowcaseRow: React.FC<CategoryShowcaseRowProps> = ({
  section,
  onProductClick,
  onCategoryClick,
  addedItemIds,
  onAddToCart,
  getCategoryIcon,
  shouldReduceMotion,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setCanScrollLeft] = useState(false);
  const [, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [section.products]);

  // Compute exact width of a single product card + gap
  const getSingleProductWidth = () => {
    if (!scrollRef.current) return 260;
    const firstCard = scrollRef.current.firstElementChild as HTMLElement | null;
    if (firstCard) {
      const cardRect = firstCard.getBoundingClientRect();
      const gap = window.innerWidth >= 640 ? 16 : 12;
      return Math.round(cardRect.width + gap);
    }
    return 260;
  };

  // Scroll exactly one product to left or right with wrap-around
  const scrollOneProduct = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const cardStep = getSingleProductWidth();
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) return;

    if (direction === 'right') {
      if (scrollLeft >= maxScroll - 15) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: cardStep, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft <= 15) {
        scrollRef.current.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: -cardStep, behavior: 'smooth' });
      }
    }
    setTimeout(checkScroll, 350);
  };

  // Automatically scroll 1 product to the right every 3.2 seconds
  useEffect(() => {
    if (shouldReduceMotion || isHovered) return;

    const timer = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollWidth, clientWidth } = scrollRef.current;
      if (scrollWidth <= clientWidth + 10) return;

      scrollOneProduct('right');
    }, 3200);

    return () => clearInterval(timer);
  }, [isHovered, shouldReduceMotion, section.products]);

  return (
    <section
      className={`section-${section.id} py-8 sm:py-10 border-b border-slate-200 bg-white transition-colors`}
      aria-labelledby={`heading-${section.id}`}
    >
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Header Row with Controls */}
        <div className="flex flex-row items-end justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-navy text-xs font-bold mb-2 border border-slate-200">
              {getCategoryIcon(section.id)}
              <span className="uppercase tracking-wider">{section.badge}</span>
            </div>
            <h2
              id={`heading-${section.id}`}
              className="text-2xl sm:text-3xl lg:text-3xl font-medium text-navy tracking-tight font-roboto"
            >
              {section.name}: <span className="text-blue-800 font-semibold">Products</span>
            </h2>
            <p className="text-xs sm:text-sm text-mutedGray mt-1 max-w-2xl font-normal">
              {section.tagline}
            </p>
          </div>
        </div>

        {/* Showcase Container: Category Spotlight Card on LEFT + Products Scroll Slider on RIGHT */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch">
          
          {/* LEFT: Category Banner / Spotlight Card */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 flex">
            <motion.div
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full min-h-[300px] sm:min-h-[340px] lg:min-h-full rounded-theme overflow-hidden border border-slate-200/90 shadow-soft group flex flex-col justify-between p-5 sm:p-6 text-white"
            >
              {/* Category Image */}
              <img
                src={section.image}
                alt={section.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />

              {/* High contrast gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/60 to-slate-900/30 group-hover:from-slate-950 transition-colors" />

              {/* Top Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-navy text-[10px] font-extrabold uppercase tracking-wider shadow-sm whitespace-nowrap">
                  {getCategoryIcon(section.id)}
                  <span>{section.badge}</span>
                </span>
                <span className="bg-[#A44101] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                  {section.bannerDiscount}
                </span>
              </div>

              {/* Bottom Details & Button */}
              <div className="relative z-10 space-y-2 mt-auto pt-12">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/20 backdrop-blur-xs border border-amber-400/30">
                  <span className="text-amber-300 text-[10px] font-black tracking-widest uppercase">
                    Explore Category
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-roboto">
                  {section.name}
                </h3>
                <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed">
                  {section.tagline}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (onCategoryClick) {
                      onCategoryClick(section.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2.5 rounded-theme bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-extrabold transition-all shadow-md group/btn w-full justify-center active:scale-98 cursor-pointer"
                >
                  <span>View All {section.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Products Carousel with Floating Left & Right Arrows */}
          <div 
            className="flex-1 relative flex items-center min-w-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
          >
            
            {/* Floating Left Arrow */}
            <button
              type="button"
              onClick={() => scrollOneProduct('left')}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-[#A44101] text-navy hover:text-white border border-slate-300 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs"
              aria-label={`Scroll ${section.name} products left`}
              title="Previous product"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Horizontally Scrollable Products Row */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="w-full flex overflow-x-auto scroll-smooth gap-3 sm:gap-4 py-1 px-1 scrollbar-none select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {section.products.map((product: ProductItem) => {
                const isAdded = !!addedItemIds[product.id];

                return (
                  <article
                    key={product.id}
                    onClick={() => onProductClick?.(product)}
                    className="w-[200px] sm:w-[220px] lg:w-[calc((100%-3*12px)/4)] xl:w-[calc((100%-4*14px)/5)] min-w-[190px] xl:min-w-[205px] shrink-0 bg-white rounded-theme border border-slate-200 shadow-soft hover:shadow-soft-hover hover:border-[#A44101]/40 transition-all duration-200 flex flex-col justify-between overflow-hidden group cursor-pointer"
                  >
                    {/* Product Visual */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      
                      {/* Discount Sticker */}
                      <div className="absolute top-2 left-2 z-10 bg-[#A44101] text-white text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" />
                        <span>{product.discountPercentage}% OFF</span>
                      </div>

                      {/* Tag */}
                      {product.tag && (
                        <div className="absolute top-2 right-2 z-10 bg-navy text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
                          {product.tag}
                        </div>
                      )}

                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
                          <span className="font-extrabold text-[#A44101] uppercase tracking-wider text-[9px] sm:text-[10px]">
                            {product.category}
                          </span>
                          <div className="flex items-center gap-1 text-navy font-bold">
                            <Star className="w-3 h-3 fill-[#A44101] text-[#A44101]" />
                            <span>{product.rating}</span>
                            <span className="text-slate-400 font-normal">({product.reviews})</span>
                          </div>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-charcoal line-clamp-2 leading-snug group-hover:text-[#A44101] transition-colors">
                          {product.title}
                        </h3>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-2.5 mt-2.5 border-t border-slate-100">
                        <div className="flex items-baseline justify-between mb-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-lg font-black text-navy">
                              ₹{product.currentPrice}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              ₹{product.originalPrice}
                            </span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
                            Save ₹{product.originalPrice - product.currentPrice}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                            className={`py-1.5 px-1.5 sm:px-2 rounded-theme text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              isAdded
                                ? 'bg-navy text-white border-navy'
                                : 'bg-white hover:bg-slate-50 text-navy border-slate-300 hover:border-[#A44101] shadow-xs'
                            }`}
                            aria-label={`Add ${product.title} to cart`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span className="text-white">Added</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5 text-navy" />
                                <span className="text-navy font-bold">Cart</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                              window.history.pushState(null, '', '/checkout');
                              window.dispatchEvent(new PopStateEvent('popstate'));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="py-1.5 px-1.5 sm:px-2 rounded-theme text-[11px] sm:text-xs font-extrabold bg-[#A44101] hover:bg-[#8C3701] text-white text-center flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-98"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Floating Right Arrow */}
            <button
              type="button"
              onClick={() => scrollOneProduct('right')}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white hover:bg-[#A44101] text-navy hover:text-white border border-slate-300 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs"
              aria-label={`Scroll ${section.name} products right`}
              title="Next product"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

          </div>
        </div>

      </div>
    </section>
  );
};
