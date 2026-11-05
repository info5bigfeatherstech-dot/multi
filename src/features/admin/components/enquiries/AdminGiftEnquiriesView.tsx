import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Building2,
  Phone,
  MapPin,
  Layers,
  Search,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  X,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  User,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminGiftEnquiriesApi,
  AdminGiftEnquiryItem,
  AdminGiftEnquiryDetail
} from '../../../../api/giftEnquiriesApi';

interface AdminGiftEnquiriesViewProps {
  enquiryType: 'bulk' | 'custom';
}

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Enquiries' },
  { id: 'pending', label: 'Pending Review', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'quoted', label: 'Quoted / Pricing Shared', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'converted', label: 'Converted to Order', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'closed', label: 'Closed / Not Interested', color: 'bg-slate-100 text-slate-700 border-slate-300' },
];

export const AdminGiftEnquiriesView: React.FC<AdminGiftEnquiriesViewProps> = ({ enquiryType }) => {
  const [enquiries, setEnquiries] = useState<AdminGiftEnquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal / Drawer
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [enquiryDetail, setEnquiryDetail] = useState<AdminGiftEnquiryDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [updateStatusVal, setUpdateStatusVal] = useState<string>('');
  const [adminNoteVal, setAdminNoteVal] = useState<string>('');
  const [convertedOrderIdVal, setConvertedOrderIdVal] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminGiftEnquiriesApi.list({
        enquiryType,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
        page,
        limit: 20,
        storefront: 'ecomm',
      });

      const items = Array.isArray(res) ? res : res?.items || res?.data || [];
      setEnquiries(items);
      setTotalCount(res?.total || items.length);
    } catch (err: any) {
      console.error('Failed to fetch gift enquiries:', err);
      setError(err.message || 'Failed to load inquiries from server.');
    } finally {
      setIsLoading(false);
    }
  }, [enquiryType, selectedStatus, searchQuery, page]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Open Detail Drawer
  const handleOpenDetail = async (id: string) => {
    setSelectedEnquiryId(id);
    setIsDetailLoading(true);
    try {
      const detail = await adminGiftEnquiriesApi.getById(id, 'ecomm');
      setEnquiryDetail(detail);
      setUpdateStatusVal(detail.status || 'pending');
      setAdminNoteVal(detail.adminNote || '');
      setConvertedOrderIdVal(detail.convertedOrderId || '');
    } catch (err: any) {
      toast.error(err.message || 'Could not load enquiry details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEnquiryId(null);
    setEnquiryDetail(null);
  };

  // Save Status / Note Update
  const handleSaveStatus = async () => {
    if (!selectedEnquiryId) return;
    setIsUpdatingStatus(true);
    try {
      await adminGiftEnquiriesApi.updateStatus(
        selectedEnquiryId,
        {
          status: updateStatusVal,
          adminNote: adminNoteVal.trim() || undefined,
          convertedOrderId: convertedOrderIdVal.trim() || undefined,
        },
        'ecomm'
      );

      toast.success('Enquiry updated successfully!');
      if (enquiryDetail) {
        setEnquiryDetail({
          ...enquiryDetail,
          status: updateStatusVal,
          adminNote: adminNoteVal,
          convertedOrderId: convertedOrderIdVal,
        });
      }
      fetchEnquiries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update enquiry status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Contacted</span>;
      case 'quoted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Quoted</span>;
      case 'converted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Converted</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const isBulk = enquiryType === 'bulk';

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#A44101]/10 rounded-lg text-[#A44101]">
              {isBulk ? <Layers className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              {isBulk ? 'Wholesale & Bulk Inquiries' : 'Corporate & Custom Gifting'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              E-Commerce Storefront
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 capitalize">
            {isBulk
              ? 'Manage retailer wholesale requests, visiting cards, order quantities, and quote follow-ups.'
              : 'Review corporate gifting custom requests, company logos, artwork proofs, and status updates.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchEnquiries()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#A44101]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {STATUS_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by client name, 10-digit phone, organization, or city..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-hidden focus:border-[#A44101] focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0 font-medium">
            Showing {enquiries.length} of {totalCount} records
          </span>
        </div>
      </div>

      {/* Data Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-[#A44101]/30 border-t-[#A44101] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading {enquiryType} inquiries...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-navy">Error loading inquiries</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={() => fetchEnquiries()}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded-xl cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              {isBulk ? <Layers className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
            </div>
            <h3 className="text-sm font-bold text-navy">No inquiries found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Customer inquiries submitted through the store will appear here in real time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Client / Organization</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">{isBulk ? 'Business & Volume' : 'Occasion & Category'}</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Files Attached</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((item) => {
                  const id = item._id || item.id || '';
                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(id)}
                    >
                      {/* Client / Organization */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        {item.organizationName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{item.organizationName}</span>
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 font-semibold text-navy">
                          <span className="font-mono text-xs">{item.phone}</span>
                          <a
                            href={`https://wa.me/91${item.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                              `Hello ${item.name}, thank you for your inquiry on Apna Bharat Bazaar.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {item.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                            {item.email}
                          </div>
                        )}
                      </td>

                      {/* Type-Specific Details */}
                      <td className="py-3.5 px-4">
                        {isBulk ? (
                          <div>
                            <span className="font-semibold text-navy block text-xs">
                              {item.businessType || 'Retailer / Reseller'}
                            </span>
                            {item.volumeOrder && (
                              <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                                Qty: {item.volumeOrder} Units
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-navy block text-xs truncate max-w-[200px]">
                              {item.giftCategory || 'Corporate Gifting'}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {item.occasion} {item.quantity ? `• ${item.quantity} pcs` : ''}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.city || 'Pan India'}</span>
                        </div>
                      </td>

                      {/* Files Attached Count */}
                      <td className="py-3.5 px-4">
                        {isBulk ? (
                          item.hasBusinessCard ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <FileText className="w-3 h-3 text-[#A44101]" />
                              Visiting Card
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            {item.logoCount && item.logoCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy bg-slate-100 px-2 py-0.5 rounded-md">
                                <FileText className="w-3 h-3 text-[#A44101]" />
                                {item.logoCount} Logo
                              </span>
                            ) : null}
                            {item.referencePhotoCount && item.referencePhotoCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                                <ImageIcon className="w-3 h-3 text-sky-600" />
                                {item.referencePhotoCount} Photo
                              </span>
                            ) : null}
                            {(!item.logoCount || item.logoCount === 0) &&
                              (!item.referencePhotoCount || item.referencePhotoCount === 0) && (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#A44101] hover:text-[#803300] bg-orange-50/70 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal / Drawer */}
      {selectedEnquiryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#A44101]/10 rounded-xl text-[#A44101]">
                  {isBulk ? <Layers className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-navy">
                    {isBulk ? 'Wholesale Inquiry Details' : 'Custom Gifting Request'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">ID: #{selectedEnquiryId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedEnquiryId, selectedEnquiryId)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                      title="Copy ID"
                    >
                      {copiedId === selectedEnquiryId ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isDetailLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-2 border-[#A44101]/30 border-t-[#A44101] rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading full inquiry files & details...</p>
                </div>
              ) : enquiryDetail ? (
                <>
                  {/* Client Summary Box */}
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Client Name</span>
                        <h4 className="text-base font-bold text-navy">{enquiryDetail.name}</h4>
                        {enquiryDetail.organizationName && (
                          <span className="text-xs text-slate-600 block mt-0.5">
                            {enquiryDetail.organizationName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/91${enquiryDetail.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                            `Hello ${enquiryDetail.name}, following up regarding your ${isBulk ? 'bulk inquiry' : 'custom gifting request'} on Apna Bharat Bazaar.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${enquiryDetail.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Phone / Mobile</span>
                        <span className="text-navy font-bold font-mono">{enquiryDetail.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Email</span>
                        <span className="text-navy font-medium">{enquiryDetail.email || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Location / City</span>
                        <span className="text-navy font-medium">{enquiryDetail.city || 'Pan India'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Submitted Date</span>
                        <span className="text-navy font-medium">
                          {enquiryDetail.createdAt ? new Date(enquiryDetail.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Requirements / Custom Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Requirement Specifics
                    </h4>
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {isBulk ? (
                        <>
                          <div>
                            <span className="text-slate-400 font-semibold block">Business Type</span>
                            <span className="text-navy font-bold">{enquiryDetail.businessType || 'Retailer / Shopkeeper'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Target Volume</span>
                            <span className="text-emerald-700 font-bold">{enquiryDetail.volumeOrder ? `${enquiryDetail.volumeOrder} Units` : 'Flexible'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-slate-400 font-semibold block">Occasion</span>
                            <span className="text-navy font-bold">{enquiryDetail.occasion || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Gift Item Category</span>
                            <span className="text-navy font-bold">{enquiryDetail.giftCategory || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Requested Quantity</span>
                            <span className="text-emerald-700 font-bold">{enquiryDetail.quantity || 0} Units</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Target Delivery Date</span>
                            <span className="text-navy font-medium">{enquiryDetail.targetDeliveryDate || 'Flexible'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {enquiryDetail.message && (
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                          Client Instructions / Notes
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed italic">{enquiryDetail.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Attached Files Section */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Attached Proofs &amp; Files
                    </h4>

                    {/* Business Card for Bulk */}
                    {isBulk && (
                      <div>
                        {enquiryDetail.businessCardUrl || enquiryDetail.files?.businessCard ? (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#A44101]" />
                              <span className="font-bold text-navy">Business / Visiting Card</span>
                            </div>
                            <a
                              href={enquiryDetail.businessCardUrl || enquiryDetail.files?.businessCard}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#A44101] hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View File</span>
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No business card uploaded for this inquiry.</p>
                        )}
                      </div>
                    )}

                    {/* Logos & Reference Photos for Custom */}
                    {!isBulk && (
                      <div className="space-y-3">
                        {/* Logos */}
                        {(enquiryDetail.logoUrls || enquiryDetail.files?.logos) && (
                          <div>
                            <span className="text-xs font-bold text-navy block mb-2">
                              Brand Logos ({(enquiryDetail.logoUrls || enquiryDetail.files?.logos || []).length}):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(enquiryDetail.logoUrls || enquiryDetail.files?.logos || []).map((url, i) => (
                                <a
                                  key={`logo-${i}`}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-navy group transition-all"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileText className="w-3.5 h-3.5 text-[#A44101] shrink-0" />
                                    <span className="font-semibold truncate">Logo {i + 1}</span>
                                  </div>
                                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#A44101] shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reference Photos */}
                        {(enquiryDetail.referencePhotoUrls || enquiryDetail.files?.referencePhotos) && (
                          <div>
                            <span className="text-xs font-bold text-navy block mb-2">
                              Reference Photos ({(enquiryDetail.referencePhotoUrls || enquiryDetail.files?.referencePhotos || []).length}):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {(enquiryDetail.referencePhotoUrls || enquiryDetail.files?.referencePhotos || []).map((url, i) => (
                                <a
                                  key={`photo-${i}`}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 block"
                                >
                                  <img
                                    src={url}
                                    alt={`Reference ${i + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Open</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!enquiryDetail.logoUrls || enquiryDetail.logoUrls.length === 0) &&
                          (!enquiryDetail.referencePhotoUrls || enquiryDetail.referencePhotoUrls.length === 0) && (
                            <p className="text-xs text-slate-400 italic">No artwork or reference photos uploaded.</p>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Update Status / CRM Follow-up Panel */}
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#A44101]" />
                      <span>CRM Status &amp; Coordinator Follow-up</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Enquiry Status
                        </label>
                        <select
                          value={updateStatusVal}
                          onChange={(e) => setUpdateStatusVal(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-navy focus:border-[#A44101] outline-hidden cursor-pointer"
                        >
                          <option value="pending">Pending Review</option>
                          <option value="contacted">Contacted via Phone/WhatsApp</option>
                          <option value="quoted">Quoted / Pricing Shared</option>
                          <option value="converted">Converted to Order</option>
                          <option value="closed">Closed / Not Interested</option>
                        </select>
                      </div>

                      {updateStatusVal === 'converted' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Converted Order # (Optional)
                          </label>
                          <input
                            type="text"
                            value={convertedOrderIdVal}
                            onChange={(e) => setConvertedOrderIdVal(e.target.value)}
                            placeholder="e.g. ABB-2026-9041"
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-navy focus:border-[#A44101] outline-hidden"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Internal Coordinator Note
                      </label>
                      <textarea
                        rows={2}
                        value={adminNoteVal}
                        onChange={(e) => setAdminNoteVal(e.target.value)}
                        placeholder="Add notes about negotiated price, catalog shared, WhatsApp conversation summary..."
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-navy focus:border-[#A44101] outline-hidden resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCloseDetail}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStatus}
                        disabled={isUpdatingStatus}
                        className="px-5 py-2 bg-[#A44101] hover:bg-[#803300] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        {isUpdatingStatus ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Updates</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
