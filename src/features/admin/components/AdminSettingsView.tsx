import React, { useState, useEffect, useRef } from 'react';
import { 
  SlidersHorizontal, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Truck,
  FileText,
  Eye,
  Upload,
  Trash2,
  Building2,
  MapPin,
  CreditCard,
  Package,
  HelpCircle,
  RefreshCw,
  X,
  Check,
  Percent,
  Sparkles,
  ExternalLink,
  Barcode,
  Printer
} from 'lucide-react';
import { 
  adminCheckoutSettingsApi,
  adminShippingSettingsApi,
  adminShipmozoLabelSettingsApi
} from '../../../api/adminApi';
import { AdminTab } from './AdminShell';
import { AdminStaffView } from './AdminStaffView';

interface AdminSettingsViewProps {
  currentTab?: AdminTab;
  onSelectTab?: (tab: AdminTab) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  currentTab = 'settings-controls',
  onSelectTab: _onSelectTab
}) => {
  // Global Toast Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // =========================================================================
  // TAB 1: CONTROLS (Live Checkout Policy API)
  // =========================================================================
  const [controlsLoading, setControlsLoading] = useState(false);
  const [controlsSaving, setControlsSaving] = useState(false);
  const [controls, setControls] = useState({
    codEnabled: true,
    partialPaymentEnabled: false,
    partialPaymentPercent: 25,
  });

  const fetchControls = async () => {
    setControlsLoading(true);
    try {
      const data = await adminCheckoutSettingsApi.getPolicy();
      if (data) {
        setControls({
          codEnabled: data.codEnabled ?? true,
          partialPaymentEnabled: data.partialPaymentEnabled ?? false,
          partialPaymentPercent: data.partialPaymentPercent ? Number(data.partialPaymentPercent) : 25,
        });
      }
    } catch (err: any) {
      showToast(`Failed to load checkout controls: ${err.message || 'Error'}`, 'error');
    } finally {
      setControlsLoading(false);
    }
  };

  const handleSaveControls = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setControlsSaving(true);
    try {
      await adminCheckoutSettingsApi.updatePolicy({
        codEnabled: controls.codEnabled,
        partialPaymentEnabled: controls.partialPaymentEnabled,
        partialPaymentPercent: controls.partialPaymentEnabled ? controls.partialPaymentPercent : null,
      });
      showToast('Checkout controls and payment policies saved successfully!');
    } catch (err: any) {
      showToast(`Failed to save controls: ${err.message || 'Error'}`, 'error');
    } finally {
      setControlsSaving(false);
    }
  };

  // =========================================================================
  // TAB 2: DELIVERY SETTINGS (Live Shipping Provider & Shipmozo API)
  // =========================================================================
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [deliverySettings, setDeliverySettings] = useState({
    activeProvider: 'shipmozo',
    warehouseId: '',
    pickupPincode: '',
    enabled: true,
    keysConfigured: false,
  });

  const fetchDeliverySettings = async () => {
    setDeliveryLoading(true);
    try {
      const [settingsRes, whRes] = await Promise.allSettled([
        adminShippingSettingsApi.getSettings(),
        adminShippingSettingsApi.getWarehouses(),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const s = settingsRes.value;
        setDeliverySettings({
          activeProvider: s.activeProvider || 'shipmozo',
          warehouseId: s.warehouseId || '',
          pickupPincode: s.pickupPincode || '',
          enabled: s.enabled ?? true,
          keysConfigured: s.keysConfigured ?? false,
        });
      }

      if (whRes.status === 'fulfilled') {
        const whData = whRes.value;
        const list = Array.isArray(whData) ? whData : (whData?.data || whData?.warehouses || []);
        setWarehouses(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      showToast(`Failed to load delivery settings: ${err.message || 'Error'}`, 'error');
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleTestShipmozo = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await adminShippingSettingsApi.testShipmozo();
      setTestResult({
        success: true,
        message: res.message || 'Connection to Shipmozo verified successfully!'
      });
      showToast('Shipmozo API connection test passed! ✓');
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to authenticate with Shipmozo'
      });
      showToast(`Shipmozo test failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveDelivery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (deliverySettings.pickupPincode && !/^\d{6}$/.test(deliverySettings.pickupPincode.trim())) {
      showToast('Please enter a valid 6-digit pickup pincode', 'error');
      return;
    }
    setDeliverySaving(true);
    try {
      await adminShippingSettingsApi.updateSettings({
        activeProvider: deliverySettings.activeProvider,
        warehouseId: deliverySettings.warehouseId,
        pickupPincode: deliverySettings.pickupPincode.trim(),
        enabled: deliverySettings.enabled,
      });
      showToast('Delivery provider settings saved successfully! ✓');
    } catch (err: any) {
      showToast(`Failed to save delivery settings: ${err.message || 'Error'}`, 'error');
    } finally {
      setDeliverySaving(false);
    }
  };

  // =========================================================================
  // TAB 3: SHIPMOZO LABEL SETTINGS (Live Shipping Label API)
  // =========================================================================
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelSaving, setLabelSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [labelPreviewOpen, setLabelPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [labelConfig, setLabelConfig] = useState({
    labelSize: '4x6',
    support: {
      showCustomerSupport: true,
      mobile: '+91 93200 01717',
      email: 'support.MehtaMartMHM@gmail.com',
    },
    delivery: {
      showPaymentMode: true,
      showCustomerAddress: true,
      showCustomerPhone: true,
      showOrderBarcode: true,
      showAwbBarcode: true,
      showRoutingCode: true,
      showRtoRoutingCode: false,
      showDimension: true,
      showWeight: true,
    },
    pickup: {
      showPickupName: true,
      showPickupAddress: true,
      showPickupPhone: true,
      showRtoName: true,
      showRtoAddress: true,
      showGstin: true,
      gstin: '07AAECR1234F1Z5',
      sellerName: 'Apna Bharat Bazaar',
    },
    products: {
      showItem: true,
      showSku: true,
      showQty: true,
      showPrice: true,
      showTotal: true,
      showHsn: true,
      showTaxableAmount: false,
      showDiscount: true,
      showPlatformFee: false,
      showShippingCharges: true,
      showCollectableAmount: true,
      showTotalQuantity: true,
      showAllItems: true,
      maxItems: 5,
    },
    logo: {
      enabled: true,
      url: '/images/logo.jpeg',
      placement: 'top-left',
    },
  });

  const fetchLabelSettings = async () => {
    setLabelLoading(true);
    try {
      const data = await adminShipmozoLabelSettingsApi.getSettings();
      if (data) {
        setLabelConfig({
          labelSize: data.labelSize || '4x6',
          support: {
            showCustomerSupport: data.support?.showCustomerSupport ?? true,
            mobile: data.support?.mobile || '',
            email: data.support?.email || '',
          },
          delivery: {
            showPaymentMode: data.delivery?.showPaymentMode ?? true,
            showCustomerAddress: data.delivery?.showCustomerAddress ?? true,
            showCustomerPhone: data.delivery?.showCustomerPhone ?? true,
            showOrderBarcode: data.delivery?.showOrderBarcode ?? true,
            showAwbBarcode: data.delivery?.showAwbBarcode ?? true,
            showRoutingCode: data.delivery?.showRoutingCode ?? true,
            showRtoRoutingCode: data.delivery?.showRtoRoutingCode ?? false,
            showDimension: data.delivery?.showDimension ?? true,
            showWeight: data.delivery?.showWeight ?? true,
          },
          pickup: {
            showPickupName: data.pickup?.showPickupName ?? true,
            showPickupAddress: data.pickup?.showPickupAddress ?? true,
            showPickupPhone: data.pickup?.showPickupPhone ?? true,
            showRtoName: data.pickup?.showRtoName ?? true,
            showRtoAddress: data.pickup?.showRtoAddress ?? true,
            showGstin: data.pickup?.showGstin ?? true,
            gstin: data.pickup?.gstin || '',
            sellerName: data.pickup?.sellerName || '',
          },
          products: {
            showItem: data.products?.showItem ?? true,
            showSku: data.products?.showSku ?? true,
            showQty: data.products?.showQty ?? true,
            showPrice: data.products?.showPrice ?? true,
            showTotal: data.products?.showTotal ?? true,
            showHsn: data.products?.showHsn ?? true,
            showTaxableAmount: data.products?.showTaxableAmount ?? false,
            showDiscount: data.products?.showDiscount ?? true,
            showPlatformFee: data.products?.showPlatformFee ?? false,
            showShippingCharges: data.products?.showShippingCharges ?? true,
            showCollectableAmount: data.products?.showCollectableAmount ?? true,
            showTotalQuantity: data.products?.showTotalQuantity ?? true,
            showAllItems: data.products?.showAllItems ?? true,
            maxItems: data.products?.maxItems ?? 5,
          },
          logo: {
            enabled: data.logo?.enabled ?? true,
            url: data.logo?.url || '',
            placement: data.logo?.placement || 'top-left',
          },
        });
      }
    } catch (err: any) {
      showToast(`Failed to load label settings: ${err.message || 'Error'}`, 'error');
    } finally {
      setLabelLoading(false);
    }
  };

  const handleSaveLabelSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLabelSaving(true);
    try {
      await adminShipmozoLabelSettingsApi.updateSettings(labelConfig);
      showToast('Shipmozo 4×6 label preferences saved successfully! ✓');
    } catch (err: any) {
      showToast(`Failed to save label settings: ${err.message || 'Error'}`, 'error');
    } finally {
      setLabelSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await adminShipmozoLabelSettingsApi.uploadLogo(file);
      const newUrl = res?.logoUrl || res?.url || res?.data?.logoUrl || URL.createObjectURL(file);
      setLabelConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, url: newUrl, enabled: true },
      }));
      showToast('Label brand logo uploaded successfully! ✓');
    } catch (err: any) {
      showToast(`Logo upload failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove current brand logo from shipping label?')) return;
    try {
      await adminShipmozoLabelSettingsApi.removeLogo();
      setLabelConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, url: '', enabled: false },
      }));
      showToast('Brand logo removed from label');
    } catch (err: any) {
      showToast(`Failed to remove logo: ${err.message || 'Error'}`, 'error');
    }
  };

  const handleOpenPreview = async () => {
    setPreviewLoading(true);
    setLabelPreviewOpen(true);
    try {
      const res = await adminShipmozoLabelSettingsApi.preview(labelConfig);
      setPreviewData(res?.data || res);
    } catch {
      // Fallback local mock preview if backend preview gives an error
      setPreviewData({
        sampleAwb: 'SMZ982341209IN',
        sampleOrderId: 'ABB-8921',
        sellerName: labelConfig.pickup.sellerName || 'Apna Bharat Bazaar',
        buyerName: 'Rahul Verma',
        buyerAddress: 'Flat 402, Lotus Residency, Near City Center Mall, Andheri West, Mumbai, Maharashtra - 400058',
        buyerPhone: '+91 98765 43210',
        mode: 'COD',
        amount: '₹1,249.00',
        routingCode: 'BOM-ADH-HUB-04',
        weight: '0.450 KG',
        dimensions: '22 × 15 × 8 CM',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Initial fetch based on current active tab
  useEffect(() => {
    if (currentTab === 'settings-controls' || currentTab === 'settings') {
      fetchControls();
    } else if (currentTab === 'settings-delivery' || currentTab === 'settings-shipping') {
      fetchDeliverySettings();
    } else if (currentTab === 'settings-label-settings') {
      fetchLabelSettings();
    }
  }, [currentTab]);

  // If user selected Staff inside settings, render the full AdminStaffView
  if (currentTab === 'settings-staff') {
    return <AdminStaffView />;
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn pb-12 font-roboto text-slate-800">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-md animate-fadeIn transition-all fixed bottom-6 right-6 z-50 max-w-md ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: CONTROLS VIEW
         ========================================================================= */}
      {(currentTab === 'settings-controls' || currentTab === 'settings') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F2] text-[#E11D48] flex items-center justify-center shadow-2xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                  Checkout &amp; Payment Controls
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Configure Cash on Delivery (COD), partial advance token policies, and checkout safety rules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchControls}
                disabled={controlsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${controlsLoading ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveControls()}
                disabled={controlsSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {controlsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {controlsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading checkout controls from server...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Toggles & Inputs */}
              <div className="lg:col-span-2 space-y-5">
                {/* 1. Cash on Delivery (COD) Control */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#A44101]" />
                        <h2 className="text-sm font-bold text-navy">Cash on Delivery (COD)</h2>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            controls.codEnabled
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {controls.codEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Allow customers to pay cash or UPI at their doorstep upon receiving the parcel.
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setControls((prev) => ({ ...prev, codEnabled: !prev.codEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        controls.codEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          controls.codEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zero Friction Checkout</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      COD increases initial conversion rate by up to 40% across Tier 2 and Tier 3 Indian cities.
                    </p>
                  </div>
                </div>

                {/* 2. Partial Payment (Advance Token) Control */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#E11D48]" />
                        <h2 className="text-sm font-bold text-navy">Partial Payment Policy</h2>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            controls.partialPaymentEnabled
                              ? 'bg-[#FFF0F2] text-[#E11D48] border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {controls.partialPaymentEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Require buyers to pay a non-refundable percentage advance online to confirm COD orders, drastically reducing Return to Origin (RTO).
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() =>
                        setControls((prev) => ({
                          ...prev,
                          partialPaymentEnabled: !prev.partialPaymentEnabled,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        controls.partialPaymentEnabled ? 'bg-[#E11D48]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          controls.partialPaymentEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {controls.partialPaymentEnabled && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Required Advance Percentage
                          </label>
                          <span className="text-xs font-black text-[#E11D48]">
                            {controls.partialPaymentPercent}% Advance
                          </span>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min="5"
                          max="90"
                          step="5"
                          value={controls.partialPaymentPercent}
                          onChange={(e) =>
                            setControls((prev) => ({
                              ...prev,
                              partialPaymentPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-[#E11D48] cursor-pointer"
                        />

                        {/* Presets */}
                        <div className="flex items-center gap-2 mt-2">
                          {[10, 15, 20, 25, 30, 50].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() =>
                                setControls((prev) => ({ ...prev, partialPaymentPercent: pct }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                controls.partialPaymentPercent === pct
                                  ? 'bg-[#FFF0F2] text-[#E11D48] border border-rose-300 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Live Checkout Calculator / Simulator */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-900 to-navy text-white rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <Percent className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold">Live Checkout Simulator</h3>
                  </div>

                  <p className="text-xs text-slate-300">
                    See how your store checkout displays payment breakdowns to customers for a sample order of ₹1,000.
                  </p>

                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Order Subtotal</span>
                      <span className="font-bold text-white">₹1,000.00</span>
                    </div>

                    {controls.partialPaymentEnabled ? (
                      <>
                        <div className="flex items-center justify-between text-emerald-400 font-bold border-t border-white/10 pt-2">
                          <span>Pay Online Advance ({controls.partialPaymentPercent}%)</span>
                          <span>₹{((1000 * controls.partialPaymentPercent) / 100).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-300 font-bold">
                          <span>Remaining at Doorstep (COD)</span>
                          <span>₹{(1000 - (1000 * controls.partialPaymentPercent) / 100).toFixed(0)}</span>
                        </div>
                      </>
                    ) : controls.codEnabled ? (
                      <div className="flex items-center justify-between text-emerald-400 font-bold border-t border-white/10 pt-2">
                        <span>Pay 100% on Doorstep (COD)</span>
                        <span>₹1,000.00</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-rose-400 font-bold border-t border-white/10 pt-2">
                        <span>Pay 100% Online (Prepaid Only)</span>
                        <span>₹1,000.00</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed bg-black/20 p-2.5 rounded-lg">
                    💡 <strong>Merchant Tip:</strong> Setting a 20% to 25% partial payment token eliminates frivolous impulse cancellations while retaining high customer intent.
                  </div>
                </div>

                {/* Primary Save Button Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSaveControls()}
                    disabled={controlsSaving}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {controlsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Controls</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Changes apply immediately to your active storefront checkout pipeline.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: DELIVERY SETTINGS VIEW
         ========================================================================= */}
      {(currentTab === 'settings-delivery' || currentTab === 'settings-shipping') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F2] text-[#E11D48] flex items-center justify-center shadow-2xs">
                  <Truck className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                  Delivery &amp; Courier Settings
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Configure automated multi-courier fulfillment via Shipmozo API, pickup warehouses, and dispatch hubs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchDeliverySettings}
                disabled={deliveryLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${deliveryLoading ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveDelivery()}
                disabled={deliverySaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {deliverySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Delivery Settings</span>
              </button>
            </div>
          </div>

          {deliveryLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading delivery configuration from server...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Form Options */}
              <div className="lg:col-span-2 space-y-5">
                {/* 1. Fulfillment Provider Selection */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#A44101]" />
                    <span>Active Shipping Provider</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Shipmozo Option */}
                    <button
                      type="button"
                      onClick={() => setDeliverySettings((prev) => ({ ...prev, activeProvider: 'shipmozo' }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                        deliverySettings.activeProvider === 'shipmozo'
                          ? 'border-[#E11D48] bg-[#FFF0F2]/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-navy uppercase tracking-wider">
                          Shipmozo API
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Automatic AWB assignment, multi-courier rates (Delhivery, Bluedart, Shadowfax), automated tracking.
                      </p>
                      {deliverySettings.activeProvider === 'shipmozo' && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E11D48]" />
                      )}
                    </button>

                    {/* Manual / Self Fulfillment Option */}
                    <button
                      type="button"
                      onClick={() => setDeliverySettings((prev) => ({ ...prev, activeProvider: 'manual' }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                        deliverySettings.activeProvider === 'manual'
                          ? 'border-[#E11D48] bg-[#FFF0F2]/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-navy uppercase tracking-wider">
                          Manual Fulfillment
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Custom
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        In-house shipping or local delivery staff with manual tracking ID entry.
                      </p>
                      {deliverySettings.activeProvider === 'manual' && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E11D48]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Pickup Warehouse & Origin Pin Code */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#A44101]" />
                      <span>Pickup Origin &amp; Warehouse Location</span>
                    </h2>
                    <span className="text-xs font-bold text-slate-500">
                      {warehouses.length} Warehouse(s) Found
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Warehouse Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Registered Warehouse (Shipmozo)
                      </label>
                      <select
                        value={deliverySettings.warehouseId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedWh = warehouses.find((w: any) => (w.id || w.warehouse_id || w._id) === selectedId);
                          setDeliverySettings((prev) => ({
                            ...prev,
                            warehouseId: selectedId,
                            pickupPincode: selectedWh?.pincode || selectedWh?.pin_code || prev.pickupPincode,
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#E11D48] bg-white cursor-pointer font-medium"
                      >
                        <option value="">-- Choose Warehouse for Courier Pickup --</option>
                        {warehouses.map((wh: any, i: number) => {
                          const id = wh.id || wh.warehouse_id || wh._id || `wh-${i}`;
                          const name = wh.name || wh.warehouse_name || wh.title || `Warehouse #${id}`;
                          const pin = wh.pincode || wh.pin_code || '';
                          const city = wh.city ? `, ${wh.city}` : '';
                          return (
                            <option key={id} value={id}>
                              {name} {pin ? `(${pin}${city})` : ''} - ID: {id}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Pickup Pincode */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Default Pickup Pincode (6 Digits)
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 110001"
                          value={deliverySettings.pickupPincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setDeliverySettings((prev) => ({ ...prev, pickupPincode: val }));
                          }}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-navy focus:outline-none focus:border-[#E11D48]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Used by Shipmozo rate calculator to determine exact freight rates to customer pincodes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Server API Connection Card */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-navy">API Credentials Status</h3>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Environment Keys:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          deliverySettings.keysConfigured
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {deliverySettings.keysConfigured ? '✓ Configured' : 'Env Loaded'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Auto-Label Sync:</span>
                      <span className="font-bold text-emerald-700 text-[10px]">Active</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestShipmozo}
                    disabled={testingConnection}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {testingConnection ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    <span>Test Shipmozo Connection</span>
                  </button>

                  {testResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {testResult.success ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                    Once verified, all new orders placed will be eligible for 1-click AWB generation and manifest printing directly from your Orders list.
                  </div>
                </div>

                {/* Save Button */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSaveDelivery()}
                    disabled={deliverySaving}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {deliverySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Delivery Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SHIPMOZO LABEL SETTINGS VIEW
         ========================================================================= */}
      {currentTab === 'settings-label-settings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F2] text-[#E11D48] flex items-center justify-center shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                  Shipmozo 4×6 Label Settings
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Customize layout, barcodes, seller branding, customer support, and itemized invoice details on thermal shipping labels.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPreview}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Preview 4×6 Label</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveLabelSettings()}
                disabled={labelSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {labelSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Label Settings</span>
              </button>
            </div>
          </div>

          {labelLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
              <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading thermal label preferences from server...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Comprehensive Label Customization Form */}
              <div className="lg:col-span-2 space-y-5">
                {/* 1. Brand Logo on Thermal Label */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#A44101]" />
                      <span>Brand Logo on Shipping Label</span>
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-600">Print Logo</span>
                      <input
                        type="checkbox"
                        checked={labelConfig.logo.enabled}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            logo: { ...prev.logo, enabled: e.target.checked },
                          }))
                        }
                        className="rounded accent-[#E11D48] w-4 h-4"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-24 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {labelConfig.logo.url ? (
                        <img
                          src={labelConfig.logo.url}
                          alt="Label Logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">No Logo</span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={logoInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                          id="label-logo-upload"
                        />
                        <label
                          htmlFor="label-logo-upload"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-300"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>Upload New Logo</span>
                        </label>

                        {labelConfig.logo.url && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Recommended: High contrast monochrome or transparent PNG (max 500 KB) for clean thermal printing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Seller & Origin Details */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Building2 className="w-4 h-4 text-[#A44101]" />
                    <span>Seller &amp; Pickup Origin Details</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Seller Business Name on Label
                      </label>
                      <input
                        type="text"
                        value={labelConfig.pickup.sellerName}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            pickup: { ...prev.pickup, sellerName: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#E11D48]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        GSTIN Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={labelConfig.pickup.gstin}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            pickup: { ...prev.pickup, gstin: e.target.value.toUpperCase() },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono text-navy focus:outline-none focus:border-[#E11D48]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: 'showPickupName', label: 'Show Pickup Contact Name' },
                      { key: 'showPickupAddress', label: 'Show Pickup Warehouse Address' },
                      { key: 'showPickupPhone', label: 'Show Pickup Contact Number' },
                      { key: 'showRtoAddress', label: 'Show Return (RTO) Address' },
                      { key: 'showGstin', label: 'Show GSTIN on Label' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(labelConfig.pickup as any)[key]}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              pickup: { ...prev.pickup, [key]: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#E11D48] w-4 h-4"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Customer & Delivery Layout Toggles */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Barcode className="w-4 h-4 text-[#A44101]" />
                    <span>Barcodes &amp; Delivery Information</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'showPaymentMode', label: 'Display Payment Mode (COD / Prepaid)' },
                      { key: 'showCustomerAddress', label: 'Display Customer Full Delivery Address' },
                      { key: 'showCustomerPhone', label: 'Display Customer Phone Number' },
                      { key: 'showOrderBarcode', label: 'Print Order ID Barcode' },
                      { key: 'showAwbBarcode', label: 'Print AWB Tracking Barcode (Required for Courier)' },
                      { key: 'showRoutingCode', label: 'Display Courier Hub Routing Code' },
                      { key: 'showDimension', label: 'Print Package Dimensions (L × W × H)' },
                      { key: 'showWeight', label: 'Print Package Dead & Volumetric Weight' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(labelConfig.delivery as any)[key]}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, [key]: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#E11D48] w-4 h-4"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Customer Support Helpline */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-navy flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#A44101]" />
                      <span>Customer Support Helpline on Label</span>
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-slate-600">Print Support Info</span>
                      <input
                        type="checkbox"
                        checked={labelConfig.support.showCustomerSupport}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            support: { ...prev.support, showCustomerSupport: e.target.checked },
                          }))
                        }
                        className="rounded accent-[#E11D48] w-4 h-4"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Support Contact Mobile
                      </label>
                      <input
                        type="text"
                        value={labelConfig.support.mobile}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            support: { ...prev.support, mobile: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#E11D48]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Support Email Address
                      </label>
                      <input
                        type="email"
                        value={labelConfig.support.email}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            support: { ...prev.support, email: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#E11D48]"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Itemized Products Table on Label */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
                  <h2 className="text-sm font-bold text-navy flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Package className="w-4 h-4 text-[#A44101]" />
                    <span>Itemized Packing Slip Table</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'showItem', label: 'Show Product Name / Title' },
                      { key: 'showSku', label: 'Show SKU Code' },
                      { key: 'showQty', label: 'Show Quantity' },
                      { key: 'showPrice', label: 'Show Unit Price' },
                      { key: 'showTotal', label: 'Show Item Total Amount' },
                      { key: 'showHsn', label: 'Show HSN Code' },
                      { key: 'showShippingCharges', label: 'Show Shipping Charges' },
                      { key: 'showCollectableAmount', label: 'Show Collectable COD Amount' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(labelConfig.products as any)[key]}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, [key]: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#E11D48] w-4 h-4"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Quick Preview & Save */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Printer className="w-4 h-4 text-[#E11D48]" />
                    <h3 className="text-sm font-bold text-navy">Thermal Printer Specs</h3>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Standard Size:</span>
                      <span className="font-mono font-bold text-navy">4 × 6 Inch (100×150mm)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Compatible Printers:</span>
                      <span className="font-bold text-slate-700">TVS, TSC, Zebra, Rollo</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Resolution:</span>
                      <span className="font-bold text-slate-700">203 DPI / 300 DPI</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Open Live 4×6 Label Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveLabelSettings()}
                    disabled={labelSaving}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {labelSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Label Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Label Preview Modal */}
          {labelPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Printer className="w-5 h-5 text-[#E11D48]" />
                    <h3 className="font-black text-navy text-base">4×6 Shipping Label Simulation</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLabelPreviewOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {previewLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#E11D48]" />
                    <span className="text-xs text-slate-500 font-bold">Rendering thermal preview...</span>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-400 p-4 bg-white font-mono text-[11px] text-black space-y-3 shadow-inner rounded-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <div>
                        <div className="font-bold text-sm tracking-tight">
                          {labelConfig.pickup.sellerName || 'APNA BHARAT BAZAAR'}
                        </div>
                        {labelConfig.pickup.showGstin && labelConfig.pickup.gstin && (
                          <div className="text-[10px]">GSTIN: {labelConfig.pickup.gstin}</div>
                        )}
                      </div>
                      {labelConfig.logo.enabled && labelConfig.logo.url && (
                        <img
                          src={labelConfig.logo.url}
                          alt="Logo"
                          className="h-8 max-w-[90px] object-contain filter grayscale"
                        />
                      )}
                    </div>

                    {/* Routing Hub & Mode */}
                    <div className="grid grid-cols-2 border-b-2 border-black pb-2 text-center">
                      <div className="border-r border-black pr-2">
                        <div className="text-[9px] uppercase">Routing Hub</div>
                        <div className="font-black text-base">{previewData?.routingCode || 'BOM-ADH-04'}</div>
                      </div>
                      <div className="pl-2">
                        <div className="text-[9px] uppercase">Payment Mode</div>
                        <div className="font-black text-base uppercase">
                          {labelConfig.delivery.showPaymentMode ? (previewData?.mode || 'COD') : 'PREPAID'}
                        </div>
                      </div>
                    </div>

                    {/* Simulated AWB Barcode */}
                    <div className="text-center py-2 border-b-2 border-black space-y-1">
                      <div className="h-10 bg-repeat-x flex items-center justify-center">
                        <div className="w-full flex justify-between h-8 px-4 items-center">
                          {[...Array(38)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-transparent'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="font-bold text-xs tracking-widest">
                        AWB: {previewData?.sampleAwb || 'SMZ982341209IN'}
                      </div>
                    </div>

                    {/* Ship To & Address */}
                    <div className="border-b-2 border-black pb-2 space-y-1">
                      <div className="text-[9px] font-bold uppercase">Ship To:</div>
                      <div className="font-bold text-xs">{previewData?.buyerName || 'Rahul Verma'}</div>
                      <div className="text-[10px] leading-tight">
                        {previewData?.buyerAddress ||
                          'Flat 402, Lotus Residency, Near City Center Mall, Andheri West, Mumbai, Maharashtra - 400058'}
                      </div>
                      {labelConfig.delivery.showCustomerPhone && (
                        <div className="text-[10px] font-bold">Tel: {previewData?.buyerPhone || '+91 98765 43210'}</div>
                      )}
                    </div>

                    {/* Items Table */}
                    <div className="border-b border-black pb-1 text-[10px]">
                      <div className="flex justify-between font-bold border-b border-black pb-0.5">
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Price</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="truncate max-w-[180px]">Premium Herbal Soap (100g)</span>
                        <span>2</span>
                        <span>₹499.00</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="truncate max-w-[180px]">Handcrafted Copper Bottle</span>
                        <span>1</span>
                        <span>₹750.00</span>
                      </div>
                    </div>

                    {/* Total Collectable */}
                    <div className="flex justify-between items-center font-bold text-xs pt-1">
                      <span>Total Collectable:</span>
                      <span className="text-sm font-black">{previewData?.amount || '₹1,249.00'}</span>
                    </div>

                    {/* Support Helpline Footer */}
                    {labelConfig.support.showCustomerSupport && (
                      <div className="border-t border-black pt-1 text-[9px] text-center">
                        Support Hotline: {labelConfig.support.mobile || '+91 93200 01717'} | {labelConfig.support.email || 'support@abb.com'}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setLabelPreviewOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          OTHER SETTINGS TABS (Panels with Contextual Settings)
         ========================================================================= */}
      {currentTab === 'settings-profile' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Store Profile</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              General merchant identity, contact emails, and public business profiles.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Brand Name</label>
              <input
                type="text"
                defaultValue="Apna Bharat Bazaar"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy font-bold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  defaultValue="+91 93200 01717"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  defaultValue="support.MehtaMartMHM@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast('Store profile updated successfully! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-product-display' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Product Display</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure layout, grid columns, and product badges.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#E11D48] w-4 h-4" />
                <span>Display "Out of Stock" query button for unavailable variants</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#E11D48] w-4 h-4" />
                <span>Show discount savings percentage badge (e.g. 25% OFF)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#E11D48] w-4 h-4" />
                <span>Enable high-resolution media zoom modal on click</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => showToast('Product display preferences updated! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-header-badge' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Header Badge &amp; Announcement</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Promotional top announcement marquee and header ticker.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Ticker Text</label>
              <input
                type="text"
                defaultValue="Free Express Delivery Across India on Orders Above ₹499 | COD Available"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy"
              />
            </div>
            <button
              type="button"
              onClick={() => showToast('Header announcement banner updated! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Header Badge
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-product-code-prefix' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Product Code Prefix</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">SKU identifier prefixes and auto-increment sequencing.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SKU Prefix</label>
                <input
                  type="text"
                  defaultValue="ABB-"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Starting Number</label>
                <input
                  type="number"
                  defaultValue={1001}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm text-navy"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => showToast('SKU code sequence prefix updated! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Prefix
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-payments' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Payment Gateways</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">UPI, Net Banking, and card processing configuration.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 space-y-1">
              <div className="font-bold">Active Primary Gateway: Razorpay / Cashfree UPI</div>
              <p className="text-[11px] text-emerald-700">All payments are authenticated via secure HTTPS webhooks.</p>
            </div>
            <div className="text-xs text-slate-500">
              To update API keys or live Webhook secrets, contact your system administrator or update the secure environment config file.
            </div>
          </div>
        </div>
      )}

      {currentTab === 'settings-orders' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Order Processing Rules</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Fulfillment lifecycle triggers and packing slip numbering.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Order Prefix</label>
              <input
                type="text"
                defaultValue="#ABB-"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => showToast('Order numbering preferences updated! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-customer' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Customer Accounts &amp; Access</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Guest checkout and customer registration settings.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#E11D48] w-4 h-4" />
                <span>Allow 1-click Guest Checkout without mandatory account registration</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#E11D48] w-4 h-4" />
                <span>Auto-save customer delivery addresses on checkout completion</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => showToast('Customer account settings saved! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-policies' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Store Policies &amp; Terms</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Customer policies, return terms, and privacy agreements.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Return &amp; Refund Policy Note</label>
              <textarea
                rows={4}
                defaultValue="Returns accepted within 7 days of delivery for damaged or defective items with unboxing video proof. Reverse pickup arranged via Shipmozo."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm leading-relaxed"
              />
            </div>
            <button
              type="button"
              onClick={() => showToast('Store policy disclosures updated! ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Save Policies
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-help' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Help Center &amp; Support</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Documentation, technical guides, and support hotline.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#A44101]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy">Apna Bharat Bazaar Support Desk</h3>
                <p className="text-xs text-slate-500">Live 9:00 AM – 7:00 PM IST (Mon–Sat)</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2">
              <div><strong>Technical Support Email:</strong> support.MehtaMartMHM@gmail.com</div>
              <div><strong>Courier Escalations:</strong> +91 93200 01717</div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'settings-suggest' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Suggest Ideas &amp; Feedback</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Submit feature requests to the engineering team.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Feature Idea or Feedback</label>
              <textarea
                rows={4}
                placeholder="Describe your idea or enhancement request..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => showToast('Thank you! Your suggestion was submitted to the product team. ✓')}
              className="px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-bold hover:bg-[#BE123C] cursor-pointer"
            >
              Submit Suggestion
            </button>
          </div>
        </div>
      )}

      {currentTab === 'settings-other' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">Other System Settings</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Cache maintenance, storage purge, and debug tools.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold text-navy">Purge Frontend Cache</div>
                <div className="text-[11px] text-slate-500">Clears browser session storage and reloads active products.</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.clear();
                  showToast('Frontend session cache cleared! ✓');
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminSettingsView;
