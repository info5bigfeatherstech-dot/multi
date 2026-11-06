import React, { useState, useMemo } from 'react';
import { 
  Star, 
  CheckCircle2, 
  X, 
  UploadCloud, 
  MessageSquare, 
  Loader2 
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
  productRating?: number;
  productReviewsCount?: number;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productTitle: _productTitle = 'this product',
  productRating,
  productReviewsCount,
}) => {
  const isAuth = isAuthenticated();
  
  // Data queries via Redux / React Query architecture
  const { data, isLoading, refetch } = useProductReviews(productId);
  const { data: myReview } = useMyProductReview(productId);
  const { data: eligibility } = useProductReviewEligibility(productId);
  const submitMutation = useSubmitProductReview(productId);

  // Filter state (clicking star progress bar filters reviews)
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);

  // Write Review Form State - initial rating starts at 0 so user explicitly chooses
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Lightbox Modal for enlarged photo view
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Summary and review list data
  const summary = data?.summary;
  const reviews = data?.reviews || [];

  // Display only real reviews from API
  const displayReviews = reviews;

  const totalReviewCount = summary?.count !== undefined && summary.count > 0
    ? summary.count 
    : (summary?.reviewCount !== undefined && summary.reviewCount > 0 
        ? summary.reviewCount 
        : (reviews.length > 0 ? reviews.length : (productReviewsCount && productReviewsCount > 0 ? productReviewsCount : 0)));

  const rawAvg = summary?.average !== undefined && summary.average !== null && summary.average > 0
    ? Number(summary.average)
    : (summary?.averageRating !== undefined && summary.averageRating !== null && summary.averageRating > 0
        ? Number(summary.averageRating)
        : (reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length)
            : (productRating && productRating > 0 ? productRating : 0)));

  const averageRating = rawAvg > 0 ? rawAvg.toFixed(1) : (productRating && productRating > 0 ? productRating.toFixed(1) : '0.0');

  // Distribution calculation: uses summary distribution or calculates from reviews
  const distribution = useMemo(() => {
    if (summary?.distribution && Object.values(summary.distribution).some((v) => Number(v) > 0)) {
      return {
        '5': Number(summary.distribution[5] ?? 0),
        '4': Number(summary.distribution[4] ?? 0),
        '3': Number(summary.distribution[3] ?? 0),
        '2': Number(summary.distribution[2] ?? 0),
        '1': Number(summary.distribution[1] ?? 0),
      };
    }
    if (summary?.starDistribution && Object.values(summary.starDistribution).some((v) => Number(v) > 0)) {
      return { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, ...summary.starDistribution };
    }
    const dist: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    if (reviews.length > 0) {
      reviews.forEach((r) => {
        const star = String(Math.round(r.rating || 0));
        if (dist[star] !== undefined) {
          dist[star] += 1;
        }
      });
      return dist;
    }
    return dist;
  }, [summary, reviews]);

  // Filtered reviews list based on active star filter
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === null) return displayReviews;
    return displayReviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [displayReviews, selectedStarFilter]);

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

  // Submit review handler with guards, validation, and query invalidation
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Auth Guard
    if (!isAuth) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_redirect_url', window.location.href);
      }
      requireAuth({ 
        message: 'Please log in to submit a review',
        redirectTo: window.location.pathname + window.location.search,
      });
      return;
    }

    // 2. Duplicate Prevention Guard
    if (myReview) {
      toast.error('You have already submitted a review for this product.');
      return;
    }

    // 3. Validation
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please choose a star rating from 1 to 5');
      return;
    }

    const trimmedComment = comment.trim();

    try {
      await submitMutation.mutateAsync({
        rating,
        comment: trimmedComment,
        orderId: eligibility?.orderId || undefined,
        images,
      });

      toast.success('Thank you! Your review has been submitted successfully.');
      // 6. On Success: Reset form state and invalidate queries
      setRating(0);
      setComment('');
      setImages([]);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      if (refetch) {
        refetch();
      }
    } catch (err: any) {
      // 5. On Error: Display error alert, keeping the user's typed comment and rating intact
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
            Real feedback and ratings from customers who purchased this item.
          </p>
        </div>

        {myReview && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Review Submitted</span>
          </div>
        )}
      </div>

      {/* Main Grid: Summary & Write Review Card (Left) + Content (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =========================================================================
            1. CUSTOMER REVIEWS & WRITE A REVIEW CARD (matching user reference)
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Header */}
          <h3 className="text-base sm:text-lg font-bold text-navy">
            Customer reviews
          </h3>

          {/* Rating Summary Line: 4.6 ★★★★★ 186 ratings */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              {averageRating}
            </span>
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400' 
                      : 'text-slate-200'
                  }`} 
                />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {totalReviewCount > 0 ? `${totalReviewCount} ratings` : '0 ratings'}
            </span>
          </div>

          {/* Star Breakdown Progress Bars */}
          <div className="space-y-2 pt-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[String(star)] || 0;
              const pct = totalReviewCount > 0 ? Math.round((count / totalReviewCount) * 100) : 0;
              const isSelected = selectedStarFilter === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                  className={`w-full group flex items-center gap-3 py-1 px-1.5 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected ? 'bg-orange-50/80 font-bold' : 'hover:bg-slate-50'
                  }`}
                  title={`Filter by ${star} star reviews (${count})`}
                >
                  <span className="w-12 text-xs text-slate-600 font-medium shrink-0">
                    {star} star
                  </span>

                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSelected ? 'bg-[#A44101]' : 'bg-amber-400 group-hover:bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-xs text-slate-500 font-medium shrink-0">
                    {pct}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <hr className="border-slate-200" />

          {/* WRITE A REVIEW INLINE BOX */}
          {myReview ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>You have already reviewed this product</span>
              </div>
              <p className="text-xs text-emerald-700">
                Rated {myReview.rating}★: "{myReview.comment || 'No comment provided'}"
                {myReview.isActive === false && ' (Pending moderation approval)'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  WRITE A REVIEW
                </span>
                {!isAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('auth_redirect_url', window.location.href);
                      }
                      requireAuth({ 
                        message: 'Please log in to submit a review',
                        redirectTo: window.location.pathname + window.location.search,
                      });
                    }}
                    className="text-[10px] text-[#A44101] font-bold hover:underline cursor-pointer"
                  >
                    Login to post
                  </button>
                )}
              </div>

              {/* Star Rating Picker */}
              <div>
                <StarRatingInput value={rating} onChange={setRating} size="md" />
              </div>

              {/* Textarea Form */}
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <textarea
                  id="write-review-input"
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product... (optional)"
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] resize-none transition-all placeholder:text-slate-400"
                />

                {/* Optional Photo Attachment */}
                <div className="space-y-2">
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < 4 && (
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#A44101] cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5 text-[#A44101]" />
                      <span>Attach photos (optional, up to 4)</span>
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

                {/* Submit Review Button */}
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>SUBMITTING...</span>
                    </>
                  ) : (
                    <span>SUBMIT REVIEW</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. RIGHT COLUMN: REVIEWS FILTER & LIST
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">

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
                  All ({displayReviews.length})
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
              {filteredReviews.map((review: any) => {
                const authorName: string = typeof review.author === 'string' 
                  ? review.author 
                  : (review.author?.name || review.displayName || 'Customer');
                const authorAvatar = typeof review.author === 'object' ? review.author?.avatar : undefined;
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
                        {authorAvatar ? (
                          <img 
                            src={authorAvatar} 
                            alt={authorName} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#A44101] to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                            {initial}
                          </div>
                        )}
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
                        {reviewImages.map((imgItem: any, idx: number) => {
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
                    const el = document.getElementById('write-review-input');
                    if (el) {
                      el.focus();
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A44101] text-white text-xs font-bold hover:bg-[#8C3701] cursor-pointer shadow-xs active:scale-98"
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
