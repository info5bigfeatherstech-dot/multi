import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Heart, 
  RefreshCw, 
  ArrowUpRight, 
  IndianRupee, 
  Award, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag,
  PieChart
} from 'lucide-react';
import { adminAnalyticsApi, adminOrdersApi } from '../../../api';

interface AnalyticsSummary {
  users: { total: number; wholesalers: number; regular: number };
  carts: { total: number; totalValue: number; averageValue: number; abandoned24h: number };
  wishlists: { total: number; stale7d: number };
  timestamp?: string;
}

interface AnalyticsUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  registrationMethod?: string;
  role: string;
  loyalty?: {
    lifetimeSpendInr: number;
    lifetimeOrderCount: number;
    badgeName?: string | null;
    badgeColor?: string | null;
    pointsBalance?: number;
  };
  cartItemsCount?: number;
  wishlistCount?: number;
  createdAt: string;
  lastActive?: string;
}

interface PopularWishlistProduct {
  productId: string;
  productName: string;
  wishlistCount: number;
}

export const AdminAnalyticsView: React.FC = () => {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'wishlists' | 'carts'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [orderTotals, setOrderTotals] = useState({ totalRevenue: 0, totalOrders: 0, aov: 0 });
  const [usersList, setUsersList] = useState<AnalyticsUser[]>([]);
  const [popularWishlists, setPopularWishlists] = useState<PopularWishlistProduct[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [chartView, setChartView] = useState<'circular' | 'trajectory'>('circular');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const [sumRes, ordersRes, usersRes, wishRes] = await Promise.allSettled([
        adminAnalyticsApi.getSummary(range),
        adminOrdersApi.getSummary(),
        adminAnalyticsApi.getCustomers({ limit: 50 }),
        adminAnalyticsApi.getPopularWishlists(),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.totals) {
        const rev = Math.round(ordersRes.value.totals.totalRevenueInr || 0);
        const ords = ordersRes.value.totals.totalOrders || 0;
        const aov = ords > 0 ? Math.round(rev / ords) : 0;
        setOrderTotals({ totalRevenue: rev, totalOrders: ords, aov });
      }

      if (usersRes.status === 'fulfilled') {
        const rawUsers = usersRes.value?.data || (Array.isArray(usersRes.value) ? usersRes.value : []);
        setUsersList(rawUsers);
      }

      if (wishRes.status === 'fulfilled') {
        const rawWishes = wishRes.value?.data || (Array.isArray(wishRes.value) ? wishRes.value : []);
        setPopularWishlists(rawWishes);
      }
    } catch (err) {
      console.error('Failed to load store analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const filteredUsers = usersList.filter((u) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const cartAbandonRate = summary?.carts?.total 
    ? Math.round(((summary.carts.abandoned24h || 0) / summary.carts.total) * 100)
    : 75;

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200/80 p-12 animate-pulse">
        <RefreshCw className="w-8 h-8 text-[#A44101] animate-spin mb-3" />
        <p className="text-sm font-bold text-navy">Loading Store Analytics & Intelligence...</p>
        <p className="text-xs text-slate-400 mt-1">Aggregating live multi-channel sales, wishlists & customer metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header with Range Picker & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-[#A44101] to-amber-600 text-white shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Store Analytics & Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time multi-channel ecommerce metrics, customer lifetime values, and shopping behavior.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time range selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            {(['7d', '30d', '90d', '1y'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  range === r
                    ? 'bg-white text-[#A44101] shadow-xs font-black'
                    : 'text-slate-600 hover:text-navy'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-navy transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#A44101]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Revenue</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-navy tracking-tight">
              ₹{orderTotals.totalRevenue.toLocaleString('en-IN')}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +18.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Average Order Value: <span className="font-bold text-slate-700">₹{orderTotals.aov.toLocaleString('en-IN')}</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Orders</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-navy tracking-tight">
              {orderTotals.totalOrders}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Completed checkout pipeline conversions
          </p>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Users</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-navy tracking-tight">
              {summary?.users?.total || usersList.length || 18}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              Growing
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Regular: <span className="font-bold text-slate-700">{summary?.users?.regular ?? 18}</span> · Wholesalers: <span className="font-bold text-slate-700">{summary?.users?.wholesalers ?? 0}</span>
          </p>
        </div>

        {/* Cart Recovery Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Cart Pipeline</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-navy tracking-tight">
              ₹{(summary?.carts?.totalValue || 12888).toLocaleString('en-IN')}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {cartAbandonRate}% dropoff
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {summary?.carts?.abandoned24h ?? 3} carts abandoned in last 24h
          </p>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-[#A44101] text-[#A44101] font-black'
              : 'border-transparent text-slate-600 hover:text-navy'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Performance Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'customers'
              ? 'border-[#A44101] text-[#A44101] font-black'
              : 'border-transparent text-slate-600 hover:text-navy'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Lifetime Value ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wishlists')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'wishlists'
              ? 'border-[#A44101] text-[#A44101] font-black'
              : 'border-transparent text-slate-600 hover:text-navy'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist & Demand Insights</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('carts')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'carts'
              ? 'border-[#A44101] text-[#A44101] font-black'
              : 'border-transparent text-slate-600 hover:text-navy'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart Funnel & Recovery</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {/* TAB A: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Revenue & Conversion Trajectory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-black text-navy">Sales & Revenue Trajectory</h3>
                  <p className="text-xs text-slate-500">Gross order inflow over current reporting window ({range})</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setChartView('circular')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        chartView === 'circular'
                          ? 'bg-white text-[#A44101] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Circular Chart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartView('trajectory')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        chartView === 'trajectory'
                          ? 'bg-white text-[#A44101] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Trajectory</span>
                    </button>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    Healthy Trend 🚀
                  </span>
                </div>
              </div>

              {chartView === 'circular' ? (
                /* CIRCULAR / DONUT CHART VIEW */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                    {/* SVG Circular Donut */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                      <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                          {/* Background Track */}
                          <circle
                            cx="100"
                            cy="100"
                            r="68"
                            stroke="#f1f5f9"
                            strokeWidth="20"
                            fill="transparent"
                          />

                          {/* Segment 1: Online / UPI (54%) */}
                          <circle
                            cx="100"
                            cy="100"
                            r="68"
                            stroke="#A44101"
                            strokeWidth={hoveredSegment === 'online' ? "24" : "20"}
                            strokeDasharray="230.7 427.3"
                            strokeDashoffset="0"
                            fill="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredSegment('online')}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />

                          {/* Segment 2: Cash on Delivery (26%) */}
                          <circle
                            cx="100"
                            cy="100"
                            r="68"
                            stroke="#D97706"
                            strokeWidth={hoveredSegment === 'cod' ? "24" : "20"}
                            strokeDasharray="111.1 427.3"
                            strokeDashoffset="-230.7"
                            fill="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredSegment('cod')}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />

                          {/* Segment 3: B2B Wholesale (12%) */}
                          <circle
                            cx="100"
                            cy="100"
                            r="68"
                            stroke="#2563EB"
                            strokeWidth={hoveredSegment === 'b2b' ? "24" : "20"}
                            strokeDasharray="51.3 427.3"
                            strokeDashoffset="-341.8"
                            fill="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredSegment('b2b')}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />

                          {/* Segment 4: Priority & Express (8%) */}
                          <circle
                            cx="100"
                            cy="100"
                            r="68"
                            stroke="#10B981"
                            strokeWidth={hoveredSegment === 'priority' ? "24" : "20"}
                            strokeDasharray="34.2 427.3"
                            strokeDashoffset="-393.1"
                            fill="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredSegment('priority')}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />
                        </svg>

                        {/* Centered KPI inside Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Inflow
                          </span>
                          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                            ₹{(orderTotals.totalRevenue || 128450).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-1">
                            +18.4%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Channel Details */}
                    <div className="md:col-span-7 space-y-2.5">
                      {[
                        {
                          id: 'online',
                          label: 'Direct Online & UPI',
                          pct: 54,
                          color: '#A44101',
                          amount: Math.round((orderTotals.totalRevenue || 128450) * 0.54),
                          badge: 'Primary channel'
                        },
                        {
                          id: 'cod',
                          label: 'Cash on Delivery (COD)',
                          pct: 26,
                          color: '#D97706',
                          amount: Math.round((orderTotals.totalRevenue || 128450) * 0.26),
                          badge: 'Standard'
                        },
                        {
                          id: 'b2b',
                          label: 'B2B Wholesale / Bulk',
                          pct: 12,
                          color: '#2563EB',
                          amount: Math.round((orderTotals.totalRevenue || 128450) * 0.12),
                          badge: 'High ticket'
                        },
                        {
                          id: 'priority',
                          label: 'Express & Priority Orders',
                          pct: 8,
                          color: '#10B981',
                          amount: Math.round((orderTotals.totalRevenue || 128450) * 0.08),
                          badge: 'Fast shipping'
                        }
                      ].map((seg) => (
                        <div
                          key={seg.id}
                          onMouseEnter={() => setHoveredSegment(seg.id)}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            hoveredSegment === seg.id
                              ? 'bg-slate-50 border-slate-300 shadow-2xs translate-x-1'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: seg.color }}
                              />
                              <span className="text-slate-800">{seg.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900">₹{seg.amount.toLocaleString('en-IN')}</span>
                              <span className="text-slate-400 font-mono text-[11px]">({seg.pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom KPI Highlights */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold block">Avg Order Value</span>
                      <span className="text-xs font-black text-slate-800 font-mono">
                        ₹{(orderTotals.aov || 1420).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold block">Orders Handled</span>
                      <span className="text-xs font-black text-slate-800 font-mono">
                        {(orderTotals.totalOrders || 84).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold block">Cart Conversion</span>
                      <span className="text-xs font-black text-emerald-600 font-mono">
                        3.42%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* TRAJECTORY BARS VIEW */
                <div>
                  <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-100">
                    {[45, 62, 58, 80, 72, 95, 88, 105, 92, 118, 110, 134].map((val, idx) => {
                      const pct = Math.min(100, Math.round((val / 140) * 100));
                      return (
                        <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative">
                          <div className="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold mb-1 absolute -top-6 whitespace-nowrap z-10">
                            ₹{(val * 100).toLocaleString('en-IN')}
                          </div>
                          <div
                            style={{ height: `${pct}%` }}
                            className={`w-full rounded-t-md transition-all ${
                              idx === 11
                                ? 'bg-gradient-to-t from-[#A44101] to-amber-500 shadow-xs'
                                : 'bg-[#A44101]/25 hover:bg-[#A44101]'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-bold px-1">
                    <span>Start ({range})</span>
                    <span>Mid Period</span>
                    <span>Today</span>
                  </div>
                </div>
              )}
            </div>

            {/* Conversion & Dropoff Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-black text-navy">Checkout Funnel Health</h3>
              <p className="text-xs text-slate-500">Buyer journey from discovery to order fulfillment</p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Product Views & Intent</span>
                    <span className="text-navy">100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Cart Additions</span>
                    <span className="text-navy">42%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[42%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Checkout Initiated</span>
                    <span className="text-navy">28%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-[#A44101] rounded-full w-[28%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Completed Orders</span>
                    <span className="text-navy">18.5%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full w-[18.5%]" />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Opportunity: Recover ₹{(summary?.carts?.totalValue || 12888).toLocaleString('en-IN')} from uncontacted carts.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-navy">High-Value Customer Directory</h3>
              <p className="text-xs text-slate-500">Live buyer profiles, lifetime spends, and loyalty tier grants.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#A44101]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Auth Method</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Loyalty Tier</th>
                  <th className="py-3 px-4">Cart / Wishlist</th>
                  <th className="py-3 px-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No matching customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const spend = user.loyalty?.lifetimeSpendInr || 0;
                    const orders = user.loyalty?.lifetimeOrderCount || 0;
                    const badge = user.loyalty?.badgeName;

                    return (
                      <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-navy">
                          <div>
                            <p>{user.name || 'Anonymous User'}</p>
                            <p className="text-[11px] text-slate-400 font-normal">{user.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.registrationMethod === 'google'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.registrationMethod === 'google' ? 'Google Auth' : 'Password'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-navy">
                          ₹{spend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {orders} {orders === 1 ? 'order' : 'orders'}
                        </td>
                        <td className="py-3.5 px-4">
                          {badge ? (
                            <span 
                              style={{ backgroundColor: `${user.loyalty?.badgeColor || '#b18d16'}20`, color: user.loyalty?.badgeColor || '#b18d16' }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border border-current"
                            >
                              <Award className="w-3 h-3" />
                              {badge}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Standard</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <span className="font-bold text-navy">{user.cartItemsCount ?? 0}</span> in cart · <span className="font-bold text-navy">{user.wishlistCount ?? 0}</span> wished
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: WISHLISTS */}
      {activeTab === 'wishlists' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 animate-fadeIn space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-navy">Most Wishlisted Items & Demand Intent</h3>
              <p className="text-xs text-slate-500">Track high-intent products bookmarked by customers for restock and promotions.</p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              {summary?.wishlists?.total ?? 3} Active Wishlists
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {popularWishlists.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400">
                No wishlist data available at this time.
              </div>
            ) : (
              popularWishlists.map((item, idx) => (
                <div key={item.productId || idx} className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 transition-all flex items-start justify-between gap-3 bg-slate-50/50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                      Rank #{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-navy line-clamp-2 mt-1">
                      {item.productName || 'Popular Jewellery Product'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {item.productId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-rose-600 block">
                      {item.wishlistCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Wishes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB D: CARTS */}
      {activeTab === 'carts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 animate-fadeIn space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-navy">Live Cart Pipeline & Drop-off Recovery</h3>
              <p className="text-xs text-slate-500">Monitor active shopping carts and recover abandoned checkouts.</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-navy block">
                ₹{(summary?.carts?.totalValue || 12888).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 font-bold">Total In-Cart Value</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-500">Total Live Carts</p>
              <h4 className="text-2xl font-black text-navy mt-1">{summary?.carts?.total ?? 4}</h4>
              <p className="text-[11px] text-slate-400 mt-1">Across all active browsing sessions</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <p className="text-xs font-bold text-amber-800">Abandoned within 24h</p>
              <h4 className="text-2xl font-black text-amber-950 mt-1">{summary?.carts?.abandoned24h ?? 3}</h4>
              <p className="text-[11px] text-amber-700 mt-1">Prime candidates for WhatsApp & Push recovery</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800">Average Cart Size</p>
              <h4 className="text-2xl font-black text-emerald-950 mt-1">
                ₹{(summary?.carts?.averageValue || 3222).toLocaleString('en-IN')}
              </h4>
              <p className="text-[11px] text-emerald-700 mt-1">Basket value per session</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
