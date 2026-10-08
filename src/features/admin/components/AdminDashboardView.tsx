import React from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Gift, 
  Eye, 
  Calendar,
  TrendingUp
} from 'lucide-react';
import { mockAdminStore } from '../mockAdminStore';

interface AdminDashboardViewProps {
  onNavigateToOrders: (statusFilter?: string) => void;
  onNavigateToProducts: () => void;
  onNavigateToAbandoned: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateToOrders,
  onNavigateToProducts,
  onNavigateToAbandoned,
}) => {
  const kpis = mockAdminStore.getDashboardKPIs();
  const allOrders = mockAdminStore.getOrders();
  const recentOrders = allOrders.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Page Title & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time analytics, order pipelines, and gift fulfillment status across India.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#A44101]" />
          <span>Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 2. Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              ₹
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-navy font-roboto">
              ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% from last week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Customers & Leads */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Leads &amp; Users
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-navy font-roboto">
              {kpis.totalCustomers}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Active verified Indian shoppers
            </p>
          </div>
        </div>

        {/* Card 3: Active Products */}
        <div 
          onClick={onNavigateToProducts}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-3xl font-black text-navy font-roboto">
                {kpis.activeProducts}
              </h3>
              {kpis.outOfStockCount > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {kpis.outOfStockCount} Out of Stock
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-[#A44101] group-hover:underline mt-1 flex items-center gap-1">
              <span>Manage Catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* Card 4: Abandoned Carts */}
        <div 
          onClick={onNavigateToAbandoned}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Abandoned Carts
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black text-navy font-roboto">
              {kpis.abandonedCartsCount}
            </h3>
            <p className="text-[11px] font-bold text-rose-600 group-hover:underline mt-1 flex items-center gap-1">
              <span>View Recovery Queue</span>
              <ArrowUpRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>

      {/* 3. Order Bucket Counters Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-navy">
              Live Order Fulfillment Buckets
            </h2>
            <p className="text-xs text-slate-500">
              Click any bucket to filter orders immediately
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToOrders('All')}
            className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
          >
            View All ({kpis.totalOrders})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Bucket 1: Pending */}
          <button
            type="button"
            onClick={() => onNavigateToOrders('Pending')}
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-amber-700">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-black">{kpis.buckets.pending}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              Pending
            </span>
          </button>

          {/* Bucket 2: Confirmed */}
          <button
            type="button"
            onClick={() => onNavigateToOrders('Confirmed')}
            className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-lg font-black">{kpis.buckets.confirmed}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              Confirmed
            </span>
          </button>

          {/* Bucket 3: Processing */}
          <button
            type="button"
            onClick={() => onNavigateToOrders('Processing')}
            className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-purple-700">
              <Package className="w-4 h-4" />
              <span className="text-lg font-black">{kpis.buckets.processing}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              Processing
            </span>
          </button>

          {/* Bucket 4: Shipped */}
          <button
            type="button"
            onClick={() => onNavigateToOrders('Shipped')}
            className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-indigo-700">
              <Truck className="w-4 h-4" />
              <span className="text-lg font-black">{kpis.buckets.shipped}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              In Transit
            </span>
          </button>

          {/* Bucket 5: Delivered */}
          <button
            type="button"
            onClick={() => onNavigateToOrders('Delivered')}
            className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-lg font-black">{kpis.buckets.delivered}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              Delivered
            </span>
          </button>

          {/* Bucket 6: Cancelled */}
          <button
            type="button"
            onClick={() => onNavigateToOrders('Cancelled')}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500">
              <XCircle className="w-4 h-4" />
              <span className="text-lg font-black">{kpis.buckets.cancelled}</span>
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2 block">
              Cancelled
            </span>
          </button>
        </div>
      </div>

      {/* 4. Recent Orders Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-bold text-navy">
              Recent Orders
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#A44101]/10 text-[#A44101] text-[11px] font-black">
              {kpis.giftOrders} Gift Orders Active 🎁
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToOrders('All')}
            className="text-xs font-bold text-[#A44101] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Go to Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((ord) => {
                const isGift = ord.isGiftOrder;
                return (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Order ID & Time */}
                    <td className="py-3 px-4 font-mono font-bold text-navy">
                      <div>{ord.orderNumber}</div>
                      <span className="text-[10px] text-slate-400 font-sans">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400">{ord.customerPhone}</div>
                    </td>

                    {/* Type / Gift Intent */}
                    <td className="py-3 px-4">
                      {isGift ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[#A44101] font-black text-[11px] border border-amber-200">
                          <Gift className="w-3 h-3 text-[#A44101]" />
                          <span>{ord.giftIntent?.occasion || 'Gift'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px]">
                          Regular
                        </span>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {ord.items.length} item{ord.items.length > 1 ? 's' : ''}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-extrabold text-navy font-roboto">
                      ₹{ord.totalAmount}
                      <span className="text-[10px] text-slate-400 ml-1 font-normal uppercase">
                        {ord.paymentMethod}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ord.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        ord.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        ord.status === 'Processing' ? 'bg-purple-100 text-purple-800' :
                        ord.status === 'Shipped' ? 'bg-indigo-100 text-indigo-800' :
                        ord.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ord.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateToOrders(ord.status)}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-navy cursor-pointer"
                        title="Manage Order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
