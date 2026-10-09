import { apiClient, normalizeApiError, loadRazorpayScript } from "./client";

/* ============================================================
   1. CUSTOMER AUTHENTICATION & PROFILE APIs
   ============================================================ */
export const storefrontAuthApi = {
  register: async (data: { name: string; email: string; phone: string; password?: string }) => {
    try {
      const res = await apiClient.post("/auth/register", data);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  login: async (credentials: { email?: string; phone?: string; password?: string }) => {
    try {
      const res = await apiClient.post("/auth/login", credentials);
      const data = res.data?.data || res.data;
      if (data?.token) {
        localStorage.setItem("user_access_token", data.token);
      }
      return data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  verifyOtpLogin: async (payload: { phone: string; otp: string }) => {
    try {
      const res = await apiClient.post("/auth/otp-verify-login", payload);
      const data = res.data?.data || res.data;
      if (data?.token) {
        localStorage.setItem("user_access_token", data.token);
      }
      return data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getProfile: async () => {
    try {
      const res = await apiClient.get("/auth/profile");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateProfile: async (updates: { name?: string; phone?: string; email?: string; avatarUrl?: string }) => {
    try {
      const res = await apiClient.put("/auth/profile", updates);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("user_access_token");
    }
  },
};

/* ============================================================
   2. CUSTOMER ADDRESS BOOK APIs
   ============================================================ */
export const storefrontAddressApi = {
  list: async () => {
    try {
      const res = await apiClient.get("/addresses");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  create: async (address: {
    fullName?: string;
    name?: string;
    phone: string;
    houseNumber?: string;
    area?: string;
    postalCode?: string;
    pincode?: string;
    addressLine1?: string;
    addressLine2?: string;
    street?: string;
    city: string;
    state: string;
    landmark?: string;
    isDefault?: boolean;
    type?: "Home" | "Work" | "Other" | string;
    [key: string]: any;
  }) => {
    try {
      const res = await apiClient.post("/addresses", address);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  update: async (id: string, address: Record<string, any>) => {
    try {
      const res = await apiClient.put(`/addresses/${encodeURIComponent(id)}`, address);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  delete: async (id: string) => {
    try {
      const res = await apiClient.delete(`/addresses/${encodeURIComponent(id)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  checkDeliveryPincode: async (pincode: string) => {
    try {
      const res = await apiClient.post("/delivery/check-delivery", { pincode });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   3. PRODUCTS, CATEGORIES & REVIEWS APIs
   ============================================================ */
export const storefrontProductsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    sort?: string;
    search?: string;
  }) => {
    try {
      const res = await apiClient.get("/products/all", { params });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getBySlug: async (slug: string) => {
    try {
      const res = await apiClient.get(`/products/${encodeURIComponent(slug)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getCategories: async () => {
    try {
      let res;
      try {
        res = await apiClient.get("/categories/categories");
      } catch {
        res = await apiClient.get("/categories");
      }
      const data = res.data?.categories || res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  submitReview: async (payload: {
    productId: string;
    rating: number;
    comment: string;
    images?: string[];
  }) => {
    try {
      const res = await apiClient.post("/product-reviews", payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  requestOosAlert: async (payload: { productId: string; email: string; phone?: string }) => {
    try {
      const res = await apiClient.post("/oos-inquiries", payload);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   4. CART & WISHLIST APIs
   ============================================================ */
export const storefrontCartApi = {
  getCart: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("user_access_token") : null;
    if (!token) {
      return { items: [] };
    }
    try {
      const res = await apiClient.get("/cart");
      return res.data?.data || res.data || { items: [] };
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("user_access_token");
        return { items: [] };
      }
      throw new Error(normalizeApiError(err));
    }
  },
  addItem: async (productId: string, quantity = 1, variantId?: string) => {
    try {
      const res = await apiClient.post("/cart", { productId, quantity, variantId });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  updateQuantity: async (itemId: string, quantity: number) => {
    try {
      const res = await apiClient.put("/cart/item", { itemId, quantity });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  removeItem: async (itemId: string) => {
    try {
      const res = await apiClient.delete("/cart/item", { data: { itemId } });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  clearCart: async () => {
    try {
      const res = await apiClient.post("/cart/clear");
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

export const storefrontWishlistApi = {
  getWishlist: async () => {
    try {
      const res = await apiClient.get("/wishlist");
      return res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  toggle: async (productId: string, slug?: string) => {
    try {
      const res = await apiClient.post("/wishlist/add", { productId, slug });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  remove: async (slug: string) => {
    try {
      const res = await apiClient.delete(`/wishlist/remove/${encodeURIComponent(slug)}`);
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};

/* ============================================================
   5. CHECKOUT & RAZORPAY PAYMENT GATEWAY APIs
   ============================================================ */
export const storefrontCheckoutApi = {
  // Step 1: Store Checkout Settings & Policies
  getSettings: async () => {
    try {
      const res = await apiClient.get("/checkout/settings");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Serviceability check for pincode & courier
  checkDelivery: async (pincode: string, cartId?: string) => {
    try {
      const res = await apiClient.post("/delivery/check-delivery", { pincode, cartId });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Available promotional discount coupons
  getAvailableCoupons: async () => {
    try {
      const res = await apiClient.get("/coupons/available");
      return res.data?.coupons || res.data?.data || res.data || [];
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Validate coupon (supports both object payload and legacy parameters)
  validateCoupon: async (
    payload: string | { couponCode: string; useServercart?: boolean; subtotal?: number },
    cartTotal?: number
  ) => {
    try {
      const body = typeof payload === "string"
        ? { couponCode: payload, code: payload, cartTotal: cartTotal || 0, subtotal: cartTotal || 0, useServercart: true }
        : { ...payload, code: payload.couponCode, cartTotal: payload.subtotal, useServercart: payload.useServercart ?? true };

      const res = await apiClient.post("/coupons/validate", body);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Step 3: Establish Authoritative Checkout Quote
  getQuote: async (payload: {
    addressId: string;
    paymentMethodHint?: "online" | "full_cod" | "advance" | string;
    paymentPlan?: "full" | "advance" | string;
    paymentAdvancePercent?: number;
    balanceCollection?: "online" | "cod" | string;
    couponCode?: string;
    loyaltyPointsToRedeem?: number;
  }) => {
    try {
      const res = await apiClient.post("/checkout/quote", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Step 4: Lock Payment Choice (Confirm Quote)
  confirmQuote: async (payload: {
    quoteId: string;
    paymentMethod: "online" | "full_cod" | "advance" | string;
    paymentPlan?: "full" | "advance" | string;
    paymentAdvancePercent?: number;
    balanceCollection?: "online" | "cod" | string;
  }) => {
    try {
      const res = await apiClient.post("/checkout/confirm", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Backward compatible initiateOrder alias
  initiateOrder: async (payload: {
    addressId: string;
    paymentMethod: "COD" | "RAZORPAY" | string;
    couponCode?: string;
    quoteId?: string;
  }) => {
    const isCod = payload.paymentMethod.toUpperCase() === "COD";
    if (payload.quoteId) {
      return storefrontCheckoutApi.confirmQuote({
        quoteId: payload.quoteId,
        paymentMethod: isCod ? "full_cod" : "online",
        paymentPlan: "full",
        balanceCollection: isCod ? "cod" : "online",
      });
    }
    // Fallback direct confirm
    try {
      const res = await apiClient.post("/checkout/confirm", {
        addressId: payload.addressId,
        paymentMethod: isCod ? "full_cod" : "online",
        couponCode: payload.couponCode,
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Step 5: Place Order (Two-Phase Commit final execution)
  createOrder: async (payload: {
    addressId: string;
    paymentMethod: "online" | "full_cod" | "advance" | string;
    onlinePaymentMode?: "full" | "advance" | string;
    balanceCollection?: "online" | "cod" | string;
    paymentAdvancePercent?: number;
    quoteId?: string;
    couponCode?: string;
    orderIntent?: any;
    [key: string]: any;
  }) => {
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const res = await apiClient.post("/orders/items", payload, {
        headers: {
          "Idempotency-Key": idempotencyKey,
          "x-storefront": "ecomm",
        },
      });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Razorpay Payment Verification
  verifyPayment: async (payload: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const res = await apiClient.post("/orders/items/verify-payment", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Retry Pending Payment if Razorpay modal was aborted
  retryPendingPayment: async (orderId: string) => {
    try {
      const res = await apiClient.post(`/orders/items/${encodeURIComponent(orderId)}/initiate-payment`, {});
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Pay remaining order balance for partial advance orders
  payOrderBalance: async (orderId: string) => {
    try {
      const res = await apiClient.post(`/orders/items/${encodeURIComponent(orderId)}/pay-balance`, {});
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Mark checkout attempt as abandoned
  abandonOnlineCheckout: async (orderId: string) => {
    try {
      const res = await apiClient.post(`/orders/items/${encodeURIComponent(orderId)}/abandon-online-checkout`, {});
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // Open Razorpay Checkout Window & Verify Payment on Success
  processRazorpayPayment: async ({
    orderId,
    razorpayOrder,
    razorpayOrderId,
    amount,
    currency = "INR",
    customerName,
    customerEmail,
    customerPhone,
    onSuccess,
    onFailure,
    onDismiss,
  }: {
    orderId: string;
    razorpayOrder?: { id: string; amount: number; currency?: string };
    razorpayOrderId?: string;
    amount?: number; // in rupees or paise
    currency?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    onSuccess: (verifyResult: any) => void;
    onFailure: (err: any) => void;
    onDismiss?: () => void;
  }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
    }

    const rzpOrderId = razorpayOrder?.id || razorpayOrderId;
    if (!rzpOrderId) {
      throw new Error("Missing Razorpay order ID from backend.");
    }

    // Determine amount in paise (backend returns paise in razorpayOrder.amount)
    const amountInPaise = razorpayOrder?.amount ?? (amount ? Math.round(amount * 100) : 100);
    const orderCurrency = razorpayOrder?.currency || currency || "INR";
    const razorpayKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "rzp_test_TJCuQuMjFKMgnW";

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: orderCurrency,
      name: "Apna Bharat Bazaar",
      description: `Payment for Order #${orderId}`,
      order_id: rzpOrderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notes: {
        orderId: orderId,
      },
      theme: { color: "#A44101" },
      handler: async function (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) {
        try {
          const verifyRes = await storefrontCheckoutApi.verifyPayment({
            orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess(verifyRes);
        } catch (verifyErr) {
          onFailure(verifyErr);
        }
      },
      modal: {
        ondismiss: function () {
          storefrontCheckoutApi.abandonOnlineCheckout(orderId).catch(() => { });
          if (onDismiss) {
            onDismiss();
          } else {
            onFailure(new Error("Payment was cancelled by user."));
          }
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (resp: any) {
      console.error("Razorpay Payment Failed:", resp?.error?.description);
      onFailure(new Error(resp?.error?.description || "Payment failed at gateway."));
    });
    rzp.open();
  },

  // Customer Orders List & Live Courier Tracking
  getMyOrders: async (page = 1) => {
    try {
      const res = await apiClient.get("/orders/items", { params: { page } });
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  getOrderDetails: async (orderId: string) => {
    try {
      const res = await apiClient.get(`/orders/items/${encodeURIComponent(orderId)}`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  trackOrder: async (orderId: string) => {
    try {
      const res = await apiClient.get(`/orders/items/${encodeURIComponent(orderId)}/track`);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
  downloadInvoice: async (orderId: string) => {
    try {
      const res = await apiClient.get(`/orders/items/${encodeURIComponent(orderId)}/invoice`, {
        responseType: "blob",
      });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};
  },
trackOrder: async (orderId: string) => {
  try {
    const res = await apiClient.get(`/orders/items/${encodeURIComponent(orderId)}/track`);
    return res.data?.data || res.data;
  } catch (err) {
    throw new Error(normalizeApiError(err));
  }
},
  downloadInvoice: async (orderId: string) => {
    try {
      const res = await apiClient.get(`/orders/items/${encodeURIComponent(orderId)}/invoice`, {
        responseType: "blob",
      });
      return res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};
