import React, { useState } from 'react';
import { 
  User, 
  Package, 
  MapPin, 
  Coins, 
  Settings, 
  ArrowLeft, 
  Check, 
  Truck, 
  FileText, 
  Plus, 
  Trash2, 
  Gift, 
  ChevronRight,
  Phone,
  Award
} from 'lucide-react';
import { AddAddressModal, NewAddressData } from './AddAddressModal';

interface ProfilePageProps {
  onBackToHome?: () => void;
  onGoToWishlist?: () => void;
  onGoToCheckout?: () => void;
}

type TabKey = 'profile' | 'orders' | 'addresses' | 'wallet' | 'settings';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBackToHome,
  onGoToWishlist,
  onGoToCheckout,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('orders');

  // User Profile Form State
  const [userName, setUserName] = useState(() => {
    try {
      return localStorage.getItem('abb_user_profile_name') || '';
    } catch {
      return '';
    }
  });
  const [userEmail, setUserEmail] = useState(() => {
    try {
      return localStorage.getItem('abb_user_profile_email') || '';
    } catch {
      return '';
    }
  });
  const [userPhone, setUserPhone] = useState(() => {
    try {
      return localStorage.getItem('abb_user_profile_phone') || '';
    } catch {
      return '';
    }
  });
  const [userGender, setUserGender] = useState('Male');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Addresses State with localStorage persistence (no default dummy address)
  const [addresses, setAddresses] = useState<Array<{
    id: string;
    type: string;
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state?: string;
    pincode: string;
    isDefault?: boolean;
  }>>(() => {
    try {
      const saved = localStorage.getItem('abb_saved_addresses_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userSaved = parsed.filter((a: any) => a.id !== 'addr-1' && a.id !== 'addr-2' && a.name !== 'Rahul Sharma');
          return userSaved;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Sample Orders
  const orders = [
    {
      id: 'OFB-92841',
      date: '05 Oct 2026',
      status: 'In Transit',
      statusColor: 'text-[#A44101] bg-[#A44101]/10 border-[#A44101]/25',
      eta: 'Delivery Expected: 08 Oct 2026',
      total: 899,
      itemCount: 2,
      trackingStep: 2, // 1: Placed, 2: Shipped, 3: Out for Delivery, 4: Delivered
      items: [
        {
          title: '3-Layer Stainless Steel Insulated Hot Tiffin Box',
          image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80',
          price: 399,
          qty: 1,
        },
        {
          title: 'Ultra Magnetic Wireless Neckband Earphones Pro',
          image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&q=80',
          price: 500,
          qty: 1,
        },
      ],
    },
    {
      id: 'OFB-84912',
      date: '28 Sep 2026',
      status: 'Delivered',
      statusColor: 'text-navy bg-slate-100 border-slate-200',
      eta: 'Delivered on 01 Oct 2026',
      total: 1249,
      itemCount: 3,
      trackingStep: 4,
      items: [
        {
          title: 'Tri-Ply Heavy Bottom Pressure Cooker 3 Litre',
          image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80',
          price: 999,
          qty: 1,
        },
        {
          title: 'Multi-Surface Microfiber Spray Floor Cleaning Mop',
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80',
          price: 250,
          qty: 1,
        },
      ],
    },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('abb_user_profile_name', userName);
      localStorage.setItem('abb_user_profile_email', userEmail);
      localStorage.setItem('abb_user_profile_phone', userPhone);
    } catch {
      // storage unavailable
    }
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleSaveNewAddress = (newAddr: NewAddressData) => {
    const formattedAddress = {
      id: newAddr.id,
      type: newAddr.type,
      name: newAddr.name,
      phone: newAddr.phone,
      addressLine: newAddr.fullAddressString || `${newAddr.houseFlat}, ${newAddr.streetLine1}, ${newAddr.areaLocality}`,
      city: newAddr.city,
      state: newAddr.state || 'Delhi',
      pincode: newAddr.pincode,
      isDefault: addresses.length === 0,
    };
    const updated = [formattedAddress, ...addresses];
    setAddresses(updated);
    try {
      localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    try {
      localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    try {
      localStorage.setItem('abb_saved_addresses_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 animate-fadeIn">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Breadcrumb & Return to Store */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-navy hover:text-[#A44101] font-medium transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">My Account</span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-navy hover:text-[#A44101] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* User Hero Banner */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-navy text-white flex items-center justify-center font-bold text-2xl sm:text-3xl border-4 border-white shadow-md">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-navy">{userName || 'My Account'}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A44101]/10 text-[#A44101] border border-[#A44101]/25">
                  <Award className="w-3 h-3 text-[#A44101]" />
                  <span>Gold Member</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {userEmail || userPhone ? `${userEmail || ''} ${userEmail && userPhone ? '•' : ''} ${userPhone || ''}` : 'Manage your orders, saved addresses and preferences'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Member of Apna Bharat Bazaar
              </p>
            </div>
          </div>

          {/* Quick Counter Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="p-3 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <span className="block text-lg font-black text-navy">{orders.length}</span>
              <span className="text-[11px] text-slate-500 font-medium">Orders</span>
            </div>
            <button
              type="button"
              onClick={onGoToWishlist}
              className="p-3 bg-white hover:bg-stone-50 rounded-xl border border-stone-200 text-center shadow-xs transition-colors cursor-pointer"
            >
              <span className="block text-lg font-black text-[#A44101]">4</span>
              <span className="text-[11px] text-slate-500 font-medium">Wishlist</span>
            </button>
            <div className="p-3 bg-white rounded-xl border border-stone-200 text-center shadow-xs">
              <span className="block text-lg font-black text-[#A44101]">₹450</span>
              <span className="text-[11px] text-slate-500 font-medium">Baba Coins</span>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-soft p-2 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>My Orders & Tracking</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span>Profile Information</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Saved Delivery Addresses</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-current">
                {addresses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4" />
                <span>Wallet & Offer Coins</span>
              </div>
              <span className="text-[10px] font-bold text-[#A44101]">450 Pts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-stone-100 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Preferences & Security</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Right Tab Content View */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-soft p-5 sm:p-7 min-h-[460px]">
            
            {/* TAB 1: ORDERS & TRACKING */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-navy">Order History & Shipment Tracking</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Track your packages, download GST invoices, and reorder</p>
                  </div>
                  <span className="text-xs text-navy bg-slate-100 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                    All deliveries on schedule
                  </span>
                </div>

                <div className="space-y-5">
                  {orders.map((order) => (
                    <div 
                      key={order.id}
                      className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition-colors bg-stone-50/40"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-navy">{order.id}</span>
                          <span className="text-xs text-slate-500">• Placed on {order.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${order.statusColor}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-black text-navy">₹{order.total}</span>
                        </div>
                      </div>

                      {/* Live Tracking Visual Steps */}
                      <div className="py-4 px-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
                          <span className="text-[#A44101] font-bold">1. Order Placed</span>
                          <span className={order.trackingStep >= 2 ? 'text-[#A44101] font-bold' : 'text-slate-400'}>2. Shipped</span>
                          <span className={order.trackingStep >= 3 ? 'text-[#A44101] font-bold' : 'text-slate-400'}>3. Out for Delivery</span>
                          <span className={order.trackingStep >= 4 ? 'text-[#A44101] font-bold' : 'text-slate-400'}>4. Delivered</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#A44101] h-full rounded-full transition-all duration-500"
                            style={{ width: `${(order.trackingStep / 4) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-navy" />
                          <span>{order.eta}</span>
                        </p>
                      </div>

                      {/* Items Preview */}
                      <div className="space-y-3 pt-3 border-t border-slate-200/80">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                              />
                              <div>
                                <h4 className="text-xs font-bold text-navy line-clamp-1">{item.title}</h4>
                                <span className="text-[11px] text-slate-500">Qty: {item.qty} • ₹{item.price} each</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={onGoToCheckout}
                              className="text-xs font-bold text-[#A44101] hover:text-[#8C3701] shrink-0 cursor-pointer"
                            >
                              Buy Again
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Order Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 mt-3 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => alert(`Downloading Invoice for ${order.id}...`)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-stone-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Download Invoice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Tracking updates for ${order.id}: Dispatch from Bhiwandi Hub`)}
                          className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Live Track
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE INFORMATION */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-lg font-bold text-navy">Personal Profile Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your identity details for billing and shipping</p>
                </div>

                {isSavedNotice && (
                  <div className="p-3 bg-[#A44101]/10 border border-[#A44101]/25 rounded-xl text-[#A44101] text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#A44101]" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (India)</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                    <div className="flex gap-4">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <label key={g} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={userGender === g}
                            onChange={() => setUserGender(g)}
                            className="text-navy focus:ring-navy cursor-pointer"
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-navy">Saved Delivery Addresses</h2>
                    <p className="text-xs text-mutedGray mt-0.5">Manage multiple shipping addresses for fast checkout</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Saved Address Cards */}
                {addresses.length === 0 ? (
                  <div className="py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-stone-50/50 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
                      <MapPin className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy">No Addresses Saved</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        You have not added any delivery address yet. Add your delivery address for faster checkout.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add New Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-2xl border transition-all relative ${
                          addr.isDefault 
                            ? 'border-navy bg-stone-50/70 shadow-xs' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200/80 text-navy">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded border border-[#A44101]/20">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-[11px] font-bold text-[#A44101] hover:underline cursor-pointer"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-slate-400 hover:text-[#A44101] p-1 cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-navy">{addr.name}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {addr.addressLine}, {addr.city}, {addr.state} - <span className="font-bold text-navy">{addr.pincode}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{addr.phone}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WALLET & BABA COINS */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-navy">OfferWale Baba Coins &amp; Cashback</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Use coins during checkout for instant discounts (1 Coin = ₹1)</p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-navy via-navy to-slate-900 border border-slate-800 text-white shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-[#A44101] border border-white/20">
                      <Coins className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Total Available Balance</span>
                      <h3 className="text-3xl font-black">450 <span className="text-lg font-medium text-slate-300">Baba Coins</span></h3>
                      <p className="text-xs text-slate-300 mt-0.5">Worth ₹450 flat discount on your next order</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onGoToCheckout}
                    className="px-5 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                  >
                    Redeem at Checkout
                  </button>
                </div>

                {/* Available Coupon Scratch Cards */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#A44101]" />
                    <span>Active Promo Vouchers For You</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded">BABA100</span>
                        <p className="text-xs font-bold text-slate-800 mt-1">₹100 Flat OFF on Orders Above ₹599</p>
                        <span className="text-[10px] text-slate-500">Expires in 12 days</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Code BABA100 copied!')}
                        className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-navy bg-slate-200 px-2 py-0.5 rounded">FREESHIP</span>
                        <p className="text-xs font-bold text-slate-800 mt-1">Free Pan-India Express Delivery</p>
                        <span className="text-[10px] text-slate-500">No minimum cart value</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Code FREESHIP copied!')}
                        className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS & SECURITY */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-lg font-bold text-navy">Account Preferences &amp; Notifications</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Control communication channels and password security</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">WhatsApp Order Tracking Updates</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Receive dispatch tracking and live delivery OTP via WhatsApp</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-navy rounded cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Flash Deal &amp; Price Drop Alerts</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Get notified when items in your wishlist go on 70%+ clearance</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-navy rounded cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Two-Factor OTP Login</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Verify via SMS OTP on each new device login</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-navy rounded cursor-pointer" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to log out?')) {
                        onBackToHome?.();
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#A44101] hover:bg-[#A44101]/10 border border-slate-200 transition-colors cursor-pointer"
                  >
                    Log Out of Account
                  </button>
                  <span className="text-[11px] text-slate-500">Secured with 256-bit SSL</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 2-Step Add Address Modal Popup */}
      <AddAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSaveAddress={handleSaveNewAddress}
        initialValues={{
          name: userName,
          phone: userPhone.replace('+91 ', ''),
        }}
      />
    </div>
  );
};
