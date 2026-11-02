import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Eye,
  Clock,
  Phone,
  Mail,
  Calendar,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MapPin,
  Building2,
  ShoppingBag,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAdminDropshipperAccounts,
  fetchAdminDropshipperAccountDetail,
  setSelectedAccount,
  clearAdminDropshipperError,
} from '../../../../store/adminDropshipperSlice';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { AdminDropshipperAccount } from '../../../../api';

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

const getDaysRemaining = (endsAt?: string | null): number | null => {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
};

export const AdminDropshipperAccountsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    accounts,
    accountsTotal,
    accountsLoading,
    selectedAccount,
    accountDetailsLoading,
    error,
  } = useAppSelector((state) => state.adminDropshipper);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch accounts on filter/search change
  const loadAccounts = useCallback(() => {
    dispatch(
      fetchAdminDropshipperAccounts({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: debouncedSearch || undefined,
      })
    );
  }, [dispatch, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleOpenAccount = async (account: AdminDropshipperAccount) => {
    dispatch(setSelectedAccount(account));
    setIsDrawerOpen(true);
    const id = account.id || account._id;
    if (id) {
      dispatch(fetchAdminDropshipperAccountDetail(id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-navy">Registered Dropshipper Partners</h2>
            {accountsTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-100 text-[#A44101]">
                {accountsTotal} {accountsTotal === 1 ? 'Partner' : 'Partners'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            Directory of active, pending, and expired dropshipper partner accounts
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAccounts}
            disabled={accountsLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-bold text-slate-700 hover:text-navy shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh partners list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${accountsLoading ? 'animate-spin text-[#A44101]' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Error loading dropshipper accounts:</strong>
              <div className="mt-0.5">{error}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadAccounts}
              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => dispatch(clearAdminDropshipperError())}
              className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by partner name, email, or phone number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:border-[#A44101] focus:outline-none cursor-pointer"
        >
          <option value="all">Status: All Partners</option>
          <option value="active">Active Members</option>
          <option value="pending_otp">Pending Activation (OTP)</option>
          <option value="pending_admin">Pending Admin Review</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="expired">Expired Members</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {accountsLoading && accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
            <span className="text-xs font-bold">Loading partners directory from database...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-sm font-black text-navy">No dropshipper accounts found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {statusFilter !== 'all' || debouncedSearch
                  ? 'No accounts match your current filter or search criteria.'
                  : 'No dropshipper partners have been registered yet.'}
              </p>
            </div>
            {(statusFilter !== 'all' || debouncedSearch) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-navy text-xs font-bold text-navy hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Partner Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Subscription Window</th>
                  <th className="py-3 px-4">Orders / Volume</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => {
                  const accountId = acc.id || acc._id;
                  const daysRemaining =
                    acc.subscription?.daysRemaining ??
                    getDaysRemaining(acc.subscription?.endsAt);

                  return (
                    <tr
                      key={accountId || acc.email}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy text-sm">{acc.fullName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{acc.businessName || 'Solo Partner'}</span>
                        </div>
                        {accountId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: #{accountId.slice(-6)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{acc.email}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{acc.phone}</span>
                        </div>
                        {acc.whatsappNumber && acc.whatsappNumber !== acc.phone && (
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                            WA: {acc.whatsappNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {acc.subscription?.endsAt ? (
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {daysRemaining != null ? (
                                <span
                                  className={
                                    daysRemaining > 30
                                      ? 'text-emerald-700'
                                      : daysRemaining > 0
                                      ? 'text-amber-700'
                                      : 'text-rose-600'
                                  }
                                >
                                  {daysRemaining} days left
                                </span>
                              ) : (
                                'Active Plan'
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Expires {formatDate(acc.subscription.endsAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">No active window</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {acc.totalOrders || 0} orders
                        </div>
                        <div className="text-[11px] text-[#A44101] font-bold">
                          ₹{(acc.lifetimeVolume || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={acc.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAccount(acc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-navy text-xs font-bold text-navy hover:bg-slate-50 transition-colors cursor-pointer"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
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

      {/* Account Details Slide-Over Drawer */}
      {isDrawerOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft text-xs">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#A44101]" />
                <div>
                  <h3 className="text-sm font-black text-navy">Partner Profile</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID: {selectedAccount.id || selectedAccount._id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {accountDetailsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
                  <span>Loading full partner history...</span>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Current Account Status
                      </span>
                      <StatusBadge status={selectedAccount.status} />
                    </div>
                    <h4 className="text-base font-black text-navy">{selectedAccount.fullName}</h4>
                    {selectedAccount.businessName && (
                      <p className="text-slate-600 font-medium">{selectedAccount.businessName}</p>
                    )}
                  </div>

                  {/* Subscription Details */}
                  {selectedAccount.subscription && (
                    <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-[#A44101] font-bold text-xs uppercase tracking-wider">
                        <Clock className="w-4 h-4" />
                        <span>Annual Subscription Window</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Valid From:</span>
                          <strong>{formatDate(selectedAccount.subscription.startsAt)}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Expires On:</span>
                          <strong>{formatDate(selectedAccount.subscription.endsAt)}</strong>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between">
                        <span className="text-slate-600 font-semibold">Active Days Remaining:</span>
                        <span className="font-black text-[#A44101]">
                          {selectedAccount.subscription.daysRemaining ??
                            getDaysRemaining(selectedAccount.subscription.endsAt) ??
                            0}{' '}
                          Days
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Total Orders
                      </span>
                      <span className="text-xl font-black text-navy">
                        {selectedAccount.totalOrders || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Lifetime Volume
                      </span>
                      <span className="text-xl font-black text-[#A44101]">
                        ₹{(selectedAccount.lifetimeVolume || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Direct Contact Details
                    </span>
                    <div className="space-y-2 text-slate-700">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">{selectedAccount.email}</span>
                      </p>
                      <p className="flex items-center gap-2 font-mono">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{selectedAccount.phone}</span>
                      </p>
                      {selectedAccount.whatsappNumber && (
                        <p className="flex items-center gap-2 font-mono text-emerald-700 font-semibold">
                          <span>WhatsApp: {selectedAccount.whatsappNumber}</span>
                        </p>
                      )}
                      {selectedAccount.createdAt && (
                        <p className="flex items-center gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-200">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Member Since: {formatDate(selectedAccount.createdAt)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Business & KYC Application Details */}
                  {selectedAccount.application && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Business & Application Information
                      </span>
                      <div className="space-y-2 text-slate-700">
                        {selectedAccount.application.sellingZoneCity && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Zone / City:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {selectedAccount.application.sellingZoneCity}
                            </span>
                          </div>
                        )}
                        {selectedAccount.application.sellingPlaceFrom && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" /> Selling Channel:
                            </span>
                            <span className="font-semibold text-slate-800">
                              {selectedAccount.application.sellingPlaceFrom}
                            </span>
                          </div>
                        )}
                        {selectedAccount.application.productCategory && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Categories:</span>
                            <span className="font-semibold text-slate-800">
                              {selectedAccount.application.productCategory}
                            </span>
                          </div>
                        )}
                        {selectedAccount.application.monthlyEstimatedPurchase != null && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Est. Monthly Purchase:</span>
                            <span className="font-bold text-[#A44101]">
                              ₹{Number(selectedAccount.application.monthlyEstimatedPurchase).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {selectedAccount.application.permanentAddress && (
                          <div className="pt-1.5 border-t border-slate-200 text-[11px]">
                            <span className="text-slate-400 block font-medium">Permanent Address:</span>
                            <span className="text-slate-800 mt-0.5 block">
                              {selectedAccount.application.permanentAddress}
                            </span>
                          </div>
                        )}
                        {selectedAccount.application.haveShop && selectedAccount.application.businessAddress && (
                          <div className="pt-1 text-[11px]">
                            <span className="text-slate-400 block font-medium">Shop / Business Address:</span>
                            <span className="text-slate-800 mt-0.5 block">
                              {selectedAccount.application.businessAddress}
                            </span>
                          </div>
                        )}

                        {/* Documents */}
                        {(selectedAccount.application.idProofUrl || selectedAccount.application.businessAddressProofUrl) && (
                          <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                            {selectedAccount.application.idProofUrl && (
                              <a
                                href={selectedAccount.application.idProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#A44101] font-bold hover:bg-orange-100 transition-colors"
                              >
                                <span>ID Proof Document</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {selectedAccount.application.businessAddressProofUrl && (
                              <a
                                href={selectedAccount.application.businessAddressProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#A44101] font-bold hover:bg-orange-100 transition-colors"
                              >
                                <span>Address Proof Document</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection / Note banner if any */}
                  {selectedAccount.rejectionNote && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Rejection Reason</span>
                      <p className="text-xs">{selectedAccount.rejectionNote}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
