import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Store,
  KeyRound
} from 'lucide-react';
import { mockAdminStore, AdminUser } from '../mockAdminStore';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToStore?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const [email, setEmail] = useState('admin@store.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide an admin email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const user = mockAdminStore.login(email, password);
      setIsLoading(false);
      onLoginSuccess(user);
    }, 400);
  };

  const handleUseDemo = () => {
    setEmail('admin@store.com');
    setPassword('admin123');
    setIsLoading(true);
    setTimeout(() => {
      const user = mockAdminStore.login('admin@store.com', 'admin123');
      setIsLoading(false);
      onLoginSuccess(user);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-roboto text-slate-100 antialiased relative overflow-hidden">
      {/* Background subtle radial flare */}
      <div className="absolute w-[600px] h-[600px] bg-[#A44101]/10 rounded-full blur-3xl pointer-events-none -top-40 -right-40" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -bottom-30 -left-30" />

      {/* Top Brand Logo / Back Link */}
      <div className="relative z-10 mb-6 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 mb-3 ring-4 ring-[#A44101]/30">
          <img
            src="/images/logo.jpeg"
            alt="Apna Bharat Bazaar"
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight text-center">
          Apna Bharat Bazaar
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Admin Portal &amp; Operations Command Center
        </p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white text-navy rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200/80">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[#A44101] text-[11px] font-black border border-amber-200/80 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Frontend-Only Mock Auth</span>
          </div>
          <h2 className="text-xl font-black text-navy tracking-tight">
            Sign In to Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Accepts any dummy credentials or click below for instant 1-click access.
          </p>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black text-amber-950">Instant Access Available</p>
            <p className="text-[11px] text-amber-800">Bypass credentials and view the panel</p>
          </div>
          <button
            type="button"
            onClick={handleUseDemo}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-black shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
          >
            Open Dashboard ⚡
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@store.com"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <span className="text-[11px] text-slate-400">
                Any dummy string
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-navy hover:bg-[#0c1a2d] text-white text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          <button
            type="button"
            onClick={handleUseDemo}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#A44101] border border-amber-300/80 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#A44101]" />
            <span>1-Click Demo Login (admin@store.com)</span>
          </button>

          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              className="w-full py-2 px-3 text-slate-500 hover:text-navy text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>← Back to Customer Store</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 mt-6 text-center text-xs text-slate-400">
        <span>Persistent mock data stored in browser </span>
        <code className="text-[#A44101] font-mono bg-white/10 px-1.5 py-0.5 rounded">localStorage</code>
      </div>
    </div>
  );
};

export default AdminLogin;
