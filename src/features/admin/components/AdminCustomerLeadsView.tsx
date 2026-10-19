import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShoppingBag, 
  Heart, 
  UserCheck,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { adminAnalyticsApi } from '../../../api';
import toast from 'react-hot-toast';

export interface AdminLeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  interestCategory: string;
  source: string;
  createdAt: string;
  status: 'New' | 'Contacted';
  cartItemsCount?: number;
  wishlistCount?: number;
  registrationMethod?: string;
}

export const AdminCustomerLeadsView: React.FC = () => {
  const [leads, setLeads] = useState<AdminLeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Contacted'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await adminAnalyticsApi.getCustomers({ limit: 100 });
      const rawUsers = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        const mapped: AdminLeadItem[] = rawUsers.map((u: any) => ({
          id: u._id || u.id || String(Math.random()),
          name: u.name || (u.phone ? `Shopper ${u.phone}` : 'Registered Shopper'),
          phone: u.phone || '',
          email: u.email || '',
          interestCategory: (u.cartItemsCount || 0) > 0 
            ? 'Active Cart Shopper' 
            : ((u.wishlistCount || 0) > 0 ? 'Wishlist Shopper' : 'Store Member'),
          source: u.registrationMethod === 'google' ? 'Google Auth' : 'Store Registration',
          createdAt: u.createdAt || new Date().toISOString(),
          status: u.lastActive ? 'Contacted' : 'New',
          cartItemsCount: u.cartItemsCount || 0,
          wishlistCount: u.wishlistCount || 0,
          registrationMethod: u.registrationMethod || 'local',
        }));
        setLeads(mapped);
      }
    } catch (err: any) {
      toast.error('Could not load customer leads from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleToggleStatus = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: l.status === 'New' ? 'Contacted' : 'New' } : l))
    );
    toast.success('Lead status updated');
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesPhone = l.phone.includes(q);
        const matchesEmail = l.email.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesEmail;
      }
      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  // Lead metrics
  const totalLeads = leads.length;
  const activeCartShoppers = leads.filter((l) => l.interestCategory === 'Active Cart Shopper').length;
  const wishlistShoppers = leads.filter((l) => l.interestCategory === 'Wishlist Shopper').length;
  const newLeadsCount = leads.filter((l) => l.status === 'New').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Dedicated Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-orange-50 text-[#A44101] border border-orange-200/60 shadow-2xs">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                Customer Leads &amp; Contacts
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Prospective buyer profiles, active intent shoppers, and registration channels.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchLeads}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-navy bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Leads from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#A44101] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Leads'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads</span>
          <span className="text-2xl font-black text-navy mt-1 block">{totalLeads}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Registered shoppers</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cart Shoppers</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{activeCartShoppers}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Has active cart items</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wishlist Intent</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{wishlistShoppers}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Bookmarked items</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">New / Uncontacted</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{newLeadsCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting outreach</span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-navy bg-white focus:outline-none focus:border-[#A44101]"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-400">
          Showing {filteredLeads.length} of {leads.length} customer leads
        </div>
      </div>

      {/* 4. Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer Lead</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Shopper Intent</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customer leads match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
                  const whatsappUrl = cleanPhone 
                    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(`Hi ${lead.name}, thank you for visiting Apna Bharat Bazaar! Can we help you find anything today?`)}`
                    : null;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-navy">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{lead.name}</p>
                          <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.2 rounded-full font-bold ${
                            lead.source === 'Google Auth' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {lead.source}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5 font-mono text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(lead.phone, 'Phone')}
                                className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy phone"
                              >
                                {copiedText === lead.phone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No phone recorded</span>
                          )}

                          {lead.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[180px]">{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Intent */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                          lead.interestCategory === 'Active Cart Shopper'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : lead.interestCategory === 'Wishlist Shopper'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.interestCategory === 'Active Cart Shopper' && <ShoppingBag className="w-3 h-3 text-amber-600" />}
                          {lead.interestCategory === 'Wishlist Shopper' && <Heart className="w-3 h-3 text-rose-500" />}
                          {lead.interestCategory === 'Store Member' && <UserCheck className="w-3 h-3 text-slate-500" />}
                          <span>{lead.interestCategory}</span>
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {lead.registrationMethod === 'google' ? 'Google Auth' : 'Standard Web Form'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(lead.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                            lead.status === 'Contacted'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lead.status}</span>
                        </button>
                      </td>

                      {/* Quick Outreach */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-bold text-[11px] cursor-not-allowed"
                            >
                              No WhatsApp
                            </button>
                          )}

                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}?subject=${encodeURIComponent('A special welcome from Apna Bharat Bazaar!')}`}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              title="Send Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerLeadsView;
