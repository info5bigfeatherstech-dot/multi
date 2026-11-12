import React, { useState, useEffect } from 'react';
import { PackageCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface BecomeDropshipperPageProps {
  onBackToStore?: () => void;
  onGoToContact?: () => void;
}

export const BecomeDropshipperPage: React.FC<BecomeDropshipperPageProps> = ({
  onBackToStore,
  onGoToContact,
}) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    amount: 800,
    years: 1,
  });

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/dropshipper/auth/subscription-settings')
      .then((res) => {
        if (isMounted && res.data?.settings) {
          setSubscriptionInfo({
            amount: res.data.settings.subscriptionAmountInr || 800,
            years: res.data.settings.subscriptionYears || 1,
          });
        }
      })
      .catch(() => {
        // Fallback default is ₹800 / 1 year
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProceedToPortal = () => {
    const portalUrl =
      (import.meta as any).env?.VITE_DROPSHIPPER_PORTAL_URL || 'http://localhost:5174';
    window.location.href = portalUrl;
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBackToStore) {
      onBackToStore();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onGoToContact) {
      onGoToContact();
    } else {
      window.history.pushState(null, '', '/contact');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-[60vh] bg-slate-50/70 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 font-sans antialiased selection:bg-[#A44101] selection:text-white">
      <div className="max-w-2xl mx-auto w-full">
        {/* Brand Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A44101]/10 border border-[#A44101]/25 text-[11px] font-black tracking-wider text-[#A44101] uppercase mb-3">
          <PackageCheck className="w-3.5 h-3.5 text-[#A44101]" />
          <span>APNA BHARAT BAZAAR · B2B DROPSHIP</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight mb-3">
          Become a Dropshipper
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-xl">
          Partner with Apna Bharat Bazaar to sell our trending catalog with zero inventory risk.
          Open the official dropshipper portal to register, pay your annual partnership fee,
          and start fulfilling orders nationwide.
        </p>

        {/* Key Partner Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs font-bold text-navy">10,000+ Ready SKUs</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs font-bold text-navy">Pan-India Dispatch</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-[#A44101] shrink-0" />
            <span className="text-xs font-bold text-navy">Direct B2B Pricing</span>
          </div>
        </div>

        {/* Plan Subscription Card */}
        <div className="rounded-2xl border border-[#A44101]/20 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#A44101] via-[#8C3701] to-[#A44101]" />

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Annual Partner Subscription
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#A44101]/10 text-[#A44101] border border-[#A44101]/20">
                Official Access
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 text-navy">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#A44101]">
                ₹{subscriptionInfo.amount}
              </span>
              <span className="text-sm font-bold text-slate-500">
                /{subscriptionInfo.years} year
              </span>
            </div>
            <p className="text-xs text-slate-500 pt-0.5">
              Continue on the dropshipper portal to complete onboarding and activate your partner account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceedToPortal}
            className="px-6 py-3.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap active:scale-98"
          >
            <span>Become a Dropshipper</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Navigation Links */}
        <div className="mt-8 flex items-center gap-3 text-xs font-bold text-[#A44101]">
          <button
            type="button"
            onClick={handleBack}
            className="hover:text-[#8C3701] hover:underline cursor-pointer inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to shop</span>
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={handleContact}
            className="hover:text-[#8C3701] hover:underline cursor-pointer transition-colors"
          >
            Contact support
          </button>
        </div>
      </div>
    </div>
  );
};
