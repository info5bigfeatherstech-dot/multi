import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAdminDropshipperRequests,
  approveAdminDropshipperRequest,
  rejectAdminDropshipperRequest,
  setSelectedRequest,
} from '../../../../store/adminDropshipperSlice';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { AdminDropshipperRequest } from '../../../../api';
import toast from 'react-hot-toast';

export const AdminDropshipperRequestsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { requests, requestsLoading, selectedRequest, actionLoading } = useAppSelector(
    (state) => state.adminDropshipper
  );

  const [adminStatusFilter, setAdminStatusFilter] = useState('pending');
  const [kindFilter, setKindFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [rejectNote, setRejectNote] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Lock body scroll when either modal is open
  useEffect(() => {
    if (isDetailModalOpen || isRejectModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDetailModalOpen, isRejectModalOpen]);

  useEffect(() => {
    dispatch(
      fetchAdminDropshipperRequests({
        adminStatus: adminStatusFilter !== 'all' ? adminStatusFilter : undefined,
        kind: kindFilter !== 'all' ? kindFilter : undefined,
        search: searchQuery || undefined,
      })
    );
  }, [dispatch, adminStatusFilter, kindFilter, searchQuery]);

  const handleOpenDetail = (req: AdminDropshipperRequest) => {
    dispatch(setSelectedRequest(req));
    setIsDetailModalOpen(true);
  };

  const handleApprove = async (req: AdminDropshipperRequest) => {
    const id = req._id || req.id;
    if (!id) return;
    try {
      await dispatch(approveAdminDropshipperRequest({ id, note: 'KYC verified' })).unwrap();
      toast.success(`Application approved for ${req.fullName}! Activation email sent.`);
      dispatch(fetchAdminDropshipperRequests({ adminStatus: adminStatusFilter, kind: kindFilter }));
    } catch (err: any) {
      toast.error(err || 'Failed to approve request');
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    const id = selectedRequest._id || selectedRequest.id;
    if (!id) return;
    if (!rejectNote.trim()) {
      toast.error('Please specify a rejection reason for the applicant');
      return;
    }

    try {
      await dispatch(rejectAdminDropshipperRequest({ id, note: rejectNote.trim() })).unwrap();
      toast.success('KYC application marked as rejected');
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      setRejectNote('');
      dispatch(fetchAdminDropshipperRequests({ adminStatus: adminStatusFilter, kind: kindFilter }));
    } catch (err: any) {
      toast.error(err || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-navy">Dropshipper KYC Requests</h2>
          <p className="text-xs text-slate-500 capitalize">
            Review partner verification submissions, inspect identity proofs, and issue activations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by applicant name, email, or 10-digit mobile..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={adminStatusFilter}
            onChange={(e) => setAdminStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:border-[#A44101] focus:outline-none"
          >
            <option value="pending">Status: Pending Review</option>
            <option value="approved">Status: Approved</option>
            <option value="rejected">Status: Rejected</option>
            <option value="all">Status: All</option>
          </select>

          {/* Kind filter */}
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:border-[#A44101] focus:outline-none"
          >
            <option value="all">Kind: All</option>
            <option value="registration">Registration</option>
            <option value="renewal">Renewal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {requestsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
            <span className="text-xs font-bold">Loading KYC requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-navy capitalize">No KYC requests found</h3>
            <p className="text-xs text-slate-500">There are no pending submissions for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Business / Channel</th>
                  <th className="py-3 px-4">Proofs</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id || req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy">{req.fullName}</div>
                      <div className="text-[11px] text-slate-500">{req.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {req.businessName || 'Independent'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {req.sellingPlaceFrom} • {req.sellingZoneCity}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {req.idProofUrl && (
                          <a
                            href={req.idProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] inline-flex items-center gap-1"
                          >
                            <span>ID</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {req.businessAddressProofUrl && (
                          <a
                            href={req.businessAddressProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] inline-flex items-center gap-1"
                          >
                            <span>Address</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      ₹{req.subscriptionAmountInr || 800} / {req.subscriptionYears || 1} yr
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.paymentStatus} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.adminStatus} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(req)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {req.adminStatus === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                dispatch(setSelectedRequest(req));
                                setIsRejectModalOpen(true);
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Request Details */}
      {isDetailModalOpen &&
        selectedRequest &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto transition-all duration-200"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-scaleIn text-xs"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#A44101]" />
                <h3 className="text-sm font-black text-navy">KYC Request: {selectedRequest.fullName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Personal Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="font-black text-navy uppercase tracking-wider text-[11px]">
                  Applicant Identity
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Name:</span>
                    <strong>{selectedRequest.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email:</span>
                    <strong>{selectedRequest.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile:</span>
                    <strong className="font-mono">{selectedRequest.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">WhatsApp:</span>
                    <strong className="font-mono">{selectedRequest.whatsappNumber || selectedRequest.phone}</strong>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="font-black text-navy uppercase tracking-wider text-[11px]">
                  Address &amp; Shop Information
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Permanent Address:</span>
                    <p>{selectedRequest.permanentAddress}</p>
                  </div>
                  {selectedRequest.haveShop && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Physical Shop Address:</span>
                      <p>{selectedRequest.businessAddress}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[10px]">Selling Channel &amp; Zone:</span>
                    <p>{selectedRequest.sellingPlaceFrom} in {selectedRequest.sellingZoneCity}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Est. Monthly Sourcing:</span>
                    <strong className="text-[#A44101]">₹{selectedRequest.monthlyEstimatedPurchase || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Verification Proofs */}
              <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2">
                <h4 className="font-black text-navy uppercase tracking-wider text-[11px]">
                  Uploaded KYC Proofs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>Identity Proof (Aadhar/PAN)</span>
                    {selectedRequest.idProofUrl ? (
                      <a
                        href={selectedRequest.idProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A44101] font-bold underline flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Attached</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>Address / Business Proof</span>
                    {selectedRequest.businessAddressProofUrl ? (
                      <a
                        href={selectedRequest.businessAddressProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A44101] font-bold underline flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Attached</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Note if already handled */}
              {selectedRequest.adminNote && (
                <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
                  <span className="font-bold block text-[11px]">Admin Decision Note:</span>
                  <p>{selectedRequest.adminNote}</p>
                </div>
              )}

              {/* Approve / Reject buttons */}
              {selectedRequest.adminStatus === 'pending' && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleApprove(selectedRequest);
                      setIsDetailModalOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Send OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejectModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal 2: Rejection Reason */}
      {isRejectModalOpen &&
        selectedRequest &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200"
            onClick={() => setIsRejectModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scaleIn p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-black text-navy">Reject KYC Application</h3>
              </div>
              <p className="text-xs text-slate-600">
                Provide a note explaining why this application is rejected. This note will be visible to the applicant.
              </p>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Identity proof photo is blurry; electricity bill name does not match applicant."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
