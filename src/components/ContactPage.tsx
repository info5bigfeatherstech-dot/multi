import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  ChevronDown, 
  Package, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { mockAdminStore } from '../features/admin/mockAdminStore';

interface ContactPageProps {
  onBackToHome: () => void;
  onGoToOrders?: () => void;
}

interface SupportTicket {
  ticketId: string;
  name: string;
  phone: string;
  email: string;
  orderNumber: string;
  category: string;
  message: string;
  submittedAt: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBackToHome }) => {
  // Contact Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [category, setCategory] = useState('Order Tracking & Delay');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  // FAQ Accordion Active Index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const randomTicketNum = Math.floor(10000 + Math.random() * 90000);
      const ticket: SupportTicket = {
        ticketId: `ABB-TK-${randomTicketNum}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || 'N/A',
        orderNumber: orderNumber.trim() || 'N/A',
        category,
        message: message.trim(),
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSubmittedTicket(ticket);
      setIsSubmitting(false);

      // Save to localStorage as a customer lead/ticket so admin panel can see it too!
      try {
        const storedLeads = mockAdminStore.getLeads();
        storedLeads.unshift({
          id: `lead-${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || `${phone.replace(/\D/g, '')}@customer.in`,
          interestCategory: category,
          source: 'Support Form',
          createdAt: new Date().toISOString(),
          status: 'New'
        });
        localStorage.setItem('abb_admin_leads_v1', JSON.stringify(storedLeads));
      } catch (err) {
        console.warn('Could not save lead to mockAdminStore', err);
      }
    }, 600);
  };

  const faqs = [
    {
      q: 'How can I track my shipment and delivery status?',
      a: 'Once your order is processed, a live tracking link with Delhivery or Bluedart tracking number is sent directly to your registered WhatsApp number and SMS. You can also reach our customer care desk anytime for live tracking assistance.'
    },
    {
      q: 'What is your 7-Day Easy Replacement Guarantee?',
      a: 'If your product arrives damaged, defective, or missing any parts, send us a short photo/video on WhatsApp (+91 93200 01717) within 7 days of delivery. Our team will verify and dispatch a brand-new replacement at zero extra cost.'
    },
    {
      q: 'Can I pay using Cash On Delivery (COD)?',
      a: 'Yes! We offer 100% verified Cash on Delivery across 24,000+ pin codes in India with no pre-payment required. You only pay when the courier delivery executive hands you the parcel.'
    },
    {
      q: 'How long does shipping take to my location?',
      a: 'Metro cities (Mumbai, Delhi NCR, Bengaluru, Chennai, Pune, Hyderabad, Kolkata) are typically delivered in 2-3 business days. Tier-2 and Tier-3 cities receive delivery within 4-5 business days.'
    },
    {
      q: 'How do I place bulk inquiries or custom festive corporate orders?',
      a: 'For bulk purchases above ₹10,000 or custom festival gifting, reach our dedicated B2B desk directly on WhatsApp at +91 93200 01717 for manufacturer-direct discounts and invoice GST credits.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-charcoal font-roboto antialiased pb-20">
      
      {/* 1. Breadcrumbs & Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-navy font-medium transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-navy font-bold">Customer Support &amp; Help Desk</span>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-navy transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Header Banner */}
      <section className="bg-gradient-to-b from-navy via-[#0f2137] to-navy text-white py-14 sm:py-20 relative overflow-hidden">
        {/* Decorative background glow accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A44101]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ffb088] text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#ff8c42]" />
            <span>Namaste 🙏 We&apos;re Here 24/7 For You</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            How Can We Help <span className="text-[#ff8c42]">You Today?</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Have questions about an existing order, shipping timeline, easy replacement, or bulk orders? 
            Reach our Mumbai &amp; Pan-India customer care team through direct WhatsApp, phone, or instant ticket.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Clock className="w-3.5 h-3.5 text-[#ff8c42]" />
              <span>Avg. Response Time: <strong>&lt; 5 Mins</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Genuine Assistance</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-10">

        {/* 3. Direct Contact Channels Strip (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: WhatsApp */}
          <a
            href="https://wa.me/919320001717?text=Namaste!%20I%20need%20assistance%20with%20my%20Apna%20Bharat%20Bazaar%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3.5 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Fastest Response
              </span>
              <h3 className="text-base font-black text-navy mt-2">
                WhatsApp Chat
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect instantly with our support team on WhatsApp.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>+91 93200 01717</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 2: Phone */}
          <a
            href="tel:+919320001717"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 hover:border-[#A44101] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#A44101] mb-3.5 group-hover:scale-105 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Direct Helpline
              </span>
              <h3 className="text-base font-black text-navy mt-2">
                Phone Support
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Available Mon - Sun from 9:00 AM to 9:00 PM IST.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#A44101]">
              <span>+91 93200 01717</span>
              <Phone className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 3: Email */}
          <a
            href="mailto:support.apnabharatbazaar@gmail.com?subject=Support%20Inquiry%20-%20Apna%20Bharat%20Bazaar"
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200 hover:border-blue-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3.5 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Written Inquiries
              </span>
              <h3 className="text-base font-black text-navy mt-2">
                Official Email Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Detailed queries, GST invoice copy, and receipts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 truncate">
              <span className="truncate">support.apnabharatbazaar@gmail.com</span>
            </div>
          </a>

          {/* Card 4: Logistics Hub */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-3.5">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Fulfillment Hub
              </span>
              <h3 className="text-base font-black text-navy mt-2">
                Warehouse Center
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bhiwandi Logistics Center, Maharashtra - 421302
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-400">
              Pan-India Hubs: Mumbai &bull; Delhi &bull; Surat
            </div>
          </div>

        </div>

        {/* 4. Interactive Support Ticket Form */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              
              {!submittedTicket ? (
                <>
                  <div className="mb-6">
                    <span className="text-xs font-bold text-[#A44101] uppercase tracking-wider">
                      Send a Message
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-navy mt-1">
                      Submit a Support Ticket
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Our customer support manager will review your inquiry and follow up within 15 minutes.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Two col inputs: Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">
                          Full Name <span className="text-[#A44101]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">
                          WhatsApp / Phone Number <span className="text-[#A44101]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98200 12345"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Two col inputs: Email & Order ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">
                          Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">
                          Order Number <span className="text-slate-400 font-normal">(If related to an order)</span>
                        </label>
                        <input
                          type="text"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value)}
                          placeholder="e.g. ABB-2026-9041"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] focus:outline-none transition-all uppercase"
                        />
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">
                        What is this regarding? <span className="text-[#A44101]">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] focus:outline-none transition-all bg-white cursor-pointer"
                      >
                        <option value="Order Tracking & Delay">Order Delivery &amp; Tracking Delay</option>
                        <option value="Defective / Damaged Item">Defective or Damaged Item Replacement</option>
                        <option value="Cancellation & Refund">Cancellation &amp; Refund Assistance</option>
                        <option value="Bulk Order & GST Invoice">Bulk / B2B Corporate Gifting Query</option>
                        <option value="General Question">General Inquiry or Feedback</option>
                      </select>
                    </div>

                    {/* Message Box */}
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1">
                        Detailed Message / Query <span className="text-[#A44101]">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your issue, order details, or inquiry here..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] focus:outline-none transition-all resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-6 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98"
                    >
                      {isSubmitting ? (
                        <span>Submitting Ticket...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Support Request</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Ticket Success Confirmation View */
                <div className="py-6 text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Request Registered Successfully
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-navy mt-2">
                      Ticket #{submittedTicket.ticketId}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      Thank you, <strong>{submittedTicket.name}</strong>! Our Mumbai support executive will contact you via WhatsApp ({submittedTicket.phone}) shortly.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
                    <div className="flex justify-between text-slate-500">
                      <span>Category:</span>
                      <span className="font-bold text-navy">{submittedTicket.category}</span>
                    </div>
                    {submittedTicket.orderNumber !== 'N/A' && (
                      <div className="flex justify-between text-slate-500">
                        <span>Order Number:</span>
                        <span className="font-bold text-navy">{submittedTicket.orderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Submitted At:</span>
                      <span className="font-medium text-navy">{submittedTicket.submittedAt}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Submit Another Query
                    </button>
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-navy hover:bg-[#0c1a2d] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      Return to Shopping
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        {/* 5. Frequently Asked Questions (FAQ) Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#A44101]" />
              <span>Quick Answers</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find fast resolutions to the most common customer shopping inquiries.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-slate-200 overflow-hidden transition-all bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-navy flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#A44101]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Pan-India Delivery Guarantee Strip */}
        <div className="rounded-2xl bg-[#A44101]/5 border border-[#A44101]/20 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#A44101] text-white flex items-center justify-center shrink-0 shadow-md">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-navy">
                Pan-India Express Shipping &bull; 24,000+ Pin Codes
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Every order is safely packed, dispatched within 24 hours, and backed by our replacement guarantee.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/919320001717?text=Hi%20Apna%20Bharat%20Bazaar,%20I%20have%20a%20support%20question."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat With Us on WhatsApp</span>
          </a>
        </div>

      </div>

    </div>
  );
};

export default ContactPage;
