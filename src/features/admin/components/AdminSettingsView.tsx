import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Database
} from 'lucide-react';
import { mockAdminStore } from '../mockAdminStore';

export const AdminSettingsView: React.FC = () => {
  const [storeName, setStoreName] = useState('Apna Bharat Bazaar');
  const [supportPhone, setSupportPhone] = useState('+91 93200 01717');
  const [supportEmail, setSupportEmail] = useState('support.apnabharatbazaar@gmail.com');
  const [deliveryTime, setDeliveryTime] = useState('2-5 Business Days Pan India');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('Settings updated and stored in localStorage! ✓');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all mock orders, products, carts, and gift intents back to initial demo seeds?')) {
      mockAdminStore.resetToFactoryDefaults();
      setFeedback('Factory mock datasets successfully restored! ✓');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
          Store Configuration &amp; Operations Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage general store metadata, customer service hotlines, and mock storage persistence.
        </p>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* General Settings Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Sliders className="w-4 h-4 text-[#A44101]" />
          <h2 className="text-sm font-bold text-navy">General Store Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store Brand Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp &amp; Support Phone
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pan-India Delivery Timeline Promise
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy hover:bg-[#0c1a2d] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#A44101]" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mock Storage Engine Management Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Database className="w-4 h-4 text-[#A44101]" />
          <h2 className="text-sm font-bold text-navy">Mock LocalStorage Engine</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <p>
            All admin operations (creating products, updating orders, saving gift card messages, recovering abandoned carts) write directly to your browser's persistent <code className="text-[#A44101] font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code>.
          </p>
          <p>
            If you ever need to reset to the original sample dataset of orders, gifts, and catalog products, click the button below:
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Default Demo Seeds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsView;
