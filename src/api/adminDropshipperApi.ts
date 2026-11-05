import { apiClient, normalizeApiError } from "./client";

export interface AdminDropshipperRequest {
  _id: string;
  id?: string;
  kind: "registration" | "renewal";
  adminStatus: "pending" | "approved" | "rejected";
  paymentStatus: "paid" | "pending" | "failed";
  fullName: string;
  email: string;
  phone: string;
  businessName?: string;
  whatsappNumber?: string;
  permanentAddress: string;
  haveShop: boolean;
  businessAddress?: string;
  deliveryAddress?: string;
  sellingPlaceFrom?: string;
  sellingZoneCity?: string;
  productCategory?: string;
  monthlyEstimatedPurchase?: number;
  idProofUrl?: string;
  businessAddressProofUrl?: string;
  subscriptionAmountInr: number;
  subscriptionYears: number;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminDropshipperAccount {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  businessName?: string | null;
  whatsappNumber?: string | null;
  status: "active" | "expired" | "pending_otp" | "pending_admin" | "rejected" | "suspended" | string;
  channel?: string;
  subscription?: {
    amountPaidInr?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    daysRemaining?: number | null;
    planYears?: number | null;
    renewedAt?: string | null;
    isExpired?: boolean;
    active?: boolean;
  };
  application?: {
    permanentAddress?: string;
    haveShop?: boolean;
    businessAddress?: string;
    deliveryAddress?: string;
    sellingPlaceFrom?: string;
    sellingZoneCity?: string;
    productCategory?: string;
    monthlyEstimatedPurchase?: number | null;
    idProofUrl?: string;
    businessAddressProofUrl?: string;
  };
  hasPassword?: boolean;
  registrationRequestId?: string | null;
  totalOrders?: number;
  lifetimeVolume?: number;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionNote?: string | null;
  lastLoginAt?: string | null;
  passwordSetAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminDropshipperSettings {
  channel: string;
  subscriptionAmountInr: number;
  subscriptionYears: number;
  registrationOpen: boolean;
  updatedAt?: string;
}

export const adminDropshipperApi = {
  // 1. Settings
  getSettings: async (): Promise<AdminDropshipperSettings> => {
    try {
      const res = await apiClient.get("/admin/dropshipper/settings", {
        useAdminAuth: true,
      } as any);
      return res.data?.settings || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  updateSettings: async (payload: Partial<AdminDropshipperSettings>) => {
    try {
      const res = await apiClient.patch("/admin/dropshipper/settings", payload, {
        useAdminAuth: true,
      } as any);
      return res.data?.settings || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 2. KYC Requests
  getRequests: async (params?: {
    page?: number;
    limit?: number;
    adminStatus?: string;
    kind?: string;
    search?: string;
  }) => {
    try {
      const res = await apiClient.get("/admin/dropshipper/requests", {
        params,
        useAdminAuth: true,
      } as any);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  approveRequest: async (id: string, note?: string) => {
    try {
      const res = await apiClient.post(
        `/admin/dropshipper/requests/${encodeURIComponent(id)}/approve`,
        { note: note || "KYC verified" },
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  rejectRequest: async (id: string, note: string) => {
    try {
      const res = await apiClient.post(
        `/admin/dropshipper/requests/${encodeURIComponent(id)}/reject`,
        { note },
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 3. Accounts
  getAccounts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
  }) => {
    try {
      const res = await apiClient.get("/admin/dropshipper/accounts", {
        params,
        useAdminAuth: true,
      } as any);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  getAccountDetails: async (id: string): Promise<AdminDropshipperAccount> => {
    try {
      const res = await apiClient.get(`/admin/dropshipper/accounts/${encodeURIComponent(id)}`, {
        useAdminAuth: true,
      } as any);
      return res.data?.dropshipper || res.data?.account || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 4. Dropship Orders Tab
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    dropshipperId?: string;
    q?: string;
  }) => {
    try {
      const res = await apiClient.get("/admin/dropshipper/orders", {
        params,
        useAdminAuth: true,
      } as any);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  getOrderDetails: async (orderId: string) => {
    try {
      const res = await apiClient.get(`/admin/dropshipper/orders/${encodeURIComponent(orderId)}`, {
        useAdminAuth: true,
      } as any);
      return res.data?.order || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 5. Product Dropship Pricing & Visibility
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    listedOnly?: boolean;
    q?: string;
  }) => {
    try {
      const res = await apiClient.get("/admin/dropshipper/products", {
        params,
        useAdminAuth: true,
      } as any);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  getProductBySlug: async (slug: string) => {
    try {
      const res = await apiClient.get(`/admin/dropshipper/products/${encodeURIComponent(slug)}`, {
        useAdminAuth: true,
      } as any);
      return res.data?.product || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  setVariantPrice: async (
    slug: string,
    productCode: string,
    payload: { dropshipBase: number; enable?: boolean }
  ) => {
    try {
      const res = await apiClient.patch(
        `/admin/dropshipper/products/${encodeURIComponent(slug)}/variants/${encodeURIComponent(productCode)}/price`,
        payload,
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  enableVariant: async (slug: string, productCode: string, payload?: { dropshipBase?: number }) => {
    try {
      const res = await apiClient.patch(
        `/admin/dropshipper/products/${encodeURIComponent(slug)}/variants/${encodeURIComponent(productCode)}/enable`,
        payload || {},
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  disableVariant: async (slug: string, productCode: string, clearPrice: boolean = false) => {
    try {
      const res = await apiClient.patch(
        `/admin/dropshipper/products/${encodeURIComponent(slug)}/variants/${encodeURIComponent(productCode)}/disable`,
        { clearPrice },
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  bulkEnable: async (items: Array<{ slug: string; productCode: string }>) => {
    try {
      const res = await apiClient.post(
        "/admin/dropshipper/products/bulk-enable",
        { items },
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  bulkSetPrice: async (
    items: Array<{ slug: string; productCode: string; dropshipBase: number; enable?: boolean }>
  ) => {
    try {
      const res = await apiClient.post(
        "/admin/dropshipper/products/bulk-set-price",
        { items },
        { useAdminAuth: true } as any
      );
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

