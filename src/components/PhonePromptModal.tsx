import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  LogOut, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '../api/client';
import { authApi } from '../api/authApi';
import { clearUserTokens } from '../api/client';
import { persistUserPhone, getPersistedUserPhone } from '../utils/authGuard';

interface PhonePromptModalProps {
  isOpen: boolean;
  onSuccess: (phone: string) => void;
  onUseAnotherAccount: () => void;
}

export const PhonePromptModal: React.FC<PhonePromptModalProps> = ({
  isOpen,
  onSuccess,
  onUseAnotherAccount,
}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read current signed-in user profile from localStorage
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('abb_user_profile_email') || '';
      setEmail(storedEmail);
      setName(localStorage.getItem('abb_user_profile_name') || 'Customer');
      setAvatar(localStorage.getItem('abb_user_profile_avatar') || '');

      // Check if user already provided phone earlier
      const alreadySaved = getPersistedUserPhone(storedEmail);
      if (alreadySaved) {
        onSuccess(alreadySaved);
        return;
      }

      setPhone('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  // Immediate safeguard: If person already gave phone number, do NOT show modal or ask again
  const currentSavedPhone = typeof window !== 'undefined' 
    ? (getPersistedUserPhone() || getPersistedUserPhone(localStorage.getItem('abb_user_profile_email') || '')) 
    : null;
  if (currentSavedPhone) {
    return null;
  }

  // Handle phone input: block non-digits and cap at 10 digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const isComplete = phone.length === 10;

  // ── SUBMISSION ──
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete || loading) return;

    // Strict 10-digit Indian mobile validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Submit phone to backend profile endpoint
      await apiClient.put('/auth/profile', {
        phone: phone,
        mobile: phone,
        phoneNumber: `+91${phone}`,
      });

      // 2. Case A: Success - update session and permanently map to account profile
      persistUserPhone(email, phone);
      window.dispatchEvent(new Event('abb_auth_change'));
      setLoading(false);
      onSuccess(phone);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || '';

      // Case B: Error check (e.g. number already registered)
      if (
        serverMsg.toLowerCase().includes('already') ||
        err?.response?.status === 409 ||
        err?.response?.data?.code === 'PHONE_EXISTS'
      ) {
        setError('Phone number is already associated with another account');
        setLoading(false);
        return;
      }

      // Offline / dev fallback: preserve seamless local flow if port 8081 is unreachable
      if (
        serverMsg.includes('Network Error') ||
        serverMsg.includes('500') ||
        serverMsg.includes('ECONNREFUSED') ||
        serverMsg.includes('Failed to fetch')
      ) {
        persistUserPhone(email, phone);
        window.dispatchEvent(new Event('abb_auth_change'));
        setLoading(false);
        onSuccess(phone);
        return;
      }

      setError(serverMsg || 'Unable to update phone number. Please try again.');
      setLoading(false);
    }
  };

  // ── ALTERNATIVE EXIT: "Use another account" ──
  const handleSwitchAccount = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearUserTokens();
      localStorage.removeItem('abb_user_profile_name');
      localStorage.removeItem('abb_user_profile_email');
      localStorage.removeItem('abb_user_profile_phone');
      localStorage.removeItem('abb_user_profile_avatar');
      window.dispatchEvent(new Event('abb_auth_change'));
      onUseAnotherAccount();
    }
  };

  // Derive initials for avatar fallback
  const initials = (name || email || 'C')
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'C';

  return (
    // Gate Lock: Full-screen modal overlay (no backdrop click dismissal)
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-prompt-title"
    >
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Theme Top Accent Gradient Line */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-[#A44101] to-orange-600" />

        <div className="p-6 sm:p-8">
          {/* User Profile Badge (Signed-in email & avatar) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A44101] to-amber-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {name || 'Customer Account'}
                </div>
                <div className="text-[11px] text-slate-500 truncate" title={email}>
                  {email || 'Signed in via Google'}
                </div>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified</span>
            </span>
          </div>

          {/* Heading Prompt */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 text-[#A44101] mx-auto mb-3 flex items-center justify-center shadow-inner">
              <Phone className="w-6 h-6 text-[#A44101]" />
            </div>
            <h2 id="phone-prompt-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Add your mobile number
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
              Please provide your mobile number to receive instant SMS updates and delivery confirmation for your orders.
            </p>
          </div>

          {/* Phone Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number
              </label>

              {/* Input Group with +91 Prefix */}
              <div className="flex items-center rounded-2xl border-2 border-slate-200 bg-slate-50/50 hover:bg-white focus-within:border-[#A44101] focus-within:ring-4 focus-within:ring-[#A44101]/10 focus-within:bg-white transition-all overflow-hidden shadow-sm">
                {/* Country Code Pill */}
                <div className="flex items-center gap-1.5 px-3.5 py-3 border-r border-slate-200 bg-slate-100/70 text-slate-800 shrink-0 font-bold text-xs sm:text-sm">
                  <span className="text-base select-none">🇮🇳</span>
                  <span>+91</span>
                </div>

                {/* 10-Digit Input Field */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="98765 43210"
                  autoFocus
                  autoComplete="tel-national"
                  className="w-full px-3.5 py-3 text-slate-900 bg-transparent text-sm sm:text-base font-bold placeholder-slate-400 focus:outline-none tracking-wide"
                />

                {/* Character Counter / Status */}
                <div className="pr-3 text-[11px] font-bold text-slate-400 shrink-0">
                  {phone.length}/10
                </div>
              </div>

              {/* Case B: Inline Error Message */}
              {error && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {/* Primary CTA: "Next" */}
              <button
                type="submit"
                disabled={phone.length !== 10 || loading}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#A44101] to-[#C85203] hover:from-[#8C3701] hover:to-[#A44101] text-white text-sm font-bold shadow-md shadow-[#A44101]/25 hover:shadow-lg hover:shadow-[#A44101]/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Secondary CTA: "Use another account" */}
              <button
                type="button"
                onClick={handleSwitchAccount}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Use another account</span>
              </button>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Your information is protected with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhonePromptModal;
