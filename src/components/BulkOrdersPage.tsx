import React, { useState } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  User,
  Send,
  CheckCircle2,
  Truck,
  ShieldCheck,
  FileText,
  BadgePercent,
  Clock,
  Sparkles,
  MessageSquare,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import { mockAdminStore } from '../features/admin/mockAdminStore';

interface BulkOrdersPageProps {
  onBackToHome: () => void;
  onGoToCategory?: (categoryId: string) => void;
}

const WHOLESALE_PHONE = '9320001717';

interface SubmittedInquiry {
  inquiryId: string;
  fullName: string;
  businessName: string;
  phone: string;
  cityState: string;
  submittedAt: string;
  estimatedOrderValue?: string;
  categoryInterest?: string;
  notes?: string;
}

export const BulkOrdersPage: React.FC<BulkOrdersPageProps> = ({ onBackToHome, onGoToCategory }) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [cityState, setCityState] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('₹3,000 - ₹10,000');
  const [categoryInterest, setCategoryInterest] = useState('Multiple / General Store');
  const [notes, setNotes] = useState('');

  // UI & Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<SubmittedInquiry | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full Name is required';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Please enter a valid full name';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Mobile / WhatsApp number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!cityState.trim()) {
      errs.cityState = 'City & State is required';
    } else if (cityState.trim().length < 3) {
      errs.cityState = 'Please enter your city and state';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const inquiryId = `ABB-BULK-${randomNum}`;
      const submittedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const inquiryData: SubmittedInquiry = {
        inquiryId,
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        cityState: cityState.trim(),
        submittedAt,
        estimatedOrderValue: estimatedValue,
        categoryInterest,
        notes: notes.trim(),
      };

      // Save to mockAdminStore as a Lead with 'Bulk Inquiry' source so Admin panel can view and follow up
      try {
        mockAdminStore.addLead({
          id: `lead-bulk-${Date.now()}`,
          name: fullName.trim(),
          phone: phone.trim(),
          email: `${phone.replace(/\D/g, '')}@wholesale.in`,
          interestCategory: `Bulk Inquiry: ${categoryInterest} (Value: ${estimatedValue})`,
          source: 'Bulk Inquiry',
          businessName: businessName.trim() || undefined,
          location: cityState.trim(),
          inquiryDetails: notes.trim() || undefined,
          status: 'New',
        });
      } catch (err) {
        console.warn('Could not save bulk inquiry to mockAdminStore', err);
      }

      setSubmittedInquiry(inquiryData);
      setIsSubmitting(false);

      // Scroll to top of the page smoothly so customer sees the success confirmation immediately
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  const handleResetForm = () => {
    setFullName('');
    setBusinessName('');
    setPhone('');
    setCityState('');
    setNotes('');
    setErrors({});
    setSubmittedInquiry(null);
  };

  const handleCopyInquiryDetails = () => {
    if (!submittedInquiry) return;
    const text = `Apna Bharat Bazaar Wholesale Inquiry #${submittedInquiry.inquiryId}
Full Name: ${submittedInquiry.fullName}
Business / Shop Name: ${submittedInquiry.businessName || 'N/A'}
Mobile / WhatsApp: ${submittedInquiry.phone}
City & State: ${submittedInquiry.cityState}
Estimated Order: ${submittedInquiry.estimatedOrderValue}
Category Interest: ${submittedInquiry.categoryInterest}
${submittedInquiry.notes ? `Requirements: ${submittedInquiry.notes}` : ''}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getWhatsAppMessageUrl = (inquiry?: SubmittedInquiry) => {
    let msg = '';
    if (inquiry) {
      msg = `Hello Apna Bharat Bazaar Team, I have submitted a Bulk Wholesale Inquiry (ID: ${inquiry.inquiryId}).\n\nName: ${inquiry.fullName}\nShop/Business: ${inquiry.businessName || 'Individual / Reseller'}\nLocation: ${inquiry.cityState}\nEstimated Order: ${inquiry.estimatedOrderValue}\nCategory: ${inquiry.categoryInterest}\n\nPlease share your wholesale catalog and product pricing. Thank you!`;
    } else {
      msg = `Hello Apna Bharat Bazaar Team, I am interested in placing a bulk wholesale order (Min. ₹3,000). Please share your product catalog and wholesale discount price list.`;
    }
    return `https://wa.me/91${WHOLESALE_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  const faqs = [
    {
      q: 'What is the minimum bulk order value?',
      a: 'The minimum order value for wholesale pricing is ₹3,000. You can mix and match different product categories in a single bulk order to reach this minimum value.',
    },
    {
      q: 'Can I order products from multiple categories together?',
      a: 'Yes, absolutely! You can combine Home & Kitchen, Smart Gadgets, Stationery, Baby Essentials, Cleaning Supplies, and more in one bulk order.',
    },
    {
      q: 'Do you provide genuine GST tax invoices for businesses?',
      a: 'Yes, we provide GST invoices for eligible business orders.',
    },
    {
      q: 'How fast will my bulk inquiry be processed?',
      a: 'Our wholesale accounts team will review your inquiry and contact you via WhatsApp / phone call within 2 to 4 business hours to share catalogs and pricing.',
    },
    {
      q: 'What are the delivery timelines and shipping charges for bulk orders?',
      a: 'We ship pan-India through top logistics partners and transport services. Standard delivery takes 3 to 5 business days depending on your location. Subsidized freight rates apply on bulk volumes.',
    },
    {
      q: 'What payment options are available for bulk & wholesale orders?',
      a: 'We accept instant UPI, IMPS / NEFT / RTGS bank transfers, and verified corporate payment gateways. Partial advance terms can also be arranged with your account manager.',
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-charcoal pb-16">

      {/* 2. Hero Section */}
      <section className="bg-gradient-to-br from-navy via-[#0d2242] to-navy text-white relative overflow-hidden py-10 sm:py-14 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-[#A44101]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#fca369] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#fca369]" />
              <span>B2B &amp; Direct Wholesale Portal</span>
            </div>

            {/* Main Header Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-4xl font-medium tracking-tight text-white leading-tight">
              Bulk Orders &amp; Wholesale Enquiries
            </h1>

            {/* Intro text exactly per user prompt */}
            <p className="mt-4 text-sm sm:text-sm text-slate-200 leading-relaxed font-normal">
              Looking to purchase products in bulk for your shop, business, or resale? Apna Bharat Bazaar offers a wide range of products at competitive wholesale prices.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Submit your bulk inquiry, and our team will contact you to discuss product availability, wholesale pricing, and order details.
            </p>

            {/* Minimum Bulk Order Value: ₹3,000 Highlight Card */}
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 bg-gradient-to-r from-[#A44101] to-[#c75507] text-white px-5 py-3 rounded-2xl shadow-lg border border-amber-400/30">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <BadgePercent className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-medium text-amber-100">
                  Exclusive B2B Starting Tier
                </div>
                <div className="text-lg sm:text-xl font-medium tracking-tight">
                  Minimum Bulk Order Value: ₹3,000
                </div>
              </div>
              <span className="hidden md:inline-block ml-3 px-2.5 py-1 bg-black/20 rounded-full text-[11px] font-semibold text-amber-100 border border-white/15">
                Mix Any Categories
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Grid: Form + Trust & Benefits */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inquiry Form / Success State (7 cols) */}
          <div className="lg:col-span-7">
            {submittedInquiry ? (
              /* Success Confirmation Card */
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-200 relative overflow-hidden animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center mb-5 mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="text-center max-w-xl mx-auto">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 mb-2">
                    Inquiry Reference: #{submittedInquiry.inquiryId}
                  </span>
                  
                  {/* Exact Success Message requested by user */}
                  <h2 className="text-xl sm:text-2xl font-black text-navy leading-snug">
                    Thank you! Our team will contact you shortly to discuss your wholesale requirements
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600">
                    Your bulk inquiry has been assigned to our senior wholesale coordinator. We typically reach out via WhatsApp / phone call within 2 to 4 business hours.
                  </p>
                </div>

                {/* Submitted Summary Box */}
                <div className="mt-6 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 text-xs sm:text-sm space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-navy">
                    <span>Inquiry Details Summary</span>
                    <span className="text-slate-400 font-normal text-xs">{submittedInquiry.submittedAt}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Contact Person</span>
                      <span className="font-bold text-navy">{submittedInquiry.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Business / Shop Name</span>
                      <span className="font-medium">{submittedInquiry.businessName || 'Individual Retailer / Reseller'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Mobile / WhatsApp</span>
                      <span className="font-bold text-[#A44101]">{submittedInquiry.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">City &amp; State</span>
                      <span className="font-medium">{submittedInquiry.cityState}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Estimated Order Value</span>
                      <span className="font-semibold text-emerald-700">{submittedInquiry.estimatedOrderValue}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Categories</span>
                      <span className="font-medium">{submittedInquiry.categoryInterest}</span>
                    </div>
                  </div>

                  {submittedInquiry.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Specific Requirements</span>
                      <p className="text-slate-700 text-xs mt-0.5 italic">{submittedInquiry.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={getWhatsAppMessageUrl(submittedInquiry)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Connect on WhatsApp Now</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyInquiryDetails}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 border border-slate-300 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 text-navy flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>Submit Another</span>
                  </button>
                </div>
              </div>
            ) : (
              /* The Main Wholesale Inquiry Form */
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/90 relative">
                <div className="border-b border-slate-100 pb-5 mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-[#A44101] text-xs font-bold uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Wholesale Application</span>
                  </div>
                  {/* Exact Section Heading requested */}
                  <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                    Send Your Bulk Inquiry
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill out the form below with your requirements. We offer factory wholesale prices starting from minimum ₹3,000.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Field 1: Full Name* (Text) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                        }}
                        placeholder="e.g. Rajesh Kumar"
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border transition-all outline-hidden focus:ring-2 focus:ring-[#A44101]/20 ${
                          errors.fullName ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                        }`}
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-rose-600 text-[11px] font-semibold mt-1 animate-fadeIn">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Field 2: Business / Shop Name (Optional) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-navy">
                        Business / Shop Name
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Kumar General Stores / Reseller"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden focus:ring-2 focus:ring-[#A44101]/20"
                      />
                    </div>
                  </div>

                  {/* Field 3: Mobile / WhatsApp Number* (Phone) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                      Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex">
                      <div className="inline-flex items-center gap-1 px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs sm:text-sm font-bold text-slate-600 shrink-0">
                        <span>🇮🇳 +91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(val);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        placeholder="98765 43210"
                        className={`w-full pl-3 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-r-xl border transition-all outline-hidden focus:ring-2 focus:ring-[#A44101]/20 ${
                          errors.phone ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                        }`}
                        required
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-rose-600 text-[11px] font-semibold mt-1 animate-fadeIn">
                        {errors.phone}
                      </p>
                    ) : (
                      <p className="text-slate-400 text-[11px] mt-1">
                        We will share wholesale product sheets &amp; rates directly to this WhatsApp number.
                      </p>
                    )}
                  </div>

                  {/* Field 4: City & State* (Text) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                      City &amp; State <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={cityState}
                        onChange={(e) => {
                          setCityState(e.target.value);
                          if (errors.cityState) setErrors((prev) => ({ ...prev, cityState: '' }));
                        }}
                        placeholder="e.g. Surat, Gujarat"
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border transition-all outline-hidden focus:ring-2 focus:ring-[#A44101]/20 ${
                          errors.cityState ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                        }`}
                        required
                      />
                    </div>
                    {errors.cityState && (
                      <p className="text-rose-600 text-[11px] font-semibold mt-1 animate-fadeIn">
                        {errors.cityState}
                      </p>
                    )}
                  </div>

                  {/* Additional Helpful Fields (Optional to assist wholesale matching) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Estimated Order Budget
                      </label>
                      <select
                        value={estimatedValue}
                        onChange={(e) => setEstimatedValue(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 text-slate-700 text-xs rounded-xl border border-slate-300 focus:border-[#A44101] outline-hidden cursor-pointer"
                      >
                        <option value="₹3,000 - ₹10,000">₹3,000 – ₹10,000 (Starter Bulk)</option>
                        <option value="₹10,000 - ₹25,000">₹10,000 – ₹25,000 (Store Stock)</option>
                        <option value="₹25,000 - ₹50,000">₹25,000 – ₹50,000 (Wholesale Lot)</option>
                        <option value="₹50,000+">₹50,000+ (Distributor Volume)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Primary Category of Interest
                      </label>
                      <select
                        value={categoryInterest}
                        onChange={(e) => setCategoryInterest(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 text-slate-700 text-xs rounded-xl border border-slate-300 focus:border-[#A44101] outline-hidden cursor-pointer"
                      >
                        <option value="Multiple / General Store">Multiple / General Store</option>
                        <option value="Home & Kitchen">Home &amp; Kitchenware</option>
                        <option value="Smart Gadgets & Electronics">Smart Gadgets &amp; Electronics</option>
                        <option value="Baby Items & Toys">Baby Items &amp; Toys</option>
                        <option value="Stationery & School">Stationery &amp; Office</option>
                        <option value="Cleaning & Housekeeping">Cleaning &amp; Housekeeping</option>
                        <option value="Gifts & Lifestyle">Gifts &amp; Lifestyle</option>
                      </select>
                    </div>
                  </div>

                  {/* Specific Product Requirement Notes (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Specific Items or Quantities (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. 50 pcs Vegetable Choppers, 25 pcs USB Night Lamps, 30 pcs Lunch Boxes..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden focus:ring-2 focus:ring-[#A44101]/20 resize-none"
                    />
                  </div>

                  {/* Submit Button: Exact text requested */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-[#A44101] via-[#c75507] to-[#A44101] hover:brightness-110 active:scale-[0.99] transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Bulk Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Bulk Inquiry</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-slate-400 mt-2">
                    🔒 Guaranteed privacy. Your business inquiry is handled with strict confidentiality.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Wholesale Benefits & Direct Assistance (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Minimum Order Value Reminder Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-5 border border-amber-200 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#A44101] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy">
                    Why Buy Wholesale with Apna Bharat Bazaar?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    We bridge the gap between Indian manufacturing hubs and retailers, giving you access to rock-bottom wholesale prices with low investment.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-amber-200/70 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Min. Order Value</div>
                  <div className="text-sm font-black text-[#A44101] mt-0.5">₹3,000 Only</div>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Profit Margin</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">Up to 40% – 60%</div>
                </div>
              </div>
            </div>

            {/* 4 Pillars of Wholesale Service */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Wholesale Merchant Privileges
              </h3>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-xs sm:text-sm">Pan-India Transport &amp; Express Delivery</h4>
                  <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                    Safe transport and courier options with door-step delivery to tier-1, tier-2, and tier-3 towns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-xs sm:text-sm">100% Genuine Invoices</h4>
                  <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                    Registered businesses can get a GST invoice and claim tax credit.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#A44101] flex items-center justify-center shrink-0 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-xs sm:text-sm">Pre-Dispatch Quality Inspection</h4>
                  <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                    Every bulk batch undergoes physical checks to ensure minimal returns and customer delight.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-xs sm:text-sm">2-Hour Rapid Response Guarantee</h4>
                  <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5">
                    Dedicated WhatsApp account manager assigned to your shop for fast restocks.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="bg-navy rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md">
                  Instant Support
                </span>
                <span className="text-xs text-slate-400">Tue – Sun (1:00 PM – 10:00 PM)</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold">Need Immediate Wholesale Quotation?</h4>
              <p className="text-xs text-slate-300 mt-1">
                Skip the wait and connect directly with our wholesale desk on WhatsApp or call our team.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={`https://wa.me/91${WHOLESALE_PHONE}?text=${encodeURIComponent('Hi Apna Bharat Bazaar, I would like to inquire about wholesale bulk orders.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Wholesale</span>
                </a>
                <a
                  href={`tel:${WHOLESALE_PHONE}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/20"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Call: {WHOLESALE_PHONE}</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 4. Wholesale Ordering Process Steps */}
      <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#A44101] uppercase tracking-wider bg-[#A44101]/10 px-3 py-1 rounded-full">
            Simple 4-Step Process
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-navy mt-2 tracking-tight">
            How Wholesale Ordering Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            From inquiry submission to doorstep delivery across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative">
            <span className="text-3xl font-black text-slate-200 absolute top-4 right-4">01</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#A44101] flex items-center justify-center font-bold mb-3">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-sm">1. Submit Inquiry</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Fill in your contact details, shop name, and minimum ₹3,000 requirement using the form above.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative">
            <span className="text-3xl font-black text-slate-200 absolute top-4 right-4">02</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-sm">2. Receive Catalog &amp; Rates</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Our coordinator contacts you via WhatsApp with latest bulk price lists and stock availability.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative">
            <span className="text-3xl font-black text-slate-200 absolute top-4 right-4">03</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-sm">3. Confirm &amp; Pay</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review proforma invoice, confirm quantities, and pay via secure bank transfer or UPI.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative">
            <span className="text-3xl font-black text-slate-200 absolute top-4 right-4">04</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-navy text-sm">4. Fast Doorstep Dispatch</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Packed safely and dispatched via insured courier or road transport with live tracking updates.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions (FAQ) */}
      <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <span className="text-xs font-bold text-[#A44101] uppercase tracking-wider bg-[#A44101]/10 px-3 py-1 rounded-full">
              Got Questions?
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-navy mt-2 tracking-tight">
              Frequently Asked Questions About Wholesale
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-navy">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#A44101]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 py-3.5 text-xs sm:text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed animate-fadeIn">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Bottom Banner / CTA */}
      <section className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-gradient-to-r from-navy via-navy to-[#1a365d] rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-slate-700">
          <div>
            <h3 className="text-lg sm:text-xl font-black">
              Ready to stock high-demand products at wholesale rates?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Join thousands of shopkeepers, e-commerce sellers, and community resellers across India.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="flex-1 md:flex-none py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-[#A44101] hover:bg-[#c75507] text-white transition-colors cursor-pointer"
            >
              Fill Inquiry Form
            </button>
            {onGoToCategory && (
              <button
                type="button"
                onClick={() => onGoToCategory('home-kitchen')}
                className="flex-1 md:flex-none py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer"
              >
                Browse Products
              </button>
            )}
            <button
              type="button"
              onClick={onBackToHome}
              className="flex-1 md:flex-none py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer"
            >
              Back to Store
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
