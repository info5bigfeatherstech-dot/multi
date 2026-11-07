import React from 'react';
import { 
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

interface FooterProps {
  onSelectCategory?: (categoryId: string) => void;
  onGoToAdmin?: () => void;
  onGoToContact?: () => void;
  onGoToBulkOrders?: () => void;
  onGoToCustomizeGift?: () => void;
  onGoToBecomeDropshipper?: () => void;
  onGoToInfluencer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onGoToAdmin: _onGoToAdmin,
  onGoToContact,
  onGoToBulkOrders,
  onGoToCustomizeGift,
  onGoToBecomeDropshipper: _onGoToBecomeDropshipper,
  onGoToInfluencer,
}) => {
  return (
    <footer className="site-footer bg-navy text-slate-300 pt-10 sm:pt-14 pb-12 sm:pb-8 border-t border-navy-light/40" role="contentinfo">
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

          <button
            type="button"
            onClick={() => {
              if (onGoToContact) onGoToContact();
              else {
                window.history.pushState(null, '', '/contact');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="flex items-center gap-3.5 text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-theme bg-[#A44101]/10 border border-[#A44101]/30 group-hover:bg-[#A44101]/20 flex items-center justify-center text-[#A44101] shrink-0 transition-colors">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-[#A44101] transition-colors"> Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Official email &amp; helpdesk assistance</p>
            </div>
          </button>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 py-12 border-b border-slate-700/60">
          
          {/* Brand Bio & Contact (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <a href="/" className="inline-flex items-center group">
              <img
                src="/images/logo.jpeg"
                alt="Apna Bharat Bazaar"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full object-cover ring-2 sm:ring-3 ring-[#A44101] bg-white shadow-lg group-hover:scale-105 transition-transform duration-200"
              />
            </a>

            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              India's trusted online shopping bazaar offering lowest discounted rates on kitchenware, smart gadgets, baby essentials, housekeeping tools, and lifestyle goods.
            </p>

            <div className="space-y-2.5 pt-2 text-xs sm:text-[13px]">
              <a 
                href={`mailto:${ANNOUNCEMENT_DATA.email}`}
                className="flex items-center gap-2.5 text-slate-300 hover:text-[#A44101] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>{ANNOUNCEMENT_DATA.email}</span>
              </a>

              <div className="flex items-center gap-2.5 text-slate-400">
                <Clock className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>Support Hours: Tue - Sun (1:00 PM - 10:00 PM)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-[#A44101] shrink-0" />
                <span>Pan India Fulfillment Hubs</span>
              </div>
            </div>
          </div>

          {/* Quick Category Links (4 cols) */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#A44101] rounded-full" />
              <span>Top Categories</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px]">
              {STORE_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button 
                    type="button"
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat.id);
                      } else {
                        const targetEl = document.querySelector(`.section-${cat.id}`) || document.querySelector(`.category-card-${cat.id}`);
                        if (targetEl) {
                          targetEl.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          document.querySelector('.section-top-categories')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="w-full text-left text-slate-400 hover:text-[#A44101] transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-[#A44101] group-hover:translate-x-1 transition-all" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service & Policies (3 cols) */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#A44101] rounded-full" />
              <span>Help &amp; Policies</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13px] text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onGoToContact) onGoToContact();
                    else {
                      window.history.pushState(null, '', '/contact');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#A44101] transition-colors cursor-pointer text-left"
                >
                  Customer Support &amp; Help Desk
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onGoToContact) onGoToContact();
                    else {
                      window.history.pushState(null, '', '/contact');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#A44101] transition-colors cursor-pointer text-left"
                >
                  Track Your Order
                </button>
              </li>
              <li>
                <a href="/policy/replacement" onClick={(e) => e.preventDefault()} className="hover:text-[#A44101] transition-colors cursor-pointer">
                  Replacement Policy
                </a>
              </li>
              <li>
                <a href="/policy/shipping" onClick={(e) => e.preventDefault()} className="hover:text-[#A44101] transition-colors cursor-pointer">
                  Shipping &amp; Delivery
                </a>
              </li>
              <li>
                <a href="/policy/privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#A44101] transition-colors cursor-pointer">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/policy/terms" onClick={(e) => e.preventDefault()} className="hover:text-[#A44101] transition-colors cursor-pointer">
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/bulk-orders"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onGoToBulkOrders) onGoToBulkOrders();
                    else {
                      window.history.pushState(null, '', '/bulk-orders');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#A44101] transition-colors cursor-pointer"
                >
                  Bulk Orders &amp; Wholesale
                </a>
              </li>
              <li>
                <a
                  href="/customize-gift"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onGoToCustomizeGift) onGoToCustomizeGift();
                    else {
                      window.history.pushState(null, '', '/customize-gift');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#A44101] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Corporate &amp; Custom Gifting</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-600/90 text-white px-1.5 py-0.5 rounded leading-none">
                    Custom
                  </span>
                </a>
              </li>
              {/* <li>
                <a
                  href="/become-dropshipper"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onGoToBecomeDropshipper) onGoToBecomeDropshipper();
                    else {
                      window.history.pushState(null, '', '/become-dropshipper');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#A44101] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Become a Dropshipper</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-[#A44101] text-white px-1.5 py-0.5 rounded leading-none">
                    B2B
                  </span>
                </a>
              </li> */}
              <li>
                <a
                  href="/influencer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onGoToInfluencer) onGoToInfluencer();
                    else {
                      window.history.pushState(null, '', '/influencer');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="hover:text-[#A44101] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Creator &amp; Influencer Collab</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-pink-600 text-white px-1.5 py-0.5 rounded leading-none">
                    Collab
                  </span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span>© 2026 Apna Bharat Bazaar. Think Shopping, Think Us. Built with</span>
            <Heart className="w-3.5 h-3.5 text-[#A44101] inline fill-current" />
            <span>for Indian Shoppers.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
