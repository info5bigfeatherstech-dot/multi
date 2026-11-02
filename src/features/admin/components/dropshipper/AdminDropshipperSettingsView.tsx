import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  ShieldCheck,
  Save,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchAdminDropshipperSettings,
  updateAdminDropshipperSettings,
} from '../../../../store/adminDropshipperSlice';
import toast from 'react-hot-toast';

export const AdminDropshipperSettingsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, settingsLoading, actionLoading } = useAppSelector(
    (state) => state.adminDropshipper
  );

  const [amount, setAmount] = useState<number>(800);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    dispatch(fetchAdminDropshipperSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setAmount(settings.subscriptionAmountInr ?? 800);
      setIsOpen(settings.registrationOpen ?? true);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1) {
      toast.error('Subscription fee must be at least ₹1');
      return;
    }

    try {
      await dispatch(
        updateAdminDropshipperSettings({
          subscriptionAmountInr: Number(amount),
          registrationOpen: Boolean(isOpen),
        })
      ).unwrap();
      toast.success('Dropshipper configuration updated successfully!');
    } catch (err: any) {
      toast.error(err || 'Failed to update settings');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-navy">Dropshipper Channel Settings</h2>
        <p className="text-xs text-slate-500 capitalize">
          Configure annual membership fee, registration intake availability, and partner onboarding rules.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
        {settingsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
            <span className="text-xs font-bold">Loading channel settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Setting 1: Registration Open / Paused Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-navy">
                  Partner Registration Gate
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  When paused, the public landing page informs visitors that applications are temporarily closed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isOpen ? 'bg-[#A44101]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isOpen}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isOpen ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Setting 2: Subscription Fee */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Annual Dropshipper Subscription Fee (INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-black text-navy focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 focus:outline-none"
                />
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500">
                Minimum ₹1. Default is ₹800 for 1-year dropshipper wholesale portal access.
              </p>
            </div>

            {/* Information preview */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-navy">
                <ShieldCheck className="w-4 h-4 text-[#A44101]" />
                <span>Live Plan Ingestion Summary</span>
              </div>
              <p>
                Public Landing &amp; Registration APIs will immediately present: <strong>₹{amount}</strong> for a <strong>1-Year</strong> window.
              </p>
              <p>
                Status:{' '}
                <strong className={isOpen ? 'text-emerald-700' : 'text-amber-700'}>
                  {isOpen ? 'Open for Registrations' : 'Registrations Paused'}
                </strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="py-2.5 px-6 bg-[#A44101] hover:bg-[#8C3701] disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
