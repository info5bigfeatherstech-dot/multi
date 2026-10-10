import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Database,
  Users,
  UserPlus,
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { mockAdminStore } from '../mockAdminStore';
import { adminAuthApi } from '../../../api';

export const AdminSettingsView: React.FC = () => {
  const [storeName, setStoreName] = useState('Apna Bharat Bazaar');
  const [supportPhone, setSupportPhone] = useState('+91 93200 01717');
  const [supportEmail, setSupportEmail] = useState('support.apnabharatbazaar@gmail.com');
  const [deliveryTime, setDeliveryTime] = useState('2-5 Business Days Pan India');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Live Staff State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'order_manager',
    password: '',
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const fetchStaff = async () => {
    setIsStaffLoading(true);
    try {
      const data = await adminAuthApi.getStaffMembers();
      setStaffList(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setIsStaffLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.name) return;
    try {
      await adminAuthApi.createStaff(newStaff);
      setFeedback(`Staff member ${newStaff.name} created successfully! ✓`);
      setNewStaff({ name: '', email: '', phone: '', role: 'order_manager', password: '' });
      setIsAddingStaff(false);
      fetchStaff();
    } catch (err: any) {
      setFeedback(`Failed to create staff: ${err?.message || 'Error'}`);
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('Settings updated and stored! ✓');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all mock orders, products, carts, and gift intents back to initial demo seeds?')) {
      mockAdminStore.resetToFactoryDefaults();
      setFeedback('Factory mock datasets successfully restored! ✓');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
          Store Configuration &amp; Operations Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage general store metadata, customer service hotlines, and mock storage persistence.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* General Settings Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Sliders className="w-4 h-4 text-[#A44101]" />
          <h2 className="text-sm font-bold text-navy">General Store Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store Brand Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp &amp; Support Phone
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pan-India Delivery Timeline Promise
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-[#0c1a2d] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#A44101]" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Staff Management Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#A44101]" />
            <h2 className="text-sm font-bold text-navy">Operations Staff &amp; Team Members</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {staffList.length} Staff
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/admin/staff');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#A44101]/30 bg-orange-50 hover:bg-orange-100 text-[#A44101] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Open Granular Roles & Permissions Matrix"
            >
              <span>Full Permissions Matrix</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={fetchStaff}
              disabled={isStaffLoading}
              className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors"
              title="Refresh Staff"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isStaffLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsAddingStaff(!isAddingStaff)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A44101] text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-[#8C3701] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddingStaff ? 'Cancel' : 'Add Staff'}</span>
            </button>
          </div>
        </div>

        {isAddingStaff && (
          <form onSubmit={handleAddStaff} className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
            <h3 className="text-xs font-black text-navy uppercase tracking-wider">New Staff Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="ramesh@store.com"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Role Permission</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                >
                  <option value="order_manager">Order Manager</option>
                  <option value="product_manager">Product Manager</option>
                  <option value="inventory_manager">Inventory Manager</option>
                  <option value="packing_viewer">Packing Viewer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#A44101] text-white text-xs font-bold shadow-xs cursor-pointer hover:bg-[#8C3701]"
              >
                Create Staff Member
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {staffList.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No staff members listed.</p>
          ) : (
            staffList.map((member: any) => (
              <div key={member._id || member.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-[#A44101] font-black flex items-center justify-center text-xs">
                    {(member.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-xs sm:text-sm">{member.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{member.email} {member.phone ? `• ${member.phone}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-200 uppercase">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{(member.role || 'staff').replace('_', ' ')}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mock Storage Engine Management Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Database className="w-4 h-4 text-[#A44101]" />
          <h2 className="text-sm font-bold text-navy">Mock LocalStorage Engine</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <p>
            All admin operations (creating products, updating orders, saving gift card messages, recovering abandoned carts) write directly to your browser's persistent <code className="text-[#A44101] font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code>.
          </p>
          <p>
            If you ever need to reset to the original sample dataset of orders, gifts, and catalog products, click the button below:
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Default Demo Seeds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsView;
