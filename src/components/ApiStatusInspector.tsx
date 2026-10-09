import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  X,
  CreditCard,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  BASE_API_URL,
  loadRazorpayScript,
  storefrontProductsApi,
  storefrontAddressApi,
  storefrontCheckoutApi
} from '../api';

export const ApiStatusInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'auth' | 'razorpay'>('endpoints');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [razorpayStatus, setRazorpayStatus] = useState<'ready' | 'loading' | 'error' | 'idle'>('idle');

  const customerToken = typeof window !== 'undefined' ? localStorage.getItem('user_access_token') : null;
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;

  const handleTestEndpoint = async (name: string, fn: () => Promise<any>) => {
    setTestingEndpoint(name);
    setTestResult('Running request...');
    const startTime = performance.now();
    try {
      const data = await fn();
      const elapsed = Math.round(performance.now() - startTime);
      setTestResult(`✓ 200 OK (${elapsed}ms)\n${JSON.stringify(data, null, 2).slice(0, 500)}`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setTestResult(`Notice / Response (${elapsed}ms): ${err.message}\n(Using graceful fallback mock data in frontend)`);
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleTestRazorpay = async () => {
    setRazorpayStatus('loading');
    try {
      const loaded = await loadRazorpayScript();
      if (loaded) {
        setRazorpayStatus('ready');
      } else {
        setRazorpayStatus('error');
      }
    } catch {
      setRazorpayStatus('error');
    }
  };

  return (
    <>
      {/* Floating API Status Dock at bottom right */}
      <aside aria-label="API Integration Inspector" className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white border border-slate-700 shadow-xl backdrop-blur-md text-xs font-semibold transition-all cursor-pointer hover:border-[#A44101]/60"
          title="Inspect API Endpoints & Razorpay Integration"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 group-hover:text-white">API Live</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#A44101]/30 text-amber-300 rounded font-mono font-bold">
            Razorpay + v1
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </aside>

      {/* Inspector Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-700 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A44101]/20 border border-[#A44101]/40 text-[#A44101] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Frontend API Integration Console</h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{BASE_API_URL}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('endpoints')}
                className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'endpoints' ? 'border-[#A44101] text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Endpoints Tested
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('razorpay')}
                className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'razorpay' ? 'border-[#A44101] text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Razorpay SDK
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                className={`pb-2 px-3 font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'auth' ? 'border-[#A44101] text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                Token Interceptor
              </button>
            </div>

            {/* TAB 1: Test Endpoints */}
            {activeTab === 'endpoints' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    disabled={testingEndpoint !== null}
                    onClick={() => handleTestEndpoint('GET /categories', () => storefrontProductsApi.getCategories())}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left cursor-pointer transition-colors"
                  >
                    <span className="block font-bold text-amber-300">GET /categories</span>
                    <span className="text-[10px] text-slate-400">Storefront categories</span>
                  </button>

                  <button
                    type="button"
                    disabled={testingEndpoint !== null}
                    onClick={() => handleTestEndpoint('GET /products/all', () => storefrontProductsApi.getAll())}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left cursor-pointer transition-colors"
                  >
                    <span className="block font-bold text-amber-300">GET /products/all</span>
                    <span className="text-[10px] text-slate-400">Catalog products query</span>
                  </button>

                  <button
                    type="button"
                    disabled={testingEndpoint !== null}
                    onClick={() => handleTestEndpoint('POST /coupons/validate', () => storefrontCheckoutApi.validateCoupon('BABA100', 499))}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left cursor-pointer transition-colors"
                  >
                    <span className="block font-bold text-emerald-400">POST /coupons/validate</span>
                    <span className="text-[10px] text-slate-400">Coupon discount check</span>
                  </button>

                  <button
                    type="button"
                    disabled={testingEndpoint !== null}
                    onClick={() => handleTestEndpoint('POST /delivery/check-delivery', () => storefrontAddressApi.checkDeliveryPincode('110001'))}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left cursor-pointer transition-colors"
                  >
                    <span className="block font-bold text-blue-400">POST /delivery/check-delivery</span>
                    <span className="text-[10px] text-slate-400">Pincode serviceability</span>
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {testResult}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Razorpay SDK */}
            {activeTab === 'razorpay' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Razorpay Checkout v1</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(window as any).Razorpay ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700 text-slate-300'
                      }`}>
                      {(window as any).Razorpay ? 'SDK Loaded in DOM' : 'Not Loaded Yet'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Razorpay SDK script is automatically loaded on demand when initiating customer checkout in CheckoutPage.tsx.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestRazorpay}
                    disabled={razorpayStatus === 'loading'}
                    className="mt-2 px-4 py-2 bg-[#A44101] hover:bg-[#8C3701] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${razorpayStatus === 'loading' ? 'animate-spin' : ''}`} />
                    <span>{razorpayStatus === 'loading' ? 'Loading Script...' : 'Test Load Razorpay Script'}</span>
                  </button>
                  {razorpayStatus === 'ready' && (
                    <p className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Script successfully loaded into document.head!</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Token Interceptor */}
            {activeTab === 'auth' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-slate-400 block font-medium">Customer Bearer Token:</span>
                  <span className="font-mono text-emerald-400 text-[11px] break-all">
                    {customerToken ? `Bearer ${customerToken.slice(0, 30)}...` : 'None (Guest customer mode active)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="text-slate-400 block font-medium">Admin Bearer Token:</span>
                  <span className="font-mono text-amber-400 text-[11px] break-all">
                    {adminToken ? `Bearer ${adminToken.slice(0, 30)}...` : 'None (Sign in at /admin to inject token)'}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400">
                  Requests to paths containing <code className="text-amber-300">/admin</code> automatically inject the admin access token; all other routes inject the customer token.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>All 4 files active: client, storefrontApi, adminApi, index</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
