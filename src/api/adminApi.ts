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
  bulkUpdateStatus: async (ids: string[], status: "Active" | "Draft") => {
    try {
      const res = await apiClient.patch("/admin/products/bulk-status", { ids, status });
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
};

/* ============================================================
   11. ADMIN PRODUCT REVIEWS & CUSTOM REVIEWS API
   ============================================================ */
export interface AdminReviewItem {
  _id: string;
  source: 'customer' | 'admin';
  storefront: string;
  rating: number;
  comment: string;
  displayName?: string;
  isActive: boolean;
  verifiedPurchase?: boolean;
  orderId?: string | null;
  images?: Array<string | { url?: string; publicId?: string }>;
  createdAt: string;
  updatedAt: string;
  product?: {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    slug?: string;
    thumb?: string | null;
  };
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  } | null;
}

export const adminReviewsApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    productId?: string;
    source?: 'customer' | 'admin';
    isActive?: 'true' | 'false' | boolean;
  }) => {
    try {
      const q: any = { ...params };
      if (typeof q.isActive === 'boolean') {
        q.isActive = q.isActive ? 'true' : 'false';
      }
      const res = await apiClient.get("/admin/product-reviews", { params: q });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  patchStatus: async (id: string, isActive: boolean) => {
    try {
      const res = await apiClient.patch(`/admin/product-reviews/${encodeURIComponent(id)}/status`, { isActive });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  createGenerated: async (payload: {
    productId: string;
    rating: number;
    comment: string;
    displayName: string;
    isActive?: boolean;
  }) => {
    try {
      const res = await apiClient.post("/admin/product-reviews/generated", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateGenerated: async (id: string, updates: {
    rating?: number;
    comment?: string;
    displayName?: string;
    isActive?: boolean;
  }) => {
    try {
      const res = await apiClient.put(`/admin/product-reviews/generated/${encodeURIComponent(id)}`, updates);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  deleteGenerated: async (id: string) => {
    try {
      const res = await apiClient.delete(`/admin/product-reviews/generated/${encodeURIComponent(id)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};
