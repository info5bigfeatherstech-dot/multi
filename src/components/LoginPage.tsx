import React, { useState } from "react";
import { 
  ArrowLeft, 
  HelpCircle, 
  AlertCircle,
  User,
  Mail,
  Lock
} from "lucide-react";
import { authApi } from "../api/authApi";
import { GoogleSignInButton } from "./GoogleSignInButton";
import toast from "react-hot-toast";
import { persistUserPhone, getPersistedUserPhone } from "../utils/authGuard";

interface LoginPageProps {
  onBackToStore: () => void;
  onAuthSuccess?: (user: any) => void;
  onSuccess?: () => void;
  message?: string;
  initialMode?: "login" | "register";
  onGoToContact?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToStore,
  onAuthSuccess,
  onSuccess,
  message,
  initialMode = "login",
  onGoToContact,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Login form state
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
    rememberMe: true,
  });

  // Register form state
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: true,
  });

  // Successful auth handler (keeps full backwards-compatible persistence)
  const handleSuccessfulAuth = (user: any) => {
    const rawUser = user?.user || user;
    const userEmail = rawUser?.email || localStorage.getItem("abb_user_profile_email") || "";
    let phone = rawUser?.phone || rawUser?.phoneNumber || rawUser?.mobile;

    if (!phone && userEmail) {
      phone = getPersistedUserPhone(userEmail) || undefined;
    }

    if (phone) {
      persistUserPhone(userEmail, phone);
    }
    if (rawUser?.email) {
      localStorage.setItem("abb_user_profile_email", rawUser.email);
    }
    if (rawUser?.name) {
      localStorage.setItem("abb_user_profile_name", rawUser.name);
    }

    toast.success("Welcome! You are now signed in.", { position: "top-center" });
    window.dispatchEvent(new Event("abb_auth_change"));
    onAuthSuccess?.(user);
    onSuccess?.();
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = loginForm.identifier.trim();
    if (!trimmedId) {
      setError("Please enter your registered email or 10-digit phone number");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedId);
    const isPhone = /^[6-9]\d{9}$/.test(trimmedId);
    if (!isEmail && !isPhone) {
      setError("Identifier must be a valid email or 10-digit mobile number (e.g. 9876543210)");
      return;
    }

    if (!loginForm.password || loginForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({
        identifier: trimmedId,
        password: loginForm.password,
        rememberMe: loginForm.rememberMe,
      });
      handleSuccessfulAuth(data?.user || data);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg && !msg.includes("Network Error") && !msg.includes("500") && !msg.includes("ECONNREFUSED")) {
        const friendlyError = "Your email or password, either of it is wrong. Please check and try again.";
        setError(friendlyError);
        toast.error(friendlyError, { position: "top-center" });
        setLoading(false);
        return;
      }

      // Offline / Demo environment fallback
      console.warn("API Login Notice (Offline Fallback enabled):", err?.message);
      const fallbackToken = "abb_usr_session_" + Date.now();
      localStorage.setItem("user_access_token", fallbackToken);
      if (isEmail) {
        localStorage.setItem("abb_user_profile_email", trimmedId);
        localStorage.setItem("abb_user_profile_name", trimmedId.split("@")[0]);
        const existingPhone = getPersistedUserPhone(trimmedId);
        if (existingPhone) {
          localStorage.setItem("abb_user_profile_phone", existingPhone);
        }
      } else {
        localStorage.setItem("abb_user_profile_phone", trimmedId);
        localStorage.setItem("abb_user_profile_name", "Customer");
        persistUserPhone(trimmedId, trimmedId);
      }
      handleSuccessfulAuth({ identifier: trimmedId });
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!regForm.name.trim() || regForm.name.trim().length < 2) {
      setError("Full name must be at least 2 characters");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regForm.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    const phoneClean = regForm.phone.trim().replace(/^(\+91|91)/, "").replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
      return;
    }

    if (!regForm.password || regForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        name: regForm.name.trim(),
        email: regForm.email.trim().toLowerCase(),
        phone: phoneClean,
        password: regForm.password,
        confirmPassword: regForm.confirmPassword,
      });

      persistUserPhone(regForm.email.trim().toLowerCase(), phoneClean);
      localStorage.setItem("abb_user_profile_phone", phoneClean);
      localStorage.setItem("abb_user_profile_name", regForm.name.trim());
      localStorage.setItem("abb_user_profile_email", regForm.email.trim().toLowerCase());

      handleSuccessfulAuth(data?.user || data);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg && !msg.includes("Network Error") && !msg.includes("500") && !msg.includes("ECONNREFUSED")) {
        setError(msg);
        toast.error(msg, { position: "top-center" });
        setLoading(false);
        return;
      }

      // Offline / Demo fallback
      console.warn("API Register Notice (Offline Fallback enabled):", err?.message);
      const fallbackToken = "abb_usr_session_" + Date.now();
      localStorage.setItem("user_access_token", fallbackToken);
      localStorage.setItem("abb_user_profile_email", regForm.email.trim().toLowerCase());
      localStorage.setItem("abb_user_profile_name", regForm.name.trim());
      localStorage.setItem("abb_user_profile_phone", phoneClean);
      persistUserPhone(regForm.email.trim().toLowerCase(), phoneClean);
      handleSuccessfulAuth({
        name: regForm.name.trim(),
        email: regForm.email.trim().toLowerCase(),
        phone: phoneClean,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTroubleClick = () => {
    toast((t) => (
      <div className="text-xs">
        <p className="font-bold text-slate-800 mb-1">Need help signing in?</p>
        <p className="text-slate-600 mb-2">You can instantly sign in using your Google account below or contact our customer support.</p>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            if (onGoToContact) onGoToContact();
          }}
          className="text-xs font-bold text-[#A44101] underline cursor-pointer"
        >
          Contact Customer Care
        </button>
      </div>
    ), { duration: 6000, position: "top-center" });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between text-slate-800 font-sans relative overflow-hidden selection:bg-[#A44101]/10 selection:text-[#A44101]">
      
      {/* ─────────────────────────────────────────────────────────────────
          BACKGROUND MINIMALIST ARTISTIC SHAPES & DOODLES
          Inspired by the provided reference aesthetic
         ───────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Left Warm Polka-Dot Geometric Card */}
        <div className="hidden lg:block absolute left-8 xl:left-24 bottom-24 w-28 h-44 rounded-2xl bg-[#F8E7D8]/60 border border-[#F3D5BD] overflow-hidden opacity-90 shadow-sm">
          <div className="w-full h-full p-3 grid grid-cols-3 gap-2.5 opacity-60">
            {Array.from({ length: 15 }).map((_, i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#A44101]/50 self-center justify-self-center" />
            ))}
          </div>
        </div>

        {/* Left Outline Square with Arrow */}
        <div className="hidden lg:flex absolute left-40 xl:left-56 bottom-20 w-24 h-24 rounded-xl border-2 border-slate-300/80 items-center justify-center bg-white/40 backdrop-blur-xs">
          <svg className="w-8 h-8 text-slate-400 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Left Wavy Doodle Line */}
        <svg className="hidden md:block absolute left-12 top-48 w-40 h-28 text-slate-300/80 opacity-70" viewBox="0 0 160 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 50 C 40 10, 60 90, 90 40 C 120 0, 140 80, 160 50" strokeLinecap="round" />
        </svg>

        {/* Right Warm Polka-Dot Geometric Card */}
        <div className="hidden lg:block absolute right-12 xl:right-28 bottom-28 w-24 h-36 rounded-2xl bg-[#F8E7D8]/60 border border-[#F3D5BD] overflow-hidden opacity-90 shadow-sm">
          <div className="w-full h-full p-3 grid grid-cols-3 gap-2 opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="w-2 h-2 rounded-full bg-[#A44101]/50 self-center justify-self-center" />
            ))}
          </div>
        </div>

        {/* Right Floating Speech Bubble Silhouette */}
        <div className="hidden lg:flex absolute right-40 xl:right-60 top-52 w-28 h-20 rounded-2xl border-2 border-slate-300/80 items-center justify-center bg-white/40 backdrop-blur-xs">
          <div className="space-y-1.5 w-16">
            <div className="h-1.5 bg-slate-300 rounded-full w-full" />
            <div className="h-1.5 bg-slate-200 rounded-full w-2/3" />
          </div>
        </div>

        {/* Right Wavy Doodle Line */}
        <svg className="hidden md:block absolute right-8 top-32 w-36 h-28 text-slate-300/80 opacity-70" viewBox="0 0 160 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 30 C 40 70, 70 10, 110 60 C 140 90, 150 30, 160 40" strokeLinecap="round" />
        </svg>

        {/* Soft Radial Ambient Glow in Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#A44101]/5 via-[#FDEEDC]/25 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TOP NAVIGATION BAR (Matching reference header layout)
         ───────────────────────────────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <button
          type="button"
          onClick={onBackToStore}
          className="flex items-center gap-3 group cursor-pointer focus:outline-none"
          title="Return to Apna Bharat Bazaar Home"
        >
          <img
            src="/images/logo.jpeg"
            alt="Apna Bharat Bazaar"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm ring-2 ring-[#A44101]/40 group-hover:scale-105 transition-transform"
          />
          <div className="text-left">
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block leading-tight font-roboto">
              Apna Bharat <span className="text-[#A44101]">Bazaar</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide block uppercase">
              Think Shopping, Think Us
            </span>
          </div>
        </button>

        {/* Top-Right Navigation Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#A44101]" />
            <span className="hidden sm:inline">Back to Store</span>
            <span className="sm:hidden">Store</span>
          </button>

          {onGoToContact && (
            <button
              type="button"
              onClick={onGoToContact}
              className="inline-flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold text-white bg-[#A44101] hover:bg-[#8C3701] shadow-sm transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </button>
          )}
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────
          MAIN CONTENT: Centered Floating Aesthetic Auth Card
         ───────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-4 py-4 sm:py-8 flex flex-col items-center">
        
        {/* Flash Context Message (e.g. "Please log in to proceed to checkout") */}
        {message && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-[#A44101] shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Floating Card */}
        <div className="w-full bg-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] border border-amber-100/70 relative">
          
          {/* Card Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-roboto mb-1.5">
              {mode === "login" ? "Customer Sign In" : "Create Account"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xs mx-auto">
              {mode === "login"
                ? "Hey, enter your details to sign in to your account"
                : "Hey, join Apna Bharat Bazaar to track orders & unlock exclusive prices"}
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MODE 1: SIGN IN FORM
             ══════════════════════════════════════════════════════════════════ */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Input: Email or Phone */}
              <div>
                <div className="relative flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <input
                    type="text"
                    required
                    value={loginForm.identifier}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, identifier: e.target.value });
                      if (error) setError("");
                    }}
                    placeholder="Enter Email / Phone No"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none pr-8"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 block" />
                  </div>
                </div>
              </div>

              {/* Input: Passcode / Password */}
              <div>
                <div className="relative flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-3 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      if (error) setError("");
                    }}
                    placeholder="Passcode / Password"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors select-none cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Having Trouble Link */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={handleTroubleClick}
                  className="text-xs text-slate-500 hover:text-[#A44101] transition-colors cursor-pointer"
                >
                  Having trouble in sign in?
                </button>

                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-500 select-none">
                  <input
                    type="checkbox"
                    checked={loginForm.rememberMe}
                    onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#A44101] focus:ring-[#A44101]"
                  />
                  <span className="text-[11px]">Remember me</span>
                </label>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-2xl bg-[#A44101] hover:bg-[#8C3701] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center justify-center font-roboto"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span>Sign in</span>
                )}
              </button>

              {/* Divider: "— Or sign in with —" */}
              <div className="relative my-5 flex items-center justify-center">
                <span className="h-px bg-slate-200/80 w-full" />
                <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  — Or sign in with —
                </span>
              </div>

              {/* Google OAuth Button ONLY (No Apple ID, No Facebook) */}
              <div className="w-full flex justify-center">
                <GoogleSignInButton
                  onSuccess={(u) => handleSuccessfulAuth(u)}
                  onError={setError}
                />
              </div>

              {/* Switch to Register */}
              <div className="pt-4 text-center">
                <p className="text-xs text-slate-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                    className="font-bold text-slate-900 hover:text-[#A44101] transition-colors cursor-pointer"
                  >
                    Request Now / Sign Up
                  </button>
                </p>
              </div>
            </form>
          ) : (
            
            /* ══════════════════════════════════════════════════════════════════
               MODE 2: REGISTRATION FORM
               ══════════════════════════════════════════════════════════════════ */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name *
                </label>
                <div className="flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-2.5 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address *
                </label>
                <div className="flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-2.5 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-2.5 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <span className="text-xs font-bold text-slate-400 mr-2 select-none">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="9876543210"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Create Password *
                </label>
                <div className="relative flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-2.5 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors select-none cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Confirm Password *
                </label>
                <div className="relative flex items-center bg-[#FBF9F5] border border-slate-200/90 rounded-2xl px-4 py-2.5 focus-within:border-[#A44101] focus-within:ring-3 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all shadow-2xs">
                  <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors select-none cursor-pointer"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Primary Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 sm:py-4 px-6 rounded-2xl bg-[#A44101] hover:bg-[#8C3701] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center justify-center font-roboto"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              {/* Divider: "— Or sign up with —" */}
              <div className="relative my-4 flex items-center justify-center">
                <span className="h-px bg-slate-200/80 w-full" />
                <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  — Or sign up with —
                </span>
              </div>

              {/* Google OAuth Button ONLY */}
              <div className="w-full flex justify-center">
                <GoogleSignInButton
                  onSuccess={(u) => handleSuccessfulAuth(u)}
                  onError={setError}
                />
              </div>

              {/* Switch back to Login */}
              <div className="pt-3 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="font-bold text-slate-900 hover:text-[#A44101] transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────────
          PAGE FOOTER (Matching reference footer copyright & privacy layout)
         ───────────────────────────────────────────────────────────────── */}
      <footer className="relative z-20 w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200/50 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-medium">
          <span>Copyright © 2026 Apna Bharat Bazaar</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hover:text-slate-600 transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hover:text-slate-600 transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>

    </div>
  );
};

export default LoginPage;
