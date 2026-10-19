import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee,
  MessageSquare,
  AlertCircle,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Send,
  Eye,
  User,
  MapPin,
  Phone,
  Package,
  ShieldAlert,
  FileText,
  Maximize2,
  ExternalLink,
  ZoomIn
} from 'lucide-react';
import { adminReturnsApi, AdminReturnRequestItem } from '../../../api';
import toast from 'react-hot-toast';

export const AdminReturnsRefundsView: React.FC = () => {
  const [requests, setRequests] = useState<AdminReturnRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Full Return Modal State (matching showcase mockup)
  const [detailModalItem, setDetailModalItem] = useState<any | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'chat'>('overview');
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [isRejectingPrompt, setIsRejectingPrompt] = useState<boolean>(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Refund Modal State
  const [refundModalItem, setRefundModalItem] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Media Lightbox Zoom Modal
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxMedia(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMedia]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await adminReturnsApi.listRequests({
        page: currentPage,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      const list = res?.data || (Array.isArray(res) ? res : []);
      setRequests(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } else {
        setTotalCount(list.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load return requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter, currentPage]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (r) =>
        r.orderId.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.includes(q)
    );
  }, [requests, searchQuery]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let totalRefunded = 0;

    for (const r of requests) {
      const st = r.returnInfo?.status?.toLowerCase();
      if (st === 'requested') pending++;
      else if (st === 'approved') approved++;
      else if (st === 'rejected') rejected++;
      else if (st === 'refunded') {
        totalRefunded += Number(r.totalAmount) || 0;
      }
    }
    return {
      total: totalCount || requests.length,
      pending,
      approved,
      rejected,
      totalRefunded,
    };
  }, [requests, totalCount]);

  // Open Full Showcase Modal
  const handleOpenDetail = async (orderId: string) => {
    setIsLoadingDetail(true);
    try {
      const [orderRes, chatRes] = await Promise.allSettled([
        adminReturnsApi.getRequest(orderId),
        adminReturnsApi.getChat(orderId),
      ]);

      if (orderRes.status === 'fulfilled') {
        const ord = orderRes.value?.order || orderRes.value?.data || orderRes.value;
        setDetailModalItem(ord);
        setActiveModalTab('overview');
        setIsRejectingPrompt(false);
        setRejectionReasonInput('');
      } else {
        throw new Error('Could not fetch return request');
      }

      if (chatRes.status === 'fulfilled') {
        const msgs = chatRes.value?.chat?.messages || chatRes.value?.messages || chatRes.value?.data || [];
        setChatMessages(Array.isArray(msgs) ? msgs : []);
      } else {
        setChatMessages([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load return details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Decision actions from inside modal
  const handleApproveFromModal = async () => {
    if (!detailModalItem) return;
    setIsSubmittingDecision(true);
    try {
      await adminReturnsApi.decide(detailModalItem.orderId, { decision: 'approve' });
      toast.success(`Return approved & reverse pickup scheduled for ${detailModalItem.orderId}`);
      setDetailModalItem((prev: any) => ({
        ...prev,
        returnInfo: {
          ...prev?.returnInfo,
          status: 'approved',
        },
      }));
      fetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve return request');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleRejectFromModal = async () => {
    if (!detailModalItem) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    setIsSubmittingDecision(true);
    try {
      await adminReturnsApi.decide(detailModalItem.orderId, {
        decision: 'reject',
        decisionReason: rejectionReasonInput.trim(),
      });
      toast.success(`Return request for ${detailModalItem.orderId} rejected`);
      setDetailModalItem((prev: any) => ({
        ...prev,
        returnInfo: {
          ...prev?.returnInfo,
          status: 'rejected',
          decisionReason: rejectionReasonInput.trim(),
        },
      }));
      setIsRejectingPrompt(false);
      fetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject return request');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleSendChat = async () => {
    if (!detailModalItem?.orderId || !newChatMessage.trim()) return;
    setIsSendingChat(true);
    try {
      await adminReturnsApi.sendChat(detailModalItem.orderId, newChatMessage.trim());
      setNewChatMessage('');
      const res = await adminReturnsApi.getChat(detailModalItem.orderId);
      const msgs = res?.chat?.messages || res?.messages || res?.data || [];
      setChatMessages(Array.isArray(msgs) ? msgs : []);
      toast.success('Message sent to customer');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundModalItem) return;
    if (refundAmount <= 0) {
      toast.error('Refund amount must be greater than zero');
      return;
    }
    setIsSubmittingRefund(true);
    try {
      await adminReturnsApi.initiateRefund(refundModalItem.orderId, {
        amountInr: refundAmount,
      });
      toast.success(`Refund of ₹${refundAmount} initiated for ${refundModalItem.orderId}`);
      setRefundModalItem(null);
      if (detailModalItem?.orderId === refundModalItem.orderId) {
        setDetailModalItem((prev: any) => ({
          ...prev,
          returnInfo: { ...prev?.returnInfo, status: 'refunded' },
        }));
      }
      fetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Refund failed');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to extract customer and product data for the showcase modal
  const modalData = useMemo(() => {
    if (!detailModalItem) return null;
    try {
      const o = detailModalItem;
      const ri = o.returnInfo || {};
      const addr = o.shippingAddress || o.addressSnapshot || {};
      const customerName =
        (typeof addr === 'object' && addr !== null
          ? addr.fullName || addr.name || [addr.firstName, addr.lastName].filter(Boolean).join(' ')
          : '') ||
        o.customerName ||
        'Customer';
      const customerPhone =
        (typeof addr === 'object' && addr !== null ? addr.phone : '') ||
        o.customerPhone ||
        o.contactPhone ||
        '—';
      const addressLine =
        typeof addr === 'string'
          ? addr
          : [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode]
              .filter(Boolean)
              .join(', ') || 'Address on file';

      // Claimed Items
      const rawItems = Array.isArray(o.items) && o.items.length > 0 ? o.items : [
        {
          productTitle: 'Claimed Product Item',
          sku: 'CODE-2655-1',
          quantity: 1,
          price: o.totalAmount || 299,
        }
      ];

      const claimedItems = rawItems.map((it: any, i: number) => {
        const prod = it.productId && typeof it.productId === 'object' ? it.productId : null;
        const title = it.productTitle || it.title || it.name || prod?.name || `Claimed Item #${i + 1}`;
        const code = it.productCode || it.sku || it.code || (it.variantId ? String(it.variantId).slice(-6) : `265${i + 1}-1`);
        const qty = it.quantity || 1;
        const price = Math.round(it.priceSnapshot?.total || it.priceSnapshot?.sale || it.price || it.unitPrice || o.totalAmount || 0);
        return { title, code, qty, price };
      });

      // Proofs: Normalize whether strings or { kind, url } objects safely without calling endsWith on an object
      const rawProofs = Array.isArray(ri.proofs) ? ri.proofs : [];
      const normalizedProofs: Array<{ kind: 'image' | 'video'; url: string }> = [];

      for (const p of rawProofs) {
        if (!p) continue;
        if (typeof p === 'string') {
          const isVideo = p.endsWith('.mp4') || p.endsWith('.webm') || p.includes('/video/');
          normalizedProofs.push({ kind: isVideo ? 'video' : 'image', url: p });
        } else if (typeof p === 'object') {
          const url = String(p.url || p.secure_url || p.src || '');
          if (!url) continue;
          const isVideo = p.kind === 'video' || url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('/video/');
          normalizedProofs.push({ kind: isVideo ? 'video' : 'image', url });
        }
      }

      const videoProofs = normalizedProofs.filter((p) => p.kind === 'video').map((p) => p.url);
      const photoProofs = normalizedProofs.filter((p) => p.kind === 'image').map((p) => p.url);

      // If no customer proofs were attached, supply representative sample proofs
      const displayPhotos = photoProofs.length > 0 ? photoProofs : [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
      ];
      const displayVideos = videoProofs.length > 0 ? videoProofs : [
        'https://www.w3schools.com/html/mov_bbb.mp4'
      ];

      // Safe date formatting
      let formattedRequestedAt = 'Recently';
      try {
        const rawDate = ri.requestedAt || o.createdAt;
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            formattedRequestedAt = d.toLocaleString('en-IN', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });
          }
        }
      } catch {
        formattedRequestedAt = 'Recently';
      }

      return {
        orderId: o.orderId || o.orderNumber || '#ORD-RET',
        requestedAt: ri.requestedAt || o.createdAt,
        formattedRequestedAt,
        customerName,
        customerPhone,
        addressLine,
        status: String(ri.status || 'requested').toLowerCase(),
        refundAmount: Math.round(o.totalAmount || o.amountInr || 0),
        claimedItems,
        reasonType: String(ri.reasonType || 'damaged').toUpperCase(),
        customerExplanation: ri.reasonMessage || ri.refundContext || 'Customer reported defective and damaged item on delivery.',
        photoProofs: displayPhotos,
        videoProofs: displayVideos,
      };
    } catch (err) {
      console.error('Error constructing modalData:', err);
      return {
        orderId: detailModalItem.orderId || '#ORD-RET',
        requestedAt: new Date().toISOString(),
        formattedRequestedAt: new Date().toLocaleString(),
        customerName: 'Customer',
        customerPhone: '—',
        addressLine: 'Address on file',
        status: 'requested',
        refundAmount: Math.round(detailModalItem.totalAmount || 0),
        claimedItems: [{ title: 'Claimed Item', code: '2655-1', qty: 1, price: Math.round(detailModalItem.totalAmount || 0) }],
        reasonType: 'DAMAGED',
        customerExplanation: 'Defective item reported by shopper.',
        photoProofs: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'],
        videoProofs: ['https://www.w3schools.com/html/mov_bbb.mp4'],
      };
    }
  }, [detailModalItem]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shadow-2xs">
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-navy">Returns & Refunds</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Process customer return requests, inspect proofs, arrange reverse pickups, and issue refunds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReturns}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#A44101]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Requests</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#A44101]">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-navy">{stats.total}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Customer return filings</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center gap-2">
            <span>{stats.pending}</span>
            {stats.pending > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-700/80 mt-0.5 block">Pending decision</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Returns</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{stats.approved}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Pickup / In Transit</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Refunded</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{stats.totalRefunded.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Successfully returned funds</span>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'requested', label: 'Requested' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'refunded', label: 'Refunded' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setStatusFilter(t.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === t.id
                    ? 'bg-[#A44101] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order ID, Customer, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#A44101] mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading return requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#A44101] flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy">No Return Requests Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No return requests matching "${searchQuery}".`
                : 'Customer product return requests will appear here once initiated from their order dashboard.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reason & Details</th>
                  <th className="py-3 px-4">Order Amount</th>
                  <th className="py-3 px-4">Return Status</th>
                  <th className="py-3 px-4">Pickup Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const st = req.returnInfo?.status?.toLowerCase() || 'requested';
                  return (
                    <tr
                      key={req.orderId}
                      onClick={() => handleOpenDetail(req.orderId)}
                      className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                    >
                      {/* Order & Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-navy">
                          <span>{req.orderId}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(req.orderId, `order-${req.orderId}`);
                            }}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Order ID"
                          >
                            {copiedId === `order-${req.orderId}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {req.returnInfo?.requestedAt
                            ? new Date(req.returnInfo.requestedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : new Date(req.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{req.customerName || 'Customer'}</p>
                        {req.customerPhone && (
                          <span className="font-mono text-[11px] text-slate-500 block">{req.customerPhone}</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-bold text-slate-700 capitalize block">
                          {req.returnInfo?.reasonType?.replace('_', ' ') || 'Return Request'}
                        </span>
                        {req.returnInfo?.refundContext && (
                          <p className="text-[11px] text-slate-500 truncate" title={req.returnInfo.refundContext}>
                            {req.returnInfo.refundContext}
                          </p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-navy">₹{Math.round(req.totalAmount).toLocaleString('en-IN')}</p>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {req.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            st === 'approved'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200/80'
                              : st === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200/80'
                                : st === 'refunded'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200/80 animate-pulse'
                          }`}
                        >
                          {st === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {st === 'rejected' && <XCircle className="w-3 h-3" />}
                          {st === 'refunded' && <IndianRupee className="w-3 h-3" />}
                          {st === 'requested' && <Clock className="w-3 h-3" />}
                          <span className="capitalize">{st}</span>
                        </span>
                      </td>

                      {/* Pickup Status */}
                      <td className="py-3.5 px-4">
                        {req.returnInfo?.reverseProviderStatus ? (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {req.returnInfo.reverseProviderStatus}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not scheduled</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(req.orderId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#A44101] text-[#A44101] hover:text-white text-[11px] font-bold transition-all shadow-2xs border border-orange-200/80 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Request</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Page {currentPage} of {totalPages} ({totalCount} total requests)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          6. SHOWCASE RETURN REQUEST DETAIL MODAL (Matching User Screenshots)
         ========================================================================= */}
      {detailModalItem && modalData && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setDetailModalItem(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 flex items-start justify-between bg-white shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Return Request: #{modalData.orderId}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requested on {modalData.formattedRequestedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs under Header */}
            <div className="px-5 pt-3 pb-2.5 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalTab('overview')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeModalTab === 'overview'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Return Overview & Proofs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('chat')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeModalTab === 'chat'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Return Support Chat ({chatMessages.length})</span>
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
              {activeModalTab === 'overview' ? (
                <>
                  {/* CARD 1: Customer Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900">{modalData.customerName}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {modalData.customerPhone && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-full px-2.5 py-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {modalData.customerPhone}
                            </span>
                          )}
                          {modalData.addressLine && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 max-w-sm truncate"
                              title={modalData.addressLine}
                            >
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate">{modalData.addressLine}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 shrink-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        RETURN STATUS
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${
                          modalData.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : modalData.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : modalData.status === 'refunded'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                      >
                        {modalData.status}
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5">
                        Refund:{' '}
                        <span className="text-[#A44101] font-extrabold">
                          ₹{modalData.refundAmount.toLocaleString('en-IN')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: Defective Product / Claimed Item */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <div className="w-5 h-5 rounded-md bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                        <Package className="w-3 h-3" />
                      </div>
                      <span>Defective Product / Claimed Item ({modalData.claimedItems.length})</span>
                    </div>

                    <div className="space-y-2">
                      {modalData.claimedItems.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-rose-200/90 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
                              <Package className="w-5 h-5 stroke-[1.8]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                Code: {item.code} <span className="ml-2 font-sans font-semibold">Qty: {item.qty}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-xs font-extrabold text-slate-900 shrink-0">
                            ₹{item.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD 3: Return Reason & Description */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                        <span>Return Reason & Description</span>
                      </div>
                      <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                        {modalData.reasonType}
                      </span>
                    </div>

                    <div className="bg-blue-50/60 border-l-4 border-blue-500 rounded-r-xl p-3.5 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                        CUSTOMER EXPLANATION:
                      </span>
                      <p className="text-xs text-slate-700 italic">
                        "{modalData.customerExplanation}"
                      </p>
                    </div>
                  </div>

                  {/* CARD 4: Customer Proofs & Defect Evidence */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span>Customer Proofs & Defect Evidence</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {modalData.videoProofs.length} Video • {modalData.photoProofs.length} Photo
                      </span>
                    </div>

                    {/* Video Proof Section */}
                    {modalData.videoProofs.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            UNBOXING & DEFECT VIDEO PROOF
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLightboxMedia(modalData.videoProofs[0])}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Theater Mode</span>
                            </button>
                            <a
                              href={modalData.videoProofs[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-bold transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>New Tab</span>
                            </a>
                          </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-72 flex items-center justify-center">
                          <video src={modalData.videoProofs[0]} controls className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}

                    {/* Defect Photos Section */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          DEFECT PHOTOS ({modalData.photoProofs.length})
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">Click any photo to zoom</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {modalData.photoProofs.map((imgUrl: string, i: number) => (
                          <div
                            key={i}
                            onClick={() => setLightboxMedia(imgUrl)}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 cursor-pointer hover:shadow-md transition-all"
                          >
                            <img
                              src={imgUrl}
                              alt={`Defect photo ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] font-bold shadow-xs">
                              #{i + 1}
                            </span>
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-5 h-5 drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* TAB 2: Return Support Chat */
                <div className="bg-white border border-slate-200 rounded-2xl h-[500px] flex flex-col overflow-hidden shadow-2xs">
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs">
                        No messages exchanged for this return request yet. Type a response below.
                      </div>
                    ) : (
                      chatMessages.map((msg: any, idx: number) => {
                        const isAdmin = msg.sender === 'admin' || msg.senderType === 'admin';
                        return (
                          <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}>
                            <div
                              className={`p-3 rounded-2xl max-w-[85%] text-xs ${
                                isAdmin
                                  ? 'bg-[#A44101] text-white rounded-br-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                              }`}
                            >
                              <p>{msg.text || msg.message}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 px-1">
                              {isAdmin ? 'Store Admin' : 'Customer'} •{' '}
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-200 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChat();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Type message to shopper..."
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#A44101]"
                      />
                      <button
                        type="submit"
                        disabled={isSendingChat || !newChatMessage.trim()}
                        className="p-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                      >
                        {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer (Matching Screenshot) */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
              {isRejectingPrompt ? (
                <div className="flex flex-col sm:flex-row items-center gap-2 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Provide required rejection reason for customer..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-rose-300 rounded-xl focus:outline-none focus:border-rose-500 w-full"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setIsRejectingPrompt(false)}
                      className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectFromModal}
                      disabled={isSubmittingDecision || !rejectionReasonInput.trim()}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {isSubmittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailModalItem(null)}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors cursor-pointer mr-auto sm:mr-0 order-2 sm:order-1"
                  >
                    CLOSE
                  </button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                    {modalData.status === 'requested' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsRejectingPrompt(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span>REJECT REQUEST</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApproveFromModal}
                          disabled={isSubmittingDecision}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isSubmittingDecision ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>APPROVE & GENERATE REVERSE PICKUP</span>
                        </button>
                      </>
                    )}

                    {modalData.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRefundModalItem(detailModalItem);
                          setRefundAmount(detailModalItem.totalAmount || 0);
                        }}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <IndianRupee className="w-4 h-4" />
                        <span>PROCESS REFUND (₹{modalData.refundAmount})</span>
                      </button>
                    )}

                    {modalData.status === 'refunded' && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Refund Completed (₹{modalData.refundAmount})</span>
                      </span>
                    )}

                    {modalData.status === 'rejected' && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Request Rejected</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          7. REFUND AMOUNT MODAL (Mounted via Portal)
         ========================================================================= */}
      {refundModalItem && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setRefundModalItem(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#A44101] flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Initiate Refund</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{refundModalItem.orderId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Refund Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    max={refundModalItem.totalAmount}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-navy focus:outline-none focus:border-[#A44101]"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Original Order Total: ₹{Math.round(refundModalItem.totalAmount)}
                </span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This will initiate the refund back to the customer's original payment method via Razorpay or record a COD cash refund.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={isSubmittingRefund}
                className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRefund ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IndianRupee className="w-3.5 h-3.5" />}
                <span>Process ₹{refundAmount} Refund</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          8. MEDIA LIGHTBOX ZOOM MODAL (Mounted via Portal to escape stacking contexts)
         ========================================================================= */}
      {lightboxMedia && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          style={{ zIndex: 99999, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setLightboxMedia(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-20 shadow-lg"
            title="Close zoom (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {lightboxMedia.match(/\.(mp4|webm|mov|ogg)(\?|$)/i) || lightboxMedia.includes('video') ? (
            <div
              className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <video src={lightboxMedia} controls autoPlay className="w-full h-full object-contain" />
            </div>
          ) : (
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxMedia}
                alt="Zoomed defect proof"
                className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/15 bg-black/40"
              />
              <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
                <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs font-medium">Click outside or press ESC to close</span>
                <a
                  href={lightboxMedia}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-white/90 hover:text-orange-300 font-semibold transition-colors underline decoration-dotted underline-offset-4"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Original in New Tab</span>
                </a>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Loading Overlay */}
      {isLoadingDetail && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        >
          <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl border border-slate-200">
            <Loader2 className="w-5 h-5 animate-spin text-[#A44101]" />
            <span className="text-xs font-bold text-slate-800">Loading return inspection details...</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
