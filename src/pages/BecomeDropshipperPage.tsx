import React, { useState, useEffect } from 'react';
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
    // Navigate to dedicated dropshipper portal running on port 5174
    window.location.href = 'http://localhost:5174';
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
    <div className="min-h-[60vh] bg-slate-50/60 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-14 sm:py-20 font-roboto antialiased selection:bg-[#A44101] selection:text-white">
      <div className="max-w-2xl mx-auto w-full">
        {/* Brand Eyebrow */}
        <div className="text-[11px] font-extrabold tracking-wider text-[#EA580C] uppercase mb-2">
          OFFERWALEBABA · ECOMM
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Become a Dropshipper
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-xl">
          Partner with us to sell our catalog. Open the dropshipper portal to register, pay
          the annual fee, and complete your application.
        </p>

        {/* Plan Subscription Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 block">
              Annual subscription
            </span>
            <div className="flex items-baseline gap-1 text-slate-900">
              <span className="text-2xl sm:text-3xl font-extrabold">
                ₹{subscriptionInfo.amount}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                /{subscriptionInfo.years} year
              </span>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Continue on the dropshipper portal to fill details and pay.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceedToPortal}
            className="px-6 py-3 rounded-xl bg-[#F58220] hover:bg-[#E06D10] text-white text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap active:scale-98"
          >
            Become a Dropshipper
          </button>
        </div>

        {/* Bottom Navigation Links */}
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#EA580C]">
          <button
            type="button"
            onClick={handleBack}
            className="hover:underline cursor-pointer"
          >
            Back to shop
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={handleContact}
            className="hover:underline cursor-pointer"
          >
            Contact us
          </button>
        </div>
      </div>
    </div>
  );
};

