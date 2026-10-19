import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Archive,
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquareText,
  Loader2,
  X
} from 'lucide-react';
import { adminOosInquiriesApi, AdminOosInquiry } from '../../../api';
import toast from 'react-hot-toast';

export const AdminOutOfStockInquiriesView: React.FC = () => {
  const [inquiries, setInquiries] = useState<AdminOosInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'notified' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Note/Status update modal state
  const [selectedInquiry, setSelectedInquiry] = useState<AdminOosInquiry | null>(null);
  const [editStatus, setEditStatus] = useState<'pending' | 'notified' | 'closed'>('notified');
  const [editNote, setEditNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await adminOosInquiriesApi.list({
        page: currentPage,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
        days: daysFilter,
      });

      const list = res?.data || (Array.isArray(res) ? res : []);
      setInquiries(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      } else {
        setTotalCount(list.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch out of stock queries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, daysFilter, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInquiries();
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const pending = inquiries.filter((i) => i.status === 'pending').length;
    const notified = inquiries.filter((i) => i.status === 'notified').length;
    const closed = inquiries.filter((i) => i.status === 'closed').length;
    return {
      total: totalCount || inquiries.length,
      pending,
      notified,
      closed,
    };
  }, [inquiries, totalCount]);

  const handleOpenEditModal = (inquiry: AdminOosInquiry, defaultStatus?: 'pending' | 'notified' | 'closed') => {
    setSelectedInquiry(inquiry);
    setEditStatus(defaultStatus || inquiry.status);
    setEditNote(inquiry.adminNote || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    try {
      await adminOosInquiriesApi.updateStatus(selectedInquiry.id, {
        status: editStatus,
        adminNote: editNote.trim() || undefined,
      });
      toast.success(`Inquiry updated to ${editStatus}`);
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update inquiry status');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-2xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-navy">Out of Stock Query</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Customer back-in-stock alerts and waitlist notifications submitted on product detail pages
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInquiries}
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total Queries</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#A44101]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-navy">{stats.total}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across all products</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{stats.pending}</div>
          <span className="text-[11px] text-amber-700/80 mt-0.5 block">Waiting for restock</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Notified</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.notified}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Alerts dispatched</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Closed</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-700">{stats.closed}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Resolved queries</span>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'pending', 'notified', 'closed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'bg-[#A44101] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date range & search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={daysFilter}
                onChange={(e) => {
                  setDaysFilter(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last 1 Year</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product, SKU, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
              />
            </form>
          </div>
        </div>
      </div>

      {/* 4. Inquiries List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#A44101] mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading out of stock queries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#A44101] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy">No Out of Stock Queries Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No inquiries matching "${searchQuery}". Try clearing search filter.`
                : 'When shoppers request back-in-stock alerts for zero-stock products, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Customer Contact</th>
                  <th className="py-3 px-4">Inquiry Reason</th>
                  <th className="py-3 px-4">Received On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={inq.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'}
                          alt={inq.productName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-navy truncate max-w-xs">{inq.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {inq.variantSku && (
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                                SKU: {inq.variantSku}
                              </span>
                            )}
                            {inq.productSlug && (
                              <a
                                href={`/product/${inq.productSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#A44101] hover:underline flex items-center gap-0.5 font-semibold"
                              >
                                View PDP <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {inq.phone ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Phone className="w-3 h-3 text-[#A44101]" />
                            <span>{inq.phone}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inq.phone!, `phone-${inq.id}`)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="Copy Phone"
                            >
                              {copiedId === `phone-${inq.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : null}

                        {inq.email ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">{inq.email}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(inq.email!, `email-${inq.id}`)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="Copy Email"
                            >
                              {copiedId === `email-${inq.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : null}

                        {!inq.phone && !inq.email && (
                          <span className="text-slate-400 text-[11px] italic">No contact provided</span>
                        )}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {inq.reason?.replace('_', ' ') || 'Out of Stock'}
                      </span>
                      {inq.storefront === 'wholesale' && (
                        <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                          Wholesale Storefront
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-700">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          inq.status === 'notified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                            : inq.status === 'closed'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-900 border border-amber-200/80'
                        }`}
                      >
                        {inq.status === 'notified' && <CheckCircle2 className="w-3 h-3" />}
                        {inq.status === 'pending' && <Clock className="w-3 h-3" />}
                        {inq.status === 'closed' && <Archive className="w-3 h-3" />}
                        <span className="capitalize">{inq.status}</span>
                      </span>

                      {inq.adminNote && (
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[140px] truncate" title={inq.adminNote}>
                          💬 {inq.adminNote}
                        </p>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inq.status !== 'notified' && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(inq, 'notified')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Mark Notified
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(inq)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Page {currentPage} of {totalPages} ({totalCount} total queries)
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

      {/* 6. Status & Note Management Modal */}
      {selectedInquiry && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#A44101] flex items-center justify-center">
                  <MessageSquareText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Update Inquiry</h3>
                  <p className="text-[11px] text-slate-500">{selectedInquiry.productName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pending', 'notified', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`p-2.5 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                        editStatus === st
                          ? 'border-[#A44101] bg-orange-50/80 text-[#A44101] shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Admin Note (Optional)</label>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Restocked 20 units. WhatsApp message sent to shopper."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Customer Phone:</span>
                  <span className="font-mono font-semibold">{selectedInquiry.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer Email:</span>
                  <span className="font-mono font-semibold truncate max-w-[200px]">{selectedInquiry.email || 'N/A'}</span>
                </div>
                {selectedInquiry.variantSku && (
                  <div className="flex justify-between">
                    <span>Variant SKU:</span>
                    <span className="font-mono font-semibold">{selectedInquiry.variantSku}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
