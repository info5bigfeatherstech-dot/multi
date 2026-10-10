import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Trash2,
  Edit3,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { adminStaffApi } from '../../../api/adminApi';
import { StaffRole, StaffPermissionsMatrix, PermissionAction } from '../../../api/types';

// Standard 8 permission modules
const PERMISSION_MODULES: Array<{ key: string; label: string; desc: string }> = [
  { key: 'orders', label: 'Orders & Fulfillment', desc: 'Order processing, packing, status updates' },
  { key: 'products', label: 'Products & Catalog', desc: 'Product creation, pricing, inventory stock' },
  { key: 'returns', label: 'Returns & RTO', desc: 'Reverse logistics, refunds & dispute resolution' },
  { key: 'marketing', label: 'Marketing & Coupons', desc: 'Discount vouchers, promo codes & campaigns' },
  { key: 'reviews', label: 'Reviews & Ratings', desc: 'Customer feedback moderation & replies' },
  { key: 'analytics', label: 'Store Analytics', desc: 'Sales velocity, revenue & conversion reports' },
  { key: 'utilities', label: 'System Utilities', desc: 'Bulk imports, export tools, system caches' },
  { key: 'staff', label: 'Staff Management', desc: 'Staff account creation & role assignments' },
];

// Role Default Presets
const ROLE_PRESETS: Record<StaffRole, StaffPermissionsMatrix> = {
  admin: {
    orders: { read: true, create: true, update: true, delete: true },
    products: { read: true, create: true, update: true, delete: true },
    returns: { read: true, create: true, update: true, delete: true },
    marketing: { read: true, create: true, update: true, delete: true },
    reviews: { read: true, create: true, update: true, delete: true },
    analytics: { read: true, create: true, update: true, delete: true },
    utilities: { read: true, create: true, update: true, delete: true },
    staff: { read: true, create: true, update: true, delete: false },
  },
  product_manager: {
    orders: { read: true, create: false, update: false, delete: false },
    products: { read: true, create: true, update: true, delete: false },
    returns: { read: false, create: false, update: false, delete: false },
    marketing: { read: true, create: false, update: false, delete: false },
    reviews: { read: true, create: false, update: true, delete: false },
    analytics: { read: true, create: false, update: false, delete: false },
    utilities: { read: true, create: true, update: true, delete: false },
    staff: { read: false, create: false, update: false, delete: false },
  },
  order_manager: {
    orders: { read: true, create: true, update: true, delete: false },
    products: { read: true, create: false, update: false, delete: false },
    returns: { read: true, create: true, update: true, delete: false },
    marketing: { read: false, create: false, update: false, delete: false },
    reviews: { read: true, create: false, update: false, delete: false },
    analytics: { read: true, create: false, update: false, delete: false },
    utilities: { read: true, create: false, update: false, delete: false },
    staff: { read: false, create: false, update: false, delete: false },
  },
  marketing_manager: {
    orders: { read: true, create: false, update: false, delete: false },
    products: { read: true, create: false, update: false, delete: false },
    returns: { read: false, create: false, update: false, delete: false },
    marketing: { read: true, create: true, update: true, delete: false },
    reviews: { read: true, create: true, update: true, delete: false },
    analytics: { read: true, create: false, update: false, delete: false },
    utilities: { read: true, create: false, update: false, delete: false },
    staff: { read: false, create: false, update: false, delete: false },
  },
};

const getDefaultPermissions = (role: StaffRole): StaffPermissionsMatrix => {
  return JSON.parse(JSON.stringify(ROLE_PRESETS[role] || ROLE_PRESETS.order_manager));
};

export const AdminStaffView: React.FC = () => {
  // Staff list & query states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });

  // Notifications feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [resetStaffTarget, setResetStaffTarget] = useState<any | null>(null);
  const [resetOtpStep, setResetOtpStep] = useState<1 | 2>(1);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // My Profile Modal
  const [myProfile, setMyProfile] = useState<any | null>(null);
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState(false);

  // Form State for Add
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'order_manager' as StaffRole,
    password: '',
    permissions: getDefaultPermissions('order_manager'),
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Fetch Staff Members
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const params: any = {
        page,
        limit,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter !== 'all') params.role = roleFilter;

      const res = await adminStaffApi.listStaff(params);
      const items = Array.isArray(res) ? res : res?.data || res?.staff || [];
      const total = res?.pagination?.total ?? res?.total ?? items.length;
      const totalPages = res?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));

      setStaffList(items);
      setPaginationMeta({ total, totalPages });
    } catch (err: any) {
      console.warn('Staff fetch fallback:', err);
      // Fallback local memory list
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, roleFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handle Add Staff
  const handleRoleChangeForNew = (r: StaffRole) => {
    setNewStaff((prev) => ({
      ...prev,
      role: r,
      permissions: getDefaultPermissions(r),
    }));
  };

  const handlePermissionToggleForNew = (moduleKey: string, action: keyof PermissionAction) => {
    setNewStaff((prev) => {
      const currModule = prev.permissions[moduleKey] || { read: false, create: false, update: false, delete: false };
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: {
            ...currModule,
            [action]: !currModule[action],
          },
        },
      };
    });
  };

  const handleSubmitAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;

    setIsSubmittingAdd(true);
    try {
      await adminStaffApi.createStaff({
        name: newStaff.name.trim(),
        email: newStaff.email.trim(),
        phone: newStaff.phone.trim() || undefined,
        role: newStaff.role,
        password: newStaff.password.trim() || undefined,
        permissions: newStaff.permissions,
      });

      showToast(`Staff member "${newStaff.name}" created successfully! ✓`);
      setIsAddModalOpen(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        role: 'order_manager',
        password: '',
        permissions: getDefaultPermissions('order_manager'),
      });
      fetchStaff();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create staff member', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Edit Staff
  const handleStartEdit = (staff: any) => {
    setEditingStaff({
      ...staff,
      id: staff.id || staff._id,
      permissions: staff.permissions ? JSON.parse(JSON.stringify(staff.permissions)) : getDefaultPermissions(staff.role || 'order_manager'),
    });
  };

  const handlePermissionToggleForEdit = (moduleKey: string, action: keyof PermissionAction) => {
    if (!editingStaff) return;
    setEditingStaff((prev: any) => {
      const curr = prev.permissions[moduleKey] || { read: false, create: false, update: false, delete: false };
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: {
            ...curr,
            [action]: !curr[action],
          },
        },
      };
    });
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await adminStaffApi.updateStaff(editingStaff.id, {
        name: editingStaff.name,
        phone: editingStaff.phone,
        role: editingStaff.role,
        isActive: editingStaff.isActive,
        permissions: editingStaff.permissions,
      });

      showToast(`Updated details for "${editingStaff.name}"! ✓`);
      setEditingStaff(null);
      fetchStaff();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update staff member', 'error');
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (staff: any) => {
    const nextState = !staff.isActive;
    const staffId = staff.id || staff._id;
    try {
      await adminStaffApi.updateStaff(staffId, { isActive: nextState });
      showToast(`Staff "${staff.name}" is now ${nextState ? 'Active' : 'Deactivated'}!`);
      setStaffList((prev) =>
        prev.map((s) => ((s.id || s._id) === staffId ? { ...s, isActive: nextState } : s))
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not toggle status', 'error');
    }
  };

  // Delete Staff
  const handleDeleteStaff = async (staff: any) => {
    const staffId = staff.id || staff._id;
    if (!window.confirm(`Are you sure you want to deactivate and remove staff account "${staff.name}"?`)) {
      return;
    }

    try {
      await adminStaffApi.deleteStaff(staffId);
      showToast(`Staff member "${staff.name}" removed successfully.`);
      fetchStaff();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete staff member', 'error');
    }
  };

  // Password Reset Flow (Admin Triggered)
  const handleStartReset = (staff: any) => {
    setResetStaffTarget(staff);
    setResetOtpStep(1);
    setResetOtp('');
    setResetNewPassword('');
  };

  const handleSendResetOtp = async () => {
    if (!resetStaffTarget) return;
    setIsResetSubmitting(true);
    const staffId = resetStaffTarget.id || resetStaffTarget._id;
    try {
      await adminStaffApi.initiateStaffReset(staffId);
      showToast(`Password reset OTP dispatched to ${resetStaffTarget.email} ✓`);
      setResetOtpStep(2);
    } catch (err: any) {
      showToast(err?.message || 'Failed to send OTP to staff email', 'error');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaffTarget || !resetOtp.trim() || !resetNewPassword.trim()) return;
    setIsResetSubmitting(true);
    const staffId = resetStaffTarget.id || resetStaffTarget._id;
    try {
      await adminStaffApi.verifyStaffReset(staffId, {
        otp: resetOtp.trim(),
        newPassword: resetNewPassword.trim(),
      });
      showToast(`Password updated successfully for ${resetStaffTarget.name}! ✓`);
      setResetStaffTarget(null);
    } catch (err: any) {
      showToast(err?.message || 'Invalid OTP or password requirement not met', 'error');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // My Profile Modal
  const handleOpenMyProfile = async () => {
    setIsMyProfileModalOpen(true);
    try {
      const data = await adminStaffApi.getMyProfile();
      setMyProfile(data?.staff || data?.profile || data);
    } catch {
      // offline fallback
      setMyProfile({
        name: localStorage.getItem('abb_user_profile_name') || 'Super Admin',
        email: localStorage.getItem('abb_user_profile_email') || 'admin@store.com',
        role: 'admin',
        isActive: true,
      });
    }
  };

  // Filtered displayed staff
  const displayedStaff = staffList.filter((s) => {
    if (statusFilter === 'active') return s.isActive !== false;
    if (statusFilter === 'inactive') return s.isActive === false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy flex items-center gap-2">
                <span>Staff &amp; Role Management</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                  v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign granular permissions, manage access levels, and issue secure OTP password resets
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStaff}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-navy transition-colors cursor-pointer"
            title="Refresh Staff List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#A44101]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenMyProfile}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#A44101]" />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2 active:scale-98"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* 2. Feedback Notice */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search staff by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-navy shadow-2xs'
                    : 'text-slate-600 hover:text-navy'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Role:</span>
          </span>
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'admin', label: 'Super Admin' },
            { id: 'product_manager', label: 'Product Manager' },
            { id: 'order_manager', label: 'Order Manager' },
            { id: 'marketing_manager', label: 'Marketing Manager' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRoleFilter(r.id);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === r.id
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Staff Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#A44101] animate-spin mx-auto" />
            <p className="text-xs font-bold text-navy">Fetching staff roster from server...</p>
          </div>
        ) : displayedStaff.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">No Staff Members Found</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search query or role filters.'
                  : 'Start onboarding operational team members by clicking "+ Add New Staff".'}
              </p>
            </div>
            {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs font-bold text-[#A44101] hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">2FA / Security</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedStaff.map((staff) => {
                  const staffId = staff.id || staff._id;
                  const roleName = String(staff.role || 'staff').toLowerCase();
                  const isActive = staff.isActive !== false;

                  let roleBadgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                  let roleDisplay = 'Staff';

                  if (roleName === 'admin') {
                    roleBadgeStyle = 'bg-amber-50 text-amber-900 border-amber-200';
                    roleDisplay = 'Super Admin';
                  } else if (roleName === 'product_manager') {
                    roleBadgeStyle = 'bg-purple-50 text-purple-900 border-purple-200';
                    roleDisplay = 'Product Manager';
                  } else if (roleName === 'order_manager') {
                    roleBadgeStyle = 'bg-blue-50 text-blue-900 border-blue-200';
                    roleDisplay = 'Order Manager';
                  } else if (roleName === 'marketing_manager') {
                    roleBadgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                    roleDisplay = 'Marketing Manager';
                  }

                  return (
                    <tr key={staffId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-navy text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {(staff.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-navy block text-xs sm:text-sm">
                              {staff.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {staff.email}
                            </span>
                            {staff.phone && (
                              <span className="text-[10px] text-slate-400 block">
                                {staff.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleBadgeStyle}`}>
                          <Shield className="w-3 h-3" />
                          <span>{roleDisplay}</span>
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                          title={`Click to ${isActive ? 'deactivate' : 'activate'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* 2FA */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {staff.twoFactorEnabled ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>Enabled</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard</span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {staff.lastLogin
                          ? new Date(staff.lastLogin).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(staff)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Permissions & Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartReset(staff)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#A44101] hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Send Password Reset OTP"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete / Remove Staff"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Bar */}
        {paginationMeta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs bg-slate-50/50">
            <span className="text-slate-500">
              Showing page <span className="font-bold text-navy">{page}</span> of{' '}
              <span className="font-bold text-navy">{paginationMeta.totalPages}</span> ({paginationMeta.total} staff)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= paginationMeta.totalPages}
                onClick={() => setPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: ADD NEW STAFF MEMBER
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#A44101]/10 text-[#A44101] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Add New Staff Member</h3>
                  <p className="text-xs text-slate-500">Create an operational account with assigned permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="e.g. Neha Verma"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Work Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="neha.verma@apexstore.in"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="TempPassword@2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['admin', 'product_manager', 'order_manager', 'marketing_manager'] as StaffRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChangeForNew(r)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                        newStaff.role === r
                          ? 'border-[#A44101] bg-[#A44101]/10 text-[#A44101] shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="capitalize block">{r.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {r === 'admin' ? 'Full Access' : r === 'product_manager' ? 'Catalog Only' : r === 'order_manager' ? 'Orders & RTO' : 'Growth & Promos'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#A44101]" />
                    <span>Granular Permissions Matrix</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewStaff((prev) => ({ ...prev, permissions: getDefaultPermissions(prev.role) }))}
                    className="text-[11px] font-bold text-[#A44101] hover:underline cursor-pointer"
                  >
                    Reset to Role Defaults
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-2 text-center">Read</th>
                        <th className="py-2.5 px-2 text-center">Create</th>
                        <th className="py-2.5 px-2 text-center">Update</th>
                        <th className="py-2.5 px-2 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {PERMISSION_MODULES.map((m) => {
                        const modPerm = newStaff.permissions[m.key] || { read: false, create: false, update: false, delete: false };
                        return (
                          <tr key={m.key} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <span className="font-bold text-navy block text-xs">{m.label}</span>
                              <span className="text-[10px] text-slate-400 block">{m.desc}</span>
                            </td>
                            {(['read', 'create', 'update', 'delete'] as Array<keyof PermissionAction>).map((action) => (
                              <td key={action} className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(modPerm[action])}
                                  onChange={() => handlePermissionToggleForNew(m.key, action)}
                                  className="w-4 h-4 rounded text-navy focus:ring-navy border-slate-300 cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-6 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmittingAdd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSubmittingAdd ? 'Creating...' : 'Create Staff Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT STAFF DETAILS & PERMISSIONS
          ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Edit Staff Member</h3>
                  <p className="text-xs text-slate-500">Update roles, contact info, and permission overrides</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editingStaff.phone || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  >
                    <option value="admin">Super Admin</option>
                    <option value="product_manager">Product Manager</option>
                    <option value="order_manager">Order Manager</option>
                    <option value="marketing_manager">Marketing Manager</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingStaff.isActive !== false}
                      onChange={(e) => setEditingStaff({ ...editingStaff, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-navy focus:ring-navy border-slate-300"
                    />
                    <span>Account Active (Allowed to log in)</span>
                  </label>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#A44101]" />
                    <span>Granular Permissions Matrix</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingStaff((prev: any) => ({
                        ...prev,
                        permissions: getDefaultPermissions(prev.role as StaffRole),
                      }))
                    }
                    className="text-[11px] font-bold text-[#A44101] hover:underline cursor-pointer"
                  >
                    Reset to Role Defaults
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-2 text-center">Read</th>
                        <th className="py-2.5 px-2 text-center">Create</th>
                        <th className="py-2.5 px-2 text-center">Update</th>
                        <th className="py-2.5 px-2 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {PERMISSION_MODULES.map((m) => {
                        const modPerm = editingStaff.permissions?.[m.key] || { read: false, create: false, update: false, delete: false };
                        return (
                          <tr key={m.key} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3">
                              <span className="font-bold text-navy block text-xs">{m.label}</span>
                            </td>
                            {(['read', 'create', 'update', 'delete'] as Array<keyof PermissionAction>).map((action) => (
                              <td key={action} className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(modPerm[action])}
                                  onChange={() => handlePermissionToggleForEdit(m.key, action)}
                                  className="w-4 h-4 rounded text-navy focus:ring-navy border-slate-300 cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADMIN-DISPATCHED PASSWORD RESET OTP
          ========================================================================= */}
      {resetStaffTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">Reset Staff Password</h3>
                  <p className="text-xs text-slate-500">{resetStaffTarget.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetStaffTarget(null)}
                className="text-slate-400 hover:text-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetOtpStep === 1 ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Trigger an automated password reset verification OTP to this staff member's registered email address:{' '}
                  <strong className="text-navy font-mono">{resetStaffTarget.email}</strong>.
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStaffTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={isResetSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {isResetSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    <span>Dispatch Reset OTP</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyReset} className="space-y-3">
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold">
                  ✓ OTP dispatched to {resetStaffTarget.email}. Enter the received code below:
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="e.g. 492810"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono tracking-widest bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Secure Password</label>
                  <input
                    type="password"
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="NewSecurePassword#2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStaffTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetSubmitting}
                    className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {isResetSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Verify &amp; Set Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: MY PROFILE & EFFECTIVE PERMISSIONS
          ========================================================================= */}
      {isMyProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">My Staff Profile &amp; Permissions</h3>
                  <p className="text-xs text-slate-500">Effective permissions for current logged-in session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMyProfileModalOpen(false)}
                className="text-slate-400 hover:text-navy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {myProfile ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold text-navy">{myProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-mono text-slate-700">{myProfile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Role:</span>
                    <span className="font-bold text-[#A44101] capitalize">
                      {String(myProfile.role || 'admin').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Status:</span>
                    <span className="font-bold text-emerald-700">Active</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMyProfileModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-light cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#A44101] mx-auto" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffView;
