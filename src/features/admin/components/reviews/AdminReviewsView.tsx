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
  Trash2, 
  Edit3,
  Loader2, 
  Sparkles, 
  X, 
  ShoppingBag,
  Check,
  Plus
} from 'lucide-react';
import { adminReviewsApi, AdminReviewItem, adminProductsApi } from '../../../../api/adminApi';
import { toast } from 'react-hot-toast';

export type ReviewSubTab = 
  | 'customer-reviews' 
  | 'submissions'
  | 'generated' 
  | 'product-reviews' 
  | 'review-management' 
  | 'review-reports';

interface AdminReviewsViewProps {
  initialSubTab?: ReviewSubTab;
}

export const AdminReviewsView: React.FC<AdminReviewsViewProps> = ({
  initialSubTab = 'customer-reviews',
}) => {
  const [activeTab, setActiveTab] = useState<ReviewSubTab>(
    initialSubTab === 'submissions' ? 'customer-reviews' : initialSubTab
  );
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all' | 'live' | 'hidden'
  
  // Custom Review Generation State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Array<{ id: string; title: string; image?: string; sku?: string }>>([]);
  const [genProductId, setGenProductId] = useState<string>('');
  const [genDisplayName, setGenDisplayName] = useState<string>('');
  const [genRating, setGenRating] = useState<number>(5);
  const [genComment, setGenComment] = useState<string>('');
  const [genIsActive, setGenIsActive] = useState<boolean>(true);
  const [isSubmittingGen, setIsSubmittingGen] = useState<boolean>(false);

  // Edit Generated Review Modal State
  const [editingReview, setEditingReview] = useState<AdminReviewItem | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editComment, setEditComment] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // Lightbox Preview for Photos
  const [adminLightboxUrl, setAdminLightboxUrl] = useState<string | null>(null);

  // Status Toggling loading indicator
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialSubTab === 'submissions' ? 'customer-reviews' : initialSubTab);
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
          sku: p.variants?.[0]?.sku || p.sku || p.productCode || '',
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
      toast.success(newActive ? 'Review approved & live!' : 'Review hidden from store');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update review status');
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Delete generated review
  const handleDeleteGenerated = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this seeded review?')) return;
    try {
      await adminReviewsApi.deleteGenerated(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      toast.success('Seeded review deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete review');
    }
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (review: AdminReviewItem) => {
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditDisplayName(review.displayName || '');
    setEditComment(review.comment || '');
    setEditIsActive(review.isActive !== false);
  };

  // Handle Submit Edit Generated Review
  const handleSubmitEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (!editDisplayName.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (!editComment.trim()) {
      toast.error('Comment is required');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      await adminReviewsApi.updateGenerated(editingReview._id, {
        rating: editRating,
        displayName: editDisplayName.trim(),
        comment: editComment.trim(),
        isActive: editIsActive,
      });

      setReviews((prev) =>
        prev.map((r) =>
          r._id === editingReview._id
            ? {
                ...r,
                rating: editRating,
                displayName: editDisplayName.trim(),
                comment: editComment.trim(),
                isActive: editIsActive,
              }
            : r
        )
      );

      toast.success('Seeded review updated successfully!');
      setEditingReview(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update seeded review');
    } finally {
      setIsSubmittingEdit(false);
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

      toast.success('Seeded review created & published successfully!');
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

  // Filter Reviews based on tab, search, rating, status
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    // Subtab filter
    if (activeTab === 'customer-reviews' || activeTab === 'submissions') {
      list = list.filter((r) => r.source === 'customer');
    } else if (activeTab === 'generated') {
      list = list.filter((r) => r.source === 'admin');
    } else if (activeTab === 'review-management') {
      // Moderation queue: pending reviews (isActive === false)
      list = list.filter((r) => !r.isActive);
    }

    // Status filter
    if (statusFilter === 'live') {
      list = list.filter((r) => r.isActive);
    } else if (statusFilter === 'hidden') {
      list = list.filter((r) => !r.isActive);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const star = Number(ratingFilter);
      list = list.filter((r) => r.rating === star);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.comment.toLowerCase().includes(q) ||
          (r.displayName && r.displayName.toLowerCase().includes(q)) ||
          (r.customer?.name && r.customer.name.toLowerCase().includes(q)) ||
          (r.product?.title && r.product.title.toLowerCase().includes(q)) ||
          (r.product?.slug && r.product.slug.toLowerCase().includes(q))
      );
    }

    return list;
  }, [reviews, activeTab, statusFilter, ratingFilter, searchQuery]);

  // Review Metrics
  const pendingCount = useMemo(() => reviews.filter((r) => !r.isActive).length, [reviews]);
  const activeCount = useMemo(() => reviews.filter((r) => r.isActive).length, [reviews]);
  const customerCount = useMemo(() => reviews.filter((r) => r.source === 'customer').length, [reviews]);
  const generatedCount = useMemo(() => reviews.filter((r) => r.source === 'admin').length, [reviews]);
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
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
                Reviews Moderation &amp; Management
              </h1>
              {pendingCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/80 animate-pulse">
                  {pendingCount} Pending Moderation
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Inspect customer submissions, toggle live/hidden status, seed curated reviews, and monitor star distribution.
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
            <span>Generate Seeded Review</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 overflow-x-auto text-xs font-bold">
        {/* Customer Submissions Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('customer-reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'customer-reviews' || activeTab === 'submissions'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Submissions</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'customer-reviews' || activeTab === 'submissions' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {customerCount}
          </span>
        </button>

        {/* Generated Reviews Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('generated')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'generated'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generated Reviews</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'generated' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {generatedCount}
          </span>
        </button>

        {/* All Product Reviews Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('product-reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'product-reviews'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>All Reviews</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeTab === 'product-reviews' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {reviews.length}
          </span>
        </button>

        {/* Moderation Queue Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('review-management')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'review-management'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Moderation Queue</span>
          {pendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'review-management' ? 'bg-white text-[#A44101]' : 'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
              {pendingCount} Pending
            </span>
          )}
        </button>

        {/* Reports Tab */}
        <button
          type="button"
          onClick={() => setActiveTab('review-reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'review-reports'
              ? 'bg-[#A44101] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Star Analytics</span>
        </button>
      </div>

      {/* 3. Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  className={`w-3.5 h-3.5 ${s <= Math.round(Number(averageRating)) ? 'fill-amber-400' : 'text-slate-200'}`} 
                />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Storefront blended score</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer Submissions</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{customerCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Organic customer feedback</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Moderation</span>
          <span className={`text-2xl font-black mt-1 block ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {pendingCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting approval</span>
        </div>
      </div>

      {/* 4. Quick Creation Form for Generated Reviews tab */}
      {activeTab === 'generated' && (
        <div className="bg-white rounded-2xl p-6 border-2 border-orange-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#A44101] flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-navy">Quick Create Seeded Review</h3>
                <p className="text-[11px] text-slate-500">Seed a curated product review with custom author name and rating</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">POST /api/admin/product-reviews/generated</span>
          </div>

          <form onSubmit={handleSubmitGenerateReview} className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
            {/* Product Lookup */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Product / SKU <span className="text-[#A44101]">*</span>
              </label>
              <select
                value={genProductId}
                onChange={(e) => setGenProductId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
              >
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Display Name */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Name <span className="text-[#A44101]">*</span>
              </label>
              <input
                type="text"
                required
                value={genDisplayName}
                onChange={(e) => setGenDisplayName(e.target.value)}
                placeholder="e.g. Rahul M., Ananya S."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-navy focus:outline-none focus:border-[#A44101]"
              />
            </div>

            {/* Star Rating */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rating: <strong className="text-amber-600">{genRating}★</strong>
              </label>
              <div className="flex items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setGenRating(s)}
                    className="p-1 cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star className={`w-5 h-5 ${s <= genRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Live Toggle */}
            <div className="sm:col-span-2 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genIsActive}
                  onChange={(e) => setGenIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#A44101] accent-[#A44101]"
                />
                <span className="font-bold text-slate-700 text-xs">Live Now</span>
              </label>
            </div>

            {/* Comment Field */}
            <div className="sm:col-span-10">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Review Comments <span className="text-[#A44101]">*</span>
              </label>
              <input
                type="text"
                required
                value={genComment}
                onChange={(e) => setGenComment(e.target.value)}
                placeholder="e.g. Exceptional fabric quality, perfect fit, and fast delivery!"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101]"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isSubmittingGen}
                className="w-full py-2 px-3 rounded-xl bg-[#A44101] hover:bg-[#8d3600] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
              >
                {isSubmittingGen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Add Review</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Filter Bar (Filter by rating, status, or search query) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, customer, keyword..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
            />
          </div>

          {/* Rating Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
            >
              <option value="all">All Stars</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live / Active</option>
              <option value="hidden">Hidden / Pending</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400">
          Showing {filteredReviews.length} of {reviews.length} reviews
        </div>
      </div>

      {/* 6. TABULAR LIST / TABLE VIEW */}
      {activeTab === 'review-reports' ? (
        /* Review Breakdown Chart */
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-base font-extrabold text-navy">Rating Distribution Breakdown</h3>
          <div className="space-y-3 max-w-md">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;

              return (
                <div key={star} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <div className="w-16 flex items-center gap-1 shrink-0">
                    <span>{star} Stars</span>
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
        /* TABULAR REVIEW LIST */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Loading reviews from database...</span>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] mx-auto shadow-inner">
                <Star className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-base font-black text-navy">
                  {searchQuery ? 'No Matching Reviews' : 'No Reviews Found in This View'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeTab === 'review-management'
                    ? 'All reviews are approved! There are no pending reviews requiring moderation.'
                    : activeTab === 'generated'
                      ? 'No custom generated reviews exist yet. Use the form above to seed one!'
                      : 'No customer reviews submitted yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3">Rating</th>
                    <th className="py-3 px-4">Review Comment</th>
                    <th className="py-3 px-3">Photos</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReviews.map((review) => {
                    const isToggling = togglingId === review._id;
                    const authorName = review.source === 'admin'
                      ? (review.displayName || 'Admin Seeded')
                      : (review.customer?.name || review.displayName || 'Customer');
                    const reviewImages = Array.isArray(review.images) ? review.images : [];
                    const formattedDate = review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : '—';

                    return (
                      <tr 
                        key={review._id} 
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* 1. Product Column */}
                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-2.5">
                            {review.product?.thumb ? (
                              <img
                                src={review.product.thumb}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold text-navy truncate block">
                                {review.product?.title || review.product?.name || 'Product'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                ID: {review.product?._id ? review.product._id.slice(-6) : review._id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Customer Column */}
                        <td className="py-3 px-4 max-w-[160px]">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {authorName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {review.source === 'admin' ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                                  Seeded
                                </span>
                              ) : review.verifiedPurchase ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  Organic
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Rating Column */}
                        <td className="py-3 px-3 shrink-0">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 font-black">
                            <span>{review.rating}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </div>
                        </td>

                        {/* 4. Comment Column */}
                        <td className="py-3 px-4 max-w-[280px]">
                          <p className="text-slate-700 line-clamp-2 leading-relaxed" title={review.comment}>
                            {review.comment || <span className="italic text-slate-400">No comment</span>}
                          </p>
                        </td>

                        {/* 5. Photos Column */}
                        <td className="py-3 px-3">
                          {reviewImages.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {reviewImages.map((img, i) => {
                                const url = typeof img === 'string' ? img : img?.url;
                                if (!url) return null;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setAdminLightboxUrl(url)}
                                    className="w-7 h-7 rounded-md overflow-hidden border border-slate-200 hover:border-[#A44101] cursor-pointer"
                                    title="View full image"
                                  >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">None</span>
                          )}
                        </td>

                        {/* 6. Date Column */}
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {formattedDate}
                        </td>

                        {/* 7. Status Column */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            review.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${review.isActive ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                            <span>{review.isActive ? 'Live' : 'Hidden'}</span>
                          </span>
                        </td>

                        {/* 8. Action Toggle & Admin Options */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Live / Hidden Status button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(review._id, !review.isActive)}
                              disabled={isToggling}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                review.isActive
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                              title={review.isActive ? 'Hide review from storefront' : 'Approve and publish review to storefront'}
                            >
                              {isToggling ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : review.isActive ? (
                                <XCircle className="w-3 h-3 text-slate-500" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>{review.isActive ? 'Hide' : 'Publish'}</span>
                            </button>

                            {/* Edit Action for seeded reviews */}
                            {review.source === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(review)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit seeded review"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Action for seeded reviews */}
                            {review.source === 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteGenerated(review._id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete seeded review"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: GENERATE CUSTOM SEEDED REVIEW (POST /admin/product-reviews/generated)
          ========================================================================= */}
      {isGenerateModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-[#333333]/85 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsGenerateModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4 animate-scaleUp text-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A44101]" />
                  <span>Generate Seeded Review</span>
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
                      {p.title} {p.sku ? `(${p.sku})` : ''}
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
                  placeholder="e.g. Rahul M., Priya Sharma, Verified Buyer"
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
                  placeholder="Share a realistic, positive product experience highlighting quality, packaging, and fit..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101] resize-none"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={genIsActive}
                  onChange={(e) => setGenIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#A44101] accent-[#A44101] cursor-pointer"
                />
                <span className="font-bold text-slate-800 text-xs">Publish immediately to storefront (Live)</span>
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

      {/* =========================================================================
          MODAL: EDIT GENERATED REVIEW (PUT /admin/product-reviews/generated/:id)
          ========================================================================= */}
      {editingReview && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-[#333333]/85 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingReview(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4 animate-scaleUp text-slate-800">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  <span>Edit Seeded Review</span>
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  PUT /api/admin/product-reviews/generated/{editingReview._id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditReview} className="space-y-4 text-xs">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Author / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#A44101] text-xs font-bold text-slate-900 focus:outline-none"
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
                      onClick={() => setEditRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 ${s <= editRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                      />
                    </button>
                  ))}
                  <span className="font-extrabold text-sm text-navy ml-2">{editRating} / 5 Stars</span>
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
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#A44101] resize-none"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#A44101] accent-[#A44101] cursor-pointer"
                />
                <span className="font-bold text-slate-800 text-xs">Live on customer storefront</span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-6 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 rounded-full bg-[#A44101] hover:bg-[#8d3600] text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isSubmittingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          LIGHTBOX FOR ADMIN REVIEW PHOTOS
          ========================================================================= */}
      {adminLightboxUrl && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setAdminLightboxUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setAdminLightboxUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={adminLightboxUrl} alt="Review attachment" className="max-h-[80vh] w-auto object-contain rounded-xl mx-auto" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminReviewsView;
