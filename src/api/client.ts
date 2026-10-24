import axios, { InternalAxiosRequestConfig } from "axios";

export const BASE_API_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "/api";

export const apiClient = axios.create({
  baseURL: BASE_API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// TOKEN MANAGEMENT HELPERS
// ============================================================
export const getAdminAccessToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("admin_access_token") : null;

export const getAdminRefreshToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("admin_refresh_token") : null;

export const setAdminTokens = (accessToken: string, refreshToken?: string | null): void => {
  if (typeof window === "undefined") return;
  if (accessToken) {
    localStorage.setItem("admin_access_token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("admin_refresh_token", refreshToken);
  }
};

export const clearAdminTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
};

export const getUserAccessToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("user_access_token") : null;

export const getUserRefreshToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem("user_refresh_token") : null;

export const setUserTokens = (accessToken: string, refreshToken?: string | null): void => {
  if (typeof window === "undefined") return;
  if (accessToken) {
    localStorage.setItem("user_access_token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("user_refresh_token", refreshToken);
  }
};

export const clearUserTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user_access_token");
  localStorage.removeItem("user_refresh_token");
};

// ============================================================
// SECURE TOKEN REFRESH PROMISES (CONCURRENCY-SAFE)
// ============================================================
let adminRefreshPromise: Promise<string | null> | null = null;
let userRefreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to refresh the Admin Access Token using the stored Admin Refresh Token.
 * NEVER uses hardcoded credentials. If refresh token is missing or invalid, clears tokens and prompts login.
 */
export async function refreshAdminAccessToken(): Promise<string | null> {
  const refreshToken = getAdminRefreshToken();
  if (!refreshToken) {
    clearAdminTokens();
    return null;
  }

  if (adminRefreshPromise) return adminRefreshPromise;

  adminRefreshPromise = (async () => {
    try {
      // Primary refresh route
      let res;
      try {
        res = await axios.post(
          `${BASE_API_URL}/auth/refresh-token`,
          { refreshToken, portal: "admin-ecomm" },
          {
            headers: {
              "Content-Type": "application/json",
              "x-storefront": "ecomm",
            },
            timeout: 10000,
          }
        );
      } catch (err: any) {
        // Fallback endpoint if route is /auth/refresh
        if (err.response?.status === 404) {
          res = await axios.post(
            `${BASE_API_URL}/auth/refresh`,
            { refreshToken, portal: "admin-ecomm" },
            {
              headers: {
                "Content-Type": "application/json",
                "x-storefront": "ecomm",
              },
              timeout: 10000,
            }
          );
        } else {
          throw err;
        }
      }

      const freshAccess =
        res.data?.accessToken ||
        res.data?.token ||
        res.data?.data?.accessToken ||
        res.data?.data?.token;

      const freshRefresh =
        res.data?.refreshToken ||
        res.data?.data?.refreshToken;

      if (freshAccess) {
        setAdminTokens(freshAccess, freshRefresh);
        window.dispatchEvent(new Event("abb_admin_auth_success"));
        return freshAccess;
      }
    } catch (e) {
      console.warn("Admin token refresh failed:", e);
      clearAdminTokens();
      window.dispatchEvent(new Event("abb_admin_forbidden"));
    } finally {
      adminRefreshPromise = null;
    }
    return null;
  })();

  return adminRefreshPromise;
}

/**
 * Proactively ensures admin token exists:
 * Returns current access token if available, or attempts a clean refresh via refresh token.
 * No hardcoded auto-login fallback.
 */
export async function ensureAdminToken(): Promise<string | null> {
  const existing = getAdminAccessToken();
  if (existing) return existing;
  return refreshAdminAccessToken();
}

/**
 * Attempts to refresh the Customer Access Token using the stored Customer Refresh Token
 * or the HTTP-only cookie session set by the backend.
 * Saves the returned fresh refresh token into localStorage (user_refresh_token).
 */
export async function refreshCustomerAccessToken(): Promise<string | null> {
  const refreshToken = getUserRefreshToken();

  if (userRefreshPromise) return userRefreshPromise;

  userRefreshPromise = (async () => {
    try {
      const payload: Record<string, any> = { portal: "ecomm" };
      if (refreshToken) {
        payload.refreshToken = refreshToken;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-storefront": "ecomm",
      };
      if (refreshToken) {
        headers["x-refresh-token"] = refreshToken;
      }

      let res;
      try {
        res = await axios.post(
          `${BASE_API_URL}/auth/refresh`,
          payload,
          {
            headers,
            withCredentials: true,
            timeout: 10000,
          }
        );
      } catch (err: any) {
        if (err.response?.status === 404) {
          res = await axios.post(
            `${BASE_API_URL}/auth/refresh-token`,
            payload,
            {
              headers,
              withCredentials: true,
              timeout: 10000,
            }
          );
        } else {
          throw err;
        }
      }

      const freshAccess =
        res.data?.accessToken ||
        res.data?.token ||
        res.data?.data?.accessToken;

      const freshRefresh =
        res.data?.refreshToken ||
        res.data?.refresh_token ||
        res.data?.data?.refreshToken ||
        res.data?.data?.refresh_token;

      if (freshAccess) {
        setUserTokens(freshAccess, freshRefresh || refreshToken);
        window.dispatchEvent(new Event("abb_auth_change"));
        window.dispatchEvent(new Event("abb_customer_auth_success"));
        return freshAccess;
      }
    } catch (e: any) {
      console.warn("Customer token refresh failed:", e?.response?.data || e?.message || e);
      // Only clear user tokens if session is explicitly rejected as unauthorized
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        clearUserTokens();
        window.dispatchEvent(new Event("abb_auth_change"));
      }
    } finally {
      userRefreshPromise = null;
    }
    return null;
  })();

  return userRefreshPromise;
}

/**
 * Proactively ensures customer access token exists:
 * Returns current access token if both access & refresh tokens exist in localStorage,
 * or triggers refresh via refresh token / cookie to obtain and store both tokens.
 */
export async function ensureCustomerToken(): Promise<string | null> {
  const existingAccess = getUserAccessToken();
  const existingRefresh = getUserRefreshToken();
  if (existingAccess && existingRefresh) {
    return existingAccess;
  }
  return refreshCustomerAccessToken();
}

// ============================================================
// REQUEST INTERCEPTOR: Inject Bearer Tokens & Storefront Headers
// ============================================================
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig & { useAdminAuth?: boolean }) => {
    const url = config.url || "";
    const isAdminRoute =
      Boolean((config as any)?.useAdminAuth) ||
      url.includes("/admin") ||
      url.includes("/categories/admin") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

    let token: string | null = null;
    if (isAdminRoute) {
      // Admin endpoints strictly use admin_access_token (never customer tokens)
      token = getAdminAccessToken();
      // If access token is absent but refresh token exists and not login call, attempt refresh
      if (!token && !url.includes("/auth/login") && !url.includes("/auth/refresh")) {
        token = await refreshAdminAccessToken();
      }
    } else {
      token = getUserAccessToken();
      if (!token && !url.includes("/auth/login") && !url.includes("/auth/refresh")) {
        // If customer access token absent, check if refresh token exists
        if (getUserRefreshToken()) {
          token = await refreshCustomerAccessToken();
        }
      }
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

// ============================================================
// RESPONSE INTERCEPTOR: Handle 401 / 403 with Automatic Refresh & Retry
// ============================================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & {
      _retryAdminAuth?: boolean;
      _retryUserAuth?: boolean;
      useAdminAuth?: boolean;
    }) | undefined;

    const url = originalConfig?.url || "";
    const isLoginOrRefreshRoute = url.includes("/auth/login") || url.includes("/auth/refresh");
    const isAdminRoute =
      Boolean((originalConfig as any)?.useAdminAuth) ||
      url.includes("/admin") ||
      url.includes("/categories/admin") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));
    const status = error.response?.status;

    // Handle Admin Auth Session Expired or Forbidden (401 or 403)
    if (isAdminRoute && (status === 401 || status === 403)) {
      if (!isLoginOrRefreshRoute && originalConfig && !originalConfig._retryAdminAuth) {
        originalConfig._retryAdminAuth = true;
        const freshToken = await refreshAdminAccessToken();
        if (freshToken) {
          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${freshToken}`;
          }
          return apiClient(originalConfig);
        }
      }

      // If refresh failed or was login/refresh route, clear admin tokens and lock dashboard
      if (!isLoginOrRefreshRoute) {
        clearAdminTokens();
        window.dispatchEvent(new Event("abb_admin_forbidden"));
      }
      return Promise.reject(error);
    }

    // Handle Customer 401 Session Expired
    if (status === 401 && !isAdminRoute) {
      if (!isLoginOrRefreshRoute && originalConfig && !originalConfig._retryUserAuth) {
        originalConfig._retryUserAuth = true;
        const freshToken = await refreshCustomerAccessToken();
        if (freshToken) {
          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${freshToken}`;
          }
          return apiClient(originalConfig);
        }
      }

      // If refresh failed, clear user tokens
      if (!isLoginOrRefreshRoute) {
        clearUserTokens();
        window.dispatchEvent(new Event("abb_auth_change"));
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// ERROR NORMALIZER & SCRIPTS
// ============================================================
export function normalizeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error;
    if (typeof serverMessage === "string" && serverMessage.trim()) {
      return serverMessage;
    }
    if (!error.response) {
      return "Cannot reach the API server. Start the backend on port 8081.";
    }
    if (status === 502 || status === 503) {
      return "API server is not reachable. Start the backend on port 8081.";
    }
    if (status === 500) {
      return "Backend service error (500). Please verify server connection.";
    }
    if (status === 401) {
      return "Invalid email or password. Access denied.";
    }
    if (status === 403) {
      return "Access denied. Insufficient permissions.";
    }
    if (status === 404) {
      return "Requested resource or endpoint not found.";
    }
    return error.message || "Request failed";
  }
  return error instanceof Error ? error.message : "An unexpected error occurred";
}

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
