import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Search,
  Truck,
  Printer,
  FileCheck,
  Eye,
  X,
  Loader2,
  Package,
  CheckCircle2,
  Calendar,
  Phone,
  User,
  CreditCard,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAdminDropshipperOrders,
  setSelectedAdminOrder,
} from '../../../../store/adminDropshipperSlice';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'ready_to_ship', label: 'Ready to Ship' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

export const AdminDropshipperOrdersView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, ordersLoading, selectedOrder } = useAppSelector(
    (state) => state.adminDropshipper
  );

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Lock body scroll when modal is open to ensure 100% background freeze
  useEffect(() => {
    if (isDetailModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDetailModalOpen]);

  const loadOrders = () => {
    dispatch(
      fetchAdminDropshipperOrders({
        status: activeTab !== 'all' ? activeTab : undefined,
        q: searchQuery || undefined,
      })
    );
  };

  useEffect(() => {
    loadOrders();
  }, [dispatch, activeTab, searchQuery]);

  const handleOpenDetail = (ord: any) => {
    dispatch(setSelectedAdminOrder(ord));
    setIsDetailModalOpen(true);
  };

  const handlePrintLabel = (orderId: string) => {
    toast.success(`Generated shipping label for ${orderId}`);
    window.print();
  };

  const handleGenerateManifest = () => {
    toast.success('Courier pickup manifest generated for selected dropship orders.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-navy">Dropship Channel Orders</h2>
            {orders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-100 text-[#A44101]">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            Dedicated fulfillment dashboard for wholesale dropship orders (isolated from retail customers).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOrders}
            disabled={ordersLoading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin text-[#A44101]' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateManifest}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-navy bg-white hover:bg-slate-50 text-xs font-bold text-navy transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-[#A44101]" />
            <span>Generate Manifest</span>
          </button>
        </div>
      </div>

      {/* Tabs Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1 flex items-center gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#A44101] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, partner name, customer phone, or AWB..."
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
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {ordersLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
            <span className="text-xs font-bold">Loading dropship orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-sm font-black text-navy">No dropship orders found</h3>
              <p className="text-xs text-slate-500 mt-1">There are no orders in the "{activeTab}" tab.</p>
            </div>
            {(activeTab !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
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
                  <th className="py-3 px-4">Order ID &amp; Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Dropshipper</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Courier / AWB</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord: any) => {
                  const customerName =
                    ord.addressSnapshot?.fullName ||
                    ord.dropshipMeta?.customerName ||
                    ord.customer?.fullName ||
                    '—';
                  const customerPhone =
                    ord.addressSnapshot?.phone ||
                    ord.dropshipMeta?.customerPhone ||
                    ord.customer?.phone ||
                    '—';
                  const dropshipperId = ord.dropshipMeta?.dropshipperId;
                  const totalQty =
                    ord.items?.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0) ||
                    ord.items?.length ||
                    1;

                  return (
                    <tr key={ord.orderId || ord._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy">
                        <div>{ord.orderId}</div>
                        {(ord.dropshipMeta?.ref || ord.dropshipRef) && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Ref: {ord.dropshipMeta?.ref || ord.dropshipRef}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {dropshipperId ? (
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            Partner #{dropshipperId.slice(-6)}
                          </span>
                        ) : (
                          <span>{ord.dropshipper?.fullName || ord.dropshipperName || 'Partner'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-bold text-slate-800">{totalQty}</span> item(s)
                      </td>
                      <td className="py-3.5 px-4 font-black text-[#A44101]">
                        ₹{Number(ord.totalAmount || ord.pricing?.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        {(ord.shippingSnapshot?.courierName || ord.shipmentInfo?.courier || ord.courier) ? (
                          <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-[#A44101] shrink-0" />
                            <span className="truncate max-w-[130px]">{ord.shippingSnapshot?.courierName || ord.shipmentInfo?.courier || ord.courier}</span>
                          </div>
                        ) : (ord.tracking?.awb || ord.shipmentInfo?.awbCode || ord.awbCode) ? (
                          <div className="font-mono text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 shrink-0" />
                            <span>{ord.tracking?.awb || ord.shipmentInfo?.awbCode || ord.awbCode}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={ord.orderStatus || ord.status || 'pending'} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrintLabel(ord.orderId)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Print Shipping Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(ord)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* Order Detail Modal with Heavy Background Blur ported to document.body */}
      {isDetailModalOpen &&
        selectedOrder &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto transition-all duration-200"
            onClick={() => setIsDetailModalOpen(false)}
          >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scaleIn text-xs flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#A44101]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-navy font-mono">
                      Order {selectedOrder.orderId}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#A44101]">
                      Dropship
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Placed: {formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Top Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Fulfillment Status */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Fulfillment Status
                  </span>
                  <div>
                    <StatusBadge status={selectedOrder.orderStatus || 'pending'} size="sm" />
                  </div>
                </div>

                {/* Payment Status */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                    Payment Status
                  </span>
                  <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Prepaid Online</span>
                  </div>
                </div>

                {/* Dropship Partner */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Partner Account
                  </span>
                  <div className="font-mono text-xs font-bold text-navy truncate">
                    {selectedOrder.dropshipMeta?.dropshipperId
                      ? `Partner #${selectedOrder.dropshipMeta.dropshipperId.slice(-6)}`
                      : 'Wholesale Partner'}
                  </div>
                </div>
              </div>

              {/* Customer Recipient & Address */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Customer Recipient &amp; Delivery Destination</span>
                  </span>
                  {selectedOrder.dropshipMeta?.ref && (
                    <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      Ref: {selectedOrder.dropshipMeta.ref}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <div className="text-sm font-black text-navy">
                    {selectedOrder.addressSnapshot?.fullName ||
                      selectedOrder.dropshipMeta?.customerName ||
                      selectedOrder.customer?.fullName ||
                      'Customer Recipient'}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {selectedOrder.addressSnapshot?.phone ||
                        selectedOrder.dropshipMeta?.customerPhone ||
                        selectedOrder.customer?.phone ||
                        'No phone provided'}
                    </span>
                  </div>

                  {selectedOrder.addressSnapshot && (
                    <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#A44101] shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        {selectedOrder.addressSnapshot.addressLine1 && (
                          <div className="font-medium text-slate-800">
                            {selectedOrder.addressSnapshot.addressLine1}
                          </div>
                        )}
                        {selectedOrder.addressSnapshot.addressLine2 && (
                          <div className="text-slate-600">
                            {selectedOrder.addressSnapshot.addressLine2}
                          </div>
                        )}
                        {!selectedOrder.addressSnapshot.addressLine1 &&
                          (selectedOrder.addressSnapshot.houseNumber ||
                            selectedOrder.addressSnapshot.building ||
                            selectedOrder.addressSnapshot.area) && (
                            <div className="text-slate-700">
                              {[
                                selectedOrder.addressSnapshot.houseNumber,
                                selectedOrder.addressSnapshot.building,
                                selectedOrder.addressSnapshot.area,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        <div className="text-slate-600 font-medium">
                          {[
                            selectedOrder.addressSnapshot.city,
                            selectedOrder.addressSnapshot.state,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                          {selectedOrder.addressSnapshot.postalCode
                            ? ` - ${selectedOrder.addressSnapshot.postalCode}`
                            : ''}
                        </div>
                        <div className="text-[11px] text-slate-400">Country: India</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ordered Items List */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#A44101]" />
                      <span>
                        Ordered Products ({selectedOrder.items.length}{' '}
                        {selectedOrder.items.length === 1 ? 'line' : 'lines'})
                      </span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 font-bold text-slate-600">
                      Wholesale SKU
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200/80">
                    {selectedOrder.items.map((it: any, idx: number) => {
                      const unitPrice =
                        it.priceSnapshot?.sale ?? it.priceSnapshot?.base ?? 0;
                      const lineTotal =
                        it.priceSnapshot?.total ??
                        unitPrice * (Number(it.quantity) || 1);
                      return (
                        <div
                          key={idx}
                          className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100/70 border border-orange-200/80 flex items-center justify-center text-[#A44101] shrink-0 font-bold">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-navy text-xs font-mono">
                                Product #{it.productCode || 'Item'}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Unit: ₹{Number(unitPrice).toLocaleString('en-IN')} &times;{' '}
                                {it.quantity || 1}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-900 text-xs">
                              ₹{Number(lineTotal).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium">
                              Paid
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Financial & Price Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Financial Breakdown</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    Razorpay Online
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Items Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{Number(selectedOrder.subtotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery &amp; Freight:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{Number(selectedOrder.deliveryCharges || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {Number(selectedOrder.tax || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST / Tax:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{Number(selectedOrder.tax).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {Number(selectedOrder.discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount Applied:</span>
                      <span className="font-semibold">
                        -₹{Number(selectedOrder.discount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                    <span className="font-bold text-navy">Order Total:</span>
                    <span className="font-black text-[#A44101]">
                      ₹{Number(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-emerald-700 pt-0.5">
                    <span className="font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Total Paid Upfront:
                    </span>
                    <span className="font-bold">
                      ₹{Number(selectedOrder.amountPaidInr ?? selectedOrder.totalAmount ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {Number(selectedOrder.balanceDueInr || 0) > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-rose-600 pt-0.5">
                      <span className="font-medium">Balance Due:</span>
                      <span className="font-bold">
                        ₹{Number(selectedOrder.balanceDueInr).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Courier & Shipping Logistics */}
              {selectedOrder.shippingSnapshot && (
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#A44101] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Shipping &amp; Logistics Snapshot</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#A44101] uppercase tracking-wide">
                      {selectedOrder.shippingSnapshot.provider
                        ? String(selectedOrder.shippingSnapshot.provider).toUpperCase()
                        : 'SHIPROCKET'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Assigned Courier:</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedOrder.shippingSnapshot.courierName || 'Surface Shipping'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Estimated Delivery:</span>
                      <strong className="text-slate-800 text-xs">
                        {selectedOrder.shippingSnapshot.estimatedDays
                          ? `${selectedOrder.shippingSnapshot.estimatedDays} Days ETA`
                          : '3-5 Business Days'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handlePrintLabel(selectedOrder.orderId)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#A44101] hover:bg-[#8C3701] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Packaging Slip &amp; Shipping Label</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
