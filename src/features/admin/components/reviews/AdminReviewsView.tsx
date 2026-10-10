import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  BarChart2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Trash2, 
  Loader2, 
  Sparkles, 
  X, 
  User, 
  ShoppingBag
} from 'lucide-react';
import { adminReviewsApi, AdminReviewItem, adminProductsApi } from '../../../../api/adminApi';
import { toast } from 'react-hot-toast';

export type ReviewSubTab = 'product-reviews' | 'customer-reviews' | 'review-management' | 'review-reports';

interface AdminReviewsViewProps {
  initialSubTab?: ReviewSubTab;
}

export const AdminReviewsView: React.FC<AdminReviewsViewProps> = ({
  initialSubTab = 'product-reviews',
}) => {
  const [activeTab, setActiveTab] = useState<ReviewSubTab>(initialSubTab);
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  
  // Custom Review Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Array<{ id: string; title: string; image?: string }>>([]);
  const [genProductId, setGenProductId] = useState<string>('');
  const [genDisplayName, setGenDisplayName] = useState<string>('');
  const [genRating, setGenRating] = useState<number>(5);
  const [genComment, setGenComment] = useState<string>('');
  const [genIsActive, setGenIsActive] = useState<boolean>(true);
  const [isSubmittingGen, setIsSubmittingGen] = useState<boolean>(false);

  // Status Toggling loading indicator
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  // Fetch reviews from GET /admin/product-reviews
  const fetchReviews = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await adminReviewsApi.list({ limit: 100 });
      const list = res?.reviews || res?.data || (Array.isArray(res) ? res : []);
      setReviews(list);

      if (showToast) {
        toast.success(`Reviews synced! (${list.length} total)`);
      }
    } catch {
      toast.error('Could not load reviews from API');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Load products list for dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await adminProductsApi.getAll({ limit: 100 });
        const prods = res?.products || res?.data || (Array.isArray(res) ? res : []);
        const mapped = prods.map((p: any) => ({
          id: p._id || p.id,
          title: p.title || p.name || 'Untitled',
          image: p.image?.url || p.imageUrl || p.variants?.[0]?.images?.[0]?.url || ''
        }));
        setProductsList(mapped);
        if (mapped.length > 0 && !genProductId) {
          setGenProductId(mapped[0].id);
        }
      } catch {}
    };
    loadProducts();
  }, [genProductId]);

  // Handle Approve / Deactivate status
  const handleToggleStatus = async (id: string, newActive: boolean) => {
    try {
      setTogglingId(id);
      await adminReviewsApi.patchStatus(id, newActive);
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isActive: newActive } : r))
      );
      toast.success(newActive ? 'Review approved & published!' : 'Review hidden from store');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update review status');
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Delete generated review
  const handleDeleteGenerated = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom review?')) return;
    try {
      await adminReviewsApi.deleteGenerated(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      toast.success('Custom review deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete review');
    }
  };

  // Handle Create Generated Custom Review
  const handleSubmitGenerateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!genDisplayName.trim()) {
      toast.error('Please enter a reviewer display name');
      return;
    }
    if (!genComment.trim()) {
      toast.error('Please enter review comments');
      return;
    }

    try {
      setIsSubmittingGen(true);
      await adminReviewsApi.createGenerated({
        productId: genProductId,
        rating: genRating,
        comment: genComment.trim(),
        displayName: genDisplayName.trim(),
        isActive: genIsActive,
      });

      toast.success('Custom review generated & published successfully!');
      setIsGenerateModalOpen(false);
      setGenComment('');
      setGenDisplayName('');
      setGenRating(5);
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate review');
    } finally {
      setIsSubmittingGen(false);
    }
  };

  // Filter Reviews based on tab, search, rating
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    // Tab filter
    if (activeTab === 'customer-reviews') {
      list = list.filter((r) => r.source === 'customer');
    } else if (activeTab === 'review-management') {
      // Moderation queue: pending reviews (isActive === false)
      list = list.filter((r) => !r.isActive);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.comment.toLowerCase().includes(q) ||
          (r.displayName && r.displayName.toLowerCase().includes(q)) ||
          (r.customer?.name && r.customer.name.toLowerCase().includes(q)) ||
          (r.product?.title && r.product.title.toLowerCase().includes(q))
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const star = Number(ratingFilter);
      list = list.filter((r) => r.rating === star);
    }

    return list;
  }, [reviews, activeTab, searchQuery, ratingFilter]);

  // Review Metrics
  const pendingCount = useMemo(() => reviews.filter((r) => !r.isActive).length, [reviews]);
  const activeCount = useMemo(() => reviews.filter((r) => r.isActive).length, [reviews]);
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs shrink-0">
            <Star className="w-6 h-6 stroke-[2.2] fill-[#A44101]/20" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                Reviews &amp; Ratings
              </h1>
              {pendingCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80 animate-pulse">
                  {pendingCount} Pending Moderation
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Moderate verified customer feedback, monitor product satisfaction metrics, and create custom generated reviews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchReviews(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 active:scale-95"
            title="Refresh review feed from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#A44101]' : ''}`} />
            <span>Sync API</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8d3600] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Custom Review</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('product-reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'product-reviews'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Product Reviews</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'product-reviews' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {reviews.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customer-reviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'customer-reviews'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Reviews</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'customer-reviews' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {reviews.filter((r) => r.source === 'customer').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review-management')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'review-management'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Review Management</span>
          {pendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'review-management' ? 'bg-white text-[#A44101]' : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              {pendingCount} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review-reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'review-reports'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Review Reports</span>
        </button>
      </div>

      {/* 3. Metrics Cards (Only in product-reviews and review-reports) */}
      {(activeTab === 'product-reviews' || activeTab === 'review-reports') && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Reviews</span>
            <span className="text-2xl font-black text-navy mt-1 block">{reviews.length}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{activeCount} published live</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Rating</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-black text-navy">{averageRating}</span>
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-4 h-4 ${s <= Math.round(Number(averageRating)) ? 'fill-amber-400' : 'text-slate-200'}`} 
                  />
                ))}
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">Storefront Satisfaction</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Moderation</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Require admin approval</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Custom Generated</span>
            <span className="text-2xl font-black text-[#A44101] mt-1 block">
              {reviews.filter((r) => r.source === 'admin').length}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Admin marketing reviews</span>
          </div>
        </div>
      )}

      {/* 4. Filter Bar */}
      {activeTab !== 'review-reports' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reviews by comment, product title, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-[#A44101] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Rating:</span>
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-navy focus:outline-none focus:border-[#A44101] cursor-pointer"
            >
              <option value="all">All Stars (1 - 5★)</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>
          </div>
        </div>
      )}

      {/* 5. Main Tab Content */}
      {activeTab === 'review-reports' ? (
        /* REPORTS / ANALYTICS VIEW */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <h3 className="text-base font-bold text-navy">Ratings &amp; Reviews Breakdown</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="w-12 font-bold text-slate-600 flex items-center gap-1">
                    <span>{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-16 font-mono font-bold text-slate-500 text-right">{count} ({percent}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* REVIEWS LIST / TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Querying GET /admin/product-reviews...</span>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-20 px-4 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] mx-auto shadow-inner">
                <Star className="w-8 h-8 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy">
                  {searchQuery ? 'No Matching Reviews' : 'No Reviews Found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeTab === 'review-management'
                    ? 'All reviews are reviewed! No pending customer reviews require moderation right now.'
                    : 'Click "Generate Custom Review" above to seed a review on any product.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#A44101] hover:bg-[#8d3600] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Generate Review
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReviews.map((review) => {
                const isTogglingThis = togglingId === review._id;
                const authorName = review.source === 'admin'
                  ? (review.displayName || 'Admin Custom')
                  : (review.customer?.name || review.displayName || 'Verified Buyer');

                return (
                  <div key={review._id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      {/* Product & Author Header */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {review.product && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/60">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#A44101]" />
                            <span className="max-w-[200px] truncate">{review.product.title || review.product.name}</span>
                          </div>
                        )}

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          review.source === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {review.source === 'admin' ? 'Custom Generated' : 'Customer Review'}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          review.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {review.isActive ? 'Published / Active' : 'Pending Moderation'}
                        </span>
                      </div>

                      {/* Stars & Author Details */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`w-4 h-4 ${s <= review.rating ? 'fill-amber-400' : 'text-slate-200'}`} 
                            />
                          ))}
                        </div>

                        <span className="font-bold text-xs text-navy flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{authorName}</span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Review Comment */}
                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        "{review.comment || 'No comment text provided'}"
                      </p>
                    </div>

                    {/* Actions: Approve / Hide / Delete */}
                    <div className="flex items-center md:flex-col gap-2 shrink-0 justify-end pt-2 md:pt-0">
                      {review.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(review._id, false)}
                          disabled={isTogglingThis}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Hide from customer storefront"
                        >
                          {isTogglingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                          <span>Hide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(review._id, true)}
                          disabled={isTogglingThis}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                          title="Approve & publish to storefront"
                        >
                          {isTogglingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Approve</span>
                        </button>
                      )}

                      {review.source === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGenerated(review._id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete generated review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: GENERATE CUSTOM REVIEW (POST /admin/product-reviews/generated)
          ========================================================================= */}
      {isGenerateModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-[#333333]/85 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGenerateModalOpen(false);
          }}
        >
          <div className="bg-white rounded-[26px] max-w-lg w-full p-7 sm:p-8 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4 animate-scaleUp text-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A44101]" />
                  <span>Generate Custom Review</span>
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  POST /api/admin/product-reviews/generated
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGenerateReview} className="space-y-4 text-xs">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Product *
                </label>
                <select
                  value={genProductId}
                  onChange={(e) => setGenProductId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
                >
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Customer Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={genDisplayName}
                  onChange={(e) => setGenDisplayName(e.target.value)}
                  placeholder="e.g. Priya Sharma, Vikram M., Verified Buyer"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-orange-200 focus:border-[#A44101] text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              {/* Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Star Rating (1 - 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGenRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 ${s <= genRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                      />
                    </button>
                  ))}
                  <span className="font-extrabold text-sm text-navy ml-2">{genRating} / 5 Stars</span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Review Comment *
                </label>
                <textarea
                  rows={4}
                  required
                  value={genComment}
                  onChange={(e) => setGenComment(e.target.value)}
                  placeholder="Share a realistic, positive product experience highlighting quality, packaging, and fast shipping..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101] resize-none"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={genIsActive}
                  onChange={(e) => setGenIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-bold text-slate-800 text-xs">Publish immediately to storefront</span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-6 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGen}
                  className="px-6 py-2.5 rounded-full bg-[#A44101] hover:bg-[#8d3600] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isSubmittingGen && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Generate Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
