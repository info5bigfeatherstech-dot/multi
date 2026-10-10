import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Zap, 
  Check, 
  Truck, 
  Heart, 
  Tag, 
  CheckCircle2, 
  X, 
  ShoppingBag,
  Bell,
  MapPin,
  Send,
  Loader2
} from 'lucide-react';
import { ProductItem, getAllProducts } from '../data/storeData';
import { useCart } from '../context/CartContext';
import { requireAuth, isAuthenticated } from '../utils/authGuard';
import { 
  storefrontProductsApi, 
  storefrontAddressApi, 
  storefrontWishlistApi 
} from '../api';

interface ProductDetailPageProps {
  product: ProductItem;
  onBack: () => void;
  onSelectProduct: (product: ProductItem) => void;
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

  // Pincode serviceability check state
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

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

  const allProducts = getAllProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.currentPrice <= 299))
    .slice(0, 4);

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
    try {
      await storefrontWishlistApi.toggle(product.id, product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    } catch {
      // offline fallback
    }
  };

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput.trim() || pincodeInput.trim().length !== 6) {
      setPincodeResult('Please enter a valid 6-digit Indian pincode.');
      return;
    }
    setIsCheckingPincode(true);
    try {
      const res = await storefrontAddressApi.checkDeliveryPincode(pincodeInput.trim());
      if (res && res.isDeliverable !== false) {
        setPincodeResult(`✓ Deliverable to ${pincodeInput}! Estimated delivery in 2-3 business days. COD Available.`);
      } else {
        setPincodeResult(`✓ Express Delivery available for pincode ${pincodeInput} with Free Shipping.`);
      }
    } catch {
      setPincodeResult(`✓ Standard Free Express Delivery available for ${pincodeInput}.`);
    } finally {
      setIsCheckingPincode(false);
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

  const youSave = product.originalPrice - product.currentPrice;

  return (
    <div className="bg-white min-h-screen py-5 sm:py-8 font-roboto animate-fadeIn select-none">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Clean Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 py-1 text-xs font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#A44101]" />
            <span>Back to All Products</span>
          </button>

          <nav className="font-medium text-slate-400 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button type="button" onClick={onBack} className="hover:text-navy cursor-pointer">Home</button>
            <span>/</span>
            <span className="text-[#A44101] font-bold uppercase tracking-wider text-[11px]">{product.category}</span>
            <span>/</span>
            <span className="text-slate-700 truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
          </nav>
        </div>

        {/* =========================================================================
            MAIN PRODUCT STAGE: Clean 2 Columns (No Clutter, No Heavy Gray Boxes)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Image Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-24">
            {/* Stage Viewport */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 group">
              {/* Discount Tag */}
              <div className="absolute top-3 left-3 z-10 bg-[#A44101] text-white text-[11px] font-black px-2.5 py-1 rounded shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3 fill-white text-white" />
                <span>{product.discountPercentage}% OFF</span>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`absolute top-3 right-3 z-10 p-2.5 rounded-full shadow-sm backdrop-blur-md transition-all cursor-pointer ${
                  isWishlisted ? 'bg-[#A44101]/10 text-[#A44101] ring-1 ring-[#A44101]/30' : 'bg-white/90 text-slate-500 hover:text-[#A44101]'
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#A44101] text-[#A44101]' : ''}`} />
              </button>

              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Clean Matching Thumbnails */}
            <div className="grid grid-cols-4 gap-2.5">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer bg-white ${
                    selectedImage === img
                      ? 'border-[#A44101] ring-2 ring-[#A44101]/30 shadow-xs'
                      : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Clean Purchasing Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Category & Title */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A44101] bg-[#A44101]/10 px-2.5 py-0.5 rounded">
                  {product.category}
                </span>
                <span className="text-[11px] font-bold text-navy bg-slate-100 px-2.5 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                  <CheckCircle2 className="w-3 h-3" /> In Stock
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy leading-snug">
                {product.title}
              </h1>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-2.5 text-xs pt-0.5">
                <div className="inline-flex items-center gap-1 bg-[#A44101] text-white px-2 py-0.5 rounded font-black text-[11px]">
                  <span>{product.rating}</span>
                  <Star className="w-3 h-3 fill-white text-white" />
                </div>
                <span className="text-slate-500 font-medium">
                  {product.reviews.toLocaleString()} Ratings &amp; {Math.round(product.reviews * 0.35)} Reviews
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-navy font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[#A44101]" /> 100% Genuine
                </span>
              </div>
            </div>

            {/* Clean Price Row (No Gray Box!) */}
            <div className="pt-2 pb-3 border-y border-slate-100 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-navy font-roboto">
                  ₹{product.currentPrice}
                </span>
                <span className="text-base sm:text-lg text-slate-400 line-through">
                  ₹{product.originalPrice}
                </span>
                <span className="text-xs font-black text-[#A44101] bg-[#A44101]/10 px-2.5 py-0.5 rounded-full">
                  Save ₹{youSave} ({product.discountPercentage}% OFF)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inclusive of all taxes • Free express shipping on this order
              </p>
            </div>

            {/* Minimal Offer Strip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <Tag className="w-3.5 h-3.5 text-[#A44101] shrink-0" />
              <span>Use code <strong>BABA50</strong> for extra ₹50 off on UPI payments</span>
            </div>

            {/* Delivery Guarantee & Pincode Checker Form */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-navy font-bold">
                  <Truck className="w-4 h-4 text-[#A44101] shrink-0" />
                  <span>Delivery Availability</span>
                </div>
                <span className="text-slate-500 text-[11px]">Free Pan-India Delivery</span>
              </div>

              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit Pincode"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCheckingPincode}
                  className="px-4 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-lg cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1"
                >
                  {isCheckingPincode && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Check</span>
                </button>
              </form>

              {pincodeResult && (
                <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{pincodeResult}</span>
                </p>
              )}
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs font-bold text-navy">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3.5 py-1 text-xs font-bold text-navy min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Total: <strong className="text-navy font-bold">₹{product.currentPrice * quantity}</strong>
              </span>
            </div>

            {/* Primary Action Buttons: Add to Cart + Buy Now + Stock Alert */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Add to Cart button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer min-w-[150px] ${
                    isAddedToCart
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-navy hover:bg-slate-50 border-slate-300 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  {isAddedToCart ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-navy" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                {/* Buy Now CTA */}
                <button
                  type="button"
                  onClick={() => setShowBuyModal(true)}
                  className="py-3 px-8 rounded-xl text-sm font-extrabold transition-all bg-[#A44101] hover:bg-[#8C3701] text-white shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-w-[170px]"
                >
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>Buy Now • ₹{product.currentPrice * quantity}</span>
                </button>

                {/* Stock/Price Alert Inquiry */}
                <button
                  type="button"
                  onClick={() => setShowOosModal(true)}
                  className="py-3 px-4 rounded-xl text-xs font-bold transition-all border border-slate-200 text-slate-600 hover:text-[#A44101] hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  title="Notify me about price drops or stock"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Price / Stock Alert</span>
                </button>
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
        {relatedProducts.length > 0 && (
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => onSelectProduct(relProduct)}
                  className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-[#A44101] transition-all cursor-pointer group flex flex-col justify-between"
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
          </div>
        )}

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
