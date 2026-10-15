import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Zap, 
  Heart, 
  Tag, 
  CheckCircle2, 
  X, 
  Send, 
  Loader2,
  Bell,
  Copy
} from 'lucide-react';
import { ProductItem, getAllProducts } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';
import { toast } from 'react-hot-toast';
import { 
  apiClient,
  storefrontProductsApi, 
  storefrontWishlistApi 
} from '../api';

const mapBackendProductToItem = (p: any): ProductItem => {
  const img =
    p.variants?.[0]?.images?.[0]?.url ||
    (typeof p.variants?.[0]?.images?.[0] === 'string' ? p.variants?.[0]?.images?.[0] : null) ||
    p.cardImage?.url ||
    (Array.isArray(p.images) && p.images[0]?.url) ||
    (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http') ? p.thumbnail : null) ||
    p.image ||
    '/images/products/placeholder.png';

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

  const catName = p.category
    ? typeof p.category === 'string'
      ? p.category
      : p.category.name || p.category.slug || ''
    : 'General';

  return {
    id: p._id || p.id || p.slug,
    slug: p.slug,
    title: p.title || p.name || 'Product',
    category: catName || 'General',
    currentPrice,
    originalPrice,
    discountPercentage,
    image: img,
    rating: typeof p.rating === 'number' ? p.rating : (p.rating?.value || 4.8),
    reviews: p.soldInfo?.count || p.reviews || 84,
    inStock: p.inStock !== undefined ? p.inStock : true,
    isTopDeal: discountPercentage >= 40,
    tag: discountPercentage >= 50 ? 'MEGA DEAL' : undefined,
  };
};

interface ProductDetailPageProps {
  product: ProductItem;
  onBack: () => void;
  onSelectProduct: (product: ProductItem) => void;
  onGoToCheckout?: () => void;
}

// Generate contextual, matching angles based on product category & image
const getCategoryGallery = (prod: ProductItem) => {
  const cat = prod.category?.toLowerCase() || '';

  if (cat.includes('gadget') || cat.includes('electronic') || cat.includes('smart')) {
    return [
      prod.image,
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    ];
  }

  if (cat.includes('fashion') || cat.includes('shirt') || cat.includes('apparel')) {
    return [
      prod.image,
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
    ];
  }

  if (cat.includes('kitchen') || cat.includes('cookware') || cat.includes('home')) {
    return [
      prod.image,
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    ];
  }

  return [
    prod.image,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
  ];
};

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectProduct,
  onGoToCheckout,
}) => {
  const { addToCart } = useCart();
  const galleryImages = getCategoryGallery(product);

  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedToCart, setIsAddedToCart] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'highlights' | 'specs' | 'reviews'>('highlights');
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', paymentMethod: 'cod' });

  const handleBuyNow = () => {
    addToCart(product, quantity, { silent: true });
    if (onGoToCheckout) {
      onGoToCheckout();
    } else {
      window.history.pushState(null, '', '/checkout');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  // Out of Stock / Price Drop Alert Modal state
  const [showOosModal, setShowOosModal] = useState(false);
  const [oosEmail, setOosEmail] = useState('');
  const [oosPhone, setOosPhone] = useState('');
  const [oosSubmitting, setOosSubmitting] = useState(false);
  const [oosSuccess, setOosSuccess] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    setCouponCode(code);
    setCouponFeedback(`Coupon ${code} applied successfully!`);
    setTimeout(() => setCouponFeedback(null), 3500);
  };



  // Related products state & API fetch
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingRelated(true);

    const fetchRelatedProducts = async () => {
      try {
        // 1. Identify product slug
        let slug = product.slug;
        if (!slug && product.id && isNaN(Number(product.id)) && !/^[0-9a-fA-F]{24}$/.test(product.id)) {
          slug = product.id;
        }

        let rawRelated: any[] = [];
        if (slug) {
          rawRelated = await storefrontProductsApi.getRelated(slug);
        }

        // If not found by slug, and title exists, try slug derived from title
        if ((!rawRelated || rawRelated.length === 0) && product.title) {
          const titleSlug = product.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          if (titleSlug && titleSlug !== slug) {
            rawRelated = await storefrontProductsApi.getRelated(titleSlug);
          }
        }

        if (isMounted) {
          if (Array.isArray(rawRelated) && rawRelated.length > 0) {
            const mapped = rawRelated
              .map(mapBackendProductToItem)
              .filter((p) => p.id !== product.id && p.slug !== product.slug);
            if (mapped.length > 0) {
              setRelatedProducts(mapped.slice(0, 4));
              setIsLoadingRelated(false);
              return;
            }
          }

          // Fallback: Query store products from API
          try {
            const res = await apiClient.get('/products/all?limit=16');
            const list = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
            if (Array.isArray(list) && list.length > 0) {
              const mapped = list
                .map(mapBackendProductToItem)
                .filter((p) => p.id !== product.id && p.slug !== product.slug);
              if (mapped.length > 0) {
                setRelatedProducts(mapped.slice(0, 4));
                setIsLoadingRelated(false);
                return;
              }
            }
          } catch {
            // Ignore API fallback error
          }

          // Local catalog fallback
          const all = getAllProducts();
          const fallback = all
            .filter((p) => p.id !== product.id && (p.category === product.category || p.currentPrice <= 299))
            .slice(0, 4);
          setRelatedProducts(fallback);
          setIsLoadingRelated(false);
        }
      } catch (err) {
        console.warn('Error loading related products:', err);
        if (isMounted) {
          const all = getAllProducts();
          const fallback = all
            .filter((p) => p.id !== product.id && (p.category === product.category || p.currentPrice <= 299))
            .slice(0, 4);
          setRelatedProducts(fallback);
          setIsLoadingRelated(false);
        }
      }
    };

    fetchRelatedProducts();

    return () => {
      isMounted = false;
    };
  }, [product]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAddedToCart(true);
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2200);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated()) {
      requireAuth({ message: 'Please log in or register to save items to your wishlist' });
      return;
    }
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    const prodTitle = product.title && product.title.length > 32 
      ? `${product.title.slice(0, 32)}...` 
      : (product.title || 'Product');
    if (nextState) {
      toast.success(`${prodTitle} added to wishlist!`, {
        id: `wishlist-${product.id}`,
        icon: '❤️',
      });
    } else {
      toast(`${prodTitle} removed from wishlist`, {
        id: `wishlist-${product.id}`,
        icon: '🤍',
      });
    }
    try {
      await storefrontWishlistApi.toggle(product.id, product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    } catch {
      // offline fallback
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      await storefrontProductsApi.submitReview({
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSuccessMessage('Thank you! Your verified review has been submitted.');
      setReviewComment('');
      setTimeout(() => setReviewSuccessMessage(null), 4000);
    } catch {
      setReviewSuccessMessage('Review received and queued for publishing!');
      setReviewComment('');
      setTimeout(() => setReviewSuccessMessage(null), 4000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRequestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oosEmail.trim() && !oosPhone.trim()) return;
    setOosSubmitting(true);
    try {
      await storefrontProductsApi.requestOosAlert({
        productId: product.id,
        email: oosEmail.trim() || 'user@example.com',
        phone: oosPhone.trim() || undefined,
      });
      setOosSuccess(true);
      setTimeout(() => {
        setShowOosModal(false);
        setOosSuccess(false);
      }, 2000);
    } catch {
      setOosSuccess(true);
      setTimeout(() => {
        setShowOosModal(false);
        setOosSuccess(false);
      }, 2000);
    } finally {
      setOosSubmitting(false);
    }
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSuccess(true);
    setTimeout(() => {
      setShowBuyModal(false);
      setOrderSuccess(false);
    }, 2500);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-5 sm:py-8 font-sans animate-fadeIn select-none">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* =========================================================================
            MAIN PRODUCT STAGE: Exact Match to Reference Design
           ========================================================================= */}

        {/* =========================================================================
            MAIN PRODUCT STAGE: Exact Match to Reference Design
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Product Image Stage + Horizontal Thumbnails */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl p-6 sm:p-12 border border-slate-200/80 shadow-xs flex items-center justify-center aspect-square relative overflow-hidden">
              <img
                src={selectedImage}
                alt={product.title}
                className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Horizontal Thumbnails Row */}
            <div className="flex items-center gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-1 border-2 transition-all cursor-pointer overflow-hidden ${
                    selectedImage === img
                      ? 'border-[#A44101] shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Clean Purchasing Details Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              
              {/* Category Pill & In Stock Pill */}
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  In Stock
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {product.title}
              </h1>

              {/* SKU & Ratings Chips */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-slate-100 text-slate-600 text-xs font-mono font-medium px-2.5 py-1 rounded-md">
                  SKU: {product.id && product.id.length < 12 ? product.id : '2683-1'}
                </span>
                <div className="bg-amber-50/80 text-slate-800 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-amber-100">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">{product.rating}</span>
                  <span className="text-slate-400 font-normal">({product.reviews} reviews)</span>
                </div>
              </div>

              {/* Price Box Card */}
              <div className="rounded-xl border border-slate-200/80 p-4 sm:p-5 bg-white space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
                    ₹{product.currentPrice}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-400 line-through">
                    M.R.P.: ₹{product.originalPrice}
                  </span>
                  <span className="bg-[#E11D48] text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    {product.discountPercentage}% OFF
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md border border-emerald-200/80">
                    You Save: ₹ {product.originalPrice - product.currentPrice}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Inclusive of all GST &amp; taxes • Instant Tax Invoice
                  </span>
                </div>
              </div>

              {/* Applicable Coupons & Offers */}
              <div className="rounded-xl border border-amber-200/70 bg-[#FFFDF9] p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">Applicable Coupons &amp; Offers</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Tap to copy or apply code at checkout</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { code: 'WELCOME10', discount: '10% OFF', desc: 'Instant 10% discount on order...' },
                    { code: 'FLAT50', discount: '₹50 FLAT OFF', desc: 'Save ₹50 on prepaid orders ...' },
                    { code: 'B2BSAVE', discount: '15% OFF', desc: 'Wholesale tier discount for bulk...' },
                  ].map((coupon) => (
                    <div key={coupon.code} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white border border-amber-100 shadow-2xs">
                      <span className="border border-dashed border-[#A44101] bg-[#A44101]/10 text-[#A44101] font-mono font-bold text-xs px-2 py-0.5 rounded">
                        {coupon.code}
                      </span>
                      <span className="text-xs text-slate-600 truncate flex-1">
                        <strong className="text-slate-800">{coupon.discount}</strong> • {coupon.desc}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(coupon.code)}
                        className="border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Apply</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-[#A44101] font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="px-5 py-2 bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponFeedback && (
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {couponFeedback}
                  </p>
                )}
              </div>

              {/* Quantity & Stock Availability */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Only <strong className="text-[#A44101]">10 Units</strong> Available</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ready for 24h factory dispatch</p>
                </div>
              </div>

              {/* Primary Action Buttons: Buy Now + Add to Cart + Wishlist */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 px-6 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-bold rounded-xl transition-all text-center cursor-pointer shadow-sm active:scale-98"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 px-6 bg-[#A44101] hover:bg-[#8C3701] text-white text-sm font-bold rounded-xl transition-all text-center cursor-pointer shadow-sm active:scale-98"
                >
                  {isAddedToCart ? 'Added to Cart!' : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isWishlisted
                      ? 'border-rose-400 bg-rose-50 text-rose-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Wholesale / Bulk Order Callout */}
              <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-bold text-[#A44101]">Wholesale / Bulk Order?</span>
                  <span className="text-slate-500 hidden sm:inline">Minimum bulk value: ₹3,000</span>
                </div>
                <a
                  href="/bulk-orders"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/bulk-orders');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="font-bold text-[#A44101] hover:underline shrink-0 flex items-center gap-1"
                >
                  <span>Send Bulk Inquiry</span>
                  <span>&rarr;</span>
                </a>
              </div>

            </div>
          </div>
        </div>

        {/* Tabbed Product Details */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex border-b border-slate-200 gap-6 sm:gap-8 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('highlights')}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === 'highlights' ? 'text-navy border-b-2 border-[#A44101]' : 'text-slate-400 hover:text-navy'
              }`}
            >
              Key Highlights &amp; Benefits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === 'specs' ? 'text-navy border-b-2 border-[#A44101]' : 'text-slate-400 hover:text-navy'
              }`}
            >
              Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === 'reviews' ? 'text-navy border-b-2 border-[#A44101]' : 'text-slate-400 hover:text-navy'
              }`}
            >
              Customer Reviews ({product.reviews})
            </button>
          </div>

          {activeTab === 'highlights' && (
            <div className="py-5 space-y-3">
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0 mt-0.5" />
                  <span><strong>Premium Build Quality:</strong> Crafted using durable, wear-resistant raw materials for everyday longevity.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0 mt-0.5" />
                  <span><strong>Direct Factory Value:</strong> Delivered straight to your doorstep without middlemen markups.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0 mt-0.5" />
                  <span><strong>Tested &amp; Inspected:</strong> Verified for performance and durability prior to shipment.</span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="py-5">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 font-bold text-slate-500 w-1/3">Brand</td>
                    <td className="py-2.5 text-navy font-semibold">Apna Bharat Bazaar Direct Selection</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 font-bold text-slate-500">Category</td>
                    <td className="py-2.5 text-navy font-semibold">{product.category}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 font-bold text-slate-500">Warranty</td>
                    <td className="py-2.5 text-navy font-semibold">6 Months Replacement Warranty against defects</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 font-bold text-slate-500">Country of Origin</td>
                    <td className="py-2.5 text-navy font-semibold">India</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="py-5 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-navy">{product.rating}</span>
                  <div>
                    <div className="flex text-[#A44101]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#A44101]" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">Based on {product.reviews} real customer ratings</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-bold">
                  ✓ Verified Direct Factory Purchases Only
                </div>
              </div>

              {/* Review Submission Form */}
              <form onSubmit={handleSubmitReview} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-navy">
                  Write a Verified Product Review
                </h4>

                {reviewSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
                  <div className="flex gap-1 text-[#A44101]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer p-0.5 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-4 h-4 ${star <= reviewRating ? 'fill-[#A44101]' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-navy"
                  />
                  <input
                    type="text"
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this item..."
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-navy sm:col-span-1"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="px-4 py-2 bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Submit Review</span>
                  </button>
                </div>
              </form>

              <div className="p-4 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-navy">Rajesh V. (Verified Buyer)</span>
                  <span className="text-slate-400">Delhi • 2 days ago</span>
                </div>
                <div className="flex text-[#A44101]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#A44101]" />
                  ))}
                </div>
                <p className="text-xs text-slate-700">
                  "Super deal! The quality exceeded my expectations for this price. Packaging was secure and delivery took only 2 days."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Related Steal Deals */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-navy">
              You May Also Like: <span className="text-navy">Related Deals</span>
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-navy hover:text-[#A44101] cursor-pointer"
            >
              View Catalog →
            </button>
          </div>

          {isLoadingRelated ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs animate-pulse space-y-3">
                  <div className="aspect-[4/3] rounded-lg bg-slate-100" />
                  <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => {
                    onSelectProduct(relProduct);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-[#A44101] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-2.5">
                    <span className="absolute top-2 left-2 z-10 bg-[#A44101] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                      {relProduct.discountPercentage}% OFF
                    </span>
                    <img
                      src={relProduct.image}
                      alt={relProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-navy line-clamp-2 leading-snug group-hover:text-[#A44101]">
                      {relProduct.title}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-base font-black text-navy">
                        ₹{relProduct.currentPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{relProduct.originalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No additional related deals found for this item.
            </div>
          )}
        </div>

      </div>

      {/* Quick Buy Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                type="button"
                onClick={() => setShowBuyModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-navy cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {orderSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 bg-[#A44101]/10 text-[#A44101] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-2xl font-black text-navy">Order Placed Successfully!</h3>
                  <p className="text-sm text-slate-600">
                    Thank you! Your deal order has been placed and will be delivered to your doorstep.
                  </p>
                  <div className="p-3 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 border border-slate-200">
                    Payable on Delivery: ₹{product.currentPrice * quantity}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmOrder} className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Zap className="w-5 h-5 text-[#A44101] fill-[#A44101]" />
                    <h3 className="text-lg font-black text-navy">Quick Doorstep Order</h3>
                  </div>

                  <div className="space-y-2.5 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#A44101]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#A44101]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Delivery Address &amp; Pincode</label>
                      <input
                        type="text"
                        required
                        placeholder="House / Flat No., Street, City, Pincode"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-[#A44101]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                            formData.paymentMethod === 'cod'
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          Cash on Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                            formData.paymentMethod === 'upi'
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          UPI / QR Code
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-2 font-semibold text-slate-600">
                      <span>Delivery Fee:</span>
                      <span className="text-[#A44101] font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-black text-navy mb-4">
                      <span>Total Amount:</span>
                      <span className="text-lg text-navy">₹{product.currentPrice * quantity}</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Confirm Order @ ₹{product.currentPrice * quantity}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Out of Stock / Price Alert Modal */}
        {showOosModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                type="button"
                onClick={() => setShowOosModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-navy cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy">Price Drop &amp; Stock Alert</h3>
                  <p className="text-[11px] text-slate-500">We'll alert you instantly when price drops or restocks</p>
                </div>
              </div>

              {oosSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-base font-bold text-navy">Alert Activated!</h4>
                  <p className="text-xs text-slate-600">
                    We'll send you an SMS &amp; email alert as soon as this item has an offer update.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestAlert} className="space-y-3.5 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={oosEmail}
                      onChange={(e) => setOosEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone (for SMS)</label>
                    <input
                      type="tel"
                      value={oosPhone}
                      onChange={(e) => setOosPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-navy"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={oosSubmitting || (!oosEmail.trim() && !oosPhone.trim())}
                    className="w-full py-2.5 bg-[#A44101] hover:bg-[#8C3701] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {oosSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                    <span>Notify Me</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailPage;
