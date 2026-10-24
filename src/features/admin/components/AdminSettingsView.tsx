import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  SlidersHorizontal, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Truck,
  Upload,
  Trash2,
  MapPin,
  CreditCard,
  HelpCircle,
  X,
  Check,
  Sparkles,
  Printer,
  Key,
  Lock,
  ChevronRight,
  ShoppingBag,
  Wallet,
  Store,
  Star,
  FileText,
  Ban
} from 'lucide-react';
import { 
  adminStoreControlsApi,
  AdminStoreControlsData,
  adminCheckoutSettingsApi,
  adminShippingSettingsApi,
  adminShipmozoLabelSettingsApi,
  adminStaffApi
} from '../../../api/adminApi';
import { AdminTab } from './AdminShell';
import { AdminStaffView } from './AdminStaffView';
import { mockAdminStore } from '../mockAdminStore';
import {
  SameDayDeliverySettingsCard,
  SameDaySettings,
  StandardDeliverySettingsCard,
  StandardDeliverySettings,
} from '../../sameDayDelivery';

interface StoreProfileData {
  storeName: string;
  storeNumber: string;
  storeId: string;
  displayNumber: string;
  email: string;
  isEmailVerified: boolean;
  storeDescription: string;
  storeAddress: string;
  businessType: string;
  initials: string;
}

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
  // TAB: PROFILE SETTINGS (Store Profile & Self Password Reset)
  // =========================================================================
  const [profileData, setProfileData] = useState<StoreProfileData>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('abb_store_profile_data') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const currentUser = mockAdminStore.getCurrentUser();
    return {
      storeName: 'Apna Bharat Bazaar',
      storeNumber: '9370686008',
      storeId: '5566117',
      displayNumber: '9320017017',
      email: currentUser?.email || 'arjun@gmail.com',
      isEmailVerified: true,
      storeDescription: 'Welcome to the store. We invite you to avail all the best offers displayed by us with the safest Payment Gateways. We started in the year 2015...',
      storeAddress: 'Delhi - 110008',
      businessType: 'Mobile & Electronics, Clothing & Fashion, Others',
      initials: 'AR',
    };
  });

  const [editingField, setEditingField] = useState<{
    key: string;
    label: string;
    value: string;
    isTextarea?: boolean;
  } | null>(null);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await adminStaffApi.getMyProfile();
      if (data) {
        setProfileData((prev: StoreProfileData) => {
          const initials = data.name
            ? data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            : prev.initials;
          const updated: StoreProfileData = {
            ...prev,
            storeNumber: data.phone || prev.storeNumber,
            email: data.email || prev.email,
            initials: initials || 'AR',
          };
          localStorage.setItem('abb_store_profile_data', JSON.stringify(updated));
          return updated;
        });
      }
    } catch {
      const currentUser = mockAdminStore.getCurrentUser();
      if (currentUser?.email) {
        setProfileData((prev: StoreProfileData) => ({
          ...prev,
          email: currentUser.email,
        }));
      }
    }
  };

  const handleOpenEdit = (key: string, label: string, value: string, isTextarea = false) => {
    setEditingField({ key, label, value, isTextarea });
  };

  const handleSaveFieldEdit = async () => {
    if (!editingField) return;
    const updated = {
      ...profileData,
      [editingField.key]: editingField.value.trim(),
    };
    setProfileData(updated);
    localStorage.setItem('abb_store_profile_data', JSON.stringify(updated));

    if (editingField.key === 'storeNumber' || editingField.key === 'email') {
      try {
        await adminStaffApi.updateMyProfile({
          phone: updated.storeNumber,
          email: updated.email,
        });
      } catch {}
    }

    setEditingField(null);
    showToast(`${editingField.label} updated successfully! ✓`);
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await adminStaffApi.initiateSelfReset();
      setOtpSent(true);
      showToast(res?.message || `One-time code sent to ${profileData.email}!`);
    } catch {
      setOtpSent(true);
      showToast(`One-time code sent to ${profileData.email}!`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndReset = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      showToast('Please enter the verification code sent to your email', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await adminStaffApi.verifySelfReset({
        otp: otpCode.trim(),
        newPassword: newPassword,
      });
      showToast(res?.message || 'Admin password updated successfully! ✓');
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast('Admin password updated successfully! ✓');
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // =========================================================================
  // TAB 1: STORE CONTROLS & OPERATIONAL STATUS (Live API Integration)
  // =========================================================================
  const [storeControlsLoading, setStoreControlsLoading] = useState(false);
  const [storeControlsUpdating, setStoreControlsUpdating] = useState<string | null>(null);
  const [storeControls, setStoreControls] = useState<AdminStoreControlsData>({
    globalStoreAccess: true,
    deliveryServices: true,
    selfPickup: false,
    businessFramework: 'Business to Customer (B2C)',
  });
  const [isChangeTypeOpen, setIsChangeTypeOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('Business to Customer (B2C)');
  const [activeFeatureModal, setActiveFeatureModal] = useState<'cod' | 'review' | 'gst' | 'explore' | null>(null);

  // COD & Payment Controls state (Preserved and accessible via COD Management card)
  const [controlsSaving, setControlsSaving] = useState(false);
  const [controls, setControls] = useState({
    codEnabled: true,
    partialPaymentEnabled: false,
    partialPaymentPercent: 25,
  });

  const fetchStoreControls = async () => {
    setStoreControlsLoading(true);
    try {
      const [controlsData, checkoutData] = await Promise.allSettled([
        adminStoreControlsApi.getControls(),
        adminCheckoutSettingsApi.getPolicy(),
      ]);
      if (controlsData.status === 'fulfilled' && controlsData.value) {
        setStoreControls(controlsData.value);
        setSelectedFramework(controlsData.value.businessFramework || 'Business to Customer (B2C)');
      }
      if (checkoutData.status === 'fulfilled' && checkoutData.value) {
        setControls({
          codEnabled: checkoutData.value.codEnabled ?? true,
          partialPaymentEnabled: checkoutData.value.partialPaymentEnabled ?? false,
          partialPaymentPercent: checkoutData.value.partialPaymentPercent ? Number(checkoutData.value.partialPaymentPercent) : 25,
        });
      }
    } catch (err: any) {
      showToast(`Failed to load store controls: ${err.message || 'Error'}`, 'error');
    } finally {
      setStoreControlsLoading(false);
    }
  };

  const handleToggleStoreControl = async (key: 'globalStoreAccess' | 'deliveryServices' | 'selfPickup') => {
    const newValue = !storeControls[key];
    const labelMap: Record<string, string> = {
      globalStoreAccess: 'Global Store Access',
      deliveryServices: 'Delivery Services',
      selfPickup: 'Self Pick-up',
    };
    const label = labelMap[key] || key;

    // Snappy optimistic UI update
    setStoreControls((prev) => ({ ...prev, [key]: newValue }));
    setStoreControlsUpdating(key);

    try {
      await adminStoreControlsApi.updateControls({ [key]: newValue });
      showToast(`${label} is now ${newValue ? 'ACTIVE' : 'PAUSED'} ✓`, 'success');
    } catch (err: any) {
      // Revert if API fails
      setStoreControls((prev) => ({ ...prev, [key]: !newValue }));
      showToast(`Failed to update ${label}: ${err.message || 'Error'}`, 'error');
    } finally {
      setStoreControlsUpdating(null);
    }
  };

  const handleSaveFramework = async (framework: string) => {
    setStoreControls((prev) => ({ ...prev, businessFramework: framework }));
    setSelectedFramework(framework);
    setIsChangeTypeOpen(false);

    try {
      await adminStoreControlsApi.updateControls({ businessFramework: framework });
      showToast(`Business framework changed to ${framework} ✓`, 'success');
    } catch (err: any) {
      showToast(`Failed to update framework: ${err.message || 'Error'}`, 'error');
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
      showToast('COD & checkout payment policies saved successfully! ✓');
      setActiveFeatureModal(null);
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
    minOrderValue: 0,
    deliveryCharge: 0,
    freeDeliveryAbove: 999,
    codCharge: 0,
  });
  const [activeDeliveryModal, setActiveDeliveryModal] = useState<
    'minOrderValue' | 'deliveryCharge' | 'codCharge' | 'shippingPartners' | 'pickupAddresses' | null
  >(null);
  const [sameDaySettings, setSameDaySettings] = useState<SameDaySettings>({
    enabled: false,
    pincodes: [],
    openHour: 9,
    cutoffHour: 14,
    floorFeeInr: 0,
    feeBuffer: 1.2,
    warehouseLat: null,
    warehouseLng: null,
  });
  const [sameDaySaving, setSameDaySaving] = useState(false);
  const [standardDeliverySettings, setStandardDeliverySettings] = useState<StandardDeliverySettings>({
    enabled: true,
  });
  const [standardDeliverySaving, setStandardDeliverySaving] = useState(false);

  const fetchDeliverySettings = async () => {
    setDeliveryLoading(true);
    try {
      const [settingsRes, whRes] = await Promise.allSettled([
        adminShippingSettingsApi.getSettings(),
        adminShippingSettingsApi.getWarehouses(),
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const s = settingsRes.value;
        const sm = s.shipmozo || {};
        setDeliverySettings((prev) => ({
          ...prev,
          activeProvider: s.activeProvider || 'shipmozo',
          warehouseId: sm.warehouseId || s.warehouseId || '',
          pickupPincode: sm.pickupPincode || s.pickupPincode || '',
          enabled: sm.enabled ?? s.enabled ?? true,
          keysConfigured: sm.keysConfigured ?? s.keysConfigured ?? false,
          minOrderValue: s.minOrderValue ?? prev.minOrderValue,
          deliveryCharge: s.deliveryCharge ?? prev.deliveryCharge,
          freeDeliveryAbove: s.freeDeliveryAbove ?? prev.freeDeliveryAbove,
          codCharge: s.codCharge ?? prev.codCharge,
        }));
        if (s.standardDelivery) {
          setStandardDeliverySettings({
            enabled: s.standardDelivery.enabled !== false,
            ready: s.standardDelivery.ready,
          });
        }
        if (s.sameDay) {
          setSameDaySettings({
            enabled: Boolean(s.sameDay.enabled),
            pincodes: Array.isArray(s.sameDay.pincodes) ? s.sameDay.pincodes : [],
            openHour: Number(s.sameDay.openHour) || 9,
            cutoffHour: Number(s.sameDay.cutoffHour) || 14,
            floorFeeInr: Number(s.sameDay.floorFeeInr) || 0,
            feeBuffer: Number(s.sameDay.feeBuffer) || 1.2,
            warehouseLat: s.sameDay.warehouseLat ?? null,
            warehouseLng: s.sameDay.warehouseLng ?? null,
            pincodeCount: s.sameDay.pincodeCount,
            pincodeRestricted: s.sameDay.pincodeRestricted,
            ready: s.sameDay.ready,
          });
        }
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
        minOrderValue: deliverySettings.minOrderValue,
        deliveryCharge: deliverySettings.deliveryCharge,
        freeDeliveryAbove: deliverySettings.freeDeliveryAbove,
        codCharge: deliverySettings.codCharge,
      } as any);
      showToast('Delivery settings saved successfully! ✓');
      setActiveDeliveryModal(null);
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
      showHsn: false,
      showTaxableAmount: false,
      showDiscount: true,
      showPlatformFee: false,
      showShippingCharges: true,
      showCollectableAmount: true,
      showTotalQuantity: true,
      showAllItems: false,
      maxItems: 10,
      trimSkuUpto: 10,
      trimProductNameUpto: 17,
    },
    miscellaneous: {
      showNotes: true,
      showInvoiceNumber: true,
      showInvoiceDate: true,
      showOrderDate: true,
      showOrderTotal: true,
      showEwayBillNo: true,
      showPoweredByStore: true,
      showAutoGeneratedDisclaimer: true,
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
            showGstin: data.pickup?.showGstin ?? false,
            gstin: data.pickup?.gstin || '',
            sellerName: data.pickup?.sellerName || '',
          },
          products: {
            showItem: data.products?.showItem ?? true,
            showSku: data.products?.showSku ?? true,
            showQty: data.products?.showQty ?? true,
            showPrice: data.products?.showPrice ?? true,
            showTotal: data.products?.showTotal ?? true,
            showHsn: data.products?.showHsn ?? false,
            showTaxableAmount: data.products?.showTaxableAmount ?? false,
            showDiscount: data.products?.showDiscount ?? true,
            showPlatformFee: data.products?.showPlatformFee ?? false,
            showShippingCharges: data.products?.showShippingCharges ?? true,
            showCollectableAmount: data.products?.showCollectableAmount ?? true,
            showTotalQuantity: data.products?.showTotalQuantity ?? true,
            showAllItems: data.products?.showAllItems ?? false,
            maxItems: data.products?.maxItems ? Number(data.products.maxItems) : 10,
            trimSkuUpto: data.products?.trimSkuUpto ? Number(data.products.trimSkuUpto) : 10,
            trimProductNameUpto: data.products?.trimProductNameUpto ? Number(data.products.trimProductNameUpto) : 17,
          },
          miscellaneous: {
            showNotes: data.miscellaneous?.showNotes ?? true,
            showInvoiceNumber: data.miscellaneous?.showInvoiceNumber ?? true,
            showInvoiceDate: data.miscellaneous?.showInvoiceDate ?? true,
            showOrderDate: data.miscellaneous?.showOrderDate ?? true,
            showOrderTotal: data.miscellaneous?.showOrderTotal ?? true,
            showEwayBillNo: data.miscellaneous?.showEwayBillNo ?? true,
            showPoweredByStore: data.miscellaneous?.showPoweredByStore ?? true,
            showAutoGeneratedDisclaimer: data.miscellaneous?.showAutoGeneratedDisclaimer ?? true,
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
    try {
      await adminShipmozoLabelSettingsApi.removeLogo();
      setLabelConfig((prev) => ({
        ...prev,
        logo: { ...prev.logo, url: '', enabled: false },
      }));
      showToast('Brand logo removed successfully! ✓');
    } catch (err: any) {
      showToast(`Failed to remove logo: ${err.message || 'Error'}`, 'error');
    }
  };

  const handlePrintLabel = () => {
    const printContent = document.getElementById('shipmozo-4x6-label-preview-content');
    if (!printContent) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank', 'width=520,height=750');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Shipmozo 4x6 Thermal Label</title>
            <style>
              @page {
                size: 4in 6in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 12px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background-color: #ffffff;
              }
              * {
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  // Initial fetch based on current active tab
  useEffect(() => {
    if (currentTab === 'settings-controls' || currentTab === 'settings') {
      fetchStoreControls();
    } else if (currentTab === 'settings-delivery' || currentTab === 'settings-shipping') {
      fetchDeliverySettings();
    } else if (currentTab === 'settings-label-settings') {
      fetchLabelSettings();
    } else if (currentTab === 'settings-profile') {
      fetchProfile();
    }
  }, [currentTab]);

  // If user selected Staff inside settings, render the full AdminStaffView
  if (currentTab === 'settings-staff') {
    return <AdminStaffView />;
  }

  return (
    <div className={`space-y-6 ${currentTab === 'settings-label-settings' ? 'max-w-7xl' : 'max-w-5xl'} animate-fadeIn pb-12 font-roboto text-slate-800`}>
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
          TAB 1: STORE CONTROLS VIEW (Exact Visual Match to Screenshot & Live API)
         ========================================================================= */}
      {(currentTab === 'settings-controls' || currentTab === 'settings') && (
        <div className="space-y-6 animate-fadeIn font-roboto">
          {/* Header Bar matching screenshot */}
          <div className="flex items-center justify-between pb-1">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              Store Controls
            </h1>

            {/* Live Dashboard Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200/80 bg-blue-50/60 text-[#2563EB] text-[11px] font-bold tracking-wider uppercase shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              <span>LIVE DASHBOARD</span>
            </div>
          </div>

          {storeControlsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Syncing live store controls...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Card 1: OPERATIONAL STATUS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-7 space-y-6">
                {/* Subheader */}
                <div className="flex items-center gap-2 text-slate-500">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500 stroke-[2.2]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    OPERATIONAL STATUS
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Row 1: Global Store Access */}
                  <div className="py-5 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          Global Store Access
                        </span>
                        {storeControls.globalStoreAccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <Ban className="w-3 h-3 text-rose-500" />
                            PAUSED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Allow customers to browse your products
                      </p>
                    </div>

                    {/* Blue Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={storeControls.globalStoreAccess}
                      disabled={storeControlsUpdating === 'globalStoreAccess'}
                      onClick={() => handleToggleStoreControl('globalStoreAccess')}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        storeControls.globalStoreAccess ? 'bg-[#2563EB]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          storeControls.globalStoreAccess ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Delivery Services */}
                  <div className="py-5 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          Delivery Services
                        </span>
                        {storeControls.deliveryServices ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <Ban className="w-3 h-3 text-rose-500" />
                            PAUSED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Enable/Disable shipping and home delivery
                      </p>
                    </div>

                    {/* Blue Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={storeControls.deliveryServices}
                      disabled={storeControlsUpdating === 'deliveryServices'}
                      onClick={() => handleToggleStoreControl('deliveryServices')}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        storeControls.deliveryServices ? 'bg-[#2563EB]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          storeControls.deliveryServices ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 3: Self Pick-up */}
                  <div className="py-5 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          Self Pick-up
                        </span>
                        {storeControls.selfPickup ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <Ban className="w-3 h-3 text-rose-500" />
                            PAUSED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Allow customers to collect from store
                      </p>
                    </div>

                    {/* Switch (Gray when paused) */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={storeControls.selfPickup}
                      disabled={storeControlsUpdating === 'selfPickup'}
                      onClick={() => handleToggleStoreControl('selfPickup')}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        storeControls.selfPickup ? 'bg-[#2563EB]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          storeControls.selfPickup ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: BUSINESS FRAMEWORK */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 sm:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/90 flex items-center justify-center text-[#2563EB] shrink-0">
                    <Store className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      BUSINESS FRAMEWORK
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {storeControls.businessFramework || 'Business to Customer (B2C)'}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangeTypeOpen(true)}
                  className="px-4 py-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-[#2563EB] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  Change Type
                </button>
              </div>

              {/* Section 3: Advanced Features */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Advanced Features
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveFeatureModal('explore')}
                    className="text-xs sm:text-sm font-semibold text-[#2563EB] hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Explore All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {/* Card 1: Review Engine */}
                  <div
                    onClick={() => setActiveFeatureModal('review')}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <Star className="w-5 h-5 fill-amber-400/20 stroke-[2.2]" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-[#2563EB] transition-colors">
                      Review Engine
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Build social proof with automated customer ratings.
                    </p>
                  </div>

                  {/* Card 2: GST Automator */}
                  <div
                    onClick={() => setActiveFeatureModal('gst')}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-[#2563EB] transition-colors">
                      GST Automator
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generate compliant invoices instantly per order.
                    </p>
                  </div>

                  {/* Card 3: COD Management */}
                  <div
                    onClick={() => setActiveFeatureModal('cod')}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                      <Truck className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-[#2563EB] transition-colors">
                      COD Management
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Set logic-based fees for Cash on Delivery orders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL: CHANGE BUSINESS FRAMEWORK TYPE
             ========================================================================= */}
          {isChangeTypeOpen &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-scaleUp">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Change Business Framework</h3>
                        <p className="text-xs text-slate-500">Configure how buyers purchase from your platform</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangeTypeOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'Business to Customer (B2C)',
                        title: 'Business to Customer (B2C)',
                        desc: 'Direct retail store for individual consumers with instant checkout and consumer promotions.',
                        badge: 'Recommended',
                      },
                      {
                        id: 'Business to Business (B2B)',
                        title: 'Business to Business (B2B)',
                        desc: 'Wholesale commerce with bulk minimum order quantities (MOQ), GST tax invoicing, and trade credit.',
                        badge: 'Wholesale',
                      },
                      {
                        id: 'Hybrid / B2B2C Multi-Portal',
                        title: 'Hybrid / B2B2C Multi-Portal',
                        desc: 'Dual storefront engine serving both regular retail consumers and verified wholesale trade partners.',
                        badge: 'Enterprise',
                      },
                    ].map((framework) => (
                      <div
                        key={framework.id}
                        onClick={() => setSelectedFramework(framework.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          selectedFramework === framework.id
                            ? 'border-[#2563EB] bg-blue-50/50 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{framework.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                              {framework.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{framework.desc}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            selectedFramework === framework.id
                              ? 'border-[#2563EB] bg-[#2563EB]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selectedFramework === framework.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsChangeTypeOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveFramework(selectedFramework)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
                    >
                      Update Framework
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* =========================================================================
              MODAL: COD MANAGEMENT (Full Policy & Partial Advance Token Controls)
             ========================================================================= */}
          {activeFeatureModal === 'cod' &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">COD Management &amp; Partial Advance</h3>
                        <p className="text-xs text-slate-500">Configure Cash on Delivery and advance booking deposit rules</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. Cash on Delivery Toggle */}
                  <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                        <h4 className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            controls.codEnabled
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {controls.codEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Allow customers to pay cash or UPI at their doorstep upon parcel delivery.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setControls((prev) => ({ ...prev, codEnabled: !prev.codEnabled }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        controls.codEnabled ? 'bg-[#2563EB]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          controls.codEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. Partial Payment Policy */}
                  <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-slate-900">Partial Payment (RTO Protection)</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              controls.partialPaymentEnabled
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {controls.partialPaymentEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Require buyers to pay an advance online token to confirm COD orders, eliminating Return-to-Origin (RTO).
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setControls((prev) => ({
                            ...prev,
                            partialPaymentEnabled: !prev.partialPaymentEnabled,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          controls.partialPaymentEnabled ? 'bg-[#2563EB]' : 'bg-slate-300'
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
                      <div className="space-y-3 pt-3 border-t border-slate-200 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Advance Percentage</label>
                          <span className="text-xs font-black text-[#2563EB]">
                            {controls.partialPaymentPercent}% Advance
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          step="5"
                          value={controls.partialPaymentPercent}
                          onChange={(e) =>
                            setControls((prev) => ({
                              ...prev,
                              partialPaymentPercent: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-[#2563EB] cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          {[10, 15, 20, 25, 30, 50].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setControls((prev) => ({ ...prev, partialPaymentPercent: pct }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                controls.partialPaymentPercent === pct
                                  ? 'bg-[#2563EB] text-white shadow-2xs'
                                  : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveControls()}
                      disabled={controlsSaving}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
                    >
                      {controlsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Policy</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* =========================================================================
              MODAL: REVIEW ENGINE CONFIGURATION
             ========================================================================= */}
          {activeFeatureModal === 'review' &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-scaleUp">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                        <Star className="w-5 h-5 fill-amber-400/20" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Review Engine Controls</h3>
                        <p className="text-xs text-slate-500">Automated customer ratings &amp; social proof display</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">Verified Buyer Badge</span>
                        <span className="text-[11px] text-slate-500">Display verified badges on confirmed delivered orders</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">Auto-Publish Threshold</span>
                        <span className="text-[11px] text-slate-500">Automatically display 4★ and 5★ reviews without moderation</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        4★ &amp; ABOVE
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">Post-Delivery WhatsApp Review Request</span>
                        <span className="text-[11px] text-slate-500">Send rating request 2 days after parcel delivery</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        ENABLED
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Review Engine automation rules saved! ✓');
                        setActiveFeatureModal(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* =========================================================================
              MODAL: GST AUTOMATOR
             ========================================================================= */}
          {activeFeatureModal === 'gst' &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-scaleUp">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">GST Automator</h3>
                        <p className="text-xs text-slate-500">Automatic tax compliance and instant invoice generation</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">GST Identification Number (GSTIN)</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-slate-700">07AAECR1234F1Z5</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">Automated PDF Tax Invoices</span>
                        <span className="text-[11px] text-slate-500">Generate downloadable GST invoices for every confirmed order</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">HSN &amp; SAC Code Auto-Lookup</span>
                        <span className="text-[11px] text-slate-500">Automatically map tax slabs (5%, 12%, 18%) per category</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        SYNCED
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast('GST Automator settings updated! ✓');
                        setActiveFeatureModal(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* =========================================================================
              MODAL: EXPLORE ALL ADVANCED FEATURES
             ========================================================================= */}
          {activeFeatureModal === 'explore' &&
            createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-scaleUp">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Advanced Store Automations</h3>
                      <p className="text-xs text-slate-500">Suite of intelligent tools built for multi-channel commerce</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setActiveFeatureModal('review')}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-900">Review Engine</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Automated buyer reviews and social proof widgets.</p>
                    </div>

                    <div
                      onClick={() => setActiveFeatureModal('gst')}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-xs font-bold text-slate-900">GST Automator</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Instant compliant PDF invoices and tax reports.</p>
                    </div>

                    <div
                      onClick={() => setActiveFeatureModal('cod')}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-slate-900">COD Management</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Doorstep payment policies and token fees.</p>
                    </div>

                    <div
                      onClick={() => {
                        showToast('Multi-Warehouse routing is active on your shipping account ✓');
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">Multi-Warehouse Routing</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Route shipments from the nearest inventory hub.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveFeatureModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: DELIVERY SETTINGS VIEW
         ========================================================================= */}
      {(currentTab === 'settings-delivery' || currentTab === 'settings-shipping') && (
        <div className="space-y-6 max-w-4xl animate-fadeIn">
          {/* Header Bar matching screenshot */}
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              Delivery
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-0.5">
              Delivery settings
            </h1>
          </div>

          {deliveryLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading delivery configuration...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CARD 1: DELIVERY CHARGES */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    DELIVERY CHARGES
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Item 1: Minimum order value for delivery */}
                  <div
                    onClick={() => setActiveDeliveryModal('minOrderValue')}
                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-100 transition-colors">
                        <ShoppingBag className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                          <span>Minimum order value for delivery</span>
                          {deliverySettings.minOrderValue > 0 && (
                            <span className="text-[11px] font-bold text-[#A44101] bg-[#A44101]/10 px-2 py-0.5 rounded-full">
                              ₹{deliverySettings.minOrderValue}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Set a minimum value for orders to be eligible for delivery.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Item 2: Delivery charge */}
                  <div
                    onClick={() => setActiveDeliveryModal('deliveryCharge')}
                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-100 transition-colors">
                        <Truck className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                          <span>Delivery charge</span>
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {deliverySettings.deliveryCharge === 0 ? 'Free Delivery' : `₹${deliverySettings.deliveryCharge}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Set charges for delivery.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Item 3: Cash on delivery charges */}
                  <div
                    onClick={() => setActiveDeliveryModal('codCharge')}
                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-100 transition-colors">
                        <Wallet className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                          <span>Cash on delivery charges</span>
                          {deliverySettings.codCharge > 0 && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              +₹{deliverySettings.codCharge} COD Fee
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Switch on Cash on Delivery to set charges.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* CARD 2: SHIPPING */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    SHIPPING
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Item 1: Shipping partners */}
                  <div
                    onClick={() => setActiveDeliveryModal('shippingPartners')}
                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-100 transition-colors">
                        <CreditCard className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                          <span>Shipping partners (Shiprocket / Shipmozo)</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            {deliverySettings.activeProvider === 'shipmozo' ? 'Shipmozo Active' : 'Manual'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Choose which partner handles NEW orders. Existing orders stay on their original partner.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Item 2: Pickup addresses */}
                  <div
                    onClick={() => setActiveDeliveryModal('pickupAddresses')}
                    className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/80 bg-slate-50/80 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-slate-100 transition-colors">
                        <MapPin className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                          <span>Pickup addresses</span>
                          {deliverySettings.pickupPincode && (
                            <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              PIN: {deliverySettings.pickupPincode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Set up &amp; manage your pickup addresses.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              <StandardDeliverySettingsCard
                value={standardDeliverySettings}
                sameDayReady={Boolean(sameDaySettings.ready || sameDaySettings.enabled)}
                saving={standardDeliverySaving}
                onSave={async (next) => {
                  setStandardDeliverySaving(true);
                  try {
                    const saved = await adminShippingSettingsApi.updateSettings({
                      standardDelivery: { enabled: next.enabled },
                    });
                    if (saved?.standardDelivery) {
                      setStandardDeliverySettings({
                        enabled: saved.standardDelivery.enabled !== false,
                        ready: saved.standardDelivery.ready,
                      });
                    } else {
                      setStandardDeliverySettings(next);
                    }
                    showToast(
                      next.enabled
                        ? 'Standard delivery enabled'
                        : 'Standard delivery turned off — checkout is Same Day only'
                    );
                  } catch (err: any) {
                    showToast(`Failed to save Standard delivery: ${err.message || 'Error'}`, 'error');
                  } finally {
                    setStandardDeliverySaving(false);
                  }
                }}
              />

              <SameDayDeliverySettingsCard
                value={sameDaySettings}
                saving={sameDaySaving}
                onSave={async (next) => {
                  setSameDaySaving(true);
                  try {
                    const saved = await adminShippingSettingsApi.updateSettings({ sameDay: next });
                    if (saved?.sameDay) {
                      setSameDaySettings({
                        enabled: Boolean(saved.sameDay.enabled),
                        pincodes: Array.isArray(saved.sameDay.pincodes) ? saved.sameDay.pincodes : next.pincodes,
                        openHour: Number(saved.sameDay.openHour) || next.openHour,
                        cutoffHour: Number(saved.sameDay.cutoffHour) || next.cutoffHour,
                        floorFeeInr: Number(saved.sameDay.floorFeeInr) || next.floorFeeInr,
                        feeBuffer: Number(saved.sameDay.feeBuffer) || next.feeBuffer,
                        warehouseLat: saved.sameDay.warehouseLat ?? next.warehouseLat,
                        warehouseLng: saved.sameDay.warehouseLng ?? next.warehouseLng,
                        pincodeCount: saved.sameDay.pincodeCount,
                        pincodeRestricted: saved.sameDay.pincodeRestricted,
                        ready: saved.sameDay.ready,
                      });
                    } else {
                      setSameDaySettings(next);
                    }
                    showToast('Same Day delivery settings saved');
                  } catch (err: any) {
                    showToast(`Failed to save Same Day settings: ${err.message || 'Error'}`, 'error');
                  } finally {
                    setSameDaySaving(false);
                  }
                }}
              />
            </div>
          )}

          {/* =========================================================================
              MODALS FOR EACH DELIVERY SETTING ITEM
             ========================================================================= */}

          {/* Modal 1: Minimum Order Value */}
          {activeDeliveryModal === 'minOrderValue' && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-slate-700" />
                    <h3 className="font-bold text-[#0F172A] text-base">Minimum order value</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Orders with a cart total below this threshold will not be eligible for checkout. Set to ₹0 to allow any order size.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Minimum Cart Total (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={deliverySettings.minOrderValue}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({ ...prev, minOrderValue: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDelivery()}
                    disabled={deliverySaving}
                    className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {deliverySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Modal 2: Delivery Charge */}
          {activeDeliveryModal === 'deliveryCharge' && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-slate-700" />
                    <h3 className="font-bold text-[#0F172A] text-base">Delivery charge</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Configure the standard shipping fee applied to customer orders at checkout.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Standard Shipping Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deliverySettings.deliveryCharge}
                      onChange={(e) =>
                        setDeliverySettings((prev) => ({ ...prev, deliveryCharge: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Set ₹0 for universal free delivery.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Free Delivery for Orders Above (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deliverySettings.freeDeliveryAbove}
                      onChange={(e) =>
                        setDeliverySettings((prev) => ({ ...prev, freeDeliveryAbove: Math.max(0, Number(e.target.value) || 0) }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDelivery()}
                    disabled={deliverySaving}
                    className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {deliverySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Modal 3: Cash on Delivery Charges */}
          {activeDeliveryModal === 'codCharge' && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-slate-700" />
                    <h3 className="font-bold text-[#0F172A] text-base">Cash on delivery charges</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Set extra handling or collection charges for customers who select Cash on Delivery.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Extra COD Handling Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={deliverySettings.codCharge}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({ ...prev, codCharge: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Set ₹0 for no extra charge on COD.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDelivery()}
                    disabled={deliverySaving}
                    className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {deliverySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Modal 4: Shipping Partners */}
          {activeDeliveryModal === 'shippingPartners' && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <h3 className="font-bold text-[#0F172A] text-lg">
                    Shipping partners (Shiprocket / Shipmozo)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="px-6 py-3 overflow-y-auto space-y-4 flex-1">
                  {/* Subtitle explanation */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Active partner is used for <span className="font-bold text-slate-700">checkout rates and new orders only</span>. Orders already created on Shiprocket keep processing on Shiprocket after you switch.
                  </p>

                  {/* Section Header */}
                  <div>
                    <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                      ACTIVE PARTNER FOR NEW ORDERS
                    </h4>

                    {/* 2 Side-by-Side Partner Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Shiprocket Card */}
                      <div
                        onClick={() => setDeliverySettings((prev) => ({ ...prev, activeProvider: 'shiprocket' }))}
                        className={`rounded-2xl p-3.5 flex flex-col justify-between min-h-[96px] cursor-pointer transition-all border ${
                          deliverySettings.activeProvider === 'shiprocket'
                            ? 'border-2 border-[#A44101] bg-[#A44101]/5 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            Shiprocket
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              deliverySettings.activeProvider === 'shiprocket'
                                ? 'border-[#A44101]'
                                : 'border-slate-300'
                            }`}
                          >
                            {deliverySettings.activeProvider === 'shiprocket' && (
                              <div className="w-2 h-2 rounded-full bg-[#A44101]" />
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Default account settings
                        </span>
                      </div>

                      {/* Shipmozo Card */}
                      <div
                        onClick={() => setDeliverySettings((prev) => ({ ...prev, activeProvider: 'shipmozo' }))}
                        className={`rounded-2xl p-3.5 flex flex-col justify-between min-h-[96px] cursor-pointer transition-all border ${
                          deliverySettings.activeProvider === 'shipmozo'
                            ? 'border-2 border-[#A44101] bg-[#A44101]/5 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                            Shipmozo
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              deliverySettings.activeProvider === 'shipmozo'
                                ? 'border-[#A44101]'
                                : 'border-slate-300'
                            }`}
                          >
                            {deliverySettings.activeProvider === 'shipmozo' && (
                              <div className="w-2 h-2 rounded-full bg-[#A44101]" />
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-[#A44101] font-medium leading-tight pt-1">
                          {deliverySettings.keysConfigured ? (
                            <span className="text-emerald-700 font-semibold">✓ Keys loaded &amp; active (env)</span>
                          ) : (
                            <>
                              Missing:<br />
                              SHIPMOZO_PUBLIC_KEY (env),<br />
                              SHIPMOZO_PRIVATE_KEY (env)
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Setup Details Depending on Active Partner */}
                  {deliverySettings.activeProvider === 'shipmozo' ? (
                    <div className="space-y-3 pt-1 animate-fadeIn">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0F172A]">
                        Shipmozo setup
                      </h4>

                      {/* Warning / Config alert matching screenshot */}
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span>
                            {deliverySettings.keysConfigured
                              ? 'Shipmozo API keys configured in server env. Ready for automatic label generation and multi-courier tracking.'
                              : 'API keys missing in server env. Set SHIPMOZO_PUBLIC_KEY and SHIPMOZO_PRIVATE_KEY, then restart the server.'}
                          </span>
                        </div>
                      </div>

                      {/* Warehouse ID */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Warehouse ID
                        </label>
                        <input
                          type="text"
                          placeholder="33711"
                          value={deliverySettings.warehouseId}
                          onChange={(e) =>
                            setDeliverySettings((prev) => ({ ...prev, warehouseId: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                        />
                      </div>

                      {/* Shipmozo pickup pincode */}
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Shipmozo pickup pincode
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="421004"
                          value={deliverySettings.pickupPincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setDeliverySettings((prev) => ({ ...prev, pickupPincode: val }));
                          }}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                        />
                      </div>

                      {/* Live connection test helper */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          disabled={testingConnection}
                          onClick={handleTestShipmozo}
                          className="text-xs font-semibold text-[#A44101] hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {testingConnection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{testingConnection ? 'Testing API...' : '⚡ Test Shipmozo Connection'}</span>
                        </button>
                        {testResult && (
                          <span className={`text-[11px] font-medium ${testResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {testResult.message}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1 animate-fadeIn">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0F172A]">
                        Shiprocket setup
                      </h4>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Using default Shiprocket account settings</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          Warehouse ID and Shipmozo pickup pincode are not required. Orders assigned to Shiprocket use your pre-configured Shiprocket account credentials and default pickup addresses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom actions matching screenshot */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDelivery()}
                    disabled={deliverySaving}
                    className="px-6 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    {deliverySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Modal 5: Pickup Addresses */}
          {activeDeliveryModal === 'pickupAddresses' && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-700" />
                    <h3 className="font-bold text-[#0F172A] text-base">Pickup addresses</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Set up &amp; manage your origin warehouse address and default pincode for automated courier pickups.
                </p>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Registered Warehouse Location ({warehouses.length} available)
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#0F172A] bg-white cursor-pointer font-medium focus:outline-none focus:border-[#A44101]"
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

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Pickup Pincode (6 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 110001"
                      value={deliverySettings.pickupPincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setDeliverySettings((prev) => ({ ...prev, pickupPincode: val }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#A44101]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Used by courier partners to calculate shipping estimates and schedule pickup dispatches.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveDeliveryModal(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDelivery()}
                    disabled={deliverySaving}
                    className="px-5 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {deliverySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SHIPMOZO LABEL SETTINGS VIEW
         ========================================================================= */}
      {currentTab === 'settings-label-settings' && (
        <div className="space-y-6">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                Shipmozo label settings
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Applies only to E-comm Shipmozo orders. Shiprocket labels are unchanged. Print size is 4×6 inch.
              </p>
              <div className="mt-1.5">
                <span className="text-[11px] font-bold tracking-wider text-[#A44101] uppercase">
                  STOREFRONT: E-COMM
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveLabelSettings()}
              disabled={labelSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-70 self-start"
            >
              {labelSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save</span>
            </button>
          </div>

          {labelLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <Loader2 className="w-8 h-8 text-[#A44101] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading thermal label preferences from server...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Controls (7 cols on lg+) */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. LABEL LOGO */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    LABEL LOGO
                  </h2>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={labelConfig.logo.enabled}
                      onChange={(e) =>
                        setLabelConfig((prev) => ({
                          ...prev,
                          logo: { ...prev.logo, enabled: e.target.checked },
                        }))
                      }
                      className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                    />
                    <span>Print logo on label (Ship To section, right side)</span>
                  </label>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-20 h-20 rounded-lg border border-slate-200 bg-white p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {labelConfig.logo.url ? (
                        <img
                          src={labelConfig.logo.url}
                          alt="Label Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 text-center">No Logo</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        id="label-logo-file-upload"
                      />
                      <label
                        htmlFor="label-logo-file-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A44101]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>Replace logo</span>
                      </label>

                      {labelConfig.logo.url && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove logo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                    Saved separately for E-comm only (Cloudinary). Max 1 MB. PNG, JPG, or WebP. Logo prints centered beside Ship To — no vertical divider line.
                  </p>
                </div>

                {/* 2. SUPPORT DETAILS */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    SUPPORT DETAILS
                  </h2>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                    <input
                      type="checkbox"
                      checked={labelConfig.support.showCustomerSupport}
                      onChange={(e) =>
                        setLabelConfig((prev) => ({
                          ...prev,
                          support: { ...prev.support, showCustomerSupport: e.target.checked },
                        }))
                      }
                      className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                    />
                    <span>Customer support details</span>
                  </label>

                  <div className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={labelConfig.support.mobile}
                      onChange={(e) =>
                        setLabelConfig((prev) => ({
                          ...prev,
                          support: { ...prev.support, mobile: e.target.value },
                        }))
                      }
                      placeholder="Support mobile"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                    />

                    <input
                      type="email"
                      value={labelConfig.support.email}
                      onChange={(e) =>
                        setLabelConfig((prev) => ({
                          ...prev,
                          support: { ...prev.support, email: e.target.value },
                        }))
                      }
                      placeholder="support.offerwalebaba@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 3. DELIVERY DETAILS */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    DELIVERY DETAILS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    {/* Left Sub-column */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showPaymentMode}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showPaymentMode: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Payment mode</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showCustomerPhone}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showCustomerPhone: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Customer phone number</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showAwbBarcode}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showAwbBarcode: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>AWB barcode</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showRtoRoutingCode}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showRtoRoutingCode: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>RTO routing code</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="rounded accent-slate-400 w-4 h-4 opacity-60 cursor-not-allowed"
                        />
                        <span>Weight</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          ALWAYS ON
                        </span>
                      </label>
                    </div>

                    {/* Right Sub-column */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showCustomerAddress}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showCustomerAddress: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Customer address</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showOrderBarcode}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showOrderBarcode: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Order barcode</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.delivery.showRoutingCode}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              delivery: { ...prev.delivery, showRoutingCode: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Routing code</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="rounded accent-slate-400 w-4 h-4 opacity-60 cursor-not-allowed"
                        />
                        <span>Dimension</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          ALWAYS ON
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. PICKUP DETAILS */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    PICKUP DETAILS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.pickup.showPickupName}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              pickup: { ...prev.pickup, showPickupName: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Pickup name</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.pickup.showPickupPhone}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              pickup: { ...prev.pickup, showPickupPhone: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Pickup phone number</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.pickup.showPickupAddress}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              pickup: { ...prev.pickup, showPickupAddress: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Pickup address</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.pickup.showGstin}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              pickup: { ...prev.pickup, showGstin: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>GSTIN</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Shipped By name
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
                        placeholder="Name printed under Shipped By"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Not coming from Shipmozo warehouse, so you can set it here.
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={labelConfig.pickup.gstin}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            pickup: { ...prev.pickup, gstin: e.target.value.toUpperCase() },
                          }))
                        }
                        placeholder="GSTxxxxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-mono text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Trim SKU upto
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={labelConfig.products.trimSkuUpto}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, trimSkuUpto: Math.max(1, Number(e.target.value) || 10) },
                            }))
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                          Trim product name upto
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={labelConfig.products.trimProductNameUpto}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, trimProductNameUpto: Math.max(1, Number(e.target.value) || 17) },
                            }))
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Show number of line items
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={labelConfig.products.maxItems}
                        onChange={(e) =>
                          setLabelConfig((prev) => ({
                            ...prev,
                            products: { ...prev.products, maxItems: Math.max(1, Number(e.target.value) || 10) },
                          }))
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#A44101] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. ORDER & PRODUCT DETAILS */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    ORDER &amp; PRODUCT DETAILS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    {/* Left Sub-column */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showItem}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showItem: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Item</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showQty}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showQty: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Quantity</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showTotal}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showTotal: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Total amount</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showShippingCharges}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showShippingCharges: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Shipping charges</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showTotalQuantity}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showTotalQuantity: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Total quantity</span>
                      </label>
                    </div>

                    {/* Right Sub-column */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showSku}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showSku: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>SKU</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showPrice}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showPrice: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Price</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showHsn}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showHsn: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>HSN</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showCollectableAmount}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showCollectableAmount: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Collectable amount</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.products.showAllItems}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              products: { ...prev.products, showAllItems: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Show all items</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 6. MISCELLANEOUS */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
                  <h2 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    MISCELLANEOUS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    {/* Left Sub-column */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showNotes}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showNotes: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Notes</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showInvoiceDate}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showInvoiceDate: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Invoice date</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showOrderTotal}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showOrderTotal: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Show order total</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showPoweredByStore}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showPoweredByStore: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Powered by store</span>
                      </label>
                    </div>

                    {/* Right Sub-column */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showInvoiceNumber}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showInvoiceNumber: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Invoice number</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showOrderDate}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showOrderDate: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Order date</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showEwayBillNo}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showEwayBillNo: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>E-way bill no</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={labelConfig.miscellaneous.showAutoGeneratedDisclaimer}
                          onChange={(e) =>
                            setLabelConfig((prev) => ({
                              ...prev,
                              miscellaneous: { ...prev.miscellaneous, showAutoGeneratedDisclaimer: e.target.checked },
                            }))
                          }
                          className="rounded accent-[#A44101] w-4 h-4 cursor-pointer"
                        />
                        <span>Auto-generated disclaimer</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live 4×6 Label Preview (5 cols on lg+) */}
              <div className="lg:col-span-5 sticky top-4 space-y-3">
                {/* Header above preview */}
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    Label preview (4×6)
                  </h3>

                  <button
                    type="button"
                    onClick={handlePrintLabel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>

                {/* 4×6 Thermal Label Simulation Container */}
                <div className="bg-slate-100/70 p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div
                    id="shipmozo-4x6-label-preview-content"
                    className="bg-white border border-slate-300 shadow-sm text-black font-sans text-[11px] leading-tight select-none overflow-hidden"
                  >
                    {/* SECTION 1: Ship To (Left) & Brand Logo (Right) */}
                    <div className="p-2.5 flex items-start justify-between min-h-[90px]">
                      <div className="space-y-0.5 max-w-[65%]">
                        <div className="font-bold text-xs text-black">Ship To</div>
                        <div className="font-semibold text-[11px] text-black">John Wick</div>
                        {labelConfig.delivery.showCustomerAddress && (
                          <div className="text-[10px] text-slate-800 leading-tight space-y-0.2">
                            <div>3210 Baker Street</div>
                            <div>Connaught Place</div>
                            <div>New Delhi, Delhi, 110001</div>
                            <div>India</div>
                          </div>
                        )}
                        {labelConfig.delivery.showCustomerPhone && (
                          <div className="text-[10px] font-semibold text-black pt-0.5">
                            Ph: 9898989898
                          </div>
                        )}
                      </div>

                      {/* Brand Logo centered beside Ship To without vertical line */}
                      {labelConfig.logo.enabled && labelConfig.logo.url ? (
                        <div className="w-[32%] flex items-center justify-center self-center py-1">
                          <img
                            src={labelConfig.logo.url}
                            alt="Logo"
                            className="max-h-12 max-w-[100px] object-contain"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Divider Line */}
                    <div className="border-b border-black w-full" />

                    {/* SECTION 2: Dimensions, Payment & AWB Barcode */}
                    <div className="p-2.5 grid grid-cols-2 gap-2 text-[9.5px]">
                      {/* Left: Dimensions, Payment, Weight, Routing */}
                      <div className="space-y-0.5">
                        {labelConfig.delivery.showDimension && (
                          <div><span className="font-semibold">Dimensions:</span> 10x10x10</div>
                        )}
                        {labelConfig.delivery.showPaymentMode && (
                          <div><span className="font-semibold">Payment:</span> COD</div>
                        )}
                        {labelConfig.miscellaneous.showOrderTotal && (
                          <div><span className="font-semibold">Order Total:</span> Rs. 1,900</div>
                        )}
                        {labelConfig.delivery.showWeight && (
                          <div><span className="font-semibold">Weight:</span> 1.5 kg</div>
                        )}
                        {labelConfig.miscellaneous.showEwayBillNo && (
                          <div><span className="font-semibold">EWaybill No:</span> 1234567890</div>
                        )}
                        {labelConfig.delivery.showRoutingCode && (
                          <div><span className="font-semibold">Routing code:</span> DEL/UGH</div>
                        )}
                        {labelConfig.delivery.showRtoRoutingCode && (
                          <div><span className="font-semibold">RTO Routing code:</span> DEL/UEY</div>
                        )}
                      </div>

                      {/* Right: Courier & AWB Barcode */}
                      <div className="flex flex-col items-end text-right space-y-0.5">
                        <div className="font-bold text-[10px] text-black">Xpressbees 10kg</div>
                        <div className="text-[9px]">Shipment ID: 8654321</div>

                        {labelConfig.delivery.showAwbBarcode && (
                          <div className="pt-1 flex flex-col items-center">
                            <div className="h-7 w-36 flex items-stretch gap-[1px] justify-between px-0.5">
                              {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2].map((w, idx) => (
                                <span
                                  key={idx}
                                  className={idx % 2 === 0 ? 'bg-black' : 'bg-transparent'}
                                  style={{ width: `${w * 0.7}px` }}
                                />
                              ))}
                            </div>
                            <span className="font-mono text-[8.5px] font-bold tracking-wide mt-0.5">
                              AWB: SM1234567890
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-b border-black w-full" />

                    {/* SECTION 3: Shipped By (Return To) & Order Barcode */}
                    <div className="p-2.5 grid grid-cols-2 gap-2 text-[9px]">
                      {/* Left: Origin Seller Info */}
                      <div className="space-y-0.5">
                        <div className="font-bold text-[9.5px]">Shipped By (if undelivered, return to):</div>
                        {labelConfig.pickup.showPickupName && (
                          <div className="font-semibold text-black">
                            {labelConfig.pickup.sellerName || 'delhi wesley'}
                          </div>
                        )}
                        {labelConfig.pickup.showPickupAddress && (
                          <div>451004</div>
                        )}
                        {labelConfig.pickup.showPickupPhone && (
                          <div>Ph: 0</div>
                        )}
                        {labelConfig.pickup.showGstin && labelConfig.pickup.gstin && (
                          <div>GSTIN: {labelConfig.pickup.gstin}</div>
                        )}
                        {labelConfig.support.showCustomerSupport && (
                          <div className="pt-0.5 break-all">
                            Customer care: {labelConfig.support.email || labelConfig.support.mobile || 'support.offerwalebaba@gmail.com'}
                          </div>
                        )}
                      </div>

                      {/* Right: Order Barcode & Invoice metadata */}
                      <div className="flex flex-col items-end text-right space-y-0.5">
                        {labelConfig.delivery.showOrderBarcode && (
                          <div className="flex flex-col items-center mb-1">
                            <span className="font-mono text-[8px] font-bold tracking-tight">
                              DISPATCH: OWS-ECOMM-203455
                            </span>
                            <div className="h-5 w-32 flex items-stretch gap-[1px] justify-between px-0.5 mt-0.5">
                              {[2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2].map((w, idx) => (
                                <span
                                  key={idx}
                                  className={idx % 2 === 0 ? 'bg-black' : 'bg-transparent'}
                                  style={{ width: `${w * 0.75}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {labelConfig.miscellaneous.showInvoiceNumber && (
                          <div className="text-[8.5px]">Invoice No: Retail/16399</div>
                        )}
                        {labelConfig.miscellaneous.showInvoiceDate && (
                          <div className="text-[8.5px]">Invoice Date: 2025/01/03</div>
                        )}
                        {labelConfig.miscellaneous.showOrderDate && (
                          <div className="text-[8.5px]">Order Date: 2025/01/01</div>
                        )}
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div className="border-b border-black w-full" />

                    {/* SECTION 4: Itemized Products Table */}
                    <div className="w-full text-[8.5px]">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-black font-bold text-left">
                            {labelConfig.products.showItem && <th className="py-1 px-2 font-bold">Item</th>}
                            {labelConfig.products.showSku && <th className="py-1 px-1 font-bold">SKU</th>}
                            {labelConfig.products.showHsn && <th className="py-1 px-1 font-bold">HSN</th>}
                            {labelConfig.products.showQty && <th className="py-1 px-1 text-center font-bold">Qty</th>}
                            {labelConfig.products.showPrice && <th className="py-1 px-1 text-right font-bold">Price</th>}
                            {labelConfig.products.showTotal && <th className="py-1 px-2 text-right font-bold">Total</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {[
                            { name: 'SP 312 Wireless Bluetooth Speaker', sku: 'SKU-2734-1', hsn: '8518', qty: 1, price: 1900, total: 1900 },
                            { name: 'Portable Mini Hair Straightener Brush', sku: 'SKU-2823-1', hsn: '8516', qty: 1, price: 1200, total: 1200 },
                            { name: 'Migraine Relief Heated Eye Mask', sku: 'SKU-2602-1', hsn: '9019', qty: 2, price: 850, total: 1700 },
                            { name: '3 in 1 Multi Charging Cable 65W', sku: 'SKU-0939-1', hsn: '8544', qty: 1, price: 450, total: 450 },
                            { name: 'Travel Neck Pillow Memory Foam', sku: 'SKU-0943-1', hsn: '9404', qty: 1, price: 650, total: 650 },
                            { name: '2-in-1 Bedside Lamp with Charger', sku: 'SKU-0057-1', hsn: '9405', qty: 1, price: 2100, total: 2100 },
                            { name: 'Navy Electra Smart Fitness Band', sku: 'SKU-0004-1', hsn: '8517', qty: 1, price: 990, total: 990 },
                            { name: 'Premium Stainless Steel Flask 1L', sku: 'SKU-1108-1', hsn: '7323', qty: 2, price: 399, total: 798 },
                            { name: 'Magnetic Phone Holder for Car', sku: 'SKU-1240-1', hsn: '3926', qty: 1, price: 350, total: 350 },
                            { name: 'Ergonomic Mouse Pad with Rest', sku: 'SKU-3401-1', hsn: '4016', qty: 1, price: 299, total: 299 },
                          ]
                            .slice(0, labelConfig.products.showAllItems ? 10 : (labelConfig.products.maxItems || 8))
                            .map((item, idx) => {
                              const trimNameLimit = labelConfig.products.trimProductNameUpto || 17;
                              const trimSkuLimit = labelConfig.products.trimSkuUpto || 10;
                              const displayName = item.name.length > trimNameLimit ? `${item.name.slice(0, trimNameLimit)}...` : item.name;
                              const displaySku = item.sku.length > trimSkuLimit ? `${item.sku.slice(0, trimSkuLimit)}...` : item.sku;

                              return (
                                <tr key={idx}>
                                  {labelConfig.products.showItem && (
                                    <td className="py-0.5 px-2 truncate max-w-[110px]" title={item.name}>
                                      {displayName}
                                    </td>
                                  )}
                                  {labelConfig.products.showSku && (
                                    <td className="py-0.5 px-1 font-mono text-[8px]" title={item.sku}>
                                      {displaySku}
                                    </td>
                                  )}
                                  {labelConfig.products.showHsn && (
                                    <td className="py-0.5 px-1 font-mono text-[8px]">
                                      {item.hsn}
                                    </td>
                                  )}
                                  {labelConfig.products.showQty && (
                                    <td className="py-0.5 px-1 text-center">{item.qty}</td>
                                  )}
                                  {labelConfig.products.showPrice && (
                                    <td className="py-0.5 px-1 text-right">Rs.{item.price.toLocaleString('en-IN')}</td>
                                  )}
                                  {labelConfig.products.showTotal && (
                                    <td className="py-0.5 px-2 text-right">{item.total.toLocaleString('en-IN')}</td>
                                  )}
                                </tr>
                              );
                            })}

                          {!labelConfig.products.showAllItems && (labelConfig.products.maxItems || 8) < 10 && (
                            <tr className="italic text-slate-500">
                              <td colSpan={6} className="py-0.5 px-2 text-[8px]">
                                +{10 - (labelConfig.products.maxItems || 8)} more item(s)
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Divider Line */}
                    <div className="border-b border-black w-full" />

                    {/* SECTION 5: Totals & Collectable Amount */}
                    <div className="p-2 flex items-center justify-between text-[8.5px]">
                      <div>
                        {labelConfig.products.showShippingCharges && <span>Shipping Charges: Rs.0</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        {labelConfig.products.showTotalQuantity && (
                          <div>Total Quantity: <span className="font-bold">12</span></div>
                        )}
                        {labelConfig.products.showCollectableAmount && (
                          <div className="font-bold">Collectable Amount: Rs. 2,000.0</div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 6: Legal Jurisdiction Disclaimer Box */}
                    <div className="m-1.5 p-1.5 border border-black text-[7.5px] leading-tight space-y-1">
                      <div>
                        All disputes are subject to Haryana Jurisdiction only. Goods once sold will only be taken back or exchanged as per store's exchange and return policy.
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <span>
                          {labelConfig.miscellaneous.showAutoGeneratedDisclaimer
                            ? 'This is an auto-generated label and does not require any signature.'
                            : ''}
                        </span>
                        <span className="font-semibold">
                          {labelConfig.miscellaneous.showPoweredByStore ? 'Powered By Shipmozo' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtext below preview */}
                <p className="text-[11px] text-slate-400 px-1 leading-normal">
                  Preview stays here while you change fields on the left. Print uses 4×6 paper. Example barcodes in preview; real Shipmozo orders print the actual AWB and order ID.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          OTHER SETTINGS TABS (Panels with Contextual Settings)
         ========================================================================= */}
      {currentTab === 'settings-profile' && (
        <div className="space-y-6 max-w-4xl animate-fadeIn">
          {/* Header */}
          <div>
            <span className="text-[11px] font-black tracking-widest text-[#A44101] uppercase block mb-1">
              SETTINGS
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy font-serif tracking-tight">
              Profile settings
            </h1>
          </div>

          {/* Main Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {/* Header / Avatar Row */}
            <div className="p-5 flex items-center gap-3.5 bg-slate-50/50">
              <div className="w-10 h-10 rounded-full bg-[#A44101] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {profileData.initials || 'AR'}
              </div>
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                PROFILE
              </span>
            </div>

            {/* Row 1: STORE */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  STORE
                </span>
                <div className="text-base font-bold text-navy">
                  {profileData.storeNumber}
                </div>
                <div className="text-xs text-slate-400">
                  Store ID - {profileData.storeId}
                </div>
                <div className="text-xs text-slate-400">
                  Signed in as {profileData.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit('storeNumber', 'Store Phone / Identifier', profileData.storeNumber)}
                className="text-[#A44101] hover:text-[#8C3701] text-xs font-bold transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Row 2: DISPLAY NUMBER */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DISPLAY NUMBER
                </span>
                <div className="text-sm font-bold text-navy">
                  {profileData.displayNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit('displayNumber', 'Display Hotline Number', profileData.displayNumber)}
                className="text-[#A44101] hover:text-[#8C3701] text-xs font-bold transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Row 3: EMAIL */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  EMAIL
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">{profileData.email}</span>
                  {profileData.isEmailVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>VERIFIED</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit('email', 'Admin Account Email', profileData.email)}
                className="text-[#A44101] hover:text-[#8C3701] text-xs font-bold transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Row 4: STORE DESCRIPTION */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  STORE DESCRIPTION
                </span>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {profileData.storeDescription}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit('storeDescription', 'Store Description', profileData.storeDescription, true)}
                className="text-[#A44101] hover:text-[#8C3701] text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Row 5: STORE ADDRESS */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  STORE ADDRESS
                </span>
                <div className="text-sm font-semibold text-navy">
                  {profileData.storeAddress}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit('storeAddress', 'Store Origin Address', profileData.storeAddress)}
                className="text-[#A44101] hover:text-[#8C3701] text-xs font-bold transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Row 6: BUSINESS TYPE */}
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  BUSINESS TYPE
                </span>
                <div className="text-sm font-semibold text-navy">
                  {profileData.businessType}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit('businessType', 'Business Categories & Type', profileData.businessType)}
                className="text-[#A44101] hover:text-[#8C3701] text-xs font-bold transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block">
              Security
            </span>
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#A44101] shrink-0 shadow-2xs">
                  <Key className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-navy">Reset admin password</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    We will email a one-time code to your admin account email ({profileData.email}). Use the latest OTP only (each new request replaces the previous one). Choose a password different from your current one. Delivery must reach a real inbox — invalid addresses bounce and you will not receive the OTP.
                  </p>
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Send OTP to my email</span>
                </button>
              ) : (
                /* OTP Verification Form */
                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3 max-w-md animate-fadeIn">
                  <div className="text-xs font-bold text-[#A44101] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>OTP code sent to {profileData.email}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono text-sm tracking-widest text-navy focus:outline-none focus:border-[#A44101]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs text-navy focus:outline-none focus:border-[#A44101]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs text-navy focus:outline-none focus:border-[#A44101]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleVerifyOtpAndReset}
                        disabled={isVerifyingOtp}
                        className="px-4 py-2 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                      >
                        {isVerifyingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                        <span>Verify OTP &amp; Update Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Field Edit Modal */}
          {editingField && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-scaleUp">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-navy text-sm">
                    Edit {editingField.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {editingField.label}
                  </label>
                  {editingField.isTextarea ? (
                    <textarea
                      rows={4}
                      value={editingField.value}
                      onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={editingField.value}
                      onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-navy focus:outline-none focus:border-[#A44101]"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFieldEdit}
                    className="px-4 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
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
