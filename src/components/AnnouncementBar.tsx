import React, { useState, useEffect } from 'react';
import { Phone, Mail, Truck, Headphones, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANNOUNCEMENT_DATA } from '../data/storeData';

export const AnnouncementBar: React.FC = () => {
  const [mobileIndex, setMobileIndex] = useState(0);

  // Rotate messages on mobile every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % ANNOUNCEMENT_DATA.mobileMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="bg-navy text-white text-xs sm:text-[13px] py-2 px-4 border-b border-navy-light/40 relative z-40"
      role="region"
      aria-label="Store Announcement & Contact Information"
    >
      <div className="w-full max-w-[1560px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Desktop Left: Phone & Email */}
        <div className="hidden md:flex items-center space-x-6 text-slate-200">
          <a
            href={`tel:${ANNOUNCEMENT_DATA.phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 hover:text-[#A44101] transition-colors duration-150 group"
            aria-label={`Call customer care at ${ANNOUNCEMENT_DATA.phone}`}
          >
            <Phone className="w-3.5 h-3.5 text-[#A44101] group-hover:scale-110 transition-transform" />
            <span className="font-medium tracking-wide">{ANNOUNCEMENT_DATA.phone}</span>
          </a>
          <span className="text-slate-500">•</span>
          <a
            href={`mailto:${ANNOUNCEMENT_DATA.email}`}
            className="flex items-center gap-1.5 hover:text-[#A44101] transition-colors duration-150 group"
            aria-label={`Email support at ${ANNOUNCEMENT_DATA.email}`}
          >
            <Mail className="w-3.5 h-3.5 text-[#A44101] group-hover:scale-110 transition-transform" />
            <span className="font-normal">{ANNOUNCEMENT_DATA.email}</span>
          </a>
        </div>

        {/* Desktop Right: Highlights */}
        <div className="hidden md:flex items-center space-x-4 text-slate-200 font-medium">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-[#A44101]" />
            <span>Pan India Delivery</span>
          </div>
          <span className="text-slate-500">•</span>
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-[#A44101]" />
            <span>24/7 Support</span>
          </div>
        </div>

        {/* Mobile View: Rotating 1-line announcement */}
        <div className="w-full md:hidden flex items-center justify-center h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="text-center font-medium text-slate-100 flex items-center justify-center gap-1.5 text-xs truncate"
              aria-live="polite"
            >
              <span>{ANNOUNCEMENT_DATA.mobileMessages[mobileIndex]}</span>
              <ChevronRight className="w-3 h-3 text-[#A44101] inline-block opacity-75" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
