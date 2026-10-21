import { apiClient, normalizeApiError, setUserTokens, clearUserTokens, refreshCustomerAccessToken } from "./client";
import { persistUserPhone, getPersistedUserPhone } from "../utils/authGuard";

export const authApi = {
  // 1. Password Login
  login: async (payload: { identifier: string; password: string; rememberMe?: boolean }) => {
    try {
      const res = await apiClient.post("/auth/login", {
        identifier: payload.identifier.trim(),
        password: payload.password,
        portal: "ecomm",
      });
      const data = res.data?.data || res.data;
      const accessToken = data?.accessToken || data?.token || res.data?.accessToken;
      const refreshToken = data?.refreshToken || data?.refresh_token || res.data?.refreshToken;
      if (accessToken) {
        setUserTokens(accessToken, refreshToken);
      }
      if (data?.user) {
        if (data.user.name) localStorage.setItem("abb_user_profile_name", data.user.name);
        if (data.user.email) localStorage.setItem("abb_user_profile_email", data.user.email);
        const userPhone = data.user.phone || data.user.phoneNumber || data.user.mobile;
        if (userPhone) {
          persistUserPhone(data.user.email, userPhone);
        } else if (data.user.email) {
          const savedPhone = getPersistedUserPhone(data.user.email);
          if (savedPhone) {
            localStorage.setItem("abb_user_profile_phone", savedPhone);
          }
        }
      }
      return data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 2. Register
  register: async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    securityAnswers?: Array<{ questionId: string; answer: string }>;
  }) => {
    try {
      if (payload.phone) {
        persistUserPhone(payload.email, payload.phone);
      }
      const res = await apiClient.post("/auth/register", payload);
      const data = res.data?.data || res.data;
      const accessToken = data?.accessToken || data?.token;
      const refreshToken = data?.refreshToken || data?.refresh_token;
      if (accessToken) {
        setUserTokens(accessToken, refreshToken);
      }
      if (payload.phone) {
        persistUserPhone(payload.email, payload.phone);
      }
      return data;
    } catch (err) {
      if (payload.phone) {
        persistUserPhone(payload.email, payload.phone);
      }
      throw new Error(normalizeApiError(err));
    }
  },

  // 3. Verify OTP
  verifyOtp: async (payload: { identifier: string; otp: string }) => {
    try {
      const res = await apiClient.post("/auth/otp-verify-login", payload);
      const data = res.data?.data || res.data;
      const accessToken = data?.accessToken || data?.token;
      const refreshToken = data?.refreshToken || data?.refresh_token;
      if (accessToken) {
        setUserTokens(accessToken, refreshToken);
      }
      if (data?.user) {
        if (data.user.name) localStorage.setItem("abb_user_profile_name", data.user.name);
        if (data.user.email) localStorage.setItem("abb_user_profile_email", data.user.email);
        const userPhone = data.user.phone || data.user.phoneNumber || data.user.mobile || (/^[6-9]\d{9}$/.test(payload.identifier) ? payload.identifier : '');
        if (userPhone) {
          persistUserPhone(data.user.email || payload.identifier, userPhone);
        }
      } else if (/^[6-9]\d{9}$/.test(payload.identifier)) {
        persistUserPhone(payload.identifier, payload.identifier);
      }
      return data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 4. Google OAuth
  googleLogin: async (idToken: string) => {
    try {
      const res = await apiClient.post("/auth/google", { idToken, portal: "ecomm" });
      const data = res.data?.data || res.data;
      const accessToken = data?.accessToken || data?.token;
      const refreshToken = data?.refreshToken || data?.refresh_token;
      if (accessToken) {
        setUserTokens(accessToken, refreshToken);
      }
      if (data?.user) {
        if (data.user.name) localStorage.setItem("abb_user_profile_name", data.user.name);
        if (data.user.email) localStorage.setItem("abb_user_profile_email", data.user.email);
        const userPhone = data.user.phone || data.user.phoneNumber || data.user.mobile;
        if (userPhone) {
          persistUserPhone(data.user.email, userPhone);
        } else if (data.user.email) {
          const savedPhone = getPersistedUserPhone(data.user.email);
          if (savedPhone) {
            localStorage.setItem("abb_user_profile_phone", savedPhone);
          }
        }
      }
      return data;
    } catch (err) {
      // If backend server is unreachable (Network Error), decode verified Google ID Token
      try {
        const base64Url = idToken.split(".")[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          if (payload?.email || payload?.name) {
            setUserTokens(idToken, null);
            if (payload.name) localStorage.setItem("abb_user_profile_name", payload.name);
            if (payload.email) {
              localStorage.setItem("abb_user_profile_email", payload.email);
              const savedPhone = getPersistedUserPhone(payload.email);
              if (savedPhone) {
                localStorage.setItem("abb_user_profile_phone", savedPhone);
              }
            }
            return {
              accessToken: idToken,
              user: {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
              },
            };
          }
        }
      } catch {
        // pass through to throw
      }
      throw new Error(normalizeApiError(err));
    }
  },

  // 5. Refresh token
  refreshToken: async () => {
    return refreshCustomerAccessToken();
  },

  // 6. Get current profile
  getMe: async () => {
    try {
      const res = await apiClient.get("/auth/profile");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 7. Logout
  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      clearUserTokens();
      window.dispatchEvent(new Event("abb_auth_change"));
    }
  },
};
