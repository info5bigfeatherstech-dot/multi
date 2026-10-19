import React, { useState, useMemo } from 'react';
import { 
  Star, 
  CheckCircle2, 
  X, 
  UploadCloud, 
  MessageSquare, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  useProductReviews, 
  useMyProductReview, 
  useProductReviewEligibility, 
  useSubmitProductReview 
} from '../hooks';
import { StarRatingInput } from './StarRatingInput';
import { isAuthenticated, requireAuth } from '../../../utils/authGuard';

interface ProductReviewsSectionProps {
  productId: string;
  productTitle?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productTitle: _productTitle = 'this product',
}) => {
  const isAuth = isAuthenticated();
  
  // Data queries via React Query
  const { data, isLoading } = useProductReviews(productId);
  const { data: myReview } = useMyProductReview(productId);
  const { data: eligibility } = useProductReviewEligibility(productId);
  const submitMutation = useSubmitProductReview(productId);

  // Filter state (clicking star progress bar filters reviews)
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);

  // Write Review Form State
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Lightbox Modal for enlarged photo view
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Summary and review list data
  const summary = data?.summary;
  const reviews = data?.reviews || [];

  // Distribution calculation
  const distribution = useMemo(() => {
    const defaultDist: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    if (summary?.starDistribution) {
      return { ...defaultDist, ...summary.starDistribution };
    }
    if (summary?.distribution) {
      return { ...defaultDist, ...summary.distribution };
    }
    // Fallback: derive from loaded reviews
    reviews.forEach((r) => {
      const star = String(Math.round(r.rating || 0));
      if (defaultDist[star] !== undefined) {
        defaultDist[star] += 1;
      }
    });
    return defaultDist;
  }, [summary, reviews]);

  const totalReviewCount = summary?.reviewCount !== undefined 
    ? summary.reviewCount 
    : reviews.length;

  const averageRating = summary?.averageRating !== undefined && summary.averageRating !== null
    ? Number(summary.averageRating).toFixed(1)
    : reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '0.0';

  // Filtered reviews list
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === null) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  // Handle image selection (max 4)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 4) {
      toast.error('You can upload a maximum of 4 photos per review');
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...validPreviews]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit review handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuth) {
      requireAuth({ message: 'Please log in to write a product review' });
      return;
    }

    if (myReview) {
      toast.error('You have already submitted a review for this product');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Please choose a star rating from 1 to 5');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        rating,
        comment: comment.trim(),
        orderId: eligibility?.orderId || undefined,
        images,
      });

      toast.success('Thank you! Review submitted for moderation.');
      setComment('');
      setImages([]);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit your review. Please try again.');
    }
  };

  const getAuthorInitial = (author?: string) => {
    if (!author) return 'C';
    return author.charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section 
      id="product-reviews-section" 
      className="mt-12 pt-10 border-t border-slate-200 text-slate-800"
    >
      {/* Header with Title and Anchor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-100 text-[#A44101] flex items-center justify-center">
              <Star className="w-4 h-4 fill-[#A44101]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Customer Ratings &amp; Reviews
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real feedback and photos verified from customers who experienced this product.
          </p>
        </div>

        {!myReview && (
          <button
            type="button"
            onClick={() => {
              if (!isAuth) {
                requireAuth({ message: 'Please log in to write a review' });
              } else {
                setIsFormOpen(!isFormOpen);
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isFormOpen ? 'Cancel Review' : 'Write a Review'}</span>
          </button>
        )}
      </div>

      {/* Main Grid: Summary Card (Left) + Content (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =========================================================================
            1. SUMMARY CARD & STAR DISTRIBUTION
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 border border-orange-200/80 min-w-[100px]">
              <span className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
                {averageRating}
              </span>
              <div className="flex items-center text-amber-500 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(Number(averageRating))
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-300'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1">
                out of 5
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-navy">
                {totalReviewCount > 0 ? `${totalReviewCount} Customer Ratings` : 'No ratings yet'}
              </h3>
              <p className="text-xs text-slate-500">
                {totalReviewCount > 0 
                  ? 'Calculated from genuine purchases and verified community ratings.' 
                  : 'Be the first customer to share your experience with this item!'}
              </p>
            </div>
          </div>

          {/* Interactive Star Distribution Progress Bars */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Star Breakdown</span>
              {selectedStarFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter(null)}
                  className="text-[#A44101] hover:underline text-[11px] font-extrabold cursor-pointer"
                >
                  Clear Filter (Show All)
                </button>
              )}
            </div>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] || 0;
              const pct = totalReviewCount > 0 ? Math.round((count / totalReviewCount) * 100) : 0;
              const isSelected = selectedStarFilter === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                  className={`w-full group flex items-center gap-3 p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-orange-50 border border-orange-200 font-black' 
                      : 'hover:bg-slate-50'
                  }`}
                  title={`Filter by ${star} star reviews (${count})`}
                >
                  <span className="w-10 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  </span>

                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-[#A44101]' : 'bg-amber-400 group-hover:bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-xs font-semibold text-slate-500 shrink-0">
                    {pct}% <span className="text-[10px] text-slate-400">({count})</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-[11px] text-slate-600 font-semibold">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Genuine Reviews</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Verified Purchases</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. RIGHT COLUMN: SUBMISSION FORM + REVIEWS LIST
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">

          {/* Already Submitted Banner */}
          {myReview && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold">
                  You have already reviewed this product!
                </p>
                <p className="text-xs text-emerald-700">
                  Rated {myReview.rating}★: "{myReview.comment || 'No comment provided'}"
                  {myReview.isActive === false && ' (Pending moderation approval)'}
                </p>
              </div>
            </div>
          )}

          {/* Write Review Box (Collapsible / Toggleable) */}
          {isFormOpen && !myReview && (
            <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-md space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-navy">Write Your Review</h3>
                    <p className="text-[11px] text-slate-500">Share your genuine experience with other buyers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* 1. Star Rating Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Overall Rating <span className="text-[#A44101]">*</span>
                  </label>
                  <StarRatingInput value={rating} onChange={setRating} size="lg" />
                </div>

                {/* 2. Comment Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Your Comments &amp; Feedback
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {comment.length} / 2000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you love about the fabric, fit, design, or durability? What should others know?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-y"
                  />
                </div>

                {/* 3. Image Uploader */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Attach Real Photos <span className="text-[11px] font-normal text-slate-400">(Optional, max 4 photos)</span>
                  </label>

                  {/* Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mb-3">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < 4 && (
                    <label className="border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/70 hover:bg-orange-50/40 transition-all">
                      <UploadCloud className="w-5 h-5 text-[#A44101]" />
                      <span className="text-xs font-bold text-navy">Click to browse photos</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Submit Button & Moderation Notice */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">
                    ℹ Reviews are inspected by moderators to prevent spam and maintain trust.
                  </p>

                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-60 active:scale-95 shrink-0"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Review</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter by:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedStarFilter === null
                      ? 'bg-navy text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All ({reviews.length})
                </button>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStarFilter(selectedStarFilter === star ? null : star)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedStarFilter === star
                        ? 'bg-[#A44101] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{star}</span>
                    <Star className={`w-3 h-3 ${selectedStarFilter === star ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs font-bold text-slate-400">
              Showing {filteredReviews.length} reviews
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-28 bg-slate-200 rounded" />
                      <div className="h-2 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Reviews List */}
          {!isLoading && filteredReviews.length > 0 && (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const authorName = review.displayName || review.author || 'Customer';
                const initial = getAuthorInitial(authorName);
                const reviewImages = Array.isArray(review.images) ? review.images : [];

                return (
                  <article
                    key={review.id || review._id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    {/* Author & Rating Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#A44101] to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-navy">
                              {authorName}
                            </span>
                            {review.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Purchase</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Rating Stars Badge */}
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 font-black text-xs shrink-0">
                        <span>{review.rating}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                    </div>

                    {/* Review Text */}
                    {review.comment ? (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400">
                        Rated {review.rating} stars with no comment.
                      </p>
                    )}

                    {/* Customer Photos Gallery */}
                    {reviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {reviewImages.map((imgItem, idx) => {
                          const url = typeof imgItem === 'string' ? imgItem : imgItem?.url;
                          if (!url) return null;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLightboxUrl(url)}
                              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-[#A44101] transition-all cursor-pointer group"
                            >
                              <img
                                src={url}
                                alt={`Customer photo ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredReviews.length === 0 && (
            <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#A44101] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-navy">
                {selectedStarFilter !== null
                  ? `No ${selectedStarFilter}-star reviews yet`
                  : 'No reviews yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {selectedStarFilter !== null
                  ? 'Try selecting a different star filter or show all reviews.'
                  : 'Be the first customer to share your thoughts and help others make great choices.'}
              </p>
              {!myReview && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuth) {
                      requireAuth({ message: 'Please log in to write a review' });
                    } else {
                      setIsFormOpen(true);
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A44101] text-white text-xs font-bold hover:bg-[#8C3701] cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write the First Review</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          3. FULL-SIZE PHOTO LIGHTBOX MODAL
         ========================================================================= */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setLightboxUrl(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-all cursor-pointer"
              aria-label="Close photo view"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={lightboxUrl} 
              alt="Full size customer photo" 
              className="max-h-[85vh] w-auto object-contain rounded-xl mx-auto" 
            />
          </div>
        </div>
      )}
    </section>
  );
};
