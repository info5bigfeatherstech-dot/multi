import axios, { InternalAxiosRequestConfig } from "axios";

export const BASE_API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "/api";

export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let adminLoginPromise: Promise<string | null> | null = null;

export async function ensureAdminToken(): Promise<string | null> {
  const existing = localStorage.getItem("admin_access_token");
  if (existing) return existing;

  if (adminLoginPromise) return adminLoginPromise;

  adminLoginPromise = (async () => {
    try {
      const res = await axios.post(
        `${BASE_API_URL}/auth/login`,
        {
          identifier: "admin@store.com",
          password: "admin123",
          portal: "admin-ecomm",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-storefront": "ecomm",
          },
          timeout: 8000,
        }
      );

      const token =
        res.data?.accessToken ||
        res.data?.token ||
        res.data?.data?.accessToken;
      if (token) {
        localStorage.setItem("admin_access_token", token);
        window.dispatchEvent(new Event("abb_admin_auth_success"));
        return token;
      }
    } catch (e) {
      console.warn("Silent admin auto-login failed:", e);
    } finally {
      adminLoginPromise = null;
    }
    return null;
  })();

  return adminLoginPromise;
}

// Automatic Token & Storefront Interceptor: Injects Customer Token or Admin Token and x-storefront header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || "";
    const isAdminRoute = url.includes("/admin") || url.includes("/categories/admin");

    let token: string | null = null;
    if (isAdminRoute) {
      // Admin endpoints MUST strictly use admin_access_token (never customer tokens)
      token = localStorage.getItem("admin_access_token");
      if (!token && !url.includes("/auth/login")) {
        token = await ensureAdminToken();
      }
    } else {
      token = localStorage.getItem("user_access_token");
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.headers && !config.headers["x-storefront"]) {
      config.headers["x-storefront"] = "ecomm";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic 401 & 403 Handler: Recovers admin tokens and handles customer session expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retryAdminAuth?: boolean }) | undefined;
    const url = originalConfig?.url || "";
    const isAdminRoute = url.includes("/admin") || url.includes("/categories/admin");
    const status = error.response?.status;

    // Handle Admin Auth issues (401 UNAUTHORIZED or 403 FORBIDDEN)
    if (isAdminRoute && (status === 401 || status === 403)) {
      localStorage.removeItem("admin_access_token");

      if (originalConfig && !originalConfig._retryAdminAuth) {
        originalConfig._retryAdminAuth = true;
        try {
          const freshToken = await ensureAdminToken();
          if (freshToken) {
            if (originalConfig.headers) {
              originalConfig.headers.Authorization = `Bearer ${freshToken}`;
            }
            return apiClient(originalConfig);
          }
        } catch {
          // Re-auth failed
        }
      }

      window.dispatchEvent(new Event("abb_admin_forbidden"));
      return Promise.reject(error);
    }

    // Handle Customer 401
    if (status === 401 && !isAdminRoute) {
      const code = error.response?.data?.code;
      const msg = error.response?.data?.message;
      const isTokenIssue = 
        code === "INVALID_TOKEN" ||
        code === "TOKEN_EXPIRED" ||
        code === "UNAUTHORIZED" ||
        code === "MISSING_AUTH_HEADER" ||
        (typeof msg === "string" && msg.toLowerCase().includes("token"));

      if (isTokenIssue) {
        localStorage.removeItem("user_access_token");
        window.dispatchEvent(new Event("abb_auth_change"));
      }
    }
    return Promise.reject(error);
  }
);

// Unified Error Formatter
export function normalizeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;
    return typeof serverMessage === "string" ? serverMessage : "Request failed";
  }
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

// Razorpay SDK Script Loader Utility
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
