import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Instagram, 
  Users, 
  ArrowLeft,
  Loader2 
} from 'lucide-react';
import { influencerApi, InfluencerFormData } from '../api';
import toast from 'react-hot-toast';

interface InfluencerPageProps {
  onBackToStore?: () => void;
}

const NICHES = [
  'Tech',
  'Fashion',
  'Beauty',
  'Fitness',
  'Lifestyle',
  'Gaming',
  'Food',
  'Travel',
  'Comedy',
  'Education',
  'Other',
];

export const InfluencerPage: React.FC<InfluencerPageProps> = ({ onBackToStore }) => {
  const [formData, setFormData] = useState<InfluencerFormData>({
    fullname: '',
    contact: '',
    sociallink: '',
    followers: '',
    niche: 'Lifestyle',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullname.trim()) errs.fullname = 'Full name is required';
    if (!formData.contact.trim()) errs.contact = 'Email or 10-digit phone is required';
    if (!formData.sociallink.trim()) {
      errs.sociallink = 'Channel or profile link is required';
    } else if (!/^https?:\/\//i.test(formData.sociallink.trim())) {
      errs.sociallink = 'Please enter a valid URL (e.g. https://instagram.com/yourhandle)';
    }
    if (!formData.followers || Number(formData.followers) <= 0) {
      errs.followers = 'Follower/subscriber count is required';
    }
    if (!formData.niche) errs.niche = 'Please select a content niche';
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Please provide a proposal pitch (min. 10 characters)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields properly');
      return;
    }

    setIsSubmitting(true);
    try {
      await influencerApi.submitCollaboration(formData);
      setIsSuccess(true);
      toast.success('Your collaboration proposal was submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullname: '',
      contact: '',
      sociallink: '',
      followers: '',
      niche: 'Lifestyle',
      message: '',
    });
    setIsSuccess(false);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-roboto antialiased selection:bg-[#A44101] selection:text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back navigation */}
        {onBackToStore && (
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#A44101] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </button>
        )}

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-navy via-slate-900 to-[#A44101] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-orange-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#F7A221]" />
              <span>Creator Partnership Program</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Collaborate With Apna Bharat Bazaar
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
              Are you an Instagram creator, YouTuber, or digital influencer? Partner with India's fastest-growing online shopping bazaar for exclusive product samples, high affiliate commissions, and brand sponsorships.
            </p>
          </div>
          {/* Subtle background glow */}
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-black text-navy">Application Received!</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-navy">{formData.fullname}</strong>. Our creator partnerships team will review your channel and contact you within 24–48 business hours via your email/phone.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Submit Another Proposal
                </button>
                {onBackToStore && (
                  <button
                    type="button"
                    onClick={onBackToStore}
                    className="px-6 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Return to Store
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-navy">Influencer Collaboration Form</h2>
                <p className="text-xs text-slate-500">
                  Please share your channel details and collaboration pitch below.
                </p>
              </div>

              {/* 1. Full Legal or Stage Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name / Creator Handle <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  placeholder="e.g. Rahul Sharma / @rahulvlogs"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
                />
                {errors.fullname && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.fullname}
                  </p>
                )}
              </div>

              {/* 2. Contact Information */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address or 10-Digit Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="creator@example.com or 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
                />
                {errors.contact && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.contact}
                  </p>
                )}
              </div>

              {/* 3. Social Media Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Social Channel Link (Instagram / YouTube) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="sociallink"
                    value={formData.sociallink}
                    onChange={(e) => setFormData({ ...formData, sociallink: e.target.value })}
                    placeholder="https://instagram.com/yourhandle or https://youtube.com/@channel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center gap-1 pointer-events-none">
                    <Instagram className="w-4 h-4 text-pink-600" />
                  </div>
                </div>
                {errors.sociallink && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.sociallink}
                  </p>
                )}
              </div>

              {/* 4. Followers & 5. Niche */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Followers / Subscribers <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="followers"
                      min="0"
                      value={formData.followers}
                      onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                      placeholder="e.g. 50000"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all font-mono"
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.followers && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.followers}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Content Niche <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="niche"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
                  >
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {errors.niche && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.niche}
                    </p>
                  )}
                </div>
              </div>

              {/* 6. Message / Pitch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Collaboration Proposal / Pitch <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your audience demographics, past brand campaigns, and the collaboration ideas you'd love to execute with Apna Bharat Bazaar..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none transition-all"
                />
                {errors.message && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.message}
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#A44101] hover:bg-[#8C3701] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Collaboration Pitch...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Collaboration Pitch</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
