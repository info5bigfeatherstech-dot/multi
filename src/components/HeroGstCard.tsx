import React, { useState } from 'react';
import { Tag, FileText, PackageCheck, X, ReceiptText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HeroGstCard: React.FC = () => {
  const [showGstModal, setShowGstModal] = useState(false);

  const handleCardClick = (id: string) => {
    if (id === 'gst-inclusive') {
      setShowGstModal(true);
    } else if (id === 'lowest-prices') {
      const el = document.querySelector('.section-home-kitchen') || document.querySelector('.section-top-categories');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'no-moq') {
      const el = document.querySelector('.section-top-categories');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div 
        className="w-full h-full flex flex-col justify-between gap-3 select-none"
        aria-label="Store Guarantees and Perks"
      >
        {/* Card 1: Lowest Prices */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('lowest-prices')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('lowest-prices')}
          className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer group hover:-translate-y-0.5"
        >
          {/* Circular Badge: Soft Accent with Tag Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#A44101]/10 flex items-center justify-center mb-2.5 group-hover:scale-108 transition-transform duration-200">
            <Tag className="w-6 h-6 text-[#A44101] stroke-[2.2]" />
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-[15px] sm:text-base text-navy tracking-tight leading-snug">
            Lowest Prices
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            On Everything
          </p>
        </div>

        {/* Card 2: GST Inclusive */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('gst-inclusive')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('gst-inclusive')}
          className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer group hover:-translate-y-0.5 relative"
        >
          {/* Circular Badge: Soft Gray with Document Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center mb-2.5 group-hover:scale-108 transition-transform duration-200">
            <FileText className="w-6 h-6 text-navy stroke-[2.2]" />
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-[15px] sm:text-base text-navy tracking-tight leading-snug">
            GST Inclusive
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            No extra at checkout
          </p>
        </div>

        {/* Card 3: No MOQ */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('no-moq')}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick('no-moq')}
          className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer group hover:-translate-y-0.5"
        >
          {/* Circular Badge: Soft Accent with Package Icon */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#A44101]/10 flex items-center justify-center mb-2.5 group-hover:scale-108 transition-transform duration-200">
            <PackageCheck className="w-6 h-6 text-[#A44101] stroke-[2.2]" />
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-[15px] sm:text-base text-navy tracking-tight leading-snug">
            No MOQ
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Buy 1 or 1,000
          </p>
        </div>
      </div>

      {/* GST Information & Sample Tax Invoice Modal */}
      <AnimatePresence>
        {showGstModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gst-info-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-[#121e36] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-[#A44101]" />
                  <h3 id="gst-info-modal-title" className="font-bold text-base text-white">
                    GST Inclusive Pricing Policy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGstModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 text-xs sm:text-[13px] text-slate-700">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-navy" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm">
                      Zero Hidden Taxes at Checkout
                    </h4>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      All product prices displayed on Apna Bharat Bazaar are 100% inclusive of all applicable GST (CGST + SGST or IGST). What you see is what you pay!
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/70">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                    For Businesses & Resellers:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-[#A44101] font-bold">✓</span>
                      <span>Claim full <strong>Input Tax Credit (ITC)</strong> of up to 18%–28% on all orders.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#A44101] font-bold">✓</span>
                      <span>Automated GST tax invoice with your company GSTIN generated upon dispatch.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#A44101] font-bold">✓</span>
                      <span>Seamless compliance for monthly GSTR-2B / 3B filing.</span>
                    </li>
                  </ul>
                </div>

                <div className="text-[11.5px] text-slate-500 leading-relaxed">
                  💡 Need a B2B tax invoice with your GSTIN? Simply enter your GST number during checkout or in your profile to receive an official tax invoice.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGstModal(false)}
                  className="bg-navy hover:bg-navy-light text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
