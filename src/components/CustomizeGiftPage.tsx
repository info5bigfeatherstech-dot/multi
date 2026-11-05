import React, { useState } from 'react';
import {
  Gift,
  Building2,
  MapPin,
  User,
  Send,
  CheckCircle2,
  Sparkles,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Mail,
  Palette,
  PackageCheck,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { giftEnquiriesApi } from '../api/giftEnquiriesApi';
import { mockAdminStore } from '../features/admin/mockAdminStore';

interface CustomizeGiftPageProps {
  onBackToHome: () => void;
  onGoToCategory?: (categoryId: string) => void;
}

const CORPORATE_GIFT_PHONE = '9320001717';

const OCCASIONS = [
  'Diwali & Festive Gifting',
  'Corporate Summit & Annual Day',
  'Employee Onboarding & Welcome Kit',
  'Client Appreciation & Relationship',
  'Wedding & Reception Return Gifts',
  'Executive Milestone & Farewell',
  'Exhibition & Promotional Swag',
  'Other Special Occasion',
];

const GIFT_CATEGORIES = [
  'Smart Electronics & Audio Gadgets',
  'Executive Desk Sets & Leatherette Notebooks',
  'Premium Drinkware, Bottles & Mugs',
  'Home & Kitchen Luxury Appliances',
  'Eco-Friendly & Sustainable Bamboo Kits',
  'Dry Fruits, Snacks & Gourmet Hampers',
  'Customized Branded Apparel & Bags',
  'Custom Mix & Match Gift Box',
];

interface SubmittedCustomGift {
  id: string;
  name: string;
  phone: string;
  email?: string;
  organizationName?: string;
  city: string;
  occasion: string;
  giftCategory: string;
  quantity: number;
  targetDeliveryDate?: string;
  message?: string;
  logoCount: number;
  photoCount: number;
  submittedAt: string;
  alreadyRegistered?: boolean;
}

export const CustomizeGiftPage: React.FC<CustomizeGiftPageProps> = ({ onBackToHome, onGoToCategory: _onGoToCategory }) => {
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [giftCategory, setGiftCategory] = useState(GIFT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState<string>('50');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [message, setMessage] = useState('');

  // Files State
  // Custom: logos (max 3, image/pdf), referencePhotos (max 6, image only)
  const [logos, setLogos] = useState<File[]>([]);
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);

  // UI State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedCustomGift | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddLogos = (files: FileList | null) => {
    if (!files) return;
    const current = [...logos];
    for (let i = 0; i < files.length; i++) {
      if (current.length >= 3) {
        toast.error('Maximum 3 logo files allowed');
        break;
      }
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 20MB limit`);
        continue;
      }
      current.push(file);
    }
    setLogos(current);
  };

  const handleRemoveLogo = (index: number) => {
    setLogos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    const current = [...referencePhotos];
    for (let i = 0; i < files.length; i++) {
      if (current.length >= 6) {
        toast.error('Maximum 6 reference photos allowed');
        break;
      }
      const file = files[i];
      // referencePhotos MUST be image only (PDF -> 400 per spec)
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image. Reference photos must be image files only.`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 20MB limit`);
        continue;
      }
      current.push(file);
    }
    setReferencePhotos(current);
  };

  const handleRemovePhoto = (index: number) => {
    setReferencePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) {
      errs.name = 'Contact Person Name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Please enter a valid full name';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Mobile / WhatsApp number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!city.trim()) {
      errs.city = 'City is required for delivery planning';
    }

    if (!occasion.trim()) {
      errs.occasion = 'Occasion is required';
    }

    if (!giftCategory.trim()) {
      errs.giftCategory = 'Gift Category is required';
    }

    const qNum = Number(quantity);
    if (!quantity || isNaN(qNum) || qNum < 1 || qNum > 100000) {
      errs.quantity = 'Please enter a valid quantity between 1 and 1,00,000 units';
    }

    if (message.trim() && message.trim().length < 10) {
      errs.message = 'Branding instructions should be at least 10 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    try {
      // Build FormData for C1 (enquiryType=custom):
      // Shared: enquiryType, name, phone, email?, organizationName?, city
      // Custom: occasion, giftCategory, quantity, targetDeliveryDate?, message?
      // Files: logos (max 3), referencePhotos (max 6)
      const formData = new FormData();
      formData.append('enquiryType', 'custom');
      formData.append('name', name.trim());
      formData.append('phone', cleanPhone);
      formData.append('city', city.trim());
      formData.append('occasion', occasion);
      formData.append('giftCategory', giftCategory);
      formData.append('quantity', String(Number(quantity)));

      if (email.trim()) formData.append('email', email.trim());
      if (organizationName.trim()) formData.append('organizationName', organizationName.trim());
      if (targetDeliveryDate) formData.append('targetDeliveryDate', targetDeliveryDate);

      const customMsg = message.trim()
        ? message.trim()
        : `Custom gifting request: ${giftCategory} for ${occasion} (Qty: ${quantity}).`;
      if (customMsg.length >= 10) {
        formData.append('message', customMsg);
      }

      // Append files
      logos.forEach((file) => {
        formData.append('logos', file);
      });

      referencePhotos.forEach((file) => {
        formData.append('referencePhotos', file);
      });

      const response = await giftEnquiriesApi.submitEnquiry(formData, 'ecomm');

      const isAlready = response.alreadyRegistered === true;
      const enquiryId = response.data?.id || `ABB-GIFT-${Math.floor(10000 + Math.random() * 90000)}`;
      const submittedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isAlready) {
        toast('We already have your active custom gifting enquiry. Our corporate team is reviewing it!', {
          icon: 'ℹ️',
          duration: 4500,
        });
      } else {
        toast.success(response.message || 'Custom gift inquiry submitted successfully!');
      }

      const submitted: SubmittedCustomGift = {
        id: enquiryId,
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        organizationName: organizationName.trim() || undefined,
        city: city.trim(),
        occasion,
        giftCategory,
        quantity: Number(quantity),
        targetDeliveryDate: targetDeliveryDate || undefined,
        message: message.trim() || undefined,
        logoCount: logos.length,
        photoCount: referencePhotos.length,
        submittedAt,
        alreadyRegistered: isAlready,
      };

      // Also register to mockAdminStore for local leads view
      try {
        mockAdminStore.addLead({
          id: `lead-gift-${Date.now()}`,
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim() || `${cleanPhone}@giftings.in`,
          interestCategory: `Custom Gift: ${giftCategory} (${occasion}, Qty: ${quantity})`,
          source: 'Bulk Inquiry',
          businessName: organizationName.trim() || undefined,
          location: city.trim(),
          inquiryDetails: `${customMsg} Target Date: ${targetDeliveryDate || 'Flexible'}`,
          status: 'New',
        });
      } catch (err) {
        console.warn('Could not save custom gift lead to mockAdminStore', err);
      }

      setSubmittedData(submitted);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to submit custom gift enquiry:', err);
      toast.error(err.message || 'Failed to submit enquiry. Please try again or WhatsApp our team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setOrganizationName('');
    setCity('');
    setOccasion(OCCASIONS[0]);
    setGiftCategory(GIFT_CATEGORIES[0]);
    setQuantity('50');
    setTargetDeliveryDate('');
    setMessage('');
    setLogos([]);
    setReferencePhotos([]);
    setErrors({});
    setSubmittedData(null);
  };

  const handleCopyDetails = () => {
    if (!submittedData) return;
    const text = `Apna Bharat Bazaar Custom Gifting Enquiry #${submittedData.id}
Client Name: ${submittedData.name}
Organization: ${submittedData.organizationName || 'N/A'}
Phone: ${submittedData.phone}
City: ${submittedData.city}
Occasion: ${submittedData.occasion}
Gift Category: ${submittedData.giftCategory}
Quantity: ${submittedData.quantity} Units
Target Date: ${submittedData.targetDeliveryDate || 'Flexible'}
${submittedData.message ? `Branding Notes: ${submittedData.message}` : ''}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getWhatsAppUrl = () => {
    let msg = '';
    if (submittedData) {
      msg = `Hello Corporate Gifting Team! I have submitted a Custom Gifting Enquiry (#${submittedData.id}).\n\nName: ${submittedData.name}\nCompany: ${submittedData.organizationName || 'Personal / Event'}\nOccasion: ${submittedData.occasion}\nItem: ${submittedData.giftCategory}\nQuantity: ${submittedData.quantity} pcs\nCity: ${submittedData.city}\nTarget Date: ${submittedData.targetDeliveryDate || 'Flexible'}\n\nPlease share mockups, catalog samples, and wholesale rates. Thank you!`;
    } else {
      msg = `Hello Corporate Gifting Team! I am looking for custom logo-printed gifts & bulk hampers. Please share your corporate gift catalog and customization pricing.`;
    }
    return `https://wa.me/91${CORPORATE_GIFT_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="bg-slate-50 min-h-screen text-charcoal pb-16">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-navy via-[#132d56] to-navy text-white relative overflow-hidden py-10 sm:py-14 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-[#A44101]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-4">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#fca369] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-xs">
              <Gift className="w-3.5 h-3.5 text-[#fca369]" />
              <span>Corporate Gifting &amp; Custom Branding</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-4xl font-medium tracking-tight text-white leading-tight">
              Personalized Corporate &amp; Bulk Gifting
            </h1>

            <p className="mt-4 text-sm sm:text-sm text-slate-200 leading-relaxed font-normal">
              Elevate your employee appreciation, festive gifting, and client celebrations with high-quality custom branded gift sets. From company logo engravings to bespoke gift boxes, we handle design, packaging, and pan-India doorstep delivery.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-amber-200 font-semibold">
                <Palette className="w-4 h-4 text-amber-300" />
                <span>Custom Logo Printing &amp; Engraving</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-amber-200 font-semibold">
                <PackageCheck className="w-4 h-4 text-amber-300" />
                <span>Luxury Packaging &amp; Fast Pan-India Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Form / Success Card + Right Trust Panel */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (7 cols): Success View or Form */}
          <div className="lg:col-span-7">
            {submittedData ? (
              /* Success Confirmation Card */
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-200 relative overflow-hidden animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center mb-5 mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="text-center max-w-xl mx-auto">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 mb-2">
                    Enquiry Reference: #{submittedData.id}
                  </span>

                  <h2 className="text-xl sm:text-2xl font-black text-navy leading-snug">
                    Thank you! Our Corporate Gifting Specialists are on it
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600">
                    We will review your branding requirements, prepare digital mockup samples, and share a custom quotation within 2 to 4 business hours.
                  </p>
                </div>

                {/* Submitted Summary */}
                <div className="mt-6 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200 text-xs sm:text-sm space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-navy">
                    <span>Gifting Enquiry Summary</span>
                    <span className="text-slate-400 font-normal text-xs">{submittedData.submittedAt}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Contact Person</span>
                      <span className="font-bold text-navy">{submittedData.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Company / Organization</span>
                      <span className="font-medium">{submittedData.organizationName || 'Personal / Private'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Phone / WhatsApp</span>
                      <span className="font-bold text-[#A44101]">{submittedData.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Delivery City</span>
                      <span className="font-medium">{submittedData.city}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Occasion</span>
                      <span className="font-medium text-navy">{submittedData.occasion}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Gift Item</span>
                      <span className="font-medium text-navy">{submittedData.giftCategory}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Estimated Quantity</span>
                      <span className="font-bold text-emerald-700">{submittedData.quantity} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Target Delivery Date</span>
                      <span className="font-medium">{submittedData.targetDeliveryDate || 'Flexible'}</span>
                    </div>
                  </div>

                  {(submittedData.logoCount > 0 || submittedData.photoCount > 0) && (
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                      Uploaded: <span className="font-semibold text-navy">{submittedData.logoCount} brand logo(s)</span>,{' '}
                      <span className="font-semibold text-navy">{submittedData.photoCount} reference photo(s)</span>.
                    </div>
                  )}

                  {submittedData.message && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 text-[11px] block uppercase font-semibold">Branding Instructions</span>
                      <p className="text-slate-700 text-xs mt-0.5 italic">{submittedData.message}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Discuss on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyDetails}
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
              /* Custom Gifting Form */
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200/90 relative">
                <div className="border-b border-slate-100 pb-5 mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-[#A44101] text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Gifting Request</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                    Tell Us About Your Gifting Needs
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Share your requirements, branding details, and target dates. We offer free digital previews and subsidized bulk corporate rates.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                        Contact Person Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                          }}
                          placeholder="e.g. Priya Sharma"
                          className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border transition-all outline-hidden ${
                            errors.name ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                          }`}
                          required
                        />
                      </div>
                      {errors.name && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                        Phone / WhatsApp <span className="text-rose-500">*</span>
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
                          className={`w-full pl-3 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-r-xl border transition-all outline-hidden ${
                            errors.phone ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                          }`}
                          required
                        />
                      </div>
                      {errors.phone && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Organization & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-navy">
                          Company / Organization
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="e.g. Infosys / Tech Corp"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-navy">
                          Email Address
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          placeholder="priya@company.com"
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden"
                        />
                      </div>
                      {errors.email && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Occasion & Gift Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                        Occasion <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden cursor-pointer"
                      >
                        {OCCASIONS.map((occ) => (
                          <option key={occ} value={occ}>
                            {occ}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                        Gift Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={giftCategory}
                        onChange={(e) => setGiftCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden cursor-pointer"
                      >
                        {GIFT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity, City & Target Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                        Quantity (Pcs) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100000}
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);
                          if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                        }}
                        placeholder="e.g. 50"
                        className={`w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border transition-all outline-hidden ${
                          errors.quantity ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                        }`}
                        required
                      />
                      {errors.quantity && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.quantity}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-navy mb-1.5">
                        Destination City <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                          }}
                          placeholder="e.g. Bengaluru"
                          className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border transition-all outline-hidden ${
                            errors.city ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-[#A44101]'
                          }`}
                          required
                        />
                      </div>
                      {errors.city && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-navy">
                          Delivery Date
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                      </div>
                      <div className="relative">
                        <input
                          type="date"
                          value={targetDeliveryDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setTargetDeliveryDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Logos Upload (Max 3, Image/PDF) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-navy">
                        Brand Logos / Artwork (Max 3)
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">PNG, SVG, PDF (Max 20MB)</span>
                    </div>

                    <div className="space-y-2">
                      {logos.map((file, idx) => (
                        <div
                          key={`logo-${idx}`}
                          className="flex items-center justify-between p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-navy"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-[#A44101] shrink-0" />
                            <span className="truncate font-semibold">{file.name}</span>
                            <span className="text-slate-400 text-[11px]">({(file.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo(idx)}
                            className="p-1 hover:bg-amber-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {logos.length < 3 && (
                        <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100/80 border border-dashed border-slate-300 hover:border-[#A44101] rounded-xl cursor-pointer text-xs text-slate-600 transition-all">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span>Attach Company Logo / Artwork ({logos.length}/3)</span>
                          <input
                            type="file"
                            accept="image/*,.pdf,.svg"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAddLogos(e.target.files)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Reference Photos Upload (Max 6, Image only) */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-navy">
                        Reference Photos / Sample Ideas (Max 6)
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Images only (JPG/PNG/WEBP)</span>
                    </div>

                    <div className="space-y-2">
                      {referencePhotos.map((file, idx) => (
                        <div
                          key={`photo-${idx}`}
                          className="flex items-center justify-between p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl text-xs text-navy"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" />
                            <span className="truncate font-semibold">{file.name}</span>
                            <span className="text-slate-400 text-[11px]">({(file.size / 1024).toFixed(0)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1 hover:bg-sky-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {referencePhotos.length < 6 && (
                        <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100/80 border border-dashed border-slate-300 hover:border-sky-500 rounded-xl cursor-pointer text-xs text-slate-600 transition-all">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                          <span>Upload Sample / Packaging Photos ({referencePhotos.length}/6)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAddPhotos(e.target.files)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Message / Custom Requirements */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Customization Notes &amp; Packaging Preferences (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (errors.message) setErrors((prev) => ({ ...prev, message: '' }));
                      }}
                      placeholder="e.g. Need gold foil company logo on box, individual employee name printing on water bottle, delivery needed in 3 corporate branch offices..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white text-charcoal text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#A44101] transition-all outline-hidden resize-none"
                    />
                    {errors.message && <p className="text-rose-600 text-[11px] font-semibold mt-1">{errors.message}</p>}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-[#A44101] via-[#c75507] to-[#A44101] hover:brightness-110 active:scale-[0.99] transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Submitting Custom Gifting Request...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Request Custom Gifting Quote</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-slate-400 mt-2">
                    🔒 Strict B2B confidentiality. Artwork &amp; company logos are never shared externally.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Trust, Why Choose Us, Contact Direct */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-5 border border-amber-200 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#A44101] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm sm:text-base">
                    End-to-End Corporate Gifting
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    We take care of procurement, mockups, UV / Laser printing, gift card messages, bespoke packaging boxes, and direct multi-address courier fulfillment.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-navy text-sm sm:text-base border-b border-slate-100 pb-3">
                Why Corporate Brands Partner With Us
              </h3>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-navy block">Factory Wholesale Rates</span>
                  Save 40%–70% compared to local gifting vendors by procuring direct from manufacturers.
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-navy block">Fast 24–48hr Turnaround</span>
                  Rapid sample mockups and express production runs for urgent corporate deadlines.
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-navy block">Dedicated Gifting Manager</span>
                  Single point of contact from sample design approval through pan-India delivery tracking.
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
              <h4 className="font-bold text-navy text-sm sm:text-base">
                Have Urgent Delivery or Custom Hamper Needs?
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Chat directly with our senior corporate gifting coordinator on WhatsApp.
              </p>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#20ba5a] text-white transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp (+91 {CORPORATE_GIFT_PHONE})</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
