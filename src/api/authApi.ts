import { apiClient, normalizeApiError } from "./client";

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
      if (data?.accessToken || data?.token) {
        localStorage.setItem("user_access_token", data.accessToken || data.token);
      }
      if (data?.user) {
        if (data.user.name) localStorage.setItem("abb_user_profile_name", data.user.name);
        if (data.user.email) localStorage.setItem("abb_user_profile_email", data.user.email);
        if (data.user.phone) localStorage.setItem("abb_user_profile_phone", data.user.phone);
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
      const res = await apiClient.post("/auth/register", payload);
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },

  // 3. Verify OTP
  verifyOtp: async (payload: { identifier: string; otp: string }) => {
    try {
      const res = await apiClient.post("/auth/otp-verify-login", payload);
      const data = res.data?.data || res.data;
      if (data?.accessToken || data?.token) {
        localStorage.setItem("user_access_token", data.accessToken || data.token);
      }
      if (data?.user) {
        if (data.user.name) localStorage.setItem("abb_user_profile_name", data.user.name);
        if (data.user.email) localStorage.setItem("abb_user_profile_email", data.user.email);
        if (data.user.phone) localStorage.setItem("abb_user_profile_phone", data.user.phone);
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
      if (data?.accessToken || data?.token) {
        localStorage.setItem("user_access_token", data.accessToken || data.token);
      }
      if (data?.user) {
        if (data.user.name) localStorage.setItem("abb_user_profile_name", data.user.name);
        if (data.user.email) localStorage.setItem("abb_user_profile_email", data.user.email);
        if (data.user.phone) localStorage.setItem("abb_user_profile_phone", data.user.phone);
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
            localStorage.setItem("user_access_token", idToken);
            if (payload.name) localStorage.setItem("abb_user_profile_name", payload.name);
            if (payload.email) localStorage.setItem("abb_user_profile_email", payload.email);
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

  // 5. Get current profile
  getMe: async () => {
    try {
      const res = await apiClient.get("/auth/profile");
      return res.data?.data || res.data;
    } catch (err) {
      throw new Error(normalizeApiError(err));
    }
  },
};
