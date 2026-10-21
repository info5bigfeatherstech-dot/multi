import { apiClient, normalizeApiError } from "./client";

/* ============================================================
   1. ADMIN AUTH & STAFF MANAGEMENT (10 Full API Endpoints)
   ============================================================ */
export const adminStaffApi = {
  // 1. List Staff (GET /admin/staff) - paginated with search & role filter
  listStaff: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    try {
      const res = await apiClient.get("/admin/staff", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 2. Get Staff Details (GET /admin/staff/:id)
  getStaffDetails: async (id: string) => {
    try {
      const res = await apiClient.get(`/admin/staff/${encodeURIComponent(id)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 3. Create Staff (POST /admin/staff)
  createStaff: async (payload: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    password?: string;
    permissions?: Record<string, any>;
  }) => {
    try {
      const res = await apiClient.post("/admin/staff", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 4. Update Staff (PUT /admin/staff/:id)
  updateStaff: async (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
      permissions?: Record<string, any>;
      [key: string]: any;
    }
  ) => {
    try {
      const res = await apiClient.put(`/admin/staff/${encodeURIComponent(id)}`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 5. Delete / Deactivate Staff (DELETE /admin/staff/:id)
  deleteStaff: async (id: string) => {
    try {
      const res = await apiClient.delete(`/admin/staff/${encodeURIComponent(id)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 6. Initiate Staff Reset (POST /admin/staff/:id/initiate-reset)
  initiateStaffReset: async (id: string) => {
    try {
      const res = await apiClient.post(`/admin/staff/${encodeURIComponent(id)}/initiate-reset`, {});
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 7. Verify Staff Reset (POST /admin/staff/:id/verify-reset)
  verifyStaffReset: async (id: string, payload: { otp: string; newPassword: string }) => {
    try {
      const res = await apiClient.post(`/admin/staff/${encodeURIComponent(id)}/verify-reset`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 8. Get My Profile (GET /admin/staff/profile/me)
  getMyProfile: async () => {
    try {
      const res = await apiClient.get("/admin/staff/profile/me");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  updateMyProfile: async (payload: { name?: string; phone?: string; email?: string; [key: string]: any }) => {
    try {
      const res = await apiClient.put("/admin/staff/profile/me", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 9. Initiate Self Reset (POST /admin/staff/profile/me/initiate-password-reset)
  initiateSelfReset: async () => {
    try {
      const res = await apiClient.post("/admin/staff/profile/me/initiate-password-reset", {});
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 10. Verify Self Reset (POST /admin/staff/profile/me/verify-password-reset)
  verifySelfReset: async (payload: { otp: string; newPassword: string }) => {
    try {
      const res = await apiClient.post("/admin/staff/profile/me/verify-password-reset", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

export const adminAuthApi = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const res = await apiClient.post("/auth/login", {
        identifier: credentials.email.trim(),
        password: credentials.password,
        portal: "admin-ecomm",
      });
      const data = res.data?.data || res.data;
      const token = data?.accessToken || data?.token;
      if (token) {
        localStorage.setItem("admin_access_token", token);
      }
      return {
        ...data,
        token,
      };
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  logout: () => {
    localStorage.removeItem("admin_access_token");
  },
  getStaffMembers: async (params?: any) => {
    try {
      const res = await apiClient.get("/admin/staff", { params });
      return res.data?.data?.staff || res.data?.data || res.data?.staff || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  createStaff: adminStaffApi.createStaff,
};

/* ============================================================
   2. ADMIN DASHBOARD & ANALYTICS APIs
   ============================================================ */
export const adminAnalyticsApi = {
  getSummary: async (range = "30d") => {
    try {
      const res = await apiClient.get("/admin/analytics/dashboard/summary", { params: { range } });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getCustomers: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const res = await apiClient.get("/admin/analytics/users", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getAbandonedCarts: async () => {
    try {
      const res = await apiClient.get("/admin/analytics/carts/abandoned");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  sendAbandonedCartReminders: async (cartIds: string[]) => {
    try {
      const res = await apiClient.post("/admin/analytics/users/bulk-cart-reminder-push", { cartIds });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getPopularWishlists: async () => {
    try {
      const res = await apiClient.get("/admin/analytics/wishlists/popular-products");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getHighValueCarts: async () => {
    try {
      const res = await apiClient.get("/admin/analytics/carts/high-value");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   3. ADMIN PRODUCTS & MODALS (CRUD, Edit, Bulk Upload)
   ============================================================ */
export const adminProductsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    stockStatus?: string;
  }) => {
    try {
      const res = await apiClient.get("/admin/products/all", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  create: async (payload: FormData | Record<string, any>) => {
    try {
      const isFormData = payload instanceof FormData;
      const res = await apiClient.post("/admin/products", payload, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  update: async (slug: string, updates: FormData | Record<string, any>) => {
    try {
      const isFormData = updates instanceof FormData;
      const res = await apiClient.put(`/admin/products/${encodeURIComponent(slug)}`, updates, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  archive: async (slug: string) => {
    try {
      const res = await apiClient.delete(`/admin/products/${encodeURIComponent(slug)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  restore: async (slug: string) => {
    try {
      const res = await apiClient.patch(`/admin/products/restore/${encodeURIComponent(slug)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getArchived: async (params?: { page?: number; limit?: number; search?: string }) => {
    try {
      const res = await apiClient.get("/admin/products/archived", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  bulkUpdateStatus: async (
    payloadOrIds: string[] | { slugs?: string[]; ids?: string[]; status?: string; channelStatus?: { ecomm?: string; wholesale?: string } },
    maybeStatus?: string
  ) => {
    try {
      let body: any = {};
      if (Array.isArray(payloadOrIds)) {
        const normStatus = String(maybeStatus || 'draft').toLowerCase();
        body = {
          slugs: payloadOrIds,
          status: normStatus === 'active' ? 'active' : 'draft',
          channelStatus: { ecomm: normStatus === 'active' ? 'active' : 'draft' },
        };
      } else {
        const normStatus = payloadOrIds.status ? String(payloadOrIds.status).toLowerCase() : undefined;
        body = {
          slugs: payloadOrIds.slugs || payloadOrIds.ids || [],
          ...(normStatus ? { status: normStatus === 'active' ? 'active' : 'draft' } : {}),
          channelStatus: payloadOrIds.channelStatus || (normStatus ? { ecomm: normStatus === 'active' ? 'active' : 'draft' } : undefined),
        };
      }
      const res = await apiClient.patch("/admin/products/bulk-status", body);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  uploadBulkCsv: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/admin/products/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   4. INVENTORY TAB (Stock Adjustment Modal)
   ============================================================ */
export const adminInventoryApi = {
  getLowStock: async () => {
    try {
      const res = await apiClient.get("/admin/products/low-stock");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  adjustStock: async (payload: {
    productId: string;
    adjustmentQty: number;
    reason: string;
    notes?: string;
  }) => {
    try {
      const res = await apiClient.post("/admin/products/inventory/adjust", payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   5. CATEGORIES & SUBCATEGORIES TAB
   ============================================================ */
export const adminCategoriesApi = {
  getAll: async () => {
    try {
      const res = await apiClient.get("/categories/admin/categories");
      return res.data?.categories || res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  create: async (payload: FormData | { name: string; slug?: string; description?: string; status?: string; order?: number; subcategories?: string[]; image?: string; [key: string]: any }) => {
    try {
      const res = await apiClient.post("/categories/admin/categories", payload, {
        headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data?.category || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  update: async (id: string, updates: FormData | Record<string, any>) => {
    try {
      const res = await apiClient.put(`/categories/admin/categories/${encodeURIComponent(id)}`, updates, {
        headers: updates instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.data?.category || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  delete: async (id: string) => {
    try {
      const res = await apiClient.delete(`/categories/admin/categories/${encodeURIComponent(id)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  reorder: async (categories: Array<{ id: string; order: number }>) => {
    try {
      const res = await apiClient.post("/categories/admin/categories/reorder", { categories });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   5b. ADMIN COUPONS API
   ============================================================ */
export const adminCouponsApi = {
  getAll: async () => {
    try {
      const res = await apiClient.get("/admin/coupons");
      return res.data?.coupons || res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  create: async (payload: any) => {
    try {
      const res = await apiClient.post("/admin/coupons", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  delete: async (couponId: string) => {
    try {
      const res = await apiClient.delete(`/admin/coupons/${encodeURIComponent(couponId)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  update: async (couponId: string, payload: any) => {
    try {
      const res = await apiClient.put(`/admin/coupons/${encodeURIComponent(couponId)}`, payload);
      return res.data?.coupon || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  toggleStatus: async (couponId: string, isActive?: boolean) => {
    try {
      if (typeof isActive === 'boolean') {
        const res = await apiClient.put(`/admin/coupons/${encodeURIComponent(couponId)}`, { isActive });
        return res.data?.coupon || res.data?.data || res.data;
      }
      const res = await apiClient.patch(`/admin/coupons/${encodeURIComponent(couponId)}/toggle`);
      return res.data?.coupon || res.data?.data || res.data;
    } catch {
      const res = await apiClient.put(`/admin/coupons/${encodeURIComponent(couponId)}`, { isActive });
      return res.data?.coupon || res.data?.data || res.data;
    }
  },
};

/* ============================================================
   6. PRODUCT LABELS / BADGES TAB
   ============================================================ */
export interface ProductLabelItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  pagePath?: string;
  description?: string;
  style?: string;
  showInNav?: boolean;
  showOnHomepage?: boolean;
  homepageLimit?: number;
  homepageSortOrder?: number;
  storefronts?: string[];
  productCount?: number;
  isActive?: boolean;
  isDefault?: boolean;
  icon?: string;
  badgeText?: string;
  badgeStyle?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const adminLabelsApi = {
  getAll: async (params?: { activeOnly?: boolean; search?: string }) => {
    try {
      const res = await apiClient.get("/admin/product-labels", { params });
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getById: async (idOrSlug: string) => {
    try {
      const res = await apiClient.get(`/admin/product-labels/${encodeURIComponent(idOrSlug)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  create: async (label: Partial<ProductLabelItem>) => {
    try {
      const res = await apiClient.post("/admin/product-labels", label);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  update: async (idOrSlug: string, label: Partial<ProductLabelItem>) => {
    try {
      const res = await apiClient.put(`/admin/product-labels/${encodeURIComponent(idOrSlug)}`, label);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  delete: async (idOrSlug: string) => {
    try {
      const res = await apiClient.delete(`/admin/product-labels/${encodeURIComponent(idOrSlug)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateFlags: async (payload: { slugs: string[]; flagType: string; value: boolean }) => {
    try {
      const res = await apiClient.put("/admin/products/updateFlags", payload);
      return res.data?.data || res.data;
    } catch {
      // Fallback
      const res = await apiClient.post("/admin/products/assign-labels", payload);
      return res.data?.data || res.data;
    }
  },
  assignToProducts: async (payload: { slugs: string[]; flagType: string; value: boolean }) => {
    return adminLabelsApi.updateFlags(payload);
  },
};

/* ============================================================
   7. ADMIN ORDERS, FULFILLMENT & RTO APIs
   ============================================================ */
export const adminOrdersApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    try {
      const res = await apiClient.get("/admin/orders", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getSummary: async () => {
    try {
      const res = await apiClient.get("/admin/orders/summary");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateFulfillmentStatus: async (orderId: string, status: string, trackingNumber?: string) => {
    try {
      const res = await apiClient.patch(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
        status,
        trackingNumber,
      });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  // RTO / Reverse Pickup
  getRtoOrders: async () => {
    try {
      const res = await apiClient.get("/admin/rto/orders");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  processRefund: async (orderId: string, amount: number) => {
    try {
      const res = await apiClient.post("/admin/rto/refund", { orderId, amount });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getById: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.get("/admin/orders", {
        params: { search: cleanId }
      });
      const data = res.data?.data || res.data;
      const orders = data?.orders || (Array.isArray(data) ? data : []);
      if (Array.isArray(orders) && orders.length > 0) {
        return orders.find((o: any) => o.orderId === cleanId || o.orderIdDisplay?.includes(cleanId)) || orders[0];
      }
      return null;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getBySearch: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.get("/admin/orders", {
        params: { search: cleanId }
      });
      const data = res.data?.data || res.data;
      const orders = data?.orders || (Array.isArray(data) ? data : []);
      if (Array.isArray(orders) && orders.length > 0) {
        return orders.find((o: any) => o.orderId === cleanId || o.orderIdDisplay?.includes(cleanId)) || orders[0];
      }
      return null;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateStatus: async (orderId: string, status: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.put(`/orders/admin/items/${encodeURIComponent(cleanId)}/status`, { status });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getOrderDetail: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.get(`/orders/items/${encodeURIComponent(cleanId)}`, {
        useAdminAuth: true,
      } as any);
      const data = res.data?.data || res.data;
      if (data?.order) return data.order;
      if (data?.orderId) return data;
      return null;
    } catch {
      return adminOrdersApi.getBySearch(orderId);
    }
  },
  editPendingAddress: async (orderId: string, addressPatch: any, alsoUpdateSavedAddress = false) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/items/${encodeURIComponent(cleanId)}/edit-pending-address`, {
        addressPatch,
        alsoUpdateSavedAddress,
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  previewPendingAddressEdit: async (orderId: string, addressPatch: any, alsoUpdateSavedAddress = false) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/items/${encodeURIComponent(cleanId)}/edit-pending-address/preview`, {
        addressPatch,
        alsoUpdateSavedAddress,
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  refreshAddressIntelligence: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.get(`/orders/admin/items/${encodeURIComponent(cleanId)}/address-intelligence?refresh=1`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  previewPendingOrderEdit: async (orderId: string, itemUpdates: Array<{ productId: string; variantId: string; quantity: number }>) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/items/${encodeURIComponent(cleanId)}/edit-pending/preview`, {
        itemUpdates,
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  applyPendingOrderEdit: async (orderId: string, itemUpdates: Array<{ productId: string; variantId: string; quantity: number }>) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/items/${encodeURIComponent(cleanId)}/edit-pending`, {
        itemUpdates,
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   11. ADMIN PRODUCT REVIEWS & CUSTOM REVIEWS API
   ============================================================ */
export interface AdminReviewItem {
  _id: string;
  source: 'customer' | 'admin' | 'generated';
  storefront: string;
  rating: number;
  title?: string;
  comment: string;
  displayName?: string;
  isActive: boolean;
  verifiedPurchase?: boolean;
  orderId?: string | null;
  variantCode?: string;
  images?: Array<string | { url?: string; publicId?: string }>;
  adminReply?: { comment: string; repliedAt: string } | null;
  createdAt: string;
  updatedAt: string;
  product?: { _id?: string; id?: string; title?: string; name?: string; slug?: string; thumb?: string | null };
  customer?: { name?: string; phone?: string; email?: string } | null;
}

export interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
  reviewCount?: number;
  distribution?: Record<string, number>;
}

export interface PublicReview {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  displayName?: string;
  verifiedPurchase: boolean;
  source: 'customer' | 'admin' | 'generated';
  adminReply?: { comment: string; repliedAt: string } | null;
  images?: string[];
  createdAt: string;
}

export const adminReviewsApi = {
  list: async (params?: {
    page?: number; limit?: number; productId?: string;
    source?: 'all' | 'customer' | 'admin' | 'generated';
    isActive?: 'true' | 'false' | boolean; search?: string; rating?: number | string;
  }) => {
    try {
      const q: any = { ...params };
      if (typeof q.isActive === 'boolean') q.isActive = q.isActive ? 'true' : 'false';
      const res = await apiClient.get("/admin/product-reviews", { params: q });
      return res.data?.data || res.data;
    } catch (err) { throw new Error(normalizeApiError(err)); }
  },
  patchStatus: async (id: string, isActive: boolean) => {
    try {
      const res = await apiClient.patch(`/admin/product-reviews/${encodeURIComponent(id)}/status`, { isActive });
      return res.data?.data || res.data;
    } catch (err) { throw new Error(normalizeApiError(err)); }
  },
  /** POST /api/admin/product-reviews/:id/reply — gracefully handles 404 if not supported by backend yet */
  addReply: async (id: string, comment: string) => {
    try {
      const res = await apiClient.post(`/admin/product-reviews/${encodeURIComponent(id)}/reply`, { comment });
      return res.data?.data || res.data;
    } catch (err: any) {
      if (err?.response?.status === 404) throw new Error('Admin reply endpoint not yet available on backend');
      throw new Error(normalizeApiError(err));
    }
  },
  createGenerated: async (payload: {
    productId: string; variantCode?: string;
    displayName?: string; reviewerName?: string;
    rating: number; title?: string; comment: string;
    verifiedPurchase?: boolean; isActive?: boolean;
    date?: string;
  }) => {
    try {
      const body = { ...payload, displayName: payload.displayName || payload.reviewerName || '' };
      const res = await apiClient.post("/admin/product-reviews/generated", body);
      return res.data?.data || res.data;
    } catch (err) { throw new Error(normalizeApiError(err)); }
  },
  updateGenerated: async (id: string, updates: {
    rating?: number; title?: string; comment?: string;
    displayName?: string; reviewerName?: string;
    isActive?: boolean; verifiedPurchase?: boolean; date?: string;
  }) => {
    try {
      const body = { ...updates, displayName: updates.displayName || updates.reviewerName };
      const res = await apiClient.put(`/admin/product-reviews/generated/${encodeURIComponent(id)}`, body);
      return res.data?.data || res.data;
    } catch (err) { throw new Error(normalizeApiError(err)); }
  },
  deleteGenerated: async (id: string) => {
    try {
      const res = await apiClient.delete(`/admin/product-reviews/generated/${encodeURIComponent(id)}`);
      return res.data?.data || res.data;
    } catch (err) { throw new Error(normalizeApiError(err)); }
  },
};

/* ============================================================
   12. ADMIN OUT OF STOCK INQUIRIES API
   ============================================================ */
export interface AdminOosInquiry {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug?: string | null;
  variantSku?: string | null;
  productImage?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'pending' | 'notified' | 'closed';
  storefront: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  notifiedAt?: string | null;
  closedAt?: string | null;
  adminNote?: string | null;
}

export const adminOosInquiriesApi = {
  list: async (params?: { page?: number; limit?: number; status?: string; search?: string; days?: number }) => {
    try {
      const res = await apiClient.get("/admin/oos-inquiries", { params });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateStatus: async (id: string, payload: { status: 'pending' | 'notified' | 'closed'; adminNote?: string }) => {
    try {
      const res = await apiClient.patch(`/admin/oos-inquiries/${encodeURIComponent(id)}/status`, payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   13. ADMIN RETURNS & REFUNDS API
   ============================================================ */
export interface AdminReturnRequestItem {
  orderId: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;
  returnInfo: {
    status?: string | null;
    reasonType?: string | null;
    refundContext?: string | null;
    requestedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    reverseProviderStatus?: string | null;
    decisionReason?: string | null;
    proofs?: string[];
  };
}

export const adminReturnsApi = {
  listRequests: async (params?: { status?: string; page?: number; limit?: number }) => {
    try {
      const res = await apiClient.get("/orders/admin/returns/requests", { params });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getRequest: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.get(`/orders/admin/returns/requests/${encodeURIComponent(cleanId)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  decide: async (orderId: string, payload: { decision: 'approve' | 'reject'; decisionReason?: string }) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/returns/requests/${encodeURIComponent(cleanId)}/decision`, payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  initiateRefund: async (orderId: string, payload?: { amountInr?: number }) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/returns/requests/${encodeURIComponent(cleanId)}/refund`, payload || {});
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getChat: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.get(`/orders/admin/returns/requests/${encodeURIComponent(cleanId)}/chat`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  sendChat: async (orderId: string, text: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/returns/requests/${encodeURIComponent(cleanId)}/chat`, { text });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  retryReversePickup: async (orderId: string) => {
    try {
      const cleanId = orderId.replace(/^#/, '');
      const res = await apiClient.post(`/orders/admin/returns/requests/${encodeURIComponent(cleanId)}/reverse-pickup/retry`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   14. ADMIN RTO API (Expanded)
   ============================================================ */
export interface AdminRtoOrder {
  orderId: string;
  orderIdDisplay?: string;
  customerName?: string;
  contactPhone?: string;
  subtotalInr?: number;
  amountInr?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  providerStatus?: string | null;
  rtoStatus: string;
  rtoStage?: string;
  rtoReason?: string;
  rtoReasonCategory?: string;
  rtoRefundAmount?: number | null;
  refundCalculation?: {
    eligible: boolean;
    maxRefundableInr: number;
    deductions?: number;
    netRefund?: number;
  };
  warehouseDelivered?: boolean;
  adminActionRequired?: boolean;
  shipmentInfo?: any;
  createdAt: string;
  updatedAt?: string;
}

export const adminRtoApi = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    section?: string;
    sortBy?: string;
    sortOrder?: string;
    preset?: string;
    from?: string;
    to?: string;
  }) => {
    try {
      const res = await apiClient.get("/admin/rto/orders", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getAnalytics: async (params?: { from?: string; to?: string; preset?: string }) => {
    try {
      const res = await apiClient.get("/admin/rto/analytics", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  exportReport: async (params?: { format?: 'csv' | 'json'; status?: string; section?: string; preset?: string }) => {
    try {
      const res = await apiClient.get("/admin/rto/report", {
        params,
        responseType: params?.format === 'json' ? 'json' : 'blob',
      });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  autoSyncStatuses: async (params?: { preset?: string; staleMinutes?: number }) => {
    try {
      const res = await apiClient.post("/admin/rto/auto-sync-statuses", null, { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  processRefund: async (payload: { orderId: string; rtoShippingOverride?: number }) => {
    try {
      const res = await apiClient.post("/admin/rto/refund", payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  rejectRefund: async (payload: { orderId: string; note?: string; action?: 'reject' | 'close' }) => {
    try {
      const res = await apiClient.post("/admin/rto/reject", payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  bulkAction: async (payload: { action: 'refund' | 'reject' | 'close'; orderIds: string[]; note?: string }) => {
    try {
      const res = await apiClient.post("/admin/rto/bulk-action", payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   14. STORE SETTINGS & CONTROLS APIs
   ============================================================ */

export interface AdminStoreControlsData {
  globalStoreAccess: boolean;
  deliveryServices: boolean;
  selfPickup: boolean;
  businessFramework: string;
}

// Store Operational Controls API
export const adminStoreControlsApi = {
  getControls: async (): Promise<AdminStoreControlsData> => {
    try {
      const res = await apiClient.get("/admin/store-controls");
      if (res.data?.data) return res.data.data;
      if (res.data) return res.data;
    } catch {}

    // Check shipping settings for deliveryServices status
    let deliveryServices = true;
    try {
      const shipping = await adminShippingSettingsApi.getSettings();
      if (shipping && typeof shipping.enabled === 'boolean') {
        deliveryServices = shipping.enabled;
      }
    } catch {}

    const saved = typeof window !== 'undefined' ? localStorage.getItem('abb_store_controls') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          globalStoreAccess: parsed.globalStoreAccess ?? true,
          deliveryServices: typeof parsed.deliveryServices === 'boolean' ? parsed.deliveryServices : deliveryServices,
          selfPickup: parsed.selfPickup ?? false,
          businessFramework: parsed.businessFramework || 'Business to Customer (B2C)',
        };
      } catch {}
    }

    return {
      globalStoreAccess: true,
      deliveryServices,
      selfPickup: false,
      businessFramework: 'Business to Customer (B2C)',
    };
  },

  updateControls: async (payload: Partial<AdminStoreControlsData>): Promise<AdminStoreControlsData> => {
    // If deliveryServices is being updated, sync with shipping provider settings API
    if (typeof payload.deliveryServices === 'boolean') {
      try {
        await adminShippingSettingsApi.updateSettings({
          enabled: payload.deliveryServices,
        });
      } catch (err) {
        console.warn('Syncing deliveryServices to shipping provider settings failed:', err);
      }
    }

    try {
      const res = await apiClient.put("/admin/store-controls", payload);
      const data = res.data?.data || res.data;
      if (typeof window !== 'undefined' && data) {
        localStorage.setItem('abb_store_controls', JSON.stringify(data));
      }
      return data;
    } catch {
      // Local fallback sync
      const saved = typeof window !== 'undefined' ? localStorage.getItem('abb_store_controls') : null;
      const current = saved ? JSON.parse(saved) : {
        globalStoreAccess: true,
        deliveryServices: true,
        selfPickup: false,
        businessFramework: 'Business to Customer (B2C)',
      };
      const merged = { ...current, ...payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('abb_store_controls', JSON.stringify(merged));
      }
      return merged;
    }
  },
};

// 1. Controls API (COD & Partial Payment Policies)
export const adminCheckoutSettingsApi = {
  getPolicy: async () => {
    try {
      const res = await apiClient.get("/checkout/admin/settings");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updatePolicy: async (payload: {
    codEnabled?: boolean;
    partialPaymentEnabled?: boolean;
    partialPaymentPercent?: number | null;
  }) => {
    try {
      const res = await apiClient.put("/checkout/admin/settings", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

// 2. Delivery & Shipping Provider Settings API
export const adminShippingSettingsApi = {
  getSettings: async () => {
    try {
      const res = await apiClient.get("/shipping-provider/admin/settings");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateSettings: async (payload: {
    activeProvider?: string;
    warehouseId?: string;
    pickupPincode?: string;
    enabled?: boolean;
    shipmozo?: any;
  }) => {
    try {
      const body: any = {};
      if (payload.activeProvider !== undefined) {
        body.activeProvider = payload.activeProvider;
      }
      body.shipmozo = payload.shipmozo || {
        warehouseId: payload.warehouseId || undefined,
        pickupPincode: payload.pickupPincode ? payload.pickupPincode.replace(/\D/g, '').slice(0, 6) : undefined,
        enabled: payload.enabled ?? true,
      };
      const res = await apiClient.put("/shipping-provider/admin/settings", body);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getWarehouses: async () => {
    try {
      const res = await apiClient.get("/shipping-provider/admin/shipmozo/warehouses");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  testShipmozo: async () => {
    try {
      const res = await apiClient.post("/shipping-provider/admin/shipmozo/test");
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

// 3. Shipmozo Label Settings API
export const adminShipmozoLabelSettingsApi = {
  getSettings: async () => {
    try {
      const res = await apiClient.get("/shipping-provider/admin/shipmozo-label-settings");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateSettings: async (payload: any) => {
    try {
      const res = await apiClient.put("/shipping-provider/admin/shipmozo-label-settings", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  preview: async (payload: any) => {
    try {
      const res = await apiClient.post("/shipping-provider/admin/shipmozo-label-settings/preview", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  uploadLogo: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await apiClient.post("/shipping-provider/admin/shipmozo-label-settings/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  removeLogo: async () => {
    try {
      const res = await apiClient.delete("/shipping-provider/admin/shipmozo-label-settings/logo");
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

