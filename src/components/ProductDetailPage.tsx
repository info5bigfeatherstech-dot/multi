import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Copy,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProductItem, getAllProducts } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';
import { toast } from 'react-hot-toast';
import { 
  apiClient,
  storefrontProductsApi, 
  storefrontWishlistApi,
  adminCouponsApi,
  storefrontCheckoutApi
} from '../api';

const mapBackendProductToItem = (p: any): ProductItem => {
  const img =
    p.variants?.[0]?.images?.[0]?.url ||
    (typeof p.variants?.[0]?.images?.[0] === 'string' ? p.variants?.[0]?.images?.[0] : null) ||
    p.cardImage?.url ||
    (Array.isArray(p.images) && p.images[0]?.url) ||
    (typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http') ? p.thumbnail : null) ||
    p.image ||
    p.category?.cardImage?.url ||
    p.category?.image?.url ||
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80';

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
    reviews: p.rating?.count || p.soldInfo?.count || 142,
    inStock: p.inStock !== undefined ? p.inStock : true,
    isTopDeal: discountPercentage >= 40,
    tag: p.appliedTags?.[0] || (discountPercentage >= 50 ? 'MEGA DEAL' : undefined),
  };
};

interface ProductDetailPageProps {
  product: ProductItem;
  onBack: () => void;
  onSelectProduct: (product: ProductItem) => void;
  onGoToCheckout?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectProduct,
  onGoToCheckout,
}) => {
  const { addToCart } = useCart();
  const [productImages, setProductImages] = useState<string[]>([product.image]);
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [isHoveredGallery, setIsHoveredGallery] = useState<boolean>(false);

  // Zoom Vision Lens State
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, lensX: 0, lensY: 0 });
  const imageStageRef = useRef<HTMLDivElement>(null);

  const LENS_SIZE = 150; // px
  const ZOOM_LEVEL = 2.4; // magnification scale

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageStageRef.current) return;
    const rect = imageStageRef.current.getBoundingClientRect();

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const halfLens = LENS_SIZE / 2;
    const lensX = Math.max(0, Math.min(rect.width - LENS_SIZE, clientX - halfLens));
    const lensY = Math.max(0, Math.min(rect.height - LENS_SIZE, clientY - halfLens));

    const percentX = (lensX / Math.max(1, rect.width - LENS_SIZE)) * 100;
    const percentY = (lensY / Math.max(1, rect.height - LENS_SIZE)) * 100;

    setZoomPos({
      x: percentX,
      y: percentY,
      lensX,
      lensY,
    });
  };
  // Automatically change the picture to next picture in place without scrolling
  useEffect(() => {
    if (productImages.length <= 1 || isHoveredGallery) return;

    const timer = setInterval(() => {
      setSelectedImage((current) => {
        const currentIndex = productImages.indexOf(current);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % productImages.length : 0;
        return productImages[nextIndex];
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [productImages, isHoveredGallery]);

  const handlePrevImage = () => {
    const currentIndex = productImages.indexOf(selectedImage);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : productImages.length - 1;
    setSelectedImage(productImages[prevIndex]);
  };

  const handleNextImage = () => {
    const currentIndex = productImages.indexOf(selectedImage);
    const nextIndex = (currentIndex + 1) % productImages.length;
    setSelectedImage(productImages[nextIndex]);
  };
  const [backendDetail, setBackendDetail] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedToCart, setIsAddedToCart] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'highlights' | 'specs' | 'reviews'>('highlights');
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', paymentMethod: 'cod' });

  const handleBuyNow = () => {
    addToCart(liveProduct, quantity, { silent: true });
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
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<any | null>(null);
  const [isLoadingMyReview, setIsLoadingMyReview] = useState(false);
  // Public review listing
  const [publicReviews, setPublicReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ averageRating: number | null; totalReviews: number; distribution: Record<string,number> }>({ averageRating: null, totalReviews: 0, distribution: {} });
  const [isLoadingPublicReviews, setIsLoadingPublicReviews] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [eligibility, setEligibility] = useState<{ isEligible: boolean; canReview: boolean; reason?: string } | null>(null);

  // Out of Stock / Price Drop Alert Modal state
  const [showOosModal, setShowOosModal] = useState(false);
  const [oosEmail, setOosEmail] = useState('');
  const [oosPhone, setOosPhone] = useState('');
  const [oosSubmitting, setOosSubmitting] = useState(false);
  const [oosSuccess, setOosSuccess] = useState(false);

  // Live Promotional Coupons from API
  interface StoreCoupon {
    code: string;
    name?: string;
    discount: string;
    desc: string;
    discountType: 'percentage' | 'fixed' | string;
    discountValue: number;
    minOrderValue?: number;
  }

  const [availableCoupons, setAvailableCoupons] = useState<StoreCoupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState<boolean>(true);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountText: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('abb_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch real active coupons from the backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCoupons(true);

    adminCouponsApi
      .getAll()
      .then((res: any) => {
        if (!isMounted) return;
        const rawList = Array.isArray(res) ? res : res?.coupons || res?.data || [];
        if (Array.isArray(rawList)) {
          const active = rawList
            .filter((c: any) => c.isActive !== false)
            .map((c: any) => {
              const isPct =
                c.discountType === 'percentage' ||
                String(c.discountType).toLowerCase().includes('percent');
              const discountLabel = isPct
                ? `${c.discountValue}% OFF`
                : `₹${c.discountValue} FLAT OFF`;
              const desc =
                c.description ||
                c.name ||
                (c.minOrderValue ? `Min order ₹${c.minOrderValue}` : 'Instant discount on order');
              return {
                code: c.code,
                name: c.name,
                discount: discountLabel,
                desc,
                discountType: c.discountType || (isPct ? 'percentage' : 'fixed'),
                discountValue: Number(c.discountValue || 0),
                minOrderValue: Number(c.minOrderValue || 0),
              };
            });

          if (active.length > 0) {
            setAvailableCoupons(active);
          } else {
            setAvailableCoupons([
              { code: 'BHARAT10', discount: '10% OFF', desc: 'Instant 10% discount on entire catalog', discountType: 'percentage', discountValue: 10, minOrderValue: 49 },
              { code: 'FLAT50', discount: '₹50 FLAT OFF', desc: 'Save ₹50 on prepaid orders over ₹199', discountType: 'fixed', discountValue: 50, minOrderValue: 199 },
              { code: 'B2BSAVE15', discount: '15% OFF', desc: 'Wholesale tier discount for bulk shoppers', discountType: 'percentage', discountValue: 15, minOrderValue: 499 }
            ]);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load coupons from API:', err);
        if (isMounted) {
          setAvailableCoupons([
            { code: 'BHARAT10', discount: '10% OFF', desc: 'Instant 10% discount on entire catalog', discountType: 'percentage', discountValue: 10, minOrderValue: 49 },
            { code: 'FLAT50', discount: '₹50 FLAT OFF', desc: 'Save ₹50 on prepaid orders over ₹199', discountType: 'fixed', discountValue: 50, minOrderValue: 199 },
            { code: 'B2BSAVE15', discount: '15% OFF', desc: 'Wholesale tier discount for bulk shoppers', discountType: 'percentage', discountValue: 15, minOrderValue: 499 }
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCoupons(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live price details directly from the API backend
  const selectedVariant = backendDetail?.variants?.[0];

  const currentPrice = Number(
    selectedVariant?.finalPrice ??
    selectedVariant?.price?.current ??
    selectedVariant?.price?.sale ??
    backendDetail?.minPrice ??
    product.currentPrice
  );

  const originalPrice = Number(
    selectedVariant?.price?.base ??
    backendDetail?.originalPrice ??
    product.originalPrice ??
    Math.round(currentPrice * 1.6)
  );

  const discountPercentage = Number(
    selectedVariant?.discountPercentage ??
    backendDetail?.maxDiscountPercentage ??
    product.discountPercentage ??
    Math.max(0, Math.round(((originalPrice - currentPrice) / (originalPrice || 1)) * 100))
  );

  const savingsAmount = Math.max(0, originalPrice - currentPrice);

  const appliedDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const payablePrice = Math.max(1, currentPrice - appliedDiscount);

  // Live product code & SKU from the API
  const productCode =
    selectedVariant?.productCode ||
    backendDetail?.productCode ||
    (backendDetail as any)?.code ||
    (product as any)?.productCode ||
    '';

  const sku =
    selectedVariant?.sku ||
    backendDetail?.sku ||
    (product as any)?.sku ||
    '';

  // Live Highlights / Features coming from the API
  const apiDescription = (backendDetail?.description || (product as any)?.description || '').trim();

  const apiHighlights: string[] = useMemo(() => {
    const raw =
      backendDetail?.highlights ??
      backendDetail?.features ??
      backendDetail?.keyHighlights ??
      backendDetail?.key_highlights ??
      backendDetail?.bulletPoints ??
      (product as any)?.features ??
      (product as any)?.highlights;

    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((item: any) => (typeof item === 'string' ? item.trim() : String(item?.title || item?.text || item?.value || item)))
        .filter(Boolean);
    }
    if (typeof raw === 'string') {
      return raw
        .split(/\r?\n|•|-|\*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [backendDetail, product]);

  // Live Specifications list coming strictly from the API
  const specsList = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [];

    const brand = backendDetail?.brand || (product as any)?.brand;
    if (brand && brand !== 'Generic' && brand !== 'Unknown') {
      list.push({ label: 'Brand', value: brand });
    } else if (brand) {
      list.push({ label: 'Brand', value: brand });
    }

    const category = backendDetail?.category?.name || product.category;
    if (category) {
      list.push({ label: 'Category', value: category });
    }

    if (productCode) {
      list.push({ label: 'Product Code', value: String(productCode) });
    }

    if (sku) {
      list.push({ label: 'SKU', value: String(sku) });
    }

    if (backendDetail?.hsnCode) {
      list.push({ label: 'HSN Code', value: String(backendDetail.hsnCode) });
    }

    if (backendDetail?.gstRate != null) {
      list.push({ label: 'GST Rate', value: `${backendDetail.gstRate}%` });
    }

    if (backendDetail?.shipping?.weight) {
      list.push({ label: 'Weight', value: `${backendDetail.shipping.weight} kg` });
    }

    if (backendDetail?.shipping?.dimensions) {
      const d = backendDetail.shipping.dimensions;
      if (d && (d.length || d.width || d.height)) {
        list.push({
          label: 'Dimensions (L x W x H)',
          value: `${d.length || 0} x ${d.width || 0} x ${d.height || 0} cm`,
        });
      }
    }

    if (backendDetail?.warranty) {
      list.push({ label: 'Warranty', value: String(backendDetail.warranty) });
    }

    if (backendDetail?.countryOfOrigin || backendDetail?.origin) {
      list.push({ label: 'Country of Origin', value: String(backendDetail.countryOfOrigin || backendDetail.origin) });
    }

    // Process custom attributes / specifications from API
    const rawAttrs = backendDetail?.attributes || selectedVariant?.attributes || (backendDetail as any)?.specifications;
    if (Array.isArray(rawAttrs)) {
      rawAttrs.forEach((attr: any) => {
        const k = attr?.key || attr?.name || attr?.label;
        const v = attr?.value;
        if (k && v) {
          list.push({ label: String(k), value: String(v) });
        }
      });
    } else if (rawAttrs && typeof rawAttrs === 'object') {
      Object.entries(rawAttrs).forEach(([k, v]) => {
        if (v != null && typeof v !== 'object') {
          list.push({ label: k, value: String(v) });
        }
      });
    }

    return list;
  }, [backendDetail, product, selectedVariant, productCode, sku]);

  const stockQuantity = selectedVariant?.inventory?.quantity ?? backendDetail?.inventory?.quantity ?? backendDetail?.stock;
  const isOutOfStock = stockQuantity === 0 || product.inStock === false || (selectedVariant && selectedVariant.isActive === false);

  const liveProduct: ProductItem = {
    ...product,
    currentPrice: payablePrice,
    originalPrice,
    discountPercentage,
    id: backendDetail?._id || backendDetail?.id || product.id,
    slug: backendDetail?.slug || product.slug,
    inStock: !isOutOfStock,
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponFeedback('Please enter a coupon code.');
      return;
    }
    setCouponCode(code);

    // 1. Check local match from real API coupons
    const matched = availableCoupons.find((c) => c.code.toUpperCase() === code);

    if (matched) {
      if (matched.minOrderValue && currentPrice < matched.minOrderValue) {
        setCouponFeedback(`Minimum order value for ${code} is ₹${matched.minOrderValue} (Current: ₹${currentPrice})`);
        return;
      }

      const discountAmount =
        matched.discountType === 'percentage'
          ? Math.round((currentPrice * matched.discountValue) / 100)
          : Math.min(currentPrice, matched.discountValue);

      const couponObj = {
        code,
        discountAmount,
        discountText: matched.discount,
      };
      setAppliedCoupon(couponObj);
      try {
        sessionStorage.setItem('abb_applied_coupon', JSON.stringify(couponObj));
        localStorage.setItem('cart_coupon', JSON.stringify({ code, discount: discountAmount }));
      } catch {}

      setCouponFeedback(`🎉 Coupon ${code} applied! You save ₹${discountAmount}`);
      toast.success(`Coupon ${code} applied (-₹${discountAmount})!`);
      return;
    }

    // 2. Validate via API validate endpoint
    try {
      const res: any = await storefrontCheckoutApi.validateCoupon(code, currentPrice);
      const disc = res?.discountAmount || res?.discount || res?.data?.discount || 50;
      const couponObj = {
        code,
        discountAmount: Number(disc),
        discountText: `₹${disc} OFF`,
      };
      setAppliedCoupon(couponObj);
      try {
        sessionStorage.setItem('abb_applied_coupon', JSON.stringify(couponObj));
        localStorage.setItem('cart_coupon', JSON.stringify({ code, discount: disc }));
      } catch {}
      setCouponFeedback(`🎉 Coupon ${code} applied! You save ₹${disc}`);
      toast.success(`Coupon ${code} applied (-₹${disc})!`);
    } catch (err: any) {
      setCouponFeedback(err.message || `Coupon "${code}" is invalid or expired.`);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponFeedback('Coupon removed');
    try {
      sessionStorage.removeItem('abb_applied_coupon');
      localStorage.removeItem('cart_coupon');
    } catch {}
  };

  // Synchronize product state and fetch full backend product data when product changes
  useEffect(() => {
    setSelectedImage(product.image);
    setProductImages([product.image]);
    setQuantity(1);
    setIsAddedToCart(false);

    let isCurrent = true;
    const loadProductDetails = async () => {
      try {
        let slug = product.slug;
        if (!slug && product.id && isNaN(Number(product.id)) && !/^[0-9a-fA-F]{24}$/.test(product.id)) {
          slug = product.id;
        }
        if (!slug && product.title) {
          slug = product.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
        if (!slug) return;

        const res = await storefrontProductsApi.getBySlug(slug);
        const detail = res?.product || res?.data || res;
        if (!isCurrent || !detail) return;

        setBackendDetail(detail);

        // Collect all real images from backend variants and images array
        const collectedImgs: string[] = [];
        if (Array.isArray(detail.variants)) {
          for (const v of detail.variants) {
            if (Array.isArray(v.images)) {
              for (const im of v.images) {
                const u = typeof im === 'string' ? im : im?.url;
                if (u && !collectedImgs.includes(u)) collectedImgs.push(u);
              }
            }
          }
        }
        if (Array.isArray(detail.images)) {
          for (const im of detail.images) {
            const u = typeof im === 'string' ? im : im?.url;
            if (u && !collectedImgs.includes(u)) collectedImgs.push(u);
          }
        }
        if (detail.cardImage?.url && !collectedImgs.includes(detail.cardImage.url)) {
          collectedImgs.push(detail.cardImage.url);
        }

        if (collectedImgs.length > 0) {
          setProductImages(collectedImgs);
          setSelectedImage(collectedImgs[0]);
        }
      } catch (err) {
        console.warn('Failed to load detailed product images:', err);
      }
    };

    loadProductDetails();
    return () => {
      isCurrent = false;
    };
  }, [product.id, product.slug, product.image, product.title]);



  // Related products state & API fetch
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(true);
  const [addedRelatedIds, setAddedRelatedIds] = useState<{ [key: string]: boolean }>({});
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const scrollRelated = (direction: 'left' | 'right') => {
    if (!relatedScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = relatedScrollRef.current;
    const firstCard = relatedScrollRef.current.querySelector('article');
    const cardStep = firstCard ? (firstCard as HTMLElement).offsetWidth + 16 : 280;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) return;

    if (direction === 'right') {
      if (scrollLeft >= maxScroll - 15) {
        relatedScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        relatedScrollRef.current.scrollBy({ left: cardStep, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft <= 15) {
        relatedScrollRef.current.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        relatedScrollRef.current.scrollBy({ left: -cardStep, behavior: 'smooth' });
      }
    }
  };

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
              setRelatedProducts(mapped.slice(0, 16));
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
                setRelatedProducts(mapped.slice(0, 16));
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
            .slice(0, 8);
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

  }, [product]);

  // Fetch logged-in user's existing review for this specific product via GET /api/product-reviews/mine/:productId
  useEffect(() => {
    let isMounted = true;
    const targetProductId = (product as any)._id || product.id;

    if (!targetProductId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem("user_access_token") : null;
    if (!token) {
      setMyReview(null);
      return;
    }

    setIsLoadingMyReview(true);
    storefrontProductsApi.getMyReview(targetProductId)
      .then((reviewData) => {
        if (!isMounted) return;
        if (reviewData && typeof reviewData === 'object') {
          setMyReview(reviewData);
          if (typeof reviewData.rating === 'number') {
            setReviewRating(reviewData.rating);
          }
          if (reviewData.comment) {
            setReviewComment(reviewData.comment);
          }
          if (reviewData.displayName) {
            setReviewerName(reviewData.displayName);
          }
        } else {
          setMyReview(null);
        }
      })
      .catch(() => {
        if (isMounted) setMyReview(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMyReview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product.id, (product as any)._id]);

  // Fetch public reviews + summary + eligibility when the reviews tab is active
  useEffect(() => {
    const targetProductId = (product as any)._id || product.id;
    if (!targetProductId) return;

    let isMounted = true;
    setIsLoadingPublicReviews(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;

    Promise.all([
      storefrontProductsApi.getPublicReviews(targetProductId, { page: reviewPage, limit: 10, sort: reviewSort }),
      storefrontProductsApi.getPublicReviewSummary(targetProductId),
      token ? storefrontProductsApi.checkReviewEligibility(targetProductId) : Promise.resolve(null),
    ]).then(([reviewData, summaryData, eligData]) => {
      if (!isMounted) return;
      setPublicReviews(reviewData.reviews || []);
      const pg = reviewData.pagination;
      if (pg?.pages) setReviewTotalPages(pg.pages);
      setReviewSummary(summaryData);
      if (eligData) setEligibility(eligData);
    }).catch(() => {
      if (isMounted) {
        setPublicReviews([]);
      }
    }).finally(() => {
      if (isMounted) setIsLoadingPublicReviews(false);
    });

    return () => { isMounted = false; };
  }, [product.id, (product as any)._id, reviewPage, reviewSort]);

  const handleAddToCart = () => {
    addToCart(liveProduct, quantity);
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

    const targetProductId = (product as any)._id || product.id;
    if (!targetProductId) {
      toast.error('Product ID missing');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem("user_access_token") : null;
    if (!token) {
      toast.error('Please log in to submit a verified product review.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError('Please write a review comment.');
      return;
    }

    setReviewError(null);
    setIsSubmittingReview(true);
    try {
      const res = await storefrontProductsApi.submitReview({
        productId: targetProductId,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      const submitted = res?.review || res?.data || {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
        displayName: reviewerName.trim() || undefined,
        createdAt: new Date().toISOString(),
        verifiedPurchase: !!eligibility?.isEligible,
      };
      setMyReview(submitted);
      setReviewSuccessMessage(myReview ? 'Your review has been updated successfully!' : 'Thank you! Your verified review has been submitted.');
      setTimeout(() => setReviewSuccessMessage(null), 4000);
      // Refresh public list and summary
      const targetId = (product as any)._id || product.id;
      storefrontProductsApi.getPublicReviews(targetId, { page: 1, limit: 10, sort: reviewSort }).then(d => {
        setPublicReviews(d.reviews || []);
        const pagination = d.pagination;
        if (pagination?.pages) setReviewTotalPages(pagination.pages);
      });
      storefrontProductsApi.getPublicReviewSummary(targetId).then(s => setReviewSummary(s));
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit review';
      setReviewError(msg);
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
          
          {/* Left Column: Product Image Stage + Horizontal Thumbnails with Zoom Vision */}
          <div 
            className="lg:col-span-6 space-y-4 relative"
          >
            <div 
              ref={imageStageRef}
              onMouseEnter={() => {
                setIsHoveredGallery(true);
                setIsZooming(true);
              }}
              onMouseLeave={() => {
                setIsHoveredGallery(false);
                setIsZooming(false);
              }}
              onMouseMove={handleMouseMove}
              className="bg-white rounded-2xl p-6 sm:p-12 border border-slate-200/80 shadow-xs flex items-center justify-center aspect-square relative overflow-hidden group cursor-crosshair"
            >
              <img
                key={selectedImage}
                src={selectedImage}
                alt={product.title}
                className="max-h-full max-w-full object-contain transition-all duration-300 animate-fadeIn pointer-events-none select-none"
              />

              {/* Lens Box following cursor on hover */}
              {isZooming && (
                <div
                  className="hidden lg:block absolute border-2 border-indigo-500/70 bg-indigo-500/20 rounded-lg pointer-events-none z-20 shadow-sm"
                  style={{
                    width: `${LENS_SIZE}px`,
                    height: `${LENS_SIZE}px`,
                    left: `${zoomPos.lensX}px`,
                    top: `${zoomPos.lensY}px`,
                  }}
                />
              )}


              {/* Prev / Next navigation arrows on hover */}
              {productImages.length > 1 && !isZooming && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-slate-200 hover:scale-110 active:scale-95 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-slate-200 hover:scale-110 active:scale-95 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>

                  {/* Image counter pill */}
                  <div className="absolute bottom-3 right-3 bg-slate-900/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs pointer-events-none">
                    {(productImages.indexOf(selectedImage) >= 0 ? productImages.indexOf(selectedImage) + 1 : 1)} / {productImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Zoom Vision Preview Panel on the right (hidden on mobile, visible on desktop during hover) */}
            {isZooming && (
              <div 
                className="hidden lg:block absolute left-[calc(100%+16px)] top-0 w-full aspect-square z-50 rounded-2xl shadow-2xl border-2 border-slate-200/90 bg-white overflow-hidden pointer-events-none animate-fadeIn"
                style={{
                  backgroundImage: `url(${selectedImage})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: `${ZOOM_LEVEL * 100}%`,
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#ffffff',
                }}
              />
            )}

            {/* Horizontal Thumbnails Row - Real Product Images */}
            {productImages.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {productImages.map((img, idx) => {
                  const isActive = selectedImage === img;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-1 border-2 transition-all cursor-pointer overflow-hidden shrink-0 ${
                        isActive
                          ? 'border-[#A44101] shadow-xs ring-2 ring-[#A44101]/25 scale-102'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Clean Purchasing Details Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
              
              {/* Category Pill & In Stock Pill */}
              <div className="flex items-center justify-between">
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  isOutOfStock ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {product.title}
              </h1>

              {/* SKU & Product Code Chips from API */}
              <div className="flex flex-wrap items-center gap-2.5">
                {productCode && (
                  <span className="bg-slate-100 text-slate-700 text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-slate-200">
                    Product Code: <strong className="text-slate-900">{productCode}</strong>
                  </span>
                )}
                {sku && (
                  <span className="bg-slate-100 text-slate-700 text-xs font-mono font-medium px-2.5 py-1 rounded-md border border-slate-200">
                    SKU: <strong className="text-slate-900">{sku}</strong>
                  </span>
                )}
                {!productCode && !sku && (
                  <span className="bg-slate-100 text-slate-600 text-xs font-mono font-medium px-2.5 py-1 rounded-md">
                    SKU: {product.id && product.id.length < 12 ? product.id : 'PRD-' + (product.slug || '01').slice(0, 8)}
                  </span>
                )}
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

              {/* Price Box Card from API */}
              <div className="rounded-xl border border-slate-200/80 p-4 sm:p-5 bg-white space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
                    ₹{payablePrice}
                  </span>
                  {appliedDiscount > 0 && (
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      ₹{currentPrice}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm text-slate-400 line-through">
                    M.R.P.: ₹{originalPrice}
                  </span>
                  <span className="bg-[#E11D48] text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    {discountPercentage}% OFF
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md border border-emerald-200/80">
                      You Save: ₹{savingsAmount + appliedDiscount}
                    </span>
                    {appliedCoupon && (
                      <span className="bg-amber-50 text-[#A44101] font-bold px-2.5 py-0.5 rounded text-[11px] border border-amber-200">
                        Coupon {appliedCoupon.code} Applied (-₹{appliedCoupon.discountAmount})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Inclusive of all GST &amp; taxes • Instant Tax Invoice
                  </span>
                </div>
              </div>

              {/* Applicable Coupons & Offers from API */}
              <div className="rounded-xl border border-amber-200/70 bg-[#FFFDF9] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">Applicable Coupons &amp; Offers</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Tap to copy or apply code at checkout</p>
                    </div>
                  </div>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {isLoadingCoupons ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#A44101]" />
                    <span>Loading available store offers...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableCoupons.map((coupon) => {
                      const isCurrentlyApplied = appliedCoupon?.code === coupon.code;
                      return (
                        <div
                          key={coupon.code}
                          className={`flex items-center justify-between gap-3 p-2 rounded-lg bg-white border transition-all ${
                            isCurrentlyApplied ? 'border-emerald-400 bg-emerald-50/40 shadow-xs' : 'border-amber-100 shadow-2xs'
                          }`}
                        >
                          <span className="border border-dashed border-[#A44101] bg-[#A44101]/10 text-[#A44101] font-mono font-bold text-xs px-2 py-0.5 rounded">
                            {coupon.code}
                          </span>
                          <span className="text-xs text-slate-600 truncate flex-1">
                            <strong className="text-slate-800">{coupon.discount}</strong> • {coupon.desc}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(coupon.code)}
                            className={`border text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${
                              isCurrentlyApplied
                                ? 'border-emerald-500 bg-emerald-600 text-white'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {isCurrentlyApplied ? (
                              <>
                                <Check className="w-3 h-3 text-white" />
                                <span>Applied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Apply</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

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
                  <p className={`text-[11px] font-semibold ${appliedCoupon ? 'text-emerald-700' : 'text-amber-800'}`}>
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
                    <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                    <span>
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">Out of Stock</span>
                      ) : typeof stockQuantity === 'number' && stockQuantity > 0 ? (
                        <>Only <strong className="text-[#A44101]">{stockQuantity} Units</strong> Available</>
                      ) : (
                        <>In Stock • Ready for dispatch</>
                      )}
                    </span>
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
            <div className="py-5 space-y-4">
              {apiDescription && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {apiDescription}
                </p>
              )}
              {apiHighlights.length > 0 && (
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {apiHighlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!apiDescription && apiHighlights.length === 0 && (
                <p className="text-xs sm:text-sm text-slate-500 italic py-2">
                  No highlights or description provided for this product.
                </p>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="py-5">
              {specsList.length > 0 ? (
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <tbody>
                    {specsList.map((spec, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-2.5 font-bold text-slate-500 w-1/3 sm:w-1/4">{spec.label}</td>
                        <td className="py-2.5 text-navy font-semibold">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500 italic py-2">
                  No additional specifications provided for this product.
                </p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="py-5 space-y-6">

              {/* ── Rating Summary Header ─────────────────────────────────────── */}
              <div className="flex flex-wrap items-start gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                {/* Overall Score */}
                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                  <span className="text-4xl font-black text-navy">
                    {reviewSummary.averageRating != null ? Number(reviewSummary.averageRating).toFixed(1) : product.rating}
                  </span>
                  <div className="flex text-[#A44101]">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewSummary.averageRating ?? product.rating) ? 'fill-[#A44101]' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {reviewSummary.totalReviews || product.reviews} reviews
                  </span>
                </div>

                {/* Distribution Bars */}
                <div className="flex-1 space-y-1.5 min-w-[200px]">
                  {[5,4,3,2,1].map(star => {
                    const count = reviewSummary.distribution?.[String(star)] ?? 0;
                    const total = reviewSummary.totalReviews || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={star} className="flex items-center gap-2 text-[11px]">
                        <span className="w-4 font-bold text-slate-600">{star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-slate-500 font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-bold self-start">
                  ✓ Verified Direct Factory Purchases Only
                </div>
              </div>

              {/* ── My Existing Review Card ───────────────────────────────────── */}
              {myReview && (
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Your Review
                      </span>
                      <span className="text-xs text-slate-500">
                        {myReview.createdAt ? new Date(myReview.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div className="flex text-[#A44101]">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= (myReview.rating || 5) ? 'fill-[#A44101]' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                  {myReview.title && <p className="text-xs font-bold text-navy">{myReview.title}</p>}
                  <p className="text-xs text-slate-800 font-medium">"{myReview.comment || myReview.reviewText}"</p>
                  {myReview.displayName && (
                    <p className="text-[11px] text-slate-500">Posted by: <strong className="text-slate-700">{myReview.displayName}</strong></p>
                  )}
                  {myReview.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                    </span>
                  )}
                  {/* Admin reply (if exists) */}
                  {myReview.adminReply && (
                    <div className="mt-2 p-3 rounded-xl border border-slate-200 bg-white">
                      <p className="text-[11px] font-bold text-slate-500 mb-1">🏪 Store Response</p>
                      <p className="text-xs text-slate-700">{myReview.adminReply.comment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Review Submission / Edit Form ─────────────────────────────── */}
              <form onSubmit={handleSubmitReview} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-navy">
                    {myReview ? 'Edit Your Verified Review' : 'Write a Verified Product Review'}
                  </h4>
                  {isLoadingMyReview && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                    </span>
                  )}
                </div>

                {/* Eligibility notice */}
                {eligibility && !eligibility.isEligible && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                    ⚠️ {eligibility.reason || 'You must purchase this product to leave a verified review'}
                  </div>
                )}

                {reviewSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMessage}</span>
                  </div>
                )}
                {reviewError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {reviewError}
                  </div>
                )}

                {/* Star Rating */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)}
                        className="cursor-pointer p-0.5 hover:scale-110 transition-transform">
                        <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="ml-1 text-xs font-bold text-slate-600">{reviewRating}/5</span>
                  </div>
                </div>

                {/* Name + Title row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={reviewerName} onChange={e => setReviewerName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#A44101]" />
                  <input type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)}
                    placeholder="Review Headline (e.g. 'Great value!')"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#A44101]" />
                </div>

                {/* Comment */}
                <textarea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                  required placeholder="Share your detailed experience with this item..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#A44101] resize-none" />

                <div className="flex justify-end">
                  <button type="submit" disabled={isSubmittingReview || !reviewComment.trim()}
                    className="px-4 py-2 bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors disabled:opacity-60 flex items-center gap-1.5">
                    {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{myReview ? 'Update Review' : 'Submit Review'}</span>
                  </button>
                </div>
              </form>

              {/* ── Public Reviews List ───────────────────────────────────────── */}
              <div className="space-y-3">
                {/* Sort + count header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    {isLoadingPublicReviews ? 'Loading reviews…' : `${reviewSummary.totalReviews || publicReviews.length} Customer Reviews`}
                  </span>
                  <select value={reviewSort} onChange={e => { setReviewSort(e.target.value as any); setReviewPage(1); }}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#A44101] font-bold text-navy bg-white cursor-pointer">
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>

                {isLoadingPublicReviews ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 text-[#A44101] animate-spin" />
                  </div>
                ) : publicReviews.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs">
                    <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {publicReviews.map((r: any) => (
                      <div key={r._id} className="p-4 rounded-xl border border-slate-100 bg-white space-y-2 shadow-xs">
                        {/* Review Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-400">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                                ))}
                              </div>
                              {r.verifiedPurchase && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                </span>
                              )}
                            </div>
                            {r.title && <p className="text-xs font-bold text-navy">{r.title}</p>}
                          </div>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap font-mono">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        {/* Comment */}
                        <p className="text-xs text-slate-700 leading-relaxed">"{r.comment}"</p>
                        {/* Author */}
                        <p className="text-[11px] text-slate-500 font-semibold">
                          — {r.displayName || 'Verified Buyer'}
                        </p>
                        {/* Review images */}
                        {Array.isArray(r.images) && r.images.length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {r.images.slice(0, 4).map((img: string, i: number) => (
                              <img key={i} src={img} alt={`Review photo ${i+1}`}
                                className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                            ))}
                          </div>
                        )}
                        {/* Admin reply */}
                        {r.adminReply && (
                          <div className="mt-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                            <p className="text-[11px] font-bold text-slate-500 mb-1">🏪 Store Response <span className="font-normal text-slate-400">{new Date(r.adminReply.repliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></p>
                            <p className="text-xs text-slate-700">{r.adminReply.comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {reviewTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button type="button" onClick={() => setReviewPage(p => Math.max(1, p-1))} disabled={reviewPage === 1}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
                      ‹ Prev
                    </button>
                    <span className="text-xs text-slate-500 font-mono">Page {reviewPage} of {reviewTotalPages}</span>
                    <button type="button" onClick={() => setReviewPage(p => Math.min(reviewTotalPages, p+1))} disabled={reviewPage >= reviewTotalPages}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
                      Next ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Related Steal Deals - Single Line Carousel with Left/Right Arrows */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-navy">
              You May Also Like: <span className="text-navy">Related Deals</span>
            </h2>
            <div className="flex items-center gap-3">
              {/* Arrow navigation buttons */}
              {relatedProducts.length > 4 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollRelated('left')}
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#A44101] text-navy hover:text-white border border-slate-300 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                    aria-label="Previous related products"
                    title="Previous product"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRelated('right')}
                    className="w-8 h-8 rounded-full bg-white hover:bg-[#A44101] text-navy hover:text-white border border-slate-300 shadow-xs flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                    aria-label="Next related products"
                    title="Next product"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-bold text-navy hover:text-[#A44101] cursor-pointer"
              >
                View Catalog →
              </button>
            </div>
          </div>

          {isLoadingRelated ? (
            <div className="flex overflow-hidden gap-3 sm:gap-4 py-2">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] shrink-0 bg-white rounded-theme border border-slate-200 p-3 shadow-soft animate-pulse space-y-3"
                >
                  <div className="aspect-[4/3] rounded-lg bg-slate-100" />
                  <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="relative group/slider">
              {/* Floating Left Arrow */}
              {relatedProducts.length > 4 && (
                <button
                  type="button"
                  onClick={() => scrollRelated('left')}
                  className="hidden sm:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-[#A44101] text-navy hover:text-white border border-slate-300 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  aria-label="Scroll left"
                  title="Previous products"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}

              {/* Single row scroll track - strictly one line */}
              <div
                ref={relatedScrollRef}
                className="w-full flex overflow-x-auto scroll-smooth gap-3 sm:gap-4 py-2 px-0.5 scrollbar-none select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {relatedProducts.map((relProduct) => {
                  const isAdded = !!addedRelatedIds[relProduct.id];

                  return (
                    <article
                      key={relProduct.id}
                      onClick={() => {
                        onSelectProduct(relProduct);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-[calc((100%-12px)/2)] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] min-w-[210px] shrink-0 bg-white rounded-theme border border-slate-200 shadow-soft hover:shadow-soft-hover hover:border-[#A44101]/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer"
                    >
                      {/* Product Visual */}
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        {/* Discount Sticker */}
                        <div className="absolute top-2 left-2 z-10 bg-[#A44101] text-white text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" />
                          <span>{relProduct.discountPercentage}% OFF</span>
                        </div>

                        {/* Tag */}
                        {relProduct.tag && (
                          <div className="absolute top-2 right-2 z-10 bg-navy text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">
                            {relProduct.tag}
                          </div>
                        )}

                        <img
                          src={relProduct.image}
                          alt={relProduct.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] sm:text-[11px] mb-1">
                            <span className="font-extrabold text-[#A44101] uppercase tracking-wider text-[9px] sm:text-[10px]">
                              {relProduct.category}
                            </span>
                            <div className="flex items-center gap-1 text-navy font-bold">
                              <Star className="w-3 h-3 fill-[#A44101] text-[#A44101]" />
                              <span>{relProduct.rating}</span>
                              <span className="text-slate-400 font-normal">({relProduct.reviews})</span>
                            </div>
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold text-charcoal line-clamp-2 leading-snug group-hover:text-[#A44101] transition-colors">
                            {relProduct.title}
                          </h3>
                        </div>

                        {/* Price & Action */}
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100">
                          <div className="flex items-baseline justify-between mb-2">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base sm:text-lg font-black text-navy">
                                ₹{relProduct.currentPrice}
                              </span>
                              <span className="text-xs text-slate-400 line-through">
                                ₹{relProduct.originalPrice}
                              </span>
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-1.5 py-0.5 rounded">
                              Save ₹{relProduct.originalPrice - relProduct.currentPrice}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(relProduct);
                                setAddedRelatedIds((prev) => ({ ...prev, [relProduct.id]: true }));
                                setTimeout(() => {
                                  setAddedRelatedIds((prev) => ({ ...prev, [relProduct.id]: false }));
                                }, 2000);
                              }}
                              className={`py-1.5 px-1.5 sm:px-2 rounded-theme text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                isAdded
                                  ? 'bg-navy text-white border-navy'
                                  : 'bg-white hover:bg-slate-50 text-navy border-slate-300 hover:border-[#A44101] shadow-xs'
                              }`}
                              aria-label={`Add ${relProduct.title} to cart`}
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
                                addToCart(relProduct);
                                if (onGoToCheckout) {
                                  onGoToCheckout();
                                } else {
                                  window.history.pushState(null, '', '/checkout');
                                  window.dispatchEvent(new PopStateEvent('popstate'));
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
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
              {relatedProducts.length > 4 && (
                <button
                  type="button"
                  onClick={() => scrollRelated('right')}
                  className="hidden sm:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-[#A44101] text-navy hover:text-white border border-slate-300 shadow-md items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  aria-label="Scroll right"
                  title="Next products"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
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
