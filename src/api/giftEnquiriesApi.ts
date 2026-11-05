import { apiClient, normalizeApiError } from "./client";

export interface GiftEnquiryResponse {
  success: boolean;
  alreadyRegistered?: boolean;
  message: string;
  data?: {
    id: string;
    enquiryType: "bulk" | "custom";
    status: string;
    createdAt: string;
    [key: string]: any;
  };
}

export interface AdminGiftEnquiryItem {
  _id: string;
  id?: string;
  enquiryType: "bulk" | "custom";
  status: "pending" | "contacted" | "quoted" | "closed" | "converted" | string;
  name: string;
  phone: string;
  email?: string;
  organizationName?: string;
  city?: string;
  message?: string;
  storefront?: string;
  adminNote?: string;
  convertedOrderId?: string;

  // Bulk specific
  businessType?: string;
  volumeOrder?: number;
  hasBusinessCard?: boolean;

  // Custom specific
  occasion?: string;
  giftCategory?: string;
  quantity?: number;
  targetDeliveryDate?: string;
  logoCount?: number;
  referencePhotoCount?: number;

  createdAt: string;
  updatedAt?: string;
}

export interface AdminGiftEnquiryDetail extends AdminGiftEnquiryItem {
  businessCardUrl?: string;
  logoUrls?: string[];
  referencePhotoUrls?: string[];
  files?: {
    businessCard?: string;
    logos?: string[];
    referencePhotos?: string[];
  };
}

export const giftEnquiriesApi = {
  /**
   * C1. Public Form Submission
   * POST /api/gift-enquiries
   * Content-Type: multipart/form-data
   * Header: x-storefront: ecomm
   */
  submitEnquiry: async (formData: FormData, storefront = "ecomm"): Promise<GiftEnquiryResponse> => {
    try {
      const res = await apiClient.post("/gift-enquiries", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-storefront": storefront,
        },
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      throw new Error(normalizeApiError(err));
    }
  },
};

export const adminGiftEnquiriesApi = {
  /**
   * C2. Admin List Enquiries
   * GET /api/admin/gift-enquiries?enquiryType=bulk|custom&page&limit&status&search
   * Headers: Authorization: Bearer {staff_token}, x-storefront: ecomm
   */
  list: async (params?: {
    enquiryType?: "bulk" | "custom";
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    storefront?: string;
  }) => {
    try {
      const { storefront = "ecomm", ...queryParams } = params || {};
      const res = await apiClient.get("/admin/gift-enquiries", {
        params: queryParams,
        headers: {
          "x-storefront": storefront,
        },
        useAdminAuth: true,
      } as any);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  /**
   * C2. Admin Get Enquiry Detail
   * GET /api/admin/gift-enquiries/:id
   */
  getById: async (id: string, storefront = "ecomm"): Promise<AdminGiftEnquiryDetail> => {
    try {
      const res = await apiClient.get(`/admin/gift-enquiries/${encodeURIComponent(id)}`, {
        headers: {
          "x-storefront": storefront,
        },
        useAdminAuth: true,
      } as any);
      return res.data?.enquiry || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  /**
   * C2. Admin Update Status
   * PATCH /api/admin/gift-enquiries/:id/status
   * Body: { status, adminNote?, convertedOrderId? }
   */
  updateStatus: async (
    id: string,
    payload: {
      status: "pending" | "contacted" | "quoted" | "closed" | "converted" | string;
      adminNote?: string;
      convertedOrderId?: string;
    },
    storefront = "ecomm"
  ) => {
    try {
      const res = await apiClient.patch(
        `/admin/gift-enquiries/${encodeURIComponent(id)}/status`,
        payload,
        {
          headers: {
            "x-storefront": storefront,
          },
          useAdminAuth: true,
        } as any
      );
      return res.data?.enquiry || res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};
