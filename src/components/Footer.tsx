import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Headphones, 
  ArrowRight, 
  Clock, 
  Heart 
} from 'lucide-react';
import { ANNOUNCEMENT_DATA, STORE_CATEGORIES } from '../data/storeData';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-slate-300 pt-14 pb-8 border-t border-navy-light/40" role="contentinfo">
      <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Features Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-700/60">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-theme bg-[#A44101]/10 border border-[#A44101]/30 flex items-center justify-center text-[#A44101] shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pan India Fast Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Reliable doorstep courier service across India</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-theme bg-[#A44101]/10 border border-[#A44101]/30 flex items-center justify-center text-[#A44101] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Lowest Price Guarantee</h4>
              <p className="text-xs text-slate-400 mt-0.5">Direct manufacturer &amp; special discount rates</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-theme bg-[#A44101]/10 border border-[#A44101]/30 flex items-center justify-center text-[#A44101] shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">7-Day Easy Replacement</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free support on verified damaged items</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-theme bg-[#A44101]/10 border border-[#A44101]/30 flex items-center justify-center text-[#A44101] shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Direct WhatsApp &amp; phone assistance</p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 py-12 border-b border-slate-700/60">
          
          {/* Brand Bio & Contact (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <a href="/" className="inline-flex items-center group">
              <img
                src="/images/logo.jpeg"
                alt="Apna Bharat Bazaar"
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full object-cover ring-3 ring-[#A44101] bg-white shadow-lg group-hover:scale-105 transition-transform duration-200"
              />
            </a>

            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              India's trusted online shopping bazaar offering lowest discounted rates on kitchenware, smart gadgets, baby essentials, housekeeping tools, and lifestyle goods.
            </p>

            <div className="space-y-2.5 pt-2 text-xs sm:text-[13px]">
              <a 
                href={`tel:${ANNOUNCEMENT_DATA.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2.5 text-slate-300 hover:text-[#A44101] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#A44101] shrink-0" />
                <span className="font-bold">{ANNOUNCEMENT_DATA.phone}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                  WhatsApp Available
                </span>
              </a>

              <a 
                href={`mailto:${ANNOUNCEMENT_DATA.email}`}
                className="flex items-center gap-2.5 text-slate-300 hover:text-[#A44101] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>{ANNOUNCEMENT_DATA.email}</span>
              </a>

              <div className="flex items-center gap-2.5 text-slate-400">
                <Clock className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>Support Hours: Mon - Sat (9:00 AM - 8:00 PM)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>Pan India Fulfillment Hubs</span>
              </div>
            </div>
          </div>

          {/* Quick Category Links (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#A44101] rounded-full" />
              <span>Top Categories</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              <li key="u99-special">
                <a 
                  href="#under-99-store"
                  className="text-[#A44101] font-bold hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A44101] inline-block" />
                    Under ₹99 Store
                  </span>
                  <span className="text-[9px] bg-[#A44101] text-white px-1.5 py-0.5 rounded font-black">
                    DHAMAKA
                  </span>
                </a>
              </li>
              {STORE_CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <a 
                    href={`#section-${cat.id}`}
                    className="text-slate-400 hover:text-[#A44101] transition-colors flex items-center justify-between group"
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#A44101] group-hover:translate-x-1 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service & Policies (2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#A44101] rounded-full" />
              <span>Help &amp; Policies</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px] text-slate-400">
              <li>
                <a href="#track-order" className="hover:text-[#A44101] transition-colors">
                  Track Your Order
                </a>
              </li>
              <li>
                <a href="#replacement-policy" className="hover:text-[#A44101] transition-colors">
                  Replacement Policy
                </a>
              </li>
              <li>
                <a href="#shipping-policy" className="hover:text-[#A44101] transition-colors">
                  Shipping &amp; Delivery
                </a>
              </li>
              <li>
                <a href="#privacy-policy" className="hover:text-[#A44101] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#A44101] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#bulk-orders" className="hover:text-[#A44101] transition-colors">
                  Bulk &amp; Corporate Inquiries
                </a>
              </li>
            </ul>
          </div>

          {/* Exclusive Deals Alert Newsletter (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#A44101] rounded-full" />
              <span>Deal Alerts</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe to get alerts on flash discounts under ₹99, ₹149, and new inventory arrivals.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter email or WhatsApp number"
                  className="w-full px-3.5 py-2.5 rounded-theme bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#A44101]"
                  aria-label="Enter email or WhatsApp number for deals alerts"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold py-2.5 px-4 rounded-theme text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Get Secret Discounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <p className="text-[11px] text-slate-500">
              🔒 No spam. Only legitimate daily price drops. Unsubscribe anytime.
            </p>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Verified Payment Badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1 text-center sm:text-left">
            <span>© 2026 Apna Bharat Bazaar. Think Shopping, Think Us. Built with</span>
            <Heart className="w-3.5 h-3.5 text-[#A44101] inline fill-current" />
            <span>for Indian Shoppers. All rights reserved.</span>
          </div>

          {/* Accepted Indian Payment Modes */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">100% Safe Payments:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">
                UPI
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">
                Google Pay
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">
                PhonePe
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">
                RuPay
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-white">
                Cash On Delivery
              </span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
