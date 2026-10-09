import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  ArrowRight, 
  Star, 
  ShoppingCart, 
  Check, 
  Zap, 
  Sparkles, 
  ChefHat, 
  Smartphone, 
  Shirt, 
  Sparkle,
  Dumbbell,
  Car,
  PackageCheck,
  BookOpen,
  Baby,
  Plane,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CATEGORY_SECTIONS_DATA, CategorySectionInfo, ProductItem, CATEGORY_SUBCATEGORIES } from '../data/storeData';
import { useCart } from '../context/CartContext';

interface CategoryShowcaseSectionsProps {
  onProductClick?: (product: ProductItem) => void;
  onCategoryClick?: (categoryId: string, subcategory?: string) => void;
  insertElement?: React.ReactNode;
  insertAfterIndex?: number;
}

export const CategoryShowcaseSections: React.FC<CategoryShowcaseSectionsProps> = ({ 
  onProductClick,
  onCategoryClick,
  insertElement,
  insertAfterIndex = 2
}) => {
  const { addToCart } = useCart();
  const [addedItemIds, setAddedItemIds] = useState<{ [key: string]: boolean }>({});
  const shouldReduceMotion = useReducedMotion();

  const handleAddToCart = (product: ProductItem) => {
    addToCart(product);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'home-kitchen':
        return <ChefHat className="w-5 h-5 text-[#A44101]" />;
      case 'smart-life-gadget':
        return <Smartphone className="w-5 h-5 text-[#A44101]" />;
      case 'fashion-world':
        return <Shirt className="w-5 h-5 text-[#A44101]" />;
      case 'cleaning-housekeeping':
        return <Sparkle className="w-5 h-5 text-[#A44101]" />;
      case 'sports-fitness':
        return <Dumbbell className="w-5 h-5 text-[#A44101]" />;
      case 'car-accessories':
        return <Car className="w-5 h-5 text-[#A44101]" />;
      case 'mix-item':
        return <PackageCheck className="w-5 h-5 text-[#A44101]" />;
      case 'stationary':
        return <BookOpen className="w-5 h-5 text-[#A44101]" />;
      case 'baby-items':
        return <Baby className="w-5 h-5 text-[#A44101]" />;
      case 'tours-travels':
        return <Plane className="w-5 h-5 text-[#A44101]" />;
      case 'beauty-personal-care':
        return <Sparkles className="w-5 h-5 text-[#A44101]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#A44101]" />;
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 py-4 sm:py-6">
      {/* Render Individual Section per Category */}
      {CATEGORY_SECTIONS_DATA.map((section: CategorySectionInfo, index: number) => (
        <React.Fragment key={section.id}>
          <CategoryShowcaseRow
            section={section}
            onProductClick={onProductClick}
            onCategoryClick={onCategoryClick}
            addedItemIds={addedItemIds}
            onAddToCart={handleAddToCart}
            getCategoryIcon={getCategoryIcon}
            shouldReduceMotion={shouldReduceMotion}
          />
          {insertElement && index === insertAfterIndex && (
            <div className="pt-2">
              {insertElement}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface CategoryShowcaseRowProps {
  section: CategorySectionInfo;
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

  // Automatically scroll 1 product to the right every 3.2 seconds (pauses on hover or touch)
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
              {section.name}: <span className="text-blue-800 font-semibold">Deals</span>
            </h2>
            <p className="text-xs sm:text-sm text-mutedGray mt-1 max-w-2xl font-normal">
              {section.tagline}
            </p>

            {/* Department Subcategories Quick Chips */}
            {CATEGORY_SUBCATEGORIES[section.id] && CATEGORY_SUBCATEGORIES[section.id].length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {CATEGORY_SUBCATEGORIES[section.id].map((sub, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => onCategoryClick?.(section.id, sub)}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-[#A44101]/10 text-slate-700 hover:text-[#A44101] border border-slate-200/80 transition-all cursor-pointer"
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Showcase Container: Category Image Card on LEFT + Products Scroll Slider on RIGHT */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-stretch">
          
          {/* LEFT: Category Banner / Image Spotlight Card */}
          <div className="w-full lg:w-64 xl:w-72 shrink-0 flex">
            <motion.div
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full min-h-[280px] sm:min-h-[320px] lg:min-h-full rounded-theme overflow-hidden border border-slate-200 shadow-soft group flex flex-col justify-between p-5 text-white"
            >
              {/* Background Category Image */}
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-navy text-[11px] font-black uppercase tracking-wider shadow-sm">
                  {getCategoryIcon(section.id)}
                  <span>{section.badge}</span>
                </span>
                <span className="bg-[#A44101] text-white text-[11px] font-black px-2 py-0.5 rounded shadow-sm">
                  {section.bannerDiscount}
                </span>
              </div>

              {/* Bottom Details & Button */}
              <div className="relative z-10 space-y-2 mt-auto pt-16">
                <span className="text-[#A44101] text-[11px] font-black tracking-wider uppercase">
                  Explore Category
                </span>
                <h3 className="text-xl sm:text-2xl font-medium text-white leading-tight font-roboto">
                  {section.name}
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed capitalize">
                  {section.tagline}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (onCategoryClick) {
                      onCategoryClick(section.id);
                    } else {
                      document.querySelector('.section-top-categories')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 mt-2 px-4 py-2.5 rounded-theme bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-extrabold transition-all shadow-md group/btn w-full justify-center active:scale-98 cursor-pointer"
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
            
            {/* Floating Left Arrow (Always visible & interactive) */}
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
              {section.products.map((product: ProductItem, prodIdx: number) => {
                const isAdded = !!addedItemIds[product.id];

                return (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: shouldReduceMotion ? 0 : prodIdx * 0.05, duration: 0.3 }}
                    onClick={() => onProductClick?.(product)}
                    className="w-[200px] sm:w-[220px] lg:w-[calc((100%-3*12px)/4)] xl:w-[calc((100%-4*14px)/5)] min-w-[190px] xl:min-w-[205px] shrink-0 bg-white rounded-theme border border-slate-200 shadow-soft hover:shadow-soft-hover hover:border-[#A44101]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                  >
                    {/* Product Visual with High-Res Photography */}
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
                        loading="lazy"
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
                              onProductClick?.(product);
                            }}
                            className="py-1.5 px-1.5 sm:px-2 rounded-theme text-[11px] sm:text-xs font-extrabold bg-[#A44101] hover:bg-[#8C3701] text-white text-center flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-98"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {/* Floating Right Arrow (Always visible & interactive) */}
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
